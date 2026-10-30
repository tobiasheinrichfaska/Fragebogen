// Regelaltersgrenze (§ 35 Satz 2, § 235 Abs. 2 SGB VI): 67 years; for birth years 1947 to 1963 it
// rises from 65 by one month per year, from 1959 by two. It is reached when the year of life is
// completed, i.e. at the end of the day before the anniversary (§ 187 Abs. 2, § 188 Abs. 2 BGB);
// if that anniversary does not exist in its month, at the end of the month (§ 188 Abs. 3 BGB).
// Aktivrente (§ 3 Nr. 21 EStG) and freedom from unemployment insurance (§ 28 Abs. 1 Nr. 1 SGB III)
// start with the month after.
import { daysInMonth, parseIsoDate } from './dates';
import type { IsoDate } from './model';

/** Months the Regelaltersgrenze lies above 65 years for a birth year (§ 235 Abs. 2 SGB VI). */
export function monthsAboveSixtyFive(birthYear: number): number {
  if (birthYear <= 1946) return 0;
  if (birthYear <= 1958) return birthYear - 1946;
  if (birthYear <= 1963) return 12 + 2 * (birthYear - 1958);
  return 24;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');
const iso = (year: number, month: number, day: number): IsoDate =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}` as IsoDate;

/** The day on which the Regelaltersgrenze is reached; undefined for a malformed birth date. */
export function regelaltersgrenze(birthDate: string): IsoDate | undefined {
  const birth = parseIsoDate(birthDate);
  if (!birth) return undefined;
  const index = birth.year * 12 + birth.month - 1 + 65 * 12 + monthsAboveSixtyFive(birth.year);
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = daysInMonth(year, month);
  if (birth.day > last) return iso(year, month, last);
  if (birth.day > 1) return iso(year, month, birth.day - 1);
  const before = index - 1;
  const previousYear = Math.floor(before / 12);
  const previousMonth = (before % 12) + 1;
  return iso(previousYear, previousMonth, daysInMonth(previousYear, previousMonth));
}

/** `YYYY-MM` of the month after the one the date lies in. */
export function monthAfter(date: IsoDate): string {
  const [year = 0, month = 1] = date.split('-').map(Number);
  return month === 12 ? `${pad(year + 1, 4)}-01` : `${pad(year, 4)}-${pad(month + 1)}`;
}
