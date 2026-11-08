// End-to-end tests (step 10): the built single file dist/index.html opened from file:// in the three
// browser engines — Chromium (Chrome/Edge), Firefox and WebKit (Safari). `npm run test:e2e` builds
// first. Browsers: `npx playwright install chromium firefox webkit` (Playwright 1.61.0).
// The former manual tests (tests/e2e/handtests/, 2026-11-08) run in Chromium; in WebKit only those
// tagged @webkit (iPhone, Safari). `npm run test:e2e:alle` (playwright.alle.config.ts) runs every
// test in all three engines — about an hour.
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const HANDTESTS = '**/handtests/**';

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
  use: { acceptDownloads: true, trace: 'retain-on-failure' },
  projects: projects(false),
});
