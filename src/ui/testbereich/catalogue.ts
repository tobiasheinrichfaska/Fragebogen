// The test page's catalogue (Tobias 2026-11-01): manual_tests/*.md plus config/tests.local.md —
// local tests that name DATEV's wage types or fields, never committed. Bundled only into the test
// folder build (`--mode testbereich`); every other build gets an empty catalogue and no test page.
import { parseManualTests, type ManualTestFile } from '../../logic/manualTests';

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
