// Kanzlei branding is configuration, never committed (public repo). Regression 2026-11-01: a doc
// line named the hosted subdomain. The markers come from the local config itself, so this public
// test names none of them; without config/kanzlei.local.json there is nothing that could leak.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const local = join(ROOT, 'config', 'kanzlei.local.json');

function markersOf(raw: Record<string, unknown>): string[] {
  const markers: string[] = [];
  if (typeof raw.kanzleiName === 'string' && raw.kanzleiName.trim().length >= 4) {
    markers.push(raw.kanzleiName.trim());
  }
  for (const key of ['appAddress', 'explainerBase', 'testAddress']) {
    const value = raw[key];
    if (typeof value !== 'string' || !value.startsWith('https://')) continue;
    // The registrable domain (e.g. "kanzlei-beispiel.de"), whatever subdomain the docs use.
    const host = new URL(value).hostname.split('.').slice(-2).join('.');
    markers.push(host);
  }
  return [...new Set(markers)];
}

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
