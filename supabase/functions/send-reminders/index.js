// Edge Function: send-reminders  (recordatorio automático 24h antes por email)
//
// La invoca un cron diario (pg_cron) con el secreto compartido. Busca las citas
// de MAÑANA con email y sin recordatorio enviado, manda el correo vía Resend
// con el enlace de autogestión /cita/:token y marca `reminder_email_sent_at`.
// Es idempotente: re-ejecutarla no reenvía a quien ya se le envió.
//
// Complementa la cola de WhatsApp manual del panel (canal principal). Este
// email es un refuerzo automático solo para las clientas que dieron email.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
const SHARED_SECRET = Deno.env.get('SYNC_SHARED_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Suly Pretty Nails <info@sulyprettynails.com>';
const SITE_DOMAIN = Deno.env.get('SITE_DOMAIN') || 'sulyprettynails.com';
const TIMEZONE = Deno.env.get('GCAL_TIMEZONE') || 'Europe/Madrid';

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// Fecha 'YYYY-MM-DD' de mañana en la zona del salón.
function tomorrowLocal() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.format(new Date()); // en-CA -> YYYY-MM-DD (hoy)
  const [y, m, d] = parts.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

function reminderHtml(b) {
  const time = String(b.booking_time || '').slice(0, 5);
  const loc = b.locations?.name || '';
  const manage = `https://${SITE_DOMAIN}/cita/${b.cancellation_token}`;
  const services = (b.booking_services || []).map((bs) => bs.services?.name).filter(Boolean).join(', ');
  const first = String(b.client_name || '').split(' ')[0];
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Recordatorio de tu cita</title></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="color:#e11d48;text-align:center;">Suly Pretty Nails</h1>
      <p>Hola <strong>${first}</strong>,</p>
      <p>Te recordamos tu cita de <strong>mañana</strong>:</p>
      <div style="background:#fdf2f8;padding:20px;border-radius:10px;margin:16px 0;">
        <p><strong>Hora:</strong> ${time}</p>
        <p><strong>Sede:</strong> ${loc}</p>
        ${services ? `<p><strong>Servicios:</strong> ${services}</p>` : ''}
      </div>
      <p style="text-align:center;">
        <a href="${manage}" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver o cancelar mi cita</a>
      </p>
      <p>¡Te esperamos! 💅</p>
      <div style="text-align:center;font-size:12px;color:#666;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
        © ${new Date().getFullYear()} Suly Pretty Nails
      </div>
    </body></html>`;
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (SHARED_SECRET && req.headers.get('x-sync-secret') !== SHARED_SECRET) {
    return json(401, { error: 'unauthorized' });
  }
  if (!RESEND_API_KEY) return json(500, { error: 'missing_resend_key' });

  const date = tomorrowLocal();
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('id, client_name, client_email, booking_time, cancellation_token, booking_date, status, reminder_email_sent_at, locations(name), booking_services(services(name))')
    .eq('booking_date', date)
    .in('status', ['confirmed', 'pending'])
    .not('client_email', 'is', null)
    .is('reminder_email_sent_at', null);
  if (error) return json(500, { error: 'query_failed', detail: error.message });

  let sent = 0;
  const failures = [];
  for (const b of rows ?? []) {
    if (!b.client_email) continue;
    try {
      const ok = await sendEmail(b.client_email, 'Recordatorio de tu cita — Suly Pretty Nails', reminderHtml(b));
      if (ok) {
        await supabase.from('bookings').update({ reminder_email_sent_at: new Date().toISOString() }).eq('id', b.id);
        sent++;
      } else {
        failures.push(b.id);
      }
    } catch (e) {
      failures.push(b.id);
    }
  }

  return json(200, { ok: true, date, candidates: (rows ?? []).length, sent, failures });
});
