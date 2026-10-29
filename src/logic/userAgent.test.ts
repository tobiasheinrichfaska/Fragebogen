import { platformFromClientHints, platformFromUserAgent } from './userAgent';

describe('platformFromUserAgent', () => {
  it.each<[string, string, string, string]>([
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
      'Windows',
      'Edge',
      '141',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
      'Windows',
      'Firefox',
      '144',
    ],
    [
      'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
      'iOS',
      'Safari',
      '18',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
      'iOS',
      'Chrome',
      '141',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
      'macOS',
      'Safari',
      '18',
    ],
    [
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
      'Android',
      'Chrome',
      '141',
    ],
  ])('%s', (ua, os, browser, browserVersion) => {
    expect(platformFromUserAgent(ua)).toEqual({ os, browser, browserVersion });
  });

  it('says "unbekannt" when nothing matches', () => {
    expect(platformFromUserAgent('curl/8.0')).toEqual({
      os: 'unbekannt',
      browser: 'unbekannt',
      browserVersion: 'unbekannt',
    });
  });
});

describe('platformFromClientHints', () => {
  it('prefers the named brand over Chromium and ignores GREASE brands', () => {
    expect(
      platformFromClientHints(
        [
          { brand: 'Not)A;Brand', version: '99' },
          { brand: 'Chromium', version: '141' },
          { brand: 'Microsoft Edge', version: '141' },
        ],
        'Windows',
      ),
    ).toEqual({ os: 'Windows', browser: 'Edge', browserVersion: '141' });
  });

  it('falls back to Chromium and to the raw platform name', () => {
    expect(platformFromClientHints([{ brand: 'Chromium', version: '141.0.1' }], 'Fuchsia')).toEqual(
      {
        os: 'Fuchsia',
        browser: 'Chromium',
        browserVersion: '141',
      },
    );
    expect(platformFromClientHints([], '')).toEqual({
      os: 'unbekannt',
      browser: 'unbekannt',
      browserVersion: 'unbekannt',
    });
  });
});
