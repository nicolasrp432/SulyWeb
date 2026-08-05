import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Clock, Mail, Store, UserCheck, Activity, Timer, Globe, FileText,
  ChevronDown, ChevronUp, X, Loader2, Lock, CalendarPlus,
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

// `text-base sm:text-sm`: en iOS un input con letra < 16px hace que Safari
// haga zoom al enfocarlo y la pantalla se desplace de lado. `min-w-0` evita
// que el ancho intrínseco de los campos nativos (date/time/select) estire el
// contenedor y provoque scroll horizontal.
const fieldBase = 'w-full min-w-0 max-w-full h-11 rounded-xl border border-admin-border bg-white text-base sm:text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors';
const inputCls = `${fieldBase} pl-9 pr-3 placeholder:italic placeholder:font-normal placeholder:text-gray-400`;
// pr-8 deja sitio a la flecha nativa del select para que no pise el texto.
const selectCls = `${fieldBase} pl-9 pr-8 truncate`;

const FieldIcon = ({ icon: Icon }) => (
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
);

// Etiqueta corta sobre cada campo. Antes el único indicio era el placeholder y
// en móvil se cortaba ("Asignar manicurista (auto si vac…"); con etiqueta el
// texto de dentro puede ser breve y ya no se sale.
const Field = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="block text-[11px] font-semibold text-admin-muted mb-1">{label}</span>
    <span className="relative block min-w-0">{children}</span>
  </label>
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
  staffMembers = [],
  onCreated,
  onBlock,
}) => {
  const { toast } = useToast();

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // 'booking' = nueva cita · 'block' = cerrar ese horario
  const [mode, setMode] = useState('booking');
  const [blockForm, setBlockForm] = useState({ duration: 30, reason: '' });

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
    staff_id: '',
    status: 'pending',
    duration_minutes: 30,
    source: 'admin',
    notes: '',
  });
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode('booking');
    setBlockForm({ duration: 30, reason: '' });
    setForm((prev) => ({
      ...prev,
      booking_time: defaultTime || prev.booking_time || '10:00',
      booking_date: defaultDate || prev.booking_date || todayIso,
      assigned_to: defaultAssignedTo || '',
      staff_id: '',
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

  // Al elegir manicurista guardamos id (capacidad) y nombre (compatibilidad).
  const onStaffChange = (e) => {
    const id = e.target.value;
    const member = staffMembers.find((m) => String(m.id) === String(id));
    setForm((prev) => ({ ...prev, staff_id: id, assigned_to: member?.full_name || '' }));
  };

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
        location_id: form.location_id || locations[0]?.id || null,
        status: form.status || 'pending',
        assigned_to: form.assigned_to || null,
        staff_id: form.staff_id ? Number(form.staff_id) : null,
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
      const msg = err.message || '';
      const friendly = msg.includes('STAFF_OVERLAP')
        ? 'Esa manicurista ya tiene una cita que se solapa a esa hora.'
        : msg.includes('SLOT_BLOCKED')
        ? 'Ese horario está cerrado/bloqueado.'
        : msg.includes('uq_bookings_active_slot')
        ? 'Ya existe una cita para esa manicurista a esa hora.'
        : msg || 'Error inesperado';
      toast({ variant: 'destructive', title: 'No se pudo crear la cita', description: friendly });
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const start = form.booking_time.length === 5 ? form.booking_time + ':00' : form.booking_time;
      let end = null; // null = resto del día
      if (blockForm.duration > 0) {
        const [h, m] = form.booking_time.split(':').map(Number);
        const total = h * 60 + m + Number(blockForm.duration);
        end = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
      }
      await onBlock?.({
        block_date: form.booking_date,
        start_time: start,
        end_time: end,
        reason: blockForm.reason.trim() || 'Horario cerrado',
      });
      onClose?.();
    } catch (err) {
      console.error('Error cerrando horario:', err);
      toast({ variant: 'destructive', title: 'No se pudo cerrar el horario', description: err.message || 'Error inesperado' });
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

  // --- Campos ---------------------------------------------------------------
  // Se definen una sola vez y se componen distinto en móvil (una columna, con
  // "Más opciones" plegable) y en escritorio (dos columnas, todo a la vista).
  const fClientName = (
    <Field label="Nombre de la clienta">
      <FieldIcon icon={User} />
      <input
        value={form.client_name}
        onChange={setField('client_name')}
        placeholder="Ej. María Gómez"
        className={inputCls}
        autoFocus
      />
    </Field>
  );

  const fPhone = (
    <Field label="Teléfono">
      <FieldIcon icon={Phone} />
      <input
        type="tel"
        inputMode="tel"
        value={form.client_phone}
        onChange={setField('client_phone')}
        placeholder="612 345 678"
        className={inputCls}
      />
    </Field>
  );

  const fDate = (
    <Field label="Fecha">
      <FieldIcon icon={CalendarPlus} />
      <input
        type="date"
        value={form.booking_date}
        onChange={setField('booking_date')}
        className={`${fieldBase} pl-9 pr-3`}
      />
    </Field>
  );

  const fTime = (
    <Field label="Hora">
      <FieldIcon icon={Clock} />
      <input
        type="time"
        value={form.booking_time}
        onChange={setField('booking_time')}
        className={`${fieldBase} pl-9 pr-3`}
      />
    </Field>
  );

  const fServices = (
    <div className="min-w-0">
      <span className="block text-[11px] font-semibold text-admin-muted mb-1">Servicios</span>
      <ServicePicker
        selectedIds={form.selectedServiceIds}
        onChange={(ids) => setForm((prev) => ({ ...prev, selectedServiceIds: ids }))}
        otherText={form.otherService}
        onOtherChange={(t) => setForm((prev) => ({ ...prev, otherService: t }))}
      />
    </div>
  );

  const fEmail = (
    <Field label="Email">
      <FieldIcon icon={Mail} />
      <input
        type="email"
        value={form.client_email}
        onChange={setField('client_email')}
        placeholder="ejemplo@correo.com"
        className={inputCls}
      />
    </Field>
  );

  const fLocation = (
    <Field label="Sede">
      <FieldIcon icon={Store} />
      <select value={form.location_id} onChange={setField('location_id')} className={selectCls}>
        <option value="">Sin asignar</option>
        {locations.map((l) => (
          <option key={l.id} value={String(l.id)}>{l.name}</option>
        ))}
      </select>
    </Field>
  );

  const fStaff = (
    <Field label="Manicurista">
      <FieldIcon icon={UserCheck} />
      {staffMembers.length > 0 ? (
        <select value={form.staff_id} onChange={onStaffChange} className={selectCls}>
          <option value="">Asignar automáticamente</option>
          {staffMembers.map((m) => (
            <option key={m.id} value={String(m.id)}>{m.full_name}</option>
          ))}
        </select>
      ) : (
        <input
          list="np-staff-options"
          value={form.assigned_to}
          onChange={setField('assigned_to')}
          placeholder="Opcional"
          className={inputCls}
        />
      )}
      <datalist id="np-staff-options">
        {responsibleOptions.map((name) => <option key={name} value={name} />)}
      </datalist>
    </Field>
  );

  const fStatus = (
    <Field label="Estado">
      <FieldIcon icon={Activity} />
      <select value={form.status} onChange={setField('status')} className={selectCls}>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </Field>
  );

  const fDuration = (
    <Field label="Duración (min)">
      <FieldIcon icon={Timer} />
      <input
        type="number"
        inputMode="numeric"
        min="15"
        step="5"
        value={form.duration_minutes}
        onChange={setField('duration_minutes')}
        placeholder="30"
        className={inputCls}
      />
    </Field>
  );

  const fSource = (
    <Field label="Origen">
      <FieldIcon icon={Globe} />
      <select value={form.source} onChange={setField('source')} className={selectCls}>
        {SOURCE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </Field>
  );

  const fNotes = (
    <Field label="Notas">
      <FileText className="absolute left-3 top-3 w-4 h-4 text-admin-muted pointer-events-none" />
      <textarea
        value={form.notes}
        onChange={setField('notes')}
        placeholder="Opcional"
        className="w-full min-w-0 max-w-full pl-9 pt-2 pr-3 pb-2 min-h-[72px] rounded-xl border border-admin-border bg-white text-base sm:text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors resize-none"
      />
    </Field>
  );

  const colTitle = 'text-[11px] font-bold text-admin-muted uppercase tracking-wider';
  const btnSize = isMobile ? 'flex-1 min-w-0 h-11' : 'h-11 px-6 min-w-[120px]';

  const panel = (
    <>
      {isMobile && (
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>
      )}

      <div className="px-5 pt-3 pb-3 border-b border-admin-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-admin-text">
              {mode === 'block' ? 'Cerrar horario' : 'Nueva cita'}
            </h3>
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

        {/* Selector de modo: nueva cita o cerrar horario */}
        {onBlock && (
          <div className="mt-3 grid grid-cols-2 gap-1 p-1 bg-admin-surface rounded-xl">
            <button
              type="button"
              onClick={() => setMode('booking')}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all ${
                mode === 'booking' ? 'bg-white text-brand-rose shadow-sm' : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" /> Nueva cita
            </button>
            <button
              type="button"
              onClick={() => setMode('block')}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all ${
                mode === 'block' ? 'bg-white text-amber-600 shadow-sm' : 'text-admin-muted hover:text-admin-text'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Cerrar horario
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {mode === 'block' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Cierra este horario para que <strong>nadie</strong> pueda reservar (toda la sede). Útil para comidas, descansos o imprevistos.
              </p>
            </div>

            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Field label="Fecha">
                <FieldIcon icon={Lock} />
                <input
                  type="date"
                  value={form.booking_date}
                  onChange={setField('booking_date')}
                  className={`${fieldBase} pl-9 pr-3`}
                />
              </Field>
              <Field label="Hora de inicio">
                <FieldIcon icon={Clock} />
                <input
                  type="time"
                  value={form.booking_time}
                  onChange={setField('booking_time')}
                  className={`${fieldBase} pl-9 pr-3`}
                />
              </Field>
            </div>

            <div>
              <p className="text-xs font-bold text-admin-text mb-2">Duración del cierre</p>
              {/* 2 columnas en móvil: "Resto del día" no cabe en un cuarto de pantalla */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '30 min', value: 30 },
                  { label: '1 h', value: 60 },
                  { label: '2 h', value: 120 },
                  { label: 'Resto del día', value: 0 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBlockForm((p) => ({ ...p, duration: opt.value }))}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                      blockForm.duration === opt.value
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-admin-muted border-admin-border hover:border-amber-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Motivo">
              <FieldIcon icon={FileText} />
              <input
                value={blockForm.reason}
                onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Comida, descanso…"
                className={inputCls}
              />
            </Field>
          </div>
        ) : isMobile ? (
        /* ---------- Móvil: una columna, con "Más opciones" plegable ---------- */
        <>
        {fClientName}
        {fPhone}

        {/* Fecha y hora apiladas: los campos nativos date/time tienen un ancho
            mínimo propio y en dos columnas empujaban la pantalla hacia la
            derecha en móviles estrechos. */}
        {fDate}
        {fTime}

        {fServices}

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="w-full min-w-0 flex items-center justify-center gap-1.5 mt-1 py-2 text-xs font-bold text-brand-rose hover:bg-brand-rose-50 rounded-lg transition-colors"
        >
          {showMore ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{showMore ? 'Menos opciones' : 'Más opciones'}</span>
        </button>

        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2 border-t border-admin-border/50"
          >
            {fEmail}
            {fLocation}
            {fStaff}
            {fStatus}
            {fDuration}
            {fSource}
            {fNotes}
          </motion.div>
        )}
        </>
        ) : (
        /* ---------- Escritorio: dos columnas, todo a la vista ---------- */
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 items-start min-w-0">
          <div className="space-y-3 min-w-0">
            <p className={colTitle}>Datos de la clienta</p>
            {fClientName}
            {fPhone}
            {fEmail}
            {fLocation}
            {fStaff}
          </div>
          <div className="space-y-3 min-w-0">
            <p className={colTitle}>Detalles de la cita</p>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              {fDate}
              {fTime}
            </div>
            {fServices}
            <div className="grid grid-cols-2 gap-3 min-w-0">
              {fStatus}
              {fDuration}
            </div>
            {fSource}
            {fNotes}
          </div>
        </div>
        )}
      </div>

      {/* En móvil los botones ocupan todo el ancho (pulgar); en escritorio
          se agrupan a la derecha para no estirarse por todo el panel. */}
      <div className={`px-5 py-3 border-t border-admin-border bg-admin-bg shrink-0 flex items-center gap-2 ${isMobile ? '' : 'justify-end'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`${btnSize} rounded-xl text-sm font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors`}
        >
          Cancelar
        </button>
        {mode === 'block' ? (
          <button
            type="button"
            disabled={saving}
            onClick={handleBlock}
            className={`${btnSize} rounded-xl text-sm font-bold text-white bg-amber-500 shadow-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Cerrar horario
          </button>
        ) : (
          <button
            type="button"
            disabled={!valid || saving}
            onClick={handleSubmit}
            className={`${btnSize} rounded-xl text-sm font-bold text-white bg-gradient-rose-gold shadow-rose-sm hover:shadow-rose-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar cita
          </button>
        )}
      </div>
    </>
  );

  const spring = { type: 'spring', stiffness: 340, damping: 34 };

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

          {isMobile ? (
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-[80] bg-white rounded-t-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden"
            >
              {panel}
            </motion.div>
          ) : (
            /* En escritorio se centra con flex, no con `left-1/2 -translate-x-1/2`:
               framer-motion escribe su propio `transform` para la animación de
               escala y borraba ese translate, así que el panel aparecía medio
               fuera de la pantalla por la derecha. El contenedor con padding
               garantiza además que nunca toque los bordes ni desborde a lo alto. */
            <motion.div
              key="sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.97 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.97 }}
                transition={spring}
                className="pointer-events-auto w-full max-w-4xl max-h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              >
                {panel}
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default NewBookingSheet;
