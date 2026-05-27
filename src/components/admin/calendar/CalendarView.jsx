import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, Loader2 } from 'lucide-react';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { supabase } from '@/lib/customSupabaseClient';

const VIEWS = [
  { id: 'month', label: 'Mes' },
  { id: 'week',  label: 'Semana' },
  { id: 'day',   label: 'Día' },
];

const CalendarView = ({ onBookingClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState([]);
  const [blockModal, setBlockModal] = useState(null); // { date, hour } or null
  const [blockForm, setBlockForm] = useState({ reason: '', allDay: true, startTime: '09:00', endTime: '18:00' });
  const [savingBlock, setSavingBlock] = useState(false);

  const { bookings, blocks, loading, refetch } = useCalendarBookings(currentDate, view, locationId || undefined);

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
  }, []);

  const navigate = (dir) => {
    if (view === 'month') setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate((d) => dir === 1 ? addDays(d, 1) : subDays(d, 1));
  };

  const getTitle = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
    if (view === 'week') return `Semana del ${format(currentDate, 'd MMM', { locale: es })}`;
    return format(currentDate, "EEEE, d 'de' MMMM", { locale: es });
  };

  const openBlockModal = (date, hour) => {
    setBlockModal({ date, hour });
    setBlockForm({ reason: '', allDay: hour == null, startTime: hour ? `${String(hour).padStart(2, '0')}:00` : '09:00', endTime: hour ? `${String(hour + 1).padStart(2, '0')}:00` : '18:00' });
  };

  const saveBlock = async () => {
    if (!blockModal) return;
    setSavingBlock(true);
    const payload = {
      block_date: format(blockModal.date, 'yyyy-MM-dd'),
      location_id: locationId || null,
      reason: blockForm.reason || null,
      start_time: blockForm.allDay ? null : blockForm.startTime,
      end_time: blockForm.allDay ? null : blockForm.endTime,
    };
    const { error } = await supabase.from('schedule_blocks').insert([payload]);
    if (!error) { setBlockModal(null); refetch(); }
    setSavingBlock(false);
  };

  const removeBlock = async (blockId) => {
    await supabase.from('schedule_blocks').delete().eq('id', blockId);
    refetch();
  };

  return (
    <>
      <div className="flex flex-col h-full bg-admin-sidebar border border-admin-border rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-admin-border shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold bg-admin-surface text-admin-text rounded-lg hover:bg-admin-border transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="flex-1 text-sm font-semibold text-admin-text capitalize truncate min-w-0">{getTitle()}</h2>

          {/* Location filter */}
          {locations.length > 0 && (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="px-2 py-1.5 bg-admin-bg border border-admin-border rounded-lg text-xs text-admin-text focus:outline-none focus:border-brand-rose transition-colors"
            >
              <option value="">Todas las sedes</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}

          {/* View toggle */}
          <div className="flex bg-admin-bg rounded-lg p-0.5 gap-0.5 border border-admin-border">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  view === v.id
                    ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                    : 'text-admin-muted hover:text-admin-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-rose border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'month' ? (
          <MonthView
            date={currentDate}
            bookings={bookings}
            blocks={blocks}
            onBookingClick={onBookingClick}
            onDayClick={(d) => { setCurrentDate(d); setView('day'); }}
            onBlockClick={removeBlock}
          />
        ) : view === 'week' ? (
          <WeekView
            date={currentDate}
            bookings={bookings}
            blocks={blocks}
            onBookingClick={onBookingClick}
            onSlotClick={(d, h) => openBlockModal(d, h)}
            onBlockClick={removeBlock}
          />
        ) : (
          <DayView
            date={currentDate}
            bookings={bookings}
            blocks={blocks}
            onBookingClick={onBookingClick}
            onSlotClick={(d, h) => openBlockModal(d, h)}
            onBlockClick={removeBlock}
          />
        )}
      </div>

      {/* Block creation modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setBlockModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-brand-rose-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">Bloquear horario</h3>
                <p className="text-xs text-brand-mid">{format(blockModal.date, "d 'de' MMMM", { locale: es })}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-brand-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockForm.allDay}
                  onChange={(e) => setBlockForm((p) => ({ ...p, allDay: e.target.checked }))}
                  className="rounded accent-brand-rose"
                />
                Día completo
              </label>

              {!blockForm.allDay && (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-brand-mid mb-1">Desde</label>
                    <input
                      type="time"
                      value={blockForm.startTime}
                      onChange={(e) => setBlockForm((p) => ({ ...p, startTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-rose-50 border border-brand-rose-100 rounded-lg text-sm focus:outline-none focus:border-brand-rose transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-brand-mid mb-1">Hasta</label>
                    <input
                      type="time"
                      value={blockForm.endTime}
                      onChange={(e) => setBlockForm((p) => ({ ...p, endTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-rose-50 border border-brand-rose-100 rounded-lg text-sm focus:outline-none focus:border-brand-rose transition-colors"
                    />
                  </div>
                </div>
              )}

              <input
                value={blockForm.reason}
                onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Motivo (opcional)"
                className="w-full px-3 py-2 bg-brand-rose-50 border border-brand-rose-100 rounded-lg text-sm placeholder:text-brand-mid/50 focus:outline-none focus:border-brand-rose transition-colors"
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={saveBlock}
                disabled={savingBlock}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-gradient-rose-gold text-white font-semibold text-sm rounded-xl disabled:opacity-50 hover:brightness-105 transition-all shadow-rose-sm"
              >
                {savingBlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Bloquear
              </button>
              <button
                onClick={() => setBlockModal(null)}
                className="px-4 h-10 text-sm font-semibold text-brand-mid border border-brand-rose-100 rounded-xl hover:bg-brand-rose-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarView;
