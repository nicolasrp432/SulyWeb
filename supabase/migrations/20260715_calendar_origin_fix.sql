-- Fixes descubiertos al probar la entrada Google -> web (ya aplicados en remoto):
--
-- 1) bookings_origin_check no admitía 'calendar', el origen que usan
--    gcal-webhook (caso 3: evento creado a mano en Google/iPhone) e ics-import.
--    Sin esto, el alta de esas citas violaba el constraint y fallaba en silencio.
alter table public.bookings drop constraint if exists bookings_origin_check;
alter table public.bookings add constraint bookings_origin_check
  check (origin = any (array['online'::text, 'whatsapp'::text, 'presencial'::text, 'admin'::text, 'calendar'::text]));

-- 2) Los eventos de calendario no traen teléfono y client_phone es NOT NULL:
--    con default '' los inserts de las funciones de sync ya no lo violan.
alter table public.bookings alter column client_phone set default '';
