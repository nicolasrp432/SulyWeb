/**
 * Única fuente de verdad de la geometría de la rejilla horaria del calendario
 * admin (vistas Día y Semana) y helpers compartidos.
 *
 * IMPORTANTE: BookingCard calcula los deltas de drag/resize con SLOT_HEIGHT;
 * cualquier vista que posicione tarjetas debe usar estas mismas constantes o
 * el drag se descalibra silenciosamente.
 */

export const HOUR_START = 8;
export const HOUR_END = 20;
export const SLOT_HEIGHT = 64; // px por hora
export const SNAP_MINUTES = 15;

export const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
export const GRID_HEIGHT = HOURS.length * SLOT_HEIGHT;

export const timeToMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
};

export const minutesToTime = (totalMin) => {
  const safe = Math.max(0, Math.min(24 * 60 - 1, totalMin));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const bookingDuration = (booking) =>
  booking.meta?.duration_minutes || booking.duration_minutes || 30;

/** Posición vertical (px) de un booking dentro de la rejilla. */
export const computePosition = (booking) => {
  const minutes = timeToMinutes(booking.booking_time);
  const top = ((minutes - HOUR_START * 60) / 60) * SLOT_HEIGHT;
  const height = Math.max((bookingDuration(booking) / 60) * SLOT_HEIGHT, 36);
  return { top, height };
};

/** ¿El minuto (desde medianoche) cae dentro de algún tramo abierto? */
export const isMinuteInShifts = (minute, dayHours) => {
  if (!dayHours || dayHours.closed) return false;
  return dayHours.shifts.some(
    (s) => minute >= timeToMinutes(s.open) && minute < timeToMinutes(s.close)
  );
};

/**
 * Layout de solapamientos estilo Google Calendar: agrupa los bookings en
 * clusters que se solapan transitivamente y reparte cada cluster en columnas
 * (primera columna libre). Devuelve Map<id, { leftPct, widthPct }>.
 */
export const layoutOverlaps = (bookings) => {
  const events = bookings
    .map((b) => {
      const start = timeToMinutes(b.booking_time);
      return { id: b.id, start, end: start + Math.max(bookingDuration(b), 15) };
    })
    .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const layout = new Map();
  let cluster = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (!cluster.length) return;
    const cols = []; // cols[i] = minuto de fin del último evento en esa columna
    for (const ev of cluster) {
      let i = cols.findIndex((end) => end <= ev.start);
      if (i === -1) {
        i = cols.length;
        cols.push(ev.end);
      } else {
        cols[i] = ev.end;
      }
      ev.col = i;
    }
    const width = 100 / cols.length;
    for (const ev of cluster) {
      layout.set(ev.id, { leftPct: ev.col * width, widthPct: width });
    }
    cluster = [];
  };

  for (const ev of events) {
    if (cluster.length && ev.start >= clusterEnd) {
      flushCluster();
      clusterEnd = -1;
    }
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  flushCluster();

  return layout;
};
