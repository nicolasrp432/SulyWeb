import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const VALID_ORIGINS = new Set(['online', 'whatsapp']);

const enrichBooking = async (bookingRow) => {
  let location = null;
  if (bookingRow?.location_id) {
    const { data } = await supabase
      .from('locations')
      .select('id, name')
      .eq('id', bookingRow.location_id)
      .maybeSingle();
    location = data || null;
  }
  return { ...bookingRow, location };
};

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(async (rawBooking) => {
    const origin = rawBooking?.origin;
    if (!origin || !VALID_ORIGINS.has(origin)) return;

    const enriched = await enrichBooking(rawBooking);
    const n = {
      id: enriched.id,
      bookingId: enriched.id,
      message: `Nueva cita — ${enriched.client_name || 'Cliente'}`,
      origin,
      bookingDate: enriched.booking_date,
      bookingTime: enriched.booking_time?.slice(0, 5),
      clientName: enriched.client_name,
      clientPhone: enriched.client_phone,
      locationName: enriched.location?.name || '',
      createdAt: Date.now(),
      read: false,
      raw: enriched,
    };

    setNotifications((prev) => {
      if (prev.some((x) => x.bookingId === n.bookingId)) return prev;
      return [n, ...prev].slice(0, 50);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-new-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => addNotification(payload.new)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAllRead,
    markOneRead,
    removeNotification,
    clearAll,
  };
};
