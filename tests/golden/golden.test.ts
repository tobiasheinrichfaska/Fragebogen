// Golden files: questionnaires that an app version produced must stay verifiable forever, and the
// same inputs must keep producing byte-identical seals. A golden file is never edited or
// regenerated; a deliberate change of canonicalisation or seal format needs a new canon/schema
// version and new golden files next to the old ones. Missing files are written only with
// WRITE_GOLDEN=1 (never overwritten).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize } from '../../src/logic/jcs';
import type { Questionnaire } from '../../src/logic/model';
import { decodeQuestionnaire } from '../../src/logic/questionnaireFile';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { beispielRegistry, newVersion, twoRoles } from '../support/sample';

const DIR = dirname(fileURLToPath(import.meta.url));

const GOLDEN: {
  file: string;
  build: () => Questionnaire;
  level: string;
  parts: Record<string, string>;
}[] = [
  {
    file: 'beispiel-1.0.0/zwei-rollen.json',
    build: twoRoles,
    level: 'ok',
    parts: { 'person#0': 'confirmed', 'arbeitgeber#0': 'confirmed' },
  },
  {
    file: 'beispiel-1.0.0/neue-fassung.json',
    build: newVersion,
    level: 'warnings',
    parts: { 'person#0': 'confirmed', 'person#1': 'consistent', 'arbeitgeber#0': 'consistent' },
  },
];

describe.each(GOLDEN)('golden $file', ({ file, build, level, parts }) => {
  const path = join(DIR, file);
  if (!existsSync(path) && process.env.WRITE_GOLDEN === '1') {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(build(), null, 2)}\n`);
  }

  it('exists', () => {
    expect(existsSync(path)).toBe(true);
  });

  const raw = (): unknown => JSON.parse(readFileSync(path, 'utf8'));

  it('decodes without any change', () => {
    const result = decodeQuestionnaire(raw());
    expect(result.ok ? [] : result.issues).toEqual([]);
    if (result.ok) expect(canonicalize(result.questionnaire)).toBe(canonicalize(raw()));
  });

  it('verifies with the recorded levels', () => {
    const result = decodeQuestionnaire(raw());
    if (!result.ok) throw new Error('not decodable');
    const verdict = verifyQuestionnaire(result.questionnaire, { registry: beispielRegistry() });
    expect(verdict.level).toBe(level);
    expect(
      Object.fromEntries(verdict.parts.map((p) => [`${p.role}#${p.position}`, p.level])),
    ).toEqual(parts);
  });

  it('is reproduced byte for byte by the current code', () => {
    expect(canonicalize(build())).toBe(canonicalize(raw()));
  });
});
