// The SV cases of manual_tests/07 run from their start points (Tobias 2026-11-03: the tester only
// enters the answers the case is about): the start point plus exactly the tester's steps must give
// what the manual test expects. A start point that drifts from its test fails here first.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { checkHints } from '../../src/logic/hints';
import { answer, seal, type Session, type SessionResult } from '../../src/logic/session';
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
  return {
    hints: checkHints(s.questionnaire, svForm.definition).map((h) => h.id),
    pgr: shownValue(results.get('personengruppe')),
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
    expect(run(start, longer)).toMatchObject({ pgr: '101 (p)', bgr: '1111' });
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
    const earlier = {
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
    expect(run(start, earlier)).toMatchObject({ pgr: '101 (p)', bgr: '3111 (p)' });
    expect(run(start, { ...earlier, ausgeschiedenSeit: '01.04.2026' })).toMatchObject({
      pgr: '110',
      bgr: '0000',
    });
  });

  it('MT-61: Azubi with 550 € is no Minijob', () => {
    const start = point('personalfragebogen-azubi-entgelt-offen');
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
