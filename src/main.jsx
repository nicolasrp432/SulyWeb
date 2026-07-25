
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { BookingCartProvider } from '@/contexts/BookingCartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BookingCartProvider>
        <App />
      </BookingCartProvider>
    </AuthProvider>
  </React.StrictMode>
);

// PWA: registra el service worker para que el panel sea instalable en el móvil
// (acceso directo en la pantalla de inicio). Solo en producción, para no
// interferir con el hot-reload de desarrollo. El SW no cachea nada (ver
// public/sw.js), así que no hay riesgo de servir versiones viejas.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* la instalabilidad es opcional: si falla, la web sigue funcionando igual */
    });
  });
}
