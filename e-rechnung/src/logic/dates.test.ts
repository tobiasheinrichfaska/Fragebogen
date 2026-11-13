import { germanDate, isoDate } from './dates';

describe('isoDate', () => {
  it('reads UBL and CII format 102', () => {
    expect(isoDate('2026-11-13')).toBe('2026-11-13');
    expect(isoDate('20261113')).toBe('2026-11-13');
    expect(isoDate(' 20240229 ')).toBe('2024-02-29');
  });

  it('refuses impossible or foreign dates', () => {
    expect(isoDate('20230229')).toBeUndefined();
    expect(isoDate('2026-13-01')).toBeUndefined();
    expect(isoDate('2026-04-31')).toBeUndefined();
    expect(isoDate('13.11.2026')).toBeUndefined();
    expect(isoDate('2026-11-13T10:00:00')).toBeUndefined();
    expect(isoDate(undefined)).toBeUndefined();
  });

  it('shows German dates', () => {
    expect(germanDate('2026-01-05')).toBe('05.01.2026');
  });
});
