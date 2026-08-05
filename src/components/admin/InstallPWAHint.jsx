import React, { useCallback, useEffect, useState } from 'react';
import { Share, X, Plus, Download, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'suly_pwa_hint_dismissed';

/**
 * Instalar el panel como acceso directo en la pantalla de inicio.
 *
 * Dos caminos, porque los navegadores no se comportan igual:
 *  - Android / Chrome / Edge: existe `beforeinstallprompt`, así que mostramos un
 *    botón "Instalar" de verdad (una sola pulsación). El evento se captura en
 *    main.jsx porque salta antes de que React monte.
 *  - iPhone / iPad: WebKit no tiene ninguna API de instalación, solo se puede a
 *    mano desde Compartir → Añadir a pantalla de inicio, así que explicamos los
 *    pasos. Importante: iOS crea el acceso directo apuntando a la PÁGINA ACTUAL,
 *    por eso el aviso vive dentro del panel (así el icono abre el panel).
 *
 * No incluye notificaciones push: los avisos siguen llegando por correo.
 */
const InstallPWAHint = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosBrowserOk, setIosBrowserOk] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    // iPadOS moderno se hace pasar por Mac: se detecta por el soporte táctil.
    const ios = /iPhone|iPad|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
    setIsIOS(ios);
    // En iOS "Añadir a inicio" solo existe en Safari, no en Chrome/Firefox iOS.
    setIosBrowserOk(!/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua));

    const standalone =
      window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    setInstalled(standalone);

    if (window.__sulyInstallPrompt) setCanInstall(true);

    const onInstallable = () => setCanInstall(true);
    const onInstalled = () => { setInstalled(true); setCanInstall(false); };
    window.addEventListener('suly:installable', onInstallable);
    window.addEventListener('suly:installed', onInstalled);
    return () => {
      window.removeEventListener('suly:installable', onInstallable);
      window.removeEventListener('suly:installed', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const evt = window.__sulyInstallPrompt;
    if (!evt) return;
    setBusy(true);
    try {
      evt.prompt();
      const choice = await evt.userChoice;
      if (choice?.outcome === 'accepted') setInstalled(true);
      // El evento solo se puede usar una vez.
      window.__sulyInstallPrompt = null;
      setCanInstall(false);
    } catch { /* si falla, quedan las instrucciones manuales */ }
    finally { setBusy(false); }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  // Ya instalada, descartada, o navegador sin forma de instalar: no molestamos.
  if (installed || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <div className="mb-4">
      <div className="relative rounded-2xl border border-brand-rose/30 bg-gradient-to-br from-brand-rose-50 via-white to-amber-50 p-4 pr-10 shadow-rose-sm">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 w-9 h-9 flex items-center justify-center rounded-full text-admin-muted hover:bg-white/70"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-sm font-bold text-admin-text flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-brand-rose" />
          Añade el panel a tu pantalla de inicio
        </p>

        {canInstall ? (
          <>
            <p className="text-xs text-admin-muted mt-1">
              Tendrás un acceso directo que abre el panel al instante, como una app.
            </p>
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-gradient-rose-gold text-white text-sm font-bold shadow-rose-sm hover:brightness-105 disabled:opacity-60 transition-all"
            >
              <Download className="w-4 h-4" />
              {busy ? 'Instalando…' : 'Instalar acceso directo'}
            </button>
          </>
        ) : !iosBrowserOk ? (
          <p className="text-xs text-admin-muted mt-1 leading-relaxed">
            Abre esta misma página en <span className="font-semibold text-admin-text">Safari</span> para
            poder añadirla a la pantalla de inicio (en iPhone solo se puede desde Safari).
          </p>
        ) : (
          <p className="text-xs text-admin-muted mt-1 leading-relaxed">
            En este iPhone se hace a mano: pulsa
            <Share className="inline w-4 h-4 mx-1 -mt-0.5 text-brand-rose" />
            <span className="font-semibold text-admin-text">Compartir</span> (abajo en Safari) y luego
            <Plus className="inline w-4 h-4 mx-1 -mt-0.5 text-brand-rose" />
            <span className="font-semibold text-admin-text">Añadir a pantalla de inicio</span>.
            El icono abrirá directamente el panel.
          </p>
        )}
      </div>
    </div>
  );
};

export default InstallPWAHint;
