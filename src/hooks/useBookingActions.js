import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { sendBookingConfirmationToUser } from '@/lib/emailService';

/**
 * Hook con todas las acciones operativas sobre una booking:
 * confirm / complete / cancel / call / move / resize / wa.
 *
 * Cada acción persiste en Supabase y dispara un refetch (callback opcional).
 *
 * @param {{ locations?: Array, onChange?: () => void, openWa?: (booking) => void, openEmail?: (booking) => void }} options
 */
export function useBookingActions({ locations = [], onChange, openWa, openEmail } = {}) {
  const { toast } = useToast();

  const updateStatus = useCallback(async (bookingId, status) => {
    if (!bookingId) return false;
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo cambiar el estado', description: error.message });
      return false;
    }
    onChange?.();
    return true;
  }, [toast, onChange]);

  const confirmBooking = useCallback(async (booking) => {
    if (!booking?.id) return;
    const ok = await updateStatus(booking.id, 'confirmed');
    if (!ok) return;
    if (booking.client_email) {
      try {
        const services =
          booking.services?.map((s) => ({ name: s.name, price: s.price })) ||
          booking.booking_services?.map((bs) => ({
            name: bs.services?.name,
            price: bs.services?.price,
          })).filter((s) => s.name) ||
          [];
        const location = locations.find((l) => String(l.id) === String(booking.location_id));
        await sendBookingConfirmationToUser(
          {
            name: booking.client_name,
            email: booking.client_email,
            phone: booking.client_phone,
            date: booking.booking_date,
            time: booking.booking_time?.slice(0, 5),
            notes: booking.notes || '',
          },
          services,
          location
        );
        toast({ title: 'Cita confirmada', description: 'Correo de confirmación enviado.' });
      } catch (e) {
        console.error('Error enviando email:', e);
        toast({ title: 'Cita confirmada', description: 'Estado actualizado (correo no enviado).' });
      }
    } else {
      toast({ title: 'Cita confirmada' });
    }
  }, [updateStatus, locations, toast]);

  const completeBooking = useCallback(async (booking) => {
    if (!booking?.id) return;
    const ok = await updateStatus(booking.id, 'completed');
    if (ok) toast({ title: 'Cita completada' });
  }, [updateStatus, toast]);

  const cancelBooking = useCallback(async (booking) => {
    if (!booking?.id) return;
    const ok = await updateStatus(booking.id, 'cancelled');
    if (ok) toast({ title: 'Cita cancelada' });
  }, [updateStatus, toast]);

  const noShowBooking = useCallback(async (booking) => {
    if (!booking?.id) return;
    const ok = await updateStatus(booking.id, 'no_show');
    if (ok) toast({ title: 'Marcada como «No asistió»' });
  }, [updateStatus, toast]);

  const callBooking = useCallback((booking) => {
    if (!booking?.client_phone) return;
    window.location.href = `tel:${booking.client_phone.replace(/\s+/g, '')}`;
  }, []);

  const moveBooking = useCallback(async (bookingId, newTime) => {
    if (!bookingId || !newTime) return;
    const ttime = newTime.length === 5 ? newTime + ':00' : newTime;
    const { error } = await supabase
      .from('bookings')
      .update({ booking_time: ttime })
      .eq('id', bookingId);
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo mover la cita', description: error.message });
      return;
    }
    toast({ title: 'Cita movida', description: `Nueva hora: ${newTime.slice(0, 5)}` });
    onChange?.();
  }, [toast, onChange]);

  const resizeBooking = useCallback(async (bookingId, newDuration) => {
    if (!bookingId || !newDuration) return;
    const { error } = await supabase
      .from('bookings')
      .update({ duration_minutes: newDuration })
      .eq('id', bookingId);
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo cambiar la duración', description: error.message });
      return;
    }
    toast({ title: 'Duración actualizada', description: `${newDuration} min` });
    onChange?.();
  }, [toast, onChange]);

  /**
   * Guarda los cambios editados en el diálogo de detalle de una cita.
   * Persiste los campos del formulario y sincroniza booking_services.
   *
   * Reglas importantes:
   * - `location_id` es uuid: se pasa tal cual (NUNCA Number(), daría NaN).
   * - No toca los campos de sync (sync_origin/sync_hash/google_event_id/ics_uid):
   *   el trigger notify_gcal_push replica el cambio a Google Calendar solo.
   * - No toca `status`: eso va por confirmar/completar/cancelar.
   *
   * @returns {Promise<boolean>} true si se guardó correctamente.
   */
  const saveBookingEdits = useCallback(async (bookingId, formData) => {
    if (!bookingId) return false;
    try {
      const updatePayload = {
        client_name: formData.client_name?.trim() || null,
        client_phone: formData.client_phone?.trim() || '',
        client_email: formData.client_email?.trim() || null,
        location_id: formData.location_id || null,
        booking_date: formData.booking_date || null,
        booking_time: formData.booking_time
          ? (formData.booking_time.length === 5 ? formData.booking_time + ':00' : formData.booking_time)
          : null,
        appointment_type: formData.appointment_type?.trim() || null,
        notes: formData.notes || null,
        notes_admin: formData.internal_notes || null,
        assigned_to: formData.assigned_to || null,
        duration_minutes: Number(formData.duration_minutes) || 30,
        origin: formData.source || 'admin',
        // Solo se escribe el estado si el formulario lo trae (el diálogo sí).
        ...(formData.status ? { status: formData.status } : {}),
      };

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);
      if (updateError) throw updateError;

      // Sincroniza booking_services si se pasó la lista.
      if (Array.isArray(formData.selectedServiceIds)) {
        await supabase.from('booking_services').delete().eq('booking_id', bookingId);
        if (formData.selectedServiceIds.length > 0) {
          const rows = formData.selectedServiceIds.map((sid) => ({
            booking_id: bookingId,
            service_id: sid,
          }));
          const { error: bsError } = await supabase.from('booking_services').insert(rows);
          if (bsError) throw bsError;
        }
      }

      toast({ title: 'Cambios guardados' });
      onChange?.();
      return true;
    } catch (e) {
      toast({ variant: 'destructive', title: 'No se pudo guardar', description: e.message });
      return false;
    }
  }, [toast, onChange]);

  const waBooking = useCallback((booking) => openWa?.(booking), [openWa]);
  const emailBooking = useCallback((booking) => openEmail?.(booking), [openEmail]);

  const deleteBooking = useCallback(async (booking) => {
    if (!booking?.id) return false;
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente la cita de ${booking.client_name}? Esta acción no se puede deshacer.`)) return false;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la cita',
        description: error.message
      });
      return false;
    }

    toast({ title: 'Cita eliminada', description: 'La cita ha sido eliminada de la base de datos.' });
    onChange?.();
    return true;
  }, [toast, onChange]);

  return {
    confirmBooking,
    completeBooking,
    cancelBooking,
    noShowBooking,
    callBooking,
    moveBooking,
    resizeBooking,
    saveBookingEdits,
    waBooking,
    emailBooking,
    deleteBooking,
  };
}
