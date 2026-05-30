import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Plus } from 'lucide-react';
import BookingActionMenu from './BookingActionMenu';

const STATUS_CHIP = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled:   'bg-rose-100 text-rose-800 border-rose-200',
  completed:   'bg-blue-100 text-blue-800 border-blue-200',
  no_show:     'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const STATUS_LABEL = {
  pending: 'Pendiente', confirmed: 'Confirmada', rescheduled: 'Reprogramada',
  cancelled: 'Cancelada', completed: 'Completada', no_show: 'No asistió',
};

const DayAgendaPanel = ({
  date,
  bookings = [],
  onBookingClick,
  onNewBooking,
  onConfirm,
  onComplete,
  onCancel,
  onWa,
  onCall,
  onEmail,
}) => {
  const dayKey = date ? format(date, 'yyyy-MM-dd') : '';
  const dayBookings = useMemo(
    () => bookings
      .filter((b) => b.booking_date === dayKey)
      .sort((a, b) => (a.booking_time || '').localeCompare(b.booking_time || '')),
    [bookings, dayKey]
  );

  const label = date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : '';

  return (
    <div className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between gap-3 bg-gradient-to-r from-brand-rose-50/60 to-amber-50/40">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-admin-muted uppercase tracking-wider">Agenda del día</p>
          <p className="text-sm font-bold text-admin-text capitalize truncate">{label}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-admin-muted">
            {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
          </span>
          {onNewBooking && (
            <button
              type="button"
              onClick={() => onNewBooking(date)}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gradient-rose-gold text-white shadow-rose-sm hover:shadow-rose-md transition-all"
              aria-label="Nueva cita"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-admin-border/50 max-h-[420px] overflow-y-auto">
        {dayBookings.length === 0 ? (
          <div className="text-center py-10 px-4">
            <CalendarDays className="w-8 h-8 text-admin-muted/40 mx-auto mb-2" />
            <p className="text-sm text-admin-muted">No hay citas para este día</p>
            {onNewBooking && (
              <button
                type="button"
                onClick={() => onNewBooking(date)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-rose-gold text-white text-xs font-bold shadow-rose-sm hover:shadow-rose-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Crear primera cita
              </button>
            )}
          </div>
        ) : (
          dayBookings.map((b) => {
            const services =
              b.services?.map((s) => s.name).filter(Boolean).join(', ') ||
              b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') ||
              '';
            const status = b.meta?.status || b.status || 'pending';
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-admin-surface/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onBookingClick?.(b)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-sm font-bold text-brand-rose">{b.booking_time?.slice(0, 5)}</p>
                    <p className="text-[10px] text-admin-muted">{b.meta?.duration_minutes || b.duration_minutes || 30}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-admin-text truncate">{b.client_name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_CHIP[status] || STATUS_CHIP.pending}`}>
                        {STATUS_LABEL[status] || 'Pendiente'}
                      </span>
                    </div>
                    {services && <p className="text-[11px] text-admin-muted truncate">{services}</p>}
                  </div>
                </button>
                <BookingActionMenu
                  booking={b}
                  onConfirm={onConfirm}
                  onComplete={onComplete}
                  onCancel={onCancel}
                  onWa={onWa}
                  onCall={onCall}
                  onEmail={onEmail}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DayAgendaPanel;
