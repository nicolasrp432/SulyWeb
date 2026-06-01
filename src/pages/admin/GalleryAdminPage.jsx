import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Star, Upload, Loader2, X, Image } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';

const CATEGORIES = [
  { id: 'manicure',   label: 'Manicura' },
  { id: 'pedicure',   label: 'Pedicura' },
  { id: 'nail-art',   label: 'Diseños' },
  { id: 'treatments', label: 'Tratamientos' },
];

const GalleryAdminPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'manicure', featured: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const fileInputRef = useRef();

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('gallery_images')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (fetchErr) showError('Error al cargar imágenes: ' + fetchErr.message);
    setImages(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchImages();
    const channel = supabase
      .channel('admin-gallery-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, fetchImages)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchImages]);

  const visibleImages = useMemo(() => {
    if (activeTab === 'all') return images;
    return images.filter((i) => i.category === activeTab);
  }, [images, activeTab]);

  const countByCat = useMemo(() => {
    const c = { all: images.length };
    CATEGORIES.forEach((cat) => { c[cat.id] = images.filter((i) => i.category === cat.id).length; });
    return c;
  }, [images]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split('.').pop();
    // Object key only — the bucket is already named "gallery"; prefixing here doubled the path.
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('gallery').upload(path, selectedFile, { upsert: false });
    if (uploadErr) { showError('Error al subir imagen: ' + uploadErr.message); return null; }
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!selectedFile && !form.title) return;
    setUploading(true);
    const imageUrl = await uploadImage();
    if (!imageUrl) { setUploading(false); return; }

    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.display_order ?? 0)) : 0;
    const { data, error: insertErr } = await supabase
      .from('gallery_images')
      .insert([{
        title: form.title || selectedFile.name.replace(/\.[^.]+$/, ''),
        description: form.description || null,
        category: form.category,
        image_url: imageUrl,
        featured: form.featured,
        display_order: maxOrder + 1,
        active: true,
      }])
      .select()
      .single();

    if (insertErr) showError('Error al guardar: ' + insertErr.message);
    else {
      setImages((prev) => [data, ...prev]);
      setForm({ title: '', description: '', category: 'manicure', featured: false });
      setSelectedFile(null);
      setPreview('');
      setShowForm(false);
      showFlash('Imagen añadida correctamente');
    }
    setUploading(false);
  };

  const toggleFeatured = async (img) => {
    const { error: updateErr } = await supabase
      .from('gallery_images')
      .update({ featured: !img.featured })
      .eq('id', img.id);
    if (updateErr) showError('Error al actualizar');
    else setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, featured: !i.featured } : i));
  };

  const toggleActive = async (img) => {
    const { error: updateErr } = await supabase
      .from('gallery_images')
      .update({ active: !img.active })
      .eq('id', img.id);
    if (updateErr) showError('Error al actualizar');
    else setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, active: !i.active } : i));
  };

  const deleteImage = async (img) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    const path = img.image_url?.split('/storage/v1/object/public/gallery/')[1];
    if (path) await supabase.storage.from('gallery').remove([path]);
    const { error: deleteErr } = await supabase.from('gallery_images').delete().eq('id', img.id);
    if (deleteErr) showError('Error al eliminar: ' + deleteErr.message);
    else { setImages((prev) => prev.filter((i) => i.id !== img.id)); showFlash('Imagen eliminada'); }
  };

  return (
    <>
      <Helmet><title>Galería — Admin Suly</title></Helmet>
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          icon={Image}
          title="Galería"
          subtitle={`${images.length} imágenes · ${images.filter((i) => i.active).length} publicadas`}
          actions={
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Subir imagen
            </button>
          }
        />

        {flash && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{flash}</p>}
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

        {/* Upload form */}
        {showForm && (
          <div className="bg-admin-sidebar border border-admin-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-admin-text">Subir nueva imagen</h3>
              <button onClick={() => { setShowForm(false); setPreview(''); setSelectedFile(null); }} className="text-admin-muted hover:text-admin-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File drop / picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-admin-border rounded-xl cursor-pointer hover:border-brand-rose/60 hover:bg-admin-surface/50 transition-all overflow-hidden"
              style={{ minHeight: '180px' }}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full max-h-64 object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-admin-muted">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">Haz click para seleccionar imagen</p>
                  <p className="text-xs">JPG, PNG, WEBP — máx. 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título (opcional)"
                className="px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-brand-rose transition-colors"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descripción (opcional)"
              className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-brand-rose transition-colors"
            />
            <label className="flex items-center gap-2 text-sm text-admin-text cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                className="rounded accent-brand-rose"
              />
              Marcar como destacada
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || uploading}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-rose-gold text-white text-xs font-semibold rounded-xl disabled:opacity-50 hover:brightness-105 transition-all"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Subiendo...' : 'Subir imagen'}
              </button>
              <button
                onClick={() => { setShowForm(false); setPreview(''); setSelectedFile(null); }}
                className="px-4 py-2 text-xs font-semibold text-admin-muted border border-admin-border rounded-xl hover:bg-admin-surface transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tabs por categoría */}
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
            Todas <span className="ml-1 opacity-80">({countByCat.all})</span>
          </button>
          {CATEGORIES.map((cat) => {
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`h-9 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface'
                }`}
              >
                {cat.label} <span className="opacity-80">({countByCat[cat.id] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Image grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-admin-surface animate-pulse" />
            ))}
          </div>
        ) : visibleImages.length === 0 ? (
          <div className="bg-white border border-admin-border rounded-2xl p-12 text-center shadow-rose-xs">
            <Image className="h-10 w-10 text-admin-muted/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-admin-text">Sin imágenes en esta categoría</p>
            <p className="text-xs text-admin-muted mt-1">Sube la primera con el botón "Subir imagen".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleImages.map((img) => (
              <div
                key={img.id}
                className={`relative group rounded-2xl overflow-hidden bg-admin-surface aspect-square ${!img.active ? 'opacity-50' : ''}`}
              >
                <img
                  src={img.image_url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {img.featured && (
                  <span className="absolute top-2 left-2 bg-gradient-rose-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-rose-sm">
                    Destacada
                  </span>
                )}

                {!img.active && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Oculta
                  </span>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                  <p className="text-white text-xs font-semibold text-center px-2 leading-tight">{img.title}</p>
                  <p className="text-white/70 text-[10px]">
                    {CATEGORIES.find((c) => c.id === img.category)?.label}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => toggleFeatured(img)}
                      title="Destacar"
                      className={`p-1.5 rounded-lg transition-colors ${img.featured ? 'bg-brand-gold/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(img)}
                      title={img.active ? 'Ocultar' : 'Mostrar'}
                      className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors text-xs font-bold px-2"
                    >
                      {img.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button
                      onClick={() => deleteImage(img)}
                      title="Eliminar"
                      className="p-1.5 rounded-lg bg-red-500/70 text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GalleryAdminPage;
