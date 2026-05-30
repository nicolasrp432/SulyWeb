import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus, Trash2, Loader2, Settings as SettingsIcon, Store, Lock, Calendar as CalendarIcon,
  Check, AlertCircle, Users, Crown, Mail, Shield, ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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

const SettingsPage = () => {
  const { isOwner, user } = useAuth();
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

        {isOwner && (
          <TeamSection
            currentUserId={user?.id}
            onFlash={showFlash}
            onError={showError}
          />
        )}

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

// ============================================================================
// TeamSection: gestión de admin_profiles (solo visible para owners)
// ============================================================================
const ROLE_CHIP = {
  owner: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-brand-rose-50 text-brand-rose border-brand-rose/30',
};

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

const TeamSection = ({ currentUserId, onFlash, onError }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('admin');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('admin_profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });
    if (fetchErr) onError('Error al cargar equipo: ' + fetchErr.message);
    setProfiles(data ?? []);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    fetchProfiles();
    const channel = supabase
      .channel('admin-profiles-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_profiles' }, fetchProfiles)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchProfiles]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setSubmitting(true);
    try {
      const { data: userId, error: rpcErr } = await supabase
        .rpc('find_user_id_by_email', { p_email: email });
      if (rpcErr) throw rpcErr;
      if (!userId) {
        onError('Este email no existe en Supabase Auth. Crea primero el usuario en Authentication > Users > Add user.');
        return;
      }
      const { error: insertErr } = await supabase
        .from('admin_profiles')
        .insert([{
          id: userId,
          email,
          full_name: newName.trim() || null,
          role: newRole,
          is_active: true,
        }]);
      if (insertErr) {
        if (insertErr.code === '23505') {
          onError('Este usuario ya tiene perfil admin. Si está desactivado, reactívalo desde la lista.');
        } else {
          throw insertErr;
        }
        return;
      }
      onFlash(`Acceso activado para ${email}`);
      setNewEmail('');
      setNewName('');
      setNewRole('admin');
    } catch (e) {
      onError('Error al activar acceso: ' + (e.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (profile) => {
    if (profile.id === currentUserId) {
      onError('No puedes desactivar tu propio acceso.');
      return;
    }
    const { error: updErr } = await supabase
      .from('admin_profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', profile.id);
    if (updErr) onError('Error: ' + updErr.message);
    else onFlash(`Acceso ${!profile.is_active ? 'activado' : 'desactivado'}`);
  };

  const removeProfile = async (profile) => {
    if (profile.id === currentUserId) {
      onError('No puedes eliminar tu propio perfil.');
      return;
    }
    if (!window.confirm(`¿Eliminar acceso de ${profile.email}? La cuenta en Supabase Auth seguirá existiendo (puedes borrarla manualmente).`)) return;
    const { error: delErr } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('id', profile.id);
    if (delErr) onError('Error al eliminar: ' + delErr.message);
    else onFlash('Perfil eliminado');
  };

  const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

  return (
    <SectionCard
      icon={Users}
      title="Equipo administrador"
      subtitle="Solo el owner puede gestionar quién accede al panel."
    >
      <div className="space-y-3">
        <div className="space-y-2">
          {loading ? (
            <div className="h-12 rounded-xl bg-admin-surface animate-pulse" />
          ) : profiles.length === 0 ? (
            <p className="text-xs text-admin-muted italic text-center py-4">
              Sin admins activos.
            </p>
          ) : (
            profiles.map((p) => {
              const isSelf = p.id === currentUserId;
              return (
                <div key={p.id} className="flex items-center gap-3 bg-admin-bg/60 border border-admin-border rounded-xl px-3 py-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-rose-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-rose-sm">
                    {getInitials(p.full_name || p.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-admin-text truncate">
                        {p.full_name || p.email.split('@')[0]}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${ROLE_CHIP[p.role] || ROLE_CHIP.admin}`}>
                        {p.role === 'owner' ? <Crown className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                        {p.role}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-bold text-admin-muted bg-admin-surface px-1.5 py-0.5 rounded">TÚ</span>
                      )}
                    </div>
                    <p className="text-[11px] text-admin-muted truncate">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={p.is_active}
                      onChange={() => toggleActive(p)}
                      disabled={isSelf}
                    />
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => removeProfile(p)}
                        className="p-1 text-admin-muted hover:text-red-500 transition-colors"
                        title="Eliminar perfil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-admin-border space-y-2">
          <p className="text-[11px] font-bold text-admin-text uppercase tracking-wider">Activar nuevo admin</p>
          <p className="text-[10px] text-admin-muted leading-relaxed">
            Primero crea al usuario en{' '}
            <a
              href="https://supabase.com/dashboard/project/_/auth/users"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-rose hover:underline inline-flex items-center gap-0.5 font-semibold"
            >
              Supabase Auth Dashboard <ExternalLink className="w-2.5 h-2.5" />
            </a>{' '}
            (Add user → email + password). Después introduce su email aquí para darle acceso al panel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative sm:col-span-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className={inputCls}
              />
            </div>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre completo (opcional)"
              className={inputCls}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newEmail || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Activar acceso
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

export default SettingsPage;
