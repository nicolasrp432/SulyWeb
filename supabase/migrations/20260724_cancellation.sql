-- FASE 3 · Cancelación pública, política configurable y contador de no-shows
--
-- - Cada cita tiene un `cancellation_token` (uuid) para gestionarla desde un
--   enlace público sin exponer datos personales.
-- - RPCs PII-safe (grant anon) para ver y cancelar una cita por token,
--   respetando la antelación mínima configurable (settings).
-- - Trigger que mantiene `customers.no_show_count` al marcar/desmarcar no_show.

-- ── columnas de cancelación ─────────────────────────────────────────────────
alter table public.bookings add column if not exists cancellation_token uuid not null default gen_random_uuid();
alter table public.bookings add column if not exists cancelled_at timestamptz;
alter table public.bookings add column if not exists cancelled_by text;
alter table public.bookings add column if not exists cancellation_reason text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_cancelled_by_check') then
    alter table public.bookings add constraint bookings_cancelled_by_check
      check (cancelled_by is null or cancelled_by in ('client', 'admin'));
  end if;
end $$;

create unique index if not exists bookings_cancellation_token_key on public.bookings(cancellation_token);

-- ── política de cancelación (settings) ──────────────────────────────────────
insert into public.settings(key, value) values
  ('cancellation_min_hours', to_jsonb(24)),
  ('cancellation_policy_text', to_jsonb('Puedes cancelar tu cita online hasta 24 horas antes. Para cambios o cancelaciones con menos antelación, escríbenos por WhatsApp.'::text))
on conflict (key) do nothing;

-- ── RPC: ver una cita por token (sin PII sensible) ──────────────────────────
create or replace function public.get_public_booking(p_token uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_min int := coalesce((select (value #>> '{}')::int from public.settings where key = 'cancellation_min_hours'), 24);
  r record;
begin
  select b.id, b.booking_date, b.booking_time, b.status, b.client_name, l.name as location_name
    into r
  from public.bookings b
  left join public.locations l on l.id = b.location_id
  where b.cancellation_token = p_token;
  if not found then return null; end if;

  return json_build_object(
    'date', r.booking_date,
    'time', to_char(r.booking_time::time, 'HH24:MI'),
    'location', r.location_name,
    'status', r.status,
    'first_name', split_part(coalesce(r.client_name, ''), ' ', 1),
    'reference', upper(substr(r.id::text, 1, 8)),
    'services', (select coalesce(json_agg(s.name order by s.name), '[]'::json)
                 from public.booking_services bs join public.services s on s.id = bs.service_id
                 where bs.booking_id = r.id),
    'deadline_hours', v_min,
    'can_cancel', (r.status in ('pending', 'confirmed')
      and (r.booking_date + r.booking_time::time) > ((now() at time zone 'Europe/Madrid') + (v_min || ' hours')::interval))
  );
end $$;

-- ── RPC: cancelar por token (respeta la antelación mínima) ──────────────────
create or replace function public.cancel_public_booking(p_token uuid, p_reason text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_min int := coalesce((select (value #>> '{}')::int from public.settings where key = 'cancellation_min_hours'), 24);
  r record;
begin
  select * into r from public.bookings where cancellation_token = p_token;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.status = 'cancelled' then return json_build_object('ok', true, 'already', true); end if;
  if r.status not in ('pending', 'confirmed') then raise exception 'NOT_CANCELLABLE'; end if;
  if (r.booking_date + r.booking_time::time) <= ((now() at time zone 'Europe/Madrid') + (v_min || ' hours')::interval) then
    raise exception 'TOO_LATE';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'client',
         cancellation_reason = nullif(p_reason, '')
   where id = r.id;

  return json_build_object('ok', true);
end $$;

revoke all on function public.get_public_booking(uuid) from public;
revoke all on function public.cancel_public_booking(uuid, text) from public;
grant execute on function public.get_public_booking(uuid) to anon, authenticated;
grant execute on function public.cancel_public_booking(uuid, text) to anon, authenticated;

-- ── contador de no-shows en customers ───────────────────────────────────────
create or replace function public.bump_no_show()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if NEW.customer_id is null then return NEW; end if;
  if NEW.status = 'no_show' and coalesce(OLD.status, '') <> 'no_show' then
    update public.customers set no_show_count = no_show_count + 1 where id = NEW.customer_id;
  elsif coalesce(OLD.status, '') = 'no_show' and NEW.status <> 'no_show' then
    update public.customers set no_show_count = greatest(0, no_show_count - 1) where id = NEW.customer_id;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_bump_no_show on public.bookings;
create trigger trg_bump_no_show
  after update of status on public.bookings
  for each row execute function public.bump_no_show();
