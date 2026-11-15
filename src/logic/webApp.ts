// The files of the installable web app (Tobias 2026-11-15, „1b“) — named once for the build, which
// writes them (src/build/webApp.ts), and for the page, which links them (src/io/webApp.ts).

export const WEB_APP_FILES = {
  manifest: 'manifest.json',
  serviceWorker: 'sw.js',
  icon192: 'icon-192.png',
  icon512: 'icon-512.png',
  maskable: 'icon-maskable-512.png',
  appleTouch: 'apple-touch-icon.png',
} as const;

/** What the service worker stores for offline use: the page (as `./`) and what the manifest names. */
export const OFFLINE_SHELL: readonly string[] = [
  './',
  WEB_APP_FILES.manifest,
  WEB_APP_FILES.icon192,
  WEB_APP_FILES.icon512,
  WEB_APP_FILES.maskable,
  WEB_APP_FILES.appleTouch,
];

/**
 * Whether a page offers itself for installation: a hosted build at an https address. A downloaded
 * copy (file://) links nothing — it would ask for files that are not next to it.
 */
export function webAppHere(built: boolean, protocol: string): boolean {
  return built && protocol === 'https:';
}
