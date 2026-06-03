// Edge Function: gcal-webhook  (Google -> App)
// Google llama a esta URL (sin cuerpo, solo cabeceras) cuando cambia algo en el
// calendario. Hacemos un events.list incremental con el syncToken guardado y
// reflejamos los cambios en la tabla bookings.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calendarFetch, calendarId } from '../_shared/google.js';
import {
  eventToBooking, syncHash, isAppEvent, bookingIdFromEvent,
} from '../_shared/mapping.js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
const CHANNEL_TOKEN = Deno.env.get('GCAL_CHANNEL_TOKEN');
const DEFAULT_LOCATION_ID = Deno.env.get('DEFAULT_LOCATION_ID');

const ok = (obj = {}) =>
  new Response(JSON.stringify({ ok: true, ...obj }), { headers: { 'Content-Type': 'application/json' } });

// Procesa un único evento entrante de Google.
async function applyEvent(ev) {
  // ¿Ya existe un booking enlazado a este evento?
  const { data: existing } = await supabase
    .from('bookings').select('*').eq('google_event_id', ev.id).maybeSingle();

  // Evento cancelado/borrado en Google.
  if (ev.status === 'cancelled') {
    if (existing) {
      await supabase.from('bookings')
        .update({ status: 'cancelled', sync_origin: 'google', last_synced_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
    return 'cancelled';
  }

  const fields = eventToBooking(ev);
  if (!fields) return 'skipped_allday';
  const hash = await syncHash(fields);

  // Caso 1: evento creado por la app (lleva nuestro marcador). Puede que el
  // equipo lo haya MOVIDO en el iPhone -> actualizar ese booking.
  if (isAppEvent(ev)) {
    const bid = bookingIdFromEvent(ev) || existing?.id;
    if (!bid) return 'app_event_no_booking';
    const { data: b } = await supabase.from('bookings').select('sync_hash').eq('id', bid).maybeSingle();
    if (b && b.sync_hash === hash) return 'in_sync';
    await supabase.from('bookings').update({
      ...fields, google_event_id: ev.id, sync_origin: 'google',
      sync_hash: hash, last_synced_at: new Date().toISOString(),
    }).eq('id', bid);
    return 'updated_app_event';
  }

  // Caso 2: evento existente ya enlazado -> actualizar.
  if (existing) {
    if (existing.sync_hash === hash) return 'in_sync';
    await supabase.from('bookings').update({
      ...fields, sync_origin: 'google', sync_hash: hash,
      last_synced_at: new Date().toISOString(),
    }).eq('id', existing.id);
    return 'updated';
  }

  // Caso 3: evento NUEVO creado a mano en el iPhone -> crear booking.
  await supabase.from('bookings').insert({
    ...fields,
    location_id: DEFAULT_LOCATION_ID,
    staff_id: null,
    origin: 'calendar',
    google_event_id: ev.id,
    sync_origin: 'google',
    sync_hash: hash,
    last_synced_at: new Date().toISOString(),
  });
  return 'created';
}

// Trae los cambios desde Google (incremental con syncToken, o full la 1ª vez).
async function pullChanges(calId) {
  const { data: state } = await supabase
    .from('calendar_sync_state').select('*').eq('calendar_id', calId).maybeSingle();

  let syncToken = state?.sync_token || null;
  let pageToken = null;
  const results = [];

  do {
    const query = syncToken
      ? { syncToken, pageToken, showDeleted: true }
      : { pageToken, showDeleted: true, singleEvents: true,
          timeMin: new Date(Date.now() - 7 * 864e5).toISOString() };
    const res = await calendarFetch(`/calendars/${encodeURIComponent(calId)}/events`, { query });

    // Token caducado (410): reiniciar sincronización completa.
    if (res.status === 410) {
      await supabase.from('calendar_sync_state')
        .upsert({ calendar_id: calId, sync_token: null, updated_at: new Date().toISOString() });
      syncToken = null; pageToken = null;
      continue;
    }
    if (!res.ok) throw new Error(`events.list ${res.status}: ${JSON.stringify(res.data)}`);

    for (const ev of res.data.items || []) results.push(await applyEvent(ev));

    pageToken = res.data.nextPageToken || null;
    if (res.data.nextSyncToken) {
      await supabase.from('calendar_sync_state').upsert({
        calendar_id: calId, sync_token: res.data.nextSyncToken,
        updated_at: new Date().toISOString(),
      });
    }
  } while (pageToken);

  return results;
}

Deno.serve(async (req) => {
  const calId = calendarId();
  if (!calId) return ok({ note: 'no_calendar_configured' });

  // Validar que la notificación viene de NUESTRO canal.
  const token = req.headers.get('x-goog-channel-token');
  if (CHANNEL_TOKEN && token !== CHANNEL_TOKEN) {
    return new Response('forbidden', { status: 403 });
  }

  // La 1ª notificación tras crear el canal es de tipo "sync": solo confirma.
  const state = req.headers.get('x-goog-resource-state');
  if (state === 'sync') return ok({ note: 'channel_sync' });

  try {
    const results = await pullChanges(calId);
    return ok({ processed: results.length, results });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
