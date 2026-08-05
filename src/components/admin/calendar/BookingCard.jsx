import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { CalendarClock, Globe, MessageCircle, Store, User } from 'lucide-react';
import { SLOT_HEIGHT, SNAP_MINUTES, minutesToTime, timeToMinutes } from './grid/timeGridUtils';

const STATUS_STYLES = {
  pending:     { border: 'border-l-amber-400',   bg: 'bg-amber-50/80',   text: 'text-amber-900',   label: 'Pendiente'   },
  confirmed:   { border: 'border-l-emerald-400', bg: 'bg-emerald-50/80', text: 'text-emerald-900', label: 'Confirmada'  },
  completed:   { border: 'border-l-blue-400',    bg: 'bg-blue-50/80',    text: 'text-blue-900',    label: 'Completada'  },
  cancelled:   { border: 'border-l-rose-300',    bg: 'bg-rose-50/60',    text: 'text-rose-800',    label: 'Cancelada'   },
  rescheduled: { border: 'border-l-purple-400',  bg: 'bg-purple-50/70',  text: 'text-purple-900',  label: 'Reprogramada'},
  no_show:     { border: 'border-l-zinc-400',    bg: 'bg-zinc-50/80',    text: 'text-zinc-700',    label: 'No asistió'  },
};

const ORIGIN_ICONS = {
  online:     Globe,
  whatsapp:   MessageCircle,
  presencial: Store,
  admin:      User,
  calendar:   CalendarClock,
};

const MIN_DURATION = 15;
const MAX_DURATION = 480;

// Mover una cita exige mantener pulsado el bloque. Antes bastaba con deslizarlo
// y era fácil cambiar la hora de una cita sin querer al desplazar la agenda.
const LONG_PRESS_MS = { touch: 450, pen: 450, mouse: 250 };
// Si el dedo se desplaza más que esto antes de cumplirse el tiempo, se entiende
// que está haciendo scroll y no se activa el arrastre.
const MOVE_TOLERANCE_PX = 10;

const BookingCard = ({
  booking,
  onClick,
  style,
  compact = false,
  layout = null, // { leftPct, widthPct } cuando hay citas solapadas
  onMove,
  onResize,
  hourStart = 8,
}) => {
  const status = booking.meta?.status || booking.status || 'pending';
  const palette = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const origin = booking.meta?.source || booking.origin || 'online';
  const OriginIcon = ORIGIN_ICONS[origin] || Globe;
  const isFromCalendar = origin === 'calendar';

  const services = booking.services?.length
    ? booking.services.map((s) => s.name).filter(Boolean).join(', ')
    : booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '';

  // Cita sincronizada desde Google/iPhone a la que aún falta asignar
  // manicurista o servicio: distintivo punteado dorado.
  const isIncompleteSync = isFromCalendar &&
    (!(booking.meta?.assigned_to || booking.assigned_to) || !services);

  const baseHeight = typeof style?.height === 'number' ? style.height : 36;
  const [previewHeight, setPreviewHeight] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragPreviewTime, setDragPreviewTime] = useState(null);
  const draggable = !!(onMove || onResize);

  // --- Pulsación mantenida para desbloquear el arrastre -----------------------
  const dragControls = useDragControls();
  const [armed, setArmed] = useState(false);
  const pressRef = useRef({ timer: null, detach: null });

  const cancelPress = useCallback(() => {
    if (pressRef.current.timer) {
      clearTimeout(pressRef.current.timer);
      pressRef.current.timer = null;
    }
    if (pressRef.current.detach) {
      pressRef.current.detach();
      pressRef.current.detach = null;
    }
  }, []);

  useEffect(() => cancelPress, [cancelPress]);

  // Mientras el bloque está desbloqueado hay que impedir que la agenda haga
  // scroll a la vez que se mueve la cita. `touch-action` no basta: Safari lo
  // evalúa al empezar el gesto y el dedo ya está apoyado, así que se bloquea el
  // touchmove. Los oyentes de pointerup son la red de seguridad para que el
  // bloqueo se suelte aunque el arrastre no llegue a arrancar.
  useEffect(() => {
    if (!armed) return undefined;
    const prevent = (e) => e.preventDefault();
    const release = () => setArmed(false);
    document.addEventListener('touchmove', prevent, { passive: false });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      document.removeEventListener('touchmove', prevent);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [armed]);

  const handlePointerDown = (e) => {
    if (!draggable || (e.button != null && e.button !== 0)) return;
    cancelPress();

    // Los oyentes van en la ventana, no en el bloque: al deslizar, el puntero
    // sale enseguida de la cita y sus propios eventos dejarían de llegar, de
    // modo que un deslizamiento rápido acababa activando el arrastre igual.
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev) => {
      if (Math.abs(ev.clientX - startX) > MOVE_TOLERANCE_PX ||
          Math.abs(ev.clientY - startY) > MOVE_TOLERANCE_PX) {
        cancelPress();
      }
    };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', cancelPress, true);
    window.addEventListener('pointercancel', cancelPress, true);
    pressRef.current.detach = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', cancelPress, true);
      window.removeEventListener('pointercancel', cancelPress, true);
    };

    const delay = LONG_PRESS_MS[e.pointerType] ?? LONG_PRESS_MS.touch;
    pressRef.current.timer = setTimeout(() => {
      cancelPress();
      setArmed(true);
      // Vibración corta para avisar de que ya se puede mover (Android).
      navigator.vibrate?.(15);
      // El dedo sigue apoyado, así que se arranca el arrastre con el evento
      // original: framer-motion continúa el gesto desde ahí.
      dragControls.start(e);
    }, delay);
  };

  const handleClick = (e) => {
    if (dragging) return;
    e.stopPropagation();
    onClick?.(booking);
  };

  const dragDeltaMinutes = (offsetY) =>
    Math.round((offsetY / SLOT_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;

  const handleDrag = (_, info) => {
    if (!onMove) return;
    const deltaMin = dragDeltaMinutes(info.offset.y);
    const currentMin = timeToMinutes(booking.booking_time?.slice(0, 5));
    setDragPreviewTime(minutesToTime(Math.max(0, currentMin + deltaMin)));
  };

  const handleDragEnd = (_, info) => {
    setTimeout(() => setDragging(false), 50);
    setDragPreviewTime(null);
    setArmed(false);
    if (!onMove) return;
    if (Math.abs(info.offset.y) < 6) return; // click, no drag
    const deltaMin = dragDeltaMinutes(info.offset.y);
    if (deltaMin === 0) return;
    const currentMin = timeToMinutes(booking.booking_time?.slice(0, 5));
    const nextMin = Math.max(0, currentMin + deltaMin);
    onMove(booking.id, minutesToTime(nextMin));
  };

  const handleResizeEnd = (_, info) => {
    if (!onResize) return;
    const baseDuration = booking.meta?.duration_minutes || booking.duration_minutes || 30;
    const deltaMin = Math.round((info.offset.y / SLOT_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
    const next = Math.max(MIN_DURATION, Math.min(MAX_DURATION, baseDuration + deltaMin));
    setPreviewHeight(null);
    if (next === baseDuration) return;
    onResize(booking.id, next);
  };

  const handleResizePan = (_, info) => {
    if (!onResize) return;
    const nextHeight = Math.max(24, baseHeight + info.offset.y);
    setPreviewHeight(nextHeight);
  };

  const effectiveStyle = {
    ...style,
    ...(layout
      ? {
          left: `calc(${layout.leftPct}% + 2px)`,
          width: `calc(${layout.widthPct}% - 4px)`,
        }
      : {}),
    ...(previewHeight !== null ? { height: previewHeight } : {}),
    // Con dragListener={false} framer ya no fija touch-action, así que deslizar
    // sobre una cita vuelve a desplazar la agenda como en cualquier otro sitio.
    touchAction: armed || dragging ? 'none' : 'auto',
  };

  return (
    <motion.div
      drag={draggable ? 'y' : false}
      // dragListener={false}: framer no arranca solo al deslizar; el arrastre
      // se lanza a mano desde dragControls cuando se cumple la pulsación
      // mantenida (ver handlePointerDown).
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={handlePointerDown}
      onDragStart={() => setDragging(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03, zIndex: 50 }}
      style={effectiveStyle}
      className={`absolute ${layout ? '' : 'left-1 right-1'} ${
        dragging ? 'cursor-grabbing shadow-lg z-40' : 'cursor-pointer'
      } ${armed ? 'z-40 ring-2 ring-brand-rose rounded-lg' : ''}`}
    >
      {/* Chip fantasma con la hora destino durante el drag */}
      {dragging && dragPreviewTime && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-50 text-[10px] font-bold bg-admin-text text-white px-1.5 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap">
          {dragPreviewTime}
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        className={`w-full h-full bg-white border ${
          isIncompleteSync
            ? 'border-dashed border-brand-gold/70'
            : 'border-admin-border'
        } ${palette.border} border-l-[3px] rounded-lg shadow-rose-xs hover:shadow-rose-sm transition-shadow text-left overflow-hidden ${palette.bg} ${
          isFromCalendar ? 'ring-1 ring-brand-gold/40' : ''
        }`}
      >
        <div className="px-2 py-1.5 flex items-start gap-1.5 h-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold ${palette.text}`}>
                {booking.booking_time?.slice(0, 5)}
              </span>
              <span className="text-[9px] text-admin-muted truncate">
                {booking.meta?.duration_minutes || booking.duration_minutes || 30}min
              </span>
              {isIncompleteSync && (
                <span className="text-[8px] font-extrabold uppercase tracking-wide text-brand-gold-dark bg-brand-gold/10 border border-brand-gold/30 px-1 py-px rounded shrink-0">
                  Sync
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-admin-text truncate leading-tight mt-0.5">
              {booking.client_name}
            </p>
            {!compact && services && (
              <p className="text-[10px] text-admin-muted truncate leading-tight mt-0.5">
                {services}
              </p>
            )}
          </div>
          <span className={`shrink-0 inline-flex items-center justify-center w-4 h-4 rounded border ${
            isFromCalendar
              ? 'bg-brand-gold/10 border-brand-gold/30'
              : `${palette.bg} border-current/10`
          }`}>
            <OriginIcon className={`w-2.5 h-2.5 ${isFromCalendar ? 'text-brand-gold-dark' : palette.text}`} />
          </span>
        </div>
      </button>

      {/* Asa de redimensionado (inferior) */}
      {onResize && (
        <motion.div
          drag="y"
          dragMomentum={false}
          dragElastic={0}
          onPan={handleResizePan}
          onPanEnd={handleResizeEnd}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center group/handle"
          title="Arrastra para redimensionar"
        >
          <div className="w-8 h-1 rounded-full bg-admin-muted/30 group-hover/handle:bg-brand-rose transition-colors" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookingCard;
