// End-to-end tests (step 10): the built single file dist/index.html opened from file:// in the three
// browser engines — Chromium (Chrome/Edge), Firefox and WebKit (Safari). `npm run test:e2e` builds
// first. Browsers: `npx playwright install chromium firefox webkit` (Playwright 1.61.0).
// The former manual tests (tests/e2e/handtests/, 2026-11-08) run in Chromium; in WebKit only those
// tagged @webkit (iPhone, Safari). `npm run test:e2e:alle` (playwright.alle.config.ts) runs every
// test in all three engines — about an hour.
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const HANDTESTS = '**/handtests/**';

/**
 * A POSIX locale (the cloud containers, 2026-11-14) kept Chromium from taking files whose path holds
 * „—“ or „€“ — the output folder of a test is named after its title. On Linux without UTF-8 the
 * browsers get a UTF-8 locale of their own; Windows and a UTF-8 shell stay as they are.
 */
const UTF8 = /utf-?8/i.test(process.env.LC_ALL ?? process.env.LANG ?? '');
const browserEnv: Record<string, string> =
  process.platform === 'linux' && !UTF8
    ? {
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            (entry): entry is [string, string] => entry[1] !== undefined,
          ),
        ),
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
      }
    : {};

export function projects(allEngines: boolean): PlaywrightTestConfig['projects'] {
  const others = allEngines ? {} : { testIgnore: HANDTESTS };
  return [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, ...others },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, ...others },
    ...(allEngines
      ? []
      : [
          {
            name: 'webkit-handtests',
            use: { ...devices['Desktop Safari'] },
            testMatch: HANDTESTS,
            grep: /@webkit/,
          },
        ]),
  ];
}

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  // Four workers made WebKit hit the 180 s timeout (the flow on 2026-11-01, an emulated phone page that
  // stopped answering on 2026-11-08); two took too long with the former manual tests.
  workers: 3,
  reporter: [['list']],
  use: {
    acceptDownloads: true,
    // The hosted builds register a service worker (2026-11-15). Every test runs without it — its
    // fetches would bypass page.route — except tests/e2e/webApp.spec.ts, which allows it.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    ...(Object.keys(browserEnv).length > 0 ? { launchOptions: { env: browserEnv } } : {}),
  },
  projects: projects(false),
});
