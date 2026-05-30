import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CalendarFiltersDrawer = ({
  open,
  onClose,
  filterSearch,
  onFilterSearchChange,
  filterLocation,
  onFilterLocationChange,
  filterStatus,
  onFilterStatusChange,
  filterResponsible,
  onFilterResponsibleChange,
  locations = [],
  statusOptions = [],
  responsibleOptions = [],
  onClearAll,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full sm:w-96 bg-white border-l border-admin-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border shrink-0">
              <div>
                <h3 className="text-base font-bold text-admin-text">Filtros</h3>
                <p className="text-xs text-admin-muted mt-0.5">Refina las citas mostradas</p>
              </div>
              <button
                onClick={onClose}
                className="text-admin-muted hover:text-admin-text p-1.5 rounded-lg hover:bg-admin-surface transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-admin-text">Búsqueda</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                  <Input
                    className="pl-9 h-10 text-sm"
                    placeholder="Cliente, teléfono, email..."
                    value={filterSearch}
                    onChange={(e) => onFilterSearchChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-admin-text">Sede</Label>
                <select
                  value={filterLocation}
                  onChange={(e) => onFilterLocationChange(e.target.value)}
                  className="w-full px-3 h-10 bg-white border border-admin-border rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
                >
                  <option value="all">Todas las sedes</option>
                  {locations.map((l) => (
                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-admin-text">Estado de la cita</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => onFilterStatusChange(e.target.value)}
                  className="w-full px-3 h-10 bg-white border border-admin-border rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
                >
                  <option value="all">Todos los estados</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-admin-text">Responsable</Label>
                <select
                  value={filterResponsible}
                  onChange={(e) => onFilterResponsibleChange(e.target.value)}
                  className="w-full px-3 h-10 bg-white border border-admin-border rounded-xl text-admin-text text-sm focus:outline-none focus:border-brand-rose transition-colors"
                >
                  <option value="all">Todos los responsables</option>
                  {responsibleOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-admin-border">
                <p className="text-[11px] text-admin-muted leading-relaxed">
                  Los filtros se aplican en tiempo real al calendario. Puedes ver los activos como chips
                  bajo la barra superior y removerlos uno a uno.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-admin-border bg-admin-bg shrink-0 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Limpiar todo
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="bg-gradient-rose-gold text-white font-bold"
              >
                Aplicar
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CalendarFiltersDrawer;
