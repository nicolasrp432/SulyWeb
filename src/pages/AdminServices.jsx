import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Edit3, Check, X, Loader2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CATEGORIES = [
  { id: 'nails',  label: 'Manicura y Pedicura' },
  { id: 'beauty', label: 'Pestañas y Depilación' },
  { id: 'paquetes', label: 'Paquetes' },
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

const EmptyRow = () => (
  <div className="h-12 rounded-xl bg-admin-surface/50 animate-pulse" />
);

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration_minutes: 30, category: 'nails', image_url: '' });
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const fetchServices = async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (fetchErr) showError('Error al cargar servicios: ' + fetchErr.message);
    setServices(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

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
    setEditValues({ name: svc.name, price: svc.price ?? '', duration_minutes: svc.duration_minutes ?? 30, category: svc.category ?? 'nails', image_url: svc.image_url ?? '' });
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
        image_url: editValues.image_url || null,
      })
      .eq('id', id);
    if (updateErr) showError('Error al guardar: ' + updateErr.message);
    else {
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, ...editValues, duration_minutes: Number(editValues.duration_minutes) } : s));
      showFlash('Servicio actualizado');
    }
    setSaving(false);
    setEditingId(null);
  };

  const toggleActive = async (svc) => {
    const { error: toggleErr } = await supabase
      .from('services')
      .update({ active: !svc.active })
      .eq('id', svc.id);
    if (toggleErr) showError('Error al cambiar estado');
    else setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, active: !s.active } : s));
  };

  const deleteService = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    const { error: deleteErr } = await supabase.from('services').delete().eq('id', id);
    if (deleteErr) showError('Error al eliminar: ' + deleteErr.message);
    else { setServices((prev) => prev.filter((s) => s.id !== id)); showFlash('Servicio eliminado'); }
  };

  const addService = async () => {
    if (!newService.name) return;
    setSaving(true);
    const { data, error: addErr } = await supabase
      .from('services')
      .insert([{ ...newService, duration_minutes: Number(newService.duration_minutes), active: true }])
      .select()
      .single();
    if (addErr) showError('Error al añadir: ' + addErr.message);
    else {
      setServices((prev) => [...prev, data]);
      setNewService({ name: '', price: '', duration_minutes: 30, category: 'nails', image_url: '' });
      setShowAdd(false);
      showFlash('Servicio añadido');
    }
    setSaving(false);
  };

  const gridData = CATEGORIES.map((cat) => ({
    ...cat,
    items: services.filter((s) => (s.category ?? 'nails') === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Helmet><title>Servicios — Admin Suly</title></Helmet>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-admin-text">Servicios</h1>
            <p className="text-sm text-admin-muted mt-0.5">{services.length} servicios en total</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {services.length === 0 && !loading && (
              <button
                onClick={seedServices}
                disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
                Cargar servicios por defecto
              </button>
            )}
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-semibold rounded-xl shadow-rose-sm hover:brightness-105 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo servicio
            </button>
          </div>
        </div>

        {flash && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{flash}</p>}
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

        {/* Add form */}
        {showAdd && (
          <div className="bg-admin-sidebar border border-admin-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-admin-text">Nuevo servicio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={newService.name}
                onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del servicio *"
                className="px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-brand-rose transition-colors"
              />
              <input
                value={newService.price}
                onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                placeholder="Precio (ej: 15,90€)"
                className="px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-brand-rose transition-colors"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService((p) => ({ ...p, duration_minutes: e.target.value }))}
                  className="w-24 px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
                />
                <span className="text-sm text-admin-muted">min</span>
              </div>
              <select
                value={newService.category}
                onChange={(e) => setNewService((p) => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <input
              value={newService.image_url}
              onChange={(e) => setNewService((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="URL de imagen (opcional)"
              className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-brand-rose transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={addService}
                disabled={!newService.name || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:brightness-105 transition-all"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-xs font-semibold text-admin-muted hover:text-admin-text border border-admin-border rounded-xl hover:bg-admin-surface transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <EmptyRow key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-admin-sidebar border border-admin-border rounded-2xl p-10 text-center">
            <p className="text-sm text-admin-muted mb-4">No hay servicios. Usa el botón "Cargar servicios por defecto" para empezar.</p>
          </div>
        ) : (
          gridData.map((group) => (
            <div key={group.id} className="bg-admin-sidebar border border-admin-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-admin-border bg-admin-surface/30">
                <h2 className="text-xs font-bold uppercase tracking-widest text-admin-muted">{group.label}</h2>
              </div>
              <div className="divide-y divide-admin-border">
                {group.items.map((svc) => {
                  const isEditing = editingId === svc.id;
                  return (
                    <div key={svc.id} className={`px-5 py-3.5 transition-colors ${!svc.active ? 'opacity-50' : ''}`}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              value={editValues.name}
                              onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))}
                              className="px-3 py-2 bg-admin-bg border border-brand-rose/40 rounded-lg text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors sm:col-span-2"
                            />
                            <input
                              value={editValues.price}
                              onChange={(e) => setEditValues((p) => ({ ...p, price: e.target.value }))}
                              placeholder="Precio"
                              className="px-3 py-2 bg-admin-bg border border-brand-rose/40 rounded-lg text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="5"
                                max="300"
                                value={editValues.duration_minutes}
                                onChange={(e) => setEditValues((p) => ({ ...p, duration_minutes: e.target.value }))}
                                className="w-20 px-2 py-1.5 bg-admin-bg border border-brand-rose/40 rounded-lg text-sm text-admin-text focus:outline-none"
                              />
                              <span className="text-xs text-admin-muted">min</span>
                            </div>
                            <select
                              value={editValues.category}
                              onChange={(e) => setEditValues((p) => ({ ...p, category: e.target.value }))}
                              className="px-2 py-1.5 bg-admin-bg border border-brand-rose/40 rounded-lg text-sm text-admin-text focus:outline-none"
                            >
                              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <button
                              onClick={() => saveEdit(svc.id)}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-rose-gold text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs text-admin-muted border border-admin-border rounded-lg hover:bg-admin-surface transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-admin-text">{svc.name}</p>
                            <p className="text-xs text-admin-muted">
                              {svc.duration_minutes ? `${svc.duration_minutes} min` : '—'}
                              {svc.price ? ` · ${svc.price}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleActive(svc)}
                              title={svc.active ? 'Desactivar' : 'Activar'}
                              className="p-1.5 text-admin-muted hover:text-brand-rose transition-colors"
                            >
                              {svc.active
                                ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                : <ToggleLeft className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => startEdit(svc)}
                              className="p-1.5 text-admin-muted hover:text-brand-rose transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteService(svc.id)}
                              className="p-1.5 text-admin-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default AdminServices;
