// The SV cases of manual_tests/07 run from their start points (Tobias 2026-11-03: the tester only
// enters the answers the case is about): the start point plus exactly the tester's steps must give
// what the manual test expects. A start point that drifts from its test fails here first.
import { join } from 'node:path';
import { derive, proposalLine } from '../../src/logic/derivations';
import { checkHints, hintLine } from '../../src/logic/hints';
import { answer, seal, stepsFor, type Session, type SessionResult } from '../../src/logic/session';
import {
  buildStartPoint,
  isFormStart,
  parseStartPoint,
  type StartPoint,
} from '../../src/logic/startPoints';
import { shownValue, svForm } from '../support/svCase';
import { readJson } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const START_DIR = join(__dirname, '..', '..', 'manual_tests', 'startpunkte');
const NOW = { local: '2026-11-03T10:00:00.000+01:00', utc: '2026-11-03T09:00:00.000Z' };
const ENV = {
  questionnaireId: QUESTIONNAIRE_ID,
  nonce: () => '0123456789abcdef0123456789abcdef',
  now: NOW,
  systemNote: note(NOW.local, NOW.utc, ['keyboard']),
};

function point(id: string, change?: (p: StartPoint) => void): StartPoint {
  const parsed = parseStartPoint(readJson(join(START_DIR, `${id}.json`)));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  if (!isFormStart(parsed.point)) throw new Error(`${id} is no form start point`);
  change?.(parsed.point);
  return parsed.point;
}

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}

/** The tester's answers in the open role, then its seal, then what the Kanzlei is proposed. */
function run(start: StartPoint, answers: Readonly<Record<string, unknown>>) {
  const built = buildStartPoint(start, svForm, ENV);
  if (!built.ok) throw new Error(built.problems.join('\n'));
  let s = Object.entries(answers).reduce(
    (at, [id, raw]) => must(answer(at, id, raw)),
    built.session,
  );
  const asked = stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));
  const person = s.role === 'person';
  s = must(
    seal(s, {
      nonce: ENV.nonce(),
      systemNote: ENV.systemNote,
      now: NOW,
      ...(person ? { signature: { method: 'typed' as const, name: 'Erika Musterfrau' } } : {}),
    }),
  );
  const results = new Map(derive(s.questionnaire, svForm.definition).map((d) => [d.id, d]));
  const pgr = results.get('personengruppe');
  const hints = checkHints(s.questionnaire, svForm.definition);
  return {
    /** The questions of the open role, in interview order, once the answers are in. */
    asked,
    /** Each proposal as the Kanzlei reads it on its screen and on the check sheet. */
    lines: Object.fromEntries([...results].map(([id, d]) => [id, proposalLine(d)])),
    /** The check hints as the Kanzlei reads them. */
    hintLines: hints.map(hintLine),
    hints: hints.map((h) => h.id),
    pgr: shownValue(pgr),
    /** Reason and facts as the Kanzlei reads them. */
    pgrWhy: pgr ? [pgr.reason, ...pgr.detail].join(' ') : '',
    bgr: shownValue(results.get('beitragsgruppen')),
    ue: shownValue(results.get('uebergangsbereich')),
    ts: shownValue(results.get('taetigkeitsschluessel')),
  };
}

const partOf = (p: StartPoint, role: string) => {
  const part = p.parts.find((candidate) => candidate.role === role);
  if (!part) throw new Error(role);
  return part as { answers: Record<string, unknown> };
};

/** The complete questionnaire with the employer's part open again at its summary. */
const employerOpen = (change?: (p: StartPoint) => void) =>
  point('personalfragebogen-vollstaendig', (p) => {
    delete (p.parts.find((part) => part.role === 'arbeitgeber') as { seal?: unknown }).seal;
    p.open = { role: 'arbeitgeber', at: 'summary' };
    change?.(p);
  });

const azubi = (betrag: string) => ({
  agEntgeltArt: 'ausbildungsverguetung',
  agAusbildungsverguetung: [
    { rowId: 'r1', avJahr: '1', avBetrag: betrag, avGueltigAb: '01.09.2026' },
  ],
  agBeschaeftigungsart: 'ausbildung',
  agAusbildungsberuf: 'Verkäuferin',
  agAusbildungEnde: '31.08.2029',
  agAusserbetrieblich: false,
});

const EARLIER = {
  vorbeschJahr: true,
  vorbeschaeftigungen: [
    {
      rowId: 'r1',
      vbArbeitgeber: 'Muster AG',
      vbVon: '01.01.2026',
      vbBis: '31.03.2026',
      vbArt: 'mehr',
      vbEntgeltMonat: '3.000,00',
    },
  ],
};

const AUSHILFE_BIS_JAHRESENDE = {
  agBeschaeftigungsart: 'kurzfristig',
  agKurzfristigBis: '31.12.2026',
  agKurzfristigArbeitstage: '30',
  agRahmenvereinbarung: false,
  agBesteuerung: 'elstam',
};

// Each case builds and seals whole questionnaires; slow in parallel full runs.
describe('SV cases from their start points (manual_tests/07)', { timeout: 30_000 }, () => {
  it('MT-96: Aushilfe over three months and 70 working days', () => {
    const start = point('personalfragebogen-aushilfe-art-offen');
    const kurz = {
      agBeschaeftigungsart: 'kurzfristig',
      agKurzfristigBis: '31.08.2026',
      agKurzfristigArbeitstage: '78',
      agRahmenvereinbarung: false,
      agBesteuerung: 'elstam',
    };
    expect(run(start, kurz)).toMatchObject({ pgr: '110', bgr: '0000' });
    const longer = { ...kurz, agKurzfristigBis: '01.09.2026', agKurzfristigArbeitstage: '79' };
    // The reason names the limit that failed (Tobias 2026-11-08: show the detail of zeitgrenze()).
    expect(run(start, longer)).toMatchObject({
      pgr: '101 (p)',
      bgr: '1111',
      pgrWhy: expect.stringContaining(
        'Von vornherein länger als drei Monate (bis 31.08.2026) und mehr als 70 Arbeitstage',
      ) as unknown,
    });
    // Over a year under a framework agreement: regular, though within 70 working days.
    const regular = {
      ...kurz,
      agKurzfristigBis: '30.06.2027',
      agKurzfristigArbeitstage: '50',
      agRahmenvereinbarung: true,
    };
    expect(run(start, regular)).toMatchObject({
      pgr: '101 (p)',
      pgrWhy: expect.stringContaining('Rahmenvereinbarung ohne Befristung') as unknown,
    });
    expect(run(start, { ...longer, agMonatsentgelt: '500,00' })).toMatchObject({
      pgr: '109 (p)',
      bgr: '6100',
    });
  });

  it('MT-97: Werkstudent hours in the lecture period', () => {
    const start = point('personalfragebogen-werkstudent-stunden-offen');
    const at20 = { agNurSemesterferien: false, agVorlesungszeitStunden: '20' };
    expect(run(start, at20)).toMatchObject({ pgr: '106', bgr: '0100' });
    expect(
      run(start, {
        agNurSemesterferien: false,
        agVorlesungszeitStunden: '25',
        agRandzeiten: false,
      }),
    ).toMatchObject({ pgr: '101', bgr: '1111' });
    expect(
      run(start, { ...at20, agVorlesungszeitStunden: '12', agMonatsentgelt: '600,00' }),
    ).toMatchObject({ pgr: '109', bgr: '6100' });
  });

  it('MT-98: long study and Versorgungswerk', () => {
    const start = point('personalfragebogen-werkstudent-fachsemester-offen');
    expect(run(start, { fachsemester: '4' })).toMatchObject({ pgr: '106', bgr: '0100' });
    expect(run(start, { fachsemester: '27' })).toMatchObject({ pgr: '101 (p)', bgr: '1111' });
    expect(
      run(start, {
        fachsemester: '4',
        versorgungswerk: 'befreit',
        versorgungswerkName: 'Versorgungswerk der Musterkammer',
      }),
    ).toMatchObject({ pgr: '190', bgr: '0000', ue: '0' });
  });

  it('MT-102: student with two Minijobs above the limit together', () => {
    const start = point('personalfragebogen-zwei-minijobs-arbeitszeit-offen');
    const hours = (h: string) => ({
      agArbeitszeitmodell: 'wechselnd',
      agWochenstunden: h,
      agArbeitstageProWoche: '2',
    });
    expect(run(start, hours('5'))).toMatchObject({ pgr: '106 (p)', bgr: '0100 (p)', ue: '1 (p)' });
    expect(run(start, hours('15'))).toMatchObject({ pgr: '101 (p)', bgr: '1111' });
    const partTime = point('personalfragebogen-zwei-minijobs-arbeitszeit-offen', (p) => {
      partOf(p, 'person').answers.studienArt = 'teilzeit';
    });
    expect(run(partTime, hours('5'))).toMatchObject({ pgr: '101 (p)' });
  });

  it('MT-103: housewife — an earlier full-time job counts only before leaving working life', () => {
    const start = point('personalfragebogen-hausfrau-vorbeschaeftigung-offen');
    expect(run(start, EARLIER)).toMatchObject({ pgr: '101 (p)', bgr: '3111 (p)' });
    expect(run(start, { ...EARLIER, ausgeschiedenSeit: '01.04.2026' })).toMatchObject({
      pgr: '110',
      bgr: '0000',
    });
  });

  it('MT-61: Azubi with 550 € is no Minijob', () => {
    const start = point('personalfragebogen-azubi-entgelt-offen');
    expect(run(start, azubi('550,00')).pgr).toBe('102');
    expect(run(start, azubi('300,00')).pgr).toBe('121');
  });

  it('MT-66: Beitragsgruppen, Übergangsbereich and Tätigkeitsschlüssel', () => {
    const start = point('personalfragebogen-teilzeit-berufskennziffer-offen');
    expect(run(start, { agKldb: '71402' })).toMatchObject({
      pgr: '101',
      bgr: '1111',
      ue: '1',
      ts: '714024412',
    });
    expect(run(start, {}).ts).toBe('?????4412 (p)');
  });

  it('MT-45: Personengruppe 109 for a Minijob with 520 €', () => {
    const start = point('personalfragebogen-minijob-entgelt-offen');
    expect(
      run(start, {
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '520,00',
        agBeschaeftigungsart: 'minijob',
        agBesteuerung: 'elstam',
      }),
    ).toMatchObject({ pgr: '109' });
  });

  it('MT-88: two Minijobs together, and a Berufsmäßigkeit only above the limit', () => {
    const two = point('personalfragebogen-zweiter-minijob-entgelt-offen');
    expect(
      run(two, {
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '450,00',
        agBeschaeftigungsart: 'minijob',
        agBesteuerung: 'elstam',
      }),
    ).toMatchObject({ pgr: '101 (p)', bgr: '1111', ue: '1 (p)' });
    const jobless = point('personalfragebogen-arbeitslos-entgelt-offen');
    const aushilfe = (pay: string) => ({
      agMonatsentgelt: pay,
      agBeschaeftigungsart: 'kurzfristig',
      agKurzfristigBis: '31.12.2026',
      agKurzfristigArbeitstage: '30',
      agRahmenvereinbarung: false,
      agBesteuerung: 'elstam',
    });
    expect(run(jobless, aushilfe('1.500,00'))).toMatchObject({ pgr: '101 (p)' });
    expect(run(jobless, aushilfe('500,00'))).toMatchObject({ pgr: '110', bgr: '0000' });
  });

  it('MT-44: check hints for a job seeker near the Regelaltersgrenze as an Aushilfe', () => {
    const start = point('personalfragebogen-rag-arbeitslos-art-offen');
    const { hints } = run(start, {
      agBeschaeftigungsart: 'kurzfristig',
      agKurzfristigBis: '31.12.2026',
      agKurzfristigArbeitstage: '30',
      agRahmenvereinbarung: false,
      agBesteuerung: 'elstam',
    });
    expect(hints).toEqual(
      expect.arrayContaining(['kurzfristigArbeitslos', 'regelaltersgrenzeNichtAngegeben']),
    );
  });
});

// Moved here from the end-to-end tests (Tobias 2026-11-14: „so machen wir weiter“ — the e2e suite
// took 20 minutes, most of it SV cases played to the Kanzlei through a PDF). The same start points,
// answers and expectations, down to the line the Kanzlei reads; what stays end to end is one case
// each that the proposals and hints reach the screen, the check sheet and the personnel-file PDF
// (MT-45, MT-62 „Ja“, MT-66 with the Berufskennziffer).
describe(
  'what the Kanzlei reads (former e2e cases of manual_tests/05 and 07)',
  {
    timeout: 30_000,
  },
  () => {
    it('MT-61: the Azubi’s reason names the Geringverdienergrenze, and nothing speaks of a Minijob', () => {
      const start = point('personalfragebogen-azubi-entgelt-offen');
      for (const [betrag, gruppe] of [
        ['550,00', '102'],
        ['300,00', '121'],
      ] as const) {
        const { lines, hintLines } = run(start, azubi(betrag));
        expect(lines.personengruppe).toMatch(new RegExp(`^Personengruppe: ${gruppe} – \\S`));
        expect(lines.personengruppe).not.toMatch(/ Bitte prüfen\.$/);
        expect(
          [...Object.values(lines), ...hintLines].filter((t) => t.includes('Minijob')),
        ).toEqual([]);
      }
      expect(run(start, azubi('300,00')).lines.personengruppe).toContain(
        'Geringverdienergrenze: 325,00 €',
      );
    });

    it('MT-62: a Minijob with Weihnachtsgeld — only a payment it is owed counts towards the limit', () => {
      const start = point('personalfragebogen-minijob-entgelt-offen');
      const minijob = (anspruch: boolean) => ({
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '600,00',
        agEinmalzahlungen: [
          {
            rowId: 'r1',
            ezArt: 'weihnachtsgeld',
            ezBetrag: '300,00',
            ezMonat: '11',
            ezAnspruch: anspruch,
          },
        ],
        agBeschaeftigungsart: 'minijob',
        agBesteuerung: 'elstam',
      });
      const over =
        /^Als Minijob vorgesehen, aber der Verdienst übersteigt die Geringfügigkeitsgrenze im Jahr/;
      const owed = run(start, minijob(true));
      expect(owed.hintLines.filter((t) => over.test(t))).toHaveLength(1);
      expect(owed.hintLines.join('\n')).toContain(
        '12 × 600,00 € + Einmalzahlungen mit Anspruch 300,00 € = 7.500,00 € im Jahr; Geringfügigkeitsgrenze 2026: 12 × 603,00 € = 7.236,00 €.',
      );
      expect(owed.pgr).toBe('101 (p)');
      const free = run(start, minijob(false));
      expect(free.hintLines.filter((t) => over.test(t))).toEqual([]);
      expect(free.pgr).toBe('109');
    });

    it('MT-64: an exemption from health insurance without its notice asks the Kanzlei to request it', () => {
      const start = employerOpen((p) => {
        const person = partOf(p, 'person').answers;
        // Asked only with a statutory insurance.
        delete person.krankenkasse;
        delete person.kinder;
        Object.assign(person, {
          krankenversicherung: 'privat',
          versicherungsunternehmen: 'Muster Krankenversicherung AG',
          pkvBescheinigung: 'liegtBei',
          pkvAusland: false,
          pkvBestand2002: 'nein',
          gkvLetzte5Jahre: 'nein',
          kvBefreiung: 'ja',
          kvBefreiungGrund: 'jaeg',
        });
      });
      expect(run(start, {}).hintLines).toContainEqual(
        expect.stringContaining(
          'Befreiung von der Krankenversicherungspflicht angegeben: Bescheid der Krankenkasse anfordern.',
        ),
      );
    });

    it('MT-67: Firmenzahler only above the Jahresarbeitsentgeltgrenze; „nicht über der Grenze“ against the pay is a hint', () => {
      const jaeg = svForm.definition.sections
        .flatMap((section) => section.fields)
        .find((field) => field.id === 'agUeberJaeg');
      // „Nein“ is preselected.
      expect(jaeg?.initial).toBe(false);
      const start = employerOpen();
      const above = run(start, { agMonatsentgelt: '7.000,00' });
      expect(above.asked).toContain('agUeberJaeg');
      expect(above.asked).not.toContain('agFirmenzahler');
      expect(above.hintLines.join('\n')).toContain(
        'Laut den Verdienstangaben – mit weiteren Beschäftigungen und Einmalzahlungen mit Anspruch – liegt das regelmäßige Jahresarbeitsentgelt über der maßgeblichen Jahresarbeitsentgeltgrenze, der Arbeitgeber hat „nicht über der Grenze“ angegeben',
      );
      expect(above.bgr).toBe('9111 (p)');
      const selbst = run(start, {
        agMonatsentgelt: '7.000,00',
        agUeberJaeg: true,
        agFirmenzahler: 'selbstzahler',
      });
      expect(selbst.asked).toContain('agFirmenzahler');
      expect(selbst.bgr).toBe('0111');
    });

    it('MT-96: either limit is enough — over three months on at most 70 working days stays kurzfristig', () => {
      expect(
        run(point('personalfragebogen-aushilfe-art-offen'), {
          ...AUSHILFE_BIS_JAHRESENDE,
          agKurzfristigBis: '30.09.2026',
          agKurzfristigArbeitstage: '70',
        }),
      ).toMatchObject({ pgr: '110', bgr: '0000' });
    });

    it('MT-97: the evening question only above 20 hours; in the semester breaks alone no hours', () => {
      const start = point('personalfragebogen-werkstudent-stunden-offen');
      expect(
        run(start, { agNurSemesterferien: false, agVorlesungszeitStunden: '20' }).asked,
      ).not.toContain('agRandzeiten');
      const longer = run(start, {
        agNurSemesterferien: false,
        agVorlesungszeitStunden: '25',
        agRandzeiten: false,
      });
      expect(longer.asked).toContain('agRandzeiten');
      expect(longer.lines.personengruppe).toContain('mehr als 20 Wochenstunden');
      const breaks = run(start, { agNurSemesterferien: true });
      expect(breaks.asked).not.toContain('agVorlesungszeitStunden');
      expect(breaks.pgr).toBe('106');
    });

    it('MT-98: a long study is only presumed not to be the main occupation', () => {
      const { lines } = run(point('personalfragebogen-werkstudent-fachsemester-offen'), {
        fachsemester: '27',
      });
      expect(lines.personengruppe).toContain('Mehr als 25 Fachsemester');
      expect(lines.personengruppe).toContain('Vermutung kann widerlegt werden; dann gilt 106.');
      expect(lines.personengruppe).toMatch(/ Bitte prüfen\.$/);
    });

    it('MT-102: the other jobs’ hours are added up; without weekly hours the app does not guess', () => {
      const start = point('personalfragebogen-zwei-minijobs-arbeitszeit-offen');
      expect(
        run(start, {
          agArbeitszeitmodell: 'wechselnd',
          agWochenstunden: '5',
          agArbeitstageProWoche: '2',
        }).lines.personengruppe,
      ).toContain('5 + 7 Stunden anderer Beschäftigungen = 12 Wochenstunden');
      expect(
        run(start, {
          agArbeitszeitmodell: 'schicht',
          agZyklusWochen: '4',
          agArbeitstageZyklus: '8',
          agStundenZyklus: '20',
        }).pgr,
      ).toBe('101 (p)');
    });

    it('MT-103: leaving working life is asked only after an earlier job, and named in the reason', () => {
      const start = point('personalfragebogen-hausfrau-vorbeschaeftigung-offen');
      expect(run(start, { vorbeschJahr: false }).asked).not.toContain('ausgeschiedenSeit');
      const left = run(start, { ...EARLIER, ausgeschiedenSeit: '01.04.2026' });
      expect(left.asked).toContain('ausgeschiedenSeit');
      expect(left.lines.personengruppe).toContain(
        'Frühere Beschäftigungen vor dem Ausscheiden aus dem Berufsleben am 01.04.2026 zählen nicht für die Berufsmäßigkeit (Geringfügigkeits-Richtlinien B 2.3.3.3).',
      );
    });

    it('MT-44: each hint names where it comes from; the Regelaltersgrenze with its day', () => {
      const { hintLines } = run(point('personalfragebogen-rag-arbeitslos-art-offen'), {
        ...AUSHILFE_BIS_JAHRESENDE,
      });
      const jobless = hintLines.filter((t) =>
        t.includes('Arbeitsuchend gemeldet und als kurzfristige Aushilfe vorgesehen'),
      );
      expect(jobless).toHaveLength(1);
      expect(jobless[0]).toMatch(/\(.+\)$/);
      expect(
        hintLines.find((t) =>
          t.includes(
            'Laut Geburtsdatum ist die Regelaltersgrenze bei Beschäftigungsbeginn erreicht',
          ),
        ),
      ).toContain('Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.');
    });

    it('MT-45: another Minijob below the limit together makes 109 one to check', () => {
      const { lines } = run(point('personalfragebogen-zweiter-minijob-entgelt-offen'), {
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '200,00',
        agBeschaeftigungsart: 'minijob',
        agBesteuerung: 'elstam',
      });
      expect(lines.personengruppe).toMatch(/^Personengruppe: 109 – .* Bitte prüfen\.$/);
    });

    it('MT-88: the proposals draw the right conclusion and say why', () => {
      const two = run(point('personalfragebogen-zweiter-minijob-entgelt-offen'), {
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '450,00',
        agBeschaeftigungsart: 'minijob',
        agBesteuerung: 'elstam',
      });
      // 450 € and the other 300 € lie above 603 € together: no Minijob (not 109).
      expect(two.lines.personengruppe).toMatch(
        /^Personengruppe: 101 – .*Minijob.* Bitte prüfen\.$/,
      );
      expect(two.lines.beitragsgruppen).toMatch(/: 1111 – /);
      expect(two.lines.uebergangsbereich).toMatch(/: 1 – .* Bitte prüfen\.$/);
      const jobless = point('personalfragebogen-arbeitslos-entgelt-offen');
      const aushilfe = (pay: string) =>
        run(jobless, { agMonatsentgelt: pay, ...AUSHILFE_BIS_JAHRESENDE }).lines;
      // A job seeker is employed berufsmäßig: above the limit the Aushilfe is not kurzfristig.
      expect(aushilfe('1.500,00').personengruppe).toMatch(
        /^Personengruppe: 101 – .*berufsmäßig.* Bitte prüfen\.$/i,
      );
      const below = aushilfe('500,00');
      expect(below.personengruppe).toMatch(/^Personengruppe: 110 – /);
      expect(below.beitragsgruppen).toMatch(/: 0000 – /);
    });
  },
);
