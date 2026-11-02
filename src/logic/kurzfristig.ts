// Short-term employment (§ 8 Abs. 1 Nr. 2 SGB IV) after the Geringfügigkeits-Richtlinien 2026,
// B 2.3 (checked in the text 2026-11-02): the time limits three months or 70 working days, adding
// up earlier short-term jobs of the calendar year (90 calendar days), regularity (framework
// agreement over more than a year) and berufsmäßig from earlier jobs (B 2.3.3.3). Pure date
// arithmetic on `YYYY-MM-DD` strings; the pay limit is the caller's.
import { dayNumber, daysInMonth, formatGermanDate, parseIsoDate } from './dates';
import type { IsoDate } from './model';

/** An earlier job of the person (table "Frühere Beschäftigungen"). */
export interface EarlierJob {
  art: string;
  von: IsoDate | undefined;
  bis: IsoDate | undefined;
  arbeitstage: number | undefined;
  /** Monthly pay in cents. */
  entgelt: number | undefined;
}

export interface ShortTermJob {
  beginn: IsoDate;
  bis: IsoDate | undefined;
  arbeitstage: number | undefined;
  rahmenvereinbarung: boolean | undefined;
  befristet: boolean | undefined;
  frueher: readonly EarlierJob[];
}

export const KURZFRISTIG_ARBEITSTAGE = 70;
export const KURZFRISTIG_KALENDERTAGE = 90;

const iso = (year: number, month: number, day: number): IsoDate =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function parts(date: IsoDate) {
  const p = parseIsoDate(date);
  if (!p) throw new RangeError(`not a date: ${date}`);
  return p;
}

const dayBefore = (date: IsoDate): IsoDate => {
  const { year, month, day } = parts(date);
  if (day > 1) return iso(year, month, day - 1);
  if (month > 1) return iso(year, month - 1, daysInMonth(year, month - 1));
  return iso(year - 1, 12, 31);
};

/**
 * Last day of a period of `count` months starting on `start` (§ 187 Abs. 2, § 188 Abs. 2, 3 BGB):
 * 03.05. + 3 → 02.08.; 30.11. + 3 → 28.02. (the corresponding day is missing).
 */
export function endOfMonths(start: IsoDate, count: number): IsoDate {
  const { year, month, day } = parts(start);
  const index = year * 12 + (month - 1) + count;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  const last = daysInMonth(y, m);
  return day > last ? iso(y, m, last) : dayBefore(iso(y, m, day));
}

const between = (from: IsoDate, to: IsoDate) => dayNumber(to) - dayNumber(from) + 1;

/**
 * Calendar days of a period for adding up (B 2.3.2): full calendar months count 30 days, part
 * months their real days; a period without a full calendar month but with a time month counts
 * 30 days for it.
 */
export function kalendertage(von: IsoDate, bis: IsoDate): number {
  if (bis < von) return 0;
  const a = parts(von);
  const b = parts(bis);
  let full = 0;
  let rest = 0;
  for (let y = a.year, m = a.month; y < b.year || (y === b.year && m <= b.month);) {
    const first = iso(y, m, 1);
    const last = iso(y, m, daysInMonth(y, m));
    const from = von > first ? von : first;
    const to = bis < last ? bis : last;
    if (from === first && to === last) full += 1;
    else rest += between(from, to);
    if (m === 12) {
      y += 1;
      m = 1;
    } else m += 1;
  }
  if (full > 0) return full * 30 + rest;
  const zeitmonat = endOfMonths(von, 1);
  return bis >= zeitmonat ? 30 + (dayNumber(bis) - dayNumber(zeitmonat)) : between(von, bis);
}

/** The part of a period within one calendar year, or nothing. */
function inYear(von: IsoDate, bis: IsoDate, year: number): [IsoDate, IsoDate] | undefined {
  const from = von > iso(year, 1, 1) ? von : iso(year, 1, 1);
  const to = bis < iso(year, 12, 31) ? bis : iso(year, 12, 31);
  return to < from ? undefined : [from, to];
}

export type Zeitgrenze = 'eingehalten' | 'ueberschritten' | 'offen';

interface Sum {
  tage: number;
  arbeitstage: number | undefined;
}

/** Earlier jobs of the start year before the start, with the job itself (its part in that year). */
function addedUp(job: ShortTermJob, rows: readonly EarlierJob[]): Sum | undefined {
  if (job.bis === undefined) return undefined;
  const year = parts(job.beginn).year;
  const own = inYear(job.beginn, job.bis, year);
  let tage = own ? kalendertage(...own) : 0;
  let arbeitstage = job.arbeitstage;
  for (const row of rows) {
    if (row.von === undefined || row.bis === undefined) return undefined;
    const part = inYear(row.von, row.bis, year);
    if (!part) continue;
    tage += kalendertage(...part);
    arbeitstage =
      arbeitstage === undefined || row.arbeitstage === undefined
        ? undefined
        : arbeitstage + row.arbeitstage;
  }
  return { tage, arbeitstage };
}

const earlierInYear = (job: ShortTermJob, keep: (row: EarlierJob) => boolean) =>
  job.frueher.filter(
    (row) =>
      keep(row) &&
      (row.von === undefined ||
        (row.von < job.beginn && row.von.slice(0, 4) <= job.beginn.slice(0, 4))) &&
      (row.bis === undefined || row.bis.slice(0, 4) >= job.beginn.slice(0, 4)),
  );

/** Over both limits: more than 90 calendar days and more than 70 working days (B 2.3.1, 2.3.2). */
function over(sum: Sum): Zeitgrenze {
  if (sum.tage <= KURZFRISTIG_KALENDERTAGE) return 'eingehalten';
  if (sum.arbeitstage === undefined) return 'offen';
  return sum.arbeitstage > KURZFRISTIG_ARBEITSTAGE ? 'ueberschritten' : 'eingehalten';
}

const sumText = (sum: Sum) =>
  `${sum.tage} Kalendertage${sum.arbeitstage === undefined ? '' : `, ${sum.arbeitstage} Arbeitstage`}`;

/**
 * The time limit (B 2.3, 2.3.1, 2.3.2): on its own limited in advance to three months or to 70
 * working days (also across the turn of the year); added up with the earlier short-term jobs of
 * the calendar year, 90 calendar days or 70 working days. Missing answers leave it open.
 */
export function zeitgrenze(job: ShortTermJob): { status: Zeitgrenze; detail: string[] } {
  const threeMonths = job.bis === undefined ? undefined : job.bis <= endOfMonths(job.beginn, 3);
  const seventyDays =
    job.arbeitstage === undefined ? undefined : job.arbeitstage <= KURZFRISTIG_ARBEITSTAGE;
  if (threeMonths === false && seventyDays === false) {
    return {
      status: 'ueberschritten',
      detail: [
        `Von vornherein länger als drei Monate (bis ${formatGermanDate(endOfMonths(job.beginn, 3))}) und mehr als 70 Arbeitstage (Geringfügigkeits-Richtlinien B 2.3).`,
      ],
    };
  }
  if (threeMonths !== true && seventyDays !== true) {
    return { status: 'offen', detail: ['Ende oder Arbeitstage der Aushilfe fehlen.'] };
  }
  const rows = earlierInYear(job, (row) => row.art === 'kurzfristig');
  if (rows.length === 0) return { status: 'eingehalten', detail: [] };
  const sum = addedUp(job, rows);
  if (!sum) {
    return { status: 'offen', detail: ['Zeitraum einer früheren Aushilfe fehlt.'] };
  }
  const status = over(sum);
  return {
    status,
    detail: [
      `Mit den früheren Aushilfen im Kalenderjahr zusammen ${sumText(sum)}; Grenze 90 Kalendertage oder 70 Arbeitstage (Geringfügigkeits-Richtlinien B 2.3.2).`,
    ],
  };
}

/**
 * Regular instead of occasional (B 2.3): a framework agreement without a fixed term or over more
 * than a year.
 */
export function regelmaessig(job: ShortTermJob): boolean {
  if (job.rahmenvereinbarung !== true) return false;
  if (job.befristet === false) return true;
  return job.bis !== undefined && job.bis > endOfMonths(job.beginn, 12);
}

/**
 * Berufsmäßig from the earlier jobs (B 2.3.3.3): all jobs of the calendar year except Minijobs and
 * short-term jobs within the pay limit — jobs abroad included (B 2.3.3.6) — together with this one
 * more than 90 calendar days and 70 working days. Missing working days: judged by the days, open.
 */
export function berufsmaessigNachVorbeschaeftigungen(
  job: ShortTermJob,
  limit: number,
): { holds: boolean; uncertain: boolean; detail: string[] } {
  const rows = earlierInYear(
    job,
    (row) =>
      row.art === 'mehr' ||
      row.art === 'ausland' ||
      (row.art === 'kurzfristig' && (row.entgelt === undefined || row.entgelt > limit)),
  );
  if (rows.length === 0) return { holds: false, uncertain: false, detail: [] };
  const sum = addedUp(job, rows);
  if (!sum)
    return {
      holds: false,
      uncertain: true,
      detail: ['Zeitraum einer früheren Beschäftigung fehlt.'],
    };
  const status = over(sum);
  return {
    holds: status !== 'eingehalten',
    uncertain:
      status === 'offen' ||
      rows.some((row) => row.entgelt === undefined && row.art === 'kurzfristig'),
    detail: [
      `Mit den früheren, nicht geringfügigen Beschäftigungen im Kalenderjahr zusammen ${sumText(sum)}: ${status === 'eingehalten' ? 'nicht berufsmäßig' : 'berufsmäßig'} (Geringfügigkeits-Richtlinien B 2.3.3.3).`,
    ],
  };
}

/**
 * Earlier short-term jobs that began and ended in the month this one begins and ends in: their pay
 * counts for the pay limit (B 2.3.3, example 4c). Cents per month.
 */
export function entgeltImSelbenMonat(job: ShortTermJob): number {
  const month = job.beginn.slice(0, 7);
  if (job.bis === undefined || job.bis.slice(0, 7) !== month) return 0;
  return job.frueher
    .filter(
      (row) =>
        row.art === 'kurzfristig' &&
        row.von?.slice(0, 7) === month &&
        row.bis?.slice(0, 7) === month &&
        row.von < job.beginn,
    )
    .reduce((sum, row) => sum + (row.entgelt ?? 0), 0);
}
