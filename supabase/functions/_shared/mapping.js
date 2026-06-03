// Conversión booking <-> evento de Google Calendar y cálculo del hash
// anti-bucle (`sync_hash`). Ver docs/google-calendar-sync.md.

import { timeZone } from './google.js';

// Marcador que ponemos en los eventos creados por la app para reconocerlos.
export const APP_SOURCE = 'sulyweb';

// --- Hash de contenido sincronizable -----------------------------------------
// Si dos lados tienen el mismo hash, están en sync y no hay que reenviar nada.
export async function syncHash(fields) {
  const canonical = [
    fields.booking_date || '',
    (fields.booking_time || '').slice(0, 5),
    String(fields.duration_minutes || ''),
    (fields.client_name || '').trim(),
    (fields.notes || '').trim(),
    fields.status || '',
  ].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- booking -> evento de Google ---------------------------------------------
function toRfc3339(dateStr, timeStr, addMinutes = 0) {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM[:SS]
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  const total = h * 60 + m + addMinutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:00`;
}

const STATUS_COLOR = {
  pending: '5',     // amarillo
  confirmed: '10',  // verde
  rescheduled: '7', // azul
  completed: '8',   // gris
  no_show: '6',     // naranja
  cancelled: '11',  // rojo
};

export function bookingToEvent(b, servicesText = '') {
  const tz = timeZone();
  const dur = b.duration_minutes || 30;
  const descLines = [];
  if (servicesText) descLines.push(`Servicios: ${servicesText}`);
  if (b.client_phone) descLines.push(`Tel: ${b.client_phone}`);
  if (b.client_email) descLines.push(`Email: ${b.client_email}`);
  if (b.notes) descLines.push(`Notas: ${b.notes}`);
  descLines.push(`Origen: ${b.origin || 'app'} · Estado: ${b.status}`);

  return {
    summary: `${b.client_name || 'Cita'}${servicesText ? ' — ' + servicesText : ''}`,
    description: descLines.join('\n'),
    start: { dateTime: toRfc3339(b.booking_date, b.booking_time), timeZone: tz },
    end: { dateTime: toRfc3339(b.booking_date, b.booking_time, dur), timeZone: tz },
    colorId: STATUS_COLOR[b.status] || undefined,
    status: b.status === 'cancelled' ? 'cancelled' : 'confirmed',
    extendedProperties: {
      private: { source: APP_SOURCE, bookingId: String(b.id) },
    },
  };
}

// --- evento de Google -> campos de booking -----------------------------------
// Devuelve null si el evento no tiene fecha/hora utilizable (eventos de día
// completo se ignoran de momento).
export function eventToBooking(ev) {
  const startDt = ev.start?.dateTime;
  const endDt = ev.end?.dateTime;
  if (!startDt) return null; // sin hora concreta (all-day) -> ignorar

  const start = new Date(startDt);
  const end = endDt ? new Date(endDt) : new Date(start.getTime() + 30 * 60000);
  const pad = (n) => String(n).padStart(2, '0');

  const booking_date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const booking_time = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
  const duration_minutes = Math.max(15, Math.round((end - start) / 60000));

  return {
    booking_date,
    booking_time,
    duration_minutes,
    client_name: ev.summary || 'Cita (Google)',
    notes: ev.description || null,
    status: ev.status === 'cancelled' ? 'cancelled' : 'confirmed',
  };
}

// ¿El evento lo creó la app (lleva nuestro marcador)?
export function isAppEvent(ev) {
  return ev.extendedProperties?.private?.source === APP_SOURCE;
}
export function bookingIdFromEvent(ev) {
  return ev.extendedProperties?.private?.bookingId || null;
}
