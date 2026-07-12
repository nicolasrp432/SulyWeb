import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, Download, ClipboardList, CalendarDays, AlertCircle, CheckCircle, XCircle,
  Filter as FilterIcon, Store, Globe,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import StatsCard from '@/components/admin/StatsCard';
import EmptyState from '@/components/admin/EmptyState';
import BookingActionMenu from '@/components/admin/calendar/BookingActionMenu';
import BookingDetailDialog from '@/components/admin/calendar/BookingDetailDialog';
import EmailComposeModal from '@/components/admin/calendar/EmailComposeModal';
import { useBookingActions } from '@/hooks/useBookingActions';
import { STATUS_CHIP, STATUS_LABEL, STATUS_OPTIONS, ORIGIN_LABEL } from '@/components/admin/calendar/statusStyles';
import { getInitials } from '@/lib/avatar';

const PAGE_SIZE = 20;

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';
const selectCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [allCounts, setAllCounts] = useState({ total: 0, today: 0, pending: 0, confirmed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [responsibleOptions, setResponsibleOptions] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [emailBooking, setEmailBooking] = useState(null);

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
    supabase.from('admin_staff').select('full_name').eq('is_active', true).then(({ data }) => {
      setResponsibleOptions((data ?? []).map((s) => s.full_name).filter(Boolean));
    });
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select(
        `id, booking_date, booking_time, client_name, client_phone, client_email,
         status, origin, location_id, duration_minutes, notes, notes_admin, assigned_to,
         appointment_type, created_at,
         locations(id, name),
         booking_services(service_id, services(id, name, price, duration_minutes))`,
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

  const fetchCounts = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const [totalRes, todayRes, pendingRes, confirmedRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', todayStr),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]);
    setAllCounts({
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      confirmed: confirmedRes.count ?? 0,
    });
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  useEffect(() => {
    const channel = supabase
      .channel('bookings-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
        fetchCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, fetchBookings)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchBookings, fetchCounts]);

  const actions = useBookingActions({
    locations,
    onChange: () => { fetchBookings(); fetchCounts(); },
    openWa: (b) => {
      if (!b?.client_phone) return;
      let phone = b.client_phone.replace(/\D/g, '');
      if (!phone.startsWith('34') && phone.length === 9) phone = '34' + phone;
      const time = b.booking_time?.slice(0, 5);
      const msg = `Hola ${b.client_name}, te escribimos de Suly Pretty Nails para tu cita del ${b.booking_date} a las ${time}.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    },
    openEmail: (b) => setEmailBooking(b),
  });

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
        STATUS_LABEL[b.status] ?? b.status ?? '',
        ORIGIN_LABEL[b.origin] ?? b.origin ?? '',
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'citas.csv' }).click();
    URL.revokeObjectURL(url);
  };

  const exportButton = (
    <button
      onClick={exportCSV}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-admin-muted bg-white border border-admin-border rounded-xl hover:text-admin-text hover:bg-admin-surface transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      Exportar
    </button>
  );

  return (
    <>
      <Helmet><title>Citas — Admin Suly</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-5">
        <PageHeader
          icon={ClipboardList}
          title="Citas"
          subtitle={`${total} citas en el sistema`}
          actions={exportButton}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Total"       value={allCounts.total}     icon={ClipboardList} color="rose"    loading={loading} />
          <StatsCard title="Hoy"         value={allCounts.today}     icon={CalendarDays}  color="blue"    loading={loading} />
          <StatsCard title="Pendientes"  value={allCounts.pending}   icon={AlertCircle}   color="amber"   loading={loading} />
          <StatsCard title="Confirmadas" value={allCounts.confirmed} icon={CheckCircle}   color="emerald" loading={loading} />
        </div>

        {/* Filters */}
        <div className="bg-white border border-admin-border rounded-2xl p-3 sm:p-4 shadow-rose-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por nombre..."
              className={inputCls}
            />
          </div>
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className={selectCls}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted pointer-events-none" />
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(0); }}
              className={selectCls}
            >
              <option value="">Todas las sedes</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-admin-border rounded-2xl overflow-hidden shadow-rose-xs">
          {loading ? (
            <div className="divide-y divide-admin-border">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-admin-surface animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-admin-surface rounded animate-pulse" />
                    <div className="h-3 w-48 bg-admin-surface rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No hay citas con esos filtros"
              description="Cambia o limpia los filtros para ver más resultados."
            />
          ) : (
            <div className="divide-y divide-admin-border">
              {bookings.map((b) => {
                const status = b.status || 'pending';
                const services = b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '';
                return (
                  <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-admin-surface/40 transition-colors">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                        {getInitials(b.client_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-admin-text truncate">{b.client_name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_CHIP[status] || STATUS_CHIP.pending}`}>
                            {STATUS_LABEL[status] || 'Pendiente'}
                          </span>
                          <span className="text-[10px] text-admin-muted hidden sm:inline">
                            <Globe className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                            {ORIGIN_LABEL[b.origin] || 'Online'}
                          </span>
                        </div>
                        <p className="text-[11px] text-admin-muted truncate mt-0.5">
                          {b.booking_date ? format(parseISO(b.booking_date), "d MMM 'a las'", { locale: es }) : '—'}{' '}
                          <strong className="text-brand-rose">{b.booking_time?.slice(0, 5)}</strong>
                          {b.locations?.name ? ` · ${b.locations.name}` : ''}
                          {services ? ` · ${services}` : ''}
                        </p>
                      </div>
                    </button>
                    <BookingActionMenu
                      booking={b}
                      onConfirm={actions.confirmBooking}
                      onComplete={actions.completeBooking}
                      onCancel={actions.cancelBooking}
                      onWa={actions.waBooking}
                      onCall={actions.callBooking}
                      onEmail={actions.emailBooking}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border bg-admin-bg/40">
              <p className="text-xs text-admin-muted">
                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-admin-border bg-white rounded-lg disabled:opacity-40 hover:bg-admin-surface transition-colors"
                >
                  Anterior
                </button>
                <button
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-admin-border bg-white rounded-lg disabled:opacity-40 hover:bg-admin-surface transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BookingDetailDialog
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        locations={locations}
        responsibleOptions={responsibleOptions}
        onConfirm={actions.confirmBooking}
        onComplete={actions.completeBooking}
        onCancel={actions.cancelBooking}
        onOpenWa={actions.waBooking}
        onOpenEmail={actions.emailBooking}
        onSave={async () => { fetchBookings(); setSelectedBooking(null); }}
        onDelete={async (b) => {
          const ok = await actions.deleteBooking(b);
          if (ok) setSelectedBooking(null);
        }}
      />

      <EmailComposeModal
        open={!!emailBooking}
        onClose={() => setEmailBooking(null)}
        booking={emailBooking}
      />
    </>
  );
};

export default BookingsPage;
