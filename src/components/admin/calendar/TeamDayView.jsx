import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, Unlock, UserX } from 'lucide-react';
import StaffColumnHeader from './StaffColumnHeader';
import BookingCard from './BookingCard';
import NowIndicator from './NowIndicator';
import { getDayConfig } from '@/lib/businessHours';

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_HEIGHT = 64;
const UNASSIGNED_KEY = '__unassigned__';

const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const timeToMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + m;
};

const TeamDayView = ({
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

  // Config normalizada (soporta tramos partidos). null = sin configuración.
  const todayHours = useMemo(() => {
    if (!businessHours) return null;
    return getDayConfig(date, businessHours);
  }, [businessHours, date]);

  const isClosedToday = !!todayHours && (todayHours.closed || todayHours.shifts.length === 0);

  const isHourInBusinessRange = (h) => {
    if (!todayHours || todayHours.closed) return false;
    const mins = h * 60;
    return todayHours.shifts.some((s) => {
      const o = timeToMinutes(s.open);
      const c = timeToMinutes(s.close);
      return mins >= o && mins < c;
    });
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

  const totalHeight = HOURS.length * SLOT_HEIGHT;

  const computePosition = (booking) => {
    const minutes = timeToMinutes(booking.booking_time);
    const startMin = HOUR_START * 60;
    const top = ((minutes - startMin) / 60) * SLOT_HEIGHT;
    const duration = booking.meta?.duration_minutes || booking.duration_minutes || 30;
    const height = Math.max((duration / 60) * SLOT_HEIGHT, 36);
    return { top, height };
  };

  const handleColumnClick = (e, col) => {
    if (isClosedToday || hasFullDayBlock) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourIdx = Math.floor(offsetY / SLOT_HEIGHT);
    const h = HOURS[Math.max(0, Math.min(hourIdx, HOURS.length - 1))];
    if (!isHourInBusinessRange(h) && todayHours) return;
    if (isHourBlocked(h)) return;
    onSlotClick?.(date, `${String(h).padStart(2, '0')}:00`, col.staff);
  };

  const gridTemplateColumns = `64px repeat(${columns.length}, minmax(160px, 1fr))`;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="px-6 py-3 border-b border-admin-border shrink-0 bg-white flex items-baseline justify-between gap-3">
        <div>
          <p className="text-base font-bold text-admin-text capitalize">
            {format(date, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-xs text-admin-muted mt-0.5">
            {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
            {hasFullDayBlock && <span className="ml-2 text-amber-600 font-semibold">· Día bloqueado</span>}
            {isClosedToday && <span className="ml-2 text-zinc-500 font-semibold">· Cerrado</span>}
          </p>
        </div>
        {hasFullDayBlock && (
          <button
            onClick={() => dayBlocks.filter((b) => !b.start_time).forEach((b) => onBlockClick?.(b.id))}
            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold border border-amber-300 rounded-lg px-2.5 py-1 hover:bg-amber-50 transition-colors flex items-center gap-1"
          >
            <Unlock className="w-3 h-3" /> Desbloquear día
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="grid sticky top-0 z-10 bg-white border-b border-admin-border"
          style={{ gridTemplateColumns }}
        >
          <div className="border-l border-transparent" />
          {columns.map((col) => (
            <StaffColumnHeader
              key={col.key}
              staff={col.staff}
              bookingCount={col.bookings.length}
              isUnassigned={col.isUnassigned}
            />
          ))}
        </div>

        <div className="grid relative" style={{ gridTemplateColumns, height: totalHeight }}>
          {/* Time column */}
          <div className="relative">
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

          {/* Staff columns */}
          {columns.map((col) => (
            <div
              key={col.key}
              className="relative border-l border-admin-border cursor-pointer"
              onClick={(e) => handleColumnClick(e, col)}
            >
              {/* Hour grid lines + disabled overlay */}
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

              {/* Full-day block / closed overlay */}
              {(hasFullDayBlock || isClosedToday) && (
                <div className={`absolute inset-0 pointer-events-none flex items-start justify-center pt-3 ${
                  hasFullDayBlock ? 'bg-amber-100/40 border-l-2 border-amber-300' : 'bg-zinc-200/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.05)_8px,rgba(0,0,0,0.05)_10px)]'
                }`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/80 ${
                    hasFullDayBlock ? 'text-amber-700' : 'text-zinc-600'
                  }`}>
                    {hasFullDayBlock ? 'Bloqueado' : 'Cerrado'}
                  </span>
                </div>
              )}

              {/* Partial blocks */}
              {!hasFullDayBlock && dayBlocks.filter((b) => b.start_time).map((b) => {
                const startMin = timeToMinutes(b.start_time);
                const endMin = timeToMinutes(b.end_time || '23:59');
                const top = ((startMin - HOUR_START * 60) / 60) * SLOT_HEIGHT;
                const height = ((endMin - startMin) / 60) * SLOT_HEIGHT;
                return (
                  <button
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBlockClick?.(b.id); }}
                    className="absolute left-1 right-1 bg-amber-100/70 border border-amber-300 border-l-4 border-l-amber-500 rounded-md flex items-center justify-center gap-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                    style={{ top, height }}
                    title={b.reason || 'Bloqueado'}
                  >
                    <Lock className="w-3 h-3" /> {b.reason || 'Bloqueado'}
                  </button>
                );
              })}

              {/* Now indicator (only first column for centering simplicity is fine since absolute is per-column) */}
              {isToday && !isClosedToday && (
                <NowIndicator hourStart={HOUR_START} hourEnd={HOUR_END} slotHeight={SLOT_HEIGHT} />
              )}

              {/* Bookings */}
              {col.bookings.map((b) => {
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

              {col.isUnassigned && col.bookings.length === 0 && (
                <div className="absolute top-3 left-2 right-2 text-center text-[10px] text-admin-muted/70 italic flex items-center justify-center gap-1 pointer-events-none">
                  <UserX className="w-3 h-3" /> Sin citas sin asignar
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamDayView;
