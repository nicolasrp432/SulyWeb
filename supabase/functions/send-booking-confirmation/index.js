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
        
        <p><strong>Servicios:</strong></p>
        <ul>
          ${servicesList}
        </ul>
      </div>
      
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
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Suly Pretty Nails. Todos los derechos reservados.</p>
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
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Obtener datos del cuerpo de la solicitud
    const { to, subject, booking } = await req.json();
    
    // Validar datos requeridos
    if (!to || !subject || !booking) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generar HTML del correo según el tipo de payload
    const htmlContent = booking?.isContact
      ? (booking?.forUser ? generateContactConfirmationHtml(booking) : generateContactEmailHtml(booking))
      : generateEmailHtml(booking);
    
    // Enviar correo
    const result = await sendEmail(to, subject, htmlContent);
    
    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Nota: el código inferior era inalcanzable anteriormente y se mantiene fuera de flujo
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});