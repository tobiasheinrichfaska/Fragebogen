// The shared test page of Testumgebung (testrahmen/, since 2026-11-15) is a copy: changed only there
// and copied again (`npm run rahmen -- <Fragebogen>` in Testumgebung). Its stamp names every file's
// SHA-256, so any edit here shows. The binding the test build gives it has nothing the page would
// warn about, so reports can be sent.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruefeKopie } from '../../testrahmen/pruefen.mjs';
import { bindingProblems } from '../../testrahmen/testrahmen.js';
import { REPORT_APP } from '../../src/ui/testbereich/report';

const MANUAL = fileURLToPath(new URL('../../manual_tests/', import.meta.url));
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

describe('the copy of the shared test page', () => {
  it('is unchanged since it was copied', () => {
    expect((pruefeKopie as () => string[])()).toEqual([]);
  });

  // Audit 2026-11-15: `bindingProblems` reads app, version, commit form and start points, not the
  // manual tests; the real binding of the test build (its commit, its manual tests) is checked in
  // the e2e test tests/e2e/handtests/08_testbereich.spec.ts.
  it('takes this app, its version and its start points without a problem', () => {
    const points = readdirSync(join(MANUAL, 'startpunkte'))
      .filter((name) => name.endsWith('.json'))
      .map((name) => {
        const point = JSON.parse(readFileSync(join(MANUAL, 'startpunkte', name), 'utf8')) as {
          id: string;
          title: string;
        };
        return { id: point.id, titel: point.title };
      });
    const handtests = readdirSync(MANUAL)
      .filter((name) => /^\d\d_.*\.md$/.test(name))
      .map((datei) => ({ datei, text: readFileSync(join(MANUAL, datei), 'utf8') }));
    expect(
      bindingProblems({
        app: REPORT_APP,
        name: 'Fragebogen',
        version: pkg.version,
        stand: '0123456789ab',
        handtests,
        startpunkte: points,
        laden: () => undefined,
      }),
    ).toEqual([]);
  });

  // Audit 2026-11-16, loop 6: tests/e2e/handtests/08_testbereich.spec.ts expects no warning on top of
  // the page by counting `.tr-kopf .tr-meldung.tr-fehler` — a count of 0 would pass empty if the
  // frame named its warnings otherwise.
  it('draws the binding problems on top with the classes the e2e test counts', () => {
    const page = readFileSync('testrahmen/testrahmen.js', 'utf8');
    expect(page).toContain('<header class="tr-kopf">');
    expect(page).toMatch(/problems\.map\(\(problem\) => `<p class="tr-meldung tr-fehler">/);
  });
});
