-- 0033_newsletter_images.sql
--
-- A public bucket for images embedded in newsletter emails.
--
-- ## Why public, when every other content bucket is private
--
-- Because an email client fetches the image itself, with no session and no
-- cookie. There is nobody to authorise: the recipient's mail app makes an
-- anonymous GET from whatever network it happens to be on, often through a
-- proxy (Gmail rewrites every image URL through its own cache). A signed URL
-- would expire and leave the message broken for anyone reading it later, and
-- a private object would simply never render.
--
-- That is a real disclosure: anyone holding the URL can fetch the image. It is
-- acceptable here and only here, because these images are marketing material
-- that is *already* being broadcast to a mailing list. Nothing scoped to a
-- course or a student may be uploaded here — those keep their private buckets
-- and their signed access.
--
-- ## Path shape
--
-- `newsletter-images/{yyyy-mm}/{filename}` — one folder segment, like
-- `course-thumbnails`. There is no id to key on because a newsletter image
-- belongs to no row; the month is there so the bucket stays browsable by hand
-- rather than becoming one flat directory of thousands of files.

insert into storage.buckets (id, name, public)
values ('newsletter-images', 'newsletter-images', true)
on conflict (id) do nothing;

-- Anyone may read: that is the point, see above.
create policy "newsletter_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'newsletter-images');

-- Only admins may put anything there. A public bucket with loose write rules is
-- an open file host, which is the failure mode this project already noted for
-- `course-thumbnails`.
create policy "newsletter_images_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'newsletter-images' and (select public.is_admin()));

create policy "newsletter_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'newsletter-images' and (select public.is_admin()))
  with check (bucket_id = 'newsletter-images' and (select public.is_admin()));

create policy "newsletter_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'newsletter-images' and (select public.is_admin()));
