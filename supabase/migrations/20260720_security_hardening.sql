-- FASE 0 · Endurecimiento de seguridad (avisos de Supabase advisors)
--
-- Cambios idempotentes y de bajo riesgo:
--
--   1) Revocar EXECUTE de las funciones que son de uso interno (triggers /
--      helpers) pero quedaban expuestas como RPC a anon/authenticated vía
--      /rest/v1/rpc. Siguen funcionando como triggers (se ejecutan como owner).
--   2) Crear los índices que faltaban sobre claves foráneas (mejora de
--      rendimiento marcada por el advisor 0001_unindexed_foreign_keys).
--
-- NOTA: la tabla `contact_messages` del plan original NO existe en este
-- proyecto, por lo que su RLS no aplica. La consolidación de policies
-- permisivas duplicadas (services/settings/admin_staff) se deja para una
-- revisión posterior con inspección directa de las policies vigentes.

-- (1) Revocar EXECUTE de funciones internas expuestas como RPC.
revoke execute on function public.notify_gcal_push() from anon, authenticated;
revoke execute on function public.broadcast_booking_change() from anon, authenticated;
revoke execute on function public.find_user_id_by_email(text) from anon, authenticated;

-- (2) Índices sobre claves foráneas sin cubrir.
create index if not exists idx_bookings_service_id on public.bookings(service_id);
create index if not exists idx_bookings_staff_id on public.bookings(staff_id);
create index if not exists idx_schedule_blocks_location_id on public.schedule_blocks(location_id);
create index if not exists idx_admin_staff_location_id on public.admin_staff(location_id);
