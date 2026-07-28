-- =====================================================================
-- Calendario más inmediato: realtime completo + sincronización manual
-- =====================================================================
-- 1) `booking_services` no estaba en la publicación de realtime, así que la
--    suscripción del calendario a esa tabla no recibía nada: al crearse una
--    cita podían faltar sus servicios hasta el siguiente refresco.
-- 2) El puente iCloud -> app (ics-import) corría cada 30 min; se baja a 10.
-- 3) RPC para forzar ese puente desde el panel ("Sincronizar ahora") sin que
--    el secreto compartido llegue nunca al navegador.
-- Todo aditivo: no se toca el anti-bucle (sync_hash / sync_origin) ni gcal-*.
-- =====================================================================

-- 1) Realtime de booking_services ------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'booking_services'
  ) then
    alter publication supabase_realtime add table public.booking_services;
  end if;
end $$;

-- 2) URL de ics-import en la config (el secreto ya existe) -------------------
insert into public.calendar_sync_config (key, value) values
  ('ics_import_url', 'https://qeuqspjpwybaxppqgehm.functions.supabase.co/ics-import')
on conflict (key) do update set value = excluded.value;

-- 3) Bajar el cron del puente de 30 a 10 minutos -----------------------------
do $$
declare v_id bigint;
begin
  select jobid into v_id from cron.job where jobname = 'ics-import-bridge';
  if v_id is not null then
    perform cron.alter_job(v_id, schedule => '*/10 * * * *');
  end if;
exception when undefined_table or undefined_function then
  null; -- pg_cron no disponible: ignorar
end $$;

-- 4) RPC "Sincronizar ahora" -------------------------------------------------
-- SECURITY DEFINER: lee el secreto de calendar_sync_config (tabla sin políticas,
-- inaccesible desde el navegador) y hace el POST. El panel solo llama a la RPC.
-- Cooldown de 60 s para no machacar iCloud si se pulsa repetidamente.
create or replace function public.request_ics_sync()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text;
  v_secret text;
  v_last   timestamptz;
  v_now    timestamptz := now();
  v_wait   int;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select value::timestamptz into v_last
    from public.calendar_sync_config where key = 'ics_last_manual_sync';

  if v_last is not null and (v_now - v_last) < interval '60 seconds' then
    v_wait := ceil(extract(epoch from (interval '60 seconds' - (v_now - v_last))));
    return jsonb_build_object('ok', false, 'reason', 'cooldown', 'retry_in', v_wait);
  end if;

  select value into v_url    from public.calendar_sync_config where key = 'ics_import_url';
  select value into v_secret from public.calendar_sync_config where key = 'sync_shared_secret';

  if v_url is null or length(v_url) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'not_configured');
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-sync-secret', coalesce(v_secret, '')
               ),
    body    := '{}'::jsonb
  );

  insert into public.calendar_sync_config (key, value)
  values ('ics_last_manual_sync', v_now::text)
  on conflict (key) do update set value = excluded.value;

  return jsonb_build_object('ok', true);
end; $$;

revoke all on function public.request_ics_sync() from public, anon;
grant execute on function public.request_ics_sync() to authenticated;
