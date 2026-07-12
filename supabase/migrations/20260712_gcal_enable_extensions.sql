-- =====================================================================
-- Google Calendar sync — habilitar extensiones necesarias
-- =====================================================================
-- pg_net: HTTP asíncrono desde Postgres (el trigger notify_gcal_push lo usa
--         para llamar a la Edge Function gcal-push).
-- pg_cron: programador de tareas (renovación diaria del canal watch).
-- =====================================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;
