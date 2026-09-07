export type MediaType = "image" | "video";

export type Photo = {
  id: string;
  uploader_name: string;
  url: string;
  caption: string | null;
  media_type: MediaType;
  is_favorite: boolean;
  /** 64-bit perceptual hash, images only. Null until scanned. */
  phash: string | null;
  /** Chosen as the keeper of its duplicate group. */
  is_pick: boolean;
  created_at: string;
};

export const PHOTO_COLUMNS =
  "id, uploader_name, url, caption, media_type, is_favorite, phash, is_pick, created_at";
