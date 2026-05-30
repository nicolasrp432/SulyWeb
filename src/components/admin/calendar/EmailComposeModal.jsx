import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const formatDateEs = (iso) => {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  } catch {
    return iso;
  }
};

const buildTemplate = (key, booking) => {
  if (!booking) return { subject: '', body: '' };
  const name = booking.client_name || 'cliente';
  const dateStr = formatDateEs(booking.booking_date);
  const timeStr = booking.booking_time?.slice(0, 5) || '';
  const services =
    booking.services?.map((s) => s.name).filter(Boolean).join(', ') ||
    booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') ||
    'nuestros servicios';
  const salon = 'Suly Pretty Nails';

  switch (key) {
    case 'reminder':
      return {
        subject: `Recordatorio de cita — ${dateStr}`,
        body: `Hola ${name},\n\nTe recordamos tu cita en ${salon} el ${dateStr} a las ${timeStr}.\nServicios reservados: ${services}.\n\n¡Te esperamos!\n— ${salon}`,
      };
    case 'changes':
      return {
        subject: `Cambios en tu cita — ${dateStr}`,
        body: `Hola ${name},\n\nQueremos confirmarte una actualización en tu cita del ${dateStr} a las ${timeStr}.\nServicios: ${services}.\nSi tienes cualquier duda, contáctanos.\n\n— ${salon}`,
      };
    case 'thanks':
      return {
        subject: `¡Gracias por tu visita!`,
        body: `Hola ${name},\n\nMuchas gracias por elegir ${salon}. Esperamos que hayas disfrutado tu experiencia con ${services}.\n¡Te esperamos pronto!\n\n— ${salon}`,
      };
    case 'confirmation':
    default:
      return {
        subject: `Confirmación de tu cita — ${dateStr}`,
        body: `Hola ${name},\n\nTu cita en ${salon} ha sido confirmada para el ${dateStr} a las ${timeStr}.\nServicios reservados: ${services}.\n\nSi necesitas modificarla, contáctanos lo antes posible.\n\n— ${salon}`,
      };
  }
};

const TABS = [
  { value: 'confirmation', label: 'Confirmación' },
  { value: 'reminder',     label: 'Recordatorio' },
  { value: 'changes',      label: 'Cambios' },
  { value: 'thanks',       label: 'Agradecer' },
];

const EmailComposeModal = ({ open, onClose, booking }) => {
  const { toast } = useToast();
  const [tab, setTab] = useState('confirmation');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;
    const t = buildTemplate('confirmation', booking);
    setTab('confirmation');
    setSubject(t.subject);
    setBody(t.body);
  }, [open, booking]);

  const switchTab = (next) => {
    setTab(next);
    const t = buildTemplate(next, booking);
    setSubject(t.subject);
    setBody(t.body);
  };

  const canSend = useMemo(
    () => !!booking?.client_email && subject.trim() && body.trim() && !sending,
    [booking, subject, body, sending]
  );

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const services =
        booking.services?.map((s) => s.name).filter(Boolean) ||
        booking.booking_services?.map((bs) => bs.services?.name).filter(Boolean) ||
        [];
      const payload = {
        to: booking.client_email,
        subject,
        booking: {
          name: booking.client_name,
          email: booking.client_email,
          phone: booking.client_phone,
          date: booking.booking_date,
          time: booking.booking_time?.slice(0, 5),
          services,
          notes: booking.notes || '',
          customMessage: body,
          customSubject: subject,
          forCustomEmail: true,
          forUser: true,
          submissionDate: new Date().toLocaleString('es-ES'),
        },
      };

      const { error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: payload,
      });

      if (error) {
        // Fallback mailto:
        const url = `mailto:${booking.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
        toast({
          title: 'Función no disponible',
          description: 'Abrimos tu cliente de correo como alternativa.',
        });
      } else {
        toast({ title: 'Correo enviado', description: `Para ${booking.client_email}` });
      }
      onClose?.();
    } catch (err) {
      console.error('Error enviando email:', err);
      toast({ variant: 'destructive', title: 'Error al enviar', description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-md rounded-2xl border border-admin-border bg-white shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-admin-text flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-rose" /> Enviar correo al cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-admin-muted">
            Selecciona una plantilla o personaliza el mensaje antes de enviarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => switchTab(t.value)}
                className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  tab === t.value
                    ? 'bg-gradient-rose-gold text-white border-transparent shadow-rose-xs scale-105'
                    : 'bg-admin-bg text-admin-muted border-admin-border hover:bg-admin-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-admin-text">Para</Label>
            <Input
              value={booking?.client_email || ''}
              disabled
              placeholder="El cliente no tiene email"
              className="h-9 text-xs bg-admin-bg placeholder:italic placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-admin-text">Asunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs placeholder:italic placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-admin-text">Mensaje</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[140px] border border-admin-border rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-rose focus:border-brand-rose outline-none resize-none text-gray-700 bg-gray-50/50 placeholder:italic placeholder:text-gray-400"
              placeholder="Escribe tu mensaje..."
            />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2 border-t border-admin-border/30 pt-3">
          <Button variant="outline" className="h-9" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-gradient-rose-gold text-white font-bold h-9 shadow-sm disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Mail className="w-4 h-4 mr-1.5" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposeModal;
