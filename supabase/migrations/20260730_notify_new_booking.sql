-- =====================================================================
-- Aviso fiable de nuevas reservas al equipo (server-side)
-- =====================================================================
-- El aviso por email al salón salía antes desde el navegador de la clienta
-- (frágil). Aquí lo movemos al servidor con el patrón ya probado de la
-- sincronización con Google: trigger AFTER INSERT -> pg_net -> Edge Function
-- (notify-new-booking), reutilizando calendar_sync_config y sync_shared_secret.
-- =====================================================================

-- 1) Config de destinatarios (tabla PRIVADA: sin lectura anónima) -------------
-- No usamos public.settings porque su política de SELECT es pública (using true)
-- y expondría los correos del equipo. Aquí solo authenticated (panel) y el
-- service_role (Edge Function, que hace bypass de RLS) acceden.
create table if not exists public.notification_config (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.notification_config enable row level security;

drop policy if exists "notif_config admin all" on public.notification_config;
create policy "notif_config admin all" on public.notification_config
  for all to authenticated using (true) with check (true);

-- Semilla: destinatarios por defecto = correo del salón. Editable desde el panel.
insert into public.notification_config (key, value)
values ('notify_new_booking_emails', 'sulyprettynails@gmail.com')
on conflict (key) do nothing;

-- 2) URL de la Edge Function (reutiliza sync_shared_secret ya existente) -------
insert into public.calendar_sync_config (key, value) values
  ('notify_new_booking_url',
   'https://qeuqspjpwybaxppqgehm.functions.supabase.co/notify-new-booking')
on conflict (key) do update set value = excluded.value;

-- 3) Trigger de salida: solo reservas online/whatsapp -------------------------
create or replace function public.notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
begin
  -- Solo avisamos de reservas hechas por la clienta (no las que crea el admin).
  if new.origin is null or new.origin not in ('online', 'whatsapp') then
    return new;
  end if;

  select value into v_url    from public.calendar_sync_config where key = 'notify_new_booking_url';
  select value into v_secret from public.calendar_sync_config where key = 'sync_shared_secret';

  -- Aviso "apagado" mientras no haya URL configurada.
  if v_url is null or length(v_url) = 0 then
    return new;
  end if;

  begin
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-sync-secret', coalesce(v_secret, '')
                 ),
      body    := jsonb_build_object('type', 'INSERT', 'booking_id', new.id)
    );
  exception when undefined_function or undefined_table then
    null; -- pg_net no disponible: ignorar.
  end;

  return new;
end; $$;

drop trigger if exists trg_notify_new_booking on public.bookings;
create trigger trg_notify_new_booking
  after insert on public.bookings
  for each row execute function public.notify_new_booking();
