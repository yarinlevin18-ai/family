-- Run this in the Supabase SQL editor (or `supabase db push`).

-- 1. photos table
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  uploader_name text not null,
  url text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists photos_created_at_idx on public.photos (created_at desc);

-- No auth in this app: allow anonymous read, insert, and favorite toggling.
alter table public.photos enable row level security;

drop policy if exists "photos public read" on public.photos;
create policy "photos public read"
  on public.photos for select
  to anon, authenticated
  using (true);

drop policy if exists "photos public insert" on public.photos;
create policy "photos public insert"
  on public.photos for insert
  to anon, authenticated
  with check (true);

drop policy if exists "photos public update favorite" on public.photos;
create policy "photos public update favorite"
  on public.photos for update
  to anon, authenticated
  using (true)
  with check (true);

-- 2. storage bucket "photos" with public read
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos bucket public read" on storage.objects;
create policy "photos bucket public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'photos');

drop policy if exists "photos bucket public upload" on storage.objects;
create policy "photos bucket public upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'photos');
