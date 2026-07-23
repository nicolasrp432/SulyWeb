import { describe, it, expect } from 'vitest';
import {
  DAY_KEYS, timeToMinutes, minutesToTime, normalizeDayConfig, generateDaySlots,
} from './businessHours';

// Horario con el mismo tramo todos los días (evita acoplar a un día concreto).
const allDays = (shifts) => Object.fromEntries(DAY_KEYS.map((k) => [k, { closed: false, shifts }]));

describe('timeToMinutes / minutesToTime', () => {
  it('convierte HH:MM a minutos', () => {
    expect(timeToMinutes('10:00')).toBe(600);
    expect(timeToMinutes('10:30')).toBe(630);
    expect(timeToMinutes('00:00')).toBe(0);
  });
  it('ida y vuelta', () => {
    expect(minutesToTime(630)).toBe('10:30');
    expect(minutesToTime(600)).toBe('10:00');
  });
});

describe('normalizeDayConfig', () => {
  it('normaliza el esquema viejo de un solo tramo', () => {
    expect(normalizeDayConfig({ open: '10:00', close: '20:00', closed: false }))
      .toEqual({ closed: false, shifts: [{ open: '10:00', close: '20:00' }] });
  });
  it('respeta cerrado', () => {
    expect(normalizeDayConfig({ closed: true })).toEqual({ closed: true, shifts: [] });
  });
});

describe('generateDaySlots', () => {
  const date = new Date('2026-03-16T00:00:00'); // fecha cualquiera

  it('genera los slots de un tramo simple', () => {
    const slots = generateDaySlots(date, allDays([{ open: '10:00', close: '14:00' }]), 30);
    expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30']);
  });

  it('deduplica y ordena tramos solapados', () => {
    const slots = generateDaySlots(date, allDays([
      { open: '10:00', close: '11:00' },
      { open: '10:30', close: '12:00' },
    ]), 30);
    expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30']);
  });

  it('devuelve vacío si el día está cerrado', () => {
    const hours = allDays([{ open: '10:00', close: '14:00' }]);
    DAY_KEYS.forEach((k) => { hours[k] = { closed: true, shifts: [] }; });
    expect(generateDaySlots(date, hours, 30)).toEqual([]);
  });

  it('filtra las horas ya pasadas de HOY con el margen', () => {
    const hours = allDays([{ open: '10:00', close: '14:00' }]);
    const now = new Date(date); now.setHours(12, 0, 0, 0); // hoy a las 12:00
    // cutoff = 12:00 + 30 = 12:30 -> solo 12:30, 13:00, 13:30
    expect(generateDaySlots(date, hours, 30, { now })).toEqual(['12:30', '13:00', '13:30']);
  });

  it('no filtra si el día no es hoy', () => {
    const hours = allDays([{ open: '10:00', close: '14:00' }]);
    const now = new Date('2026-03-17T12:00:00'); // otro día
    expect(generateDaySlots(date, hours, 30, { now })).toHaveLength(8);
  });
});
