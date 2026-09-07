"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { ChevronLeft, ChevronRight, Download, Heart, Share, Trash, X } from "./icons";
import { Media } from "./media";
import { useToast } from "./toast";
import { formatFullDate } from "@/lib/format";
import type { Photo } from "@/lib/types";

export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
  onToggleFavorite,
  canDelete,
  onDelete,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
  onToggleFavorite: (photo: Photo) => void;
  canDelete?: (photo: Photo) => boolean;
  onDelete?: (photo: Photo) => void;
}) {
  const toast = useToast();
  const photo = photos[index];
  const touchStart = useRef<number | null>(null);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const go = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      setDir(delta > 0 ? "next" : "prev");
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // RTL: "next" is to the left.
      else if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        onToggleFavorite(photo);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose, onToggleFavorite, photo]);

  if (!photo) return null;

  async function share() {
    const title = photo.caption ?? `תמונה של ${photo.uploader_name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: photo.url });
        return;
      }
      await navigator.clipboard.writeText(photo.url);
      toast("success", "הקישור הועתק");
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="תצוגת תמונה"
      className="fixed inset-0 z-[80] flex flex-col bg-black/92 backdrop-blur-xl"
      onClick={onClose}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Avatar name={photo.uploader_name} />
          <div className="leading-tight">
            <div className="font-bold">{photo.uploader_name}</div>
            <div className="text-xs text-mist-3">{formatFullDate(photo.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span dir="ltr" className="hidden text-sm text-mist-3 sm:inline">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            className={`icon-btn ${photo.is_favorite ? "text-ember" : ""}`}
            onClick={() => onToggleFavorite(photo)}
            aria-label="מועדף"
          >
            <Heart filled={photo.is_favorite} />
          </button>
          <button type="button" className="icon-btn" onClick={share} aria-label="שיתוף">
            <Share />
          </button>
          {onDelete && canDelete?.(photo) && (
            <button
              type="button"
              className="icon-btn hover:!bg-rose-500"
              onClick={() => onDelete(photo)}
              aria-label="מחיקה"
              title="מחיקה"
            >
              <Trash />
            </button>
          )}
          <a className="icon-btn" href={photo.url} download target="_blank" rel="noreferrer" aria-label="הורדה">
            <Download />
          </a>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="סגירה">
            <X />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-16">
        <div
          key={photo.id}
          className="flex max-h-full max-w-full items-center justify-center"
          style={{ animation: `${dir === "next" ? "fade-up" : "pop"} 0.35s ease both` }}
          onClick={(e) => e.stopPropagation()}
        >
          <Media
            photo={photo}
            controls
            autoPlay
            muted={false}
            className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl shadow-black/60"
          />
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="הקודם"
              className="icon-btn absolute end-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:end-4"
            >
              <ChevronRight />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="הבא"
              className="icon-btn absolute start-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:start-4"
            >
              <ChevronLeft />
            </button>
          </>
        )}
      </div>

      {photo.caption && (
        <p
          className="mx-auto mb-4 max-w-2xl px-4 text-center text-base leading-relaxed text-mist"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption}
        </p>
      )}
    </div>
  );
}
