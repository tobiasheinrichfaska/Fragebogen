import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
import { withCsp } from './src/build/csp';
import { escapeReplacementChar } from './src/build/replacementChar';
import { parseAppConfig } from './src/logic/appConfig';
import { parseExportMappings } from './src/logic/exportMapping';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Escapes U+FFFD in every chunk before the single-file step inlines it (see replacementChar.ts). */
function asciiReplacementChar(): Plugin {
  return {
    name: 'ascii-replacement-char',
    enforce: 'pre',
    generateBundle: (_options, bundle) => {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk') chunk.code = escapeReplacementChar(chunk.code);
      }
    },
  };
}

/** The review preview (--mode drafts) carries its own name, so it is never mistaken for the app. */
function previewTitle(): Plugin {
  let preview = false;
  return {
    name: 'preview-title',
    configResolved: (config) => {
      preview = config.mode === 'drafts';
    },
    transformIndexHtml: (html) =>
      preview
        ? html.replace('<title>Fragebogen</title>', '<title>Fragebogen-Vorschau</title>')
        : html,
  };
}

/**
 * The Content-Security-Policy with the hashes of what the single-file step inlined — applied to the
 * written file, because that step inlines during generateBundle after the other plugins.
 */
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

// Mappings to payroll programs name the programs' fields and stay out of the public repo as well:
// config/export.local.json (gitignored) or none. An invalid file stops the build.
const localExport = new URL('./config/export.local.json', import.meta.url);
const exportMappings = parseExportMappings(
  existsSync(localExport) ? JSON.parse(readFileSync(localExport, 'utf8')) : [],
);
if (!exportMappings.ok) {
  throw new Error(`Invalid export mapping: ${JSON.stringify(exportMappings.issues)}`);
}

export default defineConfig(({ mode }) => ({
  // Relative asset paths so the single file also runs from file://
  base: './',
  plugins: [
    asciiReplacementChar(),
    react(),
    viteSingleFile(),
    previewTitle(),
    contentSecurityPolicy(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __KANZLEI_CONFIG__: JSON.stringify(kanzleiConfig.config),
    // Only the Kanzlei build and the review preview carry the mapping — never the hosted app.
    __EXPORT_MAPPINGS__: JSON.stringify(
      mode === 'kanzlei' || mode === 'drafts' ? exportMappings.mappings : [],
    ),
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
    // forks again since Vitest 4.1.12 (4.1.8 ran 0 tests there). pdf.js needs it: under vmThreads it
    // fails with "Linked modules must use the same context" (2026-10-30).
    pool: 'forks',
    globals: true,
  },
}));
