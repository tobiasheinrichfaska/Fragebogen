// Points in time as ISO 8601 strings: UTC ("…Z") and device-local with offset ("…+01:00").
// Only these two exact shapes are accepted; parsing never depends on the runtime's time zone.
import { formatGermanDate, parseIsoDate } from './dates';

const UTC = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?Z$/;
const LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?[+-](\d{2}):(\d{2})$/;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

function millis(value: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(value);
  if (!match) return undefined;
  const [, date = '', hour = '', minute = '', second = '', offsetHour = '0', offsetMinute = '0'] =
    match;
  const valid =
    parseIsoDate(date) !== null &&
    Number(hour) <= 23 &&
    Number(minute) <= 59 &&
    Number(second) <= 59 &&
    Number(offsetHour) <= 14 &&
    Number(offsetMinute) <= 59;
  return valid ? Date.parse(value) : undefined;
}

export function utcMillis(value: string): number | undefined {
  return millis(value, UTC);
}

export function localMillis(value: string): number | undefined {
  return millis(value, LOCAL);
}

export function isUtcTime(value: string): boolean {
  return utcMillis(value) !== undefined;
}

export function isLocalTime(value: string): boolean {
  return localMillis(value) !== undefined;
}

/** Local time with offset and UTC time denote the same instant. */
export function sameInstant(local: string, utc: string): boolean {
  const a = localMillis(local);
  return a !== undefined && a === utcMillis(utc);
}

/** Local time with offset → "31.10.2026, 11:00 Uhr" (the signer's wall clock, as shown on paper). */
export function formatLocalDateTime(local: string): string {
  if (!isLocalTime(local)) return local;
  return `${formatGermanDate(local.slice(0, 10))}, ${local.slice(11, 16)} Uhr`;
}

export function minutes(count: number): number {
  return count * MINUTE_MS;
}

export function days(count: number): number {
  return count * DAY_MS;
}
