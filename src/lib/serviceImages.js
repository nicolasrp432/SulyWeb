/**
 * Mapping of service names (normalized) to their corresponding images in public/serviciosimg
 */

const SERVICE_IMAGE_MAP = {
  // Manicura
  'cortar + limar': '/serviciosimg/cortar-limar.jpg',
  'cortar limar': '/serviciosimg/cortar-limar.jpg',
  'manicura expres': '/serviciosimg/manicura-expres.jpg',
  'manicura exprés': '/serviciosimg/manicura-expres.jpg',
  'manicura semi expres': '/serviciosimg/manicura-semi-expres.jpg',
  'manicura semi exprés': '/serviciosimg/manicura-semi-expres.jpg',
  'manicura tradicional': '/serviciosimg/manicura-adicional.jpg',
  'manicura adicional': '/serviciosimg/manicura-adicional.jpg',
  
  // Pedicura
  'esmaltar pies': '/serviciosimg/esmaltar-pies.jpg',
  'pedicura completa': '/serviciosimg/pedicura-completa.jpg',
  'pedicura completa semi': '/serviciosimg/pedicura-completa-semi-tradicional.jpg',
  'pedicura completa tradicional': '/serviciosimg/pedicura-completa-semi-tradicional.jpg',
  'pedicura completa semi / tradicional': '/serviciosimg/pedicura-completa-semi-tradicional.jpg',
  
  // Acrílico / Gel
  'relleno acrilico': '/serviciosimg/relleno-acrilico.jpg',
  'relleno acrílico': '/serviciosimg/relleno-acrilico.jpg',
  'relleno de acrilico': '/serviciosimg/relleno-acrilico.jpg',
  'relleno de acrílico': '/serviciosimg/relleno-acrilico.jpg',
  'reparar uña': '/serviciosimg/repara-uña.jpg',
  'reparar una': '/serviciosimg/repara-uña.jpg',
  'retirar acrilico': '/serviciosimg/quitar-acrilico.jpg',
  'retirar acrílico': '/serviciosimg/quitar-acrilico.jpg',
  'quitar acrilico': '/serviciosimg/quitar-acrilico.jpg',
  'quitar acrílico': '/serviciosimg/quitar-acrilico.jpg',
  'retirar semi': '/serviciosimg/retirar-semi.jpg',
  
  // Pestañas
  'lifting de pestañas': '/serviciosimg/lifting-pestañas.jpg',
  'lifting pestañas': '/serviciosimg/lifting-pestañas.jpg',
  'lifting': '/serviciosimg/lifting-pestañas.jpg',
  'retirar pestaña': '/serviciosimg/retiradodepestañas.jpg',
  'retirar pestañas': '/serviciosimg/retiradodepestañas.jpg',
  'retirado de pestañas': '/serviciosimg/retiradodepestañas.jpg',
  
  // Depilación
  'depilar cejas': '/serviciosimg/depilar-cejas.jpg',
  'depilación cejas': '/serviciosimg/depilar-cejas.jpg',
  'cejas': '/serviciosimg/depilar-cejas.jpg',
  'depilar bigote': '/serviciosimg/depilar-bigote.jpg',
  'depilación bigote': '/serviciosimg/depilar-bigote.jpg',
  'bigote': '/serviciosimg/depilar-bigote.jpg',
  'depilar axila': '/serviciosimg/depilar-axilas.jpg',
  'depilar axilas': '/serviciosimg/depilar-axilas.jpg',
  'depilación axilas': '/serviciosimg/depilar-axilas.jpg',
  'axilas': '/serviciosimg/depilar-axilas.jpg',
  'depilar rostro entero': '/serviciosimg/depilar-rostro-entero.jpg',
  'depilación rostro': '/serviciosimg/depilar-rostro-entero.jpg',
  'rostro entero': '/serviciosimg/depilar-rostro-entero.jpg',
};

// Default fallback images by category
const CATEGORY_FALLBACK = {
  nails: '/serviciosimg/manicura-expres.jpg',
  beauty: '/serviciosimg/lifting-pestañas.jpg',
  pedicura: '/serviciosimg/pedicura-completa.jpg',
  depilacion: '/serviciosimg/depilar-cejas.jpg',
  default: '/serviciosimg/manicura-expres.jpg',
};

/**
 * Get the image URL for a service based on its name
 * @param {string} serviceName - The name of the service
 * @param {string} category - Optional category for fallback
 * @returns {string} The image URL
 */
export function getServiceImage(serviceName, category = 'default') {
  if (!serviceName) return CATEGORY_FALLBACK[category] || CATEGORY_FALLBACK.default;
  
  const normalizedName = serviceName.toLowerCase().trim();
  
  // Direct match
  if (SERVICE_IMAGE_MAP[normalizedName]) {
    return SERVICE_IMAGE_MAP[normalizedName];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(SERVICE_IMAGE_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  // Category fallback
  return CATEGORY_FALLBACK[category] || CATEGORY_FALLBACK.default;
}

/**
 * Get image for a service object (from database)
 * @param {Object} service - Service object with name and optionally image_url and category
 * @returns {string} The image URL
 */
export function getServiceImageFromObj(service) {
  // If service already has a valid image_url that's not the generic one, use it
  if (service.image_url && !service.image_url.includes('unsplash.com') && !service.image_url.endsWith('manicura-expres.jpg')) {
    return service.image_url;
  }
  
  return getServiceImage(service.name || service.title, service.category);
}

export { SERVICE_IMAGE_MAP, CATEGORY_FALLBACK };
