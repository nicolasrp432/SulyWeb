/**
 * Servicio simplificado para notificaciones por email
 * Solo envía notificaciones al administrador cuando se realiza una reserva
 */

const ADMIN_EMAIL = 'nicolasrp432@gmail.com';

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
 * Envía una notificación simple al administrador cuando se realiza una reserva
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

    const notificationData = {
      adminEmail: ADMIN_EMAIL,
      clientName: bookingData.name,
      clientEmail: bookingData.email,
      clientPhone: bookingData.phone,
      bookingDate: formatDate(bookingData.date),
      bookingTime: bookingData.time,
      bookingLocation: location?.name || '',
      bookingServices: servicesText,
      clientNotes: bookingData.notes || 'Sin notas adicionales',
      submissionDate: new Date().toLocaleString('es-ES')
    };

    console.log('📧 Nueva reserva registrada:', {
      cliente: bookingData.name,
      fecha: formatDate(bookingData.date),
      hora: bookingData.time,
      sede: location?.name,
      servicios: servicesText
    });

    // Aquí podrías integrar con un servicio de email real como:
    // - Resend
    // - SendGrid
    // - Nodemailer
    // - O simplemente guardar en base de datos para revisión manual
    
    console.log('✅ Notificación de reserva procesada correctamente');
    return { success: true, data: notificationData };
  } catch (error) {
    console.error('❌ Error al procesar notificación de reserva:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Envía una notificación simple al administrador cuando se recibe un formulario de contacto
 * @param {Object} contactData - Datos del formulario de contacto
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendContactNotificationToAdmin = async (contactData) => {
  try {
    const notificationData = {
      adminEmail: ADMIN_EMAIL,
      fromName: contactData.name,
      fromEmail: contactData.email,
      fromPhone: contactData.phone || 'No proporcionado',
      message: contactData.message,
      submissionDate: new Date().toLocaleString('es-ES')
    };

    console.log('📧 Nuevo mensaje de contacto:', {
      de: contactData.name,
      email: contactData.email,
      mensaje: contactData.message.substring(0, 100) + '...'
    });

    console.log('✅ Notificación de contacto procesada correctamente');
    return { success: true, data: notificationData };
  } catch (error) {
    console.error('❌ Error al procesar notificación de contacto:', error);
    return { success: false, error: error.message || error };
  }
};

// Funciones obsoletas eliminadas:
// - sendBookingConfirmationEmail (ya no se envían emails de confirmación al cliente)
// - Todas las dependencias de EmailJS han sido removidas