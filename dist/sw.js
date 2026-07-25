/*
 * Service worker mínimo de Suly Pretty Nails.
 *
 * Su único objetivo es hacer la web "instalable" como app (acceso directo en la
 * pantalla de inicio del iPhone). NO cachea nada a propósito: el panel se
 * actualiza a menudo y un caché agresivo serviría versiones viejas. Cada
 * petición va directa a la red (comportamiento idéntico a no tener SW, pero
 * cumpliendo el requisito de instalabilidad).
 *
 * Aquí NO hay notificaciones push (decisión de producto). Si en el futuro se
 * añaden, este es el sitio donde irían los manejadores 'push' y
 * 'notificationclick'.
 */

// Activa el nuevo SW cuanto antes, sin esperar a que se cierren las pestañas.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough: sin caché. Dejamos que el navegador gestione la red normalmente.
self.addEventListener('fetch', () => {});
