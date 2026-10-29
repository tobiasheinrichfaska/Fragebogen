/// <reference types="vite/client" />

/** Injected by vite.config.ts from package.json. */
declare const __APP_VERSION__: string;

/** Kanzlei configuration injected by vite.config.ts (validated there with parseAppConfig). */
declare const __KANZLEI_CONFIG__: import('./logic/appConfig').AppConfig;
