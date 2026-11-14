// Absence calendar (Tobias 2026-11-01): a tap cycles Urlaub → krank → empty; the month as weeks.
import {
  calendarEntries,
  calendarRuns,
  cycleDay,
  describeCalendar,
  entriesOutside,
  monthWeeks,
  nextMark,
  normalizeCalendar,
  weekday,
} from './calendar';
import { displayValue } from './display';
import type { FieldDefinition } from './model';
import { normalizeFieldValue } from './normalize';

const MARKS = [
  { id: 'urlaub', label: 'Urlaub' },
  { id: 'krank', label: 'krank' },
];

const FIELD: FieldDefinition = {
  id: 'fehltage',
  role: 'arbeitgeber',
  type: 'calendar',
  label: 'Urlaub und Krankheit',
  required: false,
  purpose: 'Test',
  options: MARKS,
  monthFrom: 'abrechnungsmonat',
};

describe('normalizeCalendar', () => {
  it('sorts the days and keeps one mark per day', () => {
    expect(normalizeCalendar(['2026-11-10:urlaub', '2026-11-03:krank'], MARKS)).toEqual({
      ok: true,
      value: ['2026-11-03:krank', '2026-11-10:urlaub'],
      warnings: [],
    });
  });

  it('stores no days as not answered', () => {
    expect(normalizeFieldValue(FIELD, [])).toEqual({ ok: true, value: null, warnings: [] });
    expect(normalizeFieldValue(FIELD, null)).toEqual({ ok: true, value: null, warnings: [] });
  });

  it.each<[string, unknown, string]>([
    ['a day that does not exist', ['2026-02-30:urlaub'], 'calendar.format'],
    ['an unknown mark', ['2026-11-03:kur'], 'calendar.format'],
    ['a German date', ['03.11.2026:urlaub'], 'calendar.format'],
    ['a day marked twice', ['2026-11-03:urlaub', '2026-11-03:krank'], 'calendar.duplicate'],
    ['more days than a month has', Array(32).fill('2026-11-03:urlaub'), 'calendar.format'],
    ['a single string', '2026-11-03:urlaub', 'value.type'],
    ['numbers', [20261103], 'value.type'],
  ])('refuses %s', (_label, raw, issue) => {
    expect(normalizeFieldValue(FIELD, raw)).toEqual({ ok: false, issue });
  });
});

describe('cycling through the marks', () => {
  it('goes empty → Urlaub → krank → empty', () => {
    expect(nextMark(undefined, MARKS)).toBe('urlaub');
    expect(nextMark('urlaub', MARKS)).toBe('krank');
    expect(nextMark('krank', MARKS)).toBeUndefined();
  });

  it('changes only the tapped day and keeps the order by date', () => {
    let entries = cycleDay([], '2026-11-10', MARKS);
    entries = cycleDay(entries, '2026-11-03', MARKS);
    expect(entries).toEqual([
      { date: '2026-11-03', mark: 'urlaub' },
      { date: '2026-11-10', mark: 'urlaub' },
    ]);
    entries = cycleDay(entries, '2026-11-10', MARKS);
    expect(entries.at(-1)).toEqual({ date: '2026-11-10', mark: 'krank' });
    expect(cycleDay(entries, '2026-11-10', MARKS)).toEqual([
      { date: '2026-11-03', mark: 'urlaub' },
    ]);
  });

  it('round-trips through the stored form', () => {
    const entries = cycleDay(cycleDay([], '2026-11-04', MARKS), '2026-11-04', MARKS);
    const stored = normalizeCalendar(
      entries.map((entry) => `${entry.date}:${entry.mark}`),
      MARKS,
    );
    expect(stored.ok && calendarEntries(stored.value)).toEqual(entries);
  });
});

describe('the month as weeks', () => {
  it('knows the day of the week', () => {
    expect(weekday('2026-11-02')).toBe(0); // Monday
    expect(weekday('2026-11-01')).toBe(6); // Sunday
    expect(weekday('2024-02-29')).toBe(3); // Thursday
    expect(weekday('2000-01-01')).toBe(5); // Saturday
  });

  it('starts every week on Monday and pads with the neighbouring months', () => {
    const weeks = monthWeeks('2026-11');
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks[5]).toEqual(['2026-11-30', null, null, null, null, null, null]);
    expect(weeks.flat().filter((day) => day !== null)).toHaveLength(30);
  });

  it('fits February of a common year starting on Monday into four weeks', () => {
    expect(monthWeeks('2027-02')).toHaveLength(4);
    expect(monthWeeks('2027-02')[0]?.[0]).toBe('2027-02-01');
  });

  it('refuses a malformed month', () => {
    expect(() => monthWeeks('2026-13')).toThrow(RangeError);
  });

  it('finds the days outside the month, e.g. after the month was changed', () => {
    const entries = calendarEntries(['2026-10-30:krank', '2026-11-02:krank']);
    expect(entriesOutside(entries, '2026-11')).toEqual([{ date: '2026-10-30', mark: 'krank' }]);
  });
});

describe('reading a calendar', () => {
  // Audit 2026-11-14: a day that does not exist passed the shape check and made the display throw —
  // a crafted file could not be shown in the form view, the summary or the PDF.
  it('leaves out a day that does not exist instead of throwing', () => {
    const crafted = ['2026-02-30:urlaub', '2026-02-03:urlaub'];
    expect(calendarEntries(crafted)).toEqual([{ date: '2026-02-03', mark: 'urlaub' }]);
    expect(() => describeCalendar(crafted, MARKS)).not.toThrow();
    expect(() => displayValue(FIELD, crafted)).not.toThrow();
  });

  const value = [
    '2026-11-03:urlaub',
    '2026-11-04:urlaub',
    '2026-11-05:urlaub',
    '2026-11-06:urlaub',
    '2026-11-07:urlaub',
    '2026-11-10:urlaub',
    '2026-11-17:krank',
    '2026-11-18:krank',
    '2026-11-19:krank',
  ];

  it('joins consecutive days with the same mark', () => {
    expect(calendarRuns(calendarEntries(value))).toEqual([
      { mark: 'urlaub', from: '2026-11-03', to: '2026-11-07', days: 5 },
      { mark: 'urlaub', from: '2026-11-10', to: '2026-11-10', days: 1 },
      { mark: 'krank', from: '2026-11-17', to: '2026-11-19', days: 3 },
    ]);
  });

  it('splits a run where the mark changes', () => {
    const runs = calendarRuns(calendarEntries(['2026-11-03:urlaub', '2026-11-04:krank']));
    expect(runs.map((run) => run.mark)).toEqual(['urlaub', 'krank']);
  });

  it('reads as days per mark with the periods', () => {
    expect(describeCalendar(value, MARKS)).toBe(
      'Urlaub (6 Tage): 03.–07.11.2026, 10.11.2026; krank (3 Tage): 17.–19.11.2026',
    );
    expect(displayValue(FIELD, ['2026-11-30:krank'])).toBe('krank (1 Tag): 30.11.2026');
  });

  it('writes a run over the turn of the month with both dates', () => {
    expect(describeCalendar(['2026-11-30:krank', '2026-12-01:krank'], MARKS)).toBe(
      'krank (2 Tage): 30.11.2026 – 01.12.2026',
    );
  });
});
