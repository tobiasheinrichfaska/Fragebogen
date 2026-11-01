// Absence calendar of one month (Tobias 2026-11-01: Urlaub and Krankheit picked in a month view,
// one row per week; a tap cycles through the marks and back to empty). Stored as a sorted list of
// "YYYY-MM-DD:mark" strings — strings in an array like a multiple choice, so canon 1 holds. The
// marks are the field's options (data), in cycling order.
import { dayNumber, daysInMonth, formatGermanDate, isIsoMonth, parseIsoDate } from './dates';
import { accept, reject, type Checked } from './issues';
import type { ChoiceOption, IsoDate } from './model';

export interface CalendarEntry {
  date: IsoDate;
  mark: string;
}

const ENTRY = /^(\d{4}-\d{2}-\d{2}):([A-Za-z0-9][A-Za-z0-9_-]{0,63})$/;

/** The longest month has 31 days; a calendar holds no more entries than that. */
export const MAX_CALENDAR_ENTRIES = 31;

export function entryText(entry: CalendarEntry): string {
  return `${entry.date}:${entry.mark}`;
}

/** Stored entries in order; anything malformed is left out (stored values are already normalised). */
export function calendarEntries(value: unknown): CalendarEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const match = typeof item === 'string' ? ENTRY.exec(item) : null;
    return match ? [{ date: match[1] ?? '', mark: match[2] ?? '' }] : [];
  });
}

/**
 * Normalises a calendar answer: every entry an existing day with a known mark, each day at most
 * once, sorted by date. No entries = not answered (null).
 */
export function normalizeCalendar(
  raw: unknown,
  marks: readonly ChoiceOption[],
): Checked<string[] | null> {
  if (raw === null) return accept(null);
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === 'string')) {
    return reject('value.type');
  }
  if (raw.length > MAX_CALENDAR_ENTRIES) return reject('calendar.format');
  const known = new Set(marks.map((mark) => mark.id));
  const days = new Set<string>();
  const entries: string[] = [];
  for (const item of raw) {
    const match = ENTRY.exec(item);
    const date = match?.[1] ?? '';
    const mark = match?.[2] ?? '';
    if (!match || parseIsoDate(date) === null || !known.has(mark)) return reject('calendar.format');
    if (days.has(date)) return reject('calendar.duplicate');
    days.add(date);
    entries.push(item);
  }
  return accept(entries.length === 0 ? null : entries.sort());
}

/** The mark after `current` in cycling order: empty → first mark → … → last mark → empty. */
export function nextMark(
  current: string | undefined,
  marks: readonly ChoiceOption[],
): string | undefined {
  if (current === undefined) return marks[0]?.id;
  const index = marks.findIndex((mark) => mark.id === current);
  return index < 0 ? undefined : marks[index + 1]?.id;
}

/** The entries after one tap on `date`. */
export function cycleDay(
  entries: readonly CalendarEntry[],
  date: IsoDate,
  marks: readonly ChoiceOption[],
): CalendarEntry[] {
  const current = entries.find((entry) => entry.date === date)?.mark;
  const mark = nextMark(current, marks);
  const others = entries.filter((entry) => entry.date !== date);
  const result = mark === undefined ? others : [...others, { date, mark }];
  return result.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

const MONDAY = dayNumber('2026-11-02');

/** Day of the week, 0 = Monday … 6 = Sunday. */
export function weekday(date: IsoDate): number {
  return (((dayNumber(date) - MONDAY) % 7) + 7) % 7;
}

/**
 * The month as weeks from Monday to Sunday, one row per week; days of the neighbouring months are
 * null. `month` is `YYYY-MM`.
 */
export function monthWeeks(month: string): (IsoDate | null)[][] {
  if (!isIsoMonth(month)) throw new RangeError(`not a month: ${month}`);
  const [year = 0, monthNumber = 0] = month.split('-').map(Number);
  const days = daysInMonth(year, monthNumber);
  const cells: (IsoDate | null)[] = Array<IsoDate | null>(weekday(`${month}-01`)).fill(null);
  for (let day = 1; day <= days; day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (IsoDate | null)[][] = [];
  for (let at = 0; at < cells.length; at += 7) weeks.push(cells.slice(at, at + 7));
  return weeks;
}

/** Entries that lie outside `month` (e.g. after the reporting month was changed). */
export function entriesOutside(entries: readonly CalendarEntry[], month: string): CalendarEntry[] {
  return entries.filter((entry) => !entry.date.startsWith(`${month}-`));
}

export interface CalendarRun {
  mark: string;
  from: IsoDate;
  to: IsoDate;
  days: number;
}

/** Consecutive days with the same mark joined into runs, in date order. */
export function calendarRuns(entries: readonly CalendarEntry[]): CalendarRun[] {
  const runs: CalendarRun[] = [];
  for (const entry of entries) {
    const last = runs.at(-1);
    if (last && last.mark === entry.mark && dayNumber(entry.date) === dayNumber(last.to) + 1) {
      last.to = entry.date;
      last.days += 1;
    } else {
      runs.push({ mark: entry.mark, from: entry.date, to: entry.date, days: 1 });
    }
  }
  return runs;
}

function runText(run: CalendarRun): string {
  if (run.from === run.to) return formatGermanDate(run.from);
  // Same month: "03.–07.11.2026"; otherwise both dates in full.
  const from = formatGermanDate(run.from);
  const to = formatGermanDate(run.to);
  return from.slice(3) === to.slice(3) ? `${from.slice(0, 3)}–${to}` : `${from} – ${to}`;
}

/** "Urlaub (6 Tage): 03.–07.11.2026, 10.11.2026; krank (3 Tage): 17.–19.11.2026". */
export function describeCalendar(value: unknown, marks: readonly ChoiceOption[]): string {
  const runs = calendarRuns(calendarEntries(value));
  return marks
    .flatMap((mark) => {
      const own = runs.filter((run) => run.mark === mark.id);
      if (own.length === 0) return [];
      const days = own.reduce((sum, run) => sum + run.days, 0);
      return [
        `${mark.label} (${days} ${days === 1 ? 'Tag' : 'Tage'}): ${own.map(runText).join(', ')}`,
      ];
    })
    .join('; ');
}
