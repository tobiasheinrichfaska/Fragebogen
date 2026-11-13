import { defineConfig, devices } from '@playwright/test';

// The built single file is opened from disk (file://), the strictest case for the CSP; the
// hosted copy behaves the same apart from the address.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: 2,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
