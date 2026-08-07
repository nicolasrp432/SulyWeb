-- =====================================================================
-- Aviso al equipo cuando una CLIENTA cancela su cita
-- =====================================================================
-- Hasta ahora solo se avisaba de reservas nuevas. Una cancelación deja un
-- hueco libre en la agenda y al salón le interesa enterarse igual de rápido
-- para poder reofrecerlo.
--
-- Reutiliza la misma Edge Function (notify-new-booking), que ya distingue el
-- evento por el campo `event` del cuerpo. Mismo patrón que el trigger de alta:
-- AFTER UPDATE -> pg_net -> Edge Function.
-- =====================================================================

-- 1) El trigger de alta pasa a mandar `event` explícito ------------------------
-- La función acepta la ausencia del campo como 'new', así que el orden de
-- despliegue (migración antes o después de la función) no importa.
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
      body    := jsonb_build_object('event', 'new', 'type', 'INSERT', 'booking_id', new.id)
    );
  exception when undefined_function or undefined_table then
    null; -- pg_net no disponible: ignorar.
  end;

  return new;
end; $$;

-- 2) Nuevo trigger: cancelación hecha por la clienta ---------------------------
create or replace function public.notify_client_cancellation()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
begin
  -- Solo el salto a 'cancelled', y solo si canceló la clienta desde su enlace.
  -- Las que cancela el equipo desde el panel no avisan: ya lo sabe quien las
  -- cancela, y avisar sería ruido.
  if new.status is distinct from 'cancelled' then return new; end if;
  if old.status is not distinct from 'cancelled' then return new; end if;
  if coalesce(new.cancelled_by, '') <> 'client' then return new; end if;

  select value into v_url    from public.calendar_sync_config where key = 'notify_new_booking_url';
  select value into v_secret from public.calendar_sync_config where key = 'sync_shared_secret';

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
      body    := jsonb_build_object('event', 'cancelled', 'booking_id', new.id)
    );
  exception when undefined_function or undefined_table then
    null;
  end;

  return new;
end; $$;

drop trigger if exists trg_notify_client_cancellation on public.bookings;
create trigger trg_notify_client_cancellation
  after update of status on public.bookings
  for each row execute function public.notify_client_cancellation();
