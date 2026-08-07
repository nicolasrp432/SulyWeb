// Formato de los avisos al equipo (asunto del correo y etiquetas de fecha).
//
// Vive aquí y no dentro de la Edge Function porque es lógica pura y conviene
// tenerla cubierta por tests: el cálculo de "hoy" depende de la zona horaria
// del salón, no de la del servidor (las Edge Functions corren en UTC), y ese
// tipo de fallo solo se nota de madrugada y en producción.

export const SALON_TZ = 'Europe/Madrid';

/** Fecha de hoy en el salón, como 'YYYY-MM-DD'. */
export function salonToday(now = new Date(), timeZone = SALON_TZ) {
  // 'en-CA' da el formato ISO (YYYY-MM-DD) ya convertido a la zona pedida.
  return now.toLocaleDateString('en-CA', { timeZone });
}

/** Días entre dos fechas 'YYYY-MM-DD', sin que el horario de verano moleste. */
function daysBetween(fromIso, toIso) {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/**
 * Etiqueta corta y legible de un día: "hoy", "mañana", "vie 8 ago".
 * Pensada para que el asunto se entienda de un vistazo en la pantalla de
 * bloqueo del móvil, sin abrir el correo.
 */
export function relativeDayLabel(dateIso, todayIso) {
  if (!dateIso) return '';
  const diff = daysBetween(todayIso, dateIso);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  if (diff === -1) return 'ayer';

  const [y, m, d] = dateIso.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1, d));
  // timeZone UTC: la fecha ya viene resuelta, solo se está dando formato.
  const opts = diff > 1 && diff < 7
    ? { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', timeZone: 'UTC' };
  return at.toLocaleDateString('es-ES', opts).replace(/\.$/, '').replace(/,/g, '');
}

/** 'HH:MM' a partir de 'HH:MM:SS' o 'HH:MM'. */
export function shortTime(timeStr) {
  return String(timeStr || '').slice(0, 5);
}

/** Nombre acortado: el asunto debe caber en la notificación del móvil. */
export function shortName(name, max = 24) {
  const clean = String(name || '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'Sin nombre';
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

const EVENT_PREFIX = {
  new: 'Nueva reserva',
  cancelled: 'Cancelación',
};

/**
 * Asunto del aviso: "Nueva reserva · Ana Gómez · mañana 10:00".
 * Antes era siempre "Nueva Reserva - Suly Pretty Nails", que obligaba a abrir
 * el correo para saber de quién y para cuándo era.
 */
export function buildSubject(event, booking, todayIso) {
  const prefix = EVENT_PREFIX[event] || EVENT_PREFIX.new;
  const when = [relativeDayLabel(booking?.booking_date, todayIso), shortTime(booking?.booking_time)]
    .filter(Boolean)
    .join(' ');
  return [prefix, shortName(booking?.client_name), when].filter(Boolean).join(' · ');
}
