/**
 * Servicio de notificaciones por email usando Supabase Edge Functions
 * Envía notificaciones al administrador cuando se realiza una reserva o se recibe un mensaje de contacto
 */

import { supabase } from './customSupabaseClient';

const ADMIN_EMAIL = 'sulyprettynails@gmail.com';

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

    const normalizedPhone = (bookingData.phone || '').toString().trim();

    // Datos para el email
    const emailData = {
      name: bookingData.name,
      email: bookingData.email,
      phone: normalizedPhone || 'No proporcionado',
      date: bookingData.date,
      time: bookingData.time,
      location: location?.name || '',
      services: services,
      notes: bookingData.notes || 'Sin notas adicionales',
      submissionDate: new Date().toLocaleString('es-ES'),
      // Flag para que la plantilla incluya acciones rápidas para WhatsApp en el correo del admin
      forAdmin: true
    };

    // Log para debugging
    console.log('📧 Nueva reserva registrada:', {
      cliente: bookingData.name,
      telefono: normalizedPhone,
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
    const normalizedPhone = (contactData.phone || '').toString().trim() || 'No proporcionado';

    // Datos para el email
    const emailData = {
      name: contactData.name,
      email: contactData.email,
      phone: normalizedPhone,
      message: contactData.message,
      submissionDate: new Date().toLocaleString('es-ES'),
      // Formato específico para mensajes de contacto
      isContact: true
    };

    // Log para debugging
    console.log('📧 Nuevo mensaje de contacto:', {
      de: contactData.name,
      email: contactData.email,
      telefono: normalizedPhone,
      mensaje: (contactData.message || '').substring(0, 100) + '...'
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

// NUEVO: Enviar confirmación al usuario para reservas
export const sendBookingConfirmationToUser = async (bookingData, services, location) => {
  try {
    const normalizedPhone = (bookingData.phone || '').toString().trim();

    const emailData = {
      name: bookingData.name,
      email: bookingData.email,
      phone: normalizedPhone || 'No proporcionado',
      date: bookingData.date,
      time: bookingData.time,
      location: location?.name || '',
      services: services || [],
      notes: bookingData.notes || 'Sin notas adicionales',
      submissionDate: new Date().toLocaleString('es-ES')
    };

    const emailResult = await sendEmailViaSupabaseFunction(
      bookingData.email,
      `Confirmación de Reserva - ${formatDate(bookingData.date)} a las ${bookingData.time}`,
      emailData
    );

    if (emailResult.success) return { success: true, data: emailData };
    return { success: false, error: emailResult.error };
  } catch (error) {
    console.error('❌ Error al enviar confirmación de reserva al usuario:', error);
    return { success: false, error: error.message || error };
  }
};

// NUEVO: Enviar confirmación al usuario para formulario de contacto
export const sendContactConfirmationToUser = async (contactData) => {
  try {
    const normalizedPhone = (contactData.phone || '').toString().trim();

    const emailData = {
      name: contactData.name,
      email: contactData.email,
      phone: normalizedPhone || 'No proporcionado',
      message: contactData.message,
      submissionDate: new Date().toLocaleString('es-ES'),
      isContact: true,
      forUser: true
    };

    const emailResult = await sendEmailViaSupabaseFunction(
      contactData.email,
      'Hemos recibido tu mensaje - Suly Pretty Nails',
      emailData
    );

    if (emailResult.success) return { success: true, data: emailData };
    return { success: false, error: emailResult.error };
  } catch (error) {
    console.error('❌ Error al enviar confirmación de contacto al usuario:', error);
    return { success: false, error: error.message || error };
  }
};
// Funciones obsoletas eliminadas:
// - sendBookingConfirmationEmail (ya no se envían emails de confirmación al cliente)
// - Todas las dependencias de EmailJS han sido removidas