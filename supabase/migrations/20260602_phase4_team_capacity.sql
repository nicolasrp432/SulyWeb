-- =====================================================================
-- Phase 4 — Equipo (capacidad), duración y horarios partidos
-- =====================================================================
-- Introduce el equipo de manicuristas como dimensión de capacidad:
--  * Una hora solo se ocupa cuando TODAS las expertas reservables están
--    ocupadas (auto-asignación por capacidad en la reserva pública).
--  * La disponibilidad respeta la DURACIÓN del servicio.
--  * business_hours pasa a soportar tramos partidos (10-14 / 16-20).
--  * Garantía dura anti-solape vía trigger (cubre RPC pública, alta admin
--    directa y drag-drop del calendario).
-- Totalmente retrocompatible: si no hay equipo configurado, la reserva
-- pública revierte al comportamiento legacy de 1 cita por slot/sede.
-- =====================================================================

-- 0. Backfill services.duration_minutes desde el texto legacy "45 min"
update public.services
set duration_minutes = nullif(regexp_replace(duration, '\D', '', 'g'), '')::int
where duration_minutes is null and duration ~ '\d';

update public.services set duration_minutes = 30
where duration_minutes is null or duration_minutes <= 0;

-- 1. admin_staff -> equipo de manicuristas reservables
alter table public.admin_staff
  add column if not exists location_id    uuid references public.locations(id) on delete set null,
  add column if not exists is_bookable    boolean not null default true,
  add column if not exists avatar_url     text,
  add column if not exists specialty      text,
  add column if not exists display_order  int not null default 0;

-- 2. bookings.staff_id -> manicurista asignada
alter table public.bookings
  add column if not exists staff_id bigint references public.admin_staff(id) on delete set null;

create index if not exists idx_bookings_staff_day
  on public.bookings (location_id, booking_date, staff_id)
  where status <> 'cancelled';

-- 3. Índice único con capacidad: permite 2 expertas a la misma hora,
--    evita doble reserva de la MISMA experta en el mismo inicio.
-- Eliminamos también la constraint UNIQUE plana legacy (location,date,time) que
-- bloqueaba dos citas simultáneas con manicuristas distintas.
alter table public.bookings
  drop constraint if exists bookings_location_id_booking_date_booking_time_key;
drop index if exists public.uq_bookings_active_slot;
create unique index if not exists uq_bookings_active_slot_staff
  on public.bookings (location_id, booking_date, booking_time, staff_id)
  where status <> 'cancelled';

-- 4. Trigger anti-solape (garantía dura, toda vía de entrada)
create or replace function public.check_booking_overlap()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_start time;
  v_end   time;
  v_timing_changed boolean;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  v_start := new.booking_time::time;
  v_end   := new.booking_time::time + (coalesce(new.duration_minutes, 30) || ' minutes')::interval;

  v_timing_changed :=
       tg_op = 'INSERT'
    or new.booking_date     is distinct from old.booking_date
    or new.booking_time     is distinct from old.booking_time
    or new.duration_minutes is distinct from old.duration_minutes
    or new.location_id      is distinct from old.location_id
    or new.staff_id         is distinct from old.staff_id
    or (old.status = 'cancelled' and new.status <> 'cancelled');

  if not v_timing_changed then
    return new;
  end if;

  -- a) misma manicurista solapada
  if new.staff_id is not null then
    if exists (
      select 1 from public.bookings b
      where b.id <> new.id
        and b.staff_id = new.staff_id
        and b.booking_date = new.booking_date
        and b.status <> 'cancelled'
        and (b.booking_time::time) < v_end
        and ((b.booking_time::time) + (coalesce(b.duration_minutes, 30) || ' minutes')::interval) > v_start
    ) then
      raise exception 'STAFF_OVERLAP';
    end if;
  end if;

  -- b) bloqueo de agenda (sede o global) solapado
  if exists (
    select 1 from public.schedule_blocks sb
    where sb.block_date = new.booking_date
      and (sb.location_id = new.location_id or sb.location_id is null)
      and (
        sb.start_time is null
        or (sb.start_time < v_end and coalesce(sb.end_time, time '23:59') > v_start)
      )
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  return new;
end; $$;

-- Es función de trigger: no debe ser invocable como RPC.
revoke all on function public.check_booking_overlap() from public, anon, authenticated;

drop trigger if exists trg_bookings_overlap on public.bookings;
create trigger trg_bookings_overlap
  before insert or update on public.bookings
  for each row execute function public.check_booking_overlap();

-- 5. Horario: tramos del día (soporta esquema nuevo con "shifts" y el viejo open/close)
create or replace function public.get_day_shifts(p_date date)
returns table(open_time time, close_time time)
language plpgsql stable security definer set search_path = public as $$
declare
  v_hours jsonb;
  v_day   jsonb;
  v_key   text;
  v_shift jsonb;
begin
  select value into v_hours from public.settings where key = 'business_hours';
  if v_hours is null then return; end if;

  v_key := (array['sunday','monday','tuesday','wednesday','thursday','friday','saturday'])
             [extract(dow from p_date)::int + 1];
  v_day := v_hours -> v_key;
  if v_day is null then return; end if;
  if coalesce((v_day->>'closed')::boolean, false) then return; end if;

  if (v_day ? 'shifts') and jsonb_typeof(v_day->'shifts') = 'array' then
    for v_shift in select * from jsonb_array_elements(v_day->'shifts') loop
      open_time  := (v_shift->>'open')::time;
      close_time := (v_shift->>'close')::time;
      return next;
    end loop;
  elsif (v_day ? 'open') and (v_day ? 'close') then
    open_time  := (v_day->>'open')::time;
    close_time := (v_day->>'close')::time;
    return next;
  end if;
  return;
end; $$;
revoke all on function public.get_day_shifts(date) from public;
grant execute on function public.get_day_shifts(date) to anon, authenticated;

-- valida que [p_time, p_time+duración) cae dentro de un tramo abierto
create or replace function public.slot_is_within_hours(p_date date, p_time time, p_duration int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.get_day_shifts(p_date) s
    where p_time >= s.open_time
      and (p_time + (p_duration || ' minutes')::interval) <= s.close_time
  );
$$;
revoke all on function public.slot_is_within_hours(date, time, int) from public;
grant execute on function public.slot_is_within_hours(date, time, int) to anon, authenticated;

-- 6. get_booked_slots v2 — ahora con duración y manicurista (sin PII)
drop function if exists public.get_booked_slots(uuid, date);
create or replace function public.get_booked_slots(p_location_id uuid, p_date date)
returns table(booking_time text, duration_minutes int, staff_id bigint)
language sql security definer set search_path = public stable as $$
  select b.booking_time, coalesce(b.duration_minutes, 30), b.staff_id
  from public.bookings b
  where b.booking_date = p_date
    and b.location_id = p_location_id
    and b.status <> 'cancelled';
$$;
revoke all on function public.get_booked_slots(uuid, date) from public;
grant execute on function public.get_booked_slots(uuid, date) to anon, authenticated;

-- 7. Capacidad de la sede (nº de manicuristas reservables)
create or replace function public.get_location_capacity(p_location_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.admin_staff
  where is_active and is_bookable
    and (location_id = p_location_id or location_id is null);
$$;
revoke all on function public.get_location_capacity(uuid) from public;
grant execute on function public.get_location_capacity(uuid) to anon, authenticated;

-- 8. Equipo público (datos seguros para mostrar en la web)
create or replace function public.get_team_public(p_location_id uuid default null)
returns table(id bigint, full_name text, avatar_url text, specialty text, location_id uuid)
language sql stable security definer set search_path = public as $$
  select s.id, s.full_name, s.avatar_url, s.specialty, s.location_id
  from public.admin_staff s
  where s.is_active and s.is_bookable
    and (p_location_id is null or s.location_id = p_location_id or s.location_id is null)
  order by s.display_order, s.full_name;
$$;
revoke all on function public.get_team_public(uuid) from public;
grant execute on function public.get_team_public(uuid) to anon, authenticated;

-- 9. create_public_booking — duración server-side + auto-asignación por capacidad.
--    Firma idéntica (frontend retrocompatible).
create or replace function public.create_public_booking(
  p_location_id uuid, p_booking_date date, p_booking_time text,
  p_client_name text, p_client_phone text, p_client_email text,
  p_notes text, p_service_ids uuid[] default '{}'
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid;
  v_time     text := to_char(p_booking_time::time, 'HH24:MI:SS');
  v_start    time := p_booking_time::time;
  v_duration int;
  v_end      time;
  v_staff    bigint;
  v_capacity int;
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

    if v_staff is null then
      raise exception 'SLOT_TAKEN';
    end if;
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

-- 10. Migrar business_hours al esquema con tramos (solo si aún no está migrado)
update public.settings
set value = (
  select jsonb_object_agg(
    day,
    case
      when coalesce((v->>'closed')::boolean, false)
        then jsonb_build_object('closed', true, 'shifts', '[]'::jsonb)
      else jsonb_build_object('closed', false, 'shifts',
             jsonb_build_array(jsonb_build_object('open', v->>'open', 'close', v->>'close')))
    end
  )
  from jsonb_each(value) as e(day, v)
)
where key = 'business_hours'
  and not ((value -> 'monday') ? 'shifts');

-- 11. Seed de equipo de ejemplo (2 manicuristas por sede) — idempotente
insert into public.admin_staff(full_name, role, is_active, location_id, is_bookable, specialty, display_order)
select v.full_name, 'staff', true, v.loc, true, v.specialty, v.ord
from (values
  ('Suly',   (select id from public.locations where slug = 'basauri'),  'Uñas acrílicas y nail art', 1),
  ('Andrea', (select id from public.locations where slug = 'basauri'),  'Manicura semipermanente',   2),
  ('Lucía',  (select id from public.locations where slug = 'galdakao'), 'Pedicura spa',              1),
  ('Marta',  (select id from public.locations where slug = 'galdakao'), 'Pestañas y cejas',          2)
) as v(full_name, loc, specialty, ord)
on conflict (full_name) do nothing;
