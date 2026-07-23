import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, CheckCircle, Euro, XCircle, MessageCircle, Phone, Mail, Save, Cake, Trash2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import StatsCard from '@/components/admin/StatsCard';
import EmptyState from '@/components/admin/EmptyState';
import { STATUS_CHIP, STATUS_LABEL } from '@/components/admin/calendar/statusStyles';
import { getInitials } from '@/lib/avatar';
import { useToast } from '@/components/ui/use-toast';

const fieldCls = 'w-full h-10 px-3 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors';
const eur = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [edits, setEdits] = useState({ notes: '', preferences: '', birthday: '' });

  // Borrado definitivo: se elimina la ficha; las citas se conservan (la FK es
  // ON DELETE SET NULL) y quedan sin clienta asignada. No se puede deshacer.
  const hardDelete = async () => {
    if (!window.confirm(`¿Eliminar definitivamente a ${customer?.full_name || 'esta clienta'}?\n\nSu ficha se borra; sus citas se conservan (quedan sin clienta asignada). Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const { error } = await supabase.from('customers').delete().eq('id', id);
    setDeleting(false);
    if (error) { toast({ variant: 'destructive', title: 'No se pudo eliminar', description: error.message }); return; }
    toast({ title: 'Clienta eliminada', description: 'Sus citas se han conservado.' });
    navigate('/admin/clientes');
  };

  const fetchAll = useCallback(async () => {
    const [{ data: cust }, { data: bks }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, locations(name), booking_services(services(name, price_cents))')
        .eq('customer_id', id)
        .order('booking_date', { ascending: false }),
    ]);
    setCustomer(cust ?? null);
    setHistory(bks ?? []);
    if (cust) {
      setEdits({
        notes: cust.notes ?? '',
        preferences: cust.preferences ?? '',
        birthday: cust.birthday ?? '',
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = useMemo(() => {
    const completed = history.filter((b) => b.status === 'completed');
    const spend = completed.reduce((sum, b) => sum
      + (b.booking_services ?? []).reduce((s, bs) => s + (bs.services?.price_cents ?? 0), 0), 0);
    const lastVisit = completed[0]?.booking_date || history[0]?.booking_date || null;
    const cancelled = history.filter((b) => b.status === 'cancelled').length;
    return { total: history.length, visits: completed.length, spend, lastVisit, cancelled };
  }, [history]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('customers').update({
      notes: edits.notes || null,
      preferences: edits.preferences || null,
      birthday: edits.birthday || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo guardar', description: error.message });
      return;
    }
    toast({ title: 'Ficha actualizada' });
    fetchAll();
  };

  const phone = customer?.phone_display || (customer?.phone_normalized ? `+34${customer.phone_normalized}` : '');
  const waHref = () => {
    let p = (phone || '').replace(/\D/g, '');
    if (!p.startsWith('34') && p.length === 9) p = '34' + p;
    return `https://wa.me/${p}?text=${encodeURIComponent(`¡Hola ${customer?.full_name || ''}! Te escribimos de Suly Pretty Nails.`)}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-24 rounded-2xl bg-admin-surface animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-admin-surface animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={XCircle} title="Clienta no encontrada" description="Puede que se haya eliminado o el enlace no sea válido." />
        <div className="text-center mt-4">
          <Link to="/admin/clientes" className="text-sm font-bold text-brand-rose hover:underline">← Volver a Clientas</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{customer.full_name || 'Clienta'} — Admin Suly</title></Helmet>
      <div className="max-w-4xl mx-auto space-y-5">
        <Link to="/admin/clientes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-muted hover:text-brand-rose transition-colors">
          <ArrowLeft className="w-4 h-4" /> Clientas
        </Link>

        {/* Cabecera */}
        <div className="bg-white border border-admin-border rounded-2xl p-5 shadow-rose-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-rose-sm">
            {getInitials(customer.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-admin-text truncate">{customer.full_name || 'Sin nombre'}</h1>
            <p className="text-sm text-admin-muted truncate">{phone || '—'}{customer.email ? ` · ${customer.email}` : ''}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {phone && (
              <>
                <a href={waHref()} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-2.5 rounded-xl text-green-600 hover:bg-green-50 transition-colors"><MessageCircle className="w-5 h-5" /></a>
                <a href={`tel:${phone.replace(/\s+/g, '')}`} title="Llamar" className="p-2.5 rounded-xl text-admin-text hover:bg-admin-surface transition-colors"><Phone className="w-5 h-5" /></a>
              </>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} title="Email" className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"><Mail className="w-5 h-5" /></a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard title="Citas"    value={stats.total}  icon={CalendarDays} color="rose" />
          <StatsCard title="Visitas"  value={stats.visits} icon={CheckCircle}  color="emerald" hint="completadas" />
          <StatsCard title="Gasto"    value={eur(stats.spend)} icon={Euro}     color="amber" hint="en completadas" />
          <StatsCard title="Cancelaciones" value={stats.cancelled} icon={XCircle} color="rose" />
        </div>

        {/* Datos editables */}
        <div className="bg-white border border-admin-border rounded-2xl p-5 shadow-rose-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-admin-text uppercase tracking-wider">Ficha</h2>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-rose-gold text-white text-xs font-bold shadow-rose-sm hover:brightness-105 disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cust-birthday" className="block text-[11px] font-bold text-admin-muted uppercase tracking-wider mb-1">
                <Cake className="w-3 h-3 inline mr-1" />Cumpleaños
              </label>
              <input id="cust-birthday" type="date" value={edits.birthday || ''} onChange={(e) => setEdits((p) => ({ ...p, birthday: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="cust-prefs" className="block text-[11px] font-bold text-admin-muted uppercase tracking-wider mb-1">Preferencias</label>
              <input id="cust-prefs" value={edits.preferences} onChange={(e) => setEdits((p) => ({ ...p, preferences: e.target.value }))} placeholder="Colores, forma, alergias..." className={fieldCls} />
            </div>
          </div>
          <div>
            <label htmlFor="cust-notes" className="block text-[11px] font-bold text-admin-muted uppercase tracking-wider mb-1">Notas</label>
            <textarea id="cust-notes" value={edits.notes} onChange={(e) => setEdits((p) => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notas internas sobre la clienta..." className="w-full px-3 py-2 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors resize-none" />
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white border border-admin-border rounded-2xl overflow-hidden shadow-rose-xs">
          <div className="px-5 py-3 border-b border-admin-border">
            <h2 className="text-sm font-bold text-admin-text uppercase tracking-wider">Historial de citas</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-6"><p className="text-sm text-admin-muted text-center italic">Sin citas registradas.</p></div>
          ) : (
            <div className="divide-y divide-admin-border">
              {history.map((b) => {
                const status = b.status || 'pending';
                const services = (b.booking_services ?? []).map((bs) => bs.services?.name).filter(Boolean).join(', ');
                return (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="shrink-0 w-14 text-center">
                      <p className="text-xs font-bold text-brand-rose">{b.booking_time?.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-admin-text">
                        {b.booking_date ? format(parseISO(b.booking_date), 'd MMM yyyy', { locale: es }) : '—'}
                      </p>
                      <p className="text-[11px] text-admin-muted truncate">
                        {b.locations?.name || '—'}{' · '}{services || '—'}
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

        {/* Zona de peligro */}
        <div className="border border-red-200 rounded-2xl p-4 bg-red-50/40">
          <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1">Zona de peligro</h2>
          <p className="text-xs text-admin-muted mb-3">
            Elimina la ficha de la clienta de forma permanente. Sus citas se conservan en la base de
            datos (quedan sin clienta asignada). Esta acción no se puede deshacer.
          </p>
          <button
            onClick={hardDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar definitivamente
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerDetailPage;
