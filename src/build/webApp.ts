// The hosted app as an installable web app (Tobias 2026-11-15: „warum ist Fragebogen nicht
// installierbar?“ — „1b machen wir“: manifest, icons and a service worker that starts the app
// offline). The build writes the files next to dist/index.html and dist-test/index.html; the page
// links them only at an https address (src/io/webApp.ts), so a downloaded copy stays one file.
//
// The service worker stays out of the way while the device is online: every page load goes to the
// server as before (newest version, the test zone's login, `?startpunkt=`, /_zugang/). Only without
// a network it answers with the copy it stored when it was installed. A new build gives sw.js a new
// version, so the browser installs it on the next visit and stores the new app — never any answers.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { OFFLINE_SHELL, WEB_APP_FILES } from '../logic/webApp';

export { OFFLINE_SHELL, WEB_APP_FILES };

// --- PNG -------------------------------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** An 8-bit RGBA image as PNG (no filter, deflate). */
export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  if (rgba.length !== width * height * 4) throw new Error('RGBA data does not match the size');
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8); // 8 bit, RGBA, deflate, no filter method, no interlace
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', new Uint8Array(deflateSync(raw, { level: 9 }))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

// --- Icon ------------------------------------------------------------------------------------

type Rgba = readonly [number, number, number, number];

function rgbaOf(hex: string): Rgba {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`not a #rrggbb colour: ${hex}`);
  return [
    Number.parseInt(match[1] ?? '0', 16),
    Number.parseInt(match[2] ?? '0', 16),
    Number.parseInt(match[3] ?? '0', 16),
    255,
  ];
}

const WHITE: Rgba = [255, 255, 255, 255];
const NONE: Rgba = [0, 0, 0, 0];

/** Inside a rectangle with rounded corners (unit coordinates). */
function inRoundedRect(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
): boolean {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function nearSegment(
  x: number,
  y: number,
  [ax, ay]: readonly [number, number],
  [bx, by]: readonly [number, number],
  half: number,
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= half ** 2;
}

export type IconKind = 'any' | 'maskable' | 'apple';

/**
 * The app icon: a white sheet with three lines and a tick on the accent colour. „any“ has round
 * corners and a transparent edge; „maskable“ keeps the sheet inside the safe circle (80 %) on a
 * full square; „apple“ is a full opaque square, the phone rounds it.
 */
export function iconPixels(size: number, accent: string, kind: IconKind): Uint8Array {
  const ground = rgbaOf(accent);
  const scale = kind === 'maskable' ? 0.8 : kind === 'apple' ? 0.9 : 1;
  const colourAt = (u: number, v: number): Rgba => {
    if (kind === 'any' && !inRoundedRect(u, v, 0.02, 0.02, 0.98, 0.98, 0.2)) return NONE;
    // the motif in its own coordinates, scaled around the centre
    const x = 0.5 + (u - 0.5) / scale;
    const y = 0.5 + (v - 0.5) / scale;
    if (!inRoundedRect(x, y, 0.27, 0.17, 0.73, 0.83, 0.05)) return ground;
    const lines: readonly (readonly [number, number, number])[] = [
      [0.29, 0.35, 0.65],
      [0.4, 0.35, 0.65],
      [0.51, 0.35, 0.56],
    ];
    for (const [top, left, right] of lines) {
      if (inRoundedRect(x, y, left, top, right, top + 0.045, 0.0225)) return ground;
    }
    const tick = 0.03;
    if (
      nearSegment(x, y, [0.38, 0.67], [0.45, 0.74], tick) ||
      nearSegment(x, y, [0.45, 0.74], [0.62, 0.6], tick)
    ) {
      return ground;
    }
    return WHITE;
  };
  const samples = 4;
  const out = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const [cr, cg, cb, ca] = colourAt(
            (px + (sx + 0.5) / samples) / size,
            (py + (sy + 0.5) / samples) / size,
          );
          r += cr * ca;
          g += cg * ca;
          b += cb * ca;
          a += ca;
        }
      }
      const at = (py * size + px) * 4;
      if (a > 0) {
        out[at] = Math.round(r / a);
        out[at + 1] = Math.round(g / a);
        out[at + 2] = Math.round(b / a);
      }
      out[at + 3] = Math.round(a / (samples * samples));
    }
  }
  return out;
}

export function iconPng(size: number, accent: string, kind: IconKind): Uint8Array {
  return encodePng(size, size, iconPixels(size, accent, kind));
}

// --- Manifest and service worker -------------------------------------------------------------

export interface WebAppOptions {
  /** Name on the home screen: the page title of the build („Fragebogen“, „Fragebogen-Test“). */
  name: string;
  /** Accent colour (#rrggbb): the Kanzlei's from the configuration, else the app's own. */
  accent: string;
}

export function manifestText({ name, accent }: WebAppOptions): string {
  const manifest = {
    id: './',
    name,
    short_name: name,
    description: 'Fragebögen ausfüllen, unterschreiben und als PDF weitergeben – auf diesem Gerät.',
    lang: 'de',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: accent,
    icons: [
      { src: WEB_APP_FILES.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: WEB_APP_FILES.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: WEB_APP_FILES.maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * The service worker. `version` names the build; its cache holds the offline copy. Plain script,
 * no imports (a service worker runs on its own, next to the page).
 */
export function serviceWorkerText(version: string): string {
  if (!/^[0-9a-f]{16}$/.test(version)) throw new Error('version must be 16 hex digits');
  return `// Fragebogen: offline copy of the app (generated by src/build/webApp.ts, do not edit).
// Online every request goes to the server untouched; offline the app's own files come from the
// copy stored at installation. It stores the app only, never an answer.
'use strict';
const CACHE = 'fragebogen-${version}';
const SHELL = ${JSON.stringify(OFFLINE_SHELL)};
const base = new URL('./', self.location.href);
const urlOf = (path) => new URL(path, base).href;
const PAGE = urlOf('./');
const INDEX = urlOf('index.html');
const STORED = new Set(SHELL.map(urlOf));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((path) => new Request(urlOf(path), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fragebogen-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || self.navigator.onLine) return;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  const key = url.href === INDEX ? PAGE : url.href;
  if (!STORED.has(key)) return;
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(key))
      .then((stored) => stored || fetch(request)),
  );
});
`;
}

/** The build version: the first 16 hex digits of the SHA-256 over the page and the manifest. */
export function webAppVersion(html: string, manifest: string): string {
  return createHash('sha256').update(html).update('\0').update(manifest).digest('hex').slice(0, 16);
}

/** Writes manifest, icons and service worker next to the built page; returns the file names. */
export function writeWebAppFiles(dir: string, html: string, options: WebAppOptions): string[] {
  mkdirSync(dir, { recursive: true });
  const manifest = manifestText(options);
  const files: [string, string | Uint8Array][] = [
    [WEB_APP_FILES.manifest, manifest],
    [WEB_APP_FILES.icon192, iconPng(192, options.accent, 'any')],
    [WEB_APP_FILES.icon512, iconPng(512, options.accent, 'any')],
    [WEB_APP_FILES.maskable, iconPng(512, options.accent, 'maskable')],
    [WEB_APP_FILES.appleTouch, iconPng(180, options.accent, 'apple')],
    [WEB_APP_FILES.serviceWorker, serviceWorkerText(webAppVersion(html, manifest))],
  ];
  for (const [name, content] of files) writeFileSync(join(dir, name), content);
  return files.map(([name]) => name).sort();
}
