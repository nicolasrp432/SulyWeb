// Edge Function: ics-import  (calendario iCloud -> bookings)
// Importación masiva de las citas ya existentes en un calendario iCloud
// publicado con enlace público (.ics). Cada VEVENT futuro se upserta en
// `bookings` (idempotente vía columna `ics_uid`); al insertarse, el trigger
// notify_gcal_push replica la cita en "agenda suly" (Google) automáticamente.
//
// Body JSON: {
//   ics_url?:  enlace webcal:// o https:// (si falta, se lee de
//              calendar_sync_config key 'icloud_ics_url'),
//   time_min?: 'YYYY-MM-DD' (por defecto: hoy en la zona del salón),
//   dry_run?:  true para ver qué se importaría sin escribir nada
// }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
const SHARED_SECRET = Deno.env.get('SYNC_SHARED_SECRET');
const DEFAULT_LOCATION_ID = Deno.env.get('DEFAULT_LOCATION_ID');
const TIMEZONE = Deno.env.get('GCAL_TIMEZONE') || 'Europe/Madrid';

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// --- Parser ICS mínimo (sin dependencias) ------------------------------------

// Une las líneas plegadas (RFC 5545: una línea que empieza por espacio/tab
// continúa la anterior) y devuelve las líneas lógicas.
function unfoldLines(text) {
  const raw = text.split(/\r\n|\n|\r/);
  const lines = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.length) {
      lines.push(line);
    }
  }
  return lines;
}

// "NAME;PARAM=x;PARAM2=y:valor" -> { name, params: {PARAM: x}, value }
function parseLine(line) {
  const colon = findUnquotedColon(line);
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = left.split(';');
  const params = {};
  for (const p of paramParts) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value };
}

// El separador ':' real no puede ir dentro de un parámetro entrecomillado
// (p. ej. TZID="America/New_York").
function findUnquotedColon(line) {
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ':' && !inQuotes) return i;
  }
  return -1;
}

const unescapeText = (v) =>
  (v || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

function parseEvents(icsText) {
  const lines = unfoldLines(icsText);
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT') { if (current) events.push(current); current = null; continue; }
    if (!current) continue;
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { name, params, value } = parsed;
    if (['UID', 'SUMMARY', 'DESCRIPTION', 'LOCATION', 'STATUS', 'RRULE', 'RECURRENCE-ID'].includes(name)) {
      current[name] = { params, value };
    } else if (name === 'DTSTART' || name === 'DTEND') {
      current[name] = { params, value };
    }
  }
  return events;
}

// --- Fechas -------------------------------------------------------------------

// Convierte un instante UTC a { date: 'YYYY-MM-DD', time: 'HH:MM' } en TIMEZONE.
function utcToLocal(dateObj) {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  // 'sv-SE' produce "YYYY-MM-DD HH:MM"
  const [date, time] = fmt.format(dateObj).split(' ');
  return { date, time };
}

// Devuelve { date, time, epochMin } para un DTSTART/DTEND, o null si es
// de día completo (VALUE=DATE) o no parseable.
function parseIcsDate(prop) {
  if (!prop) return null;
  const { params = {}, value } = prop;
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(value)) return null; // all-day

  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, zulu] = m;

  if (zulu) {
    // Instante UTC -> hora local del salón.
    const utc = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)));
    const { date, time } = utcToLocal(utc);
    return { date, time, epochMin: Math.floor(utc.getTime() / 60000) };
  }

  // Con TZID (o "flotante"): iCloud publica la hora de pared del calendario.
  // La tratamos como hora local del salón (caso real: mismo huso).
  const date = `${y}-${mo}-${d}`;
  const time = `${h}:${mi}`;
  // epoch "de pared" solo para calcular duraciones (consistente entre sí).
  const epochMin = Math.floor(Date.UTC(+y, +mo - 1, +d, +h, +mi) / 60000);
  return { date, time, epochMin };
}

// Fecha de hoy 'YYYY-MM-DD' en la zona del salón.
function todayLocal() {
  return utcToLocal(new Date()).date;
}

// --- Handler -------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (SHARED_SECRET && req.headers.get('x-sync-secret') !== SHARED_SECRET) {
    return json(401, { error: 'unauthorized' });
  }

  let body = {};
  try { body = await req.json(); } catch { /* body vacío permitido */ }

  // URL del feed: del body o de la tabla de configuración.
  let icsUrl = body.ics_url;
  if (!icsUrl) {
    const { data } = await supabase
      .from('calendar_sync_config').select('value').eq('key', 'icloud_ics_url').maybeSingle();
    icsUrl = data?.value;
  }
  if (!icsUrl) return json(400, { error: 'missing_ics_url' });
  icsUrl = icsUrl.replace(/^webcal:\/\//i, 'https://');

  const timeMin = body.time_min || todayLocal();
  const dryRun = !!body.dry_run;

  let icsText;
  try {
    const res = await fetch(icsUrl, { headers: { 'User-Agent': 'SulyWeb-ics-import/1.0' } });
    if (!res.ok) return json(502, { error: 'ics_fetch_failed', status: res.status });
    icsText = await res.text();
  } catch (e) {
    return json(502, { error: 'ics_fetch_exception', detail: String(e) });
  }

  const events = parseEvents(icsText);
  const stats = {
    total_events: events.length,
    imported: 0,
    updated: 0,
    unchanged: 0,
    skipped_past: 0,
    skipped_allday: 0,
    skipped_recurring: 0,
    skipped_cancelled: 0,
    errors: [],
  };
  const preview = [];

  for (const ev of events) {
    try {
      if (ev.RRULE) { stats.skipped_recurring++; continue; }
      if ((ev.STATUS?.value || '').toUpperCase() === 'CANCELLED') { stats.skipped_cancelled++; continue; }

      const start = parseIcsDate(ev.DTSTART);
      if (!start) { stats.skipped_allday++; continue; }
      if (start.date < timeMin) { stats.skipped_past++; continue; }

      const end = parseIcsDate(ev.DTEND);
      const duration = end
        ? Math.max(15, end.epochMin - start.epochMin)
        : 30;

      const uid = ev.UID?.value;
      if (!uid) { stats.errors.push({ summary: ev.SUMMARY?.value, error: 'missing_uid' }); continue; }

      const summary = unescapeText(ev.SUMMARY?.value).trim() || 'Cita (iCloud)';
      const descParts = [unescapeText(ev.DESCRIPTION?.value).trim()];
      const loc = unescapeText(ev.LOCATION?.value).trim();
      if (loc) descParts.push(`Lugar: ${loc}`);
      const notes = descParts.filter(Boolean).join('\n') || null;

      const fields = {
        booking_date: start.date,
        booking_time: `${start.time}:00`,
        duration_minutes: duration,
        client_name: summary,
        notes,
      };

      if (dryRun) {
        preview.push({ uid, ...fields });
        stats.imported++;
        continue;
      }

      const { data: existing } = await supabase
        .from('bookings')
        .select('id,booking_date,booking_time,duration_minutes,client_name,notes')
        .eq('ics_uid', uid)
        .maybeSingle();

      if (existing) {
        const changed =
          existing.booking_date !== fields.booking_date ||
          existing.booking_time?.slice(0, 5) !== start.time ||
          existing.duration_minutes !== fields.duration_minutes ||
          existing.client_name !== fields.client_name ||
          (existing.notes || null) !== fields.notes;
        if (!changed) { stats.unchanged++; continue; }
        const { error } = await supabase.from('bookings').update(fields).eq('id', existing.id);
        if (error) throw error;
        stats.updated++;
      } else {
        const { error } = await supabase.from('bookings').insert({
          ...fields,
          client_phone: '',
          location_id: DEFAULT_LOCATION_ID,
          status: 'confirmed',
          origin: 'calendar',
          ics_uid: uid,
          sync_origin: 'app', // el trigger la empuja a "agenda suly"
        });
        if (error) throw error;
        stats.imported++;
      }
    } catch (e) {
      stats.errors.push({ summary: ev.SUMMARY?.value, error: String(e?.message || e) });
    }
  }

  return json(200, { ok: true, dry_run: dryRun, time_min: timeMin, ...stats, ...(dryRun ? { preview } : {}) });
});
