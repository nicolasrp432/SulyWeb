import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TimeGrid from './grid/TimeGrid';
import { getDayConfig } from '@/lib/businessHours';

const toISO = (d) => format(d, 'yyyy-MM-dd');

/**
 * Vista Semana profesional: rejilla horaria continua de 7 columnas (una por
 * día) sobre TimeGrid, con la misma geometría y drag & drop que la vista Día.
 * En móvil se convierte en scroll horizontal con snap (~2,3 días visibles),
 * con el drag deshabilitado para no pelear con el gesto de scroll.
 */
const WeekGridView = ({
  weekDays,
  bookings,
  blocks = [],
  businessHours = null,
  isMobile = false,
  onBookingClick,
  onSlotClick, // (isoDate, 'HH:MM')
  onBlockClick,
  onMoveBooking, // (bookingId, 'HH:MM', isoDate)
  onResizeBooking,
  onDayHeaderClick, // (Date) -> saltar a vista Día
}) => {
  const todayISO = toISO(new Date());

  const columns = useMemo(() => {
    return weekDays.map((d) => {
      const iso = toISO(d);
      const isToday = iso === todayISO;
      return {
        key: iso,
        iso,
        date: d,
        staff: null,
        bookings: bookings.filter((b) => b.booking_date === iso),
        blocks: (blocks || []).filter((b) => b.block_date === iso),
        dayHours: businessHours ? getDayConfig(d, businessHours) : null,
        isToday,
        header: (
          <button
            type="button"
            onClick={() => onDayHeaderClick?.(d)}
            className="w-full py-1.5 flex flex-col items-center gap-0.5 hover:bg-admin-surface/50 transition-colors"
            title="Abrir vista de día"
          >
            <span className={`text-[9px] uppercase tracking-wider font-bold ${isToday ? 'text-brand-rose' : 'text-admin-muted'}`}>
              {format(d, 'EEE', { locale: es })}
            </span>
            <span
              className={`text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center ${
                isToday ? 'bg-brand-rose text-white shadow-rose-xs' : 'text-admin-text'
              }`}
            >
              {format(d, 'd')}
            </span>
          </button>
        ),
      };
    });
  }, [weekDays, bookings, blocks, businessHours, todayISO, onDayHeaderClick]);

  return (
    <div className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
      <TimeGrid
        columns={columns}
        gutterWidth={isMobile ? 44 : 56}
        colMinWidth={isMobile ? '42vw' : '110px'}
        enableDrag={!isMobile}
        horizontalSnap={isMobile}
        onBookingClick={onBookingClick}
        onSlotClick={(col, time) => onSlotClick?.(col.iso, time)}
        onBlockClick={onBlockClick}
        onMoveBooking={(id, time, col) => onMoveBooking?.(id, time, col.iso)}
        onResizeBooking={onResizeBooking}
      />
    </div>
  );
};

export default WeekGridView;
