import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const VALID_ORIGINS = new Set(['online', 'whatsapp']);

const playPingSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Premium bell tone (A5 decay)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

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

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, client_name, client_phone, client_email, booking_date, booking_time, origin, location_id, created_at,
          locations(name)
        `)
        .in('origin', ['online', 'whatsapp'])
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      if (!data) return;

      // Load read IDs from localStorage
      let readIds = [];
      try {
        const stored = localStorage.getItem('suly_read_notifications');
        readIds = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn(e);
      }
      const readSet = new Set(readIds);

      const items = data.map((b) => {
        const locationName = b.locations?.name || '';
        return {
          id: b.id,
          bookingId: b.id,
          message: `Nueva cita — ${b.client_name || 'Cliente'}`,
          origin: b.origin,
          bookingDate: b.booking_date,
          bookingTime: b.booking_time?.slice(0, 5),
          clientName: b.client_name,
          clientPhone: b.client_phone,
          locationName,
          createdAt: b.created_at ? new Date(b.created_at).getTime() : Date.now(),
          read: readSet.has(b.id),
          raw: b,
        };
      });

      setNotifications(items);
    } catch (e) {
      console.error('Error fetching recent notifications:', e);
    }
  }, []);

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
      createdAt: enriched.created_at ? new Date(enriched.created_at).getTime() : Date.now(),
      read: false,
      raw: enriched,
    };

    setNotifications((prev) => {
      if (prev.some((x) => x.bookingId === n.bookingId)) return prev;
      
      // Play ping sound on real-time new booking
      playPingSound();
      
      return [n, ...prev].slice(0, 50);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      // Save all to localStorage
      try {
        const stored = localStorage.getItem('suly_read_notifications');
        const readIds = stored ? JSON.parse(stored) : [];
        prev.forEach((n) => {
          if (!readIds.includes(n.id)) readIds.push(n.id);
        });
        localStorage.setItem('suly_read_notifications', JSON.stringify(readIds.slice(-200)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      // Save to localStorage
      try {
        const stored = localStorage.getItem('suly_read_notifications');
        const readIds = stored ? JSON.parse(stored) : [];
        if (!readIds.includes(id)) {
          readIds.push(id);
          localStorage.setItem('suly_read_notifications', JSON.stringify(readIds.slice(-200)));
        }
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fetch recent notifications on mount
  useEffect(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

  // Subscribe to real-time changes
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
