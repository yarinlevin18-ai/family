import { supabase, PHOTOS_BUCKET } from "./supabase";
import { PHOTO_COLUMNS, type Photo } from "./types";
import { mediaTypeOf, safeFileName } from "./format";

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

export async function uploadPhoto(
  file: File,
  uploaderName: string,
  caption: string
): Promise<Photo> {
  const path = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("photos")
    .insert({
      uploader_name: uploaderName,
      url: publicUrl,
      caption: caption.trim() || null,
      media_type: mediaTypeOf(file),
    })
    .select(PHOTO_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Photo;
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
