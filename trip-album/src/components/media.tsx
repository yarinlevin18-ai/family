"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";

export function Media({
  photo,
  className = "",
  controls = false,
  autoPlay = false,
  muted = true,
  onEnded,
  sizes,
}: {
  photo: Photo;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} grid min-h-40 place-items-center bg-ink-3 text-sm text-mist-3`}
        role="img"
        aria-label="הקובץ לא נטען"
      >
        הקובץ לא נטען
      </div>
    );
  }

  if (photo.media_type === "video") {
    return (
      <video
        src={photo.url}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        onEnded={onEnded}
        onLoadedData={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    );
  }

  // Plain <img>: media lives in Supabase storage, no Next image optimization needed.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={photo.caption ?? `תמונה של ${photo.uploader_name}`}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className} transition-all duration-700 ${loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"}`}
    />
  );
}
