import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const useAdminStats = () => {
  const [stats, setStats] = useState({ today: 0, week: 0, pending: 0, completed: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const sevenDaysAgo = format(subDays(today, 6), 'yyyy-MM-dd');

      const [todayRes, weekRes, pendingRes, completedRes, recentRes, weeklyRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', todayStr),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('booking_date', weekStart).lte('booking_date', weekEnd),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('id, client_name, booking_date, booking_time, status, origin, locations(name)').order('created_at', { ascending: false }).limit(8),
        supabase.from('bookings').select('booking_date').gte('booking_date', sevenDaysAgo).lte('booking_date', todayStr),
      ]);

      setStats({
        today: todayRes.count ?? 0,
        week: weekRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        completed: completedRes.count ?? 0,
      });
      setRecentBookings(recentRes.data ?? []);

      const dayCounts = {};
      (weeklyRes.data ?? []).forEach((b) => {
        dayCounts[b.booking_date] = (dayCounts[b.booking_date] ?? 0) + 1;
      });
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        const key = format(d, 'yyyy-MM-dd');
        days.push({ day: format(d, 'EEE', { locale: es }), citas: dayCounts[key] ?? 0 });
      }
      setWeeklyData(days);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return { stats, weeklyData, recentBookings, loading };
};
