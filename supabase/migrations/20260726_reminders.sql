-- FASE 4 · Recordatorios: seguimiento de envíos
--
-- Columnas para marcar cuándo se envió el recordatorio de cada cita, de forma
-- que el estado "enviado" se comparta entre dispositivos (a diferencia del
-- localStorage). La cola de recordatorios (citas de mañana) se consulta desde
-- el panel; el canal elegido es WhatsApp manual (un toque por clienta).
alter table public.bookings add column if not exists reminder_wa_sent_at timestamptz;
alter table public.bookings add column if not exists reminder_email_sent_at timestamptz;
