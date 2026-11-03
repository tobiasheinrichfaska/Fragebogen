// The device's calendar day for date bounds (Tobias 2026-11-03: birth date never later than today).
import { boundDay, todayIso } from './clock';

describe('todayIso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is the local calendar day, also just before midnight and on New Year', () => {
    expect(todayIso(new Date(2026, 10, 3, 23, 59, 59))).toBe('2026-11-03');
    expect(todayIso(new Date(2027, 0, 1, 0, 0, 1))).toBe('2027-01-01');
    expect(todayIso(new Date(2028, 1, 29, 12))).toBe('2028-02-29');
  });

  it('reads the device clock when no day is given', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 7, 8));
    expect(todayIso()).toBe('2026-05-07');
    expect(boundDay('today')).toBe('2026-05-07');
  });

  it('leaves a fixed day as it is', () => {
    expect(boundDay('1876-01-01')).toBe('1876-01-01');
  });
});
