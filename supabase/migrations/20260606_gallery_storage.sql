-- Gallery storage: create the public `gallery` bucket and lock down writes to active admins.
-- Root cause of the admin upload 400: the bucket did not exist and storage.objects had no policies.

-- 1. Bucket (public read, 10 MB limit, image mime types only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. storage.objects policies, scoped to the gallery bucket.
-- Note: the bucket is public, so objects are served by URL without a SELECT policy.
-- We deliberately do NOT add a broad read policy (that would allow listing all files).
drop policy if exists "gallery_public_read" on storage.objects;

drop policy if exists "gallery_admin_insert" on storage.objects;
create policy "gallery_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery' and public.is_admin_active());

drop policy if exists "gallery_admin_update" on storage.objects;
create policy "gallery_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery' and public.is_admin_active())
  with check (bucket_id = 'gallery' and public.is_admin_active());

drop policy if exists "gallery_admin_delete" on storage.objects;
create policy "gallery_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery' and public.is_admin_active());

-- 3. Tighten gallery_images table write policy: only active admins may write.
drop policy if exists "auth_all" on public.gallery_images;
create policy "gallery_images_admin_write"
  on public.gallery_images for all
  to authenticated
  using (public.is_admin_active())
  with check (public.is_admin_active());
-- public_read (anon, active = true) is left unchanged.
