-- Captions, explicit media type, and live updates for the gallery.

alter table public.photos
  add column if not exists caption text,
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));

-- Backfill media_type for rows uploaded before this column existed.
update public.photos
set media_type = 'video'
where media_type = 'image'
  and url ~* '\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$';

-- Stream inserts/updates to connected gallery clients (RLS still applies).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end $$;
