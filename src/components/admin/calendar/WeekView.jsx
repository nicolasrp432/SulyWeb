import React from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import BookingSlot from './BookingSlot';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const WeekView = ({ date, bookings, onBookingClick }) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const bookingsByDay = {};
  bookings.forEach((b) => {
    if (!bookingsByDay[b.booking_date]) bookingsByDay[b.booking_date] = [];
    bookingsByDay[b.booking_date].push(b);
  });

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-admin-surface sticky top-0 bg-admin-bg z-10 shrink-0">
        <div />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`px-2 py-3 text-center border-l border-admin-surface ${isToday(d) ? 'bg-brand-rose/10' : ''}`}
          >
            <p className="text-[11px] text-admin-muted uppercase">{format(d, 'EEE', { locale: es })}</p>
            <p className={`text-lg font-bold mt-0.5 ${isToday(d) ? 'text-brand-rose' : 'text-admin-text'}`}>
              {format(d, 'd')}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[48px_repeat(7,1fr)]">
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div className="px-2 py-2 text-[11px] text-admin-muted text-right border-b border-admin-surface leading-none pt-3">
              {h}:00
            </div>
            {days.map((d) => {
              const key = format(d, 'yyyy-MM-dd');
              const hourBookings = (bookingsByDay[key] ?? []).filter(
                (b) => parseInt(b.booking_time?.slice(0, 2) ?? '0') === h
              );
              return (
                <div
                  key={d.toISOString()}
                  className={`min-h-[56px] p-1 border-l border-b border-admin-surface ${isToday(d) ? 'bg-brand-rose/5' : ''}`}
                >
                  <div className="space-y-0.5">
                    {hourBookings.map((b) => (
                      <BookingSlot key={b.id} booking={b} onClick={onBookingClick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
