-- FASE 3 · create_public_booking devuelve {booking_id, cancellation_token}
--
-- Cambia el tipo de retorno de uuid a json para que el frontend pueda mostrar
-- en la pantalla de éxito el enlace de autogestión /cita/:token. Mantiene toda
-- la lógica de guardas de 20260720_booking_guards.sql (PAST_SLOT, advisory
-- lock, traducción de 23505 a SLOT_TAKEN).

drop function if exists public.create_public_booking(uuid, date, text, text, text, text, text, uuid[]);

create function public.create_public_booking(
  p_location_id uuid,
  p_booking_date date,
  p_booking_time text,
  p_client_name text,
  p_client_phone text,
  p_client_email text,
  p_notes text,
  p_service_ids uuid[] default '{}'::uuid[]
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id        uuid;
  v_token     uuid;
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

  perform pg_advisory_xact_lock(hashtext(p_location_id::text || '|' || p_booking_date::text)::bigint);

  if exists (select 1 from public.schedule_blocks b
      where b.block_date = p_booking_date
        and (b.location_id = p_location_id or b.location_id is null)
        and (b.start_time is null or (b.start_time < v_end and coalesce(b.end_time, time '23:59') > v_start))) then
    raise exception 'SLOT_BLOCKED';
  end if;

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

  begin
    insert into public.bookings(location_id, booking_date, booking_time, client_name, client_phone,
                                client_email, notes, status, origin, duration_minutes, staff_id)
    values (p_location_id, p_booking_date, v_time, trim(p_client_name), trim(p_client_phone),
            nullif(p_client_email, ''), nullif(p_notes, ''), 'confirmed', 'online', v_duration, v_staff)
    returning id, cancellation_token into v_id, v_token;
  exception when unique_violation then
    raise exception 'SLOT_TAKEN';
  end;

  if array_length(p_service_ids, 1) is not null then
    insert into public.booking_services(booking_id, service_id) select v_id, unnest(p_service_ids);
  end if;

  return json_build_object('booking_id', v_id, 'cancellation_token', v_token);
end; $function$;

revoke all on function public.create_public_booking(uuid, date, text, text, text, text, text, uuid[]) from public;
grant execute on function public.create_public_booking(uuid, date, text, text, text, text, text, uuid[]) to anon, authenticated;
