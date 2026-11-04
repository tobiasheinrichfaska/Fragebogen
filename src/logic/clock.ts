// The device's calendar day for date bounds such as "no birth date after today" (Tobias 2026-11-03:
// "eine fließende Grenze … nie aktueller als heute"). The only clock the logic layer reads, and only
// when a value is entered (also the date picker's range) or a part is sealed — reading a file never
// checks against it, so an old questionnaire cannot turn invalid. Tests fix the day with
// vi.setSystemTime.
import type { DateBound, IsoDate } from './model';

const two = (n: number) => String(n).padStart(2, '0');

/** Today in the device's time zone, `YYYY-MM-DD`. */
export function todayIso(now = new Date()): IsoDate {
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

/** The day a bound stands for. */
export function boundDay(bound: DateBound): IsoDate {
  return bound === 'today' ? todayIso() : bound;
}
