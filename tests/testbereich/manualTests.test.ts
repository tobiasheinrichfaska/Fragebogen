// The manual tests as the catalogue of the test page (Tobias 2026-11-01): every file must stay
// readable, every case keeps its steps and expectations.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  blocksOf,
  caseVersion,
  inlineMarkdown,
  parseManualTests,
  testAreaOf,
} from '../../src/logic/manualTests';

const DIR = join(__dirname, '..', '..', 'manual_tests');
const files = readdirSync(DIR)
  .filter((name) => /^\d\d_.+\.md$/.test(name))
  .map((name) => parseManualTests(readFileSync(join(DIR, name), 'utf8'), name));

const SAMPLE = [
  '# 02 – Ausfüllen (Interview)',
  '',
  '**Umgebung:** Vorschau, fiktive Daten.',
  '',
  '```powershell',
  'Get-FileHash datei.pdf',
  '```',
  '',
  '---',
  '',
  '## MT-13: Hinweise und „Vorerst überspringen“ (Person)',
  '',
  '**Voraussetzungen:** MT-10.',
  '',
  '**Schritte:**',
  '',
  '1. Klicken Sie auf **„Ich bin: Beschäftigte Person“**.',
  '2. Beantworten Sie die Fragen. Bei der **Versicherungsnummer** klicken Sie',
  '   **„Vorerst überspringen“**.',
  '',
  '**Erwartet:**',
  '',
  '- Nach „Vorerst überspringen“ springt das Interview weiter.',
  '- _Nicht offensichtlich:_ Der Knopf fehlt bei einer vorbelegten',
  '  Antwort.',
  '',
  '---',
  '',
  '## L-01: Übergabe mit eigener Lohnart',
  '',
  '**Schritte:**',
  '',
  '1. Erste Zeile.',
].join('\r\n');

describe('parseManualTests', () => {
  const parsed = parseManualTests(SAMPLE, '02_ausfuellen.md');

  it('names the area without its number and keeps the intro', () => {
    expect(parsed.area).toBe('Ausfüllen (Interview)');
    expect(parsed.intro).toEqual([
      { kind: 'text', text: '**Umgebung:** Vorschau, fiktive Daten.' },
      { kind: 'code', text: 'Get-FileHash datei.pdf' },
    ]);
  });

  it('splits a case into its labelled parts; indented lines continue a list item', () => {
    expect(parsed.cases.map((c) => c.id)).toEqual(['MT-13', 'L-01']);
    expect(parsed.cases[0]).toEqual({
      id: 'MT-13',
      title: 'Hinweise und „Vorerst überspringen“ (Person)',
      parts: [
        { label: 'Voraussetzungen', blocks: [{ kind: 'text', text: 'MT-10.' }] },
        {
          label: 'Schritte',
          blocks: [
            {
              kind: 'list',
              ordered: true,
              items: [
                'Klicken Sie auf **„Ich bin: Beschäftigte Person“**.',
                'Beantworten Sie die Fragen. Bei der **Versicherungsnummer** klicken Sie **„Vorerst überspringen“**.',
              ],
            },
          ],
        },
        {
          label: 'Erwartet',
          blocks: [
            {
              kind: 'list',
              ordered: false,
              items: [
                'Nach „Vorerst überspringen“ springt das Interview weiter.',
                '_Nicht offensichtlich:_ Der Knopf fehlt bei einer vorbelegten Antwort.',
              ],
            },
          ],
        },
      ],
    });
  });

  it('starts a new list when the kind changes and keeps paragraphs apart', () => {
    expect(blocksOf(['Text eins', 'weiter', '', '1. a', '- b', 'Text zwei'])).toEqual([
      { kind: 'text', text: 'Text eins weiter' },
      { kind: 'list', ordered: true, items: ['a'] },
      { kind: 'list', ordered: false, items: ['b'] },
      { kind: 'text', text: 'Text zwei' },
    ]);
  });
});

describe('manual_tests/ as the catalogue', () => {
  const cases = files.flatMap((file) => file.cases);

  it('reads every case of every file, each id once', () => {
    expect(cases.length).toBeGreaterThanOrEqual(65);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(files.every((file) => file.area !== '')).toBe(true);
  });

  it('finds steps and expectations in every case', () => {
    const incomplete = cases
      .filter((c) => {
        const labels = c.parts.map((part) => part.label);
        return !labels.includes('Schritte') || !labels.includes('Erwartet');
      })
      .map((c) => c.id);
    expect(incomplete).toEqual([]);
  });

  // Tobias 2026-11-01 (first test report): tests that cannot run in the hosted test area say so.
  it('marks the tests that cannot run in the test area, with the reason', () => {
    const notOffered = cases.filter((c) => !testAreaOf(c).offered).map((c) => c.id);
    expect(notOffered).toEqual(['MT-01', 'MT-52', 'MT-82', 'MT-83', 'MT-84']);
    const byId = (id: string) => {
      const found = cases.find((c) => c.id === id);
      if (!found) throw new Error(`${id} missing`);
      return found;
    };
    expect(testAreaOf(byId('MT-01')).note).toContain('heruntergeladenen Datei');
    expect(testAreaOf(byId('MT-10'))).toEqual({ offered: true });
  });

  it('tells where a test starts when it builds on another one', () => {
    const mt10 = cases.find((c) => c.id === 'MT-10');
    const pre = mt10?.parts.find((part) => part.label === 'Voraussetzungen')?.blocks[0];
    expect(pre?.kind === 'text' && pre.text).toContain('App neu starten');
  });

  // Tobias 2026-11-01: "sollte die Anleitung beginnen mit: Sie starten einen neuen Fragebogen …".
  it('starts every test of the test area with its entry, right under the heading', () => {
    const withoutEntry = cases
      .filter((c) => testAreaOf(c).offered && c.parts[0]?.label !== 'Einstieg')
      .map((c) => c.id);
    expect(withoutEntry).toEqual([]);
    const mt11 = cases.find((c) => c.id === 'MT-11')?.parts[0]?.blocks[0];
    expect(mt11?.kind === 'text' && mt11.text).toContain(
      'einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“',
    );
  });
});

describe('caseVersion', () => {
  const testCase = {
    title: 'Interview',
    parts: [{ label: 'Schritte', blocks: [{ kind: 'text' as const, text: 'Eins' }] }],
  };

  it('is 12 hex digits and the same for the same text', () => {
    expect(caseVersion(testCase)).toMatch(/^[0-9a-f]{12}$/);
    expect(caseVersion(structuredClone(testCase))).toBe(caseVersion(testCase));
  });

  it('changes when the title or a step changes', () => {
    expect(caseVersion({ ...testCase, title: 'Interview neu' })).not.toBe(caseVersion(testCase));
    const step = { label: 'Schritte', blocks: [{ kind: 'text' as const, text: 'Zwei' }] };
    expect(caseVersion({ ...testCase, parts: [step] })).not.toBe(caseVersion(testCase));
  });
});

describe('inlineMarkdown', () => {
  it('makes references to other tests clickable tokens', () => {
    expect(inlineMarkdown('wie MT-68, danach L-01; nicht MTX-1')).toEqual([
      { kind: 'text', text: 'wie ' },
      { kind: 'ref', text: 'MT-68', id: 'MT-68' },
      { kind: 'text', text: ', danach ' },
      { kind: 'ref', text: 'L-01', id: 'L-01' },
      { kind: 'text', text: '; nicht MTX-1' },
    ]);
    expect(inlineMarkdown('**MT-10** bestanden')[0]).toEqual({ kind: 'strong', text: 'MT-10' });
  });

  it('splits bold, code, italics and https links', () => {
    expect(
      inlineMarkdown(
        'Tippen **„Weiter“**, dann `npm run build`; _nicht offensichtlich:_ siehe [Hilfe](https://example.org/a).',
      ),
    ).toEqual([
      { kind: 'text', text: 'Tippen ' },
      { kind: 'strong', text: '„Weiter“' },
      { kind: 'text', text: ', dann ' },
      { kind: 'code', text: 'npm run build' },
      { kind: 'text', text: '; ' },
      { kind: 'em', text: 'nicht offensichtlich:' },
      { kind: 'text', text: ' siehe ' },
      { kind: 'link', text: 'Hilfe', href: 'https://example.org/a' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('keeps only the text of a link into the repository and of words with underscores', () => {
    expect(inlineMarkdown('siehe [`deploy/README.md`](../deploy/README.md)')).toEqual([
      { kind: 'text', text: 'siehe ' },
      { kind: 'text', text: 'deploy/README.md' },
    ]);
    expect(inlineMarkdown('Datei export_local_json')).toEqual([
      { kind: 'text', text: 'Datei export_local_json' },
    ]);
  });
});
