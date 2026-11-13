/// <reference types="vite/client" />

/** App version from package.json, injected at build time. */
declare const __APP_VERSION__: string;

/** pdf.js worker code, run in the main thread ("fake worker") — file:// forbids blob: workers. */
declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
