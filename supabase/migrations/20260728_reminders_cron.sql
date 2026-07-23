-- Cron diario que dispara el email de recordatorio de las citas de mañana.
-- Se ejecuta a las 07:00 UTC (~08-09 h en Madrid); la función calcula "mañana"
-- en la zona del salón, así que la hora exacta no es crítica. Idempotente: la
-- función marca reminder_email_sent_at y no reenvía.
select cron.schedule(
  'send-reminders-daily',
  '0 7 * * *',
  $cron$
  select net.http_post(
    url     := 'https://qeuqspjpwybaxppqgehm.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-sync-secret', (select value from public.calendar_sync_config where key = 'sync_shared_secret')
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);
