import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Phone, CalendarDays, Loader2, MapPin, Scissors, Sparkles, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/20 line-through',
  completed: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
};

const STATUS_LABELS = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const RecentBookings = ({ bookings: initialBookings, loading: initialLoading }) => {
  const [todayBookings, setTodayBookings] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);

  const fetchTodayBookings = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          client_phone,
          client_email,
          booking_date,
          booking_time,
          status,
          origin,
          locations (id, name),
          booking_services (
            services (id, name, price, duration_minutes)
          )
        `)
        .eq('booking_date', todayStr)
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setTodayBookings(data || []);
    } catch (e) {
      console.error('Error fetching today\'s bookings:', e);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayBookings();

    const channel = supabase
      .channel('dashboard-agenda-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchTodayBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, () => {
        fetchTodayBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodayBookings]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      setTodayBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleWhatsApp = (b) => {
    if (!b.client_phone) return;
    
    let cleanPhone = b.client_phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('34') && cleanPhone.length === 9) {
      cleanPhone = '34' + cleanPhone;
    }

    const timeStr = b.booking_time?.slice(0, 5);
    const sedeName = b.locations?.name || 'Suly Pretty Nails';
    const servicesList = (b.booking_services || [])
      .map(bs => bs.services?.name)
      .filter(Boolean)
      .join(', ');
      
    const message = `¡Hola! Te escribimos de Suly Pretty Nails 🌸 para recordarte tu cita de hoy a las ${timeStr} en nuestra sede de ${sedeName}${servicesList ? ` para ${servicesList}` : ''}. ¡Te esperamos!`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden h-full flex flex-col min-h-[400px]">
      <div className="px-5 py-4 border-b border-admin-surface flex items-center justify-between bg-admin-surface/10">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-pink-500" />
          <h3 className="font-semibold text-admin-text text-sm">Agenda de Hoy</h3>
        </div>
        <span className="text-[10px] bg-pink-500/10 text-pink-400 font-bold px-2 py-0.5 rounded-full border border-pink-500/10 uppercase tracking-wider">
          En vivo
        </span>
      </div>

      {localLoading ? (
        <div className="flex-1 flex items-center justify-center p-8 text-admin-muted gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
          <span className="text-xs">Cargando agenda...</span>
        </div>
      ) : todayBookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-admin-muted">
          <Sparkles className="h-6 w-6 text-pink-500/40 mb-2" />
          <p className="text-sm font-medium text-admin-text">Sin citas programadas</p>
          <p className="text-xs text-admin-muted mt-1">Las reservas de hoy aparecerán aquí.</p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-admin-surface overflow-y-auto max-h-[500px] scrollbar-none">
          {todayBookings.map((b) => {
            const timeStr = b.booking_time?.slice(0, 5);
            const servicesList = (b.booking_services || [])
              .map(bs => bs.services?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <div key={b.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-admin-surface/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/10 flex items-center justify-center text-pink-500 text-sm font-bold shrink-0 shadow-sm mt-0.5">
                    {b.client_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-admin-text truncate">{b.client_name}</p>
                      <span className="text-xs font-semibold text-pink-500 bg-pink-500/5 px-2 py-0.5 rounded-lg border border-pink-500/10">
                        {timeStr}
                      </span>
                    </div>
                    {servicesList && (
                      <p className="text-xs text-admin-muted mt-1 flex items-center gap-1.5 truncate">
                        <Scissors className="h-3 w-3 text-pink-500/60 shrink-0" />
                        <span className="truncate">{servicesList}</span>
                      </p>
                    )}
                    <p className="text-xs text-admin-muted mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-pink-500/60 shrink-0" />
                      <span>{b.locations?.name || 'Sede'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${STATUS_STYLES[b.status] ?? STATUS_STYLES.confirmed}`}>
                    {STATUS_LABELS[b.status] ?? 'Confirmada'}
                  </span>

                  <div className="flex items-center gap-1 ml-2">
                    {/* WhatsApp */}
                    <button
                      onClick={() => handleWhatsApp(b)}
                      title="Enviar recordatorio por WhatsApp"
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 transition-colors shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>

                    {/* Complete button */}
                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        title="Marcar como completada"
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10 transition-colors shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Cancel button */}
                    {b.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                        title="Cancelar cita"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-colors shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentBookings;
