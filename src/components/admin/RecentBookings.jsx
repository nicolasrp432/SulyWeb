import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  pending:   'bg-amber-500/15 text-amber-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
};
const STATUS_LABELS = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const RecentBookings = ({ bookings, loading }) => (
  <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden h-full">
    <div className="px-5 py-4 border-b border-admin-surface">
      <h3 className="font-semibold text-admin-text text-sm">Últimas citas</h3>
    </div>
    {loading ? (
      <div className="p-5 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-admin-surface animate-pulse" />
        ))}
      </div>
    ) : bookings.length === 0 ? (
      <div className="p-10 text-center text-admin-muted text-sm">No hay citas recientes</div>
    ) : (
      <div className="divide-y divide-admin-surface">
        {bookings.map((b) => (
          <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-admin-surface/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-rose/20 flex items-center justify-center text-brand-rose text-xs font-bold shrink-0">
              {b.client_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-admin-text truncate">{b.client_name}</p>
              <p className="text-xs text-admin-muted">
                {b.booking_date ? format(parseISO(b.booking_date), 'd MMM', { locale: es }) : '—'}
                {' · '}{b.booking_time?.slice(0, 5)}
                {b.locations?.name ? ` · ${b.locations.name}` : ''}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[b.status] ?? STATUS_STYLES.confirmed}`}>
              {STATUS_LABELS[b.status] ?? 'Confirmada'}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RecentBookings;
