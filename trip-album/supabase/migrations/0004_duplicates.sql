-- Grouping duplicates for review. Nothing is deleted: a group just gets a pick.

alter table public.photos
  -- 64-bit perceptual hash (dHash) as 16 hex chars; images only.
  add column if not exists phash text,
  -- The one the family chose to represent its duplicate group.
  add column if not exists is_pick boolean not null default false;

create index if not exists photos_phash_idx on public.photos (phash);

-- Exact duplicates can be found without downloading anything: storage already
-- stores each object's size and eTag (the content checksum).
create or replace view public.photo_files
with (security_invoker = on) as
select
  p.id,
  (o.metadata->>'size')::bigint as bytes,
  o.metadata->>'eTag' as etag
from public.photos p
join storage.objects o
  on o.bucket_id = 'photos'
 and o.name = substring(p.url from '/object/public/photos/(.*)$');

grant select on public.photo_files to anon, authenticated;
