-- FASE 2 · Base del CRM: tabla `customers`, deduplicación y vínculo con bookings
--
-- - `normalize_phone()`: normaliza a 9 dígitos españoles (6/7/8/9) o NULL.
-- - Tabla `customers` (RLS solo admin) con índice único por teléfono normalizado.
-- - `bookings.customer_id` + backfill deduplicado desde las citas existentes
--   (incluida la extracción del teléfono embebido en el nombre de las citas
--   importadas de iCloud, p. ej. "Pili manos 635200552").
-- - Trigger `link_booking_customer` que vincula/crea el cliente en cada alta.
-- - `services.price_cents` para poder sumar el gasto por cliente.
--
-- El backfill hace un UPDATE masivo sobre `bookings`; se desactivan durante la
-- carga los triggers de sync/solape/broadcast para no disparar 150
-- sincronizaciones a Google ni fallar por solapes preexistentes (citas de
-- iCloud a la misma hora). Solo se escribe `customer_id`.

-- ── normalize_phone ─────────────────────────────────────────────────────────
create or replace function public.normalize_phone(p text)
returns text language sql immutable as $$
  select case when d ~ '^[6789][0-9]{8}$' then d else null end
  from (
    select case when length(raw) >= 9 then right(raw, 9) else raw end as d
    from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as raw) r
  ) t
$$;

-- ── tabla customers ─────────────────────────────────────────────────────────
create table if not exists public.customers (
  id                uuid primary key default gen_random_uuid(),
  full_name         text,
  phone_normalized  text,
  phone_display     text,
  email             text,
  birthday          date,
  notes             text,
  preferences       text,
  no_show_count     int not null default 0,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists customers_phone_key
  on public.customers(phone_normalized)
  where phone_normalized is not null and deleted_at is null;
create index if not exists idx_customers_email on public.customers(lower(email));

alter table public.customers enable row level security;
drop policy if exists "customers admin all" on public.customers;
create policy "customers admin all" on public.customers
  for all to authenticated
  using (public.is_admin_active()) with check (public.is_admin_active());

-- ── vínculo en bookings ─────────────────────────────────────────────────────
alter table public.bookings add column if not exists customer_id uuid references public.customers(id);
create index if not exists idx_bookings_customer_id on public.bookings(customer_id);

-- ── backfill deduplicado ────────────────────────────────────────────────────
-- Identidad en cascada: teléfono normalizado (de client_phone o extraído del
-- nombre) -> email -> nombre. Gana el dato más reciente por created_at.
alter table public.bookings disable trigger trg_notify_gcal_push;
alter table public.bookings disable trigger trg_bookings_overlap;
alter table public.bookings disable trigger trg_bookings_broadcast;

create temp table _cust_map on commit drop as
with base as (
  select
    b.id as booking_id,
    b.created_at,
    b.client_name,
    nullif(b.client_phone, '') as client_phone,
    nullif(lower(trim(b.client_email)), '') as email_n,
    coalesce(
      public.normalize_phone(nullif(b.client_phone, '')),
      public.normalize_phone(substring(regexp_replace(coalesce(b.client_name, ''), '\s', '', 'g') from '[6789][0-9]{8}'))
    ) as phone_n
  from public.bookings b
)
select
  booking_id, created_at, client_name, client_phone, email_n, phone_n,
  coalesce('p:' || phone_n, 'e:' || email_n, 'n:' || nullif(lower(trim(client_name)), ''), 'id:' || booking_id::text) as ident
from base;

-- customers agregados por identidad (con columna temporal _ident para mapear).
alter table public.customers add column if not exists _ident text;

insert into public.customers (full_name, phone_normalized, phone_display, email, _ident)
select
  (array_agg(client_name order by created_at desc nulls last))[1] as full_name,
  max(phone_n) as phone_normalized,
  (array_agg(client_phone order by created_at desc nulls last) filter (where client_phone is not null))[1] as phone_display,
  (array_agg(email_n order by created_at desc nulls last) filter (where email_n is not null))[1] as email,
  ident
from _cust_map
group by ident;

update public.bookings b
set customer_id = c.id
from public.customers c
join _cust_map m on m.ident = c._ident
where b.id = m.booking_id;

alter table public.customers drop column _ident;

alter table public.bookings enable trigger trg_notify_gcal_push;
alter table public.bookings enable trigger trg_bookings_overlap;
alter table public.bookings enable trigger trg_bookings_broadcast;

-- ── trigger de vínculo para altas futuras ───────────────────────────────────
create or replace function public.link_booking_customer()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_phone text;
  v_email text;
  v_name  text;
  v_cust  uuid;
begin
  v_phone := coalesce(
    public.normalize_phone(nullif(NEW.client_phone, '')),
    public.normalize_phone(substring(regexp_replace(coalesce(NEW.client_name, ''), '\s', '', 'g') from '[6789][0-9]{8}'))
  );
  v_email := nullif(lower(trim(NEW.client_email)), '');
  v_name  := nullif(lower(trim(NEW.client_name)), '');

  if v_phone is not null then
    select id into v_cust from public.customers where phone_normalized = v_phone and deleted_at is null limit 1;
  elsif v_email is not null then
    select id into v_cust from public.customers where lower(email) = v_email and deleted_at is null limit 1;
  elsif v_name is not null then
    select id into v_cust from public.customers
      where lower(trim(full_name)) = v_name and phone_normalized is null and email is null and deleted_at is null
      limit 1;
  end if;

  if v_cust is null and (v_phone is not null or v_email is not null or v_name is not null) then
    insert into public.customers(full_name, phone_normalized, phone_display, email)
    values (NEW.client_name, v_phone, nullif(NEW.client_phone, ''), nullif(NEW.client_email, ''))
    returning id into v_cust;
  end if;

  NEW.customer_id := v_cust;
  return NEW;
end $$;

drop trigger if exists trg_link_booking_customer on public.bookings;
create trigger trg_link_booking_customer
  before insert or update of client_phone, client_email, client_name on public.bookings
  for each row execute function public.link_booking_customer();

-- ── precios numéricos en services ───────────────────────────────────────────
alter table public.services add column if not exists price_cents integer;
update public.services
set price_cents = round(replace(regexp_replace(price, '[^0-9,]', '', 'g'), ',', '.')::numeric * 100)
where price_cents is null
  and price is not null
  and regexp_replace(price, '[^0-9,]', '', 'g') ~ '^[0-9]+(,[0-9]+)?$';
