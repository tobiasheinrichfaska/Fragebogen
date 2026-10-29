// Regression guard (2026-10-29): an editing tool turned \u escapes into the literal characters, so
// soft hyphens, zero-width spaces, NBSP and combining marks sat invisibly in regexes and test data.
// Such characters must always be written as escapes; this scan fails on any literal occurrence.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCANNED_DIRS = ['src', 'tests', 'forms', 'docs', 'manual_tests', 'assets/fonts'];
const SCANNED_ROOT_FILES = ['index.html', 'README.md', 'CLAUDE.md', 'FEATURES_REQUIRED.md'];
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.html', '.css']);
// Combining marks, format characters, space separators other than U+0020, line/paragraph separators
// and control characters other than TAB, LF and CR.
const HIDDEN = /[\p{M}\p{Cf}\p{Zl}\p{Zp}]|(?! )\p{Zs}|(?![\t\n\r])\p{Cc}/u;

function textFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return textFiles(path);
    return TEXT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

describe('source files', () => {
  const files = [...SCANNED_DIRS.flatMap(textFiles), ...SCANNED_ROOT_FILES];

  it('are found', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('contain no literal invisible, combining or separator characters', () => {
    const findings: string[] = [];
    for (const file of files) {
      readFileSync(join(ROOT, file), 'utf8')
        .split('\n')
        .forEach((line, index) => {
          const match = HIDDEN.exec(line);
          if (match) {
            const codePoint = (match[0].codePointAt(0) ?? 0).toString(16).toUpperCase();
            findings.push(
              `${relative(ROOT, join(ROOT, file))}:${index + 1} U+${codePoint.padStart(4, '0')}`,
            );
          }
        });
    }
    expect(findings).toEqual([]);
  });

  it('detects what it guards against', () => {
    const samples = [0xad, 0xa0, 0x200b, 0xfeff, 0x2028, 0x301, 0x85].map((cp) =>
      String.fromCodePoint(cp),
    );
    for (const sample of samples) expect(HIDDEN.test(`a${sample}b`)).toBe(true);
    for (const allowed of ['a b', 'a\tb', 'Zoë Ünal € §', 'a\rb'])
      expect(HIDDEN.test(allowed)).toBe(false);
  });
});
