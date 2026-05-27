import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const STATUS_LABELS = {
  pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada', confirmed: 'Confirmada',
};

const DayView = ({ date, bookings, blocks, onBookingClick, onSlotClick, onBlockClick }) => {
  const dayKey = format(date, 'yyyy-MM-dd');
  const dayBookings = bookings
    .filter((b) => b.booking_date === dayKey)
    .sort((a, b) => (a.booking_time > b.booking_time ? 1 : -1));

  const dayBlocks = (blocks ?? []).filter((b) => b.block_date === dayKey);
  const hasFullDayBlock = dayBlocks.some((b) => !b.start_time);

  const isHourBlocked = (h) => {
    if (hasFullDayBlock) return true;
    const hStr = `${String(h).padStart(2, '0')}:00`;
    return dayBlocks.some((b) => b.start_time && b.start_time <= hStr && (b.end_time ?? '23:59') > hStr);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="px-6 py-4 border-b border-admin-border shrink-0">
        <p className="text-base font-bold text-admin-text capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <p className="text-sm text-admin-muted">
          {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
          {hasFullDayBlock && <span className="ml-2 text-amber-600 font-medium">· Día bloqueado</span>}
        </p>
      </div>

      {hasFullDayBlock && (
        <div className="mx-6 my-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Día completo bloqueado</p>
              {dayBlocks.filter((b) => !b.start_time).map((b) => b.reason).filter(Boolean).map((r, i) => (
                <p key={i} className="text-xs text-amber-600">{r}</p>
              ))}
            </div>
          </div>
          {dayBlocks.filter((b) => !b.start_time).map((b) => (
            <button
              key={b.id}
              onClick={() => onBlockClick?.(b.id)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors shrink-0"
            >
              Desbloquear
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-admin-border">
        {HOURS.map((h) => {
          const hourBookings = dayBookings.filter(
            (b) => parseInt(b.booking_time?.slice(0, 2) ?? '0') === h
          );
          const blocked = isHourBlocked(h);
          const hourBlocks = dayBlocks.filter((b) => {
            if (!b.start_time) return false;
            const hStr = `${String(h).padStart(2, '0')}:00`;
            return b.start_time <= hStr && (b.end_time ?? '23:59') > hStr;
          });

          return (
            <div key={h} className={`flex gap-4 px-6 py-3 ${blocked ? 'bg-amber-50/60' : ''}`}>
              <div className="w-12 shrink-0 text-xs text-admin-muted pt-1.5">{h}:00</div>
              <div className="flex-1 space-y-2">
                {blocked && !hasFullDayBlock && hourBlocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">{b.reason || 'Bloqueado'}</p>
                    </div>
                    <button
                      onClick={() => onBlockClick?.(b.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-semibold border border-red-200 rounded px-1.5 py-0.5 hover:bg-red-50 transition-colors"
                    >
                      Desbloquear
                    </button>
                  </div>
                ))}

                {hourBookings.length === 0 && !blocked ? (
                  <button
                    onClick={() => onSlotClick?.(date, h)}
                    className="w-full h-8 rounded-lg border border-dashed border-admin-border/60 hover:border-brand-rose/40 hover:bg-brand-rose-50/50 transition-all group flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5 text-admin-muted/0 group-hover:text-brand-rose/50 transition-colors" />
                  </button>
                ) : (
                  hourBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onBookingClick?.(b)}
                      className={`w-full text-left bg-white border rounded-xl px-4 py-3 hover:shadow-sm transition-all ${STATUS_STYLES[b.status ?? 'confirmed']}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-admin-text">{b.client_name}</p>
                          <p className="text-xs text-admin-muted mt-0.5 truncate">
                            {b.booking_time?.slice(0, 5)}
                            {' · '}
                            {b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || 'Sin servicios'}
                            {b.locations?.name ? ` · ${b.locations.name}` : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${STATUS_STYLES[b.status ?? 'confirmed']}`}>
                          {STATUS_LABELS[b.status ?? 'confirmed']}
                        </span>
                      </div>
                      {b.client_phone && (
                        <p className="text-xs text-admin-muted mt-1">{b.client_phone}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
