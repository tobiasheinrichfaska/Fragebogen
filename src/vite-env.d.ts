/// <reference types="vite/client" />

/** Injected by vite.config.ts from package.json. */
declare const __APP_VERSION__: string;

/** Kanzlei configuration injected by vite.config.ts (validated there with parseAppConfig). */
declare const __KANZLEI_CONFIG__: import('./logic/appConfig').AppConfig;

/** Export mappings injected by vite.config.ts (validated there with parseExportMappings). */
declare const __EXPORT_MAPPINGS__: import('./logic/exportMapping').ExportMapping[];

/** pdf.js worker code, run in the main thread ("fake worker") — file:// forbids blob: workers. */
declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
