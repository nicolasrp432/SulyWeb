import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Scissors, CheckCircle, XCircle, Loader2, MessageSquare, AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { CONTACT_INFO } from '@/constants';
import { STATUS_LABEL } from '@/components/admin/calendar/statusStyles';

const salonWa = (text) => {
  let p = (CONTACT_INFO.WHATSAPP || '').replace(/\D/g, '');
  if (!p.startsWith('34') && p.length === 9) p = '34' + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

const AppointmentManage = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(null); // 'cancelled' | 'error' | 'too_late'

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: settingsRows }] = await Promise.all([
      supabase.rpc('get_public_booking', { p_token: token }),
      supabase.from('settings').select('value').eq('key', 'cancellation_policy_text').maybeSingle(),
    ]);
    setBooking(data ?? null);
    if (settingsRows?.value) setPolicy(typeof settingsRows.value === 'string' ? settingsRows.value : String(settingsRows.value));
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const doCancel = async () => {
    setCancelling(true);
    const { data, error } = await supabase.rpc('cancel_public_booking', { p_token: token, p_reason: reason || null });
    setCancelling(false);
    if (error) {
      setDone(error.message?.includes('TOO_LATE') ? 'too_late' : 'error');
      return;
    }
    if (data?.ok) { setDone('cancelled'); setBooking((b) => b ? { ...b, status: 'cancelled', can_cancel: false } : b); }
  };

  const dateLabel = booking?.date ? format(parseISO(booking.date), "EEEE, d 'de' MMMM", { locale: es }) : '';

  const Shell = ({ children }) => (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4 pt-24">
      <Helmet><title>Mi cita — Suly Pretty Nails</title></Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-rose-lg p-8 sm:p-10 max-w-md w-full border border-brand-rose-100"
      >
        {children}
      </motion.div>
    </div>
  );

  if (loading) {
    return <Shell><div className="flex items-center justify-center py-8 gap-3 text-brand-mid"><Loader2 className="h-5 w-5 animate-spin text-brand-rose" /> Cargando tu cita...</div></Shell>;
  }

  if (!booking) {
    return (
      <Shell>
        <div className="text-center">
          <XCircle className="h-12 w-12 text-brand-mid/40 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-brand-dark mb-2">Cita no encontrada</h1>
          <p className="text-brand-mid text-sm">El enlace no es válido o la cita ya no existe. Si crees que es un error, contáctanos por WhatsApp.</p>
          <a href={salonWa('Hola, tengo un problema con el enlace de mi cita.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 h-11 bg-[#25D366] text-white font-bold rounded-2xl">
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  const isCancelled = booking.status === 'cancelled' || done === 'cancelled';

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isCancelled ? 'bg-rose-100' : 'bg-gradient-rose-gold shadow-rose-md'}`}>
          {isCancelled ? <XCircle className="h-7 w-7 text-rose-500" /> : <CheckCircle className="h-7 w-7 text-white" />}
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mb-1">
          {isCancelled ? 'Cita cancelada' : `¡Hola ${booking.first_name || ''}!`}
        </h1>
        <p className="text-brand-mid text-sm">
          {isCancelled ? 'Tu cita ha sido cancelada.' : `Estado: ${STATUS_LABEL[booking.status] || booking.status}`}
        </p>
      </div>

      <div className="bg-brand-rose-50 rounded-2xl p-4 text-left space-y-2.5 mb-5 border border-brand-rose-100">
        <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-brand-rose shrink-0" /><span className="text-sm text-brand-dark font-medium capitalize">{dateLabel}</span></div>
        <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-brand-rose shrink-0" /><span className="text-sm text-brand-dark font-medium">{booking.time}</span></div>
        <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand-rose shrink-0" /><span className="text-sm text-brand-dark font-medium">{booking.location || '—'}</span></div>
        {booking.services?.length > 0 && (
          <div className="flex items-start gap-3"><Scissors className="h-4 w-4 text-brand-rose shrink-0 mt-0.5" /><span className="text-sm text-brand-dark">{booking.services.join(', ')}</span></div>
        )}
      </div>
      {booking.reference && (
        <p className="text-xs text-brand-mid text-center mb-5">Nº de referencia: <span className="font-mono font-bold text-brand-dark">{booking.reference}</span></p>
      )}

      {isCancelled ? (
        <a href={salonWa(`Hola, quería reservar una nueva cita.`)} target="_blank" rel="noopener noreferrer" className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-2xl">
          <MessageSquare className="h-4 w-4" /> Pedir nueva cita por WhatsApp
        </a>
      ) : booking.can_cancel && done !== 'cancelled' ? (
        <div className="space-y-3">
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)" rows={2}
            className="w-full px-3 py-2 rounded-xl border border-brand-rose-100 bg-brand-rose-50 text-sm text-brand-dark placeholder:text-brand-mid/40 focus:outline-none focus:border-brand-rose resize-none"
          />
          <button onClick={doCancel} disabled={cancelling} className="w-full h-12 flex items-center justify-center gap-2 border-2 border-rose-200 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 disabled:opacity-50 transition-all">
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Cancelar mi cita
          </button>
          <a href={salonWa(`Hola, quería cambiar mi cita del ${booking.date} a las ${booking.time} (ref. ${booking.reference}).`)} target="_blank" rel="noopener noreferrer" className="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold text-brand-rose hover:underline">
            <MessageSquare className="h-4 w-4" /> Pedir un cambio por WhatsApp
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{policy || `La cancelación online no está disponible con tan poca antelación (mínimo ${booking.deadline_hours} h). Escríbenos por WhatsApp.`}</p>
          </div>
          <a href={salonWa(`Hola, necesito cancelar o cambiar mi cita del ${booking.date} a las ${booking.time} (ref. ${booking.reference}).`)} target="_blank" rel="noopener noreferrer" className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-2xl">
            <MessageSquare className="h-4 w-4" /> Contactar por WhatsApp
          </a>
        </div>
      )}

      {done === 'error' && <p className="text-xs text-red-500 text-center mt-3">No se pudo cancelar. Inténtalo de nuevo o escríbenos por WhatsApp.</p>}
    </Shell>
  );
};

export default AppointmentManage;
