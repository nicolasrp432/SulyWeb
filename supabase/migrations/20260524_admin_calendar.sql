-- Admin calendar support tables
-- Run in Supabase SQL editor before using advanced admin calendar features.

create table if not exists public.bookings_admin_meta (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
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

create index if not exists idx_bookings_admin_meta_status on public.bookings_admin_meta(status);
create index if not exists idx_bookings_admin_meta_assigned_to on public.bookings_admin_meta(assigned_to);

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

alter table public.bookings_admin_meta enable row level security;
alter table public.admin_staff enable row level security;
alter table public.schedule_blocks enable row level security;

-- Policies for bookings_admin_meta
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

-- Policies for admin_staff
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

-- Policies for schedule_blocks
drop policy if exists "allow public read schedule_blocks" on public.schedule_blocks;
create policy "allow public read schedule_blocks"
on public.schedule_blocks
for select
using (true);

drop policy if exists "authenticated can write schedule_blocks" on public.schedule_blocks;
create policy "authenticated can write schedule_blocks"
on public.schedule_blocks
for all
to authenticated
using (true)
with check (true);
