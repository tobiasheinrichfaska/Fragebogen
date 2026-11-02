// Short-term employment after the Geringfügigkeits-Richtlinien 2026 B 2.3 (checked in the text
// 2026-11-02); the day counts are the ones the examples print.
import {
  berufsmaessigNachVorbeschaeftigungen,
  endOfMonths,
  entgeltImSelbenMonat,
  kalendertage,
  regelmaessig,
  zeitgrenze,
  type EarlierJob,
  type ShortTermJob,
} from './kurzfristig';

const LIMIT = 60300;
const job = (
  beginn: string,
  bis: string | undefined,
  tage: number | undefined,
  more: Partial<ShortTermJob> = {},
): ShortTermJob => ({
  beginn,
  bis,
  arbeitstage: tage,
  rahmenvereinbarung: false,
  befristet: true,
  frueher: [],
  ...more,
});
const earlier = (
  art: string,
  von: string,
  bis: string,
  arbeitstage?: number,
  entgelt?: number,
): EarlierJob => ({
  art,
  von,
  bis,
  arbeitstage,
  entgelt,
});

describe('periods of months (§§ 187, 188 BGB)', () => {
  it.each([
    ['2026-05-03', 3, '2026-08-02'],
    ['2026-06-01', 3, '2026-08-31'],
    ['2026-11-15', 3, '2027-02-14'],
    ['2026-11-30', 3, '2027-02-28'],
    ['2027-11-30', 3, '2028-02-29'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2026-08-13', 1, '2026-09-12'],
    ['2026-03-01', 12, '2027-02-28'],
  ])('%s + %i months ends on %s', (start, count, end) => {
    expect(endOfMonths(start, count)).toBe(end);
  });
});

describe('calendar days for adding up (B 2.3.2: full months 30 days, a time month 30 days)', () => {
  it.each([
    // Example 48: 02.03.–15.06. = 30 + 2 × 30 + 15 = 105; 13.08.–20.09. = 30 + 8 = 38; together 143.
    ['2026-03-02', '2026-06-15', 105],
    ['2026-08-13', '2026-09-20', 38],
    // Examples 40 and 45.
    ['2026-01-10', '2026-01-31', 22],
    ['2026-04-01', '2026-04-30', 30],
    ['2026-08-01', '2026-09-20', 50],
    ['2026-05-02', '2026-06-28', 57],
    ['2026-08-03', '2026-09-30', 59],
    ['2026-02-01', '2026-02-28', 30],
    ['2026-07-31', '2026-07-31', 1],
    ['2026-06-01', '2026-09-13', 103],
    ['2026-12-15', '2026-12-23', 9],
  ])('%s – %s: %i days', (von, bis, tage) => {
    expect(kalendertage(von, bis)).toBe(tage);
  });

  it('gives nothing for a period that ends before it begins', () => {
    expect(kalendertage('2026-05-02', '2026-05-01')).toBe(0);
  });
});

describe('the time limit three months or 70 working days (B 2.3, 2.3.1)', () => {
  it.each<[string, ShortTermJob, string]>([
    ['three months exactly', job('2026-06-01', '2026-08-31', 78), 'eingehalten'],
    [
      'a day over three months, over 70 days',
      job('2026-06-01', '2026-09-01', 79),
      'ueberschritten',
    ],
    // Example 3b: longer than three months, but limited to 70 working days.
    ['four months, 70 working days', job('2026-06-01', '2026-09-13', 70), 'eingehalten'],
    ['four months, 71 working days', job('2026-06-01', '2026-09-30', 71), 'ueberschritten'],
    // Example 37: from 15.11. to 15.03. of the next year, 88 working days.
    ['across the turn of the year, 88 days', job('2026-11-15', '2027-03-15', 88), 'ueberschritten'],
    ['end missing, 30 days', job('2026-06-01', undefined, 30), 'eingehalten'],
    ['end and days missing', job('2026-06-01', undefined, undefined), 'offen'],
    ['four months, days missing', job('2026-06-01', '2026-09-30', undefined), 'offen'],
  ])('%s → %s', (_label, input, status) => {
    expect(zeitgrenze(input).status).toBe(status);
  });

  it('adds up earlier short-term jobs of the calendar year (example 40: 102 days, 85 working days)', () => {
    const result = zeitgrenze(
      job('2026-08-01', '2026-09-20', 42, {
        frueher: [
          earlier('kurzfristig', '2026-01-10', '2026-01-31', 18),
          earlier('kurzfristig', '2026-04-01', '2026-04-30', 25),
        ],
      }),
    );
    expect(result.status).toBe('ueberschritten');
    expect(result.detail.join(' ')).toContain('102 Kalendertage, 85 Arbeitstage');
  });

  it('stays within when either sum keeps its limit', () => {
    // 22 + 30 + 50 = 102 days, but 10 + 20 + 30 = 60 working days.
    expect(
      zeitgrenze(
        job('2026-08-01', '2026-09-20', 30, {
          frueher: [
            earlier('kurzfristig', '2026-01-10', '2026-01-31', 10),
            earlier('kurzfristig', '2026-04-01', '2026-04-30', 20),
          ],
        }),
      ).status,
    ).toBe('eingehalten');
  });

  it('counts only short-term jobs of this year before the start, and only their part in it', () => {
    const rows = [
      earlier('minijob', '2026-01-01', '2026-06-30', 100),
      earlier('mehr', '2026-01-01', '2026-06-30', 100),
      earlier('kurzfristig', '2025-10-01', '2026-01-15', 40),
      earlier('kurzfristig', '2026-12-01', '2026-12-20', 15),
    ];
    // Only 01.–15.01. counts (15 days) plus 01.06.–31.08. (90): 105 days, but 40 + 60 = 100 days … over.
    expect(zeitgrenze(job('2026-06-01', '2026-08-31', 60, { frueher: rows })).status).toBe(
      'ueberschritten',
    );
    expect(zeitgrenze(job('2026-06-01', '2026-08-31', 20, { frueher: rows })).status).toBe(
      'eingehalten',
    );
  });

  it('leaves it open when an earlier job lacks its period or its working days', () => {
    expect(
      zeitgrenze(
        job('2026-06-01', '2026-07-31', 40, {
          frueher: [
            {
              art: 'kurzfristig',
              von: undefined,
              bis: undefined,
              arbeitstage: 10,
              entgelt: undefined,
            },
          ],
        }),
      ).status,
    ).toBe('offen');
    expect(
      zeitgrenze(
        job('2026-06-01', '2026-08-31', 60, {
          frueher: [earlier('kurzfristig', '2026-01-01', '2026-01-31')],
        }),
      ).status,
    ).toBe('offen');
  });
});

describe('regular instead of occasional (B 2.3)', () => {
  it.each<[string, Partial<ShortTermJob>, boolean]>([
    [
      'framework agreement without a fixed term (example 42)',
      { rahmenvereinbarung: true, befristet: false },
      true,
    ],
    [
      'framework agreement over more than a year',
      { rahmenvereinbarung: true, befristet: true, bis: '2027-06-01' },
      true,
    ],
    [
      'framework agreement for one year at most',
      { rahmenvereinbarung: true, befristet: true, bis: '2027-02-28' },
      false,
    ],
    [
      'no framework agreement (example 41)',
      { rahmenvereinbarung: false, befristet: true, bis: '2026-12-31' },
      false,
    ],
    ['not answered', { rahmenvereinbarung: undefined }, false],
  ])('%s → %s', (_label, more, expected) => {
    expect(regelmaessig(job('2026-03-01', '2026-12-31', 20, more))).toBe(expected);
  });
});

describe('berufsmäßig from earlier jobs (B 2.3.3.3)', () => {
  it('counts jobs above the Minijob level (example 48: 143 days, 102 working days)', () => {
    const result = berufsmaessigNachVorbeschaeftigungen(
      job('2026-08-13', '2026-09-20', 27, {
        frueher: [earlier('mehr', '2026-03-02', '2026-06-15', 75)],
      }),
      LIMIT,
    );
    expect(result).toMatchObject({ holds: true, uncertain: false });
    expect(result.detail.join(' ')).toContain('143 Kalendertage, 102 Arbeitstage');
  });

  it('leaves out Minijobs and short-term jobs within the pay limit, counts those above and jobs abroad', () => {
    const rows = [
      earlier('minijob', '2026-01-01', '2026-06-30', 120),
      earlier('kurzfristig', '2026-01-01', '2026-03-31', 60, 50000),
    ];
    expect(
      berufsmaessigNachVorbeschaeftigungen(
        job('2026-08-01', '2026-09-30', 40, { frueher: rows }),
        LIMIT,
      ).holds,
    ).toBe(false);
    const above = [earlier('kurzfristig', '2026-01-01', '2026-03-31', 60, 90000)];
    expect(
      berufsmaessigNachVorbeschaeftigungen(
        job('2026-08-01', '2026-09-30', 40, { frueher: above }),
        LIMIT,
      ).holds,
    ).toBe(true);
    const abroad = [earlier('ausland', '2026-01-01', '2026-03-31', 60)];
    expect(
      berufsmaessigNachVorbeschaeftigungen(
        job('2026-08-01', '2026-09-30', 40, { frueher: abroad }),
        LIMIT,
      ).holds,
    ).toBe(true);
  });

  it('judges by the days when working days are missing, uncertain', () => {
    expect(
      berufsmaessigNachVorbeschaeftigungen(
        job('2026-08-01', '2026-09-30', 40, {
          frueher: [earlier('mehr', '2026-01-01', '2026-03-31')],
        }),
        LIMIT,
      ),
    ).toMatchObject({ holds: true, uncertain: true });
    expect(
      berufsmaessigNachVorbeschaeftigungen(job('2026-08-01', '2026-09-30', 40), LIMIT),
    ).toMatchObject({ holds: false, uncertain: false });
  });
});

describe('pay of short-term jobs in the same month (B 2.3.3, example 4c)', () => {
  it('adds an earlier job that began and ended in the month this one begins and ends in', () => {
    const april = [earlier('kurzfristig', '2026-04-01', '2026-04-15', 11, 32000)];
    expect(entgeltImSelbenMonat(job('2026-04-16', '2026-04-30', 11, { frueher: april }))).toBe(
      32000,
    );
    // This job runs into May: no longer the same month.
    expect(entgeltImSelbenMonat(job('2026-04-16', '2026-05-10', 11, { frueher: april }))).toBe(0);
    // A job of the month before does not count.
    expect(entgeltImSelbenMonat(job('2026-05-02', '2026-05-20', 11, { frueher: april }))).toBe(0);
  });
});
