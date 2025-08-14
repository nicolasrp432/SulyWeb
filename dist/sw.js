// Service Worker para optimización de rendimiento
const CACHE_NAME = 'suly-pretty-nails-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/icons8-finger-16.png',
  // Fuentes críticas
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Recursos dinámicos importantes
const IMPORTANT_ROUTES = [
  '/',
  '/servicios',
  '/reservas',
  '/contacto',
  '/galeria'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estrategia Cache First para recursos estáticos
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              return caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
    );
    return;
  }

  // Estrategia Network First para rutas importantes
  if (IMPORTANT_ROUTES.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo cachear respuestas exitosas
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback al cache si la red falla
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia Cache First para imágenes
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              // Solo cachear imágenes exitosas
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            })
            .catch(() => {
              // Fallback a imagen por defecto si es necesario
              return new Response('', { status: 404 });
            });
        })
    );
    return;
  }

  // Para otros recursos, usar estrategia Network First
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Limpiar cache periódicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.open(DYNAMIC_CACHE)
      .then((cache) => {
        return cache.keys();
      })
      .then((requests) => {
        // Mantener solo los últimos 50 elementos en cache dinámico
        if (requests.length > 50) {
          const toDelete = requests.slice(0, requests.length - 50);
          return Promise.all(
            toDelete.map((request) => {
              return caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.delete(request));
            })
          );
        }
      });
  }
});