-- Admin calendar support tables
-- Run in Supabase SQL editor before using advanced admin calendar features.

create table if not exists public.bookings_admin_meta (
  booking_id bigint primary key references public.bookings(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','rescheduled','cancelled','completed','no_show')),
  assigned_to text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  appointment_type text,
  internal_notes text,
  source text not null default 'web' check (source in ('web','phone','whatsapp','admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_staff (
  id bigint generated always as identity primary key,
  full_name text not null unique,
  role text not null default 'staff' check (role in ('admin','receptionist','readonly','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_time_blocks (
  id bigint generated always as identity primary key,
  location_id bigint references public.locations(id) on delete set null,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  is_available boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_time > start_time)
);

create index if not exists idx_bookings_admin_meta_status on public.bookings_admin_meta(status);
create index if not exists idx_bookings_admin_meta_assigned_to on public.bookings_admin_meta(assigned_to);
create index if not exists idx_admin_time_blocks_date on public.admin_time_blocks(block_date);
create index if not exists idx_admin_time_blocks_location_date on public.admin_time_blocks(location_id, block_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_bookings_admin_meta_updated_at on public.bookings_admin_meta;
create trigger trg_bookings_admin_meta_updated_at
before update on public.bookings_admin_meta
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_staff_updated_at on public.admin_staff;
create trigger trg_admin_staff_updated_at
before update on public.admin_staff
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_time_blocks_updated_at on public.admin_time_blocks;
create trigger trg_admin_time_blocks_updated_at
before update on public.admin_time_blocks
for each row execute function public.set_updated_at();

alter table public.bookings_admin_meta enable row level security;
alter table public.admin_staff enable row level security;
alter table public.admin_time_blocks enable row level security;

drop policy if exists "authenticated can read bookings_admin_meta" on public.bookings_admin_meta;
create policy "authenticated can read bookings_admin_meta"
on public.bookings_admin_meta
for select
to authenticated
using (true);

drop policy if exists "authenticated can write bookings_admin_meta" on public.bookings_admin_meta;
create policy "authenticated can write bookings_admin_meta"
on public.bookings_admin_meta
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can read admin_staff" on public.admin_staff;
create policy "authenticated can read admin_staff"
on public.admin_staff
for select
to authenticated
using (true);

drop policy if exists "authenticated can write admin_staff" on public.admin_staff;
create policy "authenticated can write admin_staff"
on public.admin_staff
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can read admin_time_blocks" on public.admin_time_blocks;
create policy "authenticated can read admin_time_blocks"
on public.admin_time_blocks
for select
to authenticated
using (true);

drop policy if exists "authenticated can write admin_time_blocks" on public.admin_time_blocks;
create policy "authenticated can write admin_time_blocks"
on public.admin_time_blocks
for all
to authenticated
using (true)
with check (true);

