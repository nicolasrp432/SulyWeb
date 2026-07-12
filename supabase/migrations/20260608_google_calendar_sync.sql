-- =====================================================================
-- Sincronización bidireccional con Google Calendar (agenda del iPhone)
-- =====================================================================
-- Añade a `bookings` las columnas de enlace/estado de sincronización, una
-- tabla `calendar_sync_state` para el syncToken y el canal `watch` de Google,
-- y un trigger que notifica a la Edge Function `gcal-push` (app -> Google)
-- en cada cambio de bookings.
--
-- Prevención de bucles: `sync_hash` guarda el hash del contenido sincronizable.
-- El push se omite cuando el hash actual ya coincide con `sync_hash` (es decir,
-- el cambio vino de Google y ya está reflejado). Ver docs/google-calendar-sync.md
-- =====================================================================

-- 1) Columnas de sincronización en bookings -----------------------------------
alter table public.bookings
  add column if not exists google_event_id   text,
  add column if not exists sync_origin        text not null default 'app',  -- 'app' | 'google'
  add column if not exists sync_hash          text,
  add column if not exists last_synced_at     timestamptz;

create unique index if not exists bookings_google_event_id_key
  on public.bookings (google_event_id)
  where google_event_id is not null;

comment on column public.bookings.google_event_id is 'ID del evento espejo en Google Calendar';
comment on column public.bookings.sync_origin     is 'Origen de la última escritura: app | google';
comment on column public.bookings.sync_hash       is 'Hash del contenido sincronizado (anti-bucle)';

-- 2) Estado de sincronización (syncToken + canal watch) -----------------------
create table if not exists public.calendar_sync_state (
  calendar_id         text primary key,
  sync_token          text,
  channel_id          text,
  resource_id         text,
  channel_expiration  timestamptz,
  updated_at          timestamptz not null default now()
);

alter table public.calendar_sync_state enable row level security;
-- Solo el service_role (Edge Functions) accede; sin políticas => sin acceso anon/auth.

-- 3) Trigger de salida: notifica a gcal-push en cada cambio de bookings --------
-- Usa pg_net para hacer un POST asíncrono a la Edge Function. La URL y el
-- secreto se leen de settings de base de datos (ver docs, sección 3.4):
--   alter database postgres set "app.gcal_push_url" = 'https://.../gcal-push';
--   alter database postgres set "app.sync_shared_secret" = '<secreto>';
--
-- Alternativa sin SQL: crear un "Database Webhook" en el panel de Supabase
-- sobre la tabla bookings (insert/update/delete) apuntando a gcal-push.

create or replace function public.notify_gcal_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_url     text := current_setting('app.gcal_push_url', true);
  v_secret  text := current_setting('app.sync_shared_secret', true);
  v_id      uuid := coalesce(new.id, old.id);
begin
  -- Sin URL configurada todavía: no hacemos nada (la sync está "apagada").
  if v_url is null or length(v_url) = 0 then
    return coalesce(new, old);
  end if;

  -- Solo si la extensión pg_net está disponible.
  begin
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-sync-secret', coalesce(v_secret, '')
                 ),
      body    := jsonb_build_object(
                   'type', tg_op,
                   'booking_id', v_id
                 )
    );
  exception when undefined_function or undefined_table then
    -- pg_net no instalada: ignorar silenciosamente.
    null;
  end;

  return coalesce(new, old);
end; $$;

drop trigger if exists trg_notify_gcal_push on public.bookings;
create trigger trg_notify_gcal_push
  after insert or update or delete on public.bookings
  for each row execute function public.notify_gcal_push();
