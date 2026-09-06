# trip-album

Next.js (App Router, TypeScript, Tailwind) + Supabase shared photo/video album. No auth.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_photos.sql`. It creates the `photos` table, the public `photos` storage bucket, and the anon read/insert/update policies the app needs.
3. Copy `.env.local.example` to `.env.local` and fill in the project URL and anon key.
4. `npm install && npm run dev`

## Routes

- `/upload` — name + image/video picker. Uploads to the `photos` bucket, then inserts a row into `photos`.
- `/gallery` — grid of all rows in `photos`, newest first, with a heart toggle that flips `is_favorite`.
