// SV cases from a licensed commercial specialist portal (Tobias 2026-11-03: "Für die Tester können
// wir alles verwenden, die sind Kanzleiintern") — tests/fixtures/sv-vorgaben-lokal/*.json is
// gitignored. Runs only where such a file exists; in the public repo it is skipped, which is NOT a
// pass for these cases (see CLAUDE.md). Same case format as tests/fixtures/sv-vorgaben/; a known
// deviation is recorded in the case itself, so this file names nothing of the portal.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANLAGE_16 } from '../support/anlage16';
import { readJson } from '../support/formFiles';
import {
  actual,
  assess,
  DIGITS,
  masked,
  wanted,
  type Answers,
  type Aspect,
  type Expected,
} from '../support/svCase';

const DIR = fileURLToPath(new URL('../fixtures/sv-vorgaben-lokal/', import.meta.url));
const FILES = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((name) => name.endsWith('.json'))
      .sort()
  : [];

interface LocalCase {
  id: string;
  titel: string;
  quelle: { dokument: string; fundstelle: string; kurz: string };
  sachverhalt: string;
  erwartet: Expected;
  person: Answers;
  arbeitgeber: Answers;
  /** What the app proposes today where it differs from the source, and why. */
  abweichung?: { app: Partial<Record<Aspect, string>>; grund: string };
}

const CASES = FILES.flatMap(
  (file) => (readJson(join(DIR, file)) as { faelle: LocalCase[] }).faelle,
);

describe.skipIf(CASES.length === 0)('local SV cases (tests/fixtures/sv-vorgaben-lokal/)', () => {
  it('have unique ids, a source and keys of the right shape', () => {
    const ids = CASES.map((c) => c.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const c of CASES) {
      expect(c.quelle.fundstelle.length, c.id).toBeGreaterThan(0);
      expect(c.sachverhalt.length, c.id).toBeGreaterThan(20);
      expect(c.erwartet.pgr, c.id).toMatch(/^\d{3}$/);
      expect(c.erwartet.bgr, c.id).toMatch(/^\d{4}$/);
    }
  });

  it.each(CASES.map((c) => [c.id, c.titel, c] as const))(
    '%s (%s): the app proposes the keys of the source',
    (_id, _t, c) => {
      const r = assess(c.person, c.arbeitgeber);
      expect(r.skipped).toEqual([]);
      expect(r.pgr?.status, r.pgr?.reason).toBe('proposed');
      expect(r.bgr?.status, r.bgr?.reason).toBe('proposed');
      const app = actual(r);
      const expected = wanted(c.erwartet);
      if (c.abweichung) {
        // Known and open: the app must still say exactly this, so any change is noticed.
        const known = Object.entries(c.abweichung.app);
        expect(known.some(([aspect, value]) => expected[aspect as Aspect] !== value)).toBe(true);
        for (const [aspect, value] of known) expect(app[aspect as Aspect], aspect).toBe(value);
      }
      for (const [aspect, value] of Object.entries(expected) as [Aspect, string][]) {
        if (c.abweichung?.app[aspect] !== undefined) continue;
        expect(aspect === 'bgr' ? masked(app.bgr, value) : app[aspect], aspect).toBe(value);
      }
      const allowed = ANLAGE_16[app.pgr];
      expect(allowed, `Personengruppe ${app.pgr}`).toBeDefined();
      [...app.bgr].forEach((digit, i) => {
        expect(allowed?.[i], `${DIGITS[i] ?? ''} ${digit} bei ${app.pgr}`).toContain(digit);
      });
    },
  );
});
