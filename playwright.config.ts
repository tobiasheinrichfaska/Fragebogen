// End-to-end tests (step 10): the built single file dist/index.html opened from file:// in the three
// browser engines — Chromium (Chrome/Edge), Firefox and WebKit (Safari). `npm run test:e2e` builds
// first. Browsers: `npx playwright install chromium firefox webkit` (Playwright 1.61.0).
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: { acceptDownloads: true, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
