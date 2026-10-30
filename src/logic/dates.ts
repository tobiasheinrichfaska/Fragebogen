// Calendar arithmetic on `YYYY-MM-DD` strings. Dates never go through `Date`, which would
// shift them by the time-zone offset.
import type { IsoDate } from './model';

export const AGE_OF_MAJORITY = 18;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Strict parse: exact `YYYY-MM-DD` and an existing calendar day, otherwise `null`. */
export function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

export function isIsoDate(value: string): value is IsoDate {
  return parseIsoDate(value) !== null;
}

function requireDate(value: IsoDate, name: string): DateParts {
  const parts = parseIsoDate(value);
  if (!parts) throw new RangeError(`${name} is not a valid YYYY-MM-DD date: "${value}"`);
  return parts;
}

function compareParts(a: DateParts, b: DateParts): -1 | 0 | 1 {
  const diff = a.year - b.year || a.month - b.month || a.day - b.day;
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/** Days since a fixed origin (proleptic Gregorian calendar), for durations — never via `Date`. */
export function dayNumber(value: IsoDate): number {
  const { year, month, day } = requireDate(value, 'value');
  const y = month <= 2 ? year - 1 : year;
  const m = month <= 2 ? month + 9 : month - 3;
  return (
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) +
    Math.floor((153 * m + 2) / 5) +
    day
  );
}

export function compareIsoDates(a: IsoDate, b: IsoDate): -1 | 0 | 1 {
  return compareParts(requireDate(a, 'a'), requireDate(b, 'b'));
}

/**
 * Completed years of life on `onDate` (§ 187 Abs. 2 S. 2, § 188 Abs. 2 BGB): the new age applies
 * from the birthday itself. Someone born on 29 February reaches the new age on 1 March in
 * non-leap years, because the year of life ends with the expiry of 28 February.
 */
export function ageOn(birthDate: IsoDate, onDate: IsoDate): number {
  const birth = requireDate(birthDate, 'birthDate');
  const on = requireDate(onDate, 'onDate');
  if (compareParts(on, birth) < 0) {
    throw new RangeError(`onDate ${onDate} lies before birthDate ${birthDate}`);
  }
  const birthdayThisYear: DateParts =
    birth.month === 2 && birth.day === 29 && !isLeapYear(on.year)
      ? { year: on.year, month: 3, day: 1 }
      : { year: on.year, month: birth.month, day: birth.day };
  const years = on.year - birth.year;
  return compareParts(on, birthdayThisYear) < 0 ? years - 1 : years;
}

/** `YYYY-MM-DD` → `TT.MM.JJJJ` for German texts. */
export function formatGermanDate(date: IsoDate): string {
  const { year, month, day } = requireDate(date, 'date');
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year).padStart(4, '0')}`;
}

/** True when the person is under 18 on `onDate` — then the legal guardian must co-sign. */
/** A calendar month `YYYY-MM` (stored form of `month` fields). */
const ISO_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isIsoMonth(value: string): boolean {
  return ISO_MONTH.test(value);
}

/** `YYYY-MM` plus (or minus) whole months; throws on a malformed month. */
export function addMonths(month: string, count: number): string {
  const match = ISO_MONTH.exec(month);
  if (!match) throw new RangeError(`not a month: ${month}`);
  const index = Number(match[1]) * 12 + Number(match[2]) - 1 + count;
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

export function isMinorOn(birthDate: IsoDate, onDate: IsoDate): boolean {
  return ageOn(birthDate, onDate) < AGE_OF_MAJORITY;
}
