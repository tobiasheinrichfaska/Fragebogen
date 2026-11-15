// The help pages as the build writes them for the upload (Tobias 2026-11-15): every page and the
// overview link the Kanzlei's Impressum and Datenschutz from the configuration; without links the
// build writes exactly the neutral pages of docs/hilfe/.
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readHelpContent, writeHelpPages } from '../../src/build/helpFiles';

const ROOT = join(__dirname, '..', '..');
const content = readHelpContent(join(ROOT, 'hilfe'));
const links = [
  { label: 'Impressum' as const, href: 'https://www.example.org/impressum.html' },
  { label: 'Datenschutz' as const, href: 'https://www.example.org/datenschutz.html' },
];

function inTemp<T>(run: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'hilfe-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('help pages written for the upload', () => {
  it('reads every page and Muster of hilfe/', () => {
    expect(content.pages.map((p) => p.path).sort()).toEqual(['steuer-id', 'versicherungsnummer']);
    expect(content.musters.length).toBeGreaterThan(0);
  });

  it('links Impressum and Datenschutz on every page and on the overview', () => {
    inTemp((dir) => {
      const written = writeHelpPages(dir, content, links);
      expect(written).toEqual([
        'index.html',
        'steuer-id/index.html',
        'versicherungsnummer/index.html',
      ]);
      for (const file of written) {
        const html = readFileSync(join(dir, file), 'utf8');
        expect(html, file).toContain(
          '<a href="https://www.example.org/impressum.html">Impressum</a>',
        );
        expect(html, file).toContain(
          '<a href="https://www.example.org/datenschutz.html">Datenschutz</a>',
        );
      }
    });
  });

  it('writes exactly the neutral pages of docs/hilfe/ without links', () => {
    inTemp((dir) => {
      for (const file of writeHelpPages(dir, content, [])) {
        expect(readFileSync(join(dir, file), 'utf8'), file).toBe(
          readFileSync(join(ROOT, 'docs', 'hilfe', file), 'utf8'),
        );
      }
    });
  });

  it('refuses data that does not decode or is filed under another name', () => {
    inTemp((dir) => {
      mkdirSync(join(dir, 'seiten'));
      mkdirSync(join(dir, 'muster'));
      writeFileSync(join(dir, 'seiten', 'x.json'), '{"unknown":1}');
      expect(() => readHelpContent(dir)).toThrow(/seiten\/x\.json/);
    });
    inTemp((dir) => {
      mkdirSync(join(dir, 'seiten'));
      mkdirSync(join(dir, 'muster'));
      const muster = readFileSync(join(ROOT, 'hilfe', 'muster', 'lohnabrechnung.json'), 'utf8');
      writeFileSync(join(dir, 'muster', 'anders.json'), muster);
      expect(() => readHelpContent(dir)).toThrow(/muster\/anders\.json.*lohnabrechnung/);
    });
  });
});
