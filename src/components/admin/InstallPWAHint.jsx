import React, { useEffect, useState } from 'react';
import { Share, X, Plus } from 'lucide-react';

const DISMISS_KEY = 'suly_pwa_hint_dismissed';

/**
 * Aviso para instalar el panel en la pantalla de inicio del iPhone.
 *
 * iOS/Safari no muestra un prompt automático de instalación, así que enseñamos
 * al equipo los pasos manuales (Compartir → Añadir a pantalla de inicio). Solo
 * aparece cuando:
 *   - es un iPhone/iPad con Safari,
 *   - la web NO está ya instalada (no corre en modo standalone),
 *   - el usuario no lo ha descartado antes.
 * Es puramente informativo; no cambia nada del funcionamiento del panel.
 */
const InstallPWAHint = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    // En iOS todos los navegadores usan WebKit; "Añadir a inicio" solo funciona
    // desde Safari, no desde Chrome/Firefox de iOS (excluye CriOS/FxiOS).
    const isSafari = isIOS && !/CriOS|FxiOS|EdgiOS/.test(ua);

    // ¿Ya está instalada / abierta como app?
    const standalone =
      window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

    if (isSafari && !standalone) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="sm:hidden mb-4">
      <div className="relative rounded-2xl border border-brand-rose/30 bg-gradient-to-br from-brand-rose-50 via-white to-amber-50 p-3 pr-9 shadow-rose-sm">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 p-1 rounded-full text-admin-muted hover:bg-white/70"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-xs font-bold text-admin-text">Instala el panel en tu iPhone</p>
        <p className="text-[11px] text-admin-muted mt-1 leading-relaxed">
          Para tenerlo como app en la pantalla de inicio: pulsa
          <Share className="inline w-3.5 h-3.5 mx-1 -mt-0.5 text-brand-rose" />
          <span className="font-semibold text-admin-text">Compartir</span> y luego
          <Plus className="inline w-3.5 h-3.5 mx-1 -mt-0.5 text-brand-rose" />
          <span className="font-semibold text-admin-text">Añadir a pantalla de inicio</span>.
        </p>
      </div>
    </div>
  );
};

export default InstallPWAHint;
