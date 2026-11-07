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
  testEnvironment,
  textsOf,
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

describe('expectations at the steps (Tobias 2026-11-06)', () => {
  const blocks = blocksOf([
    '1. Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben und **„Weiter“**.',
    '   - **Danach:** Ein Fehler erscheint',
    '     (Prüfziffer falsch).',
    '2. **„Kopieren“** klicken und den Link',
    '   in einem neuen Tab öffnen.',
    '   - **Danach:** „Link kopiert.“',
    '   - **Danach:** Der Fragebogen öffnet sich.',
    '3. Ohne Erwartung.',
    '',
    '- Ein Punkt',
    '  - eingerückt bleibt im Punkt',
  ]);

  it('hangs what a step brings right under it', () => {
    expect(blocks[0]).toEqual({
      kind: 'list',
      ordered: true,
      items: [
        'Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben und **„Weiter“**.',
        '**„Kopieren“** klicken und den Link in einem neuen Tab öffnen.',
        'Ohne Erwartung.',
      ],
      notes: [
        ['Ein Fehler erscheint (Prüfziffer falsch).'],
        ['„Link kopiert.“', 'Der Fragebogen öffnet sich.'],
        [],
      ],
    });
  });

  it('leaves lists without expectations and bullet lists as they were', () => {
    expect(blocks[1]).toEqual({
      kind: 'list',
      ordered: false,
      items: ['Ein Punkt - eingerückt bleibt im Punkt'],
    });
    expect(blocksOf(['1. Eins', '2. Zwei'])).toEqual([
      { kind: 'list', ordered: true, items: ['Eins', 'Zwei'] },
    ]);
  });

  it('reads every text of a step, the expectations after it', () => {
    const first = blocks[0];
    if (!first) throw new Error('no block');
    expect(textsOf(first)).toEqual([
      'Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben und **„Weiter“**.',
      'Ein Fehler erscheint (Prüfziffer falsch).',
      '**„Kopieren“** klicken und den Link in einem neuen Tab öffnen.',
      '„Link kopiert.“',
      'Der Fragebogen öffnet sich.',
      'Ohne Erwartung.',
    ]);
  });

  it('tells a value to copy from one to type by hand', () => {
    expect(inlineMarkdown('Datum <kbd>0211</kbd> tippen, Ort `Musterstadt`')).toEqual([
      { kind: 'text', text: 'Datum ' },
      { kind: 'kbd', text: '0211' },
      { kind: 'text', text: ' tippen, Ort ' },
      { kind: 'code', text: 'Musterstadt' },
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
    const atSteps = (c: (typeof cases)[number]) =>
      c.parts.some((part) => part.blocks.some((block) => block.kind === 'list' && block.notes));
    const incomplete = cases
      .filter((c) => {
        const labels = c.parts.map((part) => part.label);
        return !labels.includes('Schritte') || (!labels.includes('Erwartet') && !atSteps(c));
      })
      .map((c) => c.id);
    expect(incomplete).toEqual([]);
  });

  // Tobias 2026-11-06 (second report): a note to watch for before a step did not help — a wrong
  // input is a step of its own with the error as its result, the right input the next step.
  it('has no note before a step, only results after it', () => {
    const raw = readdirSync(DIR)
      .filter((name) => /^\d\d_.+\.md$/.test(name))
      .flatMap((name) =>
        readFileSync(join(DIR, name), 'utf8')
          .split(/\r?\n/)
          .flatMap((line, i) => (/Achten Sie gleich auf/.test(line) ? [`${name}:${i + 1}`] : [])),
      );
    expect(raw).toEqual([]);
  });

  // Tobias 2026-11-06: what a step brings stands at that step, not in a list further down.
  it('keeps no expectation of a numbered step apart from it', () => {
    const apart = cases.flatMap((c) =>
      c.parts
        .filter((part) => part.label === 'Erwartet')
        .flatMap((part) => part.blocks.flatMap(textsOf))
        .filter((text) => /^(?:_[^_]+_\s*)?Schritte? \d/.test(text))
        .map((text) => `${c.id}: ${text.slice(0, 40)}`),
    );
    expect(apart).toEqual([]);
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

  // Tobias 2026-11-07: opening a test asks to restart the app with the environment that suits it.
  it('knows the environment of every test the test area offers', () => {
    const offered = cases.filter((c) => testAreaOf(c).offered);
    const kinds = offered.map((c) => testEnvironment(c).kind);
    expect(kinds.filter((k) => k === 'start').length).toBeGreaterThanOrEqual(45);
    expect(kinds.filter((k) => k === 'home').length).toBeGreaterThanOrEqual(40);
    // The rest begins elsewhere; a test listed here lost its start link or names its entry oddly.
    expect(offered.filter((c) => testEnvironment(c).kind === 'elsewhere').map((c) => c.id)).toEqual(
      [
        'MT-116',
        'MT-118',
        'MT-69',
        'MT-88',
        'MT-100',
        'MT-101',
        'MT-80',
        'MT-85',
        'MT-133',
        'MT-130',
      ],
    );
  });
});

describe('testEnvironment', () => {
  const caseWith = (entry?: string) =>
    parseManualTests(
      ['# 01 – Start', '', '## MT-90: Probe', '', ...(entry ? [`**Einstieg:** ${entry}`, ''] : [])]
        .concat(['**Schritte:**', '', '1. Klicken.'])
        .join('\n'),
      '01_start.md',
    ).cases[0] ?? { id: '', title: '', parts: [] };

  it('takes the first start link of the entry', () => {
    expect(
      testEnvironment(
        caseWith(
          'Direkt nach MT-21 – oder schneller: [Zum Unterschreiben öffnen](start:sofortmeldung-fertig) oder [anders](start:anders)',
        ),
      ),
    ).toEqual({ kind: 'start', id: 'sofortmeldung-fertig', text: 'Zum Unterschreiben öffnen' });
  });

  it('starts on the start page when the entry says so, or when there is no entry', () => {
    expect(
      testEnvironment(caseWith('Startseite der App (im Testbereich: „App neu starten“).')),
    ).toEqual({ kind: 'home' });
    expect(testEnvironment(caseWith())).toEqual({ kind: 'home' });
  });

  it('leaves the app as it is for an entry elsewhere', () => {
    expect(testEnvironment(caseWith('Direkt nach **MT-68** (Schritt 3 erledigt).'))).toEqual({
      kind: 'elsewhere',
      text: 'Direkt nach MT-68 (Schritt 3 erledigt).',
    });
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
