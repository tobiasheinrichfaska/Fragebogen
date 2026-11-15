// The test area's material (Tobias 2026-11-01): manual_tests/*.md plus config/tests.local.md —
// local tests that name DATEV's wage types or fields, never committed — and the start points.
// Bundled only into the test folder build (`--mode testbereich`); every other build gets none.
// Since 2026-11-15 the shared test page of Testumgebung shows them (`testbereich.tsx`).
import { parseStartPoint, type AnyStartPoint } from '../../logic/startPoints';

export const TEST_AREA = import.meta.env.MODE === 'testbereich';

const raw: Record<string, string> = TEST_AREA
  ? {
      ...import.meta.glob<string>('../../../manual_tests/[0-9][0-9]_*.md', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      ...import.meta.glob<string>('../../../config/tests.local.md', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
    }
  : {};

const fileName = (path: string) => path.split('/').pop() ?? path;

/** Every manual test file as the test page reads it, in name order (the local tests come last). */
export const HANDTESTS: readonly { datei: string; text: string }[] = Object.entries(raw)
  .map(([path, text]) => ({ datei: fileName(path), text }))
  .sort((a, b) => a.datei.localeCompare(b.datei));

// Start points (manual_tests/startpunkte/*.json): prepared questionnaires the tests open with a link.
const startFiles: Record<string, unknown> = TEST_AREA
  ? import.meta.glob<unknown>('../../../manual_tests/startpunkte/*.json', {
      import: 'default',
      eager: true,
    })
  : {};

/** The readable start points; tests/testbereich/startPoints.test.ts keeps every file readable. */
export const START_POINTS: ReadonlyMap<string, AnyStartPoint> = new Map(
  Object.values(startFiles).flatMap((raw) => {
    const parsed = parseStartPoint(raw);
    return parsed.ok ? [[parsed.point.id, parsed.point] as const] : [];
  }),
);
