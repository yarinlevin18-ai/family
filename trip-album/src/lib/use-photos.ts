"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPhotos, setFavorite, subscribePhotos } from "./photos";
import type { Photo } from "./types";

export function usePhotos(options?: { onLiveInsert?: (p: Photo) => void }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const onLiveInsert = useRef(options?.onLiveInsert);
  useEffect(() => {
    onLiveInsert.current = options?.onLiveInsert;
  });

  useEffect(() => {
    let cancelled = false;
    fetchPhotos()
      .then((p) => !cancelled && setPhotos(p))
      .catch((e: Error) => !cancelled && setError(e.message));

    const unsubscribe = subscribePhotos({
      onInsert: (photo) => {
        setPhotos((prev) => {
          if (!prev || prev.some((p) => p.id === photo.id)) return prev;
          return [photo, ...prev];
        });
        setFreshIds((s) => new Set(s).add(photo.id));
        setTimeout(() => {
          setFreshIds((s) => {
            const n = new Set(s);
            n.delete(photo.id);
            return n;
          });
        }, 8000);
        onLiveInsert.current?.(photo);
      },
      onUpdate: (photo) =>
        setPhotos((prev) => prev?.map((p) => (p.id === photo.id ? { ...p, ...photo } : p)) ?? prev),
      onDelete: (id) => setPhotos((prev) => prev?.filter((p) => p.id !== id) ?? prev),
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const toggleFavorite = useCallback(async (photo: Photo) => {
    const next = !photo.is_favorite;
    setPhotos((prev) => prev?.map((p) => (p.id === photo.id ? { ...p, is_favorite: next } : p)) ?? prev);
    try {
      await setFavorite(photo.id, next);
    } catch (e) {
      setPhotos((prev) => prev?.map((p) => (p.id === photo.id ? { ...p, is_favorite: !next } : p)) ?? prev);
      throw e;
    }
  }, []);

  return { photos, error, freshIds, toggleFavorite };
}
