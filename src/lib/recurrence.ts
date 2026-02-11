/**
 * Utilidades para calcular la siguiente ocurrencia de una tarea recurrente.
 * Modelo minimalista: una tarea, una regla, una fecha viva.
 */

import type { RecurrenceRule, RecurrenceFrequency } from './types';

/**
 * Calcula la siguiente fecha de ocurrencia basándose en la regla de recurrencia.
 * @param currentDueDate - La fecha actual de la tarea (ISO string)
 * @param rule - La regla de recurrencia
 * @returns La siguiente fecha (ISO string) o null si la recurrencia ha terminado
 */
export function calculateNextOccurrence(
  currentDueDate: string | undefined,
  rule: RecurrenceRule
): string | null {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
  const now = new Date();
  
  // Asegurar que partimos de una fecha válida
  if (isNaN(baseDate.getTime())) {
    return null;
  }

  let nextDate: Date;

  switch (rule.frequency) {
    case 'daily':
      nextDate = addDays(baseDate, rule.interval);
      break;

    case 'weekly':
      nextDate = calculateNextWeekly(baseDate, rule);
      break;

    case 'monthly':
      nextDate = calculateNextMonthly(baseDate, rule);
      break;

    case 'yearly':
      nextDate = calculateNextYearly(baseDate, rule);
      break;

    default:
      return null;
  }

  // Si la siguiente fecha es en el pasado, avanzar hasta el futuro
  while (nextDate <= now) {
    switch (rule.frequency) {
      case 'daily':
        nextDate = addDays(nextDate, rule.interval);
        break;
      case 'weekly':
        nextDate = calculateNextWeekly(nextDate, rule);
        break;
      case 'monthly':
        nextDate = calculateNextMonthly(nextDate, rule);
        break;
      case 'yearly':
        nextDate = calculateNextYearly(nextDate, rule);
        break;
    }
  }

  // Verificar si la recurrencia ha terminado
  if (rule.endsAt) {
    const endsAt = new Date(rule.endsAt);
    if (nextDate > endsAt) {
      return null; // La recurrencia ha terminado
    }
  }

  return nextDate.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateNextWeekly(baseDate: Date, rule: RecurrenceRule): Date {
  if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    // Buscar el siguiente día de la semana en la lista
    const currentDay = baseDate.getDay(); // 0=Dom..6=Sáb
    const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);
    
    // Buscar el siguiente día después del actual en la misma semana
    const nextDayInWeek = sortedDays.find(d => d > currentDay);
    
    if (nextDayInWeek !== undefined) {
      // Hay otro día esta semana
      const diff = nextDayInWeek - currentDay;
      return addDays(baseDate, diff);
    } else {
      // Siguiente semana (o N semanas), primer día de la lista
      const firstDay = sortedDays[0];
      const daysUntilNextWeek = 7 * rule.interval - currentDay + firstDay;
      return addDays(baseDate, daysUntilNextWeek);
    }
  }

  // Sin días específicos: simplemente N semanas después
  return addDays(baseDate, 7 * rule.interval);
}

function calculateNextMonthly(baseDate: Date, rule: RecurrenceRule): Date {
  const result = new Date(baseDate);
  result.setMonth(result.getMonth() + rule.interval);

  if (rule.dayOfMonth) {
    // Fijar al día del mes específico
    const targetDay = rule.dayOfMonth;
    const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(targetDay, maxDay));
  }

  return result;
}

function calculateNextYearly(baseDate: Date, rule: RecurrenceRule): Date {
  const result = new Date(baseDate);
  result.setFullYear(result.getFullYear() + rule.interval);

  if (rule.monthOfYear) {
    result.setMonth(rule.monthOfYear - 1); // monthOfYear es 1-based
  }
  if (rule.dayOfMonth) {
    const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(rule.dayOfMonth, maxDay));
  }

  return result;
}

/**
 * Obtiene el label legible de una regla de recurrencia
 */
export function getRecurrenceLabel(rule: RecurrenceRule): string {
  const { frequency, interval, daysOfWeek, dayOfMonth } = rule;
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  switch (frequency) {
    case 'daily':
      if (interval === 1) return 'Cada día';
      return `Cada ${interval} días`;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        const days = daysOfWeek.sort((a, b) => a - b).map(d => dayNames[d]);
        if (interval === 1) {
          if (daysOfWeek.length === 1) return `Cada ${dayNamesFull[daysOfWeek[0]]}`;
          return `Cada ${days.join(', ')}`;
        }
        return `Cada ${interval} semanas (${days.join(', ')})`;
      }
      if (interval === 1) return 'Cada semana';
      return `Cada ${interval} semanas`;

    case 'monthly':
      if (dayOfMonth) {
        if (interval === 1) return `El día ${dayOfMonth} de cada mes`;
        return `El día ${dayOfMonth} cada ${interval} meses`;
      }
      if (interval === 1) return 'Cada mes';
      return `Cada ${interval} meses`;

    case 'yearly':
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      if (rule.monthOfYear && rule.dayOfMonth) {
        if (interval === 1) return `El ${rule.dayOfMonth} de ${monthNames[rule.monthOfYear - 1]}`;
        return `El ${rule.dayOfMonth} de ${monthNames[rule.monthOfYear - 1]} cada ${interval} años`;
      }
      if (rule.dayOfMonth) {
        if (interval === 1) return `El día ${rule.dayOfMonth} cada año`;
        return `El día ${rule.dayOfMonth} cada ${interval} años`;
      }
      if (interval === 1) return 'Cada año';
      return `Cada ${interval} años`;

    default:
      return 'Recurrente';
  }
}

/**
 * Presets rápidos de recurrencia para el selector UI
 */
export interface RecurrencePreset {
  label: string;
  rule: RecurrenceRule;
}

export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  {
    label: 'Cada día',
    rule: { frequency: 'daily', interval: 1 },
  },
  {
    label: 'Cada semana',
    rule: { frequency: 'weekly', interval: 1 },
  },
  {
    label: 'Días laborables',
    rule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    label: 'Cada mes',
    rule: { frequency: 'monthly', interval: 1 },
  },
  {
    label: 'Cada año',
    rule: { frequency: 'yearly', interval: 1 },
  },
];

export const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Día(s)' },
  { value: 'weekly', label: 'Semana(s)' },
  { value: 'monthly', label: 'Mes(es)' },
  { value: 'yearly', label: 'Año(s)' },
];

export const DAYS_OF_WEEK = [
  { value: 1, label: 'L', fullLabel: 'Lunes' },
  { value: 2, label: 'M', fullLabel: 'Martes' },
  { value: 3, label: 'X', fullLabel: 'Miércoles' },
  { value: 4, label: 'J', fullLabel: 'Jueves' },
  { value: 5, label: 'V', fullLabel: 'Viernes' },
  { value: 6, label: 'S', fullLabel: 'Sábado' },
  { value: 0, label: 'D', fullLabel: 'Domingo' },
];
