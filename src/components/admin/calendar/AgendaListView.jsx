import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_CHIP, STATUS_LABEL } from './statusStyles';

const timeToMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
};

const formatHumanDate = (dateStr, options) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', options);

/** Vista Agenda: listado cronológico de las próximas citas con acciones rápidas. */
const AgendaListView = ({
  bookings,
  locationNameById = {},
  onBookingClick,
  onNewBooking,
  onComplete,
  onCancel,
  onWa,
}) => {
  const agendaBookings = [...bookings].sort((a, b) => {
    if (a.booking_date === b.booking_date) {
      return timeToMinutes(a.booking_time) - timeToMinutes(b.booking_time);
    }
    return a.booking_date.localeCompare(b.booking_date);
  });

  return (
    <div className="rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-admin-text">Agenda de citas</h3>
        <Button variant="outline" size="sm" onClick={() => onNewBooking?.()} className="border-brand-rose text-brand-rose hover:bg-brand-rose/5">
          <Plus className="h-4 w-4 mr-1" /> Nueva cita
        </Button>
      </div>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {agendaBookings.length === 0 ? (
          <div className="text-sm text-admin-muted py-10 text-center font-medium">No hay citas con los filtros actuales.</div>
        ) : agendaBookings.map((booking) => {
          const bookingStatus = booking.meta?.status || 'pending';
          return (
            <div key={booking.id} className="border border-admin-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-admin-text text-sm">{booking.client_name}</p>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${STATUS_CHIP[bookingStatus] || STATUS_CHIP.pending}`}>
                    {STATUS_LABEL[bookingStatus] || 'Pendiente'}
                  </span>
                </div>
                <p className="text-xs text-admin-muted mt-1">
                  📅 {formatHumanDate(booking.booking_date, { weekday: 'long', day: 'numeric', month: 'long' })} · ⏰ {booking.booking_time?.slice(0, 5)}
                </p>
                <p className="text-xs text-admin-text mt-0.5">
                  📍 Sede: <strong className="font-semibold">{locationNameById[booking.location_id] || 'N/A'}</strong>
                  {booking.meta?.assigned_to ? ` · 👤 Responsable: ${booking.meta.assigned_to}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-auto">
                <Button size="sm" variant="outline" onClick={() => onBookingClick?.(booking)}>Ver detalle</Button>
                <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => onComplete?.(booking)}>Completar</Button>
                <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onCancel?.(booking)}>Cancelar</Button>
                <Button size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50" onClick={() => onWa?.(booking)}>Recordatorio</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaListView;
