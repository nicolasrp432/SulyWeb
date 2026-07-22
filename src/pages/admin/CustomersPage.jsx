import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Search, ChevronRight, Users, MessageCircle, Phone, Mail, UserPlus, Repeat, Trash2,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import StatsCard from '@/components/admin/StatsCard';
import EmptyState from '@/components/admin/EmptyState';
import { getInitials } from '@/lib/avatar';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

const CustomersPage = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    // Clientas (no borradas) + agregados de citas para conteo/última visita.
    const [{ data: custs, error }, { data: bks }] = await Promise.all([
      supabase.from('customers').select('*').is('deleted_at', null),
      supabase.from('bookings').select('customer_id, booking_date, status'),
    ]);
    if (error) { setLoading(false); return; }

    const agg = {};
    (bks ?? []).forEach((b) => {
      if (!b.customer_id) return;
      const a = agg[b.customer_id] || (agg[b.customer_id] = { count: 0, visits: 0, lastDate: null });
      a.count += 1;
      if (b.status === 'completed') a.visits += 1;
      if (!a.lastDate || b.booking_date > a.lastDate) a.lastDate = b.booking_date;
    });

    const rows = (custs ?? []).map((c) => ({
      ...c,
      count: agg[c.id]?.count ?? 0,
      visits: agg[c.id]?.visits ?? 0,
      lastDate: agg[c.id]?.lastDate ?? null,
    })).sort((a, b) => (b.count - a.count) || (a.full_name || '').localeCompare(b.full_name || ''));

    setCustomers(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
    const channel = supabase
      .channel('customers-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchCustomers)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchCustomers]);

  const softDelete = async (customer) => {
    if (!window.confirm(`¿Ocultar a ${customer.full_name || 'esta clienta'} de la lista? Sus citas se conservan; podrás recuperarla desde la base de datos.`)) return;
    const { error } = await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', customer.id);
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo eliminar', description: error.message });
      return;
    }
    toast({ title: 'Clienta ocultada', description: 'Sus citas se han conservado.' });
    fetchCustomers();
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.phone_display || '').includes(search)
      || (c.phone_normalized || '').includes(search.replace(/\D/g, ''));
  });

  const stats = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const newCount = customers.filter((c) => c.created_at && c.created_at.slice(0, 10) >= thirtyDaysAgo).length;
    const recurring = customers.filter((c) => c.count >= 3).length;
    return { total: customers.length, newCount, recurring };
  }, [customers]);

  const whatsappTo = (e, phone, name) => {
    e.preventDefault(); e.stopPropagation();
    if (!phone) return;
    let p = phone.replace(/\D/g, '');
    if (!p.startsWith('34') && p.length === 9) p = '34' + p;
    const msg = `¡Hola ${name || ''}! Te escribimos de Suly Pretty Nails.`;
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      <Helmet><title>Clientas — Admin Suly</title></Helmet>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          icon={Users}
          title="Clientas"
          subtitle={`${customers.length} clientas`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard title="Total"       value={stats.total}     icon={Users}    color="rose"    loading={loading} />
          <StatsCard title="Nuevas 30d"  value={stats.newCount}  icon={UserPlus} color="blue"    loading={loading} />
          <StatsCard title="Recurrentes" value={stats.recurring} icon={Repeat}   color="emerald" loading={loading} hint="≥ 3 citas" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className={inputCls}
          />
        </div>

        <div className="bg-white border border-admin-border rounded-2xl overflow-hidden shadow-rose-xs">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-admin-surface animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay clientas"
              description="Las clientas aparecerán aquí cuando registren su primera cita."
            />
          ) : (
            <div className="divide-y divide-admin-border">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/clientes/${c.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-admin-surface/30 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                    {getInitials(c.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-admin-text truncate">{c.full_name || 'Sin nombre'}</p>
                    <p className="text-[11px] text-admin-muted truncate">{c.phone_display || c.email || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-rose">{c.count}</p>
                    <p className="text-[10px] text-admin-muted">{c.count === 1 ? 'cita' : 'citas'}</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block w-16">
                    <p className="text-[10px] text-admin-muted">Última</p>
                    <p className="text-[11px] font-medium text-admin-text">
                      {c.lastDate ? format(parseISO(c.lastDate), 'd MMM yy', { locale: es }) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.phone_display && (
                      <button
                        onClick={(e) => whatsappTo(e, c.phone_display, c.full_name)}
                        title="WhatsApp"
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); softDelete(c); }}
                      title="Ocultar clienta (conserva sus citas)"
                      className="p-2 rounded-lg text-admin-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-admin-muted group-hover:text-brand-rose transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersPage;
