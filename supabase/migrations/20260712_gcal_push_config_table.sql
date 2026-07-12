-- =====================================================================
-- Google Calendar sync — configuración del trigger de salida (app -> Google)
-- =====================================================================
-- En Supabase gestionado, el rol de migraciones NO puede ejecutar
-- `alter database postgres set ...`, por lo que el enfoque original
-- (leer la URL/secreto con current_setting('app.*')) no es aplicable.
--
-- En su lugar guardamos esos dos valores en una tabla de configuración
-- protegida (`calendar_sync_config`) que solo leen el service_role y las
-- funciones SECURITY DEFINER (mismo owner, que además hace bypass de RLS).
-- El trigger notify_gcal_push se reescribe para leer de esa tabla.
-- =====================================================================

-- 1) Tabla de configuración -------------------------------------------------
create table if not exists public.calendar_sync_config (
  key   text primary key,
  value text not null
);
alter table public.calendar_sync_config enable row level security;
-- Sin políticas => anon/authenticated no acceden (solo service_role / definer).

-- URL de la Edge Function gcal-push (no es sensible).
insert into public.calendar_sync_config (key, value) values
  ('gcal_push_url', 'https://qeuqspjpwybaxppqgehm.functions.supabase.co/gcal-push')
on conflict (key) do update set value = excluded.value;

-- IMPORTANTE (no se versiona el secreto): el valor de 'sync_shared_secret' debe
-- coincidir con el secret SYNC_SHARED_SECRET de las Edge Functions. Insértalo a
-- mano (una vez), por ejemplo:
--   insert into public.calendar_sync_config (key, value)
--   values ('sync_shared_secret', '<mismo-valor-que-SYNC_SHARED_SECRET>')
--   on conflict (key) do update set value = excluded.value;

-- 2) Trigger de salida (lee de la tabla; en DELETE envía el google_event_id) --
create or replace function public.notify_gcal_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
  v_id     uuid := coalesce(new.id, old.id);
  v_body   jsonb;
begin
  select value into v_url    from public.calendar_sync_config where key = 'gcal_push_url';
  select value into v_secret from public.calendar_sync_config where key = 'sync_shared_secret';

  -- Sync "apagada" mientras no haya URL configurada.
  if v_url is null or length(v_url) = 0 then
    return coalesce(new, old);
  end if;

  v_body := jsonb_build_object('type', tg_op, 'booking_id', v_id);

  -- En DELETE la fila ya no existe: pasamos el id del evento espejo para que
  -- gcal-push pueda borrarlo en Google (si no, quedaría huérfano).
  if tg_op = 'DELETE' then
    v_body := v_body || jsonb_build_object(
      'old_record', jsonb_build_object('google_event_id', old.google_event_id)
    );
  end if;

  begin
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-sync-secret', coalesce(v_secret, '')
                 ),
      body    := v_body
    );
  exception when undefined_function or undefined_table then
    null; -- pg_net no disponible: ignorar.
  end;

  return coalesce(new, old);
end; $$;

-- El trigger trg_notify_gcal_push ya existe (migración 20260608); esta función
-- lo reutiliza (CREATE OR REPLACE), no hace falta recrearlo.
