// Edge Function: notify-new-booking  (aviso fiable al equipo)
// Avisa por email (Resend) de los movimientos que la clienta provoca sola, a
// TODOS los destinatarios configurados en notification_config:
//
//   · 'new'       — trigger `notify_new_booking` en cada INSERT con
//                   origin IN ('online','whatsapp').
//   · 'cancelled' — trigger `notify_client_cancellation` cuando una clienta
//                   cancela desde el enlace de su cita (cancelled_by='client').
//                   Las que cancela el equipo desde el panel no avisan: ya lo
//                   sabe quien las cancela.
//
// A diferencia del aviso antiguo (que salía desde el navegador de la clienta),
// este corre en el servidor: llega aunque la clienta cierre la pestaña.
//
// Auth: secreto compartido (x-sync-secret == SYNC_SHARED_SECRET), igual que
// gcal-push. Desplegar con verify_jwt desactivado.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildSubject, salonToday, shortTime } from '../_shared/notifyFormat.js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

const SHARED_SECRET = Deno.env.get('SYNC_SHARED_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Suly Pretty Nails <info@sulyprettynails.com>';
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'sulyprettynails@gmail.com';

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

// Lista de destinatarios: notification_config.notify_new_booking_emails (CSV).
// Tabla privada (solo authenticated / service_role), para no exponer los correos
// del equipo por la API pública. Fallback a ADMIN_EMAIL si no hay nada.
async function getRecipients() {
  try {
    const { data } = await supabase
      .from('notification_config').select('value')
      .eq('key', 'notify_new_booking_emails').maybeSingle();
    const raw = (data?.value || '').trim();
    const list = (raw.startsWith('[') ? safeJsonArray(raw) : raw.split(/[,;\s]+/))
      .map((e) => String(e).trim())
      .filter((e) => /.+@.+\..+/.test(e));
    if (list.length) return [...new Set(list)];
  } catch { /* ignore */ }
  return ADMIN_EMAIL ? [ADMIN_EMAIL] : [];
}

function safeJsonArray(raw) {
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

async function servicesText(bookingId) {
  const { data } = await supabase
    .from('booking_services').select('services(name)').eq('booking_id', bookingId);
  return (data || []).map((r) => r.services?.name).filter(Boolean).join(', ');
}

// Cada evento tiene su propio color y titular para que el correo se distinga
// de un vistazo, sin tener que leerlo entero.
const EVENT_STYLE = {
  new:       { color: '#e11d48', title: 'Nueva reserva' },
  cancelled: { color: '#b45309', title: 'Cita cancelada por la clienta' },
};

function buildHtml(event, b, svc, locationName) {
  const style = EVENT_STYLE[event] || EVENT_STYLE.new;
  const cancelled = event === 'cancelled';
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
      .header{background-color:${style.color};color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
      .content{background-color:#f9f9f9;padding:20px;border-radius:0 0 8px 8px}
      .booking-details{background-color:#fff;padding:15px;border-radius:8px;margin:10px 0}
      .label{color:${style.color};font-weight:bold}
      .note{background-color:#fffbeb;border:1px solid #fcd34d;padding:12px;border-radius:8px;margin:10px 0}
    </style></head>
    <body>
      <div class="header"><h1 style="margin:0">${style.title}</h1></div>
      <div class="content">
        ${cancelled ? `<div class="note"><strong>El hueco vuelve a estar libre.</strong> Si tienes lista de espera, es buen momento para reofrecerlo.</div>` : ''}
        <div class="booking-details">
          <p><span class="label">Cliente:</span> ${esc(b.client_name) || '—'}</p>
          <p><span class="label">Teléfono:</span> ${esc(b.client_phone) || '—'}</p>
          <p><span class="label">Email:</span> ${esc(b.client_email) || '—'}</p>
          <p><span class="label">Fecha:</span> ${esc(formatDate(b.booking_date))}</p>
          <p><span class="label">Hora:</span> ${esc(shortTime(b.booking_time)) || '—'}</p>
          <p><span class="label">Sede:</span> ${esc(locationName) || '—'}</p>
          <p><span class="label">Servicios:</span> ${esc(svc) || '—'}</p>
          ${b.notes ? `<p><span class="label">Notas:</span> ${esc(b.notes)}</p>` : ''}
          ${cancelled
            ? `<p><span class="label">Motivo:</span> ${esc(b.cancellation_reason) || 'No indicado'}</p>`
            : `<p><span class="label">Origen:</span> ${esc(b.origin || 'online')}</p>`}
        </div>
        <p style="font-size:13px;color:#666">
          ${cancelled ? 'Cancelada' : 'Recibida'} el ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}.
        </p>
      </div>
    </body></html>`;
}

async function sendEmail(recipients, subject, html) {
  if (!RESEND_API_KEY) return { ok: false, error: 'missing_resend_key' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: recipients, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Motivo exacto de Resend en los logs (dominio sin verificar, API key mala...).
    console.error('[resend] envío rechazado', JSON.stringify({
      status: res.status, from: FROM_EMAIL, to: recipients, body: data,
    }));
    return { ok: false, error: data?.message || `resend_${res.status}` };
  }
  return { ok: true, id: data?.id };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // Auth por secreto compartido (lo envía el trigger).
  if (SHARED_SECRET && req.headers.get('x-sync-secret') !== SHARED_SECRET) {
    return json(401, { error: 'unauthorized' });
  }

  let payload;
  try { payload = await req.json(); } catch { return json(400, { error: 'bad_json' }); }

  // Acepta {booking_id} del trigger o {record:{id}} de Database Webhooks.
  const bookingId = payload.booking_id || payload.record?.id;
  if (!bookingId) return json(400, { error: 'missing_booking_id' });

  // Sin `event` es una reserva nueva: así el trigger antiguo sigue valiendo.
  const event = payload.event === 'cancelled' ? 'cancelled' : 'new';

  try {
    const { data: b, error } = await supabase
      .from('bookings').select('*').eq('id', bookingId).single();
    // Devolvemos 200 para no provocar reintentos en bucle desde pg_net.
    if (error || !b) return json(200, { ok: true, action: 'not_found' });

    const recipients = await getRecipients();
    if (!recipients.length) return json(200, { ok: true, action: 'no_recipients' });

    let locationName = '';
    if (b.location_id) {
      const { data: loc } = await supabase
        .from('locations').select('name').eq('id', b.location_id).maybeSingle();
      locationName = loc?.name || '';
    }
    const svc = await servicesText(b.id);

    const result = await sendEmail(
      recipients,
      buildSubject(event, b, salonToday()),
      buildHtml(event, b, svc, locationName),
    );
    if (!result.ok) return json(200, { ok: false, event, error: result.error });
    return json(200, { ok: true, event, sent_to: recipients.length, id: result.id });
  } catch (e) {
    return json(200, { ok: false, error: String(e) });
  }
});
