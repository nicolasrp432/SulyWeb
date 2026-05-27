import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import BookingDetailModal from '@/components/admin/BookingDetailModal';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  pending:   'bg-amber-500/15 text-amber-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
};
const STATUS_LABELS = {
  confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada',
};
const ORIGIN_LABELS = { online: 'Online', whatsapp: 'WhatsApp', presencial: 'Presencial' };
const PAGE_SIZE = 20;

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select(
        `id, booking_date, booking_time, client_name, client_phone, client_email,
         status, origin, created_at,
         locations(id, name),
         booking_services(service_id, services(name))`,
        { count: 'exact' }
      )
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter) query = query.eq('status', statusFilter);
    if (locationFilter) query = query.eq('location_id', locationFilter);
    if (search) query = query.ilike('client_name', `%${search}%`);

    const { data, count } = await query;
    setBookings(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, statusFilter, locationFilter, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const exportCSV = () => {
    const rows = [['Fecha', 'Hora', 'Sede', 'Cliente', 'Teléfono', 'Servicios', 'Estado', 'Origen']];
    bookings.forEach((b) => {
      rows.push([
        b.booking_date ?? '',
        b.booking_time?.slice(0, 5) ?? '',
        b.locations?.name ?? '',
        b.client_name ?? '',
        b.client_phone ?? '',
        b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join('; ') ?? '',
        STATUS_LABELS[b.status] ?? b.status ?? '',
        ORIGIN_LABELS[b.origin] ?? b.origin ?? '',
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'citas.csv' }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet><title>Citas — Admin Suly</title></Helmet>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl font-bold text-admin-text">Citas</h1>
            <p className="text-sm text-admin-muted mt-0.5">{total} citas en total</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-admin-muted bg-admin-sidebar border border-admin-surface rounded-lg hover:text-admin-text transition-colors self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-3 py-2 bg-admin-sidebar border border-admin-surface rounded-xl text-admin-text text-sm placeholder:text-admin-muted focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-admin-sidebar border border-admin-surface rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
          >
            <option value="">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
            <option value="completed">Completadas</option>
          </select>
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-admin-sidebar border border-admin-surface rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
          >
            <option value="">Todas las sedes</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-surface">
                  {['Fecha / Hora', 'Sede', 'Cliente', 'Servicios', 'Estado', 'Origen'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold text-admin-muted uppercase tracking-wider ${h === 'Servicios' ? 'hidden md:table-cell' : h === 'Origen' ? 'hidden sm:table-cell' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-surface">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-admin-surface animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-admin-muted">No hay citas</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-admin-surface/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-admin-text">
                          {b.booking_date ? format(parseISO(b.booking_date), 'd MMM', { locale: es }) : '—'}
                        </p>
                        <p className="text-xs text-admin-muted">{b.booking_time?.slice(0, 5)}</p>
                      </td>
                      <td className="px-4 py-3 text-admin-muted text-xs">{b.locations?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-admin-text">{b.client_name}</p>
                        <p className="text-xs text-admin-muted">{b.client_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-admin-muted text-xs hidden md:table-cell max-w-[200px] truncate">
                        {b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[b.status] ?? STATUS_STYLES.confirmed}`}>
                          {STATUS_LABELS[b.status] ?? 'Confirmada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-admin-muted hidden sm:table-cell">
                        {ORIGIN_LABELS[b.origin] ?? 'Online'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-admin-surface">
              <p className="text-xs text-admin-muted">
                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-admin-surface text-admin-text rounded-lg disabled:opacity-40 hover:bg-admin-border transition-colors"
                >
                  Anterior
                </button>
                <button
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-admin-surface text-admin-text rounded-lg disabled:opacity-40 hover:bg-admin-border transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={() => { setSelectedBooking(null); fetchBookings(); }}
        />
      )}
    </>
  );
};

export default BookingsPage;
