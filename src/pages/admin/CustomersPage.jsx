import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  pending:   'bg-amber-500/15 text-amber-400',
  cancelled: 'bg-white/5 text-admin-muted',
  completed: 'bg-blue-500/15 text-blue-400',
};
const STATUS_LABELS = {
  confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada',
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [historyCache, setHistoryCache] = useState({});

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('client_name, client_email, client_phone, booking_date')
        .order('booking_date', { ascending: false });

      if (!data) { setLoading(false); return; }

      const map = {};
      data.forEach((b) => {
        const key = b.client_email || b.client_phone || b.client_name;
        if (!map[key]) {
          map[key] = { name: b.client_name, email: b.client_email, phone: b.client_phone, count: 0, lastDate: b.booking_date };
        }
        map[key].count++;
        if (b.booking_date > (map[key].lastDate ?? '')) map[key].lastDate = b.booking_date;
      });

      setCustomers(Object.values(map).sort((a, b) => b.count - a.count));
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const loadHistory = async (customer) => {
    const key = customer.email || customer.phone;
    if (historyCache[key] !== undefined) return;
    setHistoryCache((prev) => ({ ...prev, [key]: null }));

    let query = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, locations(name), booking_services(services(name))')
      .order('booking_date', { ascending: false })
      .limit(10);
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

  return (
    <>
      <Helmet><title>Clientes — Admin Suly</title></Helmet>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-admin-text">Clientes</h1>
          <p className="text-sm text-admin-muted mt-0.5">{customers.length} clientes únicos</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2.5 bg-admin-sidebar border border-admin-surface rounded-xl text-admin-text text-sm placeholder:text-admin-muted focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
          />
        </div>

        <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-admin-surface animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-admin-muted text-sm">No hay clientes</div>
          ) : (
            <div className="divide-y divide-admin-surface">
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
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-admin-surface/40 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-rose/20 flex items-center justify-center text-brand-rose font-bold text-sm shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-admin-text text-sm">{c.name}</p>
                        <p className="text-xs text-admin-muted truncate">{c.email || c.phone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-admin-text">{c.count}</p>
                        <p className="text-[10px] text-admin-muted">{c.count === 1 ? 'cita' : 'citas'}</p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs text-admin-muted">Última cita</p>
                        <p className="text-xs font-medium text-admin-text">
                          {c.lastDate ? format(parseISO(c.lastDate), 'd MMM yyyy', { locale: es }) : '—'}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-admin-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-admin-bg/50">
                        <div className="space-y-2 pt-2">
                          {history === null ? (
                            <div className="h-10 rounded-lg bg-admin-surface animate-pulse" />
                          ) : history === undefined || history.length === 0 ? (
                            <p className="text-xs text-admin-muted px-2 py-2">Sin historial disponible</p>
                          ) : (
                            history.map((b) => (
                              <div key={b.id} className="flex items-center gap-3 bg-admin-sidebar rounded-xl px-3 py-2.5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-admin-text">
                                    {b.booking_date ? format(parseISO(b.booking_date), 'd MMM yyyy', { locale: es }) : '—'}
                                    {' · '}{b.booking_time?.slice(0, 5)}
                                  </p>
                                  <p className="text-[11px] text-admin-muted truncate">
                                    {b.locations?.name}
                                    {' · '}
                                    {b.booking_services?.map((bs) => bs.services?.name).filter(Boolean).join(', ') || '—'}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[b.status] ?? STATUS_STYLES.confirmed}`}>
                                  {STATUS_LABELS[b.status] ?? 'Confirmada'}
                                </span>
                              </div>
                            ))
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
