-- =====================================================================
-- Importación masiva desde un calendario iCloud (.ics público)
-- =====================================================================
-- La Edge Function `ics-import` trae las citas ya existentes en el
-- calendario iCloud del equipo (enlace público webcal://...) y las
-- upserta en `bookings`. `ics_uid` guarda el UID del VEVENT para que
-- re-ejecutar la importación sea idempotente (no duplica citas).
-- =====================================================================

alter table public.bookings
  add column if not exists ics_uid text;

create unique index if not exists bookings_ics_uid_key
  on public.bookings (ics_uid)
  where ics_uid is not null;

comment on column public.bookings.ics_uid is
  'UID del VEVENT de origen cuando la cita se importó de un calendario .ics (iCloud)';
