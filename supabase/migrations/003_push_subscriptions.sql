-- Migration 003: Push subscription storage for Web Push notifications
-- Run in Supabase SQL Editor

create table if not exists public.push_subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own subscriptions" on public.push_subscriptions
  for all using (user_id = auth.uid());

-- Admins can read all subscriptions so they can push to drivers (and vice versa)
-- Actual sending is done server-side with service role key, so no extra policy needed.
