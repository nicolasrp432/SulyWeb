-- Permite borrar una clienta conservando sus citas: al eliminar la fila de
-- `customers`, las citas vinculadas quedan con customer_id = NULL en vez de
-- fallar por la clave foránea. (Decisión: conservar el histórico de ingresos.)
alter table public.bookings drop constraint if exists bookings_customer_id_fkey;
alter table public.bookings
  add constraint bookings_customer_id_fkey
  foreign key (customer_id) references public.customers(id) on delete set null;
