-- =====================================================================
-- Activar realtime (supabase_realtime) para las tablas que la app ya
-- escucha vía postgres_changes. La publicación estaba vacía, por eso los
-- cambios de precio, horario, bloqueos y equipo no se propagaban en vivo.
-- =====================================================================
-- Nota: bookings tiene RLS que bloquea a anon; el admin (authenticated) sí
-- recibe eventos. La web pública refresca disponibilidad por foco/intervalo.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='services') then
    alter publication supabase_realtime add table public.services;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='schedule_blocks') then
    alter publication supabase_realtime add table public.schedule_blocks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='admin_staff') then
    alter publication supabase_realtime add table public.admin_staff;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bookings') then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
