import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Unlock, UserX } from 'lucide-react';
import StaffColumnHeader from './StaffColumnHeader';
import TimeGrid from './grid/TimeGrid';
import { getDayConfig } from '@/lib/businessHours';

const UNASSIGNED_KEY = '__unassigned__';

/**
 * Vista Día del equipo: una columna por manicurista (+ "sin asignar").
 * Toda la geometría/overlays/drag viven en TimeGrid (compartido con la
 * vista Semana); aquí solo se construyen las columnas.
 */
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

  const todayHours = useMemo(() => {
    if (!businessHours) return null;
    return getDayConfig(date, businessHours);
  }, [businessHours, date]);

  const isClosedToday = !!todayHours && (todayHours.closed || todayHours.shifts.length === 0);

  const columns = useMemo(() => {
    const list = [];
    const unassignedBookings = dayBookings.filter((b) => !(b.meta?.assigned_to || b.assigned_to));
    if (unassignedBookings.length > 0 || staffMembers.length === 0) {
      list.push({
        key: UNASSIGNED_KEY,
        staff: null,
        isUnassigned: true,
        bookings: unassignedBookings,
      });
    }
    staffMembers.forEach((staff) => {
      const staffBookings = dayBookings.filter((b) => {
        const assigned = b.meta?.assigned_to || b.assigned_to || '';
        return assigned === staff.full_name || String(assigned) === String(staff.id);
      });
      list.push({ key: String(staff.id), staff, isUnassigned: false, bookings: staffBookings });
    });

    return list.map((col) => ({
      ...col,
      date,
      blocks: dayBlocks,
      dayHours: todayHours,
      isToday,
      header: (
        <StaffColumnHeader
          staff={col.staff}
          bookingCount={col.bookings.length}
          isUnassigned={col.isUnassigned}
        />
      ),
      emptyHint: col.isUnassigned ? (
        <div className="absolute top-3 left-2 right-2 text-center text-[10px] text-admin-muted/70 italic flex items-center justify-center gap-1 pointer-events-none">
          <UserX className="w-3 h-3" /> Sin citas sin asignar
        </div>
      ) : null,
    }));
  }, [date, dayBookings, dayBlocks, isToday, staffMembers, todayHours]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
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

      <TimeGrid
        columns={columns}
        gutterWidth={64}
        colMinWidth="160px"
        onBookingClick={onBookingClick}
        onSlotClick={(col, time) => onSlotClick?.(date, time, col.staff)}
        onBlockClick={onBlockClick}
        onMoveBooking={(id, time) => onMoveBooking?.(id, time)}
        onResizeBooking={onResizeBooking}
      />
    </div>
  );
};

export default TeamDayView;
