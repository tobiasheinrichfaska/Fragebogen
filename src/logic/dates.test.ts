import {
  ageOn,
  compareIsoDates,
  daysInMonth,
  isIsoDate,
  isLeapYear,
  isMinorOn,
  parseIsoDate,
} from './dates';

describe('isLeapYear', () => {
  it.each([
    [2024, true],
    [2026, false],
    [2000, true],
    [1900, false],
    [2100, false],
    [2400, true],
  ])('%i → %s', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });
});

describe('daysInMonth', () => {
  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2028, 2, 29],
    [2026, 4, 30],
    [2026, 6, 30],
    [2026, 9, 30],
    [2026, 11, 30],
    [2026, 12, 31],
  ])('%i-%i has %i days', (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });
});

describe('parseIsoDate / isIsoDate', () => {
  it('parses a valid date', () => {
    expect(parseIsoDate('2026-10-29')).toEqual({ year: 2026, month: 10, day: 29 });
  });

  it('accepts 29 February only in leap years', () => {
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
  });

  it.each([
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-01-00',
    '0000-01-01',
    '2026-1-01',
    '26-01-01',
    ' 2026-01-01',
    '2026-01-01 ',
    '2026-01-01T00:00',
    '01.01.2026',
    '',
  ])('rejects %j', (value) => {
    expect(parseIsoDate(value)).toBeNull();
    expect(isIsoDate(value)).toBe(false);
  });
});

describe('compareIsoDates', () => {
  it('orders dates', () => {
    expect(compareIsoDates('2026-01-01', '2026-01-02')).toBe(-1);
    expect(compareIsoDates('2026-01-02', '2026-01-01')).toBe(1);
    expect(compareIsoDates('2026-01-01', '2026-01-01')).toBe(0);
    expect(compareIsoDates('2025-12-31', '2026-01-01')).toBe(-1);
  });

  it('throws on invalid input instead of guessing', () => {
    expect(() => compareIsoDates('2026-02-30', '2026-01-01')).toThrow(RangeError);
  });
});

describe('ageOn', () => {
  it('counts the new age from the birthday itself', () => {
    expect(ageOn('2008-05-05', '2026-05-04')).toBe(17);
    expect(ageOn('2008-05-05', '2026-05-05')).toBe(18);
    expect(ageOn('2008-05-05', '2026-05-06')).toBe(18);
  });

  it('is 0 on the day of birth', () => {
    expect(ageOn('2026-10-29', '2026-10-29')).toBe(0);
  });

  it('handles year boundaries', () => {
    expect(ageOn('2000-12-31', '2026-12-30')).toBe(25);
    expect(ageOn('2000-12-31', '2026-12-31')).toBe(26);
    expect(ageOn('2000-01-01', '2025-12-31')).toBe(25);
  });

  it('gives someone born on 29 February the new age on 1 March in non-leap years', () => {
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17);
    expect(ageOn('2008-02-29', '2026-03-01')).toBe(18);
  });

  it('uses 29 February itself in leap years', () => {
    expect(ageOn('2008-02-29', '2028-02-28')).toBe(19);
    expect(ageOn('2008-02-29', '2028-02-29')).toBe(20);
  });

  it('rejects a reference date before the birth date', () => {
    expect(() => ageOn('2026-10-29', '2026-10-28')).toThrow(RangeError);
  });

  it('rejects invalid dates', () => {
    expect(() => ageOn('2026-02-29', '2027-01-01')).toThrow(RangeError);
    expect(() => ageOn('2008-05-05', '05.05.2026')).toThrow(RangeError);
  });
});

describe('isMinorOn', () => {
  it('is true until the 18th birthday and false from it on', () => {
    expect(isMinorOn('2008-10-30', '2026-10-29')).toBe(true);
    expect(isMinorOn('2008-10-29', '2026-10-29')).toBe(false);
  });

  it('applies the 29 February rule', () => {
    expect(isMinorOn('2008-02-29', '2026-02-28')).toBe(true);
    expect(isMinorOn('2008-02-29', '2026-03-01')).toBe(false);
  });
});
