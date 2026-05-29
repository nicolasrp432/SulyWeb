-- =====================================================================
-- Phase 1 — Foundation (APPLIED)
-- Consolidates the booking model, fixes the broken admin RLS (no UPDATE/
-- DELETE policy existed → every admin edit failed silently), adds a real
-- settings store, prevents double-booking, and adds a public booking RPC.
--
-- Fully backward compatible: the currently deployed (public) frontend keeps
-- working. The customer-PII lockdown is intentionally split into the
-- companion file 20260529_phase1b_pii_lockdown.sql, to be applied together
-- with the new frontend deploy (see notes there).
-- =====================================================================

-- 1. Normalize booking_time to a single canonical format (HH24:MI:SS)
update public.bookings
set booking_time = to_char(booking_time::time, 'HH24:MI:SS')
where booking_time !~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$';

-- 2. Consolidate admin metadata onto the bookings table (single source of truth)
alter table public.bookings
  add column if not exists assigned_to text,
  add column if not exists duration_minutes integer not null default 30,
  add column if not exists appointment_type text;

-- Email is optional in the booking UX — align the column with that.
alter table public.bookings alter column client_email drop not null;

-- Backfill any data that may already live in bookings_admin_meta (legacy)
update public.bookings b
set status           = coalesce(m.status, b.status),
    assigned_to      = coalesce(m.assigned_to, b.assigned_to),
    duration_minutes = coalesce(m.duration_minutes, b.duration_minutes),
    appointment_type = coalesce(m.appointment_type, b.appointment_type),
    notes_admin      = coalesce(b.notes_admin, m.internal_notes)
from public.bookings_admin_meta m
where m.booking_id = b.id;

-- 3. Constraints
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending','confirmed','rescheduled','cancelled','completed','no_show'));

alter table public.bookings drop constraint if exists bookings_duration_check;
alter table public.bookings add constraint bookings_duration_check
  check (duration_minutes > 0);

alter table public.bookings drop constraint if exists bookings_origin_check;
alter table public.bookings add constraint bookings_origin_check
  check (origin in ('online','whatsapp','presencial','admin'));

-- 4. Anti double-booking: one active appointment per slot/location
create unique index if not exists uq_bookings_active_slot
  on public.bookings (location_id, booking_date, booking_time)
  where status <> 'cancelled';

-- 5. settings table (key/value json) — single config store used by web + admin
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (true) with check (true);

insert into public.settings(key, value)
values ('business_hours', '{
  "monday":    {"open":"10:00","close":"20:00","closed":false},
  "tuesday":   {"open":"10:00","close":"20:00","closed":false},
  "wednesday": {"open":"10:00","close":"20:00","closed":false},
  "thursday":  {"open":"10:00","close":"20:00","closed":false},
  "friday":    {"open":"10:00","close":"20:00","closed":false},
  "saturday":  {"open":"10:00","close":"17:00","closed":false},
  "sunday":    {"open":"10:00","close":"20:00","closed":true}
}'::jsonb)
on conflict (key) do nothing;

-- 6. Harden the shared updated_at trigger (security advisor: mutable search_path)
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at before update on public.settings
for each row execute function public.set_updated_at();

-- 7. THE CRITICAL FIX — add the missing UPDATE/DELETE policies on bookings so
--    admins can actually change status, reschedule, edit and cancel.
drop policy if exists "bookings admin update" on public.bookings;
create policy "bookings admin update" on public.bookings
  for update to authenticated using (true) with check (true);

drop policy if exists "bookings admin delete" on public.bookings;
create policy "bookings admin delete" on public.bookings
  for delete to authenticated using (true);

-- 8. booking_services — let authenticated admins read/write (previously there
--    was no SELECT policy, so the admin calendar could not show services).
drop policy if exists "booking_services admin all" on public.booking_services;
create policy "booking_services admin all" on public.booking_services
  for all to authenticated using (true) with check (true);

-- 9. Public availability — SECURITY DEFINER function (documented Supabase
--    pattern) exposing ONLY slot occupancy for a location/date, never PII.
drop view if exists public.booked_slots;
create or replace function public.get_booked_slots(p_location_id uuid, p_date date)
returns table(booking_time text)
language sql security definer set search_path = public stable as $$
  select b.booking_time
  from public.bookings b
  where b.booking_date = p_date
    and b.location_id = p_location_id
    and b.status <> 'cancelled';
$$;
revoke all on function public.get_booked_slots(uuid, date) from public;
grant execute on function public.get_booked_slots(uuid, date) to anon, authenticated;

-- 10. Public booking RPC — atomic creation with server-side conflict & block
--     validation. Lets the new frontend book without direct table access.
create or replace function public.create_public_booking(
  p_location_id uuid, p_booking_date date, p_booking_time text,
  p_client_name text, p_client_phone text, p_client_email text,
  p_notes text, p_service_ids uuid[] default '{}'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_time text := to_char(p_booking_time::time, 'HH24:MI:SS');
begin
  if p_client_name is null or length(trim(p_client_name)) = 0 then raise exception 'NAME_REQUIRED'; end if;
  if p_client_phone is null or length(trim(p_client_phone)) = 0 then raise exception 'PHONE_REQUIRED'; end if;
  if p_location_id is null or p_booking_date is null then raise exception 'LOCATION_DATE_REQUIRED'; end if;

  if exists (select 1 from public.bookings
      where location_id = p_location_id and booking_date = p_booking_date
        and booking_time = v_time and status <> 'cancelled') then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (select 1 from public.schedule_blocks b
      where b.block_date = p_booking_date
        and (b.location_id = p_location_id or b.location_id is null)
        and (b.start_time is null or (v_time::time >= b.start_time and v_time::time < coalesce(b.end_time, time '23:59')))) then
    raise exception 'SLOT_BLOCKED';
  end if;

  insert into public.bookings(location_id, booking_date, booking_time, client_name, client_phone, client_email, notes, status, origin)
  values (p_location_id, p_booking_date, v_time, trim(p_client_name), trim(p_client_phone), nullif(p_client_email, ''), nullif(p_notes, ''), 'confirmed', 'online')
  returning id into v_id;

  if array_length(p_service_ids, 1) is not null then
    insert into public.booking_services(booking_id, service_id) select v_id, unnest(p_service_ids);
  end if;

  return v_id;
end;
$$;
grant execute on function public.create_public_booking(uuid, date, text, text, text, text, text, uuid[]) to anon, authenticated;
