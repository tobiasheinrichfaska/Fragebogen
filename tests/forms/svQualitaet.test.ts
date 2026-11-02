// Quality check of the SV proposals (Tobias 2026-11-01: "führe eine Qualitätskontrolle auf der
// Fragebogendefinition aus … für jeden Eingabepunkt, in welchen Kombinationen dies Auswirkungen auf
// die BGS und PGRS hat, und teste denkbare Varianten durch"). Three parts:
// 1. docs/sv-wirkung/: which answer moves which proposal, read off the rule tables;
// 2. docs/sv-varianten/: kinds of employment × pay × person, each with Personengruppe and
//    Beitragsgruppen, for review by a person;
// 3. rules every variant must keep (DEÜV Anlage 16 and more). Fictitious data.
import { join } from 'node:path';
import { derive, type DerivationResult } from '../../src/logic/derivations';
import { derivationImpact, impactReport } from '../../src/logic/derivationImpact';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { ANLAGE_16 } from '../support/anlage16';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;
type Answers = Record<string, unknown>;

/** Answers in order; one the form does not ask in this case is noted, not forced. */
function filled(q: Questionnaire, role: string, values: Answers, skipped: string[]) {
  let current = q;
  const started = startPart(current, form, role);
  if (!started.ok) throw new Error(started.code);
  current = started.questionnaire;
  for (const [id, raw] of Object.entries(values)) {
    const result = setValue(current, form, role, id, raw);
    if (result.ok) current = result.questionnaire;
    else if (result.code === 'fieldNotAvailable') skipped.push(id);
    else throw new Error(`${role}.${id}: ${result.code} ${result.detail.join(' ')}`);
  }
  return current;
}

interface Person {
  label: string;
  answers: Answers;
}

const GKV = { krankenversicherung: 'gesetzlich' };
const PERSONS: Record<string, Person> = {
  arbeitnehmer: {
    label: 'Arbeitnehmer/in, gesetzlich',
    answers: { geburtsdatum: '1990-05-17', status: 'arbeitnehmer', ...GKV },
  },
  arbeitnehmerPkv: {
    label: 'Arbeitnehmer/in, privat',
    answers: { geburtsdatum: '1990-05-17', status: 'arbeitnehmer', krankenversicherung: 'privat' },
  },
  hauptjob: {
    label: 'Arbeitnehmer/in mit Hauptbeschäftigung',
    answers: {
      geburtsdatum: '1990-05-17',
      status: 'arbeitnehmer',
      weitereBeschaeftigung: true,
      weitereJobs: [
        {
          rowId: 'r1',
          jobArbeitgeber: 'Hauptarbeitgeber GmbH',
          jobArt: 'svpflichtig',
          jobSeit: '2020-01-01',
          jobEntgeltMonat: '3.000,00',
        },
      ],
      ...GKV,
    },
  },
  schueler: {
    label: 'Schüler/in (allgemeinbildende Schule)',
    answers: { geburtsdatum: '2009-03-01', status: 'schueler', schulart: 'allgemein', ...GKV },
  },
  student: {
    label: 'Student/in',
    answers: {
      geburtsdatum: '2003-03-01',
      status: 'student',
      studienArt: 'vollzeit',
      hochschule: 'Beispiel-Hochschule',
      urlaubssemester: false,
      fachsemester: '3',
      ueber20hJahr: false,
      ...GKV,
    },
  },
  vollrenteVorRag: {
    label: 'Altersvollrente vor der Regelaltersgrenze',
    answers: {
      geburtsdatum: '1962-02-01',
      status: 'ruhestand',
      bezugRente: true,
      bezugPension: false,
      rentenart: 'altersvoll',
      renteSeit: '2025-03-01',
      ...GKV,
    },
  },
  vollrenteNachRag: {
    label: 'Altersvollrente nach der Regelaltersgrenze',
    answers: {
      geburtsdatum: '1958-01-15',
      status: 'ruhestand',
      bezugRente: true,
      bezugPension: false,
      rentenart: 'altersvoll',
      renteSeit: '2024-02-01',
      rvVerzicht: 'nein',
      ...GKV,
    },
  },
  vollrenteVerzicht: {
    label: 'Altersvollrente nach der Regelaltersgrenze, Verzicht auf RV-Freiheit',
    answers: {
      geburtsdatum: '1958-01-15',
      status: 'ruhestand',
      bezugRente: true,
      bezugPension: false,
      rentenart: 'altersvoll',
      renteSeit: '2024-02-01',
      rvVerzicht: 'ja',
      ...GKV,
    },
  },
  ragOhneRente: {
    label: 'Regelaltersgrenze erreicht, nie rentenversichert',
    answers: {
      geburtsdatum: '1958-01-15',
      status: 'arbeitnehmer',
      rvNieVersichert: 'nieVersichert',
      rvVerzicht: 'nein',
      ...GKV,
    },
  },
  emVoll: {
    label: 'Rente wegen voller Erwerbsminderung',
    answers: {
      geburtsdatum: '1975-06-01',
      status: 'arbeitnehmer',
      bezugRente: true,
      rentenart: 'emVoll',
      renteSeit: '2023-01-01',
      ...GKV,
    },
  },
  beamter: {
    label: 'Beamter/Beamtin mit Beihilfe, privat',
    answers: {
      geburtsdatum: '1980-01-01',
      status: 'beamter',
      elternzeitAnderswo: false,
      beamtBeihilfe: true,
      krankenversicherung: 'privat',
    },
  },
  pensionaer: {
    label: 'Pensionär/in wegen Alters mit Beihilfe, privat',
    answers: {
      geburtsdatum: '1958-01-15',
      status: 'ruhestand',
      bezugPension: true,
      beamtBeihilfe: true,
      pensionArt: 'alter',
      rvVerzicht: 'nein',
      krankenversicherung: 'privat',
    },
  },
  arbeitslos: {
    label: 'arbeitslos mit Arbeitslosengeld',
    answers: {
      geburtsdatum: '1985-01-01',
      status: 'arbeitslos',
      grundsicherung: false,
      leistungArbeitslos: 'arbeitslosengeld',
      arbeitsuchendSeit: '2026-05-01',
      ...GKV,
    },
  },
  zweiterMinijob: {
    label: 'mit einem anderen Minijob (300 €)',
    answers: {
      geburtsdatum: '1990-05-17',
      status: 'arbeitnehmer',
      weitereBeschaeftigung: true,
      weitereJobs: [
        {
          rowId: 'r1',
          jobArbeitgeber: 'Anderer Arbeitgeber',
          jobArt: 'minijob',
          jobSeit: '2025-01-01',
          jobEntgeltMonat: '300,00',
          jobRvBefreit: 'nein',
        },
      ],
      ...GKV,
    },
  },
  hauptjobUndMinijob: {
    label: 'Hauptbeschäftigung und schon ein anderer Minijob',
    answers: {
      geburtsdatum: '1990-05-17',
      status: 'arbeitnehmer',
      weitereBeschaeftigung: true,
      weitereJobs: [
        {
          rowId: 'r1',
          jobArbeitgeber: 'Hauptarbeitgeber GmbH',
          jobArt: 'svpflichtig',
          jobSeit: '2020-01-01',
          jobEntgeltMonat: '3.000,00',
        },
        {
          rowId: 'r2',
          jobArbeitgeber: 'Anderer Arbeitgeber',
          jobArt: 'minijob',
          jobSeit: '2025-01-01',
          jobEntgeltMonat: '300,00',
          jobRvBefreit: 'nein',
        },
      ],
      ...GKV,
    },
  },
  teilrente: {
    label: 'Altersteilrente vor der Regelaltersgrenze',
    answers: {
      geburtsdatum: '1962-02-01',
      status: 'arbeitnehmer',
      bezugRente: true,
      rentenart: 'altersteil',
      renteSeit: '2025-03-01',
      ...GKV,
    },
  },
  ragUnklar: {
    label: 'Regelaltersgrenze 2026 erreicht, „weiß ich nicht“ angegeben',
    answers: {
      geburtsdatum: '1960-03-15',
      status: 'arbeitnehmer',
      ragErreicht: 'unbekannt',
      ...GKV,
    },
  },
  beamterGkv: {
    label: 'Beamter/Beamtin mit Beihilfe, gesetzlich (freiwillig)',
    answers: {
      geburtsdatum: '1980-01-01',
      status: 'beamter',
      elternzeitAnderswo: false,
      beamtBeihilfe: true,
      ...GKV,
    },
  },
  dienst: {
    label: 'Freiwilligendienst',
    answers: { geburtsdatum: '2006-01-01', status: 'dienst', dienstBis: '2027-08-31', ...GKV },
  },
  vorruhestand: {
    label: 'Vorruhestand (ohne Rente)',
    answers: { geburtsdatum: '1964-01-01', status: 'ruhestand', bezugPension: false, ...GKV },
  },
};

interface Job {
  label: string;
  /** What the person calls it. */
  art: string;
  employer: Answers;
  persons: string[];
}

const pay = (betrag: string, art: string, more: Answers = {}): Answers => ({
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: betrag,
  agUeberJaeg: false,
  agBeschaeftigungsart: art,
  ...more,
});
const azubi = (betrag: string, art = 'ausbildung'): Answers => ({
  agEntgeltArt: 'ausbildungsverguetung',
  agAusbildungsverguetung: [
    { rowId: 'r1', avJahr: '1', avBetrag: betrag, avGueltigAb: '2026-09-01' },
  ],
  agUeberJaeg: false,
  agBeschaeftigungsart: art,
  ...(art === 'ausbildung' ? { agAusserbetrieblich: false } : {}),
});
const ALL = Object.keys(PERSONS).filter((id) => !['dienst', 'vorruhestand'].includes(id));
const MINIJOB = ALL.filter((id) => id !== 'teilrente');
const EINFACH = ALL.filter((id) => id !== 'hauptjobUndMinijob');
const MOSTLY = [
  'arbeitnehmer',
  'arbeitnehmerPkv',
  'schueler',
  'student',
  'vollrenteVorRag',
  'vollrenteNachRag',
  'arbeitslos',
  'beamter',
];

const JOBS: Job[] = [
  {
    label: 'sv-pflichtig, 300 €',
    art: 'festeStelle',
    employer: pay('300,00', 'svpflichtig'),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'sv-pflichtig, 1.500 € (Übergangsbereich)',
    art: 'festeStelle',
    employer: pay('1.500,00', 'svpflichtig'),
    persons: EINFACH,
  },
  {
    label: 'sv-pflichtig, 3.000 €',
    art: 'festeStelle',
    employer: pay('3.000,00', 'svpflichtig'),
    persons: EINFACH,
  },
  {
    label: 'sv-pflichtig, 7.500 € (über der JAEG), Firmenzahler',
    art: 'festeStelle',
    employer: pay('7.500,00', 'svpflichtig', { agUeberJaeg: true, agFirmenzahler: 'firmenzahler' }),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'sv-pflichtig, 7.500 € (über der JAEG), privat',
    art: 'festeStelle',
    employer: pay('7.500,00', 'svpflichtig', {
      agUeberJaeg: true,
      agFirmenzahler: 'nichtFreiwillig',
    }),
    persons: ['arbeitnehmerPkv'],
  },
  { label: 'Minijob, 450 €', art: 'minijob', employer: pay('450,00', 'minijob'), persons: MINIJOB },
  {
    label: 'Minijob mit Stundenlohn, erwartet 500 € im Monat',
    art: 'minijob',
    employer: {
      agEntgeltArt: 'stundenlohn',
      agStundenlohn: '14,00',
      agErwartetMonat: '500,00',
      agUeberJaeg: false,
      agBeschaeftigungsart: 'minijob',
    },
    persons: ['arbeitnehmer'],
  },
  {
    label: 'Minijob, 603 € (Grenze)',
    art: 'minijob',
    employer: pay('603,00', 'minijob'),
    persons: ['arbeitnehmer', 'arbeitnehmerPkv'],
  },
  {
    label: '„Minijob“ mit 650 € (über der Grenze)',
    art: 'minijob',
    employer: pay('650,00', 'minijob'),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'kurzfristige Aushilfe, 500 €',
    art: 'aushilfe',
    employer: pay('500,00', 'kurzfristig'),
    persons: ['arbeitnehmer', 'arbeitslos'],
  },
  {
    label: 'kurzfristige Aushilfe, 1.500 €',
    art: 'aushilfe',
    employer: pay('1.500,00', 'kurzfristig'),
    persons: MOSTLY,
  },
  {
    label: 'Ausbildung, 300 € (Geringverdiener)',
    art: 'ausbildung',
    employer: azubi('300,00'),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'Ausbildung, 900 €',
    art: 'ausbildung',
    employer: azubi('900,00'),
    persons: ['arbeitnehmer', 'arbeitnehmerPkv'],
  },
  {
    label: 'duales Studium, 900 €',
    art: 'ausbildung',
    employer: azubi('900,00', 'dualesStudium'),
    persons: ['student'],
  },
  {
    label: 'Pflichtpraktikum im Studium, 900 €',
    art: 'praktikum',
    employer: pay('900,00', 'praktikum', { agPraktikumArt: 'pflichtStudium' }),
    persons: ['student'],
  },
  {
    label: 'vorgeschriebenes Vor- oder Nachpraktikum, 300 €',
    art: 'praktikum',
    employer: pay('300,00', 'praktikum', { agPraktikumArt: 'pflichtVorNach' }),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'vorgeschriebenes Vor- oder Nachpraktikum, 900 €',
    art: 'praktikum',
    employer: pay('900,00', 'praktikum', { agPraktikumArt: 'pflichtVorNach' }),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'freiwilliges Praktikum, 900 €',
    art: 'praktikum',
    employer: pay('900,00', 'praktikum', { agPraktikumArt: 'freiwillig' }),
    persons: ['student', 'arbeitnehmer'],
  },
  {
    label: 'Werkstudent/in, 1.200 €',
    art: 'werkstudent',
    employer: pay('1.200,00', 'werkstudent', { agNurSemesterferien: false }),
    persons: ['student'],
  },
  {
    label: 'Werkstudent/in nur in den Semesterferien, 1.200 €',
    art: 'werkstudent',
    employer: pay('1.200,00', 'werkstudent', { agNurSemesterferien: true }),
    persons: ['student'],
  },
  {
    label: 'Altersteilzeit, 3.000 €',
    art: 'festeStelle',
    employer: pay('3.000,00', 'svpflichtig', {
      agArbeitszeitform: 'teilzeit',
      agArbeitszeitmodell: 'altersteilzeit',
      agAtzModell: 'block',
      agAtzVon: '2026-11-01',
      agAtzBis: '2030-10-31',
      agAtzVorherStunden: '40',
    }),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'Art der Beschäftigung „Bitte prüfen lassen“, 1.000 €',
    art: 'unbekannt',
    employer: pay('1.000,00', 'pruefen'),
    persons: ['arbeitnehmer'],
  },
  {
    label: 'Freiwilligendienst, 500 €',
    art: 'freiwilligendienst',
    employer: pay('500,00', 'freiwilligendienst'),
    persons: ['dienst'],
  },
  {
    label: 'Vorruhestandsgeld, 1.500 €',
    art: 'vorruhestand',
    employer: {
      agEntgeltArt: 'keines',
      agUeberJaeg: false,
      agBeschaeftigungsart: 'vorruhestand',
      agVorruhestandBis: '2028-12-31',
      agVorruhestandBetrag: '1.500,00',
    },
    persons: ['vorruhestand'],
  },
];

interface Variant {
  job: Job;
  person: string;
  rvBefreiung?: string;
  pgr: DerivationResult | undefined;
  bgr: DerivationResult | undefined;
  uebergang: DerivationResult | undefined;
  skipped: string[];
}

function run(job: Job, person: string, rvBefreiung?: string): Variant {
  const skipped: string[] = [];
  const answers: Answers = {
    weitereBeschaeftigung: false,
    ...PERSONS[person]?.answers,
    artLautVereinbarung: job.art,
    ...(job.art === 'praktikum' ? { praktikumArt: 'pflicht' } : {}),
    ...(rvBefreiung === undefined ? {} : { rvBefreiungWunsch: rvBefreiung }),
  };
  let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
  q = filled(q, 'person', answers, skipped);
  q = filled(
    q,
    'arbeitgeber',
    { agBeschaeftigungsbeginn: '02.11.2026', ...job.employer, agBefristet: false },
    skipped,
  );
  const results = new Map(derive(q, definition).map((d) => [d.id, d] as const));
  return {
    job,
    person,
    ...(rvBefreiung === undefined ? {} : { rvBefreiung }),
    pgr: results.get('personengruppe'),
    bgr: results.get('beitragsgruppen'),
    uebergang: results.get('uebergangsbereich'),
    skipped,
  };
}

const VARIANTS: Variant[] = JOBS.flatMap((job) =>
  job.persons.flatMap((person) =>
    job.art === 'minijob' ? ['nein', 'ja'].map((rv) => run(job, person, rv)) : [run(job, person)],
  ),
);

const shown = (result: DerivationResult | undefined) =>
  result?.status === 'proposed' ? `${result.value ?? ''}${result.check ? ' (prüfen)' : ''}` : '–';

function variantReport(): string {
  const lines = [
    `# Varianten der SV-Vorschläge – ${definition.title} ${definition.version}`,
    '',
    '> Erzeugt aus der Formulardefinition (`npm run catalogue`), nicht von Hand bearbeiten. Je Zeile',
    '> eine erfundene Kombination aus Beschäftigung (Angaben des Arbeitgebers), Person und – im',
    '> Minijob – dem Wunsch nach Befreiung von der Rentenversicherung, Beginn 02.11.2026. „(prüfen)“:',
    '> Der Vorschlag braucht einen Blick der lohnabrechnenden Stelle. „nicht gefragt“: Angaben des',
    '> Profils, die der Fragebogen in diesem Fall gar nicht stellt.',
    '',
    `${VARIANTS.length} Varianten.`,
  ];
  for (const job of JOBS) {
    lines.push(
      '',
      `## ${job.label}`,
      '',
      '| Person | RV-Befreiung | Personengruppe | Beitragsgruppen | Übergangsbereich | nicht gefragt |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const variant of VARIANTS.filter((v) => v.job === job)) {
      lines.push(
        `| ${PERSONS[variant.person]?.label ?? variant.person} | ${variant.rvBefreiung ?? '–'} | ${shown(variant.pgr)} | ${shown(variant.bgr)} | ${shown(variant.uebergang)} | ${variant.skipped.join(', ') || '–'} |`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

describe('docs/sv-wirkung/ and docs/sv-varianten/', () => {
  it('lists for every answer the proposals it moves', async () => {
    await expect(impactReport(definition)).toMatchFileSnapshot(
      `../../docs/sv-wirkung/${definition.id}-${definition.version}.md`,
    );
  });

  it('lists every variant with its proposals', async () => {
    await expect(variantReport()).toMatchFileSnapshot(
      `../../docs/sv-varianten/${definition.id}-${definition.version}.md`,
    );
  });
});

describe('impact analysis', () => {
  const impact = new Map(derivationImpact(definition).map((entry) => [entry.field.id, entry]));

  it('finds the direct and the deciding answers', () => {
    expect(impact.get('agBeschaeftigungsart')?.direct.map((use) => use.derivation)).toEqual(
      expect.arrayContaining(['personengruppe', 'bgrKv', 'bgrRv', 'bgrAv', 'bgrPv']),
    );
    // The status decides whether the pension type is asked, which decides KV, RV, PGR.
    expect(impact.get('bezugRente')?.gates).toContain('rentenart');
    expect(impact.get('geburtsdatum')?.direct.map((use) => use.derivation)).toEqual(
      expect.arrayContaining(['personengruppe', 'bgrRv', 'bgrAv']),
    );
    // A column acts through its table.
    expect(impact.has('agAusbildungsverguetung')).toBe(true);
    expect(impact.has('avBetrag')).toBe(false);
  });

  it('leaves out answers without any effect', () => {
    expect(impact.has('familienname')).toBe(false);
    expect(impact.has('iban')).toBe(false);
  });
});

// Findings of the quality check of 2026-11-01, open for Tobias' decision. Each line is a variant
// that breaks a rule below; fixing the definition must remove it from here.
const KNOWN_FINDINGS: readonly string[] = [];

const variantName = (v: Variant) =>
  `${v.job.label} · ${PERSONS[v.person]?.label ?? v.person}${v.rvBefreiung ? ` · RV-Befreiung ${v.rvBefreiung}` : ''}`;

/** Rules whose breach is a finding to discuss rather than a plain bug. */
function findingsOf(v: Variant): string[] {
  const [kv = '', , , pv = ''] = [...(v.bgr?.value ?? '')];
  const found: string[] = [];
  // Contributions to KV (1, 3) or as Firmenzahler (9) carry PV; without KV contributions from this
  // job (0, or 6 = Pauschalbeitrag) there is no PV contribution from it either.
  if ('139'.includes(kv) && !['1', '2'].includes(pv)) found.push(`PV ${pv} bei KV ${kv}`);
  if ('06'.includes(kv) && pv !== '0') found.push(`PV ${pv} bei KV ${kv}`);
  // A student in an internship not required by the study rules keeps the Werkstudentenprivileg.
  if (
    v.person === 'student' &&
    v.job.label.startsWith('freiwilliges Praktikum') &&
    !(v.pgr?.value === '106' || v.pgr?.check)
  ) {
    found.push(`Personengruppe ${v.pgr?.value ?? ''} ohne Prüfung des Werkstudentenprivilegs`);
  }
  return found.map((text) => `${variantName(v)}: ${text}`);
}

const variant = (jobLabel: string, person: string, rv?: string) => {
  const found = VARIANTS.find(
    (v) => v.job.label.startsWith(jobLabel) && v.person === person && v.rvBefreiung === rv,
  );
  if (!found) throw new Error(`no variant ${jobLabel} · ${person}`);
  return found;
};
const proposal = (v: Variant) => ({ pgr: v.pgr?.value, pgrCheck: v.pgr?.check, bgr: v.bgr?.value });

// Tobias' decisions on the findings of 2026-11-01 ("es sollen am Ende die korrekten Schlüsse
// gezogen werden").
describe('the decided findings stay decided', () => {
  it('F1: Beihilfe frees KV and with it PV, also with voluntary statutory insurance', () => {
    expect(variant('sv-pflichtig, 3.000', 'beamterGkv').bgr?.value).toBe('0110');
  });

  it('F2: a student in a voluntary internship is judged as a Werkstudent, with a check', () => {
    expect(proposal(variant('freiwilliges Praktikum', 'student'))).toEqual({
      pgr: '106',
      pgrCheck: true,
      bgr: '0100',
    });
  });

  it('F3: Minijobs are added up – without a main job together, next to one from the second', () => {
    expect(proposal(variant('Minijob, 450', 'zweiterMinijob', 'nein'))).toMatchObject({
      pgr: '101',
      pgrCheck: true,
      bgr: '1111',
    });
    // The first Minijob next to a main job stays free …
    expect(proposal(variant('Minijob, 450', 'hauptjob', 'nein'))).toMatchObject({
      pgr: '109',
      bgr: '6100',
    });
    // … a second one is added to the main job: KV, RV, PV, but free in the AV.
    expect(proposal(variant('Minijob, 450', 'hauptjobUndMinijob', 'nein'))).toMatchObject({
      pgr: '101',
      pgrCheck: true,
      bgr: '1101',
    });
  });

  it('F4: berufsmäßig above the limit is not short-term; within the limit it stays short-term', () => {
    expect(proposal(variant('kurzfristige Aushilfe, 1.500', 'arbeitslos'))).toMatchObject({
      pgr: '101',
      pgrCheck: true,
    });
    expect(variant('kurzfristige Aushilfe, 1.500', 'arbeitslos').bgr?.value).not.toBe('0000');
    expect(proposal(variant('kurzfristige Aushilfe, 500', 'arbeitslos'))).toMatchObject({
      pgr: '110',
      bgr: '0000',
    });
    expect(proposal(variant('kurzfristige Aushilfe, 1.500', 'arbeitnehmer'))).toMatchObject({
      pgr: '110',
      bgr: '0000',
    });
  });

  it('F5: "sv-pflichtig" with Minijob pay is judged as a Minijob, with a check', () => {
    expect(proposal(variant('sv-pflichtig, 300', 'arbeitnehmer'))).toEqual({
      pgr: '109',
      pgrCheck: true,
      bgr: '6100',
    });
  });

  it('F6: who is already free in the RV is not asked about the Minijob exemption', () => {
    for (const person of ['vollrenteNachRag', 'vollrenteVerzicht', 'ragOhneRente', 'pensionaer']) {
      expect(variant('Minijob, 450', person, 'ja').skipped).toContain('rvBefreiungWunsch');
    }
    expect(variant('Minijob, 450', 'vollrenteVorRag', 'ja').skipped).not.toContain(
      'rvBefreiungWunsch',
    );
  });
});

describe('every variant keeps the rules of the SV proposals', () => {
  const cases = VARIANTS.map((v) => [variantName(v), v] as const);

  it.each(cases)('%s: proposes a Personengruppe and Beitragsgruppen', (_label, v) => {
    expect(v.pgr?.status).toBe('proposed');
    expect(v.bgr?.status).toBe('proposed');
    expect(v.bgr?.value).toMatch(/^[0-9?]{4}$/);
  });

  it.each(cases)('%s: Beitragsgruppen allowed for the Personengruppe (DEÜV Anlage 16)', (_l, v) => {
    const gruppe = v.pgr?.value ?? '';
    const digits = v.bgr?.value ?? '';
    if (gruppe === 'prüfen' || digits.includes('?')) return;
    const allowed = ANLAGE_16[gruppe];
    expect(allowed, `Personengruppe ${gruppe} not in the table`).toBeDefined();
    [...digits].forEach((digit, i) => {
      expect(
        allowed?.[i],
        `${['KV', 'RV', 'AV', 'PV'][i] ?? ''} ${digit} with ${gruppe}`,
      ).toContain(digit);
    });
  });

  it('breaks the rules to discuss only in the known findings', () => {
    expect(VARIANTS.flatMap(findingsOf)).toEqual(KNOWN_FINDINGS);
  });

  it.each(cases)('%s: Übergangsbereich only for an employment that can have it', (_label, v) => {
    if (v.uebergang?.value !== '1') return;
    expect(['102', '105', '109', '110', '121', '190']).not.toContain(v.pgr?.value);
  });

  it('sets the Übergangsbereich for 1.500 € in an ordinary job', () => {
    const v = VARIANTS.find(
      (x) => x.job.label.startsWith('sv-pflichtig, 1.500') && x.person === 'arbeitnehmer',
    );
    expect(v?.uebergang?.value).toBe('1');
  });

  it('asks every profile answer that matters, except where the case rules it out', () => {
    // Only these may be skipped: questions a case does not ask by design.
    const expected = new Set([
      'rvVerzicht',
      'praktikumArt',
      'rvBefreiungWunsch',
      'agAusserbetrieblich',
      'agBefristet',
    ]);
    const unexpected = VARIANTS.flatMap((v) =>
      v.skipped
        .filter((id) => !expected.has(id))
        .map((id) => `${v.job.label} · ${v.person}: ${id}`),
    );
    expect(unexpected).toEqual([]);
  });
});
