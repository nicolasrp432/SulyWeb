import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarRange,
  CalendarDays, Plus, SlidersHorizontal, RefreshCw, Clock3, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const VIEW_MODES_ALL = [
  { value: 'day',   label: 'Día',    icon: CalendarIcon  },
  { value: 'week',  label: 'Semana', icon: CalendarRange },
  { value: 'month', label: 'Mes',    icon: CalendarDays  },
];

const headerLabel = (date, viewMode) => {
  if (viewMode === 'month') return format(date, "LLLL yyyy", { locale: es });
  if (viewMode === 'week')  return `Semana del ${format(date, "d 'de' LLLL", { locale: es })}`;
  return format(date, "EEEE, d 'de' LLLL", { locale: es });
};

const CalendarToolbar = ({
  date,
  viewMode,
  realtimeConnected,
  activeFilterCount = 0,
  isMobile = false,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onOpenFilters,
  onNewBooking,
  onBlock,
  onRefresh,
  onOpenHours,
}) => {
  const safeCount = activeFilterCount ?? 0;
  const VIEW_MODES = isMobile ? VIEW_MODES_ALL.filter((v) => v.value !== 'week') : VIEW_MODES_ALL;

  return (
    <div className="sticky top-0 z-20 bg-admin-bg/95 backdrop-blur-md border-b border-admin-border -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 py-3">
        {/* Navigation block */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} aria-label="Siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={onToday}>
            Hoy
          </Button>
        </div>

        <span className="text-sm font-bold text-admin-text capitalize mx-1 hidden sm:inline">
          {headerLabel(date, viewMode)}
        </span>

        <div className="grow" />

        {/* View selector */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-admin-border shadow-rose-xs">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = viewMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onViewChange(mode.value)}
                className={`h-7 px-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Realtime indicator */}
        <span
          className={`hidden lg:inline text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
            realtimeConnected
              ? 'text-emerald-600 border-emerald-200/60 bg-emerald-50'
              : 'text-amber-600 border-amber-200/60 bg-amber-50 animate-pulse'
          }`}
          title={realtimeConnected ? 'Conexión en tiempo real activa' : 'Reconectando...'}
        >
          {realtimeConnected ? '🟢 En vivo' : '🟡 Reconectando'}
        </span>

        {onRefresh && (
          <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:inline-flex" onClick={onRefresh} title="Actualizar">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {onOpenHours && (
          <Button variant="outline" size="sm" className="h-8 hidden md:inline-flex text-xs" onClick={onOpenHours} title="Horarios del salón">
            <Clock3 className="h-3.5 w-3.5 mr-1" /> Horarios
          </Button>
        )}

        {/* Filters */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 relative text-xs font-semibold border-admin-border hover:bg-admin-surface"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          Filtros
          {safeCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-extrabold bg-brand-rose text-white rounded-full">
              {safeCount}
            </span>
          )}
        </Button>

        {/* Block */}
        {onBlock && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={onBlock}
            title="Bloquear día u hora"
          >
            <Lock className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Bloquear</span>
          </Button>
        )}

        {/* New booking */}
        <Button
          size="sm"
          className="h-8 bg-gradient-rose-gold text-white font-bold shadow-rose-sm hover:shadow-rose-md transition-shadow"
          onClick={() => onNewBooking?.()}
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Nueva cita</span>
        </Button>
      </div>

      {/* Date label for mobile (below toolbar) */}
      <p className="sm:hidden max-w-7xl mx-auto text-xs font-bold text-admin-text capitalize pb-2">
        {headerLabel(date, viewMode)}
      </p>
    </div>
  );
};

export default CalendarToolbar;
