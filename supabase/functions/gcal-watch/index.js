// Edge Function: gcal-watch
// Crea (o renueva) el canal push `watch` de Google Calendar que apunta a
// gcal-webhook, y asegura que exista un syncToken inicial. Pensada para
// ejecutarse desde un cron diario (pg_cron) porque los canales caducan (~7 d).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calendarFetch, calendarId } from '../_shared/google.js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
const SHARED_SECRET = Deno.env.get('SYNC_SHARED_SECRET');
const CHANNEL_TOKEN = Deno.env.get('GCAL_CHANNEL_TOKEN');
const WEBHOOK_URL = Deno.env.get('GCAL_WEBHOOK_URL'); // .../functions/v1/gcal-webhook

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// Garantiza que tengamos un nextSyncToken guardado (primera sincronización).
async function ensureSyncToken(calId) {
  const { data: state } = await supabase
    .from('calendar_sync_state').select('sync_token').eq('calendar_id', calId).maybeSingle();
  if (state?.sync_token) return;

  let pageToken = null, syncToken = null;
  do {
    const res = await calendarFetch(`/calendars/${encodeURIComponent(calId)}/events`, {
      query: { pageToken, singleEvents: true, showDeleted: true,
               timeMin: new Date(Date.now() - 7 * 864e5).toISOString() },
    });
    if (!res.ok) throw new Error(`events.list ${res.status}`);
    pageToken = res.data.nextPageToken || null;
    syncToken = res.data.nextSyncToken || syncToken;
  } while (pageToken);

  await supabase.from('calendar_sync_state').upsert({
    calendar_id: calId, sync_token: syncToken, updated_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  if (SHARED_SECRET && req.headers.get('x-sync-secret') !== SHARED_SECRET) {
    return json(401, { error: 'unauthorized' });
  }
  const calId = calendarId();
  if (!calId) return json(500, { error: 'no_calendar_configured' });
  if (!WEBHOOK_URL) return json(500, { error: 'no_webhook_url' });

  try {
    await ensureSyncToken(calId);

    // Cerrar el canal anterior si existía (best-effort).
    const { data: prev } = await supabase
      .from('calendar_sync_state').select('channel_id, resource_id').eq('calendar_id', calId).maybeSingle();
    if (prev?.channel_id && prev?.resource_id) {
      await calendarFetch('/channels/stop', {
        method: 'POST', body: { id: prev.channel_id, resourceId: prev.resource_id },
      }).catch(() => {});
    }

    // Crear el canal nuevo.
    const channelId = crypto.randomUUID();
    const res = await calendarFetch(`/calendars/${encodeURIComponent(calId)}/events/watch`, {
      method: 'POST',
      body: {
        id: channelId,
        type: 'web_hook',
        address: WEBHOOK_URL,
        token: CHANNEL_TOKEN,
      },
    });
    if (!res.ok) return json(502, { error: 'watch_failed', status: res.status, detail: res.data });

    await supabase.from('calendar_sync_state').upsert({
      calendar_id: calId,
      channel_id: channelId,
      resource_id: res.data.resourceId,
      channel_expiration: res.data.expiration
        ? new Date(Number(res.data.expiration)).toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    return json(200, { ok: true, channelId, expiration: res.data.expiration });
  } catch (e) {
    return json(500, { error: 'exception', detail: String(e) });
  }
});
