import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, ChevronDown, Users, MessageCircle, Phone, Mail, UserPlus, Repeat, Trash2,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import StatsCard from '@/components/admin/StatsCard';
import { STATUS_CHIP, STATUS_LABEL } from '@/components/admin/calendar/statusStyles';
import { getInitials } from '@/lib/avatar';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

const CustomersPage = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [historyCache, setHistoryCache] = useState({});

  const deleteCustomer = async (customer) => {
    const confirmMsg = `¿Seguro que deseas eliminar permanentemente a ${customer.name}? Se eliminarán todas sus citas (${customer.count}) del sistema. Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      let query = supabase.from('bookings').delete();
      if (customer.email) {
        query = query.eq('client_email', customer.email);
      } else if (customer.phone) {
        query = query.eq('client_phone', customer.phone);
      } else {
        query = query.eq('client_name', customer.name).is('client_email', null).is('client_phone', null);
      }

      const { error } = await query;
      if (error) throw error;

      toast({
        title: 'Cliente eliminado',
        description: `Se han eliminado a ${customer.name} y todas sus citas con éxito.`
      });

      const key = customer.email || customer.phone;
      if (expanded === key) {
        setExpanded(null);
      }

      fetchCustomers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar al cliente',
        description: error.message
      });
    }
  };

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('client_name, client_email, client_phone, booking_date, created_at')
      .order('booking_date', { ascending: false });

    if (!data) { setLoading(false); return; }

    const map = {};
    data.forEach((b) => {
      const key = b.client_email || b.client_phone || b.client_name;
      if (!map[key]) {
        map[key] = {
          name: b.client_name,
          email: b.client_email,
          phone: b.client_phone,
          count: 0,
          lastDate: b.booking_date,
          firstCreated: b.created_at,
        };
      }
      map[key].count++;
      if (b.booking_date > (map[key].lastDate ?? '')) map[key].lastDate = b.booking_date;
      if (b.created_at && b.created_at < (map[key].firstCreated ?? '9999')) map[key].firstCreated = b.created_at;
    });

    setCustomers(Object.values(map).sort((a, b) => b.count - a.count));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
    const channel = supabase
      .channel('customers-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchCustomers)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchCustomers]);

  const loadHistory = async (customer) => {
    const key = customer.email || customer.phone;
    if (historyCache[key] !== undefined) return;
    setHistoryCache((prev) => ({ ...prev, [key]: null }));

    let query = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, locations(name), booking_services(services(name))')
      .order('booking_date', { ascending: false })
      .limit(20);
    if (customer.email) query = query.eq('client_email', customer.email);
    else if (customer.phone) query = query.eq('client_phone', customer.phone);

    const { data } = await query;
    setHistoryCache((prev) => ({ ...prev, [key]: data ?? [] }));
  };

  const filtered = customers.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const stats = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const newCount = customers.filter((c) => c.firstCreated && c.firstCreated.slice(0, 10) >= thirtyDaysAgo).length;
    const recurring = customers.filter((c) => c.count >= 3).length;
    return { total: customers.length, newCount, recurring };
  }, [customers]);

  const callTo = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };
  const whatsappTo = (phone, name) => {
    if (!phone) return;
    let p = phone.replace(/\D/g, '');
    if (!p.startsWith('34') && p.length === 9) p = '34' + p;
    const msg = `¡Hola ${name || ''}! Te escribimos de Suly Pretty Nails.`;
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const emailTo = (email) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  return (
    <>
      <Helmet><title>Clientes — Admin Suly</title></Helmet>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          icon={Users}
          title="Clientes"
          subtitle={`${customers.length} clientes únicos`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard title="Total"      value={stats.total}     icon={Users}    color="rose"    loading={loading} />
          <StatsCard title="Nuevos 30d" value={stats.newCount}  icon={UserPlus} color="blue"    loading={loading} />
          <StatsCard title="Recurrentes" value={stats.recurring} icon={Repeat}  color="emerald" loading={loading} hint="≥ 3 citas" />
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
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-admin-muted/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-admin-text">No hay clientes</p>
            </div>
          ) : (
            <div className="divide-y divide-admin-border">
              {filtered.map((c, i) => {
                const key = c.email || c.phone;
                const isExpanded = expanded === key;
                const history = historyCache[key];

                return (
                  <div key={i}>
                    <button
                      onClick={() => {
                        const next = isExpanded ? null : key;
                        setExpanded(next);
                        if (!isExpanded) loadHistory(c);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-admin-surface/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                        {getInitials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-admin-text truncate">{c.name}</p>
                        <p className="text-[11px] text-admin-muted truncate">{c.email || c.phone || '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-brand-rose">{c.count}</p>
                        <p className="text-[10px] text-admin-muted">{c.count === 1 ? 'cita' : 'citas'}</p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-[10px] text-admin-muted">Última</p>
                        <p className="text-[11px] font-medium text-admin-text">
                          {c.lastDate ? format(parseISO(c.lastDate), "d MMM yy", { locale: es }) : '—'}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-admin-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-admin-bg/40 space-y-3">
                        <div className="flex flex-wrap gap-2 pt-3">
                          {c.phone && (
                            <>
                              <button
                                onClick={() => whatsappTo(c.phone, c.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </button>
                              <button
                                onClick={() => callTo(c.phone)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-admin-border text-admin-text hover:bg-admin-surface transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" /> Llamar
                              </button>
                            </>
                          )}
                          {c.email && (
                            <button
                              onClick={() => emailTo(c.email)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" /> Email
                            </button>
                          )}
                          <button
                            onClick={() => deleteCustomer(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors sm:ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar cliente
                          </button>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-admin-muted uppercase tracking-wider mb-2">Historial</p>
                          {history === null ? (
                            <div className="h-10 rounded-lg bg-admin-surface animate-pulse" />
                          ) : history === undefined || history.length === 0 ? (
                            <p className="text-xs text-admin-muted px-2 py-2 italic">Sin historial disponible</p>
                          ) : (
                            <div className="space-y-1.5">
                              {history.map((b) => {
                                const status = b.status || 'pending';
                                return (
                                  <div key={b.id} className="flex items-center gap-3 bg-white border border-admin-border rounded-xl px-3 py-2">
                                    <div className="shrink-0 w-12 text-center">
                                      <p className="text-xs font-bold text-brand-rose">{b.booking_time?.slice(0, 5)}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-admin-text">
                                        {b.booking_date ? format(parseISO(b.booking_date), "d MMM yyyy", { locale: es }) : '—'}
                                      </p>
                                      <p className="text-[11px] text-admin-muted truncate">
                                        {b.locations?.name || '—'}
                                        {' · '}
                                        {b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '—'}
                                      </p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${STATUS_CHIP[status] || STATUS_CHIP.pending}`}>
                                      {STATUS_LABEL[status] || 'Pendiente'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersPage;
