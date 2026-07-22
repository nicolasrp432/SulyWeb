/**
 * Helpers de horario de apertura.
 *
 * Soporta el esquema NUEVO con tramos partidos:
 *   { closed: false, shifts: [ { open: '10:00', close: '14:00' }, { open: '16:00', close: '20:00' } ] }
 * y normaliza el esquema VIEJO de un solo tramo:
 *   { open: '10:00', close: '20:00', closed: false }
 *
 * Reutilizado por la reserva pública y el panel admin para no duplicar lógica.
 */

export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DEFAULT_BUSINESS_HOURS = {
  monday:    { closed: false, shifts: [{ open: '10:00', close: '20:00' }] },
  tuesday:   { closed: false, shifts: [{ open: '10:00', close: '20:00' }] },
  wednesday: { closed: false, shifts: [{ open: '10:00', close: '20:00' }] },
  thursday:  { closed: false, shifts: [{ open: '10:00', close: '20:00' }] },
  friday:    { closed: false, shifts: [{ open: '10:00', close: '20:00' }] },
  saturday:  { closed: false, shifts: [{ open: '10:00', close: '17:00' }] },
  sunday:    { closed: true,  shifts: [] },
};

/** 'HH:MM' o 'HH:MM:SS' -> minutos desde medianoche. */
export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutos -> 'HH:MM' */
export function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Normaliza la config de un día a { closed, shifts: [{open, close}] },
 * aceptando tanto el esquema nuevo como el viejo.
 */
export function normalizeDayConfig(cfg) {
  if (!cfg) return { closed: false, shifts: [] };
  if (cfg.closed) return { closed: true, shifts: [] };

  if (Array.isArray(cfg.shifts)) {
    const shifts = cfg.shifts
      .filter((s) => s && s.open && s.close)
      .map((s) => ({ open: s.open, close: s.close }));
    return { closed: false, shifts };
  }

  if (cfg.open && cfg.close) {
    return { closed: false, shifts: [{ open: cfg.open, close: cfg.close }] };
  }

  return { closed: false, shifts: [] };
}

/** Devuelve la config (normalizada) del día de una fecha dada. */
export function getDayConfig(date, businessHours) {
  const key = DAY_KEYS[date.getDay()];
  return normalizeDayConfig(businessHours?.[key]);
}

/** ¿El día está cerrado (sin tramos)? */
export function isDayClosed(date, businessHours) {
  const cfg = getDayConfig(date, businessHours);
  return cfg.closed || cfg.shifts.length === 0;
}

/** ¿Dos fechas caen en el mismo día natural (hora local)? */
function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * Genera los slots ('HH:MM') de un día recorriendo todos los tramos abiertos.
 * Si dos tramos se solapan o repiten un slot, se deduplica y ordena.
 *
 * @param {Object} [options]
 * @param {Date}   [options.now]       Si se pasa y `date` es hoy, se descartan
 *                                     los slots ya pasados (más el margen).
 * @param {number} [options.marginMin] Minutos de antelación mínima para hoy (30).
 */
export function generateDaySlots(date, businessHours, intervalMin = 30, options = {}) {
  if (!date) return [];
  const cfg = getDayConfig(date, businessHours);
  if (cfg.closed) return [];

  const set = new Set();
  for (const shift of cfg.shifts) {
    const open = timeToMinutes(shift.open);
    const close = timeToMinutes(shift.close);
    if (open == null || close == null || close <= open) continue;
    for (let m = open; m < close; m += intervalMin) {
      set.add(m);
    }
  }

  let slots = [...set].sort((a, b) => a - b);

  // Para el día de hoy, ocultar las horas ya pasadas (con margen de antelación).
  const { now, marginMin = 30 } = options;
  if (now && isSameLocalDay(date, now)) {
    const cutoff = now.getHours() * 60 + now.getMinutes() + marginMin;
    slots = slots.filter((m) => m >= cutoff);
  }

  return slots.map(minutesToTime);
}
