-- Deleting photos without auth: a photo can be removed only by supplying the
-- uploader name it was posted under. The table itself gets no DELETE policy, so
-- plain REST deletes stay blocked; deletion goes through this function.

create or replace function public.delete_photo(p_id uuid, p_uploader text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
begin
  delete from public.photos
  where id = p_id
    and uploader_name = p_uploader
  returning url into v_url;

  if v_url is null then
    return null;
  end if;

  -- Storage object path, so the client can remove the file too.
  return substring(v_url from '/object/public/photos/(.*)$');
end;
$$;

revoke all on function public.delete_photo(uuid, text) from public;
grant execute on function public.delete_photo(uuid, text) to anon, authenticated;

-- Files can be removed from the bucket only once no photo row references them,
-- i.e. after delete_photo() has authorised and removed the row.
drop policy if exists "photos bucket delete orphans" on storage.objects;
create policy "photos bucket delete orphans"
  on storage.objects for delete
  to anon, authenticated
  using (
    bucket_id = 'photos'
    and not exists (
      select 1 from public.photos p
      where p.url like '%/object/public/photos/' || storage.objects.name
    )
  );
