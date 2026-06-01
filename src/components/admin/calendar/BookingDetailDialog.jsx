import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity, Calendar as CalendarIcon, Check, CheckCheck, ChevronDown, ChevronUp,
  Clock, FileText, Globe, Loader2, Mail, MessageCircle, Phone, Store,
  Timer, User, UserCheck, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import ServicePicker from './ServicePicker';

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pendiente' },
  { value: 'confirmed',   label: 'Confirmada' },
  { value: 'rescheduled', label: 'Reprogramada' },
  { value: 'cancelled',   label: 'Cancelada' },
  { value: 'completed',   label: 'Completada' },
  { value: 'no_show',     label: 'No asistió' },
];

const SOURCE_OPTIONS = [
  { value: 'online',     label: 'Online (web)' },
  { value: 'whatsapp',   label: 'WhatsApp' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'admin',      label: 'Admin' },
];

const STATUS_CHIP = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled:   'bg-rose-100 text-rose-800 border-rose-200',
  completed:   'bg-blue-100 text-blue-800 border-blue-200',
  no_show:     'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
};

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text font-medium placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';
const selectCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text font-medium focus:outline-none focus:border-brand-rose transition-colors';

const FieldIcon = ({ icon: Icon }) => (
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
);

const BookingDetailDialog = ({
  open,
  onClose,
  booking,
  locations = [],
  responsibleOptions = [],
  onConfirm,
  onComplete,
  onCancel,
  onOpenWa,
  onOpenEmail,
  onSave,
}) => {
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    location_id: '',
    booking_date: '',
    booking_time: '',
    appointment_type: '',
    notes: '',
    assigned_to: '',
    duration_minutes: 30,
    source: 'admin',
    internal_notes: '',
    selectedServiceIds: [],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClientData, setShowClientData] = useState(true);
  const [showBookingData, setShowBookingData] = useState(true);

  useEffect(() => {
    if (!open || !booking) return;
    setForm({
      client_name: booking.client_name || '',
      client_phone: booking.client_phone || '',
      client_email: booking.client_email || '',
      location_id: booking.location_id ? String(booking.location_id) : '',
      booking_date: booking.booking_date || '',
      booking_time: booking.booking_time?.slice(0, 5) || '',
      appointment_type: booking.meta?.appointment_type || booking.appointment_type || '',
      notes: booking.notes || '',
      assigned_to: booking.meta?.assigned_to || booking.assigned_to || '',
      duration_minutes: booking.meta?.duration_minutes || booking.duration_minutes || 30,
      source: booking.meta?.source || booking.origin || 'admin',
      internal_notes: booking.meta?.internal_notes || booking.notes_admin || '',
      selectedServiceIds:
        booking.services?.map((s) => s.id) ||
        booking.booking_services?.map((bs) => bs.services?.id).filter(Boolean) ||
        [],
    });
    setShowAdvanced(false);
    setShowClientData(true);
    setShowBookingData(true);
  }, [open, booking]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const status = booking?.meta?.status || booking?.status || 'pending';
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label || 'Pendiente';
  const chipCls = STATUS_CHIP[status] || STATUS_CHIP.pending;

  const headerSubtitle = useMemo(() => {
    if (!booking?.booking_date) return '';
    try {
      const d = format(new Date(`${booking.booking_date}T00:00:00`), "EEE d MMM", { locale: es });
      return `${d} · ${booking.booking_time?.slice(0, 5)} · ${booking.meta?.duration_minutes || booking.duration_minutes || 30} min`;
    } catch {
      return '';
    }
  }, [booking]);

  const handleSave = async () => {
    if (!booking || !onSave) return;
    setSaving(true);
    try {
      await onSave(booking.id, form);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = async () => {
    if (!booking) return;
    if (!window.confirm(`¿Cancelar la cita de ${booking.client_name || 'este cliente'}?`)) return;
    await onCancel?.(booking);
  };

  const handleConfirmClick = async () => onConfirm?.(booking);
  const handleCompleteClick = async () => onComplete?.(booking);
  const handleWaClick = () => onOpenWa?.(booking);
  const handleEmailClick = () => onOpenEmail?.(booking);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-xl p-0 sm:max-w-xl pb-6 sm:pb-0 overflow-y-auto sm:overflow-visible">
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-gray-300/70 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-brand-rose-50 via-white to-amber-50 px-5 pt-3 sm:pt-5 pb-4 pr-14 border-b border-admin-border">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-base font-bold shadow-rose-sm shrink-0">
              {getInitials(form.client_name || booking?.client_name)}
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-lg font-bold text-admin-text leading-tight truncate">
                  {form.client_name || booking?.client_name || 'Cliente'}
                </DialogTitle>
                <DialogDescription className="text-xs text-admin-muted mt-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3" />
                  <span className="capitalize">{headerSubtitle}</span>
                </DialogDescription>
              </DialogHeader>
              <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${chipCls}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Collapsible Client Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowClientData(!showClientData)}
              className="w-full flex items-center justify-between font-bold text-admin-text text-left pb-1 border-b border-admin-border/30 mb-2 transition-all hover:opacity-80"
            >
              <span className="text-[11px] uppercase tracking-wider">Datos del cliente</span>
              {showClientData ? <ChevronUp className="w-3.5 h-3.5 text-brand-rose" /> : <ChevronDown className="w-3.5 h-3.5 text-admin-muted" />}
            </button>
            {showClientData && (
              <div className="space-y-2 pt-1">
                <div className="relative">
                  <FieldIcon icon={User} />
                  <input value={form.client_name} onChange={setField('client_name')} placeholder="Nombre del cliente" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <FieldIcon icon={Phone} />
                    <input value={form.client_phone} onChange={setField('client_phone')} placeholder="Teléfono" className={inputCls} />
                  </div>
                  <div className="relative">
                    <FieldIcon icon={Mail} />
                    <input type="email" value={form.client_email} onChange={setField('client_email')} placeholder="Email (opcional)" className={inputCls} />
                  </div>
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
              </div>
            )}
          </div>

          {/* Collapsible Appointment Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowBookingData(!showBookingData)}
              className="w-full flex items-center justify-between font-bold text-admin-text text-left pb-1 border-b border-admin-border/30 mb-2 transition-all hover:opacity-80"
            >
              <span className="text-[11px] uppercase tracking-wider">Detalles de la cita</span>
              {showBookingData ? <ChevronUp className="w-3.5 h-3.5 text-brand-rose" /> : <ChevronDown className="w-3.5 h-3.5 text-admin-muted" />}
            </button>
            {showBookingData && (
              <div className="space-y-2 pt-1">
                {/* Date and Time: Stacks on mobile with vertical margins, side-by-side on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                  <div className="relative">
                    <FieldIcon icon={CalendarIcon} />
                    <input type="date" value={form.booking_date} onChange={setField('booking_date')} className={`${inputCls} text-xs sm:text-sm px-2`} />
                  </div>
                  <div className="relative">
                    <FieldIcon icon={Clock} />
                    <input type="time" value={form.booking_time} onChange={setField('booking_time')} className={`${inputCls} text-xs sm:text-sm px-2`} />
                  </div>
                </div>
                <ServicePicker
                  selectedIds={form.selectedServiceIds}
                  onChange={(ids) => setForm((prev) => ({ ...prev, selectedServiceIds: ids }))}
                  otherText={form.appointment_type}
                  onOtherChange={(t) => setForm((prev) => ({ ...prev, appointment_type: t }))}
                />
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-admin-muted pointer-events-none" />
                  <textarea
                    value={form.notes}
                    onChange={setField('notes')}
                    placeholder="Notas del cliente (opcional)"
                    className="w-full pl-9 pt-2 pr-3 pb-2 min-h-[60px] rounded-xl border border-admin-border bg-white text-sm text-admin-text font-medium placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick action bar - Located under client and appointment details for mobile ergonomic ease */}
          <div className="pt-2 border-t border-admin-border/30">
            <p className="text-[11px] font-bold text-admin-text uppercase tracking-wider mb-2">Acciones rápidas</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={handleConfirmClick}
                disabled={status === 'confirmed'}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Confirmar
              </Button>
              <Button
                size="sm"
                className="h-9 text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-rose-sm hover:shadow-rose-md"
                onClick={handleCompleteClick}
                disabled={status === 'completed'}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Completar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={handleCancelClick}
                disabled={status === 'cancelled'}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-bold border-green-200 text-green-700 hover:bg-green-50"
                onClick={handleWaClick}
                disabled={!form.client_phone}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
              </Button>
              <a
                href={form.client_phone ? `tel:${form.client_phone.replace(/\s+/g, '')}` : undefined}
                className={!form.client_phone ? 'pointer-events-none opacity-50' : ''}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-bold w-full border-admin-border text-admin-text hover:bg-admin-surface"
                  disabled={!form.client_phone}
                >
                  <Phone className="w-3.5 h-3.5 mr-1" /> Llamar
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={handleEmailClick}
                disabled={!form.client_email}
              >
                <Mail className="w-3.5 h-3.5 mr-1" /> Email
              </Button>
            </div>
          </div>

          <div className="pt-1 border-t border-admin-border/30">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-brand-rose hover:bg-brand-rose-50 rounded-lg transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAdvanced ? 'Menos opciones' : 'Más opciones (especialista, estado, notas internas...)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-2 pt-1 border-t border-admin-border/30">
              <div className="relative">
                <FieldIcon icon={UserCheck} />
                <input
                  list="bdd-staff-options"
                  value={form.assigned_to}
                  onChange={setField('assigned_to')}
                  placeholder="Especialista responsable"
                  className={inputCls}
                />
                <datalist id="bdd-staff-options">
                  {responsibleOptions.map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <FieldIcon icon={Activity} />
                  <select value={status} disabled className={`${selectCls} opacity-70`}>
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
                    placeholder="Duración (min)"
                    className={inputCls}
                  />
                </div>
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
                  value={form.internal_notes}
                  onChange={setField('internal_notes')}
                  placeholder="Notas internas (privadas)"
                  className="w-full pl-9 pt-2 pr-3 pb-2 min-h-[60px] rounded-xl border border-admin-border bg-white text-sm text-admin-text font-medium placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-admin-border bg-admin-bg gap-2">
          <Button variant="outline" className="h-9 flex-1" onClick={onClose}>Cerrar</Button>
          <Button
            className="h-9 flex-1 bg-gradient-rose-gold text-white font-bold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailDialog;
