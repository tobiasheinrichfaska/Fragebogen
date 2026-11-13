import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
import { withCsp } from './src/build/csp.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** The CSP with the hashes of what the single-file step inlined — applied to the written file. */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    writeBundle: (options, bundle) => {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.html') || !options.dir) continue;
        const path = join(options.dir, file.fileName);
        writeFileSync(path, withCsp(readFileSync(path, 'utf8')));
      }
    },
  };
}

export default defineConfig({
  // Relative paths so the single file also runs from file://
  base: './',
  plugins: [react(), viteSingleFile(), contentSecurityPolicy()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    // The preload polyfill uses fetch(), which the CSP forbids — everything is inlined anyway
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 10000,
  },
  server: { port: 5178, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    // pdf.js fails under vmThreads ("Linked modules must use the same context"), as in Fragebogen
    pool: 'forks',
    globals: true,
  },
});
