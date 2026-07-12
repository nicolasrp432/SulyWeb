import React from 'react';
import { X } from 'lucide-react';

const Chip = ({ label, value, onRemove }) => (
  <button
    type="button"
    onClick={onRemove}
    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-rose-50 text-brand-rose border border-brand-rose/30 text-[11px] font-semibold hover:bg-brand-rose hover:text-white transition-colors"
  >
    <span className="text-admin-muted group-hover:text-white/80 transition-colors">{label}:</span>
    <span className="font-bold">{value}</span>
    <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
  </button>
);

const ActiveFiltersChips = ({
  filterSearch,
  filterLocation,
  filterStatus,
  filterResponsible,
  filterOrigin,
  locations = [],
  statusOptions = [],
  sourceOptions = [],
  onClearSearch,
  onClearLocation,
  onClearStatus,
  onClearResponsible,
  onClearOrigin,
  onClearAll,
}) => {
  const items = [];

  if (filterSearch?.trim()) {
    items.push({ key: 'search', label: 'Búsqueda', value: `"${filterSearch.trim()}"`, onRemove: onClearSearch });
  }
  if (filterLocation && filterLocation !== 'all') {
    const loc = locations.find((l) => String(l.id) === String(filterLocation));
    items.push({ key: 'location', label: 'Sede', value: loc?.name || filterLocation, onRemove: onClearLocation });
  }
  if (filterStatus && filterStatus !== 'all') {
    const s = statusOptions.find((opt) => opt.value === filterStatus);
    items.push({ key: 'status', label: 'Estado', value: s?.label || filterStatus, onRemove: onClearStatus });
  }
  if (filterResponsible && filterResponsible !== 'all') {
    items.push({ key: 'responsible', label: 'Responsable', value: filterResponsible, onRemove: onClearResponsible });
  }
  if (filterOrigin && filterOrigin !== 'all') {
    const o = sourceOptions.find((opt) => opt.value === filterOrigin);
    items.push({ key: 'origin', label: 'Origen', value: o?.label || filterOrigin, onRemove: onClearOrigin });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-2 py-2 px-0.5">
      {items.map((it) => (
        <Chip key={it.key} label={it.label} value={it.value} onRemove={it.onRemove} />
      ))}
      {items.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-semibold text-admin-muted hover:text-admin-text underline underline-offset-2 ml-1"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
};

export default ActiveFiltersChips;
