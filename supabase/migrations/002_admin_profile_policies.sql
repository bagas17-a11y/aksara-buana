-- Migration 002: Allow admins to update and deactivate any driver profile
-- Run this in the Supabase SQL Editor

create policy "Admins update all profiles" on public.profiles
  for update using (public.current_user_role() = 'admin');

create policy "Admins insert profiles" on public.profiles
  for insert with check (public.current_user_role() = 'admin');
