
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { BookingCartProvider } from '@/contexts/BookingCartContext';

// PWA: el navegador dispara `beforeinstallprompt` muy pronto, normalmente ANTES
// de que React monte. Si no se captura aquí, el evento se pierde y el botón
// "Instalar" no llega a aparecer nunca (era el motivo de que no se pudiera
// instalar en Android/Chrome). Lo guardamos y avisamos a quien lo necesite.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // evita el mini-banner nativo; instalamos desde nuestro botón
  window.__sulyInstallPrompt = e;
  window.dispatchEvent(new Event('suly:installable'));
});

window.addEventListener('appinstalled', () => {
  window.__sulyInstallPrompt = null;
  window.dispatchEvent(new Event('suly:installed'));
});

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
