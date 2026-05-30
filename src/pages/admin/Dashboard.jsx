import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays, Clock, AlertCircle, CheckCircle, Plus, CalendarRange,
  Scissors, Image as ImageIcon, LayoutDashboard,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import RecentBookings from '@/components/admin/RecentBookings';
import PageHeader from '@/components/admin/PageHeader';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const greetingFor = (hour) => {
  if (hour < 5) return 'Buenas noches';
  if (hour < 13) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const QuickAction = ({ to, icon: Icon, label, color = 'rose' }) => {
  const colorCls = {
    rose:    'from-brand-rose to-rose-500',
    amber:   'from-amber-500 to-orange-500',
    emerald: 'from-emerald-500 to-teal-500',
    blue:    'from-blue-500 to-indigo-500',
  }[color];
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${colorCls} text-white shadow-rose-sm hover:shadow-rose-md transition-all hover:-translate-y-0.5`}
    >
      <Icon className="w-5 h-5 mb-2 opacity-90" />
      <p className="text-xs font-bold uppercase tracking-wider opacity-90">{label}</p>
      <span className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full" />
    </Link>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, weeklyData, loading } = useAdminStats();
  const now = useMemo(() => new Date(), []);
  const greeting = greetingFor(now.getHours());
  const userName = user?.email?.split('@')[0]?.split('.')[0] || 'Admin';

  return (
    <>
      <Helmet><title>Dashboard — Admin Suly</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">

        {/* Welcome card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-rose-50 via-white to-amber-50 border border-admin-border p-5 sm:p-6 shadow-rose-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
            <div className="min-w-0">
              <p className="text-xs font-bold text-admin-muted uppercase tracking-wider">
                {format(now, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-admin-text mt-1 capitalize">
                {greeting}, {userName} 🌸
              </h1>
              <p className="text-sm text-admin-muted mt-1">Resumen del salón Suly Pretty Nails</p>
            </div>
            <Link
              to="/admin/calendario"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Nueva cita
            </Link>
          </div>
          <LayoutDashboard className="absolute -right-4 -bottom-4 w-32 h-32 text-brand-rose/5" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title="Citas hoy"    value={stats.today}     icon={CalendarDays} color="rose"    loading={loading} />
          <StatsCard title="Esta semana"  value={stats.week}      icon={Clock}        color="blue"    loading={loading} />
          <StatsCard title="Pendientes"   value={stats.pending}   icon={AlertCircle}  color="amber"   loading={loading} />
          <StatsCard title="Completadas"  value={stats.completed} icon={CheckCircle}  color="emerald" loading={loading} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction to="/admin/calendario" icon={CalendarRange} label="Calendario"  color="rose" />
          <QuickAction to="/admin/citas"      icon={CalendarDays}  label="Ver citas"   color="blue" />
          <QuickAction to="/admin/servicios"  icon={Scissors}      label="Servicios"   color="amber" />
          <QuickAction to="/admin/galeria"    icon={ImageIcon}     label="Galería"     color="emerald" />
        </div>

        {/* Chart + Recent */}
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white border border-admin-border rounded-2xl p-5 shadow-rose-xs">
            <h3 className="font-bold text-admin-text text-sm mb-4">Citas — últimos 7 días</h3>
            {loading ? (
              <div className="h-48 rounded-xl bg-admin-surface animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={28}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #ffd6e7',
                      borderRadius: 12,
                      color: '#1e1e2e',
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(233, 30, 99, 0.08)',
                    }}
                    cursor={{ fill: 'rgba(233, 30, 99, 0.06)' }}
                  />
                  <Bar dataKey="citas" radius={[8, 8, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill={i === weeklyData.length - 1 ? '#e91e63' : '#f8b4c4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-2">
            <RecentBookings />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
