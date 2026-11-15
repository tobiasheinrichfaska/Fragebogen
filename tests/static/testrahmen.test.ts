// The shared test page of Testumgebung (testrahmen/, since 2026-11-15) is a copy: changed only there
// and copied again (`npm run rahmen -- <Fragebogen>` in Testumgebung). Its stamp names every file's
// SHA-256, so any edit here shows. The binding the test build gives it has nothing the page would
// warn about, so reports can be sent.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error -- a plain JavaScript module of the copy, without its own types
import { pruefeKopie } from '../../testrahmen/pruefen.mjs';
import { bindingProblems } from '../../testrahmen/testrahmen.js';
import { REPORT_APP } from '../../src/ui/testbereich/report';

const MANUAL = fileURLToPath(new URL('../../manual_tests/', import.meta.url));
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

describe('the copy of the shared test page', () => {
  it('is unchanged since it was copied', () => {
    expect((pruefeKopie as () => string[])()).toEqual([]);
  });

  it('is bound without a problem: app, version, commit, manual tests and start points', () => {
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
});
