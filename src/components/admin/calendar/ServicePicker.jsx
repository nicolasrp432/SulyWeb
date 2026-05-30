import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Scissors, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const ServicePicker = ({ selectedIds = [], onChange, otherText = '', onOtherChange }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showOther, setShowOther] = useState(Boolean(otherText));

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from('services')
      .select('id,name,duration_minutes,price,category')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setServices(data || []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const toggle = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange?.(next);
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const hasOther = Boolean(otherText?.trim());

  return (
    <div className="space-y-2">
      {(selectedServices.length > 0 || hasOther) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedServices.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-rose-50 border border-brand-rose/30 text-brand-rose text-[11px] font-semibold">
              {s.name}
              <button type="button" onClick={() => toggle(s.id)} aria-label={`Quitar ${s.name}`}>
                <X className="w-3 h-3 opacity-70 hover:opacity-100" />
              </button>
            </span>
          ))}
          {hasOther && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-semibold">
              {otherText}
              <button type="button" onClick={() => { onOtherChange?.(''); setShowOther(false); }} aria-label="Quitar servicio personalizado">
                <X className="w-3 h-3 opacity-70 hover:opacity-100" />
              </button>
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 rounded-xl border border-dashed border-admin-border bg-white hover:border-brand-rose/50 hover:bg-brand-rose-50/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm">
          <Scissors className="w-4 h-4 text-admin-muted" />
          {selectedServices.length === 0 && !hasOther ? (
            <span className="italic font-normal text-gray-400">Selecciona servicios...</span>
          ) : (
            <span className="text-admin-text font-medium">
              {selectedServices.length + (hasOther ? 1 : 0)} seleccionado{(selectedServices.length + (hasOther ? 1 : 0)) === 1 ? '' : 's'}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-admin-muted" /> : <ChevronDown className="w-4 h-4 text-admin-muted" />}
      </button>

      {open && (
        <div className="rounded-xl border border-admin-border bg-white shadow-rose-xs overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto divide-y divide-admin-border/50">
            {loading ? (
              <p className="text-xs text-admin-muted text-center py-4">Cargando servicios...</p>
            ) : services.length === 0 ? (
              <p className="text-xs text-admin-muted text-center py-4">No hay servicios configurados.</p>
            ) : services.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-admin-surface/50 transition-colors ${selected ? 'bg-brand-rose-50/40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(s.id)}
                    className="w-4 h-4 rounded border-admin-border text-brand-rose focus:ring-brand-rose"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-admin-text truncate">{s.name}</p>
                    {(s.duration_minutes || s.price) && (
                      <p className="text-[11px] text-admin-muted truncate">
                        {s.duration_minutes ? `${s.duration_minutes} min` : ''}
                        {s.duration_minutes && s.price ? ' · ' : ''}
                        {s.price ? s.price : ''}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="border-t border-admin-border bg-admin-bg p-2">
            {showOther ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => onOtherChange?.(e.target.value)}
                  placeholder="Escribe el servicio..."
                  className="flex-1 h-9 px-3 rounded-lg border border-admin-border text-sm placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-brand-rose"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { onOtherChange?.(''); setShowOther(false); }}
                  className="text-xs font-semibold text-admin-muted hover:text-admin-text px-2"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowOther(true)}
                className="w-full flex items-center justify-center gap-1.5 h-9 text-xs font-bold text-brand-rose hover:bg-brand-rose-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Otro servicio (texto libre)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePicker;
