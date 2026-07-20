-- ============================================================
-- Aksara Buana Delivery System — Supabase Schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- One row per auth.users user; role = 'admin' | 'driver'
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          text not null check (role in ('admin', 'driver')),
  phone         text,
  vehicle_plate text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Auto-create profile stub on signup (role must be set manually or via seed)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'driver')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CHECKLIST TEMPLATES
-- ============================================================
create table if not exists public.checklist_templates (
  id      uuid primary key default uuid_generate_v4(),
  type    text not null check (type in ('pre', 'post')),
  name    text not null,
  fields  jsonb not null default '[]',
  active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIPS
-- ============================================================
create table if not exists public.trips (
  id              uuid primary key default uuid_generate_v4(),
  driver_id       uuid not null references public.profiles(id),
  dispatcher_id   uuid not null references public.profiles(id),
  status          text not null default 'assigned'
                    check (status in ('assigned','pre_check_done','in_transit','delivered','completed','cancelled')),
  cargo_desc      text not null,
  customer_name   text not null,
  customer_phone  text,
  scheduled_at    timestamptz not null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TRIP STOPS (multi-stop support)
-- ============================================================
create table if not exists public.trip_stops (
  id           uuid primary key default uuid_generate_v4(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  sequence     int  not null,
  label        text not null,
  address      text not null,
  lat          double precision,
  lng          double precision,
  status       text not null default 'pending'
                 check (status in ('pending','in_transit','delivered')),
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (trip_id, sequence)
);

-- ============================================================
-- CHECKLIST SUBMISSIONS
-- ============================================================
create table if not exists public.checklist_submissions (
  id          uuid primary key default uuid_generate_v4(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id),
  template_id uuid references public.checklist_templates(id),
  type        text not null check (type in ('pre', 'post')),
  answers     jsonb not null default '{}',
  lat         double precision,
  lng         double precision,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- DRIVER LOCATIONS — latest position per active trip (upsert)
-- ============================================================
create table if not exists public.driver_locations (
  driver_id   uuid primary key references public.profiles(id) on delete cascade,
  trip_id     uuid references public.trips(id) on delete set null,
  lat         double precision not null,
  lng         double precision not null,
  accuracy    double precision,
  speed       double precision,
  heading     double precision,
  recorded_at timestamptz not null default now()
);

-- ============================================================
-- LOCATION HISTORY — breadcrumb trail
-- ============================================================
create table if not exists public.location_history (
  id          uuid primary key default uuid_generate_v4(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id),
  lat         double precision not null,
  lng         double precision not null,
  accuracy    double precision,
  speed       double precision,
  heading     double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists location_history_trip_idx on public.location_history(trip_id, recorded_at);

-- ============================================================
-- ATTACHMENTS (invoice, proof-of-delivery, signature)
-- ============================================================
create table if not exists public.attachments (
  id           uuid primary key default uuid_generate_v4(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  stop_id      uuid references public.trip_stops(id) on delete set null,
  kind         text not null check (kind in ('invoice','pod','signature')),
  storage_path text not null,
  uploaded_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.checklist_templates   enable row level security;
alter table public.trips                 enable row level security;
alter table public.trip_stops            enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.driver_locations      enable row level security;
alter table public.location_history      enable row level security;
alter table public.attachments           enable row level security;

-- Helper: current user's role
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---- profiles ----
create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "Admins read all profiles" on public.profiles
  for select using (public.current_user_role() = 'admin');

create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());

-- ---- checklist_templates ----
create policy "Anyone authenticated reads templates" on public.checklist_templates
  for select using (auth.uid() is not null);

create policy "Admins manage templates" on public.checklist_templates
  for all using (public.current_user_role() = 'admin');

-- ---- trips ----
create policy "Drivers read own trips" on public.trips
  for select using (driver_id = auth.uid());

create policy "Admins manage all trips" on public.trips
  for all using (public.current_user_role() = 'admin');

create policy "Drivers update own trip status" on public.trips
  for update using (driver_id = auth.uid());

-- ---- trip_stops ----
create policy "Drivers read stops for own trips" on public.trip_stops
  for select using (
    trip_id in (select id from public.trips where driver_id = auth.uid())
  );

create policy "Drivers update stops for own trips" on public.trip_stops
  for update using (
    trip_id in (select id from public.trips where driver_id = auth.uid())
  );

create policy "Admins manage all stops" on public.trip_stops
  for all using (public.current_user_role() = 'admin');

-- ---- checklist_submissions ----
create policy "Drivers read own submissions" on public.checklist_submissions
  for select using (driver_id = auth.uid());

create policy "Drivers insert own submissions" on public.checklist_submissions
  for insert with check (driver_id = auth.uid());

create policy "Admins read all submissions" on public.checklist_submissions
  for select using (public.current_user_role() = 'admin');

-- ---- driver_locations ----
create policy "Drivers upsert own location" on public.driver_locations
  for all using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

create policy "Admins read all locations" on public.driver_locations
  for select using (public.current_user_role() = 'admin');

-- ---- location_history ----
create policy "Drivers insert own history" on public.location_history
  for insert with check (driver_id = auth.uid());

create policy "Drivers read own history" on public.location_history
  for select using (driver_id = auth.uid());

create policy "Admins read all history" on public.location_history
  for select using (public.current_user_role() = 'admin');

-- ---- attachments ----
create policy "Drivers insert own attachments" on public.attachments
  for insert with check (
    trip_id in (select id from public.trips where driver_id = auth.uid())
  );

create policy "Drivers read own attachments" on public.attachments
  for select using (
    trip_id in (select id from public.trips where driver_id = auth.uid())
  );

create policy "Admins manage all attachments" on public.attachments
  for all using (public.current_user_role() = 'admin');

-- ============================================================
-- Enable Realtime on driver_locations
-- ============================================================
alter publication supabase_realtime add table public.driver_locations;
alter publication supabase_realtime add table public.trips;
