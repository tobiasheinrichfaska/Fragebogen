// Device facts for sealing: random ids and nonces (crypto.getRandomValues — randomUUID needs a
// secure context, which file:// is not), the device clock as local time with offset plus UTC, and
// the self-reported platform for the system note. Everything here is what the device says.
import { APP_VERSION } from '../appInfo';
import type { InputType, SystemNote } from '../logic/model';
import { platformFromClientHints, platformFromUserAgent, type Platform } from '../logic/userAgent';

function randomBytes(count: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(count));
}

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Lower-case UUID v4. */
export function newQuestionnaireId(): string {
  const bytes = randomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** 128-bit nonce, lower-case hex. */
export function newNonce(): string {
  return hex(randomBytes(16));
}

export interface DeviceNow {
  local: string;
  utc: string;
  timeZone: string;
}

const two = (n: number) => String(n).padStart(2, '0');

/** "2026-10-30T09:15:02.123+01:00" and "2026-10-30T08:15:02.123Z" for the same instant. */
export function deviceNow(date = new Date()): DeviceNow {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const local =
    `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}` +
    `T${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}` +
    `.${String(date.getMilliseconds()).padStart(3, '0')}${sign}${two(Math.floor(abs / 60))}:${two(abs % 60)}`;
  let timeZone = 'unbekannt';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
  } catch {
    // Older engines without Intl time zones: the offset in `local` still states the zone.
  }
  return { local, utc: date.toISOString(), timeZone };
}

interface UserAgentData {
  brands: { brand: string; version: string }[];
  platform: string;
}

function platform(): { platform: Platform; source: SystemNote['uaSource'] } {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  if (data && Array.isArray(data.brands) && data.brands.length > 0) {
    return { platform: platformFromClientHints(data.brands, data.platform), source: 'ua-ch' };
  }
  return { platform: platformFromUserAgent(navigator.userAgent), source: 'ua-string' };
}

export function systemNoteFor(now: DeviceNow, inputTypes: readonly InputType[]): SystemNote {
  const { platform: p, source } = platform();
  return {
    signedAtLocal: now.local,
    timeZone: now.timeZone,
    signedAtUtc: now.utc,
    os: p.os,
    browser: p.browser,
    browserVersion: p.browserVersion,
    uaSource: source,
    language: navigator.language || 'unbekannt',
    inputTypes: inputTypes.length > 0 ? [...inputTypes] : ['keyboard'],
    appVersion: APP_VERSION,
  };
}

/** Input methods used on this device since the last reset (for the system note). */
export class InputTracker {
  private readonly seen = new Set<InputType>();
  private readonly onPointer = (event: PointerEvent) => {
    const type = event.pointerType;
    if (type === 'pen' || type === 'touch' || type === 'mouse') this.seen.add(type);
  };
  private readonly onKey = () => this.seen.add('keyboard');

  start(): void {
    window.addEventListener('pointerdown', this.onPointer, { capture: true, passive: true });
    window.addEventListener('keydown', this.onKey, { capture: true, passive: true });
  }

  stop(): void {
    window.removeEventListener('pointerdown', this.onPointer, { capture: true });
    window.removeEventListener('keydown', this.onKey, { capture: true });
  }

  reset(): void {
    this.seen.clear();
  }

  types(): InputType[] {
    const order: InputType[] = ['pen', 'touch', 'mouse', 'keyboard'];
    return order.filter((type) => this.seen.has(type));
  }
}
