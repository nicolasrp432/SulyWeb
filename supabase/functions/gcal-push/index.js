// Edge Function: gcal-push  (App -> Google)
// La dispara el trigger `notify_gcal_push` (o un Database Webhook) en cada
// INSERT/UPDATE/DELETE de bookings. Crea / actualiza / cancela el evento espejo
// en Google Calendar, evitando bucles mediante `sync_hash`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calendarFetch, calendarId } from '../_shared/google.js';
import { bookingToEvent, syncHash } from '../_shared/mapping.js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
const SHARED_SECRET = Deno.env.get('SYNC_SHARED_SECRET');

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

async function servicesText(bookingId) {
  const { data } = await supabase
    .from('booking_services')
    .select('services(name)')
    .eq('booking_id', bookingId);
  return (data || []).map((r) => r.services?.name).filter(Boolean).join(', ');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // Autenticación por secreto compartido (lo envía el trigger/DB-webhook).
  if (SHARED_SECRET && req.headers.get('x-sync-secret') !== SHARED_SECRET) {
    return json(401, { error: 'unauthorized' });
  }

  let payload;
  try { payload = await req.json(); } catch { return json(400, { error: 'bad_json' }); }

  // Soporta tanto nuestro trigger ({type, booking_id}) como el formato de
  // Database Webhooks de Supabase ({type, record, old_record}).
  const op = payload.type;
  const bookingId = payload.booking_id || payload.record?.id || payload.old_record?.id;
  if (!bookingId) return json(400, { error: 'missing_booking_id' });

  const calId = calendarId();
  if (!calId) return json(500, { error: 'no_calendar_configured' });

  try {
    // DELETE: borrar el evento espejo si lo conocíamos.
    if (op === 'DELETE') {
      const evId = payload.old_record?.google_event_id;
      if (evId) {
        await calendarFetch(`/calendars/${encodeURIComponent(calId)}/events/${evId}`, { method: 'DELETE' });
      }
      return json(200, { ok: true, action: 'deleted' });
    }

    // Cargar el booking actual.
    const { data: b, error } = await supabase
      .from('bookings').select('*').eq('id', bookingId).single();
    if (error || !b) return json(200, { ok: true, action: 'not_found' });

    // Anti-bucle: si el hash actual coincide con sync_hash, ya está sincronizado
    // (el cambio vino de Google). No reenviar.
    const hash = await syncHash(b);
    if (hash === b.sync_hash) return json(200, { ok: true, action: 'in_sync' });

    const svc = await servicesText(b.id);
    const event = bookingToEvent(b, svc);
    const base = `/calendars/${encodeURIComponent(calId)}/events`;

    let res;
    if (b.google_event_id) {
      // Actualizar (o recrear si Google ya no lo tiene).
      res = await calendarFetch(`${base}/${b.google_event_id}`, { method: 'PUT', body: event });
      if (res.status === 404 || res.status === 410) {
        res = await calendarFetch(base, { method: 'POST', body: event });
      }
    } else {
      res = await calendarFetch(base, { method: 'POST', body: event });
    }

    if (!res.ok) return json(502, { error: 'google_error', status: res.status, detail: res.data });

    // Guardar enlace + hash SIN re-disparar push (el trigger volverá a entrar,
    // pero el hash ya coincidirá y se omitirá -> sin bucle).
    await supabase.from('bookings').update({
      google_event_id: res.data.id,
      sync_hash: hash,
      sync_origin: 'app',
      last_synced_at: new Date().toISOString(),
    }).eq('id', b.id);

    return json(200, { ok: true, action: b.google_event_id ? 'updated' : 'created', eventId: res.data.id });
  } catch (e) {
    return json(500, { error: 'exception', detail: String(e) });
  }
});
