// Personalfragebogen 1.1.0 for a Beschäftigungsbeginn in 2026 and in 2027 (Tobias 2026-11-14: „also
// mit einer Fassung, die 2026 und 2027 kann? ja“). The rules read the values of the start year
// (RECHENGROESSEN), so one version covers both years: its validity names both, the question about
// the Regelaltersgrenze covers the wider range of birth dates, and a start in 2028 is refused. The
// published 1.0.0 stays frozen for 2026. Fictitious people.
import { join } from 'node:path';
import { RECHENGROESSEN } from '../../src/logic/data/rechengroessen';
import { visibleFields } from '../../src/logic/form';
import { checkHints, HINT_TESTS, hintTestProblem } from '../../src/logic/hints';
import { interviewSummary } from '../../src/logic/interview';
import type { FormDefinition, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { regelaltersgrenze } from '../../src/logic/regelaltersgrenze';
import {
  describeValidity,
  outsideValidityAdviceFor,
  versionValidFor,
} from '../../src/logic/validity';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';
import { actual, assess, shownValue, type Answers } from '../support/svCase';

const draft = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json')));
const published = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));

const allDefinitions = (): FormDefinition[] =>
  [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
    .filter((file) => file.file.endsWith('.json') && file.file !== 'published.json')
    .map((file) => readJson(file.path) as FormDefinition);

/** Names of the named tests a definition uses (`fn` anywhere in its rules). */
function testNames(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) testNames(item, found);
  else if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.fn === 'string') found.add(record.fn);
    for (const item of Object.values(record)) testNames(item, found);
  }
  return found;
}

const yearsOf = (from: string, until: string) => {
  const years: string[] = [];
  for (let year = Number(from.slice(0, 4)); year <= Number(until.slice(0, 4)); year += 1) {
    years.push(String(year));
  }
  return years;
};

describe('Personalfragebogen 1.1.0 for a start in 2026 and 2027', () => {
  it('covers a start from 01.01.2026 to 31.12.2027; the published 1.0.0 keeps 2026', () => {
    expect(draft.definition.validity).toEqual({
      field: 'agBeschaeftigungsbeginn',
      from: '2026-01-01',
      until: '2027-12-31',
    });
    expect(describeValidity(draft.definition)).toBe(
      'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2027',
    );
    expect(published.definition.validity).toMatchObject({ until: '2026-12-31' });
  });

  // A pay test of a year without data is uncertain at best; some parts of the rules then count the
  // Minijob limit as 0 €. The validity keeps the start inside the years the app knows.
  it('knows the Rechengrößen of every year a form with pay tests is valid for', () => {
    for (const definition of allDefinitions()) {
      const payTests = [...testNames(definition)].filter((name) =>
        HINT_TESTS[name]?.args.includes('money'),
      );
      if (payTests.length === 0) continue;
      const label = `${definition.id} ${definition.version}`;
      const { validity } = definition;
      expect(validity?.until, `${label}: a version with pay tests needs an end`).toBeDefined();
      for (const year of yearsOf(validity?.from ?? '', validity?.until ?? '')) {
        expect(RECHENGROESSEN[year], `${label}: Rechengrößen ${year}`).toBeDefined();
      }
    }
  });

  it('takes a start in 2027 without a warning and refuses one in 2028', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'arbeitgeber'));
    const inside = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '04.01.2027');
    expect(inside.ok && inside.warnings).toEqual([]);
    const late = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '31.12.2027');
    expect(late.ok && late.warnings).toEqual([]);
    const outside = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '03.01.2028');
    expect(outside.ok && outside.warnings).toContain('validity.outside');
    const part = ok(outside).parts.arbeitgeber?.[0];
    const summary = interviewSummary(draft.definition, 'arbeitgeber', part ?? { data: {} }, []);
    expect(summary.outsideValidity?.value).toBe('03.01.2028');
    expect(summary.readyToSign).toBe(false);
  });
});

describe('the Regelaltersgrenze over a start in 2026 or 2027', () => {
  const shownFor = (geburtsdatum: string) =>
    visibleFields(draft.definition, 'person', { geburtsdatum }).map((field) => field.id);

  it('asks only where the start in 2026 or 2027 decides it', () => {
    expect(shownFor('1959-11-02')).not.toContain('ragErreicht');
    expect(shownFor('1959-11-03')).toContain('ragErreicht');
    // Born in 1960: reached in 2026 or in 2027 — the start decides.
    expect(shownFor('1960-09-02')).toContain('ragErreicht');
    expect(shownFor('1961-07-01')).toContain('ragErreicht');
    expect(shownFor('1961-07-02')).not.toContain('ragErreicht');
  });

  it('draws the limits of that range from the Regelaltersgrenze and the validity', () => {
    const { validity } = draft.definition;
    const ask = draft.definition.sections
      .flatMap((section) => section.fields)
      .find((field) => field.id === 'ragErreicht')?.showIf;
    const [sure = '', open = ''] = JSON.stringify(ask).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const dayAfter = (date: string) => {
      const next = new Date(`${date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString().slice(0, 10);
    };
    const from = validity?.from ?? '';
    const until = validity?.until ?? '';
    const reached = (birth: string) => regelaltersgrenze(birth) ?? '';
    expect(reached(sure) <= from).toBe(true);
    expect(reached(dayAfter(sure)) > from).toBe(true);
    expect(reached(open) <= until).toBe(true);
    expect(reached(dayAfter(open)) > until).toBe(true);
  });

  it('names the Regelaltersgrenze of the birth year 1961 for a start in 2027', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'person'));
    for (const [id, value] of Object.entries({ geburtsdatum: '15.03.1961', ragErreicht: 'nein' })) {
      q = ok(setValue(q, draft, 'person', id, value));
    }
    q = ok(startPart(q, draft, 'arbeitgeber'));
    q = ok(setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '01.10.2027'));
    const hint = checkHints(q as Questionnaire, draft.definition).find(
      (h) => h.id === 'regelaltersgrenzeNichtAngegeben',
    );
    expect(hint?.detail).toEqual([
      'Regelaltersgrenze laut Geburtsdatum: 14.09.2027; Folgemonat: Oktober 2027.',
    ]);
  });
});

// Limits of 2027 to the cent through the draft, next to the same answers in 2026: Geringfügigkeits-
// grenze 633 € (MiLoV5: 14,60 €; BMAS notice of 07.11.2025), JAEG 84.150 €, besondere JAEG 72.900 €,
// JAEG of § 6 Abs. 8 SGB V 80.550 € (government draft of the SVBezGrV 2027, 07.10.2026).
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
const PRIVAT: Answers = {
  krankenversicherung: 'privat',
  versicherungsunternehmen: 'Muster-PKV',
  pkvBestand2002: 'nein',
  kvBefreiung: 'nein',
  gkvLetzte5Jahre: 'nein',
};
const employer = (art: string, start: string, pay: Answers, more: Answers = {}): Answers => ({
  agBeschaeftigungsbeginn: start,
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
const hourly = (lohn: string, erwartet: string): Answers => ({
  agEntgeltArt: 'stundenlohn',
  agStundenlohn: lohn,
  agErwartetMonat: erwartet,
});
const weihnachtsgeld = (betrag: string): Answers => ({
  agEinmalzahlungen: [
    { rowId: 'r1', ezArt: 'weihnachtsgeld', ezBetrag: betrag, ezMonat: '11', ezAnspruch: true },
  ],
});

interface Limit {
  label: string;
  person: Answers;
  employer: Answers;
  /** Personengruppe, Beitragsgruppen, Übergangsbereich; "(p)" = with a check. */
  shown: [string, string, string];
}

const LIMITS: Limit[] = [
  {
    label: 'Minijob mit genau 633,00 € ab 01.03.2027',
    person: person('minijob'),
    employer: employer('minijob', '2027-03-01', monthly('633.00')),
    shown: ['109', '6100', '0'],
  },
  {
    label: '„Minijob“ mit 633,01 € ab 01.03.2027',
    person: person('minijob'),
    employer: employer('minijob', '2027-03-01', monthly('633.01')),
    shown: ['101 (p)', '1111', '1'],
  },
  {
    label: 'versicherungspflichtig mit 633,01 € ab 01.03.2027 (Übergangsbereich)',
    person: person('festeStelle'),
    employer: employer('svpflichtig', '2027-03-01', monthly('633.01')),
    shown: ['101', '1111', '1'],
  },
  {
    label: '„Minijob“ mit 633,00 € ab 01.12.2026: 2026 über der Grenze von 603 €',
    person: person('minijob'),
    employer: employer('minijob', '2026-12-01', monthly('633.00')),
    shown: ['101 (p)', '1111', '1'],
  },
  {
    label: 'Minijob mit genau 603,00 € ab 01.12.2026, wie in der Fassung 1.0.0',
    person: person('minijob'),
    employer: employer('minijob', '2026-12-01', monthly('603.00')),
    shown: ['109', '6100', '0'],
  },
  {
    label: 'Minijob mit Stundenlohn 14,60 €, erwartet genau 633,00 € (2027)',
    person: person('minijob'),
    employer: employer('minijob', '2027-03-01', hourly('14.60', '633.00')),
    shown: ['109', '6100', '0'],
  },
  {
    label: 'Minijob 630 € und Weihnachtsgeld 36 € mit Anspruch (Jahr genau 7.596 €, 2027)',
    person: person('minijob'),
    employer: employer('minijob', '2027-03-01', monthly('630.00'), weihnachtsgeld('36.00')),
    shown: ['109', '6100', '0'],
  },
  {
    label: 'Minijob 630 € und Weihnachtsgeld 37 € mit Anspruch (Jahr 7.597 €, 2027)',
    person: person('minijob'),
    employer: employer('minijob', '2027-03-01', monthly('630.00'), weihnachtsgeld('37.00')),
    shown: ['101 (p)', '1111', '1'],
  },
  {
    label: 'versicherungspflichtig mit genau 7.012,50 € (Jahr = JAEG 84.150 €, 2027)',
    person: person('festeStelle'),
    employer: employer('svpflichtig', '2027-03-01', monthly('7012.50')),
    shown: ['101', '1111', '0'],
  },
  {
    label: '7.012,51 € (über der JAEG 2027), freiwillig gesetzlich, Firmenzahler',
    person: person('festeStelle'),
    employer: employer('svpflichtig', '2027-03-01', monthly('7012.51'), {
      agUeberJaeg: true,
      agFirmenzahler: 'firmenzahler',
    }),
    shown: ['101', '9111', '0'],
  },
  {
    label: 'privat versichert, 6.800 € ab 2026: über der JAEG 2026 (77.400 €)',
    person: person('festeStelle', PRIVAT),
    employer: employer('svpflichtig', '2026-03-01', monthly('6800.00')),
    shown: ['101', '0110', '0'],
  },
  {
    label:
      'privat versichert, 6.800 € ab 2027: zwischen 80.550 € (§ 6 Abs. 8 SGB V) und 84.150 € – prüfen',
    person: person('festeStelle', PRIVAT),
    employer: employer('svpflichtig', '2027-03-01', monthly('6800.00')),
    shown: ['101', '0110 (p)', '0'],
  },
  {
    label: 'privat versichert, 7.100 € ab 2027: über der JAEG 84.150 €',
    person: person('festeStelle', PRIVAT),
    employer: employer('svpflichtig', '2027-03-01', monthly('7100.00')),
    shown: ['101', '0110', '0'],
  },
  {
    label: 'privat versichert, 6.700 € ab 2027: unter 80.550 € – versicherungspflichtig',
    person: person('festeStelle', PRIVAT),
    employer: employer('svpflichtig', '2027-03-01', monthly('6700.00')),
    shown: ['101', '1111 (p)', '0'],
  },
  // Tobias 2026-11-15 („ich folge deiner Empfehlung“): the draft asks about 31.12.2026, so the band
  // between 80.550 € and 84.150 € is decided — only „Weiß ich nicht“ keeps the check.
  {
    label:
      'am 31.12.2026 versicherungsfrei privat versichert, 6.800 € ab 2027: über 80.550 € – frei',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2026: 'ja' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6800.00')),
    shown: ['101', '0110', '0'],
  },
  {
    label:
      'am 31.12.2026 nicht so versichert, 6.800 € ab 2027: unter 84.150 € – versicherungspflichtig',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2026: 'nein' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6800.00')),
    shown: ['101', '1111 (p)', '0'],
  },
  {
    label: '31.12.2026 „Weiß ich nicht“, 6.800 € ab 2027: zwischen den Grenzen – prüfen',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2026: 'unbekannt' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6800.00')),
    shown: ['101', '0110 (p)', '0'],
  },
  {
    label:
      'am 31.12.2026 versicherungsfrei privat versichert, genau 6.712,50 € ab 2027 (Jahr = 80.550 €)',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2026: 'ja' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6712.50')),
    shown: ['101', '1111 (p)', '0'],
  },
  {
    label:
      'am 31.12.2026 versicherungsfrei privat versichert, 6.800 € ab 2026: die Grenze von 2026',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2026: 'ja' }),
    employer: employer('svpflichtig', '2026-03-01', monthly('6800.00')),
    shown: ['101', '0110', '0'],
  },
  {
    label: 'am 31.12.2002 privat versichert, genau 6.075,00 € ab 2027 (Jahr = 72.900 €)',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2002: 'ja' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6075.00')),
    shown: ['101', '1111 (p)', '0'],
  },
  {
    label: 'am 31.12.2002 privat versichert, 6.075,01 € ab 2027',
    person: person('festeStelle', { ...PRIVAT, pkvBestand2002: 'ja' }),
    employer: employer('svpflichtig', '2027-03-01', monthly('6075.01')),
    shown: ['101', '0110', '0'],
  },
];

describe('the question about 31.12.2026 (§ 6 Abs. 8 SGB V)', () => {
  const asked = (answers: Answers) =>
    visibleFields(
      draft.definition,
      'person',
      Object.fromEntries(
        Object.entries(person('festeStelle', answers)).filter(([, value]) => value !== undefined),
      ) as Parameters<typeof visibleFields>[2],
    ).map((field) => field.id);

  it('is asked of the privately insured outside the 2002 group, right after that question', () => {
    const order = asked(PRIVAT);
    expect(order.indexOf('pkvBestand2026')).toBe(order.indexOf('pkvBestand2002') + 1);
    expect(asked({ ...PRIVAT, pkvBestand2002: 'unbekannt' })).toContain('pkvBestand2026');
  });

  it('is the last argument of the JAEG tests, which the published 1.0.0 leaves out', () => {
    const jaeg = HINT_TESTS.ueberMassgeblicheJahresarbeitsentgeltgrenze;
    const full = jaeg?.args.length ?? 0;
    // Fields and table columns of the draft (a JAEG test reads the other jobs' columns).
    const all = draft.definition.sections
      .flatMap((section) => section.fields)
      .flatMap((field) => [field, ...(field.columns ?? [])]);
    const fieldOf = (id: string) => all.find((field) => field.id === id);
    const usedBy = (definition: FormDefinition) =>
      JSON.stringify(definition).match(
        /"fn":"ueberMassgeblicheJahresarbeitsentgeltgrenze","args":\[([^\]]*)\]/,
      )?.[1];
    expect(usedBy(draft.definition)?.split(',')).toHaveLength(full);
    expect(usedBy(draft.definition)).toMatch(/"pkvBestand2026"$/);
    expect(usedBy(published.definition)?.split(',')).toHaveLength(full - 1);
    const args = (usedBy(draft.definition) ?? '').split(',').map((id) => JSON.parse(id) as string);
    const test = { fn: 'ueberMassgeblicheJahresarbeitsentgeltgrenze', args };
    expect(hintTestProblem(test, fieldOf)).toBeUndefined();
    expect(hintTestProblem({ ...test, args: args.slice(0, -1) }, fieldOf)).toBeUndefined();
    expect(hintTestProblem({ ...test, args: args.slice(0, -2) }, fieldOf)).toBe(
      `"ueberMassgeblicheJahresarbeitsentgeltgrenze" takes ${full - 1} to ${full} fields`,
    );
  });

  // Audit 2026-11-15: the guard above read only the first call; a JAEG test that left the answer out
  // in a further rule would have been accepted, as the published 1.0.0 must be.
  it('is passed to every JAEG test of the draft, in hints, proposals and exclusions alike', () => {
    const calls: { fn: string; args: string[] }[] = [];
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value !== null && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.fn === 'string' && Array.isArray(record.args)) {
          calls.push({ fn: record.fn, args: record.args as string[] });
        }
        Object.values(record).forEach(walk);
      }
    };
    walk(draft.definition);
    const optional = calls.filter((call) => (HINT_TESTS[call.fn]?.optional ?? 0) > 0);
    expect(optional.length).toBeGreaterThanOrEqual(11);
    for (const call of optional) {
      expect(call.args, call.fn).toHaveLength(HINT_TESTS[call.fn]?.args.length ?? 0);
      expect(call.args.at(-1), call.fn).toBe('pkvBestand2026');
    }
  });

  it('is not asked after „Ja“ for 31.12.2002, nor of the statutorily insured', () => {
    expect(asked({ ...PRIVAT, pkvBestand2002: 'ja' })).not.toContain('pkvBestand2026');
    expect(asked({})).not.toContain('pkvBestand2026');
  });
});

describe('limits of 2027 to the cent', () => {
  it.each(LIMITS.map((l) => [l.label, l] as const))('%s', (_label, limit) => {
    const r = assess(limit.person, limit.employer, draft);
    expect(r.skipped).toEqual([]);
    expect([shownValue(r.pgr), shownValue(r.bgr), shownValue(r.uebergang)]).toEqual(limit.shown);
  });

  it('names the limit of § 6 Abs. 8 SGB V in the reason of the check', () => {
    const r = assess(
      person('festeStelle', PRIVAT),
      employer('svpflichtig', '2027-03-01', monthly('6800.00')),
      draft,
    );
    expect(r.bgr?.detail).toContain(
      'Über der Jahresarbeitsentgeltgrenze für Personen, die am 31.12.2026 wegen Überschreitens der Grenze versicherungsfrei und privat versichert waren (80.550,00 € im Jahr, § 6 Abs. 8 SGB V): Traf das zu, ist die Person versicherungsfrei, sonst versicherungspflichtig – bitte prüfen.',
    );
  });

  it('gives the published 1.0.0 the same proposals for a start in 2026', () => {
    // 1.0.0 does not ask about 31.12.2026: cases with that answer are only for the draft.
    const in2026 = LIMITS.filter(
      (l) => String(l.employer.agBeschaeftigungsbeginn) < '2027' && !('pkvBestand2026' in l.person),
    );
    for (const limit of in2026) {
      expect(actual(assess(limit.person, limit.employer))).toEqual(
        actual(assess(limit.person, limit.employer, draft)),
      );
    }
  });
});

describe('several jobs over the Beitragsbemessungsgrenze in 2027', () => {
  const hintFor = (start: string, own: string, other: string) => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'person'));
    const mine: Answers = {
      ...person('festeStelle'),
      weitereBeschaeftigung: true,
      weitereJobs: [
        {
          rowId: 'r1',
          jobArbeitgeber: 'Muster GmbH',
          jobArt: 'svpflichtig',
          jobSeit: '2020-01-01',
          jobEntgeltMonat: other,
        },
      ],
    };
    for (const [id, value] of Object.entries(mine)) q = ok(setValue(q, draft, 'person', id, value));
    q = ok(startPart(q, draft, 'arbeitgeber'));
    for (const [id, value] of Object.entries(employer('svpflichtig', start, monthly(own)))) {
      q = ok(setValue(q, draft, 'arbeitgeber', id, value));
    }
    return checkHints(q, draft.definition).find((h) => h.id === 'mehrfachUeberBbgMonatsentgelt');
  };

  // § 55 Abs. 2 SGB XI: the BBG of the Pflegeversicherung is 1/12 of the JAEG of § 6 Abs. 7 SGB V
  // (6.075 € in 2027); the BBG of the Krankenversicherung is 6.375 € (§ 223 Abs. 4 SGB V).
  it('counts the lower limit of the Pflegeversicherung and names both', () => {
    expect(hintFor('2027-03-01', '3100.00', '3000.00')?.detail).toEqual([
      'Zusammen 6.100,00 € im Monat (davon diese Beschäftigung 3.100,00 €); Beitragsbemessungsgrenze Pflegeversicherung (Krankenversicherung: 6.375,00 €; Renten- und Arbeitslosenversicherung: 8.850,00 €) 2027: 6.075,00 € im Monat.',
    ]);
    expect(hintFor('2027-03-01', '3000.00', '3000.00')).toBeUndefined();
  });

  it('keeps the text of 2026, where both limits are equal', () => {
    expect(hintFor('2026-03-01', '3000.00', '3000.00')?.detail).toEqual([
      'Zusammen 6.000,00 € im Monat (davon diese Beschäftigung 3.000,00 €); Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (Renten- und Arbeitslosenversicherung: 8.450,00 €) 2026: 5.812,50 € im Monat.',
    ]);
  });
});

// A further Minijob next to a main job (Geringfügigkeits-Richtlinien B 2.2.2.8): whether the main job
// is free in the KV depends on the JAEG; between the limit of § 6 Abs. 8 SGB V and the general one it
// is uncertain for a privately insured person outside the 2002 group, never for the 2002 group.
describe('a further Minijob next to a main job between the JAEG limits of 2027', () => {
  // fixed, expected, oneOff, entitled, start, kinds, pays, since, bAV kind, contribution, subsidy, 2002,
  // and from the draft 1.1.0 on the answer about 31.12.2026
  const args = (main: string, y2002: string, y2026?: string) => [
    '300.00',
    null,
    null,
    null,
    '2027-03-01',
    ['svpflichtig', 'minijob'],
    [main, '200.00'],
    ['2020-01-01', '2026-06-01'],
    null,
    null,
    null,
    y2002,
    ...(y2026 === undefined ? [] : [y2026]),
  ];
  const free = HINT_TESTS.weitererMinijobNebenJaegFreierHauptbeschaeftigung;
  const lifted = HINT_TESTS.weitererMinijobUeberJaeg;

  it('leaves a main job of 6.800 € a month open for a privately insured person', () => {
    expect(free?.run(args('6800.00', 'nein'))).toMatchObject({ holds: true, uncertain: true });
    expect(free?.run(args('7100.00', 'nein'))).toMatchObject({ holds: true });
    expect(free?.run(args('7100.00', 'nein'))?.uncertain).toBeFalsy();
    // Statutorily insured: the 2002 question is not asked, the general JAEG decides.
    expect(free?.run(args('6800.00', null as unknown as string))).toMatchObject({ holds: false });
  });

  it('marks a main job lifted above the JAEG by this Minijob as open in that range', () => {
    expect(lifted?.run(args('6800.00', 'nein'))).toMatchObject({ holds: true, uncertain: true });
    expect(lifted?.run(args('6800.00', 'ja'))).toMatchObject({ holds: false });
  });

  // Audit 2026-11-15: the answer about 31.12.2026 decides the range (80.550 € or 84.150 € a year).
  it('decides that range by the answer about 31.12.2026 and names the limit it used', () => {
    const exempt = free?.run(args('6800.00', 'nein', 'ja'));
    expect(exempt).toMatchObject({ holds: true });
    expect(exempt?.uncertain).toBeFalsy();
    expect(exempt?.detail[0]).toContain(
      'über der Jahresarbeitsentgeltgrenze nach § 6 Abs. 8 SGB V, krankenversicherungsfrei',
    );
    expect(free?.run(args('6800.00', 'nein', 'nein'))).toMatchObject({ holds: false });

    const liftedExempt = lifted?.run(args('6600.00', 'nein', 'ja'));
    expect(liftedExempt).toMatchObject({ holds: true });
    expect(liftedExempt?.uncertain).toBeFalsy();
    expect(liftedExempt?.detail[0]).toContain(
      'über der Jahresarbeitsentgeltgrenze nach § 6 Abs. 8 SGB V von 80.550,00 €',
    );
    expect(lifted?.run(args('6800.00', 'nein', 'ja'))).toMatchObject({ holds: false });
    const liftedGeneral = lifted?.run(args('6800.00', 'nein', 'nein'));
    expect(liftedGeneral).toMatchObject({ holds: true });
    expect(liftedGeneral?.uncertain).toBeFalsy();
    expect(liftedGeneral?.detail[0]).toContain(
      'über der Jahresarbeitsentgeltgrenze von 84.150,00 €',
    );
  });

  // Audit 2026-11-16: in the band „Weiß ich nicht“ leaves open, the text called a main job of
  // 81.600 € „über der Jahresarbeitsentgeltgrenze“ of 84.150 € without saying why it is open.
  it('says why a main job between the two limits is open, not that it is above the JAEG', () => {
    const open = free?.run(args('6800.00', 'nein', 'unbekannt'));
    expect(open).toMatchObject({ holds: true, uncertain: true });
    expect(open?.detail.join(' ')).toContain('am 31.12.2026');
    expect(open?.detail.join(' ')).toContain('§ 6 Abs. 8 SGB V');
    expect(open?.detail.join(' ')).not.toContain(
      'über der Jahresarbeitsentgeltgrenze, krankenversicherungsfrei',
    );
    const lifted2026 = lifted?.run(args('6800.00', 'nein', 'unbekannt'));
    expect(lifted2026?.detail.join(' ')).toContain('am 31.12.2026');
  });

  it('names the year whose values are missing', () => {
    const later = [...args('6800.00', 'nein', 'unbekannt')];
    later[4] = '2031-03-01';
    const missing = free?.run(later);
    expect(missing).toMatchObject({ holds: true, uncertain: true });
    expect(missing?.detail.join(' ')).toContain('Für 2031');
    expect(missing?.detail.join(' ')).not.toContain('krankenversicherungsfrei');
  });

  it('names the special limit for the 2002 group when this Minijob lifts the main job above it', () => {
    expect(lifted?.run(args('5900.00', 'ja'))?.detail[0]).toContain(
      'über der besonderen Jahresarbeitsentgeltgrenze (§ 6 Abs. 7 SGB V) von 72.900,00 €',
    );
  });

  it('names in the catalogue which limit the answers about 2002 and 2026 choose', () => {
    const labels = Array.from({ length: 13 }, (_, i) => `F${i}`);
    for (const test of [free, lifted]) {
      const text = test?.describe(labels) ?? '';
      expect(text).toContain('„F11“');
      expect(text).toContain('„F12“');
      expect(text).toContain('§ 6 Abs. 8 SGB V');
    }
  });

  it('names the special limit of § 6 Abs. 7 SGB V for the 2002 group', () => {
    expect(free?.run(args('6800.00', 'ja'))?.detail[0]).toContain(
      'über der besonderen Jahresarbeitsentgeltgrenze (§ 6 Abs. 7 SGB V), krankenversicherungsfrei',
    );
  });
});

// Tobias 2026-11-14 („ja“): a start outside the validity must not send the person looking for a
// version the app does not carry — the public app holds only 1.0.0 (2026) until 1.1.0 is published.
describe('a start outside the validity names the version that fits, or that there is none', () => {
  const both = [published.definition, draft.definition];
  const employerData = (start: string) => ({ agBeschaeftigungsbeginn: start });

  it('finds another version of the same form that is valid for the day', () => {
    expect(versionValidFor(both, published.definition, '2027-01-04')?.version).toBe('1.1.0');
    expect(versionValidFor([published.definition], published.definition, '2027-01-04')).toBe(
      undefined,
    );
    expect(versionValidFor(both, draft.definition, '2028-01-03')).toBe(undefined);
  });

  it('says what to do in the app with only 1.0.0 and in the one with 1.1.0', () => {
    const advice = (forms: FormDefinition[], start: string) =>
      outsideValidityAdviceFor(forms, published.definition, 'arbeitgeber', employerData(start));
    expect(advice([published.definition], '2027-01-04')).toBe(
      'Für dieses Datum gibt es in dieser App noch keine Fassung dieses Fragebogens. Bitte wenden Sie sich an Ihre Kanzlei.',
    );
    expect(advice(both, '2027-01-04')).toBe(
      'Für dieses Datum gilt die Fassung 1.1.0 dieses Fragebogens: bitte damit einen neuen Fragebogen beginnen.',
    );
    expect(advice(both, '2026-10-01')).toBe(undefined);
    expect(
      outsideValidityAdviceFor(both, draft.definition, 'person', employerData('2027-01-04')),
    ).toBe(undefined);
  });
});

// Audit 2026-11-16, round 3: in a Minijob the questions about 31.12.2002 and 31.12.2026 were never
// asked, so a privately insured person with a main job between the special and the general JAEG
// got KV 1 for a further Minijob; GfR B 2.2.2.8 (examples 25, 26) adds no Minijob to a main job free
// of the KV. Asked now when the Minijob stands next to another job.
describe('a privately insured person in a further Minijob next to a main job', () => {
  const person: Answers = {
    geburtsdatum: '1975-07-07',
    status: 'arbeitnehmer',
    grundsicherung: false,
    elternzeitAnderswo: false,
    bezugRente: false,
    artLautVereinbarung: 'minijob',
    weitereBeschaeftigung: true,
    weitereJobs: [
      {
        rowId: 'r1',
        jobArbeitgeber: 'Arbeitgeber A',
        jobArt: 'svpflichtig',
        jobSeit: '2020-01-01',
        jobEntgeltMonat: '6000.00',
      },
      {
        rowId: 'r2',
        jobArbeitgeber: 'Arbeitgeber B',
        jobArt: 'minijob',
        jobSeit: '2026-07-01',
        jobEntgeltMonat: '200.00',
        jobRvBefreit: 'nein',
      },
    ],
    krankenversicherung: 'privat',
    pkvBestand2002: 'ja',
    rvBefreiungWunsch: 'nein',
  };
  const employer: Answers = {
    agBeschaeftigungsbeginn: '2026-09-01',
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '300.00',
    agUeberJaeg: false,
    agBeschaeftigungsart: 'minijob',
    agBefristet: false,
  };

  it('asks about 31.12.2002 and keeps the further Minijob free of the KV', () => {
    const r = assess(person, employer, draft);
    expect(r.skipped).not.toContain('pkvBestand2002');
    expect(shownValue(r.bgr)).toMatch(/^0/);
    expect(r.bgr?.detail.join(' ')).toContain('§ 6 Abs. 7 SGB V');
  });

  // Audit 2026-11-16, round 4: the bounds of the new condition, checked by behaviour, not only by
  // the catalogue: a short-term job and the statutorily insured are not asked.
  it('does not ask a short-term helper or a statutorily insured person', () => {
    const shown = (answers: Answers) =>
      visibleFields(draft.definition, 'person', answers as Parameters<typeof visibleFields>[2]).map(
        (field) => field.id,
      );
    expect(shown({ ...person, artLautVereinbarung: 'aushilfe' })).not.toContain('pkvBestand2002');
    expect(shown({ ...person, krankenversicherung: 'gesetzlich' })).not.toContain('pkvBestand2002');
    const field = draft.definition.sections
      .flatMap((section) => section.fields)
      .find((candidate) => candidate.id === 'pkvBestand2002');
    expect(field?.showIf).toEqual({
      all: [
        { field: 'krankenversicherung', equals: 'privat' },
        {
          any: [
            { not: { field: 'artLautVereinbarung', in: ['minijob', 'aushilfe'] } },
            {
              all: [
                { field: 'artLautVereinbarung', equals: 'minijob' },
                { field: 'weitereBeschaeftigung', equals: true },
              ],
            },
          ],
        },
      ],
    });
  });

  it('still leaves the questions out for a Minijob alone', () => {
    const alone = { ...person, weitereBeschaeftigung: false };
    delete (alone as Record<string, unknown>).weitereJobs;
    const ids = visibleFields(
      draft.definition,
      'person',
      alone as Parameters<typeof visibleFields>[2],
    ).map((field) => field.id);
    expect(ids).not.toContain('pkvBestand2002');
    expect(
      visibleFields(draft.definition, 'person', person as Parameters<typeof visibleFields>[2]).map(
        (field) => field.id,
      ),
    ).toContain('pkvBestand2002');
  });
});

// Audit 2026-11-16, round 4: a privately insured person whose main job lies under the JAEG and only
// this Minijob lifts them above it was proposed „Über der JAEG: krankenversicherungsfrei“ without a
// check. Privately insured next to a main job under the JAEG means an exemption (§ 8 SGB V) or the
// freedom from 55 (§ 6 Abs. 3a SGB V) — then the Minijob is not added (§ 7 Abs. 1 Satz 2 SGB V).
describe('a privately insured person lifted above the JAEG only by this Minijob', () => {
  const lifted = (main: string, start: string, y2002?: string): Answers => ({
    geburtsdatum: '1975-07-07',
    status: 'arbeitnehmer',
    grundsicherung: false,
    elternzeitAnderswo: false,
    bezugRente: false,
    artLautVereinbarung: 'minijob',
    weitereBeschaeftigung: true,
    weitereJobs: [
      {
        rowId: 'r1',
        jobArbeitgeber: 'Arbeitgeber A',
        jobArt: 'svpflichtig',
        jobSeit: '2020-01-01',
        jobEntgeltMonat: main,
      },
      {
        rowId: 'r2',
        jobArbeitgeber: 'Arbeitgeber B',
        jobArt: 'minijob',
        jobSeit: `${start.slice(0, 4)}-01-01`,
        jobEntgeltMonat: '200.00',
        jobRvBefreit: 'nein',
      },
    ],
    krankenversicherung: 'privat',
    ...(y2002 === undefined ? {} : { pkvBestand2002: y2002 }),
    rvBefreiungWunsch: 'nein',
  });
  const minijob = (start: string): Answers => ({
    agBeschaeftigungsbeginn: start,
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '300.00',
    agUeberJaeg: false,
    agBeschaeftigungsart: 'minijob',
    agBefristet: false,
  });

  it.each([
    ['5900.00', '2027-02-01', 'ja'],
    ['6300.00', '2026-02-01', 'nein'],
  ])(
    'main job %s €, start %s: names the exemption it rests on and asks to check',
    (main, start, y2002) => {
      const r = assess(lifted(main, start, y2002), minijob(start), draft);
      const kv = r.bgr?.detail.find((line) => line.startsWith('KV')) ?? '';
      expect(kv).not.toContain('Über der Jahresarbeitsentgeltgrenze: krankenversicherungsfrei');
      expect(kv).toContain('§ 8 SGB V');
      expect(kv).toContain('(prüfen)');
    },
  );

  it('gives a Minijob employer no hint about a contribution subsidy or a Firmenzahler', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'person'));
    const answers = lifted('6200.00', '2027-02-01', 'ja');
    for (let pass = 0; pass < 3; pass++) {
      for (const [id, value] of Object.entries(answers)) {
        const set = setValue(q, draft, 'person', id, value);
        if (set.ok) q = set.questionnaire;
      }
    }
    q = ok(startPart(q, draft, 'arbeitgeber'));
    for (const [id, value] of Object.entries(minijob('2027-02-01'))) {
      q = ok(setValue(q, draft, 'arbeitgeber', id, value));
    }
    const ids = checkHints(q, draft.definition).map((hint) => hint.id);
    expect(ids).not.toContain('jaeg');
    expect(ids).not.toContain('jaegNichtAngegeben');
  });
});
