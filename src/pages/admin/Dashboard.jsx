import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import RecentBookings from '@/components/admin/RecentBookings';
import { useAdminStats } from '@/hooks/useAdminStats';

const Dashboard = () => {
  const { stats, weeklyData, recentBookings, loading } = useAdminStats();

  return (
    <>
      <Helmet><title>Dashboard — Admin Suly</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-admin-text">Dashboard</h1>
          <p className="text-sm text-admin-muted mt-0.5">Resumen del salón</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Citas hoy"    value={stats.today}     icon={CalendarDays} color="rose"    loading={loading} />
          <StatsCard title="Esta semana"  value={stats.week}      icon={Clock}        color="blue"    loading={loading} />
          <StatsCard title="Pendientes"   value={stats.pending}   icon={AlertCircle}  color="amber"   loading={loading} />
          <StatsCard title="Completadas"  value={stats.completed} icon={CheckCircle}  color="emerald" loading={loading} />
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-admin-sidebar border border-admin-surface rounded-2xl p-5">
            <h3 className="font-semibold text-admin-text text-sm mb-4">Citas — últimos 7 días</h3>
            {loading ? (
              <div className="h-48 rounded-xl bg-admin-surface animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} barSize={24}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      color: '#f1f5f9',
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="citas" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill={i === weeklyData.length - 1 ? '#e91e63' : '#334155'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-2">
            <RecentBookings bookings={recentBookings} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
