# trip-album

Next.js (App Router, TypeScript, Tailwind) + Supabase shared photo/video album. Hebrew, RTL, no auth.

## Features

- Landing page with live stats and a floating collage of favorite shots.
- Drag-and-drop multi-file upload with per-file captions, progress, and a remembered uploader name.
- Masonry gallery with search, type/favorite filters, per-uploader chips, and sort order.
- Lightbox with keyboard and swipe navigation, favorite, share (Web Share API or copy link), and download.
- Full-screen slideshow with Ken Burns motion, favorites-only mode, shuffle, and videos that play through.
- Realtime: new uploads and favorite changes appear on every open client without a refresh.

## Live Supabase project

Already provisioned in the "Yarin Levin" org (free plan), region `eu-west-1`.
Migrations `0001_photos.sql` and `0002_captions_realtime.sql` have been applied there (table, bucket, policies, captions, realtime).

| Setting | Value |
| --- | --- |
| Project ref | `zgfkoyqlnshiivyzhumz` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zgfkoyqlnshiivyzhumz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_iDSeFwvNBfzt2aUn6amSLg_pRyT6XL9` |

The publishable key is safe to ship to the browser; row-level security and the bucket policies are what limit what it can do.

## Local run

1. Optional: copy `.env.local.example` to `.env.local`. The app already defaults to the values above when the variables are unset.
2. `npm install && npm run dev`

## Setting up a fresh project instead

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_photos.sql` and then `0002_captions_realtime.sql`. Together they create the `photos` table, the public `photos` storage bucket, the anon read/insert/update policies, the caption/media_type columns, and realtime streaming for the table.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local` or Vercel) to that project's URL and publishable key; they override the built-in defaults.

## Routes

- `/` — landing page with stats and featured photos.
- `/upload` — multi-file uploader. Each file goes to the `photos` bucket, then a row is inserted into `photos`.
- `/gallery` — filterable masonry grid of `photos`, newest first, with lightbox and favorite toggle.
- `/slideshow` — full-screen auto-advancing slideshow.
