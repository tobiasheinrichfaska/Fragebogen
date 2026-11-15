// The installable web app (Tobias 2026-11-15, „1b“): icons that decode, a manifest that names them,
// and a service worker that leaves every request alone while online and starts the app offline.
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { inflateSync } from 'node:zlib';
import { imageSize } from '../logic/imageSize';
import { webAppHere } from '../logic/webApp';
import { cspFor } from './csp';
import {
  encodePng,
  iconPixels,
  iconPng,
  manifestText,
  OFFLINE_SHELL,
  serviceWorkerText,
  WEB_APP_FILES,
  webAppVersion,
  writeWebAppFiles,
} from './webApp';

const ACCENT = '#1f5fa8';

/** The RGBA rows of a PNG that encodePng wrote (one IDAT, filter 0). */
function decode(png: Uint8Array): Uint8Array {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  let at = 8;
  const data: Uint8Array[] = [];
  while (at < png.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    if (type === 'IDAT') data.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = new Uint8Array(inflateSync(Buffer.concat(data)));
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    expect(raw[y * (1 + width * 4)]).toBe(0);
    out.set(raw.subarray(y * (1 + width * 4) + 1, (y + 1) * (1 + width * 4)), y * width * 4);
  }
  return out;
}

const pixel = (rgba: Uint8Array, size: number, x: number, y: number) => [
  ...rgba.subarray((y * size + x) * 4, (y * size + x) * 4 + 4),
];

describe('the icons', () => {
  it('are PNG files that decode to the pixels drawn', () => {
    const pixels = iconPixels(48, ACCENT, 'any');
    const png = encodePng(48, 48, pixels);
    expect(imageSize(png)).toEqual({ width: 48, height: 48 });
    expect(decode(png)).toEqual(pixels);
  });

  it.each([
    [192, 'any'],
    [512, 'any'],
    [512, 'maskable'],
    [180, 'apple'],
  ] as const)('%i × %i (%s) has its size', (size, kind) => {
    expect(imageSize(iconPng(size, ACCENT, kind))).toEqual({ width: size, height: size });
  });

  it('show a white sheet on the accent colour; only „any“ leaves the corners free', () => {
    const any = iconPixels(192, ACCENT, 'any');
    expect(pixel(any, 192, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(any, 192, 96, 96)).toEqual([255, 255, 255, 255]);
    expect(pixel(any, 192, 20, 96)).toEqual([0x1f, 0x5f, 0xa8, 255]);
    for (const kind of ['maskable', 'apple'] as const) {
      expect(pixel(iconPixels(180, ACCENT, kind), 180, 0, 0)).toEqual([0x1f, 0x5f, 0xa8, 255]);
    }
  });

  it('keep the motif of the maskable icon inside the safe circle', () => {
    const size = 200;
    const pixels = iconPixels(size, ACCENT, 'maskable');
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const [r, g, b] = pixel(pixels, size, x, y);
        if (r === 0x1f && g === 0x5f && b === 0xa8) continue;
        expect(Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2)).toBeLessThan(0.4 * size);
      }
    }
  });

  it('take the configured accent colour', () => {
    expect(pixel(iconPixels(64, '#7a1f2b', 'apple'), 64, 0, 0)).toEqual([0x7a, 0x1f, 0x2b, 255]);
  });
});

describe('the manifest', () => {
  const manifest = JSON.parse(manifestText({ name: 'Fragebogen-Test', accent: ACCENT })) as {
    [key: string]: unknown;
    icons: { src: string; sizes: string; purpose: string }[];
  };

  it('opens the page next to it as a standalone app', () => {
    expect(manifest).toMatchObject({
      name: 'Fragebogen-Test',
      short_name: 'Fragebogen-Test',
      start_url: './',
      scope: './',
      display: 'standalone',
      lang: 'de',
      theme_color: ACCENT,
    });
  });

  it('names icons of 192 and 512 pixels and a maskable one, all written by the build', () => {
    expect(manifest.icons.map((icon) => [icon.sizes, icon.purpose])).toEqual([
      ['192x192', 'any'],
      ['512x512', 'any'],
      ['512x512', 'maskable'],
    ]);
    for (const icon of manifest.icons) expect(OFFLINE_SHELL).toContain(icon.src);
  });
});

// The service worker run in a sandbox with a stand-in for the browser's caches.
interface Handled {
  responded?: Promise<Response>;
  waited: Promise<unknown>[];
}

function serviceWorker(location: string, online: boolean, stored: Record<string, string> = {}) {
  const handlers = new Map<string, (event: object) => void>();
  const caches = new Map<string, Map<string, string>>([['andere-app', new Map()]]);
  const fetched: string[] = [];
  let skipped = false;
  let claimed = false;
  const cacheOf = (name: string) => {
    const known = caches.get(name) ?? new Map<string, string>();
    caches.set(name, known);
    return {
      addAll: async (requests: Request[]) => {
        for (const request of requests) {
          expect(request.cache).toBe('reload');
          known.set(request.url, `served ${request.url}`);
        }
      },
      match: async (url: string) => {
        const body = known.get(url);
        return body === undefined ? undefined : new Response(body);
      },
    };
  };
  const sandbox = {
    self: {
      location: { href: location },
      navigator: { onLine: online },
      addEventListener: (type: string, handler: (event: object) => void) =>
        handlers.set(type, handler),
      skipWaiting: async () => {
        skipped = true;
      },
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
    },
    caches: {
      open: async (name: string) => cacheOf(name),
      keys: async () => [...caches.keys()],
      delete: async (name: string) => caches.delete(name),
    },
    fetch: async (request: Request) => {
      fetched.push(request.url);
      return new Response('from the network');
    },
    URL,
    Request,
    Set,
    Promise,
  };
  const version = '0123456789abcdef';
  runInNewContext(serviceWorkerText(version), sandbox);
  const current = `fragebogen-${version}`;
  for (const [url, body] of Object.entries(stored)) {
    const cache = caches.get(current) ?? new Map<string, string>();
    cache.set(url, body);
    caches.set(current, cache);
  }
  const dispatch = (type: string, request?: Request): Handled => {
    const handled: Handled = { waited: [] };
    handlers.get(type)?.({
      request,
      waitUntil: (promise: Promise<unknown>) => handled.waited.push(promise),
      respondWith: (promise: Promise<Response>) => {
        handled.responded = promise;
      },
    });
    return handled;
  };
  return {
    caches,
    current,
    fetched,
    dispatch,
    state: () => ({ skipped, claimed }),
  };
}

describe('the service worker', () => {
  const PAGE = 'https://app.example.test/';

  it('stores the app at installation, freshly from the server, and takes over at once', async () => {
    const sw = serviceWorker(`${PAGE}sw.js`, true);
    await Promise.all(sw.dispatch('install').waited);
    expect([...(sw.caches.get(sw.current)?.keys() ?? [])]).toEqual(
      OFFLINE_SHELL.map((path) => new URL(path, PAGE).href),
    );
    expect(sw.state().skipped).toBe(true);
  });

  it('removes the copies of older builds only', async () => {
    const sw = serviceWorker(`${PAGE}sw.js`, true);
    sw.caches.set('fragebogen-aaaaaaaaaaaaaaaa', new Map());
    await Promise.all(sw.dispatch('install').waited);
    await Promise.all(sw.dispatch('activate').waited);
    expect([...sw.caches.keys()].sort()).toEqual(['andere-app', sw.current]);
    expect(sw.state().claimed).toBe(true);
  });

  it('leaves every request to the server while the device is online', () => {
    const sw = serviceWorker(`${PAGE}sw.js`, true, { [PAGE]: 'stored page' });
    for (const url of [PAGE, `${PAGE}index.html`, `${PAGE}manifest.json`]) {
      expect(sw.dispatch('fetch', new Request(url)).responded, url).toBeUndefined();
    }
  });

  it('starts the stored app offline, also with a start point or as index.html', async () => {
    const sw = serviceWorker(`${PAGE}sw.js`, false, {
      [PAGE]: 'stored page',
      [`${PAGE}icon-192.png`]: 'stored icon',
    });
    for (const url of [PAGE, `${PAGE}index.html`, `${PAGE}?startpunkt=sofortmeldung`]) {
      const responded = sw.dispatch('fetch', new Request(url)).responded;
      expect(await (await responded)?.text(), url).toBe('stored page');
    }
    const icon = sw.dispatch('fetch', new Request(`${PAGE}icon-192.png`)).responded;
    expect(await (await icon)?.text()).toBe('stored icon');
    expect(sw.fetched).toEqual([]);
  });

  it('never answers for anything but the app’s own files', () => {
    const sw = serviceWorker(`${PAGE}sw.js`, false, { [PAGE]: 'stored page' });
    for (const url of [
      `${PAGE}_zugang/einladen`,
      `${PAGE}hilfe/steuer-id/`,
      'https://other.example.test/',
    ]) {
      expect(sw.dispatch('fetch', new Request(url)).responded, url).toBeUndefined();
    }
    const post = new Request(`${PAGE}_zugang/bericht`, { method: 'POST', body: '{}' });
    expect(sw.dispatch('fetch', post).responded).toBeUndefined();
  });

  it('tries the network offline when nothing is stored yet', async () => {
    const sw = serviceWorker(`${PAGE}sw.js`, false);
    const responded = sw.dispatch('fetch', new Request(PAGE)).responded;
    expect(await (await responded)?.text()).toBe('from the network');
  });

  it('works in a folder: the files next to sw.js', async () => {
    const sw = serviceWorker(`${PAGE}test/sw.js`, true);
    await Promise.all(sw.dispatch('install').waited);
    expect(sw.caches.get(sw.current)?.has(`${PAGE}test/manifest.json`)).toBe(true);
  });

  it('gets a new version with every new page', () => {
    const manifest = manifestText({ name: 'Fragebogen', accent: ACCENT });
    expect(webAppVersion('<html>1</html>', manifest)).toMatch(/^[0-9a-f]{16}$/);
    expect(webAppVersion('<html>1</html>', manifest)).not.toBe(
      webAppVersion('<html>2</html>', manifest),
    );
    expect(() => serviceWorkerText('x')).toThrow();
  });
});

describe('the files next to the page', () => {
  it('are written by the build', () => {
    const dir = mkdtempSync(join(tmpdir(), 'webapp-'));
    try {
      const written = writeWebAppFiles(dir, '<html></html>', {
        name: 'Fragebogen',
        accent: ACCENT,
      });
      expect(written).toEqual(Object.values(WEB_APP_FILES).sort());
      expect(readdirSync(dir).sort()).toEqual(written);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('where the app offers installation', () => {
  it('only as a hosted build at an https address', () => {
    expect(webAppHere(true, 'https:')).toBe(true);
    expect(webAppHere(true, 'file:')).toBe(false);
    expect(webAppHere(true, 'http:')).toBe(false);
    expect(webAppHere(false, 'https:')).toBe(false);
  });

  it('lets the policy of a hosted build read manifest and icons and run the service worker', () => {
    const policy = cspFor(["'sha256-a'"], ["'sha256-b'"], { webApp: true });
    expect(policy).toContain("worker-src 'self'");
    expect(policy).toContain("manifest-src 'self'");
    expect(policy).toContain("img-src 'self' data: blob:");
    expect(policy).toContain("connect-src 'none'");
    expect(cspFor(["'sha256-a'"], ["'sha256-b'"])).not.toMatch(/'self'|manifest-src/);
  });
});
