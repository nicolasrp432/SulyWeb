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
    callBooking,
    moveBooking,
    resizeBooking,
    waBooking,
    emailBooking,
    deleteBooking,
  };
}
