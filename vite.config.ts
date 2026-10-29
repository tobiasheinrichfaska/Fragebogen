import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { parseAppConfig } from './src/logic/appConfig';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Kanzlei branding stays out of the public repo: config/kanzlei.local.json (gitignored) wins over
// the neutral example. An invalid file stops the build instead of shipping a broken link.
const localConfig = new URL('./config/kanzlei.local.json', import.meta.url);
const configFile = existsSync(localConfig)
  ? localConfig
  : new URL('./config/kanzlei.example.json', import.meta.url);
const kanzleiConfig = parseAppConfig(JSON.parse(readFileSync(configFile, 'utf8')));
if (!kanzleiConfig.ok) {
  throw new Error(`Invalid Kanzlei configuration: ${JSON.stringify(kanzleiConfig.issues)}`);
}

export default defineConfig({
  // Relative asset paths so the single file also runs from file://
  base: './',
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __KANZLEI_CONFIG__: JSON.stringify(kanzleiConfig.config),
  },
  build: {
    target: 'es2022',
    // The preload polyfill uses fetch(), which fails on file:// — everything is inlined anyway
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 5000,
  },
  server: { port: 5178, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    // Vitest 4.1.8 forks/threads pools run 0 tests ("failed to find the current suite")
    pool: 'vmThreads',
    globals: true,
  },
});
