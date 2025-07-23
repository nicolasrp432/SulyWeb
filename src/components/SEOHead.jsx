import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title = 'Suly Pretty Nails - Salón de Uñas en Basauri y Galdakao',
  description = 'Salón de uñas profesional en Basauri y Galdakao. Manicura, pedicura, uñas acrílicas, gel y nail art. Reserva tu cita online.',
  keywords = 'uñas Basauri, manicura Galdakao, nail art Bizkaia, pedicura, uñas acrílicas, uñas gel, salón belleza',
  image = '/logosuly.jpeg',
  type = 'website'
}) => {
  const location = useLocation();
  const currentUrl = `https://sulyprettynails.com${location.pathname}`;
  
  // Configuración específica por página
  const getPageConfig = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Suly Pretty Nails - Salón de Uñas Profesional en Basauri y Galdakao',
          description: 'Salón de uñas profesional en Basauri y Galdakao. Manicura semipermanente, uñas acrílicas, gel, pedicura spa y nail art. Reserva tu cita online.',
          keywords: 'uñas Basauri, manicura Galdakao, nail art Bizkaia, pedicura spa, uñas acrílicas, uñas gel, salón belleza'
        };
      case '/servicios':
        return {
          title: 'Servicios de Manicura y Pedicura - Suly Pretty Nails',
          description: 'Descubre nuestros servicios: manicura semipermanente, acrílica, gel, pedicura spa, nail art y más. Precios desde 12€. Reserva online.',
          keywords: 'manicura semipermanente, uñas acrílicas, pedicura spa, nail art, lifting pestañas, depilación cejas'
        };
      case '/galeria':
        return {
          title: 'Galería de Trabajos - Nail Art y Diseños Únicos',
          description: 'Explora nuestra galería con los mejores trabajos de nail art, manicuras y pedicuras realizados en nuestro salón de Basauri.',
          keywords: 'galería nail art, diseños uñas, trabajos manicura, fotos pedicura, inspiración uñas'
        };
      case '/contacto':
        return {
          title: 'Contacto y Ubicación - Suly Pretty Nails Basauri',
          description: 'Visítanos en Basauri o contáctanos por WhatsApp. Horarios, ubicación y formulario de contacto para tu salón de uñas de confianza.',
          keywords: 'contacto salón uñas Basauri, ubicación Galdakao, WhatsApp reservas, horarios manicura'
        };
      case '/reservas':
        return {
          title: 'Reserva tu Cita Online - Suly Pretty Nails',
          description: 'Reserva tu cita de manicura o pedicura online. Selecciona servicios, fecha y hora. Confirmación inmediata por WhatsApp.',
          keywords: 'reservar cita manicura, booking online uñas, cita pedicura Basauri, reserva nail art'
        };
      default:
        return { title, description, keywords };
    }
  };

  const pageConfig = getPageConfig();

  return (
    <Helmet>
      {/* Meta tags básicos */}
      <title>{pageConfig.title}</title>
      <meta name="description" content={pageConfig.description} />
      <meta name="keywords" content={pageConfig.keywords} />
      <meta name="author" content="Suly Pretty Nails" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageConfig.title} />
      <meta property="og:description" content={pageConfig.description} />
      <meta property="og:image" content={`https://sulyprettynails.com${image}`} />
      <meta property="og:site_name" content="Suly Pretty Nails" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={pageConfig.title} />
      <meta property="twitter:description" content={pageConfig.description} />
      <meta property="twitter:image" content={`https://sulyprettynails.com${image}`} />
      
      {/* Geolocalización */}
      <meta name="geo.region" content="ES-PV" />
      <meta name="geo.placename" content="Basauri, Bizkaia" />
      <meta name="geo.position" content="43.2327;-2.8864" />
      <meta name="ICBM" content="43.2327, -2.8864" />
      
      {/* Schema.org para negocio local */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BeautySalon",
          "name": "Suly Pretty Nails",
          "description": "Salón de uñas profesional especializado en manicura, pedicura y nail art",
          "url": "https://sulyprettynails.com",
          "telephone": "+34-XXX-XXX-XXX",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Calle Principal",
            "addressLocality": "Basauri",
            "addressRegion": "Bizkaia",
            "postalCode": "48970",
            "addressCountry": "ES"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 43.2327,
            "longitude": -2.8864
          },
          "openingHours": [
            "Mo-Fr 09:00-20:00",
            "Sa 09:00-18:00"
          ],
          "priceRange": "€€",
          "servedCuisine": [],
          "serviceType": ["Manicura", "Pedicura", "Nail Art", "Uñas Acrílicas", "Uñas Gel"],
          "areaServed": ["Basauri", "Galdakao", "Bilbao", "Bizkaia"],
          "image": `https://sulyprettynails.com${image}`,
          "sameAs": [
            "https://www.instagram.com/sulyprettynails",
            "https://www.facebook.com/sulyprettynails"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;