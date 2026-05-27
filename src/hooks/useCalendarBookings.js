import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const useCalendarBookings = (date, view, locationId) => {
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    let start, end;
    if (view === 'month') {
      start = format(startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      end   = format(endOfWeek(endOfMonth(date),   { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (view === 'week') {
      start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      end   = format(endOfWeek(date,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else {
      start = format(date, 'yyyy-MM-dd');
      end   = format(date, 'yyyy-MM-dd');
    }

    setLoading(true);

    let bookingQuery = supabase
      .from('bookings')
      .select(`
        id, booking_date, booking_time, client_name, client_phone, client_email, notes,
        status, origin, notes_admin, created_at,
        locations(id, name),
        booking_services(service_id, services(id, name))
      `)
      .gte('booking_date', start)
      .lte('booking_date', end)
      .order('booking_date')
      .order('booking_time');

    if (locationId) bookingQuery = bookingQuery.eq('location_id', locationId);

    let blockQuery = supabase
      .from('schedule_blocks')
      .select('*, locations(name)')
      .gte('block_date', start)
      .lte('block_date', end);

    if (locationId) blockQuery = blockQuery.or(`location_id.eq.${locationId},location_id.is.null`);

    const [{ data: bookingData }, { data: blockData }] = await Promise.all([bookingQuery, blockQuery]);

    setBookings(bookingData ?? []);
    setBlocks(blockData ?? []);
    setLoading(false);
  }, [date, view, locationId]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { bookings, blocks, loading, refetch: fetchAll };
};
