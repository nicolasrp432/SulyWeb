import React from 'react';
import { isDayClosed } from '@/lib/businessHours';
import { STATUS_DOT } from './statusStyles';

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MAX_EVENTS_PER_DAY = 3;

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Vista Mes (desktop): grid 7×6 con eventos estilo Google Calendar
 * (punto de color por estado + hora + nombre) y "+N más" clickable.
 */
const MonthGridView = ({
  monthGridDays,
  currentMonth, // índice de mes (0-11) del mes visible
  bookingsByDay,
  blocksByDay,
  businessHours = null,
  selectedDate = null,
  onSelectDay, // (Date)
  onOpenDaySheet, // (Date) — abre DayDetailSheet con el listado completo
  onBookingClick,
  onNewBooking, // (isoDate)
  onJumpToDay, // (Date) — número del día
}) => {
  const todayISO = toISODate(new Date());
  const selectedISO = selectedDate ? toISODate(selectedDate) : null;

  return (
    <div className="rounded-2xl border border-admin-border bg-white p-4 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-admin-muted uppercase tracking-wider px-1 pb-3 border-b border-admin-border/50">
        {WEEKDAY_NAMES.map((dayName) => (
          <div key={dayName} className="truncate">{dayName}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {monthGridDays.map((dayDate) => {
          const iso = toISODate(dayDate);
          const dayBookings = bookingsByDay[iso] || [];
          const dayBlocks = blocksByDay[iso] || [];
          const isOtherMonth = dayDate.getMonth() !== currentMonth;
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          const closed = businessHours ? isDayClosed(dayDate, businessHours) : false;
          const overflow = dayBookings.length - MAX_EVENTS_PER_DAY;

          return (
            <div
              key={iso}
              className={`group min-h-[112px] rounded-xl border p-2 flex flex-col transition-all cursor-pointer ${
                isOtherMonth ? 'bg-zinc-50/50 text-admin-muted border-zinc-200/50' : 'bg-white border-admin-border'
              } ${closed && !isOtherMonth ? 'bg-zinc-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_10px)]' : ''} ${
                isToday ? 'border-brand-rose ring-1 ring-brand-rose/25 bg-brand-rose-50/5 shadow-rose-xs' : 'hover:shadow-sm'
              } ${isSelected && !isToday ? 'ring-2 ring-brand-rose/60' : ''}`}
              onClick={() => onSelectDay?.(dayDate)}
            >
              <div className="flex items-center justify-between shrink-0 mb-1.5">
                <button
                  type="button"
                  className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                    isToday ? 'bg-brand-rose text-white shadow-rose-xs' : 'text-admin-text hover:bg-admin-surface'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToDay?.(dayDate);
                  }}
                >
                  {dayDate.getDate()}
                </button>
                <button
                  type="button"
                  className="text-[9px] font-bold text-brand-rose hover:bg-brand-rose-100/50 px-1 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewBooking?.(iso);
                  }}
                >
                  + cita
                </button>
              </div>

              <div className="space-y-0.5 flex-1 overflow-hidden">
                {dayBookings.slice(0, MAX_EVENTS_PER_DAY).map((booking) => {
                  const status = booking.meta?.status || 'pending';
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                      className="w-full flex items-center gap-1 px-1 py-0.5 rounded hover:bg-admin-surface/60 transition-colors text-left"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] || STATUS_DOT.pending}`} />
                      <span className="text-[9px] font-semibold text-admin-muted shrink-0">
                        {booking.booking_time?.slice(0, 5)}
                      </span>
                      <span className={`text-[9px] font-medium truncate ${status === 'cancelled' ? 'line-through text-admin-muted' : 'text-admin-text'}`}>
                        {booking.client_name}
                      </span>
                    </button>
                  );
                })}
                {overflow > 0 ? (
                  <button
                    type="button"
                    className="w-full text-[9px] text-brand-rose font-bold text-left px-1 py-0.5 rounded hover:bg-brand-rose-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDaySheet?.(dayDate);
                    }}
                  >
                    +{overflow} más
                  </button>
                ) : null}
                {dayBlocks.length > 0 && dayBookings.length === 0 ? (
                  <p className="text-[9px] text-zinc-500 font-semibold italic text-center pt-1">
                    🚫 {dayBlocks.length} bloqueo(s)
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGridView;
