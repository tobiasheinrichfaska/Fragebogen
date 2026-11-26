// The JAEG hints of the Personalfragebogen 1.1.0 as the employer of this job reads them (audit
// 2026-11-16, round 5). Until then they added this job's pay always and were switched off for every
// Minijob and short-term employer: a Minijob that is added up (Geringfügigkeits-Richtlinien B
// 2.2.2.8, examples 26 and 27) lost its hint, and a „sv-pflichtig“ job with Minijob pay got one with a
// sum that held the first Minijob. A Minijob is free in the KV (§ 7 Abs. 1 SGB V) and owes no
// Beitragszuschuss; only where it is added up does it count, and then each employer pays its share
// (§ 257 Abs. 1 Satz 3 SGB V).
import { join } from 'node:path';
import { checkHints, hintLine } from '../../src/logic/hints';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';
import { assess, type Answers } from '../support/svCase';

const draft = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.1.0.json')));

/** Sets the answers of a role in passes, so a follow-up may come before what opens it. */
function filled(q: Questionnaire, role: string, answers: Answers): Questionnaire {
  let current = ok(startPart(q, draft, role));
  for (let pass = 0; pass < 4; pass++) {
    for (const [id, value] of Object.entries(answers)) {
      const set = setValue(current, draft, role, id, value);
      if (set.ok) current = set.questionnaire;
    }
  }
  return current;
}

/** The JAEG hints (id → their line as the Kanzlei reads it) for one case. */
function jaegHints(person: Answers, employer: Answers): Map<string, string> {
  const q = filled(
    filled(createQuestionnaire(QUESTIONNAIRE_ID, draft), 'person', person),
    'arbeitgeber',
    employer,
  );
  return new Map(
    checkHints(q, draft.definition)
      .filter((hint) => hint.id === 'jaeg' || hint.id === 'jaegNichtAngegeben')
      .map((hint) => [hint.id, hintLine(hint)] as const),
  );
}

interface Job {
  art: 'svpflichtig' | 'minijob';
  seit: string;
  monat: string;
}

const person = (jobs: readonly Job[], kv: 'gesetzlich' | 'privat' = 'gesetzlich'): Answers => ({
  geburtsdatum: '1980-03-03',
  status: 'arbeitnehmer',
  grundsicherung: false,
  elternzeitAnderswo: false,
  bezugRente: false,
  artLautVereinbarung: 'minijob',
  weitereBeschaeftigung: jobs.length > 0,
  ...(jobs.length > 0
    ? {
        weitereJobs: jobs.map((job, i) => ({
          rowId: `r${i + 1}`,
          jobArbeitgeber: `Arbeitgeber ${String.fromCharCode(65 + i)}`,
          jobArt: job.art,
          jobSeit: job.seit,
          jobEntgeltMonat: job.monat,
          ...(job.art === 'minijob' ? { jobRvBefreit: 'nein' } : {}),
        })),
      }
    : {}),
  krankenversicherung: kv,
  ...(kv === 'privat'
    ? { versicherungsunternehmen: 'Muster-PKV', pkvBestand2002: 'nein', kvBefreiung: 'nein' }
    : {}),
  rvBefreiungWunsch: 'nein',
});

const employer = (art: string, start: string, monat: string, more: Answers = {}): Answers => ({
  agBeschaeftigungsbeginn: start,
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: monat,
  agUeberJaeg: false,
  agBeschaeftigungsart: art,
  agBefristet: false,
  ...more,
});

const MAIN_6000: Job = { art: 'svpflichtig', seit: '2020-01-01', monat: '6000.00' };
const MAIN_6300: Job = { art: 'svpflichtig', seit: '2020-01-01', monat: '6300.00' };
const MAIN_7000: Job = { art: 'svpflichtig', seit: '2020-01-01', monat: '7000.00' };

describe('the JAEG hints count this job only where it is added up', () => {
  it('a job of 650 € is no Minijob: it is added to the main job (79.800 € in the year)', () => {
    const hints = jaegHints(person([MAIN_6000]), employer('minijob', '2026-03-01', '650.00'));
    expect(hints.get('jaeg')).toContain('79.800,00 €');
    expect(hints.has('jaegNichtAngegeben')).toBe(true);
  });

  it('a „short-term“ job not fixed in advance is none, its pay counts', () => {
    const hints = jaegHints(person([], 'privat'), employer('kurzfristig', '2026-03-01', '8000.00'));
    expect(hints.get('jaeg')).toContain('96.000,00 €');
  });

  it('a short-term job fixed in advance gives none', () => {
    const hints = jaegHints(
      person([]),
      employer('kurzfristig', '2026-07-01', '9000.00', {
        agBefristet: true,
        agKurzfristigBis: '2026-08-31',
        agKurzfristigArbeitstage: '40',
        agRahmenvereinbarung: false,
      }),
    );
    expect([...hints.keys()]).toEqual([]);
  });

  it('GfR example 25 B: the first Minijob next to a main job free in the KV gives none', () => {
    expect([
      ...jaegHints(person([MAIN_7000]), employer('minijob', '2026-07-01', '300.00')).keys(),
    ]).toEqual([]);
  });

  it('GfR example 25 C: Minijobs together within the limit give none', () => {
    const jobs: Job[] = [MAIN_7000, { art: 'minijob', seit: '2026-07-01', monat: '300.00' }];
    expect([
      ...jaegHints(person(jobs), employer('minijob', '2026-09-01', '300.00')).keys(),
    ]).toEqual([]);
  });

  it('GfR example 26 C: Minijobs together above the limit — every employer pays its share', () => {
    const jobs: Job[] = [MAIN_7000, { art: 'minijob', seit: '2026-07-01', monat: '600.00' }];
    const line = jaegHints(person(jobs), employer('minijob', '2026-09-01', '500.00')).get('jaeg');
    expect(line).toContain('Beispiel 26');
    expect(line).toContain('§ 257 Abs. 1 Satz 3 SGB V');
  });

  it('GfR example 27 C: a further Minijob lifts the main job above — first subject to KV', () => {
    const jobs: Job[] = [MAIN_6000, { art: 'minijob', seit: '2026-06-01', monat: '550.00' }];
    const line = jaegHints(person(jobs), employer('minijob', '2026-10-01', '500.00')).get('jaeg');
    expect(line).toContain('zunächst krankenversicherungspflichtig');
    // 6.000 € and 500 € a month; the first Minijob (550 €) is not added.
    expect(line).toContain('78.000,00 €');
    expect(line).not.toContain('84.600,00 €');
  });

  it.each(['gesetzlich', 'privat'] as const)(
    'the first Minijob next to a main job under the JAEG gives none (%s)',
    (kv) => {
      expect([
        ...jaegHints(person([MAIN_6300], kv), employer('minijob', '2026-03-01', '300.00')).keys(),
      ]).toEqual([]);
    },
  );

  it('a „sv-pflichtig“ job with Minijob pay is a Minijob too: none next to 6.300 €', () => {
    const hints = jaegHints(
      person([MAIN_6300], 'privat'),
      employer('svpflichtig', '2026-03-01', '300.00', { agArbeitszeitmodell: 'gleitzeit' }),
    );
    expect([...hints.keys()]).toEqual([]);
  });
});

// The hint and the KV proposal read the same facts the same way: a further Minijob of a privately
// insured person next to a main job under the JAEG is added up (KV 1, with a check that names the
// exemption that would make it 0), and the hint says it is at first subject to KV.
describe('the JAEG hint and the KV proposal agree', () => {
  it.each(['minijob', 'svpflichtig'])('a further Minijob chosen as „%s“', (art) => {
    const jobs: Job[] = [MAIN_6300, { art: 'minijob', seit: '2026-01-01', monat: '200.00' }];
    const answers = person(jobs, 'privat');
    const job = employer(art, '2026-03-01', '300.00', { agArbeitszeitmodell: 'gleitzeit' });
    const kv = assess(answers, job, draft).bgr?.detail.find((line) => line.startsWith('KV')) ?? '';
    expect(kv).toContain('zusammengerechnet');
    expect(kv).toContain('(prüfen)');
    const line = jaegHints(answers, job).get('jaeg') ?? '';
    expect(line).toContain('zunächst krankenversicherungspflichtig');
    expect(line).not.toContain('nicht zusammengerechnet');
  });
});

// Audit 2026-11-16, loop 6: the PV rule of round 5 said 1 where the KV said 0, it came before the
// reasons the form knows (five years without statutory insurance, hauptberuflich selbständig), a
// Minijob begun after this one counted from this job's start, and one-off payments were left out of
// the Minijobs added together.
describe('a further Minijob of a privately insured person: KV and PV agree (loop 6)', () => {
  const digits = (answers: Answers, job: Answers) => {
    const r = assess(answers, job, draft);
    return {
      kv: r.bgr?.value?.[0],
      pv: r.bgr?.value?.[3],
      kvLine: r.bgr?.detail.find((line) => line.startsWith('KV')) ?? '',
    };
  };
  const minijob200: Job = { art: 'minijob', seit: '2026-01-01', monat: '200.00' };
  const main3000: Job = { art: 'svpflichtig', seit: '2020-01-01', monat: '3000.00' };

  it.each([
    [
      'GfR example 26 C, privately insured',
      person([MAIN_7000, { art: 'minijob', seit: '2026-07-01', monat: '600.00' }], 'privat'),
      employer('minijob', '2026-09-01', '500.00'),
    ],
    [
      'a pensioner with Beihilfe',
      {
        ...person([main3000, minijob200], 'privat'),
        status: 'ruhestand',
        bezugPension: true,
        pensionArt: 'alter',
        beamtBeihilfe: true,
      },
      employer('minijob', '2026-03-01', '300.00'),
    ],
    [
      'an exemption from the KV',
      {
        ...person([main3000, minijob200], 'privat'),
        artLautVereinbarung: 'festeStelle',
        kvBefreiung: 'ja',
      },
      employer('svpflichtig', '2026-03-01', '300.00', { agArbeitszeitmodell: 'gleitzeit' }),
    ],
    [
      'a main job in the band of § 6 Abs. 8 SGB V (2027, answer unknown)',
      {
        ...person(
          [
            { art: 'svpflichtig', seit: '2020-01-01', monat: '6750.00' },
            { art: 'minijob', seit: '2027-01-01', monat: '400.00' },
          ],
          'privat',
        ),
        pkvBestand2026: 'unbekannt',
      },
      employer('minijob', '2027-03-01', '300.00'),
    ],
  ])('%s: KV 0 and PV 0', (_label, answers, job) => {
    const { kv, pv } = digits(answers, job);
    expect(kv).toBe('0');
    expect(pv).toBe('0');
  });

  it.each(['1965-02-02', '1985-02-02'])(
    'not statutorily insured for five years (born %s): the main job is no KV job, so 0',
    (geburtsdatum) => {
      const { kv, pv, kvLine } = digits(
        {
          ...person([main3000, minijob200], 'privat'),
          geburtsdatum,
          artLautVereinbarung: 'festeStelle',
          gkvLetzte5Jahre: 'nein',
        },
        employer('svpflichtig', '2026-03-01', '300.00', { agArbeitszeitmodell: 'gleitzeit' }),
      );
      expect([kv, pv]).toEqual(['0', '0']);
      expect(kvLine).toContain('in den letzten fünf Jahren nicht gesetzlich versichert');
      expect(kvLine).toContain('(prüfen)');
    },
  );

  it('hauptberuflich selbständig: 0', () => {
    const { kv, pv, kvLine } = digits(
      {
        ...person([main3000, minijob200], 'privat'),
        status: 'selbstaendig',
        selbstHauptberuf: true,
      },
      employer('minijob', '2026-03-01', '300.00'),
    );
    expect([kv, pv]).toEqual(['0', '0']);
    expect(kvLine).toContain('§ 5 Abs. 5 SGB V');
  });

  it('the agreement test of round 5 holds on the digits too', () => {
    const jobs: Job[] = [MAIN_6300, { art: 'minijob', seit: '2026-01-01', monat: '200.00' }];
    const { kv, pv } = digits(person(jobs, 'privat'), employer('minijob', '2026-03-01', '300.00'));
    expect([kv, pv]).toEqual(['1', '1']);
  });
});

describe('the Minijobs added together (loop 6)', () => {
  it('GfR example 26 B: a Minijob begun later counts only from its own start', () => {
    const jobs: Job[] = [MAIN_7000, { art: 'minijob', seit: '2026-09-01', monat: '500.00' }];
    const answers = person(jobs);
    const job = employer('minijob', '2026-07-01', '600.00');
    const line = jaegHints(answers, job).get('jaeg') ?? '';
    expect(line).toContain('Ab 01.09.2026');
    expect(line).toContain('Bis dahin bleibt diese Beschäftigung ein Minijob.');
    // From its own start B is a Minijob with the KV flat rate (GfR example 25 B).
    expect(assess(answers, job, draft).bgr?.value?.[0]).toBe('6');
  });

  it('a Christmas bonus counts in the yearly view: 300 € + 600 € a year is 350 € a month', () => {
    const jobs: Job[] = [MAIN_7000, { art: 'minijob', seit: '2026-01-01', monat: '280.00' }];
    const answers = person(jobs);
    const job = employer('minijob', '2026-03-01', '300.00', {
      agEinmalzahlungen: [
        {
          rowId: 'r1',
          ezArt: 'weihnachtsgeld',
          ezBetrag: '600.00',
          ezMonat: '11',
          ezAnspruch: true,
        },
      ],
    });
    // 630 € together, above the limit of 603 €: no Minijobs in the KV (GfR example 26 C).
    expect(jaegHints(answers, job).get('jaeg')).toContain('630,00 €');
    const { value } = assess(answers, job, draft).bgr ?? {};
    expect(value?.[0]).toBe('0');
    expect(value?.[3]).toBe('1');
  });

  it('a job in Altersteilzeit with Minijob pay is no Minijob: it counts', () => {
    const line = jaegHints(
      person([MAIN_7000]),
      employer('svpflichtig', '2026-03-01', '500.00', { agArbeitszeitmodell: 'altersteilzeit' }),
    ).get('jaeg');
    expect(line).toContain('90.000,00 €');
  });

  it('own one-off payments make a job of 560 € no Minijob', () => {
    const line = jaegHints(
      person([MAIN_6000]),
      employer('minijob', '2026-03-01', '560.00', {
        agEinmalzahlungen: [
          {
            rowId: 'r1',
            ezArt: 'weihnachtsgeld',
            ezBetrag: '1000.00',
            ezMonat: '11',
            ezAnspruch: true,
          },
        ],
      }),
    ).get('jaeg');
    expect(line).toContain('79.720,00 €');
  });

  it('a main job in the band of § 6 Abs. 8 SGB V names the answer about 31.12.2026', () => {
    const jobs: Job[] = [
      { art: 'svpflichtig', seit: '2020-01-01', monat: '6750.00' },
      { art: 'minijob', seit: '2027-01-01', monat: '400.00' },
    ];
    const line =
      jaegHints(
        { ...person(jobs, 'privat'), pkvBestand2026: 'unbekannt' },
        employer('minijob', '2027-03-01', '300.00'),
      ).get('jaeg') ?? '';
    // The band note of the detail, not the fixed message (which names § 6 Abs. 8 SGB V too).
    expect(line).toContain('Hauptbeschäftigung 81.000,00 € im Jahr.');
    expect(line).toContain('Traf das zu, ist die Person versicherungsfrei');
  });

  it('the texts say that a further Minijob gives freedom only from the next year', () => {
    const hints = draft.definition.checkHints ?? [];
    expect(hints.find((h) => h.id === 'jaeg')?.message).toContain(
      'bleibt die Person bis zum Ende des Kalenderjahres versicherungspflichtig',
    );
    expect(hints.find((h) => h.id === 'jaegNichtAngegeben')?.message).toContain(
      'erst ab dem nächsten Kalenderjahr',
    );
  });
});
