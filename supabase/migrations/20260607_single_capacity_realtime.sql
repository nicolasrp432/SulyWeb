-- =====================================================================
-- Single-capacity + Realtime broadcast de disponibilidad
-- =====================================================================
-- 1) create_public_booking pasa a SINGLE-CAPACITY: una hora se considera
--    ocupada en cuanto exista CUALQUIER cita no cancelada que solape el
--    intervalo en esa sede (independiente de la manicurista). Evita que dos
--    clientes tomen la misma hora. Se mantiene la auto-asignación de staff_id
--    (primera manicurista reservable libre) solo a efectos de registro/agenda.
-- 2) Trigger que emite un broadcast público (sin PII) al topic
--    'slots:<location_id>' en cada cambio de bookings, para que el calendario
--    público (clientes anónimos, sin acceso RLS a bookings) se actualice en
--    tiempo real.
-- =====================================================================

create or replace function public.create_public_booking(
  p_location_id uuid, p_booking_date date, p_booking_time text,
  p_client_name text, p_client_phone text, p_client_email text,
  p_notes text, p_service_ids uuid[] default '{}'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid;
  v_time      text := to_char(p_booking_time::time, 'HH24:MI:SS');
  v_start     time := p_booking_time::time;
  v_duration  int;
  v_end       time;
  v_staff     bigint;
begin
  if p_client_name  is null or length(trim(p_client_name))  = 0 then raise exception 'NAME_REQUIRED'; end if;
  if p_client_phone is null or length(trim(p_client_phone)) = 0 then raise exception 'PHONE_REQUIRED'; end if;
  if p_location_id  is null or p_booking_date is null then raise exception 'LOCATION_DATE_REQUIRED'; end if;

  -- duración total a partir de los servicios seleccionados (fallback 30)
  select coalesce(sum(coalesce(duration_minutes, 30)), 30) into v_duration
  from public.services where id = any(p_service_ids);
  if v_duration is null or v_duration <= 0 then v_duration := 30; end if;
  v_end := v_start + (v_duration || ' minutes')::interval;

  -- dentro del horario (tramos)
  if not public.slot_is_within_hours(p_booking_date, v_start, v_duration) then
    raise exception 'OUTSIDE_HOURS';
  end if;

  -- no bloqueado por agenda
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

  insert into public.bookings(location_id, booking_date, booking_time, client_name, client_phone,
                              client_email, notes, status, origin, duration_minutes, staff_id)
  values (p_location_id, p_booking_date, v_time, trim(p_client_name), trim(p_client_phone),
          nullif(p_client_email, ''), nullif(p_notes, ''), 'confirmed', 'online', v_duration, v_staff)
  returning id into v_id;

  if array_length(p_service_ids, 1) is not null then
    insert into public.booking_services(booking_id, service_id) select v_id, unnest(p_service_ids);
  end if;

  return v_id;
end; $$;
grant execute on function public.create_public_booking(uuid, date, text, text, text, text, text, uuid[]) to anon, authenticated;

-- =====================================================================
-- Broadcast de cambios de disponibilidad (sin exponer PII)
-- =====================================================================
create or replace function public.broadcast_booking_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  rec := coalesce(new, old);

  perform realtime.send(
    jsonb_build_object('location_id', rec.location_id, 'date', rec.booking_date),
    'slots_changed',
    'slots:' || rec.location_id::text,
    false  -- topic público: recibible por clientes anónimos, sin RLS
  );

  -- Si en un UPDATE cambió la sede o la fecha, notificar también el origen
  if tg_op = 'UPDATE'
     and (old.location_id is distinct from new.location_id
          or old.booking_date is distinct from new.booking_date) then
    perform realtime.send(
      jsonb_build_object('location_id', old.location_id, 'date', old.booking_date),
      'slots_changed',
      'slots:' || old.location_id::text,
      false
    );
  end if;

  return null;
end; $$;

drop trigger if exists trg_bookings_broadcast on public.bookings;
create trigger trg_bookings_broadcast
  after insert or update or delete on public.bookings
  for each row execute function public.broadcast_booking_change();
