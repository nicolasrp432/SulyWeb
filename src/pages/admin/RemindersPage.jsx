import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, MessageCircle, Check, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';
import { getInitials } from '@/lib/avatar';
import { useToast } from '@/components/ui/use-toast';

const toISO = (d) => format(d, 'yyyy-MM-dd');

const resolvePhone = (b) => {
  const raw = b.client_phone || b.customers?.phone_display
    || (b.customers?.phone_normalized ? `+34${b.customers.phone_normalized}` : '');
  return raw || '';
};

const waLink = (b) => {
  let p = resolvePhone(b).replace(/\D/g, '');
  if (!p) return null;
  if (!p.startsWith('34') && p.length === 9) p = '34' + p;
  const date = format(parseISO(b.booking_date), "EEEE d 'de' MMMM", { locale: es });
  const time = b.booking_time?.slice(0, 5);
  const loc = b.locations?.name || '';
  const manage = b.cancellation_token ? `${window.location.origin}/cita/${b.cancellation_token}` : '';
  const msg = `¡Hola ${(b.client_name || '').split(' ')[0]}! Te recordamos tu cita en Suly Pretty Nails el ${date} a las ${time}${loc ? ` (${loc})` : ''}.`
    + (manage ? `\n\nSi necesitas cambiarla o cancelarla: ${manage}` : '')
    + `\n\n¡Te esperamos! 💅`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
};

const RemindersPage = () => {
  const { toast } = useToast();
  const [date, setDate] = useState(() => addDays(new Date(), 1)); // mañana
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateStr = toISO(date);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('id, client_name, client_phone, booking_date, booking_time, status, cancellation_token, reminder_wa_sent_at, customers(phone_display, phone_normalized), locations(name), booking_services(services(name))')
      .eq('booking_date', dateStr)
      .in('status', ['confirmed', 'pending'])
      .order('booking_time');
    setRows(data ?? []);
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel('reminders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchRows)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchRows]);

  const markSent = async (b) => {
    const value = b.reminder_wa_sent_at ? null : new Date().toISOString();
    const { error } = await supabase.from('bookings').update({ reminder_wa_sent_at: value }).eq('id', b.id);
    if (error) { toast({ variant: 'destructive', title: 'No se pudo actualizar', description: error.message }); return; }
    setRows((prev) => prev.map((r) => r.id === b.id ? { ...r, reminder_wa_sent_at: value } : r));
  };

  const pending = useMemo(() => rows.filter((r) => !r.reminder_wa_sent_at).length, [rows]);
  const isTomorrow = dateStr === toISO(addDays(new Date(), 1));

  return (
    <>
      <Helmet><title>Recordatorios — Admin Suly</title></Helmet>
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader
          icon={Bell}
          title="Recordatorios"
          subtitle="Envía el recordatorio por WhatsApp con un toque"
        />

        {/* Selector de día */}
        <div className="flex items-center justify-between bg-white border border-admin-border rounded-2xl px-3 py-2 shadow-rose-xs">
          <button onClick={() => setDate((d) => subDays(d, 1))} className="p-2 rounded-lg hover:bg-admin-surface transition-colors" aria-label="Día anterior">
            <ChevronLeft className="w-4 h-4 text-admin-text" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-admin-text capitalize">{format(date, "EEEE d 'de' MMMM", { locale: es })}</p>
            <p className="text-[11px] text-admin-muted">{isTomorrow ? 'Mañana' : ''} · {pending} por enviar de {rows.length}</p>
          </div>
          <button onClick={() => setDate((d) => addDays(d, 1))} className="p-2 rounded-lg hover:bg-admin-surface transition-colors" aria-label="Día siguiente">
            <ChevronRight className="w-4 h-4 text-admin-text" />
          </button>
        </div>

        <div className="bg-white border border-admin-border rounded-2xl overflow-hidden shadow-rose-xs">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-admin-surface animate-pulse" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Bell} title="Sin citas ese día" description="No hay citas confirmadas ni pendientes para recordar." />
          ) : (
            <div className="divide-y divide-admin-border">
              {rows.map((b) => {
                const phone = resolvePhone(b);
                const link = waLink(b);
                const sent = !!b.reminder_wa_sent_at;
                const services = (b.booking_services ?? []).map((bs) => bs.services?.name).filter(Boolean).join(', ');
                return (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${sent ? 'bg-emerald-50/40' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                      {getInitials(b.client_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-admin-text truncate">{b.client_name || 'Sin nombre'}</p>
                      <p className="text-[11px] text-admin-muted truncate flex items-center gap-1">
                        <Clock className="w-3 h-3" />{b.booking_time?.slice(0, 5)}
                        {b.locations?.name && <><MapPin className="w-3 h-3 ml-1" />{b.locations.name}</>}
                      </p>
                      {services && <p className="text-[11px] text-admin-muted truncate">{services}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {link ? (
                        <a
                          href={link} target="_blank" rel="noopener noreferrer"
                          onClick={() => { if (!sent) markSent(b); }}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:brightness-105 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      ) : (
                        <span className="text-[11px] text-admin-muted italic px-2">Sin teléfono</span>
                      )}
                      <button
                        onClick={() => markSent(b)}
                        title={sent ? 'Marcar como no enviado' : 'Marcar como enviado'}
                        className={`p-2 rounded-xl transition-colors ${sent ? 'text-emerald-600 bg-emerald-100' : 'text-admin-muted hover:bg-admin-surface'}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-[11px] text-admin-muted text-center px-4">
          Al pulsar WhatsApp se abre el chat con el mensaje escrito y se marca como enviado. El estado se comparte entre dispositivos.
        </p>
      </div>
    </>
  );
};

export default RemindersPage;
