import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { CalendarDays, Check, Lock, Plus, Unlock, X } from 'lucide-react';
import BookingActionMenu from './BookingActionMenu';

const STATUS_CHIP = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled:   'bg-rose-100 text-rose-800 border-rose-200',
  completed:   'bg-blue-100 text-blue-800 border-blue-200',
  no_show:     'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const SnapPoints = {
  collapsed: 0.55, // 55vh visible
  expanded:  0.95, // 95vh visible
};

const SwipeableBookingRow = ({
  booking,
  onClick,
  onConfirm,
  onComplete,
  onCancel,
  onWa,
  onCall,
  onEmail,
}) => {
  const x = useMotionValue(0);
  const bgLeftOpacity = useTransform(x, [0, 80], [0, 1]);   // swipe right (positive) → complete (green left bg)
  const bgRightOpacity = useTransform(x, [-80, 0], [1, 0]); // swipe left (negative) → cancel (red right bg)

  const services =
    booking.services?.map((s) => s.name).filter(Boolean).join(', ') ||
    booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') ||
    '';
  const status = booking.meta?.status || booking.status || 'pending';

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -80) {
      if (window.confirm(`¿Cancelar la cita de ${booking.client_name || 'este cliente'}?`)) {
        onCancel?.(booking);
      }
    } else if (info.offset.x > 80) {
      onComplete?.(booking);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background for swipe-right (complete) */}
      <motion.div
        style={{ opacity: bgLeftOpacity }}
        className="absolute inset-0 bg-emerald-500 flex items-center pl-4"
      >
        <Check className="w-5 h-5 text-white" />
        <span className="text-white font-bold text-xs ml-2">Completar</span>
      </motion.div>

      {/* Background for swipe-left (cancel) */}
      <motion.div
        style={{ opacity: bgRightOpacity }}
        className="absolute inset-0 bg-rose-500 flex items-center justify-end pr-4"
      >
        <span className="text-white font-bold text-xs mr-2">Cancelar</span>
        <X className="w-5 h-5 text-white" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        dragSnapToOrigin
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-white border border-admin-border rounded-xl flex items-center gap-3 px-3 py-2.5"
      >
        <button
          type="button"
          onClick={() => onClick?.(booking)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="shrink-0 w-11 text-center">
            <p className="text-sm font-bold text-brand-rose">{booking.booking_time?.slice(0, 5)}</p>
            <p className="text-[10px] text-admin-muted">{booking.meta?.duration_minutes || booking.duration_minutes || 30}m</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-admin-text truncate">{booking.client_name}</p>
              <span className={`text-[8px] font-bold px-1 py-0.5 rounded border ${STATUS_CHIP[status] || STATUS_CHIP.pending}`}>
                {status === 'pending' ? 'Pend.' : status === 'confirmed' ? 'OK' : status === 'completed' ? '✓' : status === 'cancelled' ? '✕' : status.slice(0, 3)}
              </span>
            </div>
            {services && <p className="text-[11px] text-admin-muted truncate">{services}</p>}
          </div>
        </button>
        <BookingActionMenu
          booking={booking}
          onConfirm={onConfirm}
          onComplete={onComplete}
          onCancel={onCancel}
          onWa={onWa}
          onCall={onCall}
          onEmail={onEmail}
        />
      </motion.div>
    </div>
  );
};

const DayDetailSheet = ({
  open,
  onClose,
  date,
  bookings = [],
  blocks = [],
  onBookingClick,
  onNewBooking,
  onBlockFullDay,
  onUnblock,
  onOpenDayView,
  onConfirm,
  onComplete,
  onCancel,
  onWa,
  onCall,
  onEmail,
}) => {
  const [snap, setSnap] = useState('collapsed');

  useEffect(() => {
    if (open) setSnap('collapsed');
  }, [open]);

  const dayKey = date ? format(date, 'yyyy-MM-dd') : '';
  const dayBookings = useMemo(
    () => bookings.filter((b) => b.booking_date === dayKey).sort((a, b) =>
      (a.booking_time || '').localeCompare(b.booking_time || '')
    ),
    [bookings, dayKey]
  );

  const dayBlocks = useMemo(() => blocks.filter((b) => b.block_date === dayKey), [blocks, dayKey]);
  const hasFullDayBlock = dayBlocks.some((b) => !b.start_time);

  const label = date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : '';
  const heightVh = snap === 'expanded' ? SnapPoints.expanded * 100 : SnapPoints.collapsed * 100;

  const handleDragEndSheet = (_, info) => {
    if (info.offset.y > 120 && info.velocity.y > 0) {
      // Drag down hard from collapsed → close
      if (snap === 'collapsed') {
        onClose?.();
        return;
      }
      // From expanded → go collapsed
      setSnap('collapsed');
      return;
    }
    if (info.offset.y < -80) {
      setSnap('expanded');
      return;
    }
    if (info.offset.y > 80 && snap === 'expanded') {
      setSnap('collapsed');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%', height: `${SnapPoints.collapsed * 100}vh` }}
            animate={{ y: 0, height: `${heightVh}vh` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 32, mass: 0.8 }}
            className="fixed inset-x-0 bottom-0 z-[75] bg-white rounded-t-2xl shadow-2xl flex flex-col"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEndSheet}
              className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            >
              <span className="w-12 h-1.5 rounded-full bg-zinc-300" />
            </motion.div>

            <div className="px-5 pt-2 pb-3 border-b border-admin-border shrink-0 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-admin-text capitalize">{label}</h3>
                <p className="text-xs text-admin-muted mt-0.5">
                  {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
                  {dayBlocks.length > 0 && (
                    <span className="ml-1">· {dayBlocks.length} bloqueo{dayBlocks.length === 1 ? '' : 's'}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSnap(snap === 'expanded' ? 'collapsed' : 'expanded')}
                  className="text-admin-muted hover:text-admin-text p-1.5 rounded-lg hover:bg-admin-surface transition-colors text-[10px] font-bold"
                  aria-label="Expandir"
                >
                  {snap === 'expanded' ? '↓' : '↑'}
                </button>
                <button
                  onClick={onClose}
                  className="text-admin-muted hover:text-admin-text p-1.5 rounded-lg hover:bg-admin-surface transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {hasFullDayBlock && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-800">Día completo bloqueado</p>
                      {dayBlocks.filter((b) => !b.start_time)[0]?.reason && (
                        <p className="text-[11px] text-amber-700 truncate">{dayBlocks.filter((b) => !b.start_time)[0].reason}</p>
                      )}
                    </div>
                  </div>
                  {dayBlocks.filter((b) => !b.start_time).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onUnblock?.(b.id)}
                      className="shrink-0 text-[10px] font-bold text-amber-700 border border-amber-300 rounded-md px-2 py-1 hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" /> Quitar
                    </button>
                  ))}
                </div>
              )}

              {dayBlocks.filter((b) => b.start_time).map((b) => (
                <div key={b.id} className="rounded-xl bg-amber-50/70 border border-amber-200 p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-800">
                        {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5) || '23:59'}
                      </p>
                      {b.reason && <p className="text-[11px] text-amber-700 truncate">{b.reason}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => onUnblock?.(b.id)}
                    className="text-[10px] font-bold text-amber-700 border border-amber-300 rounded-md px-2 py-1 hover:bg-amber-100 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              ))}

              {dayBookings.length === 0 && !hasFullDayBlock ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-rose-gold/10 flex items-center justify-center mb-3">
                    <CalendarDays className="w-7 h-7 text-brand-rose/60" />
                  </div>
                  <p className="text-sm font-semibold text-admin-text">No hay citas para este día</p>
                  <p className="text-xs text-admin-muted mt-1">Crea la primera cita o bloquea el día completo.</p>
                  <button
                    type="button"
                    onClick={onNewBooking}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-rose-gold text-white text-xs font-bold shadow-rose-sm hover:shadow-rose-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Crear cita
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-admin-muted uppercase tracking-wider pt-1 pb-1 px-1">
                    {dayBookings.length > 0 ? '←  Desliza para acciones rápidas  →' : ''}
                  </p>
                  {dayBookings.map((b) => (
                    <SwipeableBookingRow
                      key={b.id}
                      booking={b}
                      onClick={onBookingClick}
                      onConfirm={onConfirm}
                      onComplete={onComplete}
                      onCancel={onCancel}
                      onWa={onWa}
                      onCall={onCall}
                      onEmail={onEmail}
                    />
                  ))}
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-admin-border bg-admin-bg shrink-0 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onNewBooking}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-gradient-rose-gold text-white shadow-rose-sm hover:shadow-rose-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-bold leading-none">Nueva cita</span>
              </button>
              <button
                type="button"
                onClick={onBlockFullDay}
                disabled={hasFullDayBlock}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-admin-border text-admin-text hover:bg-admin-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-bold leading-none">Bloquear día</span>
              </button>
              <button
                type="button"
                onClick={onOpenDayView}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-admin-border text-admin-text hover:bg-admin-surface transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-[10px] font-bold leading-none">Ver día</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DayDetailSheet;
