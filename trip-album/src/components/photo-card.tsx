"use client";

import { Avatar } from "./avatar";
import { Heart, Play } from "./icons";
import { Media } from "./media";
import { formatWhen } from "@/lib/format";
import type { Photo } from "@/lib/types";

export function PhotoCard({
  photo,
  index,
  onOpen,
  onToggleFavorite,
  fresh = false,
}: {
  photo: Photo;
  index: number;
  onOpen: () => void;
  onToggleFavorite: () => void;
  fresh?: boolean;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-2xl bg-ink-2 shadow-xl shadow-black/40 ring-1 ring-white/8 transition-transform duration-300 hover:-translate-y-1 hover:ring-white/20 ${
        fresh ? "animate-pop" : "animate-fade-up"
      }`}
      style={{ animationDelay: fresh ? "0ms" : `${Math.min(index, 12) * 40}ms` }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in bg-ink-3"
        aria-label={photo.caption ?? `פתח תמונה של ${photo.uploader_name}`}
      >
        <div className="skeleton relative w-full">
          <Media
            photo={photo}
            className="block h-auto w-full object-cover"
            sizes="(min-width:1536px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
          />
          {photo.media_type === "video" && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md ring-1 ring-white/30 transition group-hover:scale-110">
                <Play width={26} height={26} className="translate-x-[-1px]" />
              </span>
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      </button>

      {fresh && (
        <span className="absolute start-3 top-3 rounded-full bg-emerald-400 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-lg">
          חדש!
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-pressed={photo.is_favorite}
        aria-label={photo.is_favorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}
        className={`icon-btn absolute end-3 top-3 transition ${
          photo.is_favorite
            ? "text-ember drop-shadow-[0_0_10px_rgba(255,92,122,0.8)]"
            : "text-white/85 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        }`}
      >
        <Heart filled={photo.is_favorite} className={photo.is_favorite ? "animate-pop" : ""} />
      </button>

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2.5 p-3">
        <Avatar name={photo.uploader_name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-bold text-white">{photo.uploader_name}</span>
            <time dateTime={photo.created_at} className="shrink-0 text-[11px] text-white/70">
              {formatWhen(photo.created_at)}
            </time>
          </div>
          {photo.caption && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/85">{photo.caption}</p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
