import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateSEOTags, generateStructuredData, seoConfig } from '../../config/seo';

const SEOHead = ({ 
  page = 'home', 
  customTitle = null, 
  customDescription = null,
  customKeywords = null,
  canonicalUrl = null,
  ogImage = null
}) => {
  const seoData = generateSEOTags(page);
  const structuredData = generateStructuredData();
  
  const title = customTitle || seoData.title;
  const description = customDescription || seoData.description;
  const keywords = customKeywords || seoData.keywords;
  
  // URL base del sitio (reemplazar con tu dominio real)
  const baseUrl = seoConfig.contact.website;
  const fullUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;
  
  // Imagen por defecto para Open Graph
  const defaultOgImage = `${baseUrl}/og-image.jpg`; // Crear esta imagen
  const ogImageUrl = ogImage || defaultOgImage;

  return (
    <Helmet>
      {/* Meta tags básicos */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Meta tags para SEO local */}
      <meta name="geo.region" content="ES-PV" />
      <meta name="geo.placename" content="Bilbao, Basauri, Galdakao" />
      <meta name="geo.position" content="43.2627;-2.9253" />
      <meta name="ICBM" content="43.2627, -2.9253" />
      
      {/* Meta tags de negocio local */}
      <meta name="business:contact_data:locality" content="Basauri" />
      <meta name="business:contact_data:region" content="Vizcaya" />
      <meta name="business:contact_data:country_name" content="España" />
      <meta name="business:contact_data:phone_number" content={seoConfig.contact.phone} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="business.business" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={seoConfig.businessName} />
      <meta property="og:locale" content="es_ES" />
      
      {/* Business specific Open Graph */}
      <meta property="business:contact_data:street_address" content={seoConfig.addresses.basauri.street} />
      <meta property="business:contact_data:locality" content={seoConfig.addresses.basauri.city} />
      <meta property="business:contact_data:postal_code" content={seoConfig.addresses.basauri.postalCode} />
      <meta property="business:contact_data:country_name" content={seoConfig.addresses.basauri.country} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      
      {/* Meta tags adicionales para móviles */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Idioma */}
      <meta httpEquiv="content-language" content="es" />
      <html lang="es" />
      
      {/* Structured Data (Schema.org) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Preconnect para mejorar rendimiento */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* DNS Prefetch para servicios externos */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      
      {/* Meta tags específicos para el sector belleza */}
      <meta name="category" content="Beauty Salon" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="General" />
      
      {/* Información de contacto para buscadores */}
      <meta name="contact" content={seoConfig.contact.email} />
      <meta name="author" content={seoConfig.businessName} />
      <meta name="publisher" content={seoConfig.businessName} />
      
      {/* Meta tags para redes sociales específicas */}
      {seoConfig.socialMedia.instagram && (
        <meta name="instagram:site" content={seoConfig.socialMedia.instagram} />
      )}
      
      {/* Información de precios para rich snippets */}
      <meta name="price_range" content={seoConfig.priceRange} />
      
      {/* Meta tag para verificación de Google My Business (si aplica) */}
      {/* <meta name="google-site-verification" content="tu-codigo-de-verificacion" /> */}
    </Helmet>
  );
};

export default SEOHead;