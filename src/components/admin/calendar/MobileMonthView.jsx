import React, { useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { Lock } from 'lucide-react';

const HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MobileMonthView = ({
  date,
  bookings = [],
  blocks = [],
  selectedDate,
  onDayClick,
}) => {
  const calStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  const bookingsByDay = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!map[b.booking_date]) map[b.booking_date] = [];
      map[b.booking_date].push(b);
    });
    return map;
  }, [bookings]);

  const blocksByDay = useMemo(() => {
    const map = {};
    (blocks || []).forEach((b) => {
      if (!map[b.block_date]) map[b.block_date] = [];
      map[b.block_date].push(b);
    });
    return map;
  }, [blocks]);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 border-b border-admin-border bg-white shrink-0">
        {HEADERS.map((h, i) => (
          <div key={i} className="py-2 text-center text-[10px] font-bold text-admin-muted uppercase tracking-wider">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-admin-border/40 gap-px p-px">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay[key] || [];
          const dayBlocks = blocksByDay[key] || [];
          const isBlocked = dayBlocks.some((b) => !b.start_time);
          const inMonth = isSameMonth(day, date);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const count = dayBookings.length;
          const barWidth = count > 0 ? Math.min(20 + count * 14, 90) : 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={`relative aspect-[1/1.1] bg-white flex flex-col items-center justify-between p-1.5 active:scale-95 transition-transform overflow-hidden ${
                !inMonth ? 'opacity-30' : ''
              } ${isBlocked ? 'bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#fef3c7_4px,#fef3c7_6px)]' : ''} ${
                selected && !today ? 'ring-2 ring-brand-rose/60 z-10' : ''
              } ${today ? 'ring-2 ring-brand-rose z-10' : ''}`}
            >
              {isBlocked && (
                <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-600" />
              )}
              <div className="flex items-center justify-center flex-1 w-full">
                <span className={`text-sm font-bold ${
                  today
                    ? 'text-brand-rose'
                    : selected
                    ? 'text-brand-rose'
                    : inMonth ? 'text-admin-text' : 'text-admin-muted'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              {count > 0 && (
                <div
                  className="h-1 rounded-full bg-gradient-rose-gold shrink-0"
                  style={{ width: `${barWidth}%` }}
                  title={`${count} ${count === 1 ? 'cita' : 'citas'}`}
                />
              )}
              {today && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-brand-rose rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileMonthView;
