// Supabase Edge Function para enviar correos de confirmación de reserva
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://esm.sh/smtp-client@0.4.0';

// Configuración de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Configuración de correo
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@sulyprettynails.com';

// Configuración adicional
const ADMIN_EMAIL = 'nicolasrp432@gmail.com';

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

// Función para generar el HTML del correo
function generateEmailHtml(booking) {
  const formattedDate = formatDate(booking.date);
  const servicesList = booking.services
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
      
      <p>Hola <span class="highlight">${booking.name}</span>,</p>
      
      <p>¡Gracias por reservar con nosotros! Tu cita ha sido confirmada con los siguientes detalles:</p>
      
      <div class="booking-details">
        <h2>Detalles de tu Reserva</h2>
        <p><strong>Fecha:</strong> ${formattedDate}</p>
        <p><strong>Hora:</strong> ${booking.time}</p>
        <p><strong>Ubicación:</strong> ${booking.location}</p>
        
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

// Función para enviar el correo
async function sendEmail(to, subject, htmlContent) {
  const client = new SmtpClient();
  
  try {
    await client.connect({
      host: SMTP_HOST,
      port: SMTP_PORT,
      use_tls: true,
    });
    
    await client.authenticate({
      username: SMTP_USER,
      password: SMTP_PASSWORD,
    });
    
    await client.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      content: htmlContent,
      html: true,
    });
    
    await client.close();
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    try {
      await client.close();
    } catch (e) {
      // Ignorar errores al cerrar la conexión
    }
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
          <p><strong>Fecha:</strong> ${formatDate(booking.date)}</p>
          <p><strong>Hora:</strong> ${booking.time}</p>
          <p><strong>Ubicación:</strong> ${booking.location}</p>
          
          <p><strong>Servicios:</strong></p>
          <ul>
            ${booking.services.map(service => `<li>${service.name} - ${service.price}</li>`).join('')}
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
    
    // Generar HTML del correo
    const htmlContent = generateEmailHtml(booking);
    
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
    
    // Enviar correo de confirmación al cliente
    const clientHtml = generateEmailHtml(booking);
    const clientResult = await sendEmail(to, subject, clientHtml);
    
    // Enviar notificación al administrador
    const adminResult = await sendAdminNotification(booking);
    
    if (clientResult.success) {
      console.log('Correo enviado al cliente y notificación al admin');
      return new Response(JSON.stringify({ 
        success: true, 
        clientEmail: clientResult.success,
        adminEmail: adminResult.success 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: clientResult.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});