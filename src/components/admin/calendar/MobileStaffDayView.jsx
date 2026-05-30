import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, UserX } from 'lucide-react';
import BookingCard from './BookingCard';
import NowIndicator from './NowIndicator';

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_HEIGHT = 64;
const UNASSIGNED_KEY = '__unassigned__';

const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
};

const timeToMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + m;
};

const MobileStaffDayView = ({
  date,
  bookings,
  blocks = [],
  staffMembers = [],
  businessHours = null,
  onBookingClick,
  onSlotClick,
  onBlockClick,
  onMoveBooking,
  onResizeBooking,
}) => {
  const dayKey = format(date, 'yyyy-MM-dd');
  const isToday = dayKey === format(new Date(), 'yyyy-MM-dd');

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.booking_date === dayKey),
    [bookings, dayKey]
  );

  const dayBlocks = useMemo(
    () => (blocks || []).filter((b) => b.block_date === dayKey),
    [blocks, dayKey]
  );

  const hasFullDayBlock = dayBlocks.some((b) => !b.start_time);

  const todayHours = useMemo(() => {
    if (!businessHours) return null;
    const dayName = DAY_KEYS[date.getDay()];
    return businessHours[dayName] || null;
  }, [businessHours, date]);

  const isClosedToday = todayHours?.closed === true;

  const isHourInBusinessRange = (h) => {
    if (!todayHours || todayHours.closed) return false;
    const openH = parseInt(todayHours.open?.slice(0, 2) || '8', 10);
    const closeH = parseInt(todayHours.close?.slice(0, 2) || '20', 10);
    return h >= openH && h < closeH;
  };

  const isHourBlocked = (h) => {
    if (hasFullDayBlock) return true;
    const hStr = `${String(h).padStart(2, '0')}:00`;
    return dayBlocks.some(
      (b) => b.start_time && b.start_time <= hStr && (b.end_time ?? '23:59') > hStr
    );
  };

  const columns = useMemo(() => {
    const list = [];
    const unassignedBookings = dayBookings.filter((b) => !(b.meta?.assigned_to || b.assigned_to));
    if (unassignedBookings.length > 0 || staffMembers.length === 0) {
      list.push({ key: UNASSIGNED_KEY, staff: null, isUnassigned: true, bookings: unassignedBookings });
    }
    staffMembers.forEach((staff) => {
      const staffBookings = dayBookings.filter((b) => {
        const assigned = b.meta?.assigned_to || b.assigned_to || '';
        return assigned === staff.full_name || String(assigned) === String(staff.id);
      });
      list.push({ key: String(staff.id), staff, isUnassigned: false, bookings: staffBookings });
    });
    return list;
  }, [dayBookings, staffMembers]);

  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, columns.length - 1);
  const activeCol = columns[safeIdx];

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) < 80) return;
    if (info.offset.x < 0 && safeIdx < columns.length - 1) setActiveIdx(safeIdx + 1);
    else if (info.offset.x > 0 && safeIdx > 0) setActiveIdx(safeIdx - 1);
  };

  const computePosition = (booking) => {
    const minutes = timeToMinutes(booking.booking_time);
    const startMin = HOUR_START * 60;
    const top = ((minutes - startMin) / 60) * SLOT_HEIGHT;
    const duration = booking.meta?.duration_minutes || booking.duration_minutes || 30;
    const height = Math.max((duration / 60) * SLOT_HEIGHT, 36);
    return { top, height };
  };

  const handleTimelineClick = (e) => {
    if (isClosedToday || hasFullDayBlock || !activeCol) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourIdx = Math.floor(offsetY / SLOT_HEIGHT);
    const h = HOURS[Math.max(0, Math.min(hourIdx, HOURS.length - 1))];
    if (!isHourInBusinessRange(h) && todayHours) return;
    if (isHourBlocked(h)) return;
    onSlotClick?.(date, `${String(h).padStart(2, '0')}:00`, activeCol.staff);
  };

  if (!activeCol) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8 text-center">
        <UserX className="w-8 h-8 text-admin-muted mb-2" />
        <p className="text-sm text-admin-muted">No hay profesionales configurados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-admin-border shrink-0 bg-white">
        <p className="text-sm font-bold text-admin-text capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <p className="text-xs text-admin-muted mt-0.5">
          {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
          {hasFullDayBlock && <span className="ml-2 text-amber-600 font-semibold">· Día bloqueado</span>}
          {isClosedToday && <span className="ml-2 text-zinc-500 font-semibold">· Cerrado</span>}
        </p>
      </div>

      {columns.length > 1 && (
        <div className="border-b border-admin-border bg-white shrink-0">
          <div className="flex gap-3 overflow-x-auto px-4 py-3 snap-x snap-mandatory scrollbar-hide">
            {columns.map((col, idx) => {
              const active = idx === safeIdx;
              const name = col.staff?.full_name || (col.isUnassigned ? 'Sin asignar' : '—');
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className="flex flex-col items-center gap-1 shrink-0 snap-center min-w-[56px]"
                >
                  <div className={`relative w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-rose-sm overflow-hidden transition-all ${
                    active ? 'ring-2 ring-brand-rose ring-offset-2 scale-105' : 'opacity-60'
                  } ${col.isUnassigned ? 'bg-gradient-to-br from-zinc-300 to-zinc-400' : 'bg-gradient-rose-gold'}`}>
                    {col.staff?.avatar_url ? (
                      <img src={col.staff.avatar_url} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span>{col.isUnassigned ? '?' : getInitials(name)}</span>
                    )}
                    {col.bookings.length > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-brand-rose text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {col.bookings.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold truncate max-w-[64px] ${active ? 'text-admin-text' : 'text-admin-muted'}`}>
                    {name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCol.key}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
            drag={columns.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="relative grid"
            style={{
              gridTemplateColumns: '52px 1fr',
              minHeight: HOURS.length * SLOT_HEIGHT,
            }}
          >
            {/* Time column */}
            <div className="relative border-r border-admin-border">
              {HOURS.map((h, idx) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-[10px] text-admin-muted font-semibold text-right pr-2 -translate-y-1.5"
                  style={{ top: idx * SLOT_HEIGHT }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Slots column */}
            <div className="relative cursor-pointer" onClick={handleTimelineClick}>
              {HOURS.map((h, idx) => {
                const blocked = isHourBlocked(h);
                const outOfHours = todayHours && !isHourInBusinessRange(h);
                return (
                  <div
                    key={h}
                    className={`absolute left-0 right-0 border-t border-admin-border/40 ${
                      blocked
                        ? 'bg-amber-50/40'
                        : outOfHours
                        ? 'bg-zinc-100/70 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_8px)]'
                        : ''
                    }`}
                    style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  />
                );
              })}

              {(hasFullDayBlock || isClosedToday) && (
                <div className={`absolute inset-0 pointer-events-none flex items-start justify-center pt-3 ${
                  hasFullDayBlock ? 'bg-amber-100/40 border-l-2 border-amber-300' : 'bg-zinc-200/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.05)_8px,rgba(0,0,0,0.05)_10px)]'
                }`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/80 ${
                    hasFullDayBlock ? 'text-amber-700' : 'text-zinc-600'
                  }`}>
                    {hasFullDayBlock ? 'Día bloqueado' : 'Cerrado'}
                  </span>
                </div>
              )}

              {!hasFullDayBlock && dayBlocks.filter((b) => b.start_time).map((b) => {
                const startMin = timeToMinutes(b.start_time);
                const endMin = timeToMinutes(b.end_time || '23:59');
                const top = ((startMin - HOUR_START * 60) / 60) * SLOT_HEIGHT;
                const height = ((endMin - startMin) / 60) * SLOT_HEIGHT;
                return (
                  <button
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBlockClick?.(b.id); }}
                    className="absolute left-1 right-1 bg-amber-100/70 border border-amber-300 border-l-4 border-l-amber-500 rounded-md flex items-center justify-center gap-1 text-[10px] font-bold text-amber-800"
                    style={{ top, height }}
                  >
                    <Lock className="w-3 h-3" /> {b.reason || 'Bloqueado'}
                  </button>
                );
              })}

              {isToday && !isClosedToday && (
                <NowIndicator hourStart={HOUR_START} hourEnd={HOUR_END} slotHeight={SLOT_HEIGHT} />
              )}

              {activeCol.bookings.map((b) => {
                const { top, height } = computePosition(b);
                return (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onClick={onBookingClick}
                    style={{ top, height }}
                    onMove={onMoveBooking}
                    onResize={onResizeBooking}
                    hourStart={HOUR_START}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileStaffDayView;
