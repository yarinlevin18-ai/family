"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Check, Grid, Search, Sparkles, Spinner } from "@/components/icons";
import { Media } from "@/components/media";
import { useToast } from "@/components/toast";
import { formatWhen } from "@/lib/format";
import { perceptualHashFromUrl } from "@/lib/hash";
import { buildGroups, representative, type FileMeta } from "@/lib/groups";
import { fetchFileMeta, savePhash, setPick } from "@/lib/photos";
import { usePhotos } from "@/lib/use-photos";
import type { Photo } from "@/lib/types";

const SCAN_CONCURRENCY = 3;

export default function DuplicatesPage() {
  const toast = useToast();
  const { photos, error, patchPhotos } = usePhotos();
  const [files, setFiles] = useState<Map<string, FileMeta>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    // Exact-duplicate detection is a bonus; near-duplicates work without it.
    fetchFileMeta().then(setFiles).catch(() => {});
  }, []);

  useEffect(
    () => () => {
      cancelled.current = true;
    },
    []
  );

  const unscanned = useMemo(
    () => (photos ?? []).filter((p) => p.media_type === "image" && !p.phash),
    [photos]
  );

  const groups = useMemo(() => buildGroups(photos ?? [], files), [photos, files]);

  const scan = useCallback(async () => {
    if (!unscanned.length) return;
    cancelled.current = false;
    setScanning(true);
    setScanned(0);

    const queue = [...unscanned];
    let done = 0;

    async function worker() {
      while (queue.length && !cancelled.current) {
        const photo = queue.shift()!;
        const hash = await perceptualHashFromUrl(photo.url);
        if (hash) {
          try {
            await savePhash(photo.id, hash);
            patchPhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, phash: hash } : p)));
          } catch {
            /* keep going; the next scan retries this one */
          }
        }
        done++;
        setScanned(done);
      }
    }

    await Promise.all(Array.from({ length: SCAN_CONCURRENCY }, worker));
    setScanning(false);
    if (!cancelled.current) toast("success", "הסריקה הסתיימה");
  }, [unscanned, patchPhotos, toast]);

  async function choose(photo: Photo, groupIds: string[]) {
    setSaving(photo.id);
    patchPhotos((list) =>
      list.map((p) => (groupIds.includes(p.id) ? { ...p, is_pick: p.id === photo.id } : p))
    );
    try {
      await setPick(photo.id, groupIds);
    } catch (e) {
      toast("error", `לא הצלחנו לשמור: ${(e as Error).message}`);
    } finally {
      setSaving(null);
    }
  }

  const duplicateCount = groups.reduce((n, g) => n + g.photos.length - 1, 0);

  return (
    <div>
      <header className="mb-6 animate-fade-up">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">כפולים</h1>
        <p className="mt-2 max-w-2xl text-mist-2">
          תמונות מאותו רגע מקובצות יחד. בוחרים את הטובה בקבוצה והיא זו שתופיע בגלריה כשמכווצים.{" "}
          <strong className="text-mist">שום דבר לא נמחק</strong> — כל השאר נשארות במקומן.
        </p>
      </header>

      <section
        className="glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="text-sm text-mist-2">
          {photos === null ? (
            "טוען…"
          ) : (
            <>
              נמצאו <strong className="text-mist">{groups.length}</strong> קבוצות ובהן{" "}
              <strong className="text-mist">{duplicateCount}</strong> תמונות עודפות.
              {unscanned.length > 0 && (
                <span className="text-glow"> {unscanned.length} תמונות עוד לא נסרקו.</span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/gallery" className="btn-ghost">
            <Grid width={16} height={16} />
            לגלריה
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={scan}
            disabled={scanning || unscanned.length === 0}
          >
            {scanning ? <Spinner width={18} height={18} /> : <Search width={18} height={18} />}
            {scanning
              ? `סורק… ${scanned}/${unscanned.length}`
              : unscanned.length
                ? `סריקת ${unscanned.length} תמונות`
                : "הכול נסרק"}
          </button>
        </div>
      </section>

      {scanning && (
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-glow to-ember transition-all duration-300"
            style={{ width: `${Math.max(4, (scanned / Math.max(unscanned.length, 1)) * 100)}%` }}
          />
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-500/30">
          לא הצלחנו לטעון: {error}
        </p>
      )}

      {photos && groups.length === 0 && (
        <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center animate-pop">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-glow to-ember text-4xl shadow-xl shadow-glow/30">
            ✨
          </div>
          <h2 className="text-2xl font-black">לא נמצאו כפולים</h2>
          <p className="mt-2 text-mist-2">
            {unscanned.length
              ? "מריצים סריקה כדי לאתר תמונות מאותו רגע."
              : "האלבום נקי מכפילויות."}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {groups.map((group, gi) => {
          const rep = representative(group);
          const ids = group.photos.map((p) => p.id);
          return (
            <section
              key={group.key}
              className="glass animate-fade-up rounded-3xl p-4"
              style={{ animationDelay: `${Math.min(gi, 10) * 50}ms` }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="chip !bg-white/10">
                  <Sparkles width={14} height={14} className="text-glow" />
                  {group.photos.length} תמונות
                </span>
                <span className="chip">{group.exact ? "זהות לחלוטין" : "אותו רגע"}</span>
                <span className="text-xs text-mist-3">{formatWhen(group.photos[0].created_at)}</span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {group.photos.map((photo) => {
                  const chosen = photo.id === rep.id;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => choose(photo, ids)}
                      disabled={saving === photo.id}
                      aria-pressed={chosen}
                      className={`group relative w-40 shrink-0 overflow-hidden rounded-2xl text-start ring-2 transition sm:w-48 ${
                        chosen ? "ring-glow shadow-xl shadow-glow/20" : "ring-white/10 hover:ring-white/30"
                      }`}
                    >
                      <div className="aspect-square bg-ink-3">
                        <Media photo={photo} className="h-full w-full object-cover" sizes="200px" />
                      </div>
                      <span
                        className={`absolute end-2 top-2 grid h-7 w-7 place-items-center rounded-full transition ${
                          chosen
                            ? "bg-glow text-ink"
                            : "bg-black/50 text-white/70 group-hover:bg-white/80 group-hover:text-ink"
                        }`}
                      >
                        {saving === photo.id ? (
                          <Spinner width={14} height={14} />
                        ) : (
                          <Check width={14} height={14} strokeWidth={3} />
                        )}
                      </span>
                      {chosen && (
                        <span className="absolute start-2 top-2 rounded-full bg-glow px-2 py-0.5 text-[11px] font-extrabold text-ink">
                          הנבחרת
                        </span>
                      )}
                      <div className="flex items-center gap-2 p-2">
                        <Avatar name={photo.uploader_name} size="sm" />
                        <span className="truncate text-xs font-semibold">{photo.uploader_name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
