// Configuración SEO para Suly Pretty Nails
// Optimizado para búsquedas locales en Bilbao, Basauri y Galdakao

export const seoConfig = {
  // Información básica del negocio
  businessName: "Suly Pretty Nails",
  businessType: "Salón de Belleza",
  
  // Ubicaciones principales
  locations: {
    primary: "Basauri, Bilbao",
    secondary: "Galdakao, Bilbao",
    province: "Vizcaya",
    region: "País Vasco",
    country: "España"
  },
  
  // Servicios principales para SEO
  mainServices: [
    "manicura",
    "pedicura", 
    "uñas de gel",
    "uñas semipermanentes",
    "lifting de pestañas",
    "depilación",
    "diseño de uñas"
  ],
  
  // Keywords principales
  keywords: {
    primary: [
      "salón de uñas Bilbao",
      "manicura Basauri",
      "pedicura Galdakao",
      "uñas Bilbao",
      "centro de belleza Basauri",
      "salón de belleza Galdakao"
    ],
    secondary: [
      "uñas de gel Bilbao",
      "manicura semipermanente Basauri",
      "lifting pestañas Galdakao",
      "depilación cejas Bilbao",
      "diseño uñas Vizcaya",
      "centro estética País Vasco"
    ],
    longTail: [
      "mejor salón de uñas en Bilbao",
      "manicura profesional Basauri precio",
      "pedicura spa Galdakao",
      "donde hacerse las uñas en Bilbao",
      "salón de belleza cerca de Bilbao",
      "reservar cita manicura Basauri online"
    ]
  },
  
  // Información de contacto
  contact: {
    phone: "+34 XXX XXX XXX", // Reemplazar con número real
    whatsapp: "https://wa.link/f3tn6z",
    email: "info@sulyprettynails.com", // Reemplazar con email real
    website: "https://sulyprettynails.com" // Reemplazar con dominio real
  },
  
  // Horarios de apertura (importante para SEO local)
  openingHours: {
    monday: "09:00-20:00",
    tuesday: "09:00-20:00", 
    wednesday: "09:00-20:00",
    thursday: "09:00-20:00",
    friday: "09:00-20:00",
    saturday: "09:00-18:00",
    sunday: "Cerrado"
  },
  
  // Direcciones (importante para SEO local)
  addresses: {
    basauri: {
      street: "Calle Principal 123", // Reemplazar con dirección real
      city: "Basauri",
      postalCode: "48970",
      province: "Vizcaya",
      country: "España"
    },
    galdakao: {
      street: "Avenida Central 456", // Reemplazar con dirección real  
      city: "Galdakao",
      postalCode: "48960",
      province: "Vizcaya",
      country: "España"
    }
  },
  
  // Precios aproximados (ayuda con búsquedas de precios)
  priceRange: "€€",
  averagePrices: {
    manicura: "Desde 9,90€",
    pedicura: "Desde 14,90€",
    lifting: "Desde 15,90€",
    depilacion: "Desde 5€"
  },
  
  // Social media
  socialMedia: {
    instagram: "@sulyprettynails", // Reemplazar con handle real
    facebook: "SulyPrettyNails", // Reemplazar con página real
    tiktok: "@sulyprettynails" // Si existe
  }
};

// Función para generar meta tags dinámicos
export const generateSEOTags = (page = 'home') => {
  const baseTitle = seoConfig.businessName;
  const baseDescription = `${seoConfig.businessName} - Salón de belleza especializado en manicura, pedicura y tratamientos de uñas en ${seoConfig.locations.primary} y ${seoConfig.locations.secondary}.`;
  
  const pages = {
    home: {
      title: `${baseTitle} - Salón de Uñas en Bilbao | Manicura y Pedicura Basauri y Galdakao`,
      description: `✨ Mejor salón de uñas en Bilbao. Manicura, pedicura, uñas de gel y lifting de pestañas en Basauri y Galdakao. ¡Reserva tu cita online!`,
      keywords: seoConfig.keywords.primary.join(', ')
    },
    services: {
      title: `Servicios de Manicura y Pedicura en Bilbao | ${baseTitle}`,
      description: `Descubre todos nuestros servicios: manicura gel, pedicura spa, lifting de pestañas y depilación en Basauri y Galdakao. Precios desde 5€.`,
      keywords: seoConfig.keywords.secondary.join(', ')
    },
    gallery: {
      title: `Galería de Trabajos - Diseños de Uñas Bilbao | ${baseTitle}`,
      description: `Ve nuestros mejores trabajos de manicura y diseños de uñas. Inspiración para tu próxima visita a nuestro salón en Basauri o Galdakao.`,
      keywords: 'diseños uñas Bilbao, galería manicura, trabajos uñas Basauri'
    },
    booking: {
      title: `Reservar Cita Online - Manicura Bilbao | ${baseTitle}`,
      description: `Reserva tu cita de manicura, pedicura o lifting de pestañas online. Disponible en Basauri y Galdakao. ¡Fácil y rápido!`,
      keywords: 'reservar cita manicura Bilbao, cita online uñas Basauri'
    },
    contact: {
      title: `Contacto y Ubicación - Salón de Uñas Bilbao | ${baseTitle}`,
      description: `Encuéntranos en Basauri y Galdakao. Horarios, teléfono y cómo llegar a nuestro salón de belleza en Bilbao.`,
      keywords: 'contacto salón uñas Bilbao, ubicación manicura Basauri'
    }
  };
  
  return pages[page] || pages.home;
};

// Schema.org structured data para SEO local
export const generateStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": seoConfig.businessName,
    "description": "Salón de belleza especializado en manicura, pedicura, uñas de gel y tratamientos de belleza",
    "url": seoConfig.contact.website,
    "telephone": seoConfig.contact.phone,
    "priceRange": seoConfig.priceRange,
    "servesCuisine": null,
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": seoConfig.addresses.basauri.street,
        "addressLocality": seoConfig.addresses.basauri.city,
        "postalCode": seoConfig.addresses.basauri.postalCode,
        "addressRegion": seoConfig.addresses.basauri.province,
        "addressCountry": seoConfig.addresses.basauri.country
      },
      {
        "@type": "PostalAddress", 
        "streetAddress": seoConfig.addresses.galdakao.street,
        "addressLocality": seoConfig.addresses.galdakao.city,
        "postalCode": seoConfig.addresses.galdakao.postalCode,
        "addressRegion": seoConfig.addresses.galdakao.province,
        "addressCountry": seoConfig.addresses.galdakao.country
      }
    ],
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.2627", // Coordenadas aproximadas de Bilbao
      "longitude": "-2.9253"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification", 
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      `https://instagram.com/${seoConfig.socialMedia.instagram.replace('@', '')}`,
      `https://facebook.com/${seoConfig.socialMedia.facebook}`
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicios de Belleza",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Manicura",
            "description": "Servicios de manicura profesional con gel y semipermanente"
          },
          "price": "9.90",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Pedicura",
            "description": "Pedicura completa y tratamientos spa para pies"
          },
          "price": "14.90",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Lifting de Pestañas", 
            "description": "Tratamiento para realzar la mirada de forma natural"
          },
          "price": "15.90",
          "priceCurrency": "EUR"
        }
      ]
    }
  };
};