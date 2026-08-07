import { describe, it, expect } from 'vitest';
import {
  salonToday, relativeDayLabel, shortTime, shortName, buildSubject,
} from './notifyFormat.js';

describe('salonToday', () => {
  it('usa la fecha del salón, no la del servidor en UTC', () => {
    // 22:30 en Madrid del 5 de agosto son las 20:30 UTC del mismo día.
    expect(salonToday(new Date('2026-08-05T20:30:00Z'))).toBe('2026-08-05');
  });

  it('a medianoche pasada en Madrid ya es el día siguiente aunque en UTC no', () => {
    // 00:30 del 6 de agosto en Madrid (verano, UTC+2) son las 22:30 UTC del 5.
    expect(salonToday(new Date('2026-08-05T22:30:00Z'))).toBe('2026-08-06');
  });

  it('funciona también en horario de invierno (UTC+1)', () => {
    // 00:30 del 6 de enero en Madrid son las 23:30 UTC del 5.
    expect(salonToday(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01-06');
  });
});

describe('relativeDayLabel', () => {
  it('dice "hoy" y "mañana"', () => {
    expect(relativeDayLabel('2026-08-05', '2026-08-05')).toBe('hoy');
    expect(relativeDayLabel('2026-08-06', '2026-08-05')).toBe('mañana');
  });

  it('dice "ayer" para una cancelación de una cita ya pasada', () => {
    expect(relativeDayLabel('2026-08-04', '2026-08-05')).toBe('ayer');
  });

  it('incluye el día de la semana dentro de la semana siguiente', () => {
    // 8 de agosto de 2026 es sábado.
    expect(relativeDayLabel('2026-08-08', '2026-08-05')).toMatch(/^s[áa]b 8 ago$/);
  });

  it('omite el día de la semana cuando queda lejos', () => {
    expect(relativeDayLabel('2026-09-20', '2026-08-05')).toBe('20 sept');
  });

  it('cruza bien el cambio de mes y de año', () => {
    expect(relativeDayLabel('2027-01-01', '2026-12-31')).toBe('mañana');
    expect(relativeDayLabel('2026-09-01', '2026-08-31')).toBe('mañana');
  });

  it('no se descuadra en el cambio de hora de octubre', () => {
    // El 25/10/2026 se atrasa el reloj: sin aritmética en UTC saldría "hoy".
    expect(relativeDayLabel('2026-10-25', '2026-10-24')).toBe('mañana');
  });

  it('devuelve cadena vacía si no hay fecha', () => {
    expect(relativeDayLabel('', '2026-08-05')).toBe('');
  });
});

describe('shortTime', () => {
  it('recorta los segundos', () => {
    expect(shortTime('10:00:00')).toBe('10:00');
    expect(shortTime('10:00')).toBe('10:00');
    expect(shortTime(null)).toBe('');
  });
});

describe('shortName', () => {
  it('deja los nombres normales tal cual', () => {
    expect(shortName('Ana Gómez')).toBe('Ana Gómez');
  });

  it('recorta los muy largos para que el asunto quepa en el móvil', () => {
    const out = shortName('María Fernández Etxebarria Gorostiaga');
    expect(out.length).toBeLessThanOrEqual(24);
    expect(out.endsWith('…')).toBe(true);
  });

  it('normaliza espacios y cubre el caso sin nombre', () => {
    expect(shortName('  Ana   Gómez  ')).toBe('Ana Gómez');
    expect(shortName('')).toBe('Sin nombre');
    expect(shortName(undefined)).toBe('Sin nombre');
  });
});

describe('buildSubject', () => {
  const booking = { client_name: 'Ana Gómez', booking_date: '2026-08-06', booking_time: '10:00:00' };

  it('se entiende sin abrir el correo', () => {
    expect(buildSubject('new', booking, '2026-08-05')).toBe('Nueva reserva · Ana Gómez · mañana 10:00');
  });

  it('distingue la cancelación', () => {
    expect(buildSubject('cancelled', booking, '2026-08-05')).toBe('Cancelación · Ana Gómez · mañana 10:00');
  });

  it('cae en "nueva reserva" ante un evento desconocido', () => {
    expect(buildSubject('loquesea', booking, '2026-08-05')).toMatch(/^Nueva reserva/);
  });

  it('aguanta una reserva sin fecha ni nombre', () => {
    expect(buildSubject('new', {}, '2026-08-05')).toBe('Nueva reserva · Sin nombre');
  });
});
