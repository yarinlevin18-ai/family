"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Photo } from "@/lib/types";
import { Media } from "./media";

export function PhotoCard({ photo }: { photo: Photo }) {
  const [favorite, setFavorite] = useState(photo.is_favorite);
  const [saving, setSaving] = useState(false);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    setSaving(true);

    const { error } = await supabase
      .from("photos")
      .update({ is_favorite: next })
      .eq("id", photo.id);

    setSaving(false);
    if (error) {
      setFavorite(!next);
      alert(`Could not update favorite: ${error.message}`);
    }
  }

  const date = new Date(photo.created_at).toLocaleString();

  return (
    <figure className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-zinc-100">
        <Media url={photo.url} alt={`Uploaded by ${photo.uploader_name}`} />
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={saving}
          aria-pressed={favorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-xl leading-none shadow hover:bg-white disabled:opacity-60"
        >
          {favorite ? "❤️" : "🤍"}
        </button>
      </div>
      <figcaption className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="font-medium">{photo.uploader_name}</span>
        <time dateTime={photo.created_at} className="text-zinc-500">
          {date}
        </time>
      </figcaption>
    </figure>
  );
}
