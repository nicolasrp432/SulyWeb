-- Pre-production RLS hardening.
-- Replaces permissive `USING (true)/WITH CHECK (true)` admin-write policies with
-- public.is_admin_active(), and removes redundant anon/public direct-insert policies
-- (public bookings go through the SECURITY DEFINER function create_public_booking, which
-- bypasses RLS, so these were an unnecessary spam vector).

-- bookings: remove public direct insert; gate admin writes to active admins.
drop policy if exists "Users can insert their own bookings." on public.bookings;

drop policy if exists "bookings admin insert" on public.bookings;
create policy "bookings admin insert" on public.bookings
  for insert to authenticated with check (public.is_admin_active());

drop policy if exists "bookings admin update" on public.bookings;
create policy "bookings admin update" on public.bookings
  for update to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

drop policy if exists "bookings admin delete" on public.bookings;
create policy "bookings admin delete" on public.bookings
  for delete to authenticated using (public.is_admin_active());

-- booking_services: remove anon insert; gate admin writes.
drop policy if exists "allow_anon_insert" on public.booking_services;
drop policy if exists "booking_services admin all" on public.booking_services;
create policy "booking_services admin all" on public.booking_services
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

-- admin_staff
drop policy if exists "authenticated can write admin_staff" on public.admin_staff;
create policy "authenticated can write admin_staff" on public.admin_staff
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

-- bookings_admin_meta
drop policy if exists "authenticated can write bookings_admin_meta" on public.bookings_admin_meta;
create policy "authenticated can write bookings_admin_meta" on public.bookings_admin_meta
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

-- schedule_blocks
drop policy if exists "authenticated can write schedule_blocks" on public.schedule_blocks;
create policy "authenticated can write schedule_blocks" on public.schedule_blocks
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

-- settings
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());

-- salon_settings: unused by the app and had RLS enabled with no policy. Add an
-- explicit active-admin-only policy to clear the linter and keep it usable.
drop policy if exists "salon_settings admin all" on public.salon_settings;
create policy "salon_settings admin all" on public.salon_settings
  for all to authenticated using (public.is_admin_active()) with check (public.is_admin_active());
