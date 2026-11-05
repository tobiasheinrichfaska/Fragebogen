// Operating system and browser for the system note — self-reported by the device, never proof.
// Prefers User-Agent Client Hints (brand list + platform); falls back to the User-Agent string.
// Only the major version is kept: enough to describe the device, less fingerprinting.

export interface Platform {
  os: string;
  browser: string;
  browserVersion: string;
}

const UNKNOWN = 'unbekannt';

const UA_BROWSERS: readonly [RegExp, string][] = [
  [/EdgiOS\/(\d+)/, 'Edge'],
  [/Edg(?:e|A)?\/(\d+)/, 'Edge'],
  [/OPR\/(\d+)/, 'Opera'],
  [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
  [/FxiOS\/(\d+)/, 'Firefox'],
  [/Firefox\/(\d+)/, 'Firefox'],
  [/CriOS\/(\d+)/, 'Chrome'],
  [/Chrome\/(\d+)/, 'Chrome'],
  [/Version\/(\d+)[\d.]* (?:Mobile\/\S+ )?Safari\//, 'Safari'],
];

const UA_SYSTEMS: readonly [RegExp, string][] = [
  [/Windows NT/, 'Windows'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

export function platformFromUserAgent(userAgent: string): Platform {
  const os = UA_SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? UNKNOWN;
  for (const [pattern, browser] of UA_BROWSERS) {
    const match = pattern.exec(userAgent);
    if (match) return { os, browser, browserVersion: match[1] ?? UNKNOWN };
  }
  return { os, browser: UNKNOWN, browserVersion: UNKNOWN };
}

const CH_BRANDS: Readonly<Record<string, string>> = {
  'Microsoft Edge': 'Edge',
  'Google Chrome': 'Chrome',
  Opera: 'Opera',
  'Samsung Internet': 'Samsung Internet',
  Chromium: 'Chromium',
};

const CH_PLATFORMS: Readonly<Record<string, string>> = {
  Windows: 'Windows',
  macOS: 'macOS',
  Android: 'Android',
  'Chrome OS': 'ChromeOS',
  ChromeOS: 'ChromeOS',
  Linux: 'Linux',
  iOS: 'iOS',
};

/** From navigator.userAgentData: a known brand wins over "Chromium", GREASE brands are ignored. */
export function platformFromClientHints(
  brands: readonly { brand: string; version: string }[],
  platform: string,
): Platform {
  const known = brands.filter((entry) => CH_BRANDS[entry.brand] !== undefined);
  const chosen = known.find((entry) => entry.brand !== 'Chromium') ?? known[0];
  return {
    os: CH_PLATFORMS[platform] ?? (platform === '' ? UNKNOWN : platform),
    browser: chosen ? (CH_BRANDS[chosen.brand] ?? chosen.brand) : UNKNOWN,
    browserVersion: chosen?.version.split('.')[0] || UNKNOWN,
  };
}

/**
 * The kind of device for a test report (Tobias 2026-11-05: the report named no device, so nobody
 * could tell whether a test ran on an iPhone). An iPad's Safari reports a Mac; only touch gives it
 * away. Android says "Mobile" on phones only.
 */
export function deviceKind(userAgent: string, os: string, maxTouchPoints: number): string {
  if (/iPhone|iPod/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'iPad';
  if (/Android/.test(userAgent))
    return /Mobile/.test(userAgent) ? 'Android-Smartphone' : 'Android-Tablet';
  return os === UNKNOWN ? 'Gerät unbekannt' : `${os}-Computer`;
}

/** "iPhone · Safari 18 · Bildschirm 390 × 844" — what the browser says, for the test report. */
export function deviceDescription(
  kind: string,
  platform: Platform,
  screen?: { width: number; height: number },
): string {
  const browser =
    platform.browser === UNKNOWN
      ? 'Browser unbekannt'
      : `${platform.browser} ${platform.browserVersion === UNKNOWN ? '' : platform.browserVersion}`.trim();
  const size =
    screen && screen.width > 0 && screen.height > 0
      ? ` · Bildschirm ${Math.round(screen.width)} × ${Math.round(screen.height)}`
      : '';
  return `${kind} · ${browser}${size}`;
}
