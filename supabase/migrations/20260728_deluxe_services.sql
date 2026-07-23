-- Crea los dos servicios que el Paquete Deluxe listaba pero no existían como
-- servicios reservables ("Manicura rusa" y "Depilar rostro entero"), para que
-- el paquete arrastre servicios reales al carrito en vez de aproximaciones.
--
-- PRECIOS ESTIMADOS (a revisar por la dueña desde el panel de Servicios):
--   - Manicura rusa: 35 € · 75 min (técnica premium, en línea con Gel/Semi).
--   - Depilación facial completa: 18 € · 25 min (rostro entero, más que cejas).
-- Se insertan como activos para que aparezcan en el catálogo y el paquete
-- pueda resolverlos por nombre.

insert into public.services (name, slug, category, duration, duration_minutes, price, price_cents, active)
select 'Manicura rusa', 'manicura-rusa', 'nails', '75 min', 75, '35€', 3500, true
where not exists (select 1 from public.services where name = 'Manicura rusa' or slug = 'manicura-rusa');

insert into public.services (name, slug, category, duration, duration_minutes, price, price_cents, active)
select 'Depilación facial completa', 'depilacion-facial-completa', 'nails', '25 min', 25, '18€', 1800, true
where not exists (select 1 from public.services where name = 'Depilación facial completa' or slug = 'depilacion-facial-completa');
