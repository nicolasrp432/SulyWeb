-- =====================================================================
-- Phase 1b — Customer PII lockdown  (⚠️ DEPLOY-TIME, NOT YET APPLIED)
--
-- This removes the public (anon) ability to read/insert the bookings table
-- directly. After this runs, anonymous clients can ONLY:
--   • read availability via get_booked_slots(location, date)  — no PII
--   • create a booking via create_public_booking(...)          — atomic
-- and authenticated admins keep full access.
--
-- WHY IT IS SEPARATE: the frontend currently in production still reads/inserts
-- bookings directly. Applying this BEFORE the new frontend (which uses the RPC
-- + get_booked_slots) is deployed would break public booking on the live site.
--
-- HOW TO CUT OVER:
--   1. Deploy the new frontend (this branch) to production.
--   2. Immediately run this migration in the Supabase SQL editor / CLI.
--   3. Verify: public booking still works; bookings are no longer readable
--      with the anon key (customer PII protected — GDPR).
-- =====================================================================

-- Lock down direct bookings access to authenticated admins only.
drop policy if exists "Bookings are viewable by everyone." on public.bookings;
drop policy if exists "Users can insert their own bookings." on public.bookings;

drop policy if exists "bookings admin read" on public.bookings;
create policy "bookings admin read" on public.bookings
  for select to authenticated using (true);

drop policy if exists "bookings admin insert" on public.bookings;
create policy "bookings admin insert" on public.bookings
  for insert to authenticated with check (true);

-- Public no longer inserts booking_services directly (the RPC does it server-side).
drop policy if exists allow_anon_insert on public.booking_services;
