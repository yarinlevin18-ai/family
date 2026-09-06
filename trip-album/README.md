# trip-album

Next.js (App Router, TypeScript, Tailwind) + Supabase shared photo/video album. No auth.

## Live Supabase project

Already provisioned in the "Yarin Levin" org (free plan), region `eu-west-1`.
Migration `0001_photos.sql` has been applied there (table, bucket, and policies are in place).

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
2. In the SQL editor, run `supabase/migrations/0001_photos.sql`. It creates the `photos` table, the public `photos` storage bucket, and the anon read/insert/update policies the app needs.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local` or Vercel) to that project's URL and publishable key; they override the built-in defaults.

## Routes

- `/upload` — name + image/video picker. Uploads to the `photos` bucket, then inserts a row into `photos`.
- `/gallery` — grid of all rows in `photos`, newest first, with a heart toggle that flips `is_favorite`.
