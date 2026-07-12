export const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pendiente' },
  { value: 'confirmed',   label: 'Confirmada' },
  { value: 'rescheduled', label: 'Reprogramada' },
  { value: 'cancelled',   label: 'Cancelada' },
  { value: 'completed',   label: 'Completada' },
  { value: 'no_show',     label: 'No asistió' },
];

export const STATUS_LABEL = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  rescheduled: 'Reprogramada',
  cancelled:   'Cancelada',
  completed:   'Completada',
  no_show:     'No asistió',
};

export const STATUS_CHIP = {
  pending:     'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled:   'bg-rose-100 text-rose-800 border-rose-200',
  completed:   'bg-blue-100 text-blue-800 border-blue-200',
  no_show:     'bg-zinc-100 text-zinc-700 border-zinc-200',
};

// Punto de color por estado (vista mes, estilo Google Calendar).
export const STATUS_DOT = {
  pending:     'bg-amber-400',
  confirmed:   'bg-emerald-500',
  rescheduled: 'bg-purple-500',
  cancelled:   'bg-rose-400',
  completed:   'bg-blue-500',
  no_show:     'bg-zinc-400',
};

export const ORIGIN_LABEL = {
  online:     'Online',
  whatsapp:   'WhatsApp',
  presencial: 'Presencial',
  admin:      'Admin',
  calendar:   'Google/iPhone',
};

export const SOURCE_OPTIONS = [
  { value: 'online',     label: 'Online (web)' },
  { value: 'whatsapp',   label: 'WhatsApp' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'admin',      label: 'Admin' },
  { value: 'calendar',   label: 'Google/iPhone Calendar' },
];
