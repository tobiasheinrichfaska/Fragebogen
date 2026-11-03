// The test page's catalogue (Tobias 2026-11-01): manual_tests/*.md plus config/tests.local.md —
// local tests that name DATEV's wage types or fields, never committed. Bundled only into the test
// folder build (`--mode testbereich`); every other build gets an empty catalogue and no test page.
import { parseManualTests, type ManualTestFile } from '../../logic/manualTests';
import { parseStartPoint, type StartPoint } from '../../logic/startPoints';

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

/** In file order; the local tests ("tests.local.md") come last. */
export const TEST_FILES: readonly ManualTestFile[] = Object.entries(raw)
  .map(([path, text]) => parseManualTests(text, fileName(path)))
  .sort((a, b) => a.source.localeCompare(b.source));

export const TEST_CASES = TEST_FILES.flatMap((file) =>
  file.cases.map((testCase) => ({ ...testCase, area: file.area })),
);

// Start points (manual_tests/startpunkte/*.json): prepared questionnaires the tests open with a link.
const startFiles: Record<string, unknown> = TEST_AREA
  ? import.meta.glob<unknown>('../../../manual_tests/startpunkte/*.json', {
      import: 'default',
      eager: true,
    })
  : {};

export const START_POINTS: ReadonlyMap<string, StartPoint> = new Map(
  Object.values(startFiles).flatMap((raw) => {
    const parsed = parseStartPoint(raw);
    return parsed.ok ? [[parsed.point.id, parsed.point] as const] : [];
  }),
);

/** Start point files that cannot be read, with their issues — shown on the test page. */
export const START_POINT_PROBLEMS: readonly string[] = Object.entries(startFiles).flatMap(
  ([path, raw]) => {
    const parsed = parseStartPoint(raw);
    return parsed.ok
      ? []
      : [`${fileName(path)}: ${parsed.issues.map((i) => `${i.path} ${i.message}`).join('; ')}`];
  },
);
