import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((booking) => {
    const n = {
      id: booking.id,
      message: `Nueva cita: ${booking.client_name}`,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      booking,
    };
    setNotifications((prev) => [n, ...prev].slice(0, 50));
    setUnreadCount((c) => c + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
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

  return { notifications, unreadCount, markAllRead };
};
