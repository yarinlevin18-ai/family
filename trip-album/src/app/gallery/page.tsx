"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Photo } from "@/lib/types";
import { PhotoCard } from "./photo-card";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("photos")
      .select("id, uploader_name, url, is_favorite, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setPhotos(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gallery</h1>
        <Link href="/upload" className="text-sm underline">
          Upload more
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Could not load photos: {error}
        </p>
      )}

      {!error && photos === null && (
        <p className="text-zinc-500">Loading…</p>
      )}

      {photos && photos.length === 0 && (
        <p className="text-zinc-500">
          No photos yet.{" "}
          <Link href="/upload" className="underline">
            Be the first to upload.
          </Link>
        </p>
      )}

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
