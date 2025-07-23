import React from 'react';
import { Helmet } from 'react-helmet-async';

// Componente para integrar Google Analytics y otras herramientas de seguimiento
const Analytics = ({ 
  googleAnalyticsId = null,
  googleTagManagerId = null,
  facebookPixelId = null,
  hotjarId = null
}) => {
  return (
    <Helmet>
      {/* Google Analytics 4 */}
      {googleAnalyticsId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}></script>
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}', {
                page_title: document.title,
                page_location: window.location.href,
                send_page_view: true,
                // Configuración para negocio local
                custom_map: {
                  'custom_parameter_1': 'business_location',
                  'custom_parameter_2': 'service_type'
                },
                business_location: 'Bilbao_Basauri_Galdakao',
                service_type: 'beauty_salon'
              });
              
              // Eventos personalizados para salón de belleza
              function trackServiceView(serviceName) {
                gtag('event', 'view_service', {
                  event_category: 'Services',
                  event_label: serviceName,
                  custom_parameter_1: 'Bilbao_Basauri_Galdakao',
                  custom_parameter_2: 'beauty_salon'
                });
              }
              
              function trackBookingStart() {
                gtag('event', 'begin_checkout', {
                  event_category: 'Booking',
                  event_label: 'booking_started',
                  currency: 'EUR'
                });
              }
              
              function trackBookingComplete(value, services) {
                gtag('event', 'purchase', {
                  event_category: 'Booking',
                  event_label: 'booking_completed',
                  value: value,
                  currency: 'EUR',
                  items: services
                });
              }
              
              function trackPhoneClick() {
                gtag('event', 'phone_call', {
                  event_category: 'Contact',
                  event_label: 'phone_clicked'
                });
              }
              
              function trackWhatsAppClick() {
                gtag('event', 'whatsapp_click', {
                  event_category: 'Contact',
                  event_label: 'whatsapp_clicked'
                });
              }
              
              // Hacer funciones disponibles globalmente
              window.trackServiceView = trackServiceView;
              window.trackBookingStart = trackBookingStart;
              window.trackBookingComplete = trackBookingComplete;
              window.trackPhoneClick = trackPhoneClick;
              window.trackWhatsAppClick = trackWhatsAppClick;
            `}
          </script>
        </>
      )}
      
      {/* Google Tag Manager */}
      {googleTagManagerId && (
        <>
          <script>
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `}
          </script>
          <noscript>
            <iframe 
              src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
              height="0" 
              width="0" 
              style={{display: 'none', visibility: 'hidden'}}
            ></iframe>
          </noscript>
        </>
      )}
      
      {/* Facebook Pixel */}
      {facebookPixelId && (
        <script>
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${facebookPixelId}');
            fbq('track', 'PageView');
            
            // Eventos personalizados para Facebook
            window.fbTrackServiceView = function(serviceName, value) {
              fbq('track', 'ViewContent', {
                content_name: serviceName,
                content_category: 'Beauty Service',
                value: value,
                currency: 'EUR'
              });
            };
            
            window.fbTrackBookingStart = function() {
              fbq('track', 'InitiateCheckout');
            };
            
            window.fbTrackBookingComplete = function(value) {
              fbq('track', 'Purchase', {
                value: value,
                currency: 'EUR'
              });
            };
            
            window.fbTrackLead = function() {
              fbq('track', 'Lead');
            };
          `}
        </script>
      )}
      
      {/* Hotjar */}
      {hotjarId && (
        <script>
          {`
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${hotjarId},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </script>
      )}
      
      {/* Schema.org para eventos de seguimiento */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Suly Pretty Nails",
          "url": "https://sulyprettynails.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://sulyprettynails.com/servicios?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          },
          "sameAs": [
            "https://instagram.com/sulyprettynails",
            "https://facebook.com/sulyprettynails"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default Analytics;

// Hook personalizado para tracking de eventos
export const useAnalytics = () => {
  const trackServiceView = (serviceName, value = 0) => {
    // Google Analytics
    if (window.trackServiceView) {
      window.trackServiceView(serviceName);
    }
    
    // Facebook Pixel
    if (window.fbTrackServiceView) {
      window.fbTrackServiceView(serviceName, value);
    }
  };
  
  const trackBookingStart = () => {
    if (window.trackBookingStart) {
      window.trackBookingStart();
    }
    
    if (window.fbTrackBookingStart) {
      window.fbTrackBookingStart();
    }
  };
  
  const trackBookingComplete = (value, services = []) => {
    if (window.trackBookingComplete) {
      window.trackBookingComplete(value, services);
    }
    
    if (window.fbTrackBookingComplete) {
      window.fbTrackBookingComplete(value);
    }
  };
  
  const trackPhoneClick = () => {
    if (window.trackPhoneClick) {
      window.trackPhoneClick();
    }
  };
  
  const trackWhatsAppClick = () => {
    if (window.trackWhatsAppClick) {
      window.trackWhatsAppClick();
    }
  };
  
  const trackLead = () => {
    if (window.fbTrackLead) {
      window.fbTrackLead();
    }
  };
  
  return {
    trackServiceView,
    trackBookingStart,
    trackBookingComplete,
    trackPhoneClick,
    trackWhatsAppClick,
    trackLead
  };
};