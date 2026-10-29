import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig({
  // Relative asset paths so the single file also runs from file://
  base: './',
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    // The preload polyfill uses fetch(), which fails on file:// — everything is inlined anyway
    modulePreload: { polyfill: false },
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
