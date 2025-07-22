import * as Sentry from '@sentry/react';

/**
 * Configuración de Sentry para monitoreo de errores
 * Solo se inicializa en producción
 */
export const initSentry = () => {
  // Solo inicializar en producción
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sentry no inicializado en desarrollo');
    return;
  }

  // Verificar que existe la DSN de Sentry
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) {
    console.warn('VITE_SENTRY_DSN no configurado');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    
    // Configuración de rendimiento
    tracesSampleRate: 0.1, // 10% de las transacciones
    
    // Configuración de sesiones
    autoSessionTracking: true,
    
    // Filtros de errores
    beforeSend(event, hint) {
      // Filtrar errores conocidos o irrelevantes
      const error = hint.originalException;
      
      // Ignorar errores de red comunes
      if (error && error.message) {
        const message = error.message.toLowerCase();
        if (
          message.includes('network error') ||
          message.includes('fetch') ||
          message.includes('loading chunk') ||
          message.includes('script error')
        ) {
          return null;
        }
      }
      
      // Ignorar errores de extensiones del navegador
      if (event.exception) {
        const stacktrace = event.exception.values[0]?.stacktrace;
        if (stacktrace?.frames) {
          const isExtensionError = stacktrace.frames.some(frame => 
            frame.filename && (
              frame.filename.includes('extension://') ||
              frame.filename.includes('moz-extension://') ||
              frame.filename.includes('safari-extension://')
            )
          );
          if (isExtensionError) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // Configuración de contexto
    initialScope: {
      tags: {
        component: 'suly-pretty-nails'
      },
      user: {
        // Se puede configurar información del usuario aquí
      }
    },
    
    // Configuración de integración
    integrations: [
      new Sentry.BrowserTracing({
        // Configuración de routing para React Router
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
  });

  console.log('Sentry inicializado correctamente');
};

/**
 * Función para capturar errores manualmente
 */
export const captureError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error capturado:', error, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    // Agregar contexto adicional
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    Sentry.captureException(error);
  });
};

/**
 * Función para capturar mensajes informativos
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}] ${message}`, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    Sentry.captureMessage(message, level);
  });
};

/**
 * Función para configurar información del usuario
 */
export const setUser = (userInfo) => {
  Sentry.setUser(userInfo);
};

/**
 * Función para agregar breadcrumbs personalizados
 */
export const addBreadcrumb = (breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

export default Sentry;