import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus, Trash2, Loader2, Settings as SettingsIcon, Store, Lock, Calendar as CalendarIcon,
  Check, AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

const SettingsPage = () => {
  const [locations, setLocations] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlock, setNewBlock] = useState({ location_id: '', block_date: '', reason: '' });
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const fetchBlocks = useCallback(async () => {
    setLoadingBlocks(true);
    const { data } = await supabase
      .from('schedule_blocks')
      .select('*, locations(name)')
      .order('block_date');
    setBlocks(data ?? []);
    setLoadingBlocks(false);
  }, []);

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
    fetchBlocks();
    const channel = supabase
      .channel('settings-blocks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, fetchBlocks)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchBlocks]);

  const addBlock = async () => {
    if (!newBlock.block_date) return;
    setSaving(true);
    const payload = {
      block_date: newBlock.block_date,
      reason: newBlock.reason || null,
      location_id: newBlock.location_id || null,
    };
    const { error: insertErr } = await supabase.from('schedule_blocks').insert([payload]);
    if (insertErr) showError('Error al añadir: ' + insertErr.message);
    else {
      setNewBlock({ location_id: '', block_date: '', reason: '' });
      showFlash('Bloqueo añadido');
    }
    setSaving(false);
  };

  const removeBlock = async (id) => {
    if (!window.confirm('¿Eliminar este bloqueo?')) return;
    const { error: delErr } = await supabase.from('schedule_blocks').delete().eq('id', id);
    if (delErr) showError('Error al eliminar: ' + delErr.message);
    else showFlash('Bloqueo eliminado');
  };

  const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
    <div className="bg-white border border-admin-border rounded-2xl overflow-hidden shadow-rose-xs">
      <div className="px-5 py-4 border-b border-admin-border bg-gradient-to-r from-brand-rose-50/40 to-transparent flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-rose-gold/15 text-brand-rose flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-admin-text text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-admin-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <>
      <Helmet><title>Configuración — Admin Suly</title></Helmet>
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader
          icon={SettingsIcon}
          title="Configuración"
          subtitle="Gestiona sedes y bloqueos de agenda"
        />

        {flash && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2"><Check className="w-3.5 h-3.5" /> {flash}</p>}
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}

        {/* Sedes */}
        <SectionCard icon={Store} title="Sedes activas" subtitle={`${locations.length} sede${locations.length === 1 ? '' : 's'} disponible${locations.length === 1 ? '' : 's'}`}>
          <div className="space-y-2">
            {locations.length === 0 ? (
              <div className="h-10 rounded-xl bg-admin-surface animate-pulse" />
            ) : (
              locations.map((l) => (
                <div key={l.id} className="flex items-center gap-3 bg-admin-bg/60 border border-admin-border rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-rose-gold flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-admin-text flex-1 truncate">{l.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Activa
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Schedule blocks */}
        <SectionCard
          icon={Lock}
          title="Bloqueos de agenda"
          subtitle="Días en los que el salón no trabaja (vacaciones, festivos, mantenimiento)."
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <input
                  type="date"
                  value={newBlock.block_date}
                  onChange={(e) => setNewBlock((p) => ({ ...p, block_date: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <select
                  value={newBlock.location_id}
                  onChange={(e) => setNewBlock((p) => ({ ...p, location_id: e.target.value }))}
                  className="w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
                >
                  <option value="">Todas las sedes</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Motivo (opcional)"
                  className={inputCls}
                />
              </div>
            </div>
            <button
              onClick={addBlock}
              disabled={!newBlock.block_date || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? 'Guardando...' : 'Añadir bloqueo'}
            </button>

            <div className="space-y-1.5 pt-2 border-t border-admin-border">
              {loadingBlocks ? (
                <div className="h-10 rounded-xl bg-admin-surface animate-pulse" />
              ) : blocks.length === 0 ? (
                <p className="text-xs text-admin-muted italic text-center py-4">No hay bloqueos configurados</p>
              ) : (
                blocks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-800">
                        {b.block_date ? format(parseISO(b.block_date), "EEE d MMM yyyy", { locale: es }) : '—'}
                      </p>
                      <p className="text-[11px] text-amber-700 truncate">
                        {b.locations?.name ?? 'Todas las sedes'}
                        {b.reason ? ` · ${b.reason}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="p-1.5 text-amber-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Eliminar bloqueo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default SettingsPage;
