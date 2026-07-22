-- FASE 0 · Endurecimiento de create_public_booking
--
-- Se reescribe la RPC pública de reserva (sobre la versión single-capacity de
-- 20260607_single_capacity_realtime.sql) añadiendo tres garantías:
--
--   1) PAST_SLOT — rechaza fechas/horas ya pasadas (hora de Europe/Madrid).
--      Antes se podía reservar una hora que ya había pasado hoy.
--   2) Bloqueo de concurrencia (advisory lock por sede+día) alrededor de la
--      comprobación de solape, para eliminar la carrera en la que dos reservas
--      simultáneas con horas de inicio distintas pero solapadas pasaban ambas
--      el EXISTS bajo READ COMMITTED.
--   3) Traducción de la violación de índice único (23505) a 'SLOT_TAKEN', para
--      que el cliente muestre "esa hora se acaba de ocupar" en vez de un error
--      genérico.
--
-- No cambia la firma ni el comportamiento del camino feliz.

create or replace function public.create_public_booking(
  p_location_id uuid,
  p_booking_date date,
  p_booking_time text,
  p_client_name text,
  p_client_phone text,
  p_client_email text,
  p_notes text,
  p_service_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id        uuid;
  v_time      text := to_char(p_booking_time::time, 'HH24:MI:SS');
  v_start     time := p_booking_time::time;
  v_duration  int;
  v_end       time;
  v_staff     bigint;
  v_now_local timestamp := (now() at time zone 'Europe/Madrid');
begin
  if p_client_name  is null or length(trim(p_client_name))  = 0 then raise exception 'NAME_REQUIRED'; end if;
  if p_client_phone is null or length(trim(p_client_phone)) = 0 then raise exception 'PHONE_REQUIRED'; end if;
  if p_location_id  is null or p_booking_date is null then raise exception 'LOCATION_DATE_REQUIRED'; end if;

  -- (1) No permitir reservar en el pasado (hora local del salón).
  if (p_booking_date + v_start) < v_now_local then
    raise exception 'PAST_SLOT';
  end if;

  select coalesce(sum(coalesce(duration_minutes, 30)), 30) into v_duration
  from public.services where id = any(p_service_ids);
  if v_duration is null or v_duration <= 0 then v_duration := 30; end if;
  v_end := v_start + (v_duration || ' minutes')::interval;

  if not public.slot_is_within_hours(p_booking_date, v_start, v_duration) then
    raise exception 'OUTSIDE_HOURS';
  end if;

  -- (2) Serializar las reservas de la misma sede y día para cerrar la carrera
  -- entre la comprobación de solape y el insert.
  perform pg_advisory_xact_lock(hashtext(p_location_id::text || '|' || p_booking_date::text)::bigint);

  if exists (select 1 from public.schedule_blocks b
      where b.block_date = p_booking_date
        and (b.location_id = p_location_id or b.location_id is null)
        and (b.start_time is null or (b.start_time < v_end and coalesce(b.end_time, time '23:59') > v_start))) then
    raise exception 'SLOT_BLOCKED';
  end if;

  -- SINGLE-CAPACITY: ocupada si existe cualquier cita no cancelada que solape
  if exists (
    select 1 from public.bookings b
    where b.location_id = p_location_id
      and b.booking_date = p_booking_date
      and b.status <> 'cancelled'
      and b.booking_time::time < v_end
      and (b.booking_time::time + (coalesce(b.duration_minutes, 30) || ' minutes')::interval) > v_start
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  -- Auto-asignar la primera manicurista reservable libre (solo para registro/agenda)
  select s.id into v_staff
  from public.admin_staff s
  where s.is_active and s.is_bookable
    and (s.location_id = p_location_id or s.location_id is null)
    and not exists (
      select 1 from public.bookings b
      where b.staff_id = s.id
        and b.booking_date = p_booking_date
        and b.status <> 'cancelled'
        and b.booking_time::time < v_end
        and (b.booking_time::time + (coalesce(b.duration_minutes, 30) || ' minutes')::interval) > v_start
    )
  order by s.display_order, s.id
  limit 1;

  -- (3) Si el índice único de slot salta pese a las comprobaciones (carrera
  -- extrema), devolver SLOT_TAKEN en vez del error genérico 23505.
  begin
    insert into public.bookings(location_id, booking_date, booking_time, client_name, client_phone,
                                client_email, notes, status, origin, duration_minutes, staff_id)
    values (p_location_id, p_booking_date, v_time, trim(p_client_name), trim(p_client_phone),
            nullif(p_client_email, ''), nullif(p_notes, ''), 'confirmed', 'online', v_duration, v_staff)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'SLOT_TAKEN';
  end;

  if array_length(p_service_ids, 1) is not null then
    insert into public.booking_services(booking_id, service_id) select v_id, unnest(p_service_ids);
  end if;

  return v_id;
end; $function$;
