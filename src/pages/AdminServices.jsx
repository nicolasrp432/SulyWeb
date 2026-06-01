import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus, Trash2, Edit3, Check, X, Loader2, AlertCircle, Scissors, Sparkles,
  Tag, Clock as ClockIcon, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';

const CATEGORIES = [
  { id: 'nails',    label: 'Manicura y Pedicura', icon: Scissors },
  { id: 'beauty',   label: 'Pestañas y Depilación', icon: Sparkles },
  { id: 'paquetes', label: 'Paquetes', icon: Tag },
];

const DEFAULT_SERVICES = [
  { name: 'Cortar + limar',          price: '9,90€',  duration_minutes: 30, category: 'nails',  active: true, display_order: 1 },
  { name: 'Manicura exprés',          price: '13,90€', duration_minutes: 30, category: 'nails',  active: true, display_order: 2 },
  { name: 'Manicura semi exprés',     price: '14,90€', duration_minutes: 40, category: 'nails',  active: true, display_order: 3 },
  { name: 'Manicura tradicional',     price: '16,90€', duration_minutes: 45, category: 'nails',  active: true, display_order: 4 },
  { name: 'Manicura completa spa',    price: '19,90€', duration_minutes: 60, category: 'nails',  active: true, display_order: 5 },
  { name: 'Manicura rusa',            price: '25,90€', duration_minutes: 60, category: 'nails',  active: true, display_order: 6 },
  { name: 'Uñas acrílicas / gel',     price: '38,90€', duration_minutes: 90, category: 'nails',  active: true, display_order: 7 },
  { name: 'Relleno de acrílico',      price: '28,90€', duration_minutes: 60, category: 'nails',  active: true, display_order: 8 },
  { name: 'Retirar acrílico',         price: '10,00€', duration_minutes: 30, category: 'nails',  active: true, display_order: 9 },
  { name: 'Pedicura exprés',          price: '15,90€', duration_minutes: 40, category: 'nails',  active: true, display_order: 10 },
  { name: 'Pedicura completa',        price: '19,90€', duration_minutes: 60, category: 'nails',  active: true, display_order: 11 },
  { name: 'Lifting de pestañas',      price: '35,00€', duration_minutes: 60, category: 'beauty', active: true, display_order: 12 },
  { name: 'Laminado de cejas',        price: '25,00€', duration_minutes: 45, category: 'beauty', active: true, display_order: 13 },
  { name: 'Depilación cejas',         price: '8,00€',  duration_minutes: 15, category: 'beauty', active: true, display_order: 14 },
  { name: 'Depilación labio',         price: '5,00€',  duration_minutes: 10, category: 'beauty', active: true, display_order: 15 },
];

const inputCls = 'w-full pl-9 h-10 rounded-xl border border-admin-border bg-white text-base md:text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';
const inputClsPlain = 'w-full h-10 px-3 rounded-xl border border-admin-border bg-white text-base md:text-sm text-admin-text placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose transition-colors';

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
  </button>
);

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration_minutes: 30, category: 'nails' });
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (fetchErr) showError('Error al cargar servicios: ' + fetchErr.message);
    setServices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
    const channel = supabase
      .channel('admin-services-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchServices]);

  const seedServices = async () => {
    if (!window.confirm('Esto insertará los servicios predeterminados. ¿Continuar?')) return;
    setSeeding(true);
    const { error: seedErr } = await supabase.from('services').insert(DEFAULT_SERVICES);
    if (seedErr) showError('Error al insertar: ' + seedErr.message);
    else { showFlash('Servicios insertados correctamente'); await fetchServices(); }
    setSeeding(false);
  };

  const startEdit = (svc) => {
    setEditingId(svc.id);
    setEditValues({
      name: svc.name,
      price: svc.price ?? '',
      duration_minutes: svc.duration_minutes ?? 30,
      category: svc.category ?? 'nails',
    });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    const { error: updateErr } = await supabase
      .from('services')
      .update({
        name: editValues.name,
        price: editValues.price,
        duration_minutes: Number(editValues.duration_minutes),
        category: editValues.category,
      })
      .eq('id', id);
    if (updateErr) showError('Error al guardar: ' + updateErr.message);
    else {
      showFlash('Servicio actualizado');
      await fetchServices();
    }
    setSaving(false);
    setEditingId(null);
  };

  const toggleActive = async (svc) => {
    const { error: toggleErr } = await supabase.from('services').update({ active: !svc.active }).eq('id', svc.id);
    if (toggleErr) showError('Error al cambiar estado: ' + toggleErr.message);
    else await fetchServices();
  };

  const deleteService = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    const { error: deleteErr } = await supabase.from('services').delete().eq('id', id);
    if (deleteErr) showError('Error al eliminar: ' + deleteErr.message);
    else {
      showFlash('Servicio eliminado');
      await fetchServices();
    }
  };

  const addService = async () => {
    if (!newService.name) return;
    setSaving(true);
    const { error: addErr } = await supabase
      .from('services')
      .insert([{ ...newService, duration_minutes: Number(newService.duration_minutes), active: true }]);
    if (addErr) showError('Error al añadir: ' + addErr.message);
    else {
      setNewService({ name: '', price: '', duration_minutes: 30, category: 'nails' });
      setShowAdd(false);
      showFlash('Servicio añadido');
      await fetchServices();
    }
    setSaving(false);
  };

  const visibleServices = useMemo(() => {
    if (activeTab === 'all') return services;
    return services.filter((s) => (s.category ?? 'nails') === activeTab);
  }, [services, activeTab]);

  const countByCat = useMemo(() => {
    const c = { all: services.length };
    CATEGORIES.forEach((cat) => { c[cat.id] = services.filter((s) => (s.category ?? 'nails') === cat.id).length; });
    return c;
  }, [services]);

  return (
    <>
      <Helmet><title>Servicios — Admin Suly</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-5">
        <PageHeader
          icon={Scissors}
          title="Servicios"
          subtitle={`${services.length} servicios · ${services.filter((s) => s.active).length} activos`}
          actions={
            <div className="flex gap-2">
              {services.length === 0 && !loading && (
                <button
                  onClick={seedServices}
                  disabled={seeding}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  Cargar predeterminados
                </button>
              )}
              <button
                onClick={() => setShowAdd((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Nuevo
              </button>
            </div>
          }
        />

        {flash && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2"><Check className="w-3.5 h-3.5" /> {flash}</p>}
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}

        {/* Add form */}
        {showAdd && (
          <div className="bg-white border border-admin-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-rose-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-admin-text flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-rose" /> Nuevo servicio
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-admin-muted hover:text-admin-text">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <input
                  value={newService.name}
                  onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre del servicio *"
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <input
                  value={newService.price}
                  onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                  placeholder="Precio (ej: 15,90€)"
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="5"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService((p) => ({ ...p, duration_minutes: e.target.value }))}
                  placeholder="Duración (min)"
                  className={inputCls}
                />
              </div>
              <select
                value={newService.category}
                onChange={(e) => setNewService((p) => ({ ...p, category: e.target.value }))}
                className={inputClsPlain}
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text border border-admin-border rounded-xl hover:bg-admin-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addService}
                disabled={!newService.name || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl disabled:opacity-50 hover:shadow-rose-md transition-all"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-admin-border rounded-xl p-1 shadow-rose-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`h-9 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface'
            }`}
          >
            Todos
            <span className="ml-1.5 opacity-80">({countByCat.all})</span>
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`h-9 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className="opacity-80">({countByCat[cat.id] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-admin-surface animate-pulse" />)}
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="bg-white border border-admin-border rounded-2xl p-12 text-center shadow-rose-xs">
            <Scissors className="w-10 h-10 text-admin-muted/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-admin-text">Sin servicios en esta categoría</p>
            <p className="text-xs text-admin-muted mt-1">Añade uno con el botón "Nuevo".</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {visibleServices.map((svc) => {
              const isEditing = editingId === svc.id;
              const cat = CATEGORIES.find((c) => c.id === (svc.category ?? 'nails')) || CATEGORIES[0];
              const CatIcon = cat.icon;
              return (
                <div
                  key={svc.id}
                  className={`bg-white border border-admin-border rounded-2xl p-4 shadow-rose-xs hover:shadow-rose-sm transition-shadow ${!svc.active ? 'opacity-60' : ''}`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editValues.name}
                        onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))}
                        className={inputClsPlain}
                        placeholder="Nombre"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editValues.price}
                          onChange={(e) => setEditValues((p) => ({ ...p, price: e.target.value }))}
                          placeholder="Precio"
                          className={inputClsPlain}
                        />
                        <input
                          type="number"
                          min="5"
                          max="300"
                          step="5"
                          value={editValues.duration_minutes}
                          onChange={(e) => setEditValues((p) => ({ ...p, duration_minutes: e.target.value }))}
                          placeholder="min"
                          className={inputClsPlain}
                        />
                      </div>
                      <select
                        value={editValues.category}
                        onChange={(e) => setEditValues((p) => ({ ...p, category: e.target.value }))}
                        className={inputClsPlain}
                      >
                        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-admin-muted hover:text-admin-text border border-admin-border rounded-lg hover:bg-admin-surface transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(svc.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-rose-gold text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-rose-gold/15 text-brand-rose flex items-center justify-center shrink-0">
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-admin-text truncate">{svc.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {svc.price && (
                            <span className="text-[10px] font-bold text-brand-rose bg-brand-rose-50 px-2 py-0.5 rounded-full border border-brand-rose/20">
                              {svc.price}
                            </span>
                          )}
                          {svc.duration_minutes && (
                            <span className="text-[10px] font-bold text-admin-muted bg-admin-surface px-2 py-0.5 rounded-full border border-admin-border inline-flex items-center gap-1">
                              <ClockIcon className="w-2.5 h-2.5" /> {svc.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Switch checked={svc.active} onChange={() => toggleActive(svc)} />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(svc)}
                            title="Editar"
                            className="p-1 text-admin-muted hover:text-brand-rose transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteService(svc.id)}
                            title="Eliminar"
                            className="p-1 text-admin-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminServices;
