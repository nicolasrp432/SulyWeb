import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Clock, Mail, Store, UserCheck, Activity, Timer, Globe, FileText,
  ChevronDown, ChevronUp, X, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ServicePicker from './ServicePicker';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'rescheduled', label: 'Reprogramada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'completed', label: 'Completada' },
];

const SOURCE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'online', label: 'Online (web)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'presencial', label: 'Presencial' },
];

const inputCls = 'w-full pl-9 h-11 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';
const selectCls = 'w-full pl-9 h-11 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors';

const FieldIcon = ({ icon: Icon }) => (
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
);

const NewBookingSheet = ({
  open,
  onClose,
  isMobile,
  defaultDate,
  defaultTime,
  defaultAssignedTo = '',
  locations = [],
  responsibleOptions = [],
  onCreated,
}) => {
  const { toast } = useToast();

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    booking_time: defaultTime || '10:00',
    selectedServiceIds: [],
    otherService: '',
    booking_date: defaultDate || todayIso,
    client_email: '',
    location_id: '',
    assigned_to: defaultAssignedTo || '',
    status: 'pending',
    duration_minutes: 30,
    source: 'admin',
    notes: '',
  });
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      booking_time: defaultTime || prev.booking_time || '10:00',
      booking_date: defaultDate || prev.booking_date || todayIso,
      assigned_to: defaultAssignedTo || '',
      client_name: '',
      client_phone: '',
      client_email: '',
      selectedServiceIds: [],
      otherService: '',
      notes: '',
      status: 'pending',
      duration_minutes: 30,
      source: 'admin',
      location_id: locations[0] ? String(locations[0].id) : '',
    }));
    setShowMore(false);
  }, [open, defaultTime, defaultDate, defaultAssignedTo, locations, todayIso]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const valid =
    form.client_name.trim().length > 0 &&
    (form.selectedServiceIds.length > 0 || form.otherService.trim().length > 0) &&
    form.booking_date &&
    form.booking_time;

  const handleSubmit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        client_email: form.client_email.trim() || null,
        booking_date: form.booking_date,
        booking_time: form.booking_time.length === 5 ? form.booking_time + ':00' : form.booking_time,
        location_id: form.location_id ? Number(form.location_id) : (locations[0]?.id ?? null),
        status: form.status || 'pending',
        assigned_to: form.assigned_to || null,
        duration_minutes: Number(form.duration_minutes) || 30,
        appointment_type: form.otherService.trim() || null,
        origin: form.source || 'admin',
        notes: form.notes || null,
      };

      const { data: bookingRow, error: bookingError } = await supabase
        .from('bookings')
        .insert([payload])
        .select('id')
        .single();
      if (bookingError) throw bookingError;

      if (form.selectedServiceIds.length > 0) {
        const rows = form.selectedServiceIds.map((sid) => ({
          booking_id: bookingRow.id,
          service_id: sid,
        }));
        const { error: bsError } = await supabase.from('booking_services').insert(rows);
        if (bsError) throw bsError;
      }

      toast({ title: 'Cita creada', description: `${form.client_name} · ${form.booking_date} ${form.booking_time}` });
      onCreated?.(bookingRow);
      onClose?.();
    } catch (err) {
      console.error('Error creando cita:', err);
      toast({ variant: 'destructive', title: 'No se pudo crear la cita', description: err.message || 'Error inesperado' });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = useMemo(() => {
    try {
      return format(new Date(`${form.booking_date}T00:00:00`), "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return form.booking_date;
    }
  }, [form.booking_date]);

  const containerAnim = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } };

  const containerCls = isMobile
    ? 'fixed inset-x-0 bottom-0 z-[80] bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col'
    : 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[88vh] flex flex-col';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            {...containerAnim}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className={containerCls}
          >
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <span className="w-10 h-1 rounded-full bg-zinc-300" />
              </div>
            )}

            <div className="px-5 pt-3 pb-3 border-b border-admin-border shrink-0 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-admin-text">Nueva cita</h3>
                <p className="text-xs text-admin-muted mt-0.5 capitalize">{dateLabel}</p>
              </div>
              <button
                onClick={onClose}
                className="text-admin-muted hover:text-admin-text p-1.5 rounded-lg hover:bg-admin-surface transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div className="relative">
                <FieldIcon icon={User} />
                <input
                  value={form.client_name}
                  onChange={setField('client_name')}
                  placeholder="Ej. María Gómez"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div className="relative">
                <FieldIcon icon={Phone} />
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.client_phone}
                  onChange={setField('client_phone')}
                  placeholder="Ej. 612 345 678"
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <FieldIcon icon={Clock} />
                <input
                  type="time"
                  value={form.booking_time}
                  onChange={setField('booking_time')}
                  className={inputCls}
                />
              </div>

              <ServicePicker
                selectedIds={form.selectedServiceIds}
                onChange={(ids) => setForm((prev) => ({ ...prev, selectedServiceIds: ids }))}
                otherText={form.otherService}
                onOtherChange={(t) => setForm((prev) => ({ ...prev, otherService: t }))}
              />

              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 mt-1 py-2 text-xs font-bold text-brand-rose hover:bg-brand-rose-50 rounded-lg transition-colors"
              >
                {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showMore ? 'Menos opciones' : 'Más opciones (email, sede, especialista, estado…)'}
              </button>

              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2 border-t border-admin-border/50"
                >
                  <div className="relative">
                    <FieldIcon icon={Mail} />
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={setField('client_email')}
                      placeholder="ejemplo@correo.com"
                      className={inputCls}
                    />
                  </div>

                  <div className="relative">
                    <FieldIcon icon={Store} />
                    <select value={form.location_id} onChange={setField('location_id')} className={selectCls}>
                      <option value="">Selecciona sede</option>
                      {locations.map((l) => (
                        <option key={l.id} value={String(l.id)}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <FieldIcon icon={UserCheck} />
                    <input
                      list="np-staff-options"
                      value={form.assigned_to}
                      onChange={setField('assigned_to')}
                      placeholder="Especialista (opcional)"
                      className={inputCls}
                    />
                    <datalist id="np-staff-options">
                      {responsibleOptions.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </div>

                  <div className="relative">
                    <FieldIcon icon={Activity} />
                    <select value={form.status} onChange={setField('status')} className={selectCls}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <FieldIcon icon={Timer} />
                    <input
                      type="number"
                      min="15"
                      step="5"
                      value={form.duration_minutes}
                      onChange={setField('duration_minutes')}
                      placeholder="30"
                      className={inputCls}
                    />
                  </div>

                  <div className="relative">
                    <FieldIcon icon={Globe} />
                    <select value={form.source} onChange={setField('source')} className={selectCls}>
                      {SOURCE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-admin-muted pointer-events-none" />
                    <textarea
                      value={form.notes}
                      onChange={setField('notes')}
                      placeholder="Notas (opcional)"
                      className="w-full pl-9 pt-2 pr-3 pb-2 min-h-[72px] rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-admin-border bg-admin-bg shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!valid || saving}
                onClick={handleSubmit}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-gradient-rose-gold shadow-rose-sm hover:shadow-rose-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar cita
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewBookingSheet;
