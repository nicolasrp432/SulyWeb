import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SettingsPage = () => {
  const [locations, setLocations] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlock, setNewBlock] = useState({ location_id: '', block_date: '', reason: '' });
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
    supabase
      .from('schedule_blocks')
      .select('*, locations(name)')
      .order('block_date')
      .then(({ data }) => { setBlocks(data ?? []); setLoadingBlocks(false); });
  }, []);

  const addBlock = async () => {
    if (!newBlock.block_date) return;
    setSaving(true);
    const payload = {
      block_date: newBlock.block_date,
      reason: newBlock.reason || null,
      location_id: newBlock.location_id || null,
    };
    const { data } = await supabase
      .from('schedule_blocks')
      .insert([payload])
      .select('*, locations(name)')
      .single();
    if (data) {
      setBlocks((prev) => [...prev, data].sort((a, b) => (a.block_date > b.block_date ? 1 : -1)));
      setNewBlock({ location_id: '', block_date: '', reason: '' });
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
    }
    setSaving(false);
  };

  const removeBlock = async (id) => {
    await supabase.from('schedule_blocks').delete().eq('id', id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <>
      <Helmet><title>Configuración — Admin Suly</title></Helmet>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-admin-text">Configuración</h1>
          <p className="text-sm text-admin-muted mt-0.5">Gestiona bloqueos de agenda y sedes</p>
        </div>

        {/* Sedes */}
        <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-surface">
            <h2 className="font-semibold text-admin-text text-sm">Sedes activas</h2>
          </div>
          <div className="p-4 space-y-2">
            {locations.length === 0 ? (
              <div className="h-10 rounded-xl bg-admin-surface animate-pulse" />
            ) : (
              locations.map((l) => (
                <div key={l.id} className="flex items-center gap-3 bg-admin-bg rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-sm text-admin-text font-medium flex-1">{l.name}</p>
                  <span className="text-xs text-emerald-400">Activa</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule blocks */}
        <div className="bg-admin-sidebar border border-admin-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-surface">
            <h2 className="font-semibold text-admin-text text-sm">Bloqueos de agenda</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              Días en los que el salón no trabaja (vacaciones, festivos, mantenimiento).
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="date"
                value={newBlock.block_date}
                onChange={(e) => setNewBlock((p) => ({ ...p, block_date: e.target.value }))}
                className="px-3 py-2.5 bg-admin-bg border border-admin-surface rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
              />
              <select
                value={newBlock.location_id}
                onChange={(e) => setNewBlock((p) => ({ ...p, location_id: e.target.value }))}
                className="px-3 py-2.5 bg-admin-bg border border-admin-surface rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
              >
                <option value="">Todas las sedes</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input
                type="text"
                value={newBlock.reason}
                onChange={(e) => setNewBlock((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Motivo (opcional)"
                className="px-3 py-2.5 bg-admin-bg border border-admin-surface rounded-xl text-admin-text text-sm placeholder:text-admin-muted focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
              />
            </div>
            <button
              onClick={addBlock}
              disabled={!newBlock.block_date || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-rose text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-brand-rose-dark transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Añadir bloqueo'}
            </button>
            {flash && (
              <p className="text-xs text-emerald-400">Bloqueo añadido correctamente.</p>
            )}

            <div className="space-y-2">
              {loadingBlocks ? (
                <div className="h-10 rounded-xl bg-admin-surface animate-pulse" />
              ) : blocks.length === 0 ? (
                <p className="text-sm text-admin-muted text-center py-4">No hay bloqueos configurados</p>
              ) : (
                blocks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 bg-admin-bg rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-admin-text">{b.block_date}</p>
                      <p className="text-xs text-admin-muted">
                        {b.locations?.name ?? 'Todas las sedes'}
                        {b.reason ? ` · ${b.reason}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="p-1.5 text-admin-muted hover:text-red-400 transition-colors"
                      aria-label="Eliminar bloqueo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
