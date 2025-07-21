/**
 * Servicio para enviar correos electrónicos usando EmailJS como alternativa
 * a las funciones Edge de Supabase.
 */

// Constantes para EmailJS
const EMAILJS_SERVICE_ID = 'service_sulyprettynails'; // Reemplazar con tu ID de servicio
const EMAILJS_TEMPLATE_ID = 'template_booking_confirmation'; // Reemplazar con tu ID de plantilla
const EMAILJS_PUBLIC_KEY = 'tu_clave_publica_emailjs'; // Reemplazar con tu clave pública

/**
 * Envía un correo de confirmación de reserva usando EmailJS
 * @param {Object} bookingData - Datos de la reserva
 * @param {Array} services - Servicios seleccionados con detalles
 * @param {Object} location - Información de la ubicación
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendBookingConfirmationEmail = async (bookingData, services, location) => {
  // Importar EmailJS dinámicamente para evitar problemas en SSR
  const emailjs = await import('@emailjs/browser');
  
  // Inicializar EmailJS
  emailjs.init(EMAILJS_PUBLIC_KEY);
  
  // Formatear los servicios para la plantilla
  const servicesText = services
    .map(service => `${service.name} - ${service.price}`)
    .join(', ');
  
  // Preparar los datos para la plantilla
  const templateParams = {
    to_email: bookingData.email,
    to_name: bookingData.name,
    booking_date: formatDate(bookingData.date),
    booking_time: bookingData.time,
    booking_location: location?.name || '',
    booking_services: servicesText,
    client_phone: bookingData.phone,
    client_notes: bookingData.notes || 'Sin notas adicionales'
  };
  
  try {
    // Enviar el correo
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log('Correo enviado con EmailJS:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error al enviar correo con EmailJS:', error);
    return { success: false, error };
  }
};

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