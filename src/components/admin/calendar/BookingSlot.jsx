import React from 'react';

const ORIGIN_STYLES = {
  online:     'bg-brand-rose/20 text-brand-rose border-brand-rose/30',
  whatsapp:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  presencial: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};
const STATUS_OVERRIDE = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cancelled: 'bg-white/5 text-admin-muted border-white/10 opacity-50',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const BookingSlot = ({ booking, onClick, compact = false }) => {
  const style =
    STATUS_OVERRIDE[booking.status] ??
    ORIGIN_STYLES[booking.origin] ??
    ORIGIN_STYLES.online;

  const services =
    booking.booking_services
      ?.map((bs) => bs.services?.name)
      .filter(Boolean)
      .join(', ') ?? '';

  return (
    <button
      onClick={() => onClick?.(booking)}
      className={`w-full text-left px-2 py-1 rounded-lg border text-[11px] font-medium leading-tight truncate transition-opacity hover:opacity-80 ${style}`}
      title={`${booking.client_name} — ${booking.booking_time?.slice(0, 5)}`}
    >
      <span className="font-semibold">{booking.booking_time?.slice(0, 5)}</span>
      {' '}{booking.client_name}
      {!compact && services && <span className="opacity-70"> · {services}</span>}
    </button>
  );
};

export default BookingSlot;
