import { monthAfter, monthsAboveSixtyFive, regelaltersgrenze } from './regelaltersgrenze';

describe('monthsAboveSixtyFive (§ 235 Abs. 2 SGB VI)', () => {
  it.each([
    [1946, 0],
    [1947, 1],
    [1952, 6],
    [1958, 12],
    [1959, 14],
    [1960, 16],
    [1963, 22],
    [1964, 24],
    [1990, 24],
  ])('born %i → 65 years + %i months', (year, months) => {
    expect(monthsAboveSixtyFive(year)).toBe(months);
  });
});

describe('regelaltersgrenze', () => {
  it.each([
    ['1960-03-15', '2026-07-14'],
    ['1964-01-01', '2030-12-31'],
    ['1964-01-02', '2031-01-01'],
    ['1958-06-10', '2024-06-09'],
    ['1946-11-01', '2011-10-31'],
    ['1959-07-31', '2025-09-30'],
    ['1959-05-31', '2025-07-30'],
    ['1964-02-29', '2031-02-28'],
    ['1963-12-31', '2030-10-30'],
  ])('born %s → reached on %s', (birth, reached) => {
    expect(regelaltersgrenze(birth)).toBe(reached);
  });

  it('refuses a malformed birth date', () => {
    expect(regelaltersgrenze('1960-02-30')).toBeUndefined();
    expect(regelaltersgrenze('15.03.1960')).toBeUndefined();
  });
});

describe('monthAfter', () => {
  it.each([
    ['2026-07-14', '2026-08'],
    ['2030-12-31', '2031-01'],
  ])('%s → %s', (date, month) => {
    expect(monthAfter(date as never)).toBe(month);
  });
});
