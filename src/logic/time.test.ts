import { days, isLocalTime, isUtcTime, localMillis, minutes, sameInstant, utcMillis } from './time';

describe('UTC and local times', () => {
  it.each(['2026-10-29T09:15:00Z', '2026-10-29T09:15:00.000Z', '2028-02-29T23:59:59.999Z'])(
    'accepts the UTC time %s',
    (value) => {
      expect(isUtcTime(value)).toBe(true);
    },
  );

  it.each([
    '2026-10-29T09:15:00',
    '2026-10-29T09:15:00+00:00',
    '2026-10-29 09:15:00Z',
    '2026-02-29T09:15:00Z',
    '2026-10-29T24:00:00Z',
    '2026-10-29T09:60:00Z',
    '2026-10-29T09:15:00.5Z',
    '',
  ])('rejects %j as UTC time', (value) => {
    expect(isUtcTime(value)).toBe(false);
  });

  it.each([
    '2026-10-29T10:15:00+01:00',
    '2026-07-01T11:15:00.000+02:00',
    '2026-10-29T04:15:00-05:00',
  ])('accepts the local time %s', (value) => {
    expect(isLocalTime(value)).toBe(true);
  });

  it.each([
    '2026-10-29T10:15:00Z',
    '2026-10-29T10:15:00+0100',
    '2026-10-29T10:15:00+15:00',
    '2026-10-29T10:15:00',
  ])('rejects %j as local time', (value) => {
    expect(isLocalTime(value)).toBe(false);
  });

  it('applies the offset', () => {
    expect(localMillis('2026-10-29T10:15:00+01:00')).toBe(utcMillis('2026-10-29T09:15:00Z'));
    expect(localMillis('2026-10-29T04:15:00-05:00')).toBe(utcMillis('2026-10-29T09:15:00Z'));
  });

  it('compares instants independent of the runtime time zone', () => {
    expect(sameInstant('2026-10-29T10:15:00.000+01:00', '2026-10-29T09:15:00.000Z')).toBe(true);
    expect(sameInstant('2026-10-29T10:15:00+02:00', '2026-10-29T09:15:00Z')).toBe(false);
    expect(sameInstant('kaputt', '2026-10-29T09:15:00Z')).toBe(false);
  });

  it('converts durations', () => {
    expect(minutes(15)).toBe(900_000);
    expect(days(2)).toBe(172_800_000);
  });
});
