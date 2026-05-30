import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MessageCircle, Store, User } from 'lucide-react';

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
};

const SLOT_HEIGHT = 64;        // px per hour — must match TeamDayView/MobileStaffDayView
const SNAP_MINUTES = 15;
const MIN_DURATION = 15;
const MAX_DURATION = 480;

const minutesToTimeStr = (totalMin) => {
  const safe = Math.max(0, Math.min(24 * 60 - 1, totalMin));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timeStrToMinutes = (t) => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
};

const BookingCard = ({
  booking,
  onClick,
  style,
  compact = false,
  onMove,
  onResize,
  hourStart = 8,
}) => {
  const status = booking.meta?.status || booking.status || 'pending';
  const palette = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const origin = booking.meta?.source || booking.origin || 'online';
  const OriginIcon = ORIGIN_ICONS[origin] || Globe;

  const services = booking.services?.length
    ? booking.services.map((s) => s.name).filter(Boolean).join(', ')
    : booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '';

  const baseHeight = typeof style?.height === 'number' ? style.height : 36;
  const [previewHeight, setPreviewHeight] = useState(null);
  const [dragging, setDragging] = useState(false);
  const draggable = !!(onMove || onResize);

  const handleClick = (e) => {
    if (dragging) return;
    e.stopPropagation();
    onClick?.(booking);
  };

  const handleDragEnd = (_, info) => {
    setTimeout(() => setDragging(false), 50);
    if (!onMove) return;
    if (Math.abs(info.offset.y) < 6) return; // treat as click
    const deltaMin = Math.round((info.offset.y / SLOT_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
    if (deltaMin === 0) return;
    const currentMin = timeStrToMinutes(booking.booking_time?.slice(0, 5));
    const nextMin = Math.max(0, currentMin + deltaMin);
    onMove(booking.id, minutesToTimeStr(nextMin));
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
    ...(previewHeight !== null ? { height: previewHeight } : {}),
  };

  return (
    <motion.div
      drag={draggable ? 'y' : false}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03, zIndex: 50 }}
      style={effectiveStyle}
      className={`absolute left-1 right-1 ${dragging ? 'cursor-grabbing shadow-lg' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`w-full h-full bg-white border border-admin-border ${palette.border} border-l-[3px] rounded-lg shadow-rose-xs hover:shadow-rose-sm transition-shadow text-left overflow-hidden ${palette.bg}`}
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
          <span className={`shrink-0 inline-flex items-center justify-center w-4 h-4 rounded ${palette.bg} border border-current/10`}>
            <OriginIcon className={`w-2.5 h-2.5 ${palette.text}`} />
          </span>
        </div>
      </button>

      {/* Resize handle (bottom) */}
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
