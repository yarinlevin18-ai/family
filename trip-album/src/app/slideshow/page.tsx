"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ChevronLeft, ChevronRight, Heart, Pause, Play, Shuffle, X } from "@/components/icons";
import { Media } from "@/components/media";
import { usePhotos } from "@/lib/use-photos";
import { formatWhen } from "@/lib/format";

const IMAGE_MS = 6000;

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SlideshowPage() {
  const { photos, error, toggleFavorite } = usePhotos();
  const [playing, setPlaying] = useState(true);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [showUi, setShowUi] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const list = useMemo(() => {
    let l = photos ?? [];
    if (favoritesOnly) l = l.filter((p) => p.is_favorite);
    if (l.length === 0) l = photos ?? [];
    // Oldest first tells the story in order.
    l = [...l].reverse();
    return shuffled ? shuffle(l) : l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, favoritesOnly, shuffled, seed]);

  const current = list[index % Math.max(list.length, 1)];

  const next = useCallback(() => setIndex((i) => (list.length ? (i + 1) % list.length : 0)), [list.length]);
  const prev = useCallback(
    () => setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0)),
    [list.length]
  );

  useEffect(() => {
    if (!playing || !current || current.media_type === "video") return;
    const t = window.setTimeout(next, IMAGE_MS);
    return () => window.clearTimeout(t);
  }, [playing, current, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
      else if (e.key === "f") {
        setFavoritesOnly((v) => !v);
        setIndex(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const armHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowUi(false), 2800);
  }, []);

  const poke = useCallback(() => {
    setShowUi(true);
    armHide();
  }, [armHide]);

  useEffect(() => {
    armHide();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [armHide]);

  function toggleFavoritesOnly() {
    setFavoritesOnly((v) => !v);
    setIndex(0);
  }

  function toggleShuffle() {
    setShuffled((v) => !v);
    setSeed((s) => s + 1);
    setIndex(0);
  }

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* unsupported */
    }
  }

  const uiClass = `transition-opacity duration-500 ${showUi ? "opacity-100" : "opacity-0"}`;

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden bg-black"
      onMouseMove={poke}
      onTouchStart={poke}
      onClick={() => setPlaying((p) => !p)}
      onDoubleClick={requestFullscreen}
    >
      {error && <p className="absolute inset-0 grid place-items-center text-rose-200">{error}</p>}

      {photos && photos.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black">אין עדיין מה להציג</p>
            <Link href="/upload" className="btn-primary mt-5" onClick={(e) => e.stopPropagation()}>
              להעלאה הראשונה
            </Link>
          </div>
        </div>
      )}

      {current && (
        <div key={current.id} className="absolute inset-0">
          {current.media_type === "image" && (
            <div
              className="absolute inset-0 scale-125 bg-cover bg-center opacity-40 blur-3xl"
              style={{ backgroundImage: `url("${current.url}")` }}
            />
          )}
          <div className="absolute inset-0 grid place-items-center animate-pop">
            <Media
              photo={current}
              autoPlay
              muted={false}
              onEnded={next}
              className={`max-h-screen max-w-full object-contain ${
                current.media_type === "image" && playing ? "animate-kenburns" : ""
              }`}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        </div>
      )}

      <div className={`absolute inset-x-0 top-0 flex items-center justify-between p-4 ${uiClass}`}>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href="/gallery" className="icon-btn" aria-label="יציאה">
            <X />
          </Link>
          <span dir="ltr" className="text-sm text-white/70">
            {list.length ? `${(index % list.length) + 1} / ${list.length}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="chip"
            data-active={favoritesOnly}
            onClick={toggleFavoritesOnly}
          >
            <Heart width={14} height={14} filled={favoritesOnly} />
            רק מועדפים
          </button>
          <button
            type="button"
            className="chip"
            data-active={shuffled}
            onClick={toggleShuffle}
          >
            <Shuffle width={14} height={14} />
            ערבוב
          </button>
        </div>
      </div>

      {current && (
        <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-8 ${uiClass}`}>
          <div className="flex min-w-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Avatar name={current.uploader_name} size="lg" />
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-white">{current.uploader_name}</div>
              <div className="text-sm text-white/70">{formatWhen(current.created_at)}</div>
              {current.caption && (
                <p className="mt-1 max-w-xl text-base leading-snug text-white/90">{current.caption}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`icon-btn ${current.is_favorite ? "text-ember" : ""}`}
              onClick={() => toggleFavorite(current).catch(() => {})}
              aria-label="מועדף"
            >
              <Heart filled={current.is_favorite} />
            </button>
            <button type="button" className="icon-btn" onClick={prev} aria-label="הקודם">
              <ChevronRight />
            </button>
            <button
              type="button"
              className="icon-btn h-14 w-14 !bg-white !text-ink"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "השהיה" : "ניגון"}
            >
              {playing ? <Pause width={24} height={24} /> : <Play width={24} height={24} />}
            </button>
            <button type="button" className="icon-btn" onClick={next} aria-label="הבא">
              <ChevronLeft />
            </button>
          </div>
        </div>
      )}

      {current && current.media_type === "image" && playing && (
        <div key={`bar-${current.id}`} className="absolute inset-x-0 top-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-l from-glow to-ember"
            style={{ animation: `progress ${IMAGE_MS}ms linear forwards` }}
          />
        </div>
      )}
      <style>{`@keyframes progress { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  );
}
