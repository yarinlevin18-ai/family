export type MediaType = "image" | "video";

export type Photo = {
  id: string;
  uploader_name: string;
  url: string;
  caption: string | null;
  media_type: MediaType;
  is_favorite: boolean;
  created_at: string;
};

export const PHOTO_COLUMNS =
  "id, uploader_name, url, caption, media_type, is_favorite, created_at";
