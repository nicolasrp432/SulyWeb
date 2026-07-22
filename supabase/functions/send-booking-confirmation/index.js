// Supabase Edge Function para enviar correos de confirmación de reserva
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuración de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Configuración de correo (Resend)
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Suly Pretty Nails <info@sulyprettynails.com>';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Configuración adicional
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'sulyprettynails@gmail.com';
// Teléfono de WhatsApp de la tienda en formato internacional, p.ej. "34XXXXXXXXX" (sin +)
const BUSINESS_WHATSAPP = (Deno.env.get('BUSINESS_WHATSAPP') || '').replace(/[^0-9]/g, '');
const LOGO_URL = Deno.env.get('LOGO_URL') || 'https://sulyprettynails.com/logosuly.jpeg';

// CORS restringido por sufijo de dominio (evita usar la función como relay
// desde webs de terceros) sin romper despliegues legítimos: el dominio del
// salón (cualquier subdominio), previews de Vercel y desarrollo local.
// Dominio base configurable con SITE_DOMAIN.
const SITE_DOMAIN = Deno.env.get('SITE_DOMAIN') || 'sulyprettynails.com';
const FALLBACK_ORIGIN = `https://${SITE_DOMAIN}`;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  let host;
  try { host = new URL(origin).hostname; } catch { return false; }
  return host === SITE_DOMAIN
    || host.endsWith(`.${SITE_DOMAIN}`)
    || host.endsWith('.vercel.app')
    || host === 'localhost'
    || host === '127.0.0.1';
}

function corsFor(req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : FALLBACK_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
const cap = (v, n) => String(v ?? '').slice(0, n);

// ¿La llamada la hace un admin activo? (se valida el JWT del panel).
// Se usa para permitir SOLO a admins el envío de correos con asunto/cuerpo
// libres (forCustomEmail); el resto de payloads usan plantillas fijas.
async function isActiveAdmin(req) {
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return false;
    const svc = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await svc.auth.getUser(token);
    if (!user) return false;
    const { data } = await svc.from('admin_profiles').select('is_active').eq('id', user.id).maybeSingle();
    return !!data?.is_active;
  } catch {
    return false;
  }
}

// Escapa HTML para insertar texto plano del admin de forma segura
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Función para formatear la fecha
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para generar el HTML del correo (reservas)
function generateEmailHtml(booking) {
  const formattedDate = booking?.date ? formatDate(booking.date) : '';
  const servicesList = (booking?.services || [])
    .map(service => `<li>${service.name} - ${service.price}</li>`)
    .join('');

  // Si es email para el administrador, añadimos botones rápidos para WhatsApp
  let adminActionsHtml = '';
  if (booking?.forAdmin) {
    const summaryText = `Nueva reserva\nNombre: ${booking?.name || ''}\nEmail: ${booking?.email || ''}\nTeléfono: ${booking?.phone || ''}\nFecha: ${formattedDate}\nHora: ${booking?.time || ''}\nUbicación: ${booking?.location || ''}`;
    const clientGreet = `Hola ${booking?.name || ''}, soy de Suly Pretty Nails. Te confirmo tu cita el ${formattedDate} a las ${booking?.time || ''} en ${booking?.location || ''}.`;
    const waToStore = BUSINESS_WHATSAPP ? `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(summaryText)}` : '';
    const clientPhone = (booking?.phone || '').toString().replace(/[^0-9]/g, '');
    const waToClient = clientPhone ? `https://wa.me/${clientPhone}?text=${encodeURIComponent(clientGreet)}` : '';
    adminActionsHtml = `
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
        <p style="margin:0 0 8px 0;font-weight:bold;color:#be185d;">Acciones rápidas</p>
        <div>
          ${waToStore ? `<a href="${waToStore}" target="_blank" style="display:inline-block;margin-right:8px;background:#25D366;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">Enviar a WhatsApp de la tienda</a>` : ''}
          ${waToClient ? `<a href="${waToClient}" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">Escribir al cliente por WhatsApp</a>` : ''}
        </div>
      </div>`;
  }

  // Si es email para el usuario, añadimos botón para escribir por WhatsApp a la tienda
  let userActionsHtml = '';
  if (!booking?.forAdmin) {
    const userText = `Hola, soy ${booking?.name || 'cliente'} y tengo una consulta sobre mi cita del ${formattedDate} a las ${booking?.time || ''} en ${booking?.location || ''}.`;
    const waToStore = BUSINESS_WHATSAPP ? `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(userText)}` : '';
    if (waToStore) {
      userActionsHtml = `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
          <a href="${waToStore}" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Contactar por WhatsApp</a>
        </div>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Reserva - Suly Pretty Nails</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header img { max-width: 150px; }
        h1 { color: #e11d48; }
        .booking-details { background-color: #fdf2f8; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .booking-details h2 { color: #be185d; margin-top: 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        ul { padding-left: 20px; }
        .highlight { color: #be185d; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Suly Pretty Nails</h1>
      </div>
      
      <p>Hola <span class="highlight">${booking?.name || ''}</span>,</p>
      
      <p>¡Gracias por reservar con nosotros! Tu cita ha sido confirmada con los siguientes detalles:</p>
      
      <div class="booking-details">
        <h2>Detalles de tu Reserva</h2>
        <p><strong>Fecha:</strong> ${formattedDate}</p>
        <p><strong>Hora:</strong> ${booking?.time || ''}</p>
        <p><strong>Ubicación:</strong> ${booking?.location || ''}</p>
        <p><strong>Teléfono:</strong> ${booking?.phone || 'No proporcionado'}</p>
        ${booking?.notes ? `<p><strong>Notas:</strong> ${booking.notes}</p>` : ''}
        
        <p><strong>Servicios:</strong></p>
        <ul>
          ${servicesList}
        </ul>
      </div>
      ${adminActionsHtml}
      ${userActionsHtml}
      
      <p>Si necesitas modificar o cancelar tu cita, por favor contáctanos por WhatsApp al número que aparece en nuestra web con al menos 24 horas de antelación.</p>
      
      <p>¡Esperamos verte pronto!</p>
      
      <p>Saludos,<br>El equipo de Suly Pretty Nails</p>
      
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>© ${new Date().getFullYear()} Suly Pretty Nails. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;
}

// NUEVO: Plantilla para emails del formulario de contacto
function generateContactEmailHtml(contact) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuevo Mensaje de Contacto - Suly Pretty Nails</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e11d48; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .card { background-color: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .row { margin: 8px 0; }
        .label { font-weight: bold; color: #be185d; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        pre { white-space: pre-wrap; word-wrap: break-word; background: #f3f4f6; padding: 12px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Nuevo Mensaje de Contacto</h1>
      </div>
      <div class="content">
        <div class="card">
          <div class="row"><span class="label">Nombre:</span> ${contact?.name || 'Sin nombre'}</div>
          <div class="row"><span class="label">Email:</span> ${contact?.email || 'Sin email'}</div>
          <div class="row"><span class="label">Teléfono:</span> ${contact?.phone || 'No proporcionado'}</div>
          <div class="row"><span class="label">Fecha de envío:</span> ${contact?.submissionDate || new Date().toLocaleString('es-ES')}</div>
          <div class="row"><span class="label">Mensaje:</span></div>
          <pre>${contact?.message || ''}</pre>
        </div>
      </div>
      <div class="footer">
        <p>Este es un correo automático enviado desde el formulario de contacto del sitio web.</p>
        <p>© ${new Date().getFullYear()} Suly Pretty Nails. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;
}

// NUEVO: Plantilla para confirmación al usuario del formulario de contacto
function generateContactConfirmationHtml(contact) {
  // Botón para WhatsApp hacia la tienda
  const userText = `Hola, soy ${contact?.name || 'cliente'} y tengo una consulta sobre el mensaje que envié desde la web.`;
  const waToStore = BUSINESS_WHATSAPP ? `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(userText)}` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hemos recibido tu mensaje - Suly Pretty Nails</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e11d48; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .card { background-color: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Gracias por contactarnos, ${contact?.name || ''}!</h1>
      </div>
      <div class="content">
        <div class="card">
          <p>Hemos recibido tu mensaje correctamente y nuestro equipo te responderá lo antes posible.</p>
          <p><strong>Resumen:</strong></p>
          <p><strong>Nombre:</strong> ${contact?.name || 'Sin nombre'}</p>
          <p><strong>Email:</strong> ${contact?.email || 'Sin email'}</p>
          ${contact?.phone ? `<p><strong>Teléfono:</strong> ${contact.phone}</p>` : ''}
          <p><strong>Fecha de envío:</strong> ${contact?.submissionDate || new Date().toLocaleString('es-ES')}</p>
          ${waToStore ? `<div style="margin-top:12px"><a href="${waToStore}" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Escribirnos por WhatsApp</a></div>` : ''}
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Suly Pretty Nails. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;
}

// NUEVO: Plantilla para correos personalizados que el admin escribe a mano
// (botón "Enviar correo al cliente"). Respeta el texto del admin (saltos de
// línea) y lo envuelve en la identidad visual de la marca.
function generateCustomEmailHtml(booking) {
  const title = escapeHtml(booking?.customSubject || 'Suly Pretty Nails');
  const bodyHtml = escapeHtml(booking?.customMessage || '').replace(/\r?\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 0 auto; padding: 24px; }
        .header { background: #ffffff; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .logo { height: 56px; margin-bottom: 8px; }
        h1 { color: #e11d48; margin: 0; font-size: 22px; }
        .card { background: #ffffff; border-radius: 12px; padding: 24px; margin-top: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img class="logo" alt="Suly Pretty Nails" src="${LOGO_URL}" />
          <h1>Suly Pretty Nails</h1>
        </div>
        <div class="card">
          <p>${bodyHtml}</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} Suly Pretty Nails. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;
}

// Función para enviar el correo usando Resend
async function sendEmail(to, subject, htmlContent) {
  if (!RESEND_API_KEY) return { success: false, error: 'Missing RESEND_API_KEY' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlContent
      })
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Resend API error' };
    return { success: true, data: json };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar notificación al administrador
async function sendAdminNotification(booking) {
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva Reserva - Suly Pretty Nails</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e11d48; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .highlight { color: #e11d48; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Nueva Reserva Recibida</h1>
      </div>
      
      <div class="content">
        <h2>Detalles de la Reserva</h2>
        
        <div class="booking-details">
          <p><strong>Cliente:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Teléfono:</strong> ${booking.phone}</p>
          <p><strong>Fecha:</strong> ${booking.date ? formatDate(booking.date) : ''}</p>
          <p><strong>Hora:</strong> ${booking.time || ''}</p>
          <p><strong>Ubicación:</strong> ${booking.location || ''}</p>
          
          <p><strong>Servicios:</strong></p>
          <ul>
            ${(booking?.services || []).map(service => `<li>${service.name} - ${service.price}</li>`).join('')}
          </ul>
          
          ${booking.notes ? `<p><strong>Notas:</strong> ${booking.notes}</p>` : ''}
        </div>
        
        <p>Esta reserva fue realizada el ${new Date().toLocaleString('es-ES')}.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(ADMIN_EMAIL, 'Nueva Reserva - Suly Pretty Nails', adminHtml);
}

// Manejador principal actualizado
Deno.serve(async (req) => {
  const corsHeaders = corsFor(req);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders
    });
  }

  try {
    // Obtener datos del cuerpo de la solicitud
    const { to, subject, booking } = await req.json();

    // Validar datos requeridos
    if (!to || !subject || !booking || typeof booking !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: jsonHeaders
      });
    }

    // Acotar longitudes para evitar payloads gigantes / abuso.
    const safeBooking = {
      ...booking,
      name: cap(booking.name, 120),
      email: cap(booking.email, 254),
      phone: cap(booking.phone, 40),
      location: cap(booking.location, 120),
      notes: cap(booking.notes, 2000),
      message: cap(booking.message, 4000),
      customSubject: cap(booking.customSubject, 200),
      customMessage: cap(booking.customMessage, 6000),
      services: Array.isArray(booking.services) ? booking.services.slice(0, 30) : [],
    };

    // Determinar destinatario y plantilla según el tipo de payload.
    // Los avisos internos SIEMPRE van al email del salón (se ignora `to`),
    // así este endpoint no puede usarse para enviar a direcciones arbitrarias
    // por esas vías. Los correos "al cliente" van a la dirección indicada,
    // que debe ser un email válido.
    let recipient;
    let htmlContent;

    if (safeBooking.forCustomEmail) {
      // Correo con asunto/cuerpo libres: SOLO admins autenticados.
      if (!(await isActiveAdmin(req))) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401, headers: jsonHeaders
        });
      }
      if (!isValidEmail(to)) {
        return new Response(JSON.stringify({ error: 'invalid_recipient' }), {
          status: 400, headers: jsonHeaders
        });
      }
      recipient = to;
      htmlContent = generateCustomEmailHtml(safeBooking);
    } else if (safeBooking.isContact) {
      if (safeBooking.forUser) {
        if (!isValidEmail(to)) {
          return new Response(JSON.stringify({ error: 'invalid_recipient' }), {
            status: 400, headers: jsonHeaders
          });
        }
        recipient = to;
        htmlContent = generateContactConfirmationHtml(safeBooking);
      } else {
        recipient = ADMIN_EMAIL; // aviso interno: destinatario forzado
        htmlContent = generateContactEmailHtml(safeBooking);
      }
    } else if (safeBooking.forAdmin) {
      recipient = ADMIN_EMAIL; // aviso interno: destinatario forzado
      htmlContent = generateEmailHtml(safeBooking);
    } else {
      // Confirmación de reserva al cliente.
      if (!isValidEmail(to)) {
        return new Response(JSON.stringify({ error: 'invalid_recipient' }), {
          status: 400, headers: jsonHeaders
        });
      }
      recipient = to;
      htmlContent = generateEmailHtml(safeBooking);
    }

    // Asunto: para correos personalizados respetamos el customSubject si viene
    const finalSubject = safeBooking.forCustomEmail
      ? cap(safeBooking.customSubject || subject, 200)
      : cap(subject, 200);

    // Enviar correo
    const result = await sendEmail(recipient, finalSubject, htmlContent);

    if (result.success) {
      return new Response(JSON.stringify({ success: true, data: result.data }), {
        status: 200,
        headers: jsonHeaders
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: jsonHeaders
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders
    });
  }
});