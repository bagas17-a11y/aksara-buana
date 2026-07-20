-- ============================================================
-- Supabase Storage setup for attachments
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Create the attachments storage bucket (private)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Drivers can upload to their own trip folders
create policy "Drivers upload to own trip" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] in (
      select id::text from public.trips where driver_id = auth.uid()
    )
  );

-- Drivers can read their own attachments
create policy "Drivers read own attachments" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] in (
      select id::text from public.trips where driver_id = auth.uid()
    )
  );

-- Admins can read all attachments
create policy "Admins read all attachments" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    AND public.current_user_role() = 'admin'
  );

-- Admins can manage all attachments
create policy "Admins manage all attachments" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'attachments'
    AND public.current_user_role() = 'admin'
  );
