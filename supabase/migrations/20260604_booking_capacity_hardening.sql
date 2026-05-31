-- =====================================================================
-- Endurece create_public_booking: la capacidad ahora cuenta TAMBIÉN las
-- citas sin manicurista asignada (altas manuales). Antes, al buscar una
-- "manicurista libre", ignoraba esas citas y permitía superar la capacidad
-- física de la sede (p. ej. 1 cita manual + 2 online con 2 manicuristas).
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
  v_capacity  int;
  v_occupied  int;
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

  -- no bloqueado
  if exists (select 1 from public.schedule_blocks b
      where b.block_date = p_booking_date
        and (b.location_id = p_location_id or b.location_id is null)
        and (b.start_time is null or (b.start_time < v_end and coalesce(b.end_time, time '23:59') > v_start))) then
    raise exception 'SLOT_BLOCKED';
  end if;

  v_capacity := public.get_location_capacity(p_location_id);

  if v_capacity = 0 then
    -- legacy: sin equipo configurado -> 1 cita por slot exacto
    if exists (select 1 from public.bookings
        where location_id = p_location_id and booking_date = p_booking_date
          and booking_time = v_time and status <> 'cancelled') then
      raise exception 'SLOT_TAKEN';
    end if;
  else
    -- unidades ocupadas en el intervalo = manicuristas distintas ocupadas
    -- + citas sin manicurista asignada (cada una consume una unidad).
    select
      count(*) filter (where b.staff_id is null)
      + count(distinct b.staff_id) filter (where b.staff_id is not null)
    into v_occupied
    from public.bookings b
    where b.location_id = p_location_id
      and b.booking_date = p_booking_date
      and b.status <> 'cancelled'
      and b.booking_time::time < v_end
      and (b.booking_time::time + (coalesce(b.duration_minutes, 30) || ' minutes')::interval) > v_start;

    if v_occupied >= v_capacity then
      raise exception 'SLOT_TAKEN';
    end if;

    -- primera manicurista reservable libre en [v_start, v_end)
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
    -- v_staff puede quedar null si la capacidad libre proviene de huecos no
    -- nominales; la cita se inserta sin asignar (cuenta como unidad ocupada).
  end if;

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
