import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MapPin, Clock, Calendar, Save, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmada', style: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'pending',   label: 'Pendiente',  style: 'bg-amber-500/15 text-amber-400'   },
  { value: 'cancelled', label: 'Cancelada',  style: 'bg-red-500/15 text-red-400'       },
  { value: 'completed', label: 'Completada', style: 'bg-blue-500/15 text-blue-400'     },
];
const ORIGIN_LABELS = { online: 'Online (web)', whatsapp: 'WhatsApp', presencial: 'Presencial' };

const InfoBlock = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 bg-admin-bg rounded-xl p-3">
    <Icon className="h-4 w-4 text-brand-rose shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] text-admin-muted">{label}</p>
      <p className="text-sm font-semibold text-admin-text truncate">{value || '—'}</p>
    </div>
  </div>
);

const BookingDetailModal = ({ booking, onClose, onUpdated }) => {
  const [status, setStatus] = useState(booking.status ?? 'confirmed');
  const [adminNotes, setAdminNotes] = useState(booking.notes_admin ?? '');
  const [saving, setSaving] = useState(false);

  const services =
    booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean) ?? [];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('bookings')
      .update({ status, notes_admin: adminNotes })
      .eq('id', booking.id);
    setSaving(false);
    if (!error) { onUpdated?.(); onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-admin-sidebar border border-admin-surface rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-surface">
          <div>
            <h2 className="font-bold text-admin-text">{booking.client_name}</h2>
            <p className="text-xs text-admin-muted">{ORIGIN_LABELS[booking.origin] ?? 'Online'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock
              icon={Calendar}
              label="Fecha"
              value={booking.booking_date ? format(parseISO(booking.booking_date), 'd MMM yyyy', { locale: es }) : null}
            />
            <InfoBlock icon={Clock}   label="Hora"  value={booking.booking_time?.slice(0, 5)} />
            <InfoBlock icon={MapPin}  label="Sede"  value={booking.locations?.name} />
            <InfoBlock icon={Phone}   label="Teléfono" value={booking.client_phone} />
          </div>

          {booking.client_email && (
            <InfoBlock icon={Mail} label="Email" value={booking.client_email} />
          )}

          {services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-admin-muted mb-2">Servicios</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-brand-rose/15 text-brand-rose rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {booking.notes && (
            <div>
              <p className="text-xs font-semibold text-admin-muted mb-1">Notas del cliente</p>
              <p className="text-sm text-admin-text bg-admin-bg rounded-xl px-3 py-2">{booking.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-admin-muted mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    status === opt.value
                      ? `${opt.style} border-transparent ring-2 ring-offset-1 ring-offset-admin-sidebar ring-current`
                      : 'bg-admin-bg text-admin-muted border-admin-surface hover:border-admin-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-admin-muted mb-1.5">Notas internas</p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notas privadas para el equipo..."
              className="w-full px-3 py-2.5 bg-admin-bg border border-admin-surface rounded-xl text-admin-text text-sm placeholder:text-admin-muted focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-10 bg-brand-rose hover:bg-brand-rose-dark text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingDetailModal;
