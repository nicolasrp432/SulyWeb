import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Store, Check, Users } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { getInitials } from '@/lib/avatar';

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

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

const Switch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-emerald-500' : 'bg-zinc-300'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
      checked ? 'translate-x-4' : 'translate-x-0.5'
    }`} />
  </button>
);

// ============================================================================
// ManicuristTeamSection: gestión del equipo de manicuristas (admin_staff).
// Define la CAPACIDAD: una hora solo se ocupa cuando todas las reservables
// están ocupadas. Distinta del acceso al panel (admin_profiles).
// ============================================================================
const ManicuristTeamSection = ({ locations = [], onFlash, onError }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', location_id: '', specialty: '' });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('admin_staff')
      .select('id, full_name, location_id, specialty, is_active, is_bookable, display_order')
      .order('display_order', { ascending: true })
      .order('full_name', { ascending: true });
    if (err) onError?.('Error al cargar equipo: ' + err.message);
    setMembers(data ?? []);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    fetchMembers();
    const channel = supabase
      .channel('team-staff-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff' }, fetchMembers)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchMembers]);

  const addMember = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      location_id: form.location_id || null,
      specialty: form.specialty.trim() || null,
      role: 'staff',
      is_active: true,
      is_bookable: true,
      display_order: members.length + 1,
    };
    const { error: err } = await supabase.from('admin_staff').insert([payload]);
    if (err) onError?.('Error al añadir: ' + err.message);
    else {
      setForm({ full_name: '', location_id: '', specialty: '' });
      onFlash?.('Manicurista añadida');
    }
    setSaving(false);
  };

  const patchMember = async (id, patch) => {
    const { error: err } = await supabase.from('admin_staff').update(patch).eq('id', id);
    if (err) onError?.('Error al actualizar: ' + err.message);
  };

  const removeMember = async (id) => {
    if (!window.confirm('¿Eliminar a esta manicurista del equipo?')) return;
    const { error: err } = await supabase.from('admin_staff').delete().eq('id', id);
    if (err) onError?.('Error al eliminar: ' + err.message);
    else onFlash?.('Manicurista eliminada');
  };

  const locName = (id) => locations.find((l) => String(l.id) === String(id))?.name ?? 'Todas las sedes';

  return (
    <SectionCard
      icon={Users}
      title="Equipo de manicuristas"
      subtitle="Determina cuántas citas simultáneas son posibles por sede. Una hora se ocupa solo cuando todas las reservables están ocupadas."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Nombre"
              className={inputCls}
            />
          </div>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
            <select
              value={form.location_id}
              onChange={(e) => setForm((p) => ({ ...p, location_id: e.target.value }))}
              className="w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
            >
              <option value="">Todas las sedes</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              placeholder="Especialidad (opcional)"
              className={inputCls}
            />
          </div>
        </div>
        <button
          onClick={addMember}
          disabled={!form.full_name.trim() || saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {saving ? 'Guardando...' : 'Añadir manicurista'}
        </button>

        <div className="space-y-1.5 pt-2 border-t border-admin-border">
          {loading ? (
            <div className="h-12 rounded-xl bg-admin-surface animate-pulse" />
          ) : members.length === 0 ? (
            <p className="text-xs text-admin-muted italic text-center py-4">Sin manicuristas. Añade al menos una para habilitar reservas por capacidad.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-admin-bg/60 border border-admin-border rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-rose-gold flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  {getInitials(m.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-admin-text truncate">{m.full_name}</p>
                  <p className="text-[11px] text-admin-muted truncate">
                    {locName(m.location_id)}{m.specialty ? ` · ${m.specialty}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold text-admin-muted uppercase">Reservable</span>
                    <Switch checked={m.is_bookable} onChange={() => patchMember(m.id, { is_bookable: !m.is_bookable })} />
                  </label>
                  <label className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold text-admin-muted uppercase">Activa</span>
                    <Switch checked={m.is_active} onChange={() => patchMember(m.id, { is_active: !m.is_active })} />
                  </label>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="p-1.5 text-admin-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Eliminar manicurista"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default ManicuristTeamSection;
