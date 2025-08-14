/**
 * Servicio de notificaciones por email usando Supabase Edge Functions
 * Envía notificaciones al administrador cuando se realiza una reserva o se recibe un mensaje de contacto
 */

import { supabase } from './customSupabaseClient';

const ADMIN_EMAIL = 'nicolasrp432@gmail.com';

// URL de la función Edge de Supabase para envío de emails
const SUPABASE_FUNCTIONS_URL = 'https://qeuqspjpwybaxppqgehm.supabase.co/functions/v1';

/**
 * Formatea una fecha en formato legible
 * @param {string} dateStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} - Fecha formateada
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Envía un email usando la función Edge de Supabase
 * @param {string} to - Destinatario del email
 * @param {string} subject - Asunto del email
 * @param {Object} data - Datos para el email
 * @returns {Promise} - Promesa con el resultado del envío
 */
async function sendEmailViaSupabaseFunction(to, subject, data) {
  try {
    console.log('📧 Enviando email via Supabase Function...');
    
    const { data: result, error } = await supabase.functions.invoke('send-booking-confirmation', {
      body: {
        to: to,
        subject: subject,
        booking: data
      }
    });

    if (error) {
      console.error('❌ Error en función de Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email enviado exitosamente via Supabase Function');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error al invocar función de Supabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía una notificación al administrador cuando se realiza una reserva
 * @param {Object} bookingData - Datos de la reserva
 * @param {Array} services - Servicios seleccionados
 * @param {Object} location - Información de la ubicación
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendBookingNotificationToAdmin = async (bookingData, services, location) => {
  try {
    const servicesText = services
      .map(service => `${service.name} - ${service.price}`)
      .join(', ');

    // Datos para el email
    const emailData = {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      date: bookingData.date,
      time: bookingData.time,
      location: location?.name || '',
      services: services,
      notes: bookingData.notes || 'Sin notas adicionales',
      submissionDate: new Date().toLocaleString('es-ES')
    };

    // Log para debugging
    console.log('📧 Nueva reserva registrada:', {
      cliente: bookingData.name,
      fecha: formatDate(bookingData.date),
      hora: bookingData.time,
      sede: location?.name,
      servicios: servicesText
    });

    // Enviar email al administrador
    const emailResult = await sendEmailViaSupabaseFunction(
      ADMIN_EMAIL,
      `Nueva Reserva - ${bookingData.name} - ${formatDate(bookingData.date)}`,
      emailData
    );

    if (emailResult.success) {
      console.log('✅ Notificación de reserva enviada correctamente al administrador');
      return { success: true, data: emailData };
    } else {
      console.error('❌ Error al enviar notificación de reserva:', emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error('❌ Error al procesar notificación de reserva:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Envía una notificación al administrador cuando se recibe un formulario de contacto
 * @param {Object} contactData - Datos del formulario de contacto
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendContactNotificationToAdmin = async (contactData) => {
  try {
    // Datos para el email
    const emailData = {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone || 'No proporcionado',
      message: contactData.message,
      submissionDate: new Date().toLocaleString('es-ES'),
      // Formato específico para mensajes de contacto
      isContact: true
    };

    // Log para debugging
    console.log('📧 Nuevo mensaje de contacto:', {
      de: contactData.name,
      email: contactData.email,
      mensaje: contactData.message.substring(0, 100) + '...'
    });

    // Enviar email al administrador
    const emailResult = await sendEmailViaSupabaseFunction(
      ADMIN_EMAIL,
      `Nuevo Mensaje de Contacto - ${contactData.name}`,
      emailData
    );

    if (emailResult.success) {
      console.log('✅ Notificación de contacto enviada correctamente al administrador');
      return { success: true, data: emailData };
    } else {
      console.error('❌ Error al enviar notificación de contacto:', emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error('❌ Error al procesar notificación de contacto:', error);
    return { success: false, error: error.message || error };
  }
};

// Funciones obsoletas eliminadas:
// - sendBookingConfirmationEmail (ya no se envían emails de confirmación al cliente)
// - Todas las dependencias de EmailJS han sido removidas