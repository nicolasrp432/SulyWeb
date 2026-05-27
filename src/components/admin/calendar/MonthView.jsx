import React from 'react';
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday,
} from 'date-fns';
import { Lock } from 'lucide-react';
import BookingSlot from './BookingSlot';

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MonthView = ({ date, bookings, blocks, onBookingClick, onDayClick, onBlockClick }) => {
  const calStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const calEnd   = endOfWeek(endOfMonth(date),   { weekStartsOn: 1 });
  const days     = eachDayOfInterval({ start: calStart, end: calEnd });

  const bookingsByDay = {};
  bookings.forEach((b) => {
    if (!bookingsByDay[b.booking_date]) bookingsByDay[b.booking_date] = [];
    bookingsByDay[b.booking_date].push(b);
  });

  const blocksByDay = {};
  (blocks ?? []).forEach((b) => {
    if (!blocksByDay[b.block_date]) blocksByDay[b.block_date] = [];
    blocksByDay[b.block_date].push(b);
  });

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-admin-border shrink-0">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="px-2 py-2 text-[11px] font-semibold text-admin-muted text-center uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay[key] ?? [];
          const dayBlocks   = blocksByDay[key] ?? [];
          const isBlocked   = dayBlocks.some((b) => !b.start_time);
          const inMonth     = isSameMonth(day, date);
          const today       = isToday(day);

          return (
            <div
              key={key}
              onClick={() => onDayClick?.(day)}
              className={`min-h-[90px] p-1.5 border-b border-r border-admin-border cursor-pointer transition-colors
                ${!inMonth ? 'opacity-35' : ''}
                ${isBlocked ? 'bg-amber-50/70 hover:bg-amber-100/60' : 'hover:bg-admin-surface/30'}`}
            >
              <div className="flex justify-between items-center mb-1">
                {isBlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dayBlocks.filter((b) => !b.start_time).forEach((b) => onBlockClick?.(b.id));
                    }}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                    title="Quitar bloqueo"
                  >
                    <Lock className="h-3 w-3" />
                  </button>
                )}
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ml-auto
                  ${today ? 'bg-gradient-rose-gold text-white shadow-rose-sm' : 'text-admin-muted'}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {isBlocked && (
                <p className="text-[9px] text-amber-600 font-semibold uppercase tracking-wider px-0.5 mb-0.5">
                  {dayBlocks.filter((b) => !b.start_time)[0]?.reason || 'Bloqueado'}
                </p>
              )}

              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <BookingSlot
                    key={b.id}
                    booking={b}
                    onClick={(e) => { e.stopPropagation?.(); onBookingClick?.(b); }}
                    compact
                  />
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-admin-muted pl-1">+{dayBookings.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
