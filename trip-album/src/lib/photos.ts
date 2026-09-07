import { supabase, PHOTOS_BUCKET } from "./supabase";
import { PHOTO_COLUMNS, type Photo } from "./types";
import { mediaTypeOf, safeFileName } from "./format";
import { perceptualHash } from "./hash";
import type { FileMeta } from "./groups";

export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Photo[];
}

export async function setFavorite(id: string, value: boolean) {
  const { error } = await supabase
    .from("photos")
    .update({ is_favorite: value })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Supabase storage rejects anything larger than this. Files are uploaded exactly
 * as they came off the camera, so we never shrink one to fit: we say so instead.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export class TooLargeError extends Error {
  constructor() {
    super("הקובץ גדול מ‑50MB, מעבר למה שהאחסון מאפשר");
    this.name = "TooLargeError";
  }
}

export class NetworkError extends Error {
  constructor(message = "החיבור לאינטרנט נותק") {
    super(message);
    this.name = "NetworkError";
  }
}

/** supabase-js surfaces browser network failures as a generic "Failed to fetch". */
function isNetworkFailure(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolve once the browser reports it is online again (or immediately). */
function waitForOnline(timeoutMs = 60_000) {
  if (typeof navigator === "undefined" || navigator.onLine) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener("online", done);
      resolve();
    };
    window.addEventListener("online", done);
    setTimeout(done, timeoutMs);
  });
}

/** Retry a step on network failures with backoff; other errors are thrown immediately. */
async function withRetry<T>(step: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      await waitForOnline();
      return await step();
    } catch (e) {
      if (!isNetworkFailure(e)) throw e;
      await sleep(Math.min(1000 * 2 ** i, 15_000));
    }
  }
  throw new NetworkError();
}

export async function uploadPhoto(
  file: File,
  uploaderName: string,
  caption: string
): Promise<Photo> {
  if (file.size > MAX_UPLOAD_BYTES) throw new TooLargeError();

  const path = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const type = mediaTypeOf(file);
  // Hashing reads a scaled copy in memory; `file` itself is uploaded untouched.
  const phash = type === "image" ? await perceptualHash(file) : null;

  await withRetry(async () => {
    const { error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw new Error(error.message);
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

  return withRetry(async () => {
    const { data, error } = await supabase
      .from("photos")
      .insert({
        uploader_name: uploaderName,
        url: publicUrl,
        caption: caption.trim() || null,
        media_type: type,
        phash,
      })
      .select(PHOTO_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return data as Photo;
  });
}

/** Sizes and checksums of the stored files, for exact-duplicate detection. */
export async function fetchFileMeta(): Promise<Map<string, FileMeta>> {
  const { data, error } = await supabase.from("photo_files").select("id, bytes, etag");
  if (error) throw new Error(error.message);
  return new Map(
    (data ?? []).map((r) => [r.id as string, { bytes: r.bytes as number | null, etag: r.etag as string | null }])
  );
}

export async function savePhash(id: string, phash: string) {
  const { error } = await supabase.from("photos").update({ phash }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Mark one photo as the keeper of its group; the others in `groupIds` lose the mark. */
export async function setPick(pickId: string, groupIds: string[]) {
  const others = groupIds.filter((id) => id !== pickId);
  if (others.length) {
    const { error } = await supabase.from("photos").update({ is_pick: false }).in("id", others);
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("photos").update({ is_pick: true }).eq("id", pickId);
  if (error) throw new Error(error.message);
}

/**
 * Delete a photo you uploaded. The database function only removes rows whose
 * uploader_name matches; it returns the storage path so the file can go too.
 */
export async function deletePhoto(photo: Photo, uploaderName: string): Promise<void> {
  const { data, error } = await supabase.rpc("delete_photo", {
    p_id: photo.id,
    p_uploader: uploaderName,
  });
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("אפשר למחוק רק תמונות שהועלו בשם שלך");

  // Best effort: the row is gone, so the file is now an orphan and removable.
  await supabase.storage.from(PHOTOS_BUCKET).remove([data as string]);
}

/** Subscribe to live inserts/updates. Returns an unsubscribe function. */
export function subscribePhotos(handlers: {
  onInsert: (photo: Photo) => void;
  onUpdate: (photo: Photo) => void;
  onDelete: (id: string) => void;
}) {
  const channel = supabase
    .channel("photos-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "photos" },
      (payload) => handlers.onInsert(payload.new as Photo)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "photos" },
      (payload) => handlers.onUpdate(payload.new as Photo)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "photos" },
      (payload) => handlers.onDelete((payload.old as { id: string }).id)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

const NAME_KEY = "trip-album:name";

export function loadSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}
