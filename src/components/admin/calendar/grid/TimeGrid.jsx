import React, { useEffect, useMemo, useRef } from 'react';
import { Lock } from 'lucide-react';
import BookingCard from '../BookingCard';
import NowIndicator from '../NowIndicator';
import {
  HOURS,
  HOUR_START,
  HOUR_END,
  SLOT_HEIGHT,
  GRID_HEIGHT,
  timeToMinutes,
  minutesToTime,
  computePosition,
  isMinuteInShifts,
  layoutOverlaps,
} from './timeGridUtils';

/**
 * Rejilla horaria compartida por las vistas Día (columna = manicurista) y
 * Semana (columna = día). Cada columna trae sus propios bookings, bloqueos y
 * horario de apertura, por lo que los overlays se pintan por columna.
 *
 * columns: [{
 *   key, header (nodo), date (Date), bookings, blocks, dayHours (config
 *   normalizada de businessHours o null), isToday, staff (o null),
 *   emptyHint (nodo opcional cuando la columna no tiene citas)
 * }]
 */
const TimeGrid = ({
  columns,
  gutterWidth = 64,
  colMinWidth = '160px',
  snapClickMinutes = 30,
  autoScrollToNow = true,
  maxHeightClass = 'max-h-[72vh]',
  enableDrag = true,
  horizontalSnap = false, // móvil: scroll horizontal con snap por columna
  onBookingClick,
  onSlotClick, // (col, 'HH:MM')
  onBlockClick,
  onMoveBooking, // (bookingId, 'HH:MM', col)
  onResizeBooking,
}) => {
  const scrollRef = useRef(null);

  const gridTemplateColumns = `${gutterWidth}px repeat(${columns.length}, minmax(${colMinWidth}, 1fr))`;

  // Layout de solapamientos por columna (memoizado sobre la lista de columnas).
  const overlapByColumn = useMemo(() => {
    const map = new Map();
    for (const col of columns) map.set(col.key, layoutOverlaps(col.bookings || []));
    return map;
  }, [columns]);

  // Auto-scroll inicial: a "ahora − 1h" si hoy está visible, si no a las 10:00.
  useEffect(() => {
    if (!autoScrollToNow || !scrollRef.current) return;
    const anyToday = columns.some((c) => c.isToday);
    const now = new Date();
    const targetMin = anyToday
      ? Math.max(HOUR_START * 60, now.getHours() * 60 + now.getMinutes() - 60)
      : 10 * 60;
    const top = ((targetMin - HOUR_START * 60) / 60) * SLOT_HEIGHT;
    scrollRef.current.scrollTo({ top: Math.max(0, top) });
    // Solo al montar: no queremos re-scroll con cada refetch realtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columnMeta = (col) => {
    const blocks = col.blocks || [];
    const hasFullDayBlock = blocks.some((b) => !b.start_time);
    const isClosed = !!col.dayHours && (col.dayHours.closed || col.dayHours.shifts.length === 0);
    return { blocks, hasFullDayBlock, isClosed };
  };

  const handleColumnClick = (e, col) => {
    const { hasFullDayBlock, isClosed, blocks } = columnMeta(col);
    if (isClosed || hasFullDayBlock) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMin = HOUR_START * 60 + (offsetY / SLOT_HEIGHT) * 60;
    const snapped = Math.floor(rawMin / snapClickMinutes) * snapClickMinutes;
    const clamped = Math.max(HOUR_START * 60, Math.min(snapped, HOUR_END * 60 + 60 - snapClickMinutes));

    if (col.dayHours && !isMinuteInShifts(clamped, col.dayHours)) return;

    const timeStr = minutesToTime(clamped);
    const isBlockedAt = blocks.some(
      (b) => b.start_time &&
        timeToMinutes(b.start_time) <= clamped &&
        timeToMinutes(b.end_time || '23:59') > clamped
    );
    if (isBlockedAt) return;

    onSlotClick?.(col, timeStr);
  };

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-auto overscroll-contain ${maxHeightClass} ${
        horizontalSnap ? 'snap-x snap-mandatory' : ''
      }`}
    >
      {/* Cabecera sticky */}
      <div
        className="grid sticky top-0 z-20 bg-white border-b border-admin-border min-w-max md:min-w-0"
        style={{ gridTemplateColumns }}
      >
        <div className="sticky left-0 z-30 bg-white border-r border-transparent" />
        {columns.map((col) => (
          <div key={col.key} className="border-l border-admin-border/60 snap-start">
            {col.header}
          </div>
        ))}
      </div>

      {/* Cuerpo */}
      <div
        className="grid relative min-w-max md:min-w-0"
        style={{ gridTemplateColumns, height: GRID_HEIGHT }}
      >
        {/* Columna de horas (sticky en scroll horizontal móvil) */}
        <div className="relative sticky left-0 z-10 bg-white border-r border-admin-border/40">
          {HOURS.map((h, idx) => (
            <div
              key={h}
              className="absolute left-0 right-0 text-[10px] text-admin-muted font-semibold text-right pr-2 -translate-y-1.5"
              style={{ top: idx * SLOT_HEIGHT }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {columns.map((col) => {
          const { blocks, hasFullDayBlock, isClosed } = columnMeta(col);
          const overlapLayout = overlapByColumn.get(col.key);

          return (
            <div
              key={col.key}
              className="relative border-l border-admin-border/60 cursor-pointer snap-start"
              onClick={(e) => handleColumnClick(e, col)}
            >
              {/* Líneas de hora + media hora + overlays fuera de horario/bloqueado */}
              {HOURS.map((h, idx) => {
                const hStr = `${String(h).padStart(2, '0')}:00`;
                const blocked = hasFullDayBlock || blocks.some(
                  (b) => b.start_time && b.start_time <= hStr && (b.end_time ?? '23:59') > hStr
                );
                const outOfHours = col.dayHours && !isMinuteInShifts(h * 60, col.dayHours) &&
                  !isMinuteInShifts(h * 60 + 30, col.dayHours);
                return (
                  <div
                    key={h}
                    className={`absolute left-0 right-0 border-t border-admin-border/40 ${
                      blocked
                        ? 'bg-amber-50/40'
                        : outOfHours
                        ? 'bg-zinc-100/70 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_8px)]'
                        : ''
                    }`}
                    style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  >
                    <div className="absolute left-0 right-0 border-t border-dashed border-admin-border/25" style={{ top: SLOT_HEIGHT / 2 }} />
                  </div>
                );
              })}

              {/* Overlay de día completo bloqueado / cerrado */}
              {(hasFullDayBlock || isClosed) && (
                <div className={`absolute inset-0 pointer-events-none flex items-start justify-center pt-3 z-[5] ${
                  hasFullDayBlock
                    ? 'bg-amber-100/40 border-l-2 border-amber-300'
                    : 'bg-zinc-200/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.05)_8px,rgba(0,0,0,0.05)_10px)]'
                }`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/80 ${
                    hasFullDayBlock ? 'text-amber-700' : 'text-zinc-600'
                  }`}>
                    {hasFullDayBlock ? 'Bloqueado' : 'Cerrado'}
                  </span>
                </div>
              )}

              {/* Bloqueos parciales */}
              {!hasFullDayBlock && blocks.filter((b) => b.start_time).map((b) => {
                const startMin = timeToMinutes(b.start_time);
                const endMin = timeToMinutes(b.end_time || '23:59');
                const top = ((startMin - HOUR_START * 60) / 60) * SLOT_HEIGHT;
                const height = ((endMin - startMin) / 60) * SLOT_HEIGHT;
                return (
                  <button
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBlockClick?.(b.id); }}
                    className="absolute left-1 right-1 bg-amber-100/70 border border-amber-300 border-l-4 border-l-amber-500 rounded-md flex items-center justify-center gap-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition-colors overflow-hidden"
                    style={{ top, height }}
                    title={b.reason || 'Bloqueado'}
                  >
                    <Lock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{b.reason || 'Bloqueado'}</span>
                  </button>
                );
              })}

              {/* Línea de hora actual */}
              {col.isToday && !isClosed && (
                <NowIndicator hourStart={HOUR_START} hourEnd={HOUR_END} slotHeight={SLOT_HEIGHT} />
              )}

              {/* Citas */}
              {(col.bookings || []).map((b) => {
                const { top, height } = computePosition(b);
                return (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onClick={onBookingClick}
                    style={{ top, height }}
                    layout={overlapLayout?.get(b.id)}
                    onMove={enableDrag && onMoveBooking ? (id, time) => onMoveBooking(id, time, col) : undefined}
                    onResize={enableDrag ? onResizeBooking : undefined}
                    hourStart={HOUR_START}
                  />
                );
              })}

              {col.emptyHint && (col.bookings || []).length === 0 ? col.emptyHint : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeGrid;
