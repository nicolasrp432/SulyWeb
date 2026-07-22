import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import BookingActionMenu from './calendar/BookingActionMenu';
import BookingDetailDialog from './calendar/BookingDetailDialog';
import EmailComposeModal from './calendar/EmailComposeModal';
import { useBookingActions } from '@/hooks/useBookingActions';
import { STATUS_CHIP, STATUS_LABEL } from './calendar/statusStyles';
import { getInitials } from '@/lib/avatar';

const RecentBookings = () => {
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [waBooking, setWaBooking] = useState(null);
  const [emailBooking, setEmailBooking] = useState(null);

  const fetchTodayBookings = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, client_name, client_phone, client_email, booking_date, booking_time,
        status, origin, location_id, duration_minutes, notes, notes_admin,
        assigned_to, appointment_type,
        locations(id, name),
        booking_services(service_id, services(id, name, price, duration_minutes))
      `)
      .eq('booking_date', todayStr)
      .order('booking_time', { ascending: true });

    if (!error) setTodayBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('locations').select('id,name').then(({ data }) => setLocations(data ?? []));
  }, []);

  useEffect(() => {
    fetchTodayBookings();
    const channel = supabase
      .channel('recent-bookings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchTodayBookings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, fetchTodayBookings)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchTodayBookings]);

  const handleWhatsApp = (b) => {
    if (!b?.client_phone) return;
    let cleanPhone = b.client_phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('34') && cleanPhone.length === 9) cleanPhone = '34' + cleanPhone;
    const timeStr = b.booking_time?.slice(0, 5);
    const sedeName = b.locations?.name || 'Suly Pretty Nails';
    const servicesList = (b.booking_services || []).map((bs) => bs.services?.name).filter(Boolean).join(', ');
    const message = `¡Hola ${b.client_name}! Te escribimos de Suly Pretty Nails 🌸 para recordarte tu cita de hoy a las ${timeStr} en nuestra sede de ${sedeName}${servicesList ? ` para ${servicesList}` : ''}. ¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const actions = useBookingActions({
    locations,
    onChange: fetchTodayBookings,
    openWa: (b) => { setWaBooking(b); handleWhatsApp(b); },
    openEmail: (b) => setEmailBooking(b),
  });

  return (
    <>
      <div className="bg-white border border-admin-border rounded-2xl overflow-hidden h-full flex flex-col min-h-[400px] shadow-rose-xs">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between bg-gradient-to-r from-brand-rose-50/60 to-amber-50/40">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand-rose" />
            <h3 className="font-bold text-admin-text text-sm">Agenda de hoy</h3>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
            En vivo
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-admin-muted gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
            <span className="text-xs">Cargando agenda...</span>
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-admin-muted">
            <Sparkles className="h-7 w-7 text-brand-rose/40 mb-2" />
            <p className="text-sm font-semibold text-admin-text">Sin citas hoy</p>
            <p className="text-xs text-admin-muted mt-1">Las reservas de hoy aparecerán aquí.</p>
          </div>
        ) : (
          <div className="flex-1 divide-y divide-admin-border overflow-y-auto max-h-[500px]">
            {todayBookings.map((b) => {
              const status = b.status || 'pending';
              const services = (b.booking_services || []).map((bs) => bs.services?.name).filter(Boolean).join(', ');
              return (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-admin-surface/30 transition-colors">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                      {getInitials(b.client_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-admin-text truncate">{b.client_name}</span>
                        <span className="text-xs font-bold text-brand-rose bg-brand-rose-50 px-1.5 py-0.5 rounded border border-brand-rose/20 shrink-0">
                          {b.booking_time?.slice(0, 5)}
                        </span>
                      </div>
                      {services && (
                        <p className="text-[11px] text-admin-muted truncate mt-0.5">{services}</p>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 hidden sm:inline-flex ${STATUS_CHIP[status] || STATUS_CHIP.pending}`}>
                      {STATUS_LABEL[status] || 'Pendiente'}
                    </span>
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
      </div>

      <BookingDetailDialog
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        locations={locations}
        responsibleOptions={[]}
        onConfirm={actions.confirmBooking}
        onComplete={actions.completeBooking}
        onCancel={actions.cancelBooking}
        onOpenWa={actions.waBooking}
        onOpenEmail={actions.emailBooking}
        onSave={async (id, form) => {
          const ok = await actions.saveBookingEdits(id, form);
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

export default RecentBookings;
