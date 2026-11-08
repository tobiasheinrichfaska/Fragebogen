// Every end-to-end test, the former manual tests included, in Chromium, Firefox and WebKit
// (`npm run test:e2e:alle`): before a release or after a change that may behave differently in
// one engine.
import { defineConfig } from '@playwright/test';
import base, { projects } from './playwright.config';

export default defineConfig({ ...base, projects: projects(true) });
