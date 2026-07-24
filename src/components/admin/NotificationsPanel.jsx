import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Globe, MessageCircle, Sparkles, X } from 'lucide-react';
import { getInitials } from '@/lib/avatar';

const PANEL_WIDTH = 360;
const PANEL_GAP = 8;

const ORIGIN_ICONS = {
  online: Globe,
  whatsapp: MessageCircle,
};

const ORIGIN_LABEL = {
  online: 'Online',
  whatsapp: 'WhatsApp',
};

const formatRelative = (ts) => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
};

const formatBookingDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch {
    return iso;
  }
};

const NotificationsPanel = ({
  open,
  anchorRef,
  notifications = [],
  unreadCount = 0,
  onClose,
  onMarkAllRead,
  onMarkOneRead,
}) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;

    const updateCoords = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      // Fallback robust coordinates if element rect has zero dimensions (initial dynamic mounts)
      if (rect.width === 0 && rect.height === 0) {
        setCoords({ top: 56, left: Math.max(8, window.innerWidth - PANEL_WIDTH - 8) });
        return;
      }
      let left = rect.right - PANEL_WIDTH;
      let top = rect.bottom + PANEL_GAP;
      if (left < 8) left = 8;
      if (left + PANEL_WIDTH > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - PANEL_WIDTH - 8);
      }
      setCoords({ top, left });
    };

    updateCoords();

    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        !anchorRef?.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        onClose?.();
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose, anchorRef]);

  // Solo se muestran las NO leídas: al marcar una (o todas) como leída, desaparece.
  const items = useMemo(() => notifications.filter((n) => !n.read).slice(0, 20), [notifications]);

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    onMarkOneRead?.(id);
  };

  const handleClickNotification = (n) => {
    onMarkOneRead?.(n.id);
    onClose?.();
    if (n.bookingDate) {
      navigate(`/admin/calendario?date=${n.bookingDate}`);
    } else {
      navigate('/admin/calendario');
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          width: PANEL_WIDTH,
          maxWidth: 'calc(100vw - 16px)',
          zIndex: 200,
        }}
        className="rounded-2xl border border-admin-border bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-4 py-3 border-b border-admin-border bg-gradient-to-r from-brand-rose-50/60 to-amber-50/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 text-brand-rose shrink-0" />
            <h3 className="text-sm font-bold text-admin-text">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-brand-rose text-white px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[10px] font-bold text-brand-rose hover:text-brand-rose-dark px-2 py-1 rounded-md hover:bg-brand-rose-50 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Marcar leídas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-admin-muted hover:text-admin-text p-1 rounded-md hover:bg-admin-surface transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-admin-border/60">
          {items.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Sparkles className="w-8 h-8 text-brand-rose/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-admin-text">Todo en orden</p>
              <p className="text-xs text-admin-muted mt-1">
                Aquí aparecerán las nuevas citas en tiempo real.
              </p>
            </div>
          ) : (
            items.map((n) => {
              const OriginIcon = ORIGIN_ICONS[n.origin] || Globe;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className="relative w-full text-left pl-4 pr-9 py-3 flex items-start gap-3 bg-brand-rose-50/30 hover:bg-admin-surface/40 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shadow-rose-sm">
                      {getInitials(n.clientName)}
                    </div>
                    {!n.read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-rose ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-admin-text truncate">{n.message}</p>
                      <span className="text-[10px] text-admin-muted shrink-0">{formatRelative(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-admin-muted truncate mt-0.5 flex items-center gap-1">
                      <OriginIcon className="w-3 h-3 shrink-0" />
                      <span className="font-semibold">{ORIGIN_LABEL[n.origin] || 'Online'}</span>
                      <span>·</span>
                      <span className="capitalize">{formatBookingDate(n.bookingDate)}</span>
                      {n.bookingTime && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-brand-rose">{n.bookingTime}</span>
                        </>
                      )}
                      {n.locationName && (
                        <>
                          <span>·</span>
                          <span className="truncate">{n.locationName}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDismiss(e, n.id)}
                    title="Marcar como leída"
                    aria-label="Marcar como leída"
                    className="absolute top-2 right-2 p-1 rounded-md text-admin-muted hover:text-brand-rose hover:bg-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default NotificationsPanel;
