// The hosted app as an installable web app (Tobias 2026-11-15, „1b“): at an https address the page
// links its manifest and icons and registers the service worker that the build wrote next to it
// (src/build/webApp.ts). A downloaded copy (file://) and the builds that are not uploaded link nothing.
import { WEB_APP_FILES, webAppHere } from '../logic/webApp';

function add(doc: Document, tag: 'link' | 'meta', attributes: Record<string, string>): void {
  const element = doc.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  doc.head.append(element);
}

/**
 * Links manifest and icons and registers the service worker. Behind the test zone's login the
 * manifest is fetched with the login's cookie (`crossorigin="use-credentials"`). A failed
 * registration changes nothing: the app runs as before, it only does not start offline.
 */
export function offerInstallation(doc: Document = document, nav: Navigator = navigator): void {
  if (!webAppHere(__WEB_APP__, doc.location.protocol)) return;
  add(doc, 'link', {
    rel: 'manifest',
    href: WEB_APP_FILES.manifest,
    crossorigin: 'use-credentials',
  });
  add(doc, 'link', { rel: 'apple-touch-icon', href: WEB_APP_FILES.appleTouch });
  add(doc, 'meta', { name: 'apple-mobile-web-app-title', content: doc.title });
  if ('serviceWorker' in nav) {
    nav.serviceWorker.register(WEB_APP_FILES.serviceWorker).catch(() => undefined);
  }
}
