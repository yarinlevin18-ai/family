"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Heart, ImageIcon, Play, Search, Upload, Video, X } from "@/components/icons";
import { Lightbox } from "@/components/lightbox";
import { PhotoCard } from "@/components/photo-card";
import { useToast } from "@/components/toast";
import { usePhotos } from "@/lib/use-photos";
import type { Photo } from "@/lib/types";

type Filter = "all" | "favorites" | "image" | "video";

const FILTERS: { key: Filter; label: string; icon?: typeof Heart }[] = [
  { key: "all", label: "הכול" },
  { key: "favorites", label: "מועדפים", icon: Heart },
  { key: "image", label: "תמונות", icon: ImageIcon },
  { key: "video", label: "סרטונים", icon: Video },
];

export default function GalleryPage() {
  const toast = useToast();
  const { photos, error, freshIds, toggleFavorite } = usePhotos({
    onLiveInsert: (p) => toast("info", `${p.uploader_name} העלה/תה משהו חדש`),
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [uploader, setUploader] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const uploaders = useMemo(() => {
    const counts = new Map<string, number>();
    photos?.forEach((p) => counts.set(p.uploader_name, (counts.get(p.uploader_name) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [photos]);

  const visible = useMemo(() => {
    if (!photos) return [];
    let list = photos;
    if (filter === "favorites") list = list.filter((p) => p.is_favorite);
    else if (filter !== "all") list = list.filter((p) => p.media_type === filter);
    if (uploader) list = list.filter((p) => p.uploader_name === uploader);
    if (deferredQuery) {
      list = list.filter(
        (p) =>
          p.uploader_name.toLowerCase().includes(deferredQuery) ||
          (p.caption ?? "").toLowerCase().includes(deferredQuery)
      );
    }
    return oldestFirst ? [...list].reverse() : list;
  }, [photos, filter, uploader, deferredQuery, oldestFirst]);

  const openIndex = openId ? visible.findIndex((p) => p.id === openId) : -1;

  async function onToggle(photo: Photo) {
    try {
      await toggleFavorite(photo);
    } catch (e) {
      toast("error", `לא הצלחנו לעדכן: ${(e as Error).message}`);
    }
  }

  const favorites = photos?.filter((p) => p.is_favorite).length ?? 0;
  const filtersActive = filter !== "all" || uploader || query;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">הגלריה</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-mist-2">
            <span className="inline-block h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" />
            עדכון חי · {photos ? `${photos.length} רגעים` : "טוען…"}
            {favorites > 0 && ` · ${favorites} מועדפים`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/slideshow" className="btn-ghost">
            <Play width={16} height={16} />
            מצגת
          </Link>
          <Link href="/upload" className="btn-primary">
            <Upload width={16} height={16} />
            העלאה
          </Link>
        </div>
      </header>

      <div className="glass sticky top-[4.6rem] z-30 mb-6 flex flex-col gap-3 rounded-2xl p-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-mist-3" width={16} height={16} />
            <input
              type="search"
              className="input py-2 ps-9 text-sm"
              placeholder="חיפוש לפי שם או כיתוב…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className="chip"
                data-active={filter === key}
                onClick={() => setFilter(key)}
              >
                {Icon && <Icon width={14} height={14} filled={key === "favorites" && filter === key} />}
                {label}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              data-active={oldestFirst}
              onClick={() => setOldestFirst((v) => !v)}
              title="סדר תצוגה"
            >
              {oldestFirst ? "מהישן לחדש" : "מהחדש לישן"}
            </button>
          </div>
        </div>

        {uploaders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <span className="shrink-0 text-xs font-bold text-mist-3">מי צילם:</span>
            {uploaders.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className="chip shrink-0 !ps-1.5"
                data-active={uploader === name}
                onClick={() => setUploader((u) => (u === name ? null : name))}
              >
                <Avatar name={name} size="sm" />
                {name}
                <span className="opacity-60">{count}</span>
              </button>
            ))}
            {filtersActive && (
              <button
                type="button"
                className="chip shrink-0"
                onClick={() => {
                  setFilter("all");
                  setUploader(null);
                  setQuery("");
                }}
              >
                <X width={14} height={14} />
                ניקוי
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-500/30">
          לא הצלחנו לטעון את התמונות: {error}
        </p>
      )}

      {!error && photos === null && (
        <div className="masonry">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: `${160 + ((i * 53) % 140)}px` }} />
          ))}
        </div>
      )}

      {photos && photos.length === 0 && (
        <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center animate-pop">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-glow to-ember text-4xl shadow-xl shadow-glow/30">
            📷
          </div>
          <h2 className="text-2xl font-black">האלבום עוד ריק</h2>
          <p className="mt-2 text-mist-2">תהיו הראשונים להעלות רגע מהטיול.</p>
          <Link href="/upload" className="btn-primary mt-6">
            <Upload width={16} height={16} />
            להעלאה הראשונה
          </Link>
        </div>
      )}

      {photos && photos.length > 0 && visible.length === 0 && (
        <p className="py-16 text-center text-mist-3">לא נמצא כלום שמתאים לסינון הזה.</p>
      )}

      {visible.length > 0 && (
        <div className="masonry">
          {visible.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              fresh={freshIds.has(photo.id)}
              onOpen={() => setOpenId(photo.id)}
              onToggleFavorite={() => onToggle(photo)}
            />
          ))}
        </div>
      )}

      {openIndex >= 0 && (
        <Lightbox
          photos={visible}
          index={openIndex}
          onClose={() => setOpenId(null)}
          onNavigate={(i) => setOpenId(visible[i].id)}
          onToggleFavorite={onToggle}
        />
      )}
    </div>
  );
}
