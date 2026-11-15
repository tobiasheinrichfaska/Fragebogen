// Kanzlei branding is configuration, never committed (public repo). Regression 2026-11-01: a doc
// line named the hosted subdomain. The markers come from the local config itself, so this public
// test names none of them; without config/kanzlei.local.json there is nothing that could leak.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const local = join(ROOT, 'config', 'kanzlei.local.json');

// Domains where anyone gets a subdomain: the domain itself names nobody, the subdomain may (the test
// area's own bunny.net pull zone, 2026-11-15). The docs name these domains freely.
const SHARED_DOMAINS: ReadonlySet<string> = new Set(['b-cdn.net']);

function markersOf(raw: Record<string, unknown>): string[] {
  const markers: string[] = [];
  if (typeof raw.kanzleiName === 'string' && raw.kanzleiName.trim().length >= 4) {
    markers.push(raw.kanzleiName.trim());
  }
  for (const key of ['appAddress', 'explainerBase', 'testAddress']) {
    const value = raw[key];
    if (typeof value !== 'string' || !value.startsWith('https://')) continue;
    // The registrable domain (e.g. "kanzlei-beispiel.de"), whatever subdomain the docs use; on a
    // shared domain the whole host.
    const hostname = new URL(value).hostname;
    const registrable = hostname.split('.').slice(-2).join('.');
    markers.push(SHARED_DOMAINS.has(registrable) ? hostname : registrable);
  }
  return [...new Set(markers)];
}

describe('markers of the local configuration', () => {
  it('take the registrable domain of a Kanzlei address, whatever subdomain the docs use', () => {
    expect(markersOf({ appAddress: 'https://fragebogen.kanzlei-beispiel.de/' })).toEqual([
      'kanzlei-beispiel.de',
    ]);
  });

  it('take the whole host on a shared CDN domain, whose name says nothing (2026-11-15)', () => {
    // A bunny.net pull zone is "<name>.b-cdn.net": the docs name b-cdn.net, the name is the marker.
    expect(markersOf({ testAddress: 'https://beispiel-test.b-cdn.net/' })).toEqual([
      'beispiel-test.b-cdn.net',
    ]);
  });
});

describe('committed files', () => {
  // Scans every committed file; slow in parallel full runs (flaked at 5 s, 2026-11-03).
  it.runIf(existsSync(local))(
    'never name the Kanzlei of the local configuration',
    { timeout: 20_000 },
    () => {
      const markers = markersOf(JSON.parse(readFileSync(local, 'utf8')) as Record<string, unknown>);
      expect(markers.length).toBeGreaterThan(0);
      const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
        .split('\0')
        .filter((path) => path !== '' && !/\.(png|jpe?g|ttf|woff2?|pdf|ico)$/i.test(path));
      const hits = tracked.flatMap((path) => {
        const full = join(ROOT, path);
        if (!existsSync(full)) return [];
        const text = readFileSync(full, 'utf8').toLowerCase();
        return markers.filter((marker) => text.includes(marker.toLowerCase())).map(() => path);
      });
      expect(hits).toEqual([]);
    },
  );
});
