// SV assessment against the official examples (Tobias 2026-11-02: "prüfe, ob es Vorgabewerte gibt,
// nach denen eine SV-Beurteilung abzulaufen hat (mit Beispielkombinationen), und erstelle auf deren
// Basis Testfälle für automatisierte Tests der Einstufung der BGRS und PGRS"; "möglichst viele Fälle
// und möglichst viele Tests"). Four parts:
// 1. the cases of tests/fixtures/sv-vorgaben/*.json (Geringfügigkeits-Richtlinien, Rundschreiben,
//    DEÜV, further sources) — each with source, facts, expected Personengruppe, Beitragsgruppen and
//    Übergangsbereich — checked in themselves and through the engine;
// 2. variations of the official cases whose outcome the law fixes (RV exemption, private KV) or that
//    must not change anything (hourly wage with the same expected month);
// 3. limits of 2026 to the cent;
// 4. docs/sv-vorgaben/: every case with its source, expectation and the app's proposal.
// Fictitious persons. Not legal advice.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANLAGE_16 } from '../support/anlage16';
import { readJson } from '../support/formFiles';
import { assess, shownValue, svForm, type Answers, type Assessment } from '../support/svCase';

const FIXTURE_DIR = fileURLToPath(new URL('../fixtures/sv-vorgaben/', import.meta.url));
const PROOF = ['am Original geprüft', 'abgeleitet', 'nicht verifiziert'] as const;
const DIGITS = ['kv', 'rv', 'av', 'pv'] as const;

interface Expected {
  pgr: string;
  bgr: string;
  uebergangsbereich?: string;
  /**
   * What a test must not check hard: a digit (kv, rv, av, pv — e.g. KV 1 or 3 for a short fixed term)
   * or the Übergangsbereich.
   */
  unsicher?: string[];
  spaeter?: { ab: string; pgr: string; bgr: string }[];
  zusatzmeldung?: { an: string; pgr: string; bgr: string };
}

interface Case {
  file: string;
  id: string;
  titel: string;
  quelle: { dokument: string; fundstelle: string; kurz: string; url?: string };
  sachverhalt: string;
  pruefstatus: Record<string, string>;
  erwartet: Expected;
  person: Answers;
  arbeitgeber: Answers;
  nichtAbbildbar?: string;
  angepasst?: string;
  hinweis?: string;
}

const FILES = readdirSync(FIXTURE_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort();
const CASES: Case[] = FILES.flatMap((file) => {
  const raw = readJson(join(FIXTURE_DIR, file)) as { faelle: Omit<Case, 'file'>[] };
  return raw.faelle.map((c) => ({ ...c, file }));
});
const MAPPABLE = CASES.filter((c) => c.nichtAbbildbar === undefined);
const RESULTS = new Map(CASES.map((c) => [c.id, assess(c.person, c.arbeitgeber)] as const));
const resultOf = (c: Case): Assessment => {
  const found = RESULTS.get(c.id);
  if (!found) throw new Error(c.id);
  return found;
};

/** The expected Beitragsgruppen with "?" where the case leaves a digit open. */
const expectedBgr = (c: Case) =>
  [...c.erwartet.bgr]
    .map((digit, i) => (c.erwartet.unsicher?.includes(DIGITS[i] ?? '') ? '?' : digit))
    .join('');
const masked = (value: string | undefined, pattern: string) =>
  [...(value ?? '')].map((digit, i) => (pattern[i] === '?' ? '?' : digit)).join('');

type Aspect = 'pgr' | 'bgr' | 'uebergang';
interface Deviation {
  /** What the app proposes today. */
  app: Partial<Record<Aspect, string>>;
  gruppe: keyof typeof GROUPS;
}

// Why the app differs from an official example; open for Tobias' decision (2026-11-02). A fix of
// the definition makes the test fail until the entry is removed here.
const GROUPS = {
  A: 'Kurzfristige Aushilfe: Zeitgrenzen, Regelmäßigkeit und Vorbeschäftigungen wirken nicht auf den Vorschlag',
  B: 'Berufsmäßigkeit: Entgelte anderer kurzfristiger Beschäftigungen werden nicht mitgerechnet',
  C: 'Werkstudenten und freiwillige Praktika: 20-Stunden-Grenze und Vorrang von 109/110 fehlen',
  D: 'Versorgungswerk im Minijob: Minijob-Regel der RV steht vor der Versorgungswerk-Regel',
  E: 'JAEG bei mehreren Beschäftigungen: erster Minijob wird mitgezählt, KV im zweiten Minijob',
  F: 'Summe für den Übergangsbereich: zählt nicht nur versicherungspflichtige Entgelte, Ausschlüsse fehlen',
  G: 'Entgeltumwandlung senkt das Entgelt für die Minijob-Grenze nicht',
  H: 'Ausbildung oder Praktikum ohne Arbeitsentgelt: keine Antwort „ohne Entgelt“',
  I: 'Eingang des Befreiungsantrags nach dem Beginnmonat verschiebt die Befreiung nicht',
  K: 'Studierende in einer als Minijob oder versicherungspflichtig gewählten Beschäftigung: Werkstudentenprivileg nicht geprüft (Wochenstunden nur bei „Werkstudent“ gefragt)',
} as const;

const KNOWN_DEVIATIONS: Record<string, Deviation> = {
  'KK-TK-04': { gruppe: 'K', app: { pgr: '101', bgr: '1111' } },
};

function actual(r: Assessment): Record<Aspect, string> {
  return {
    pgr: r.pgr?.status === 'proposed' ? (r.pgr.value ?? '–') : '–',
    bgr: r.bgr?.status === 'proposed' ? (r.bgr.value ?? '–') : '–',
    uebergang: r.uebergang?.status === 'proposed' ? (r.uebergang.value ?? '–') : '–',
  };
}

function wanted(c: Case): Partial<Record<Aspect, string>> {
  return {
    pgr: c.erwartet.pgr,
    bgr: expectedBgr(c),
    ...(c.erwartet.uebergangsbereich === undefined ||
    c.erwartet.unsicher?.includes('uebergangsbereich')
      ? {}
      : { uebergang: c.erwartet.uebergangsbereich }),
  };
}

/** The aspects in which the app differs from the expectation, with the app's value. */
function deviationsOf(c: Case): Partial<Record<Aspect, string>> {
  const app = actual(resultOf(c));
  const expected = wanted(c);
  const found: Partial<Record<Aspect, string>> = {};
  if (app.pgr !== expected.pgr) found.pgr = app.pgr;
  if (masked(app.bgr, expected.bgr ?? '') !== expected.bgr) found.bgr = app.bgr;
  if (expected.uebergang !== undefined && app.uebergang !== expected.uebergang) {
    found.uebergang = app.uebergang;
  }
  return found;
}

describe('the official cases themselves', () => {
  it('come from at least one file and have unique ids', () => {
    expect(FILES.length).toBeGreaterThan(0);
    const ids = CASES.map((c) => c.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it.each(CASES.map((c) => [c.id, c] as const))('%s: names its source and facts', (_id, c) => {
    expect(c.titel.length).toBeGreaterThan(0);
    expect(c.sachverhalt.length).toBeGreaterThan(20);
    expect(c.quelle.dokument.length).toBeGreaterThan(0);
    expect(c.quelle.fundstelle.length).toBeGreaterThan(0);
    expect(c.quelle.kurz.length).toBeGreaterThan(0);
    for (const key of ['sachverhalt', 'pgr', 'bgr']) {
      expect(PROOF, `pruefstatus.${key}`).toContain(c.pruefstatus[key]);
    }
    for (const status of Object.values(c.pruefstatus)) expect(PROOF).toContain(status);
  });

  it.each(CASES.map((c) => [c.id, c] as const))(
    '%s: expects keys DEÜV Anlage 16 allows',
    (_id, c) => {
      const { pgr, bgr, uebergangsbereich, unsicher = [], spaeter = [] } = c.erwartet;
      expect(pgr).toMatch(/^\d{3}$/);
      expect(bgr).toMatch(/^\d{4}$/);
      if (uebergangsbereich !== undefined) expect(['0', '1']).toContain(uebergangsbereich);
      for (const item of unsicher) expect([...DIGITS, 'uebergangsbereich']).toContain(item);
      // 209 (household Minijob) and 118 (unständig) are not in the app's table; such cases are
      // excluded and not mappable anyway.
      for (const [gruppe, digits] of [[pgr, bgr], ...spaeter.map((s) => [s.pgr, s.bgr])]) {
        if (c.nichtAbbildbar !== undefined && ANLAGE_16[gruppe ?? ''] === undefined) continue;
        const allowed = ANLAGE_16[gruppe ?? ''];
        expect(allowed, `Personengruppe ${gruppe ?? ''}`).toBeDefined();
        [...(digits ?? '')].forEach((digit, i) => {
          expect(allowed?.[i], `${DIGITS[i] ?? ''} ${digit} bei ${gruppe ?? ''}`).toContain(digit);
        });
      }
    },
  );

  it.each(CASES.map((c) => [c.id, c] as const))(
    '%s: answers only with fields of the right role',
    (_id, c) => {
      const fields = new Map(
        svForm.definition.sections.flatMap((s) => s.fields).map((f) => [f.id, f.role] as const),
      );
      for (const [role, answers] of [
        ['person', c.person],
        ['arbeitgeber', c.arbeitgeber],
      ] as const) {
        for (const id of Object.keys(answers)) expect(fields.get(id), id).toBe(role);
      }
    },
  );

  it('records every known deviation for an existing, mappable case', () => {
    const ids = new Set(MAPPABLE.map((c) => c.id));
    expect(Object.keys(KNOWN_DEVIATIONS).filter((id) => !ids.has(id))).toEqual([]);
  });

  // A household Minijob (GFR-29) and an unständige Beschäftigung (BA-01) are excluded, not guessed.
  it.each(['GFR-29', 'BA-01'])('%s: a special case is excluded, not guessed', (id) => {
    const c = CASES.find((x) => x.id === id);
    expect(c?.nichtAbbildbar).toBeDefined();
    if (!c) return;
    const r = resultOf(c);
    expect([r.pgr?.status, r.bgr?.status]).toEqual(['excluded', 'excluded']);
  });
});

describe('the app on the official cases', () => {
  const cases = MAPPABLE.map((c) => [c.id, c.titel, c] as const);

  it.each(cases)('%s (%s): proposes Personengruppe and Beitragsgruppen', (_id, _t, c) => {
    const r = resultOf(c);
    expect(r.pgr?.status, r.pgr?.reason).toBe('proposed');
    expect(r.bgr?.status, r.bgr?.reason).toBe('proposed');
  });

  // An answer the form does not ask would silently leave the case incomplete.
  it.each(cases)('%s (%s): the form asks every answer of the case', (_id, _t, c) => {
    expect(resultOf(c).skipped).toEqual([]);
  });

  for (const [aspect, label] of [
    ['pgr', 'Personengruppe'],
    ['bgr', 'Beitragsgruppen'],
    ['uebergang', 'Übergangsbereich'],
  ] as const) {
    const withAspect = cases.filter(([, , c]) => wanted(c)[aspect] !== undefined);
    it.each(withAspect)(`%s (%s): ${label} as in the source`, (id, _t, c) => {
      const known = KNOWN_DEVIATIONS[id]?.app[aspect];
      const app = actual(resultOf(c))[aspect];
      if (known === undefined) {
        const expected = wanted(c)[aspect] ?? '';
        expect(aspect === 'bgr' ? masked(app, expected) : app).toBe(expected);
      } else {
        // Known and open: the app must still say exactly this, so any change is noticed.
        expect(app).toBe(known);
      }
    });
  }

  it.each(CASES.map((c) => [c.id, c] as const))(
    '%s: the app proposes keys DEÜV Anlage 16 allows',
    (_id, c) => {
      const { pgr, bgr } = actual(resultOf(c));
      if (pgr === '–' || bgr.includes('?')) return;
      const allowed = ANLAGE_16[pgr];
      expect(allowed, `Personengruppe ${pgr}`).toBeDefined();
      [...bgr].forEach((digit, i) => {
        expect(allowed?.[i], `${DIGITS[i] ?? ''} ${digit} bei ${pgr}`).toContain(digit);
      });
    },
  );

  it('lists exactly the known deviations', () => {
    const found = Object.fromEntries(
      MAPPABLE.flatMap((c) => {
        const d = deviationsOf(c);
        return Object.keys(d).length === 0 ? [] : [[c.id, d] as const];
      }),
    );
    expect(found).toEqual(
      Object.fromEntries(Object.entries(KNOWN_DEVIATIONS).map(([id, d]) => [id, d.app])),
    );
  });
});

// Variations of the official cases. "fixed by law": the source case matches and the law fixes how one
// answer changes the outcome. "no effect": the answer must not change the app's proposal at all.
interface Variation {
  id: string;
  label: string;
  source: string;
  applies: (c: Case) => boolean;
  person?: (p: Answers) => Answers;
  employer?: (e: Answers) => Answers;
  /** The new expectation from the official one; without it the app's own result must stay. */
  expected?: (e: Expected) => Expected;
}

const withDigit = (bgr: string, index: number, digit: string) =>
  [...bgr].map((d, i) => (i === index ? digit : d)).join('');
const matches = (c: Case) => Object.keys(deviationsOf(c)).length === 0;
const minijob = (c: Case) =>
  c.erwartet.pgr === '109' && c.erwartet.spaeter === undefined && matches(c);

const VARIATIONS: Variation[] = [
  {
    id: 'rvBefreit',
    label: 'Minijob: Befreiung von der RV beantragt',
    source: '§ 6 Abs. 1b SGB VI; GfR 2026 Bsp. 2',
    applies: (c) =>
      minijob(c) && c.erwartet.bgr[1] === '1' && c.person.rvBefreiungWunsch === 'nein',
    person: (p) => ({ ...p, rvBefreiungWunsch: 'ja' }),
    expected: (e) => ({ ...e, bgr: withDigit(e.bgr, 1, '5') }),
  },
  {
    id: 'rvPflichtig',
    label: 'Minijob: keine Befreiung von der RV beantragt',
    source: '§ 5 Abs. 2 S. 2, § 6 Abs. 1b SGB VI; GfR 2026 Bsp. 2',
    applies: (c) => minijob(c) && c.erwartet.bgr[1] === '5' && c.person.rvBefreiungWunsch === 'ja',
    person: (p) => ({ ...p, rvBefreiungWunsch: 'nein' }),
    expected: (e) => ({ ...e, bgr: withDigit(e.bgr, 1, '1') }),
  },
  {
    id: 'privat',
    label: 'Minijob: privat statt gesetzlich krankenversichert',
    source: '§ 249b SGB V (Pauschalbeitrag nur für gesetzlich Versicherte); GfR 2026 Bsp. 28',
    applies: (c) =>
      minijob(c) && c.erwartet.bgr[0] === '6' && c.person.krankenversicherung === 'gesetzlich',
    person: (p) => ({ ...p, krankenversicherung: 'privat' }),
    expected: (e) => ({ ...e, bgr: withDigit(e.bgr, 0, '0') }),
  },
  {
    id: 'gesetzlich',
    label: 'Minijob: gesetzlich statt privat krankenversichert',
    source: '§ 249b SGB V; GfR 2026 Bsp. 22, 28',
    applies: (c) =>
      minijob(c) && c.erwartet.bgr[0] === '0' && c.person.krankenversicherung === 'privat',
    person: (p) => ({ ...p, krankenversicherung: 'gesetzlich' }),
    expected: (e) => ({ ...e, bgr: withDigit(e.bgr, 0, '6') }),
  },
  {
    id: 'stundenlohn',
    label: 'Stundenlohn mit demselben erwarteten Monatsverdienst statt Monatsentgelt',
    source: '§ 14 SGB IV: es zählt das Arbeitsentgelt, nicht die Lohnform',
    applies: (c) =>
      c.nichtAbbildbar === undefined &&
      c.arbeitgeber.agEntgeltArt === 'monatsentgelt' &&
      typeof c.arbeitgeber.agMonatsentgelt === 'string',
    employer: (e) => {
      const { agMonatsentgelt, ...rest } = e;
      return {
        ...rest,
        agEntgeltArt: 'stundenlohn',
        agStundenlohn: '13.90',
        agErwartetMonat: agMonatsentgelt,
      };
    },
  },
];

const VARIANTS = VARIATIONS.flatMap((v) =>
  MAPPABLE.filter(v.applies).map((c) => {
    const person = v.person ? v.person(c.person) : c.person;
    const employer = v.employer ? v.employer(c.arbeitgeber) : c.arbeitgeber;
    return { variation: v, base: c, result: assess(person, employer) };
  }),
);

describe('variations of the official cases', () => {
  it('derives variants from the official cases for every variation', () => {
    for (const v of VARIATIONS) {
      expect(VARIANTS.filter((x) => x.variation === v).length, v.id).toBeGreaterThan(0);
    }
  });

  it.each(VARIANTS.map((x) => [x.base.id, x.variation.label, x] as const))(
    '%s · %s',
    (_id, _label, { variation, base, result }) => {
      const app = actual(result);
      if (variation.expected) {
        const e = variation.expected(base.erwartet);
        const expectedBgr = [...e.bgr]
          .map((d, i) => (e.unsicher?.includes(DIGITS[i] ?? '') ? '?' : d))
          .join('');
        expect({ pgr: app.pgr, bgr: masked(app.bgr, expectedBgr) }).toEqual({
          pgr: e.pgr,
          bgr: expectedBgr,
        });
      } else {
        expect(app).toEqual(actual(resultOf(base)));
      }
    },
  );
});

// Limits of 2026 to the cent (SVBezGrV 2026, § 8 SGB IV: 603 €; § 20 SGB IV: 2.000 € and 325 €;
// § 6 SGB V: JAEG 77.400 €). Expectations derived from the wording ("nicht übersteigt").
const PERSON: Answers = {
  geburtsdatum: '1985-06-01',
  status: 'arbeitnehmer',
  grundsicherung: false,
  elternzeitAnderswo: false,
  bezugRente: false,
  weitereBeschaeftigung: false,
  krankenversicherung: 'gesetzlich',
};
const person = (art: string, more: Answers = {}): Answers => ({
  ...PERSON,
  artLautVereinbarung: art,
  ...(art === 'minijob' ? { rvBefreiungWunsch: 'nein' } : {}),
  ...more,
});
const employer = (art: string, pay: Answers, more: Answers = {}): Answers => ({
  agBeschaeftigungsbeginn: '2026-03-01',
  ...pay,
  agUeberJaeg: false,
  agBeschaeftigungsart: art,
  agBefristet: false,
  ...more,
});
const monthly = (betrag: string): Answers => ({
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: betrag,
});
const hourly = (erwartet: string): Answers => ({
  agEntgeltArt: 'stundenlohn',
  agStundenlohn: '13.90',
  agErwartetMonat: erwartet,
});
const azubi = (betrag: string): Answers => ({
  agEntgeltArt: 'ausbildungsverguetung',
  agAusbildungsverguetung: [
    { rowId: 'r1', avJahr: '1', avBetrag: betrag, avGueltigAb: '2026-03-01' },
  ],
});
const weihnachtsgeld = (betrag: string, anspruch: boolean): Answers => ({
  agEinmalzahlungen: [
    { rowId: 'r1', ezArt: 'weihnachtsgeld', ezBetrag: betrag, ezMonat: '11', ezAnspruch: anspruch },
  ],
});

interface Limit {
  label: string;
  source: string;
  person: Answers;
  employer: Answers;
  pgr: string;
  bgr: string;
  uebergang: string;
}

const befreiungEingang = (eingang: string): Answers => ({
  agUnterlagen: ['rvBefreiung'],
  agRvBefreiungEingang: eingang,
});

const aushilfe = (bis: string, tage: string): Answers => ({
  agBeschaeftigungsbeginn: '2026-06-01',
  agKurzfristigBis: bis,
  agKurzfristigArbeitstage: tage,
  agRahmenvereinbarung: false,
  agBefristet: true,
  agBefristetBis: bis,
});

const bav = (art: string, beitrag: string, zuschuss: string): Answers => ({
  agBav: art,
  agBavVertraege: [
    { rowId: 'r1', bavWeg: 'direktversicherung', bavBeitrag: beitrag, bavZuschuss: zuschuss },
  ],
});

const STUDENT: Answers = {
  geburtsdatum: '2003-03-01',
  bezugRente: false,
  weitereBeschaeftigung: false,
  krankenversicherung: 'gesetzlich',
  artLautVereinbarung: 'werkstudent',
  status: 'student',
  studienArt: 'vollzeit',
  hochschule: 'Beispiel-Hochschule',
  urlaubssemester: false,
  fachsemester: '3',
  ueber20hJahr: false,
};
const werkstudent = (stunden: string, more: Answers = {}): Answers =>
  employer('werkstudent', monthly('1200.00'), {
    agBeschaeftigungsbeginn: '2026-04-01',
    agNurSemesterferien: false,
    agVorlesungszeitStunden: stunden,
    ...more,
  });

const LIMITS: Limit[] = [
  {
    label: 'Werkstudent(in) 1.200 €, genau 20 Wochenstunden',
    source: 'RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a; DEÜV Anlage 2 (106)',
    person: STUDENT,
    employer: werkstudent('20'),
    pgr: '106',
    bgr: '0100',
    uebergang: '1',
  },
  {
    label: 'Werkstudent(in) 1.200 €, 20,5 Wochenstunden, nicht am Wochenende oder abends',
    source: 'RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a, Beispiel 4',
    person: STUDENT,
    employer: werkstudent('20.5', { agRandzeiten: false }),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Werkstudent(in) 1.200 €, 25 Wochenstunden abends, 26 Wochen befristet',
    source: 'RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a',
    person: STUDENT,
    employer: werkstudent('25', {
      agRandzeiten: true,
      agBefristet: true,
      agBefristetBis: '2026-09-29',
    }),
    pgr: '106',
    bgr: '0100',
    uebergang: '1',
  },
  {
    label: 'Werkstudent(in) 1.200 €, 25 Wochenstunden abends, 26 Wochen und ein Tag',
    source: 'RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a, Beispiel 1',
    person: STUDENT,
    employer: werkstudent('25', {
      agRandzeiten: true,
      agBefristet: true,
      agBefristetBis: '2026-09-30',
    }),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Werkstudent(in) 12 Wochenstunden für 600 € (Minijob geht vor)',
    source: 'RS Studenten und Praktikanten 2016, Tz. C 1; GfR 2026 C 2.2',
    person: STUDENT,
    employer: { ...werkstudent('12'), agMonatsentgelt: '600.00' },
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Werkstudent(in) in den Semesterferien, 01.08.–31.10. befristet (kurzfristig geht vor)',
    source: 'RS Studenten und Praktikanten 2016, Tz. A 1.2.4 c, C 1',
    person: STUDENT,
    employer: employer('werkstudent', monthly('2400.00'), {
      agBeschaeftigungsbeginn: '2026-08-01',
      agNurSemesterferien: true,
      agBefristet: true,
      agBefristetBis: '2026-10-31',
    }),
    pgr: '110',
    bgr: '0000',
    uebergang: '0',
  },
  {
    label: 'Minijob 720 € brutto, davon 120 € Entgeltumwandlung (GfR Bsp. 14)',
    source: '§ 14 Abs. 1 S. 2 SGB IV; § 1 Abs. 1 S. 1 Nr. 9 SvEV; GfR 2026 Bsp. 14',
    person: person('minijob'),
    employer: employer('minijob', monthly('720.00'), bav('umwandlung', '120.00', '0.00')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Minijob 720 €, Beitrag 140 € davon 20 € Zuschuss des Arbeitgebers (120 € umgewandelt)',
    source: '§ 14 Abs. 1 S. 2 SGB IV; GfR 2026 Bsp. 14',
    person: person('minijob'),
    employer: employer('minijob', monthly('720.00'), bav('beides', '140.00', '20.00')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: '„Minijob“ 720 €, die 120 € zahlt der Arbeitgeber zusätzlich (keine Umwandlung)',
    source: '§ 8 Abs. 1 Nr. 1 SGB IV (die Zuwendung mindert das Entgelt nicht)',
    person: person('minijob'),
    employer: employer('minijob', monthly('720.00'), bav('arbeitgeber', '120.00', '120.00')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: '950 € mit 400 € Umwandlung: beitragsfrei nur 338 € (4 % der BBG RV) – 612 € bleiben',
    source: '§ 14 Abs. 1 S. 2 SGB IV, § 1 Abs. 1 S. 1 Nr. 9 SvEV (BBG RV 2026: 8.450 € im Monat)',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('950.00'), bav('umwandlung', '400.00', '0.00')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: '940 € mit 338 € Umwandlung: genau 602 € – ein Minijob',
    source: '§ 14 Abs. 1 S. 2 SGB IV; § 8 Abs. 1 Nr. 1 SGB IV',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('940.00'), bav('umwandlung', '338.00', '0.00')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Aushilfe 01.06.–31.08. (genau drei Monate), 78 Arbeitstage, 1.500 €',
    source: '§ 8 Abs. 1 Nr. 2 SGB IV; GfR 2026 B 2.3, 2.3.1',
    person: person('aushilfe'),
    employer: employer('kurzfristig', monthly('1500.00'), aushilfe('2026-08-31', '78')),
    pgr: '110',
    bgr: '0000',
    uebergang: '0',
  },
  {
    label: 'Aushilfe 01.06.–01.09. (drei Monate und ein Tag), 79 Arbeitstage, 1.500 €',
    source: '§ 8 Abs. 1 Nr. 2 SGB IV; GfR 2026 B 2.3, Bsp. 37',
    person: person('aushilfe'),
    employer: employer('kurzfristig', monthly('1500.00'), aushilfe('2026-09-01', '79')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Aushilfe 01.06.–30.09., genau 70 Arbeitstage, 1.500 €',
    source: 'GfR 2026 B 2.3.1 (gleichwertige Alternativen), Bsp. 3b',
    person: person('aushilfe'),
    employer: employer('kurzfristig', monthly('1500.00'), aushilfe('2026-09-30', '70')),
    pgr: '110',
    bgr: '0000',
    uebergang: '0',
  },
  {
    label: 'Aushilfe 01.06.–30.09., 71 Arbeitstage, 1.500 €',
    source: 'GfR 2026 B 2.3.1',
    person: person('aushilfe'),
    employer: employer('kurzfristig', monthly('1500.00'), aushilfe('2026-09-30', '71')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Aushilfe 01.06.–30.09., 71 Arbeitstage, 500 € (dann ein Minijob)',
    source: 'GfR 2026 B 2.3 („zu prüfen, ob eine geringfügig entlohnte Beschäftigung vorliegt“)',
    person: person('aushilfe'),
    employer: employer('kurzfristig', monthly('500.00'), aushilfe('2026-09-30', '71')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Minijob ab 03.05., Befreiungsantrag am 05.05. eingegangen',
    source: '§ 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1, Bsp. 36a',
    person: person('minijob', { rvBefreiungWunsch: 'ja' }),
    employer: employer('minijob', monthly('600.00'), {
      agBeschaeftigungsbeginn: '2026-05-03',
      ...befreiungEingang('2026-05-05'),
    }),
    pgr: '109',
    bgr: '6500',
    uebergang: '0',
  },
  {
    label: 'Minijob ab 03.05., Befreiungsantrag am 31.05. eingegangen',
    source: '§ 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1',
    person: person('minijob', { rvBefreiungWunsch: 'ja' }),
    employer: employer('minijob', monthly('600.00'), {
      agBeschaeftigungsbeginn: '2026-05-03',
      ...befreiungEingang('2026-05-31'),
    }),
    pgr: '109',
    bgr: '6500',
    uebergang: '0',
  },
  {
    label: 'Minijob ab 03.05., Befreiungsantrag am 01.06. eingegangen (erst ab Juni befreit)',
    source: '§ 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1, Bsp. 36b',
    person: person('minijob', { rvBefreiungWunsch: 'ja' }),
    employer: employer('minijob', monthly('600.00'), {
      agBeschaeftigungsbeginn: '2026-05-03',
      ...befreiungEingang('2026-06-01'),
    }),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Minijob ab 03.05., Befreiungsantrag schon vor Beginn (20.04.) eingegangen',
    source: '§ 6 Abs. 4 S. 2 SGB VI („frühestens ab Beschäftigungsbeginn“)',
    person: person('minijob', { rvBefreiungWunsch: 'ja' }),
    employer: employer('minijob', monthly('600.00'), {
      agBeschaeftigungsbeginn: '2026-05-03',
      ...befreiungEingang('2026-04-20'),
    }),
    pgr: '109',
    bgr: '6500',
    uebergang: '0',
  },
  {
    label: 'Minijob mit genau 603,00 €',
    source: '§ 8 Abs. 1 Nr. 1, Abs. 1a SGB IV',
    person: person('minijob'),
    employer: employer('minijob', monthly('603.00')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: '„Minijob“ mit 603,01 €',
    source: '§ 8 Abs. 1 Nr. 1 SGB IV, § 20 Abs. 2 SGB IV',
    person: person('minijob'),
    employer: employer('minijob', monthly('603.01')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'versicherungspflichtig mit 603,01 €',
    source: '§ 20 Abs. 2 SGB IV',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('603.01')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'versicherungspflichtig mit genau 2.000,00 €',
    source: '§ 20 Abs. 2 SGB IV',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('2000.00')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'versicherungspflichtig mit 2.000,01 €',
    source: '§ 20 Abs. 2 SGB IV',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('2000.01')),
    pgr: '101',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'Minijob mit Stundenlohn, erwartet genau 603,00 €',
    source: '§ 8 Abs. 1 Nr. 1 SGB IV; GfR 2026 Bsp. 7a',
    person: person('minijob'),
    employer: employer('minijob', hourly('603.00')),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: '„Minijob“ mit Stundenlohn, erwartet 603,01 €',
    source: '§ 8 Abs. 1 Nr. 1, § 20 Abs. 2 SGB IV',
    person: person('minijob'),
    employer: employer('minijob', hourly('603.01')),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Minijob 600 € und Weihnachtsgeld 36 € mit Rechtsanspruch (Jahr genau 7.236 €)',
    source: '§ 8 Abs. 1a SGB IV; GfR 2026 Bsp. 6',
    person: person('minijob'),
    employer: employer('minijob', monthly('600.00'), weihnachtsgeld('36.00', true)),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Minijob 600 € und Weihnachtsgeld 37 € mit Rechtsanspruch (Jahr 7.237 €)',
    source: '§ 8 Abs. 1a SGB IV; GfR 2026 Bsp. 6',
    person: person('minijob'),
    employer: employer('minijob', monthly('600.00'), weihnachtsgeld('37.00', true)),
    pgr: '101',
    bgr: '1111',
    uebergang: '1',
  },
  {
    label: 'Minijob 600 € und eine freiwillige Prämie von 100 € ohne Rechtsanspruch',
    source:
      '§ 8 Abs. 1a SGB IV: regelmäßiges Arbeitsentgelt; abgeleitet aus GfR 2026 Bsp. 6, das ein vertraglich zugesagtes Weihnachtsgeld einrechnet',
    person: person('minijob'),
    employer: employer('minijob', monthly('600.00'), weihnachtsgeld('100.00', false)),
    pgr: '109',
    bgr: '6100',
    uebergang: '0',
  },
  {
    label: 'Auszubildende mit genau 325,00 €',
    source: '§ 20 Abs. 3 S. 1 Nr. 1 SGB IV; DEÜV Anlage 2 (121)',
    person: person('ausbildung'),
    employer: employer('ausbildung', azubi('325.00'), { agAusserbetrieblich: false }),
    pgr: '121',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'Auszubildende mit 325,01 €',
    source: '§ 20 Abs. 3 S. 1 Nr. 1, Abs. 2a SGB IV; DEÜV Anlage 2 (102)',
    person: person('ausbildung'),
    employer: employer('ausbildung', azubi('325.01'), { agAusserbetrieblich: false }),
    pgr: '102',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'Auszubildende mit 0,01 €',
    source: '§ 20 Abs. 3 S. 1 Nr. 1 SGB IV; DEÜV Anlage 2 (121)',
    person: person('ausbildung'),
    employer: employer('ausbildung', azubi('0.01'), { agAusserbetrieblich: false }),
    pgr: '121',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'Auszubildende ohne Vergütung (0,00 €)',
    source:
      'DEÜV Anlage 2 (121: „gilt nicht für Auszubildende ohne Arbeitsentgelt“, 102); § 5 Abs. 1 Nr. 10 SGB V',
    person: person('ausbildung'),
    employer: employer('ausbildung', azubi('0.00'), { agAusserbetrieblich: false }),
    pgr: '102',
    bgr: '0110',
    uebergang: '0',
  },
  {
    label: 'vorgeschriebenes Vorpraktikum mit 0,01 €',
    source: 'DEÜV Anlage 2 (105, 121); RS Studenten und Praktikanten 2016, Teil C',
    person: person('praktikum', { praktikumArt: 'pflicht' }),
    employer: employer('praktikum', monthly('0.01'), { agPraktikumArt: 'pflichtVorNach' }),
    pgr: '121',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'vorgeschriebenes Vorpraktikum mit 325,01 €',
    source: 'DEÜV Anlage 2 (105); § 20 Abs. 2a SGB IV (kein Übergangsbereich)',
    person: person('praktikum', { praktikumArt: 'pflicht' }),
    employer: employer('praktikum', monthly('325.01'), { agPraktikumArt: 'pflichtVorNach' }),
    pgr: '105',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: 'versicherungspflichtig mit genau 6.450,00 € (Jahr = JAEG 77.400 €)',
    source: '§ 6 Abs. 1 Nr. 1, Abs. 6 SGB V („übersteigt“)',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('6450.00')),
    pgr: '101',
    bgr: '1111',
    uebergang: '0',
  },
  {
    label: '6.450,01 € (über der JAEG), freiwillig gesetzlich, Firmenzahler',
    source: '§ 6 Abs. 1 Nr. 1 SGB V; GfR 2026 Bsp. 25',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('6450.01'), {
      agUeberJaeg: true,
      agFirmenzahler: 'firmenzahler',
    }),
    pgr: '101',
    bgr: '9111',
    uebergang: '0',
  },
  {
    label: '6.450,01 € (über der JAEG), freiwillig gesetzlich, Selbstzahler',
    source: '§ 6 Abs. 1 Nr. 1 SGB V; GfR 2026 Bsp. 26',
    person: person('festeStelle'),
    employer: employer('svpflichtig', monthly('6450.01'), {
      agUeberJaeg: true,
      agFirmenzahler: 'selbstzahler',
    }),
    pgr: '101',
    bgr: '0111',
    uebergang: '0',
  },
];

describe('limits of 2026 to the cent', () => {
  it.each(LIMITS.map((l) => [l.label, l] as const))('%s', (_label, limit) => {
    const r = assess(limit.person, limit.employer);
    expect(r.skipped).toEqual([]);
    expect(actual(r)).toEqual({ pgr: limit.pgr, bgr: limit.bgr, uebergang: limit.uebergang });
  });
});

const PROOF_SHORT: Record<string, string> = {
  'am Original geprüft': 'O',
  abgeleitet: 'A',
  'nicht verifiziert': 'N',
};
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function expectedText(c: Case): string {
  const e = c.erwartet;
  const parts = [
    `${e.pgr} · ${e.bgr}${e.uebergangsbereich === undefined ? '' : ` · ÜB ${e.uebergangsbereich}`}`,
  ];
  for (const s of e.spaeter ?? [])
    parts.push(`ab ${s.ab.split('-').reverse().join('.')}: ${s.pgr} · ${s.bgr}`);
  if (e.zusatzmeldung)
    parts.push(`${e.zusatzmeldung.an}: ${e.zusatzmeldung.pgr} · ${e.zusatzmeldung.bgr}`);
  if (e.unsicher?.length) parts.push(`${e.unsicher.join(', ').toUpperCase()} unsicher`);
  return parts.join('; ');
}

function appText(r: Assessment): string {
  return `${shownValue(r.pgr)} · ${shownValue(r.bgr)} · ÜB ${shownValue(r.uebergang)}`;
}

function verdict(c: Case): string {
  if (c.nichtAbbildbar !== undefined) return 'nicht abbildbar';
  const known = KNOWN_DEVIATIONS[c.id];
  return known ? `abweichend (${known.gruppe})` : 'gleich';
}

function report(): string {
  const lines = [
    `# SV-Beurteilung nach amtlichen Beispielen – ${svForm.definition.title} ${svForm.definition.version}`,
    '',
    '> Erzeugt aus `tests/fixtures/sv-vorgaben/` und der Formulardefinition (`npm run catalogue`), nicht von',
    '> Hand bearbeiten. Keine Rechtsberatung. Je Zeile ein Beispiel aus einer amtlichen oder veröffentlichten',
    '> Quelle, mit erfundener Person: erwartete Personengruppe · Beitragsgruppen (KV RV AV PV) · Kennzeichen',
    '> Übergangsbereich (ÜB) und der Vorschlag der App für dieselben Antworten; „(p)“ = mit Prüfvermerk.',
    '> Belegt: S = Sachverhalt; O = am Original geprüft, A = abgeleitet, N = nicht verifiziert.',
    '',
  ];
  const mappable = MAPPABLE.length;
  const open = Object.keys(KNOWN_DEVIATIONS).length;
  lines.push(
    `${CASES.length} Fälle aus ${FILES.length} Datei(en): ${mappable} abbildbar, ${CASES.length - mappable} nicht abbildbar; ` +
      `${mappable - open} gleich, ${open} abweichend. ${VARIANTS.length} abgeleitete Varianten, ${LIMITS.length} Grenzfälle.`,
    '',
    '| ID | Quelle | Sachverhalt | Erwartet | Belegt | App | Ergebnis |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const c of CASES) {
    const belegt = ['sachverhalt', 'pgr', 'bgr', 'uebergangsbereich']
      .filter((key) => c.pruefstatus[key] !== undefined)
      .map(
        (key) =>
          `${{ sachverhalt: 'S', pgr: 'PGR', bgr: 'BGR', uebergangsbereich: 'ÜB' }[key] ?? key} ${PROOF_SHORT[c.pruefstatus[key] ?? ''] ?? '?'}`,
      )
      .join(', ');
    lines.push(
      `| ${c.id} | ${cell(c.quelle.kurz)} | ${cell(c.titel)} | ${cell(expectedText(c))} | ${belegt} | ${appText(resultOf(c))} | ${verdict(c)} |`,
    );
  }
  lines.push('', '## Abweichungen', '');
  if (open === 0) lines.push('Keine.');
  for (const [gruppe, text] of Object.entries(GROUPS)) {
    const ids = Object.entries(KNOWN_DEVIATIONS).filter(([, d]) => d.gruppe === gruppe);
    if (ids.length === 0) continue;
    lines.push(`- **${gruppe} – ${text}:** ${ids.map(([id]) => id).join(', ')}`);
  }
  lines.push('', '## Nicht abbildbar', '');
  for (const c of CASES.filter((x) => x.nichtAbbildbar !== undefined)) {
    lines.push(`- **${c.id}** (${c.quelle.kurz}): ${c.nichtAbbildbar ?? ''}`);
  }
  lines.push(
    '',
    '## Grenzfälle 2026',
    '',
    '| Fall | Grundlage | Erwartet | App |',
    '| --- | --- | --- | --- |',
  );
  for (const limit of LIMITS) {
    lines.push(
      `| ${cell(limit.label)} | ${cell(limit.source)} | ${limit.pgr} · ${limit.bgr} · ÜB ${limit.uebergang} | ${appText(assess(limit.person, limit.employer))} |`,
    );
  }
  lines.push('', '## Quellen', '');
  const sources = new Map<string, string>();
  for (const c of CASES) sources.set(c.quelle.dokument, c.quelle.url ?? '');
  for (const [dokument, url] of sources) lines.push(`- ${dokument}${url ? ` – ${url}` : ''}`);
  return `${lines.join('\n')}\n`;
}

describe('docs/sv-vorgaben/', () => {
  it('lists every case with its source, expectation and the app proposal', async () => {
    await expect(report()).toMatchFileSnapshot(
      `../../docs/sv-vorgaben/${svForm.definition.id}-${svForm.definition.version}.md`,
    );
  });
});
