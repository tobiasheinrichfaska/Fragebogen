// Tobias 2026-10-30: in a Minijob the employer decides first whether the wage tax is flat-rate;
// the person's tax questions depend on it. The person's `steuerart` is taken from the employer's
// sealed part (fromRole) and then not asked; without that part the person answers it.
import { join } from 'node:path';
import { checkHints, fillingHints } from '../../src/logic/hints';
import {
  createQuestionnaire,
  fixedByOtherRoles,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import {
  answer,
  enterRole,
  seal,
  sessionFromFile,
  stepsFor,
  summaryOf,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { registryOf } from '../../src/logic/formRegistry';
import type { Questionnaire } from '../../src/logic/model';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID, STROKES } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
const at = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };

const EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
  agArbeitsortBundesland: 'BW',
  agBeschaeftigungsart: 'minijob',
  agTaetigkeit: 'Aushilfe im Verkauf',
  agBefristet: false,
  agArbeitszeitform: 'teilzeit',
  agArbeitszeitmodell: 'monatsstunden',
  agMonatsstunden: '40',
  agArbeitstageProWoche: '2',
  agUrlaubstage: '8',
  agUrlaubBezug: 'individuell',
  agEntgeltArt: 'stundenlohn',
  agStundenlohn: '14,50',
  agErwartetMonat: '520,00',
  agSteuernummer: '21/815/08150',
  agBav: 'keine',
  agSchwerbehinderung: 'nein',
  agBeziehung: 'keine',
};

function employerSealed(besteuerung: string, base?: Questionnaire): Questionnaire {
  let q = ok(startPart(base ?? createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
  for (const [id, raw] of Object.entries({ ...EMPLOYER, agBesteuerung: besteuerung })) {
    q = ok(setValue(q, form, 'arbeitgeber', id, raw));
  }
  if (besteuerung.startsWith('pauschal')) {
    q = ok(setValue(q, form, 'arbeitgeber', 'agPauschalsteuerAbgewaelzt', false));
  }
  return ok(
    sealPart(q, form, 'arbeitgeber', {
      nonce: 'd4'.repeat(16),
      systemNote: note(at.local, at.utc),
      acknowledged: [],
    }),
  );
}

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

function sessionWith(questionnaire: Questionnaire): Session {
  return sessionFromFile(
    { questionnaire, form, origin: 'published' },
    { local: at.local, utc: at.utc, source: 'file' },
  );
}

const questions = (session: Session) =>
  stepsFor(session).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));

const minijobber = (session: Session) =>
  must(answer(must(answer(session, 'status', 'student')), 'artLautVereinbarung', 'minijob'));

describe('employer first: the person is not asked what the employer decided', () => {
  it('takes the flat-rate tax over and leaves out the questions on the tax class', () => {
    const session = minijobber(must(enterRole(sessionWith(employerSealed('pauschal2')), 'person')));
    expect(session.questionnaire.parts.person?.[0]?.data.steuerart).toBe('pauschal2');
    const asked = questions(session);
    expect(asked).toContain('steuerId');
    expect(asked).not.toContain('steuerart');
    expect(asked).not.toContain('dienstverhaeltnis');
    expect(asked).not.toContain('freibetragAbrufen');
  });

  it('asks the tax class when the employer chose the ELStAM', () => {
    const session = minijobber(must(enterRole(sessionWith(employerSealed('elstam')), 'person')));
    expect(questions(session)).toContain('dienstverhaeltnis');
    expect(questions(session)).not.toContain('steuerart');
  });

  it('refuses another answer while the employer part decides it, but takes the same one', () => {
    const started = ok(startPart(employerSealed('pauschal2'), form, 'person'));
    const q = ok(setValue(started, form, 'person', 'artLautVereinbarung', 'minijob'));
    expect(setValue(q, form, 'person', 'steuerart', 'elstam')).toEqual({
      ok: false,
      code: 'fixedByOtherRole',
      detail: ['steuerart', 'arbeitgeber'],
    });
    expect(setValue(q, form, 'person', 'steuerart', 'pauschal2').ok).toBe(true);
    expect([...fixedByOtherRoles(q, form.definition, 'person')]).toEqual([
      ['steuerart', { value: 'pauschal2', from: 'arbeitgeber' }],
      ['sozialkasseBetrieb', { value: 'nein', from: 'arbeitgeber' }],
    ]);
  });

  it('replaces an earlier own answer when the person continues and says so', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    for (const [id, raw] of Object.entries({
      status: 'student',
      artLautVereinbarung: 'minijob',
      steuerart: 'elstam',
    })) {
      q = ok(setValue(q, form, 'person', id, raw));
    }
    const result = enterRole(sessionWith(employerSealed('pauschal2', q)), 'person');
    expect(result.ok && result.warnings.join(' ')).toContain('„Art der Lohnsteuer“ ist jetzt');
    const session = must(result);
    expect(session.questionnaire.parts.person?.[0]?.data.steuerart).toBe('pauschal2');
    expect(summaryOf(session)?.inactive.map((entry) => entry.fieldId)).not.toContain('steuerart');
  });
});

describe('person first: the person answers it', () => {
  const personFirst = () =>
    minijobber(must(enterRole(sessionWith(createQuestionnaire(QUESTIONNAIRE_ID, form)), 'person')));

  it('asks the kind of wage tax, and the tax class only without a flat rate', () => {
    expect(questions(personFirst())).toContain('steuerart');
    const flat = must(answer(personFirst(), 'steuerart', 'pauschal2'));
    expect(questions(flat)).not.toContain('dienstverhaeltnis');
    const unknown = must(answer(personFirst(), 'steuerart', 'unbekannt'));
    expect(questions(unknown)).toContain('dienstverhaeltnis');
  });

  it('does not ask a person in a permanent job at all', () => {
    const session = must(
      answer(
        must(enterRole(sessionWith(createQuestionnaire(QUESTIONNAIRE_ID, form)), 'person')),
        'artLautVereinbarung',
        'festeStelle',
      ),
    );
    expect(questions(session)).not.toContain('steuerart');
    expect(questions(session)).toContain('dienstverhaeltnis');
  });
});

describe('a later change at the employer becomes a check hint', () => {
  function personSigned(steuerart: string): Questionnaire {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    for (const [id, raw] of Object.entries({
      status: 'student',
      artLautVereinbarung: 'minijob',
      steuerart,
    })) {
      q = ok(setValue(q, form, 'person', id, raw));
    }
    return q;
  }

  it('names the contradiction', () => {
    const q = employerSealed('elstam', personSigned('pauschal2'));
    const hint = checkHints(q, form.definition).find((h) => h.id === 'fromRole:steuerart');
    expect(hint?.message).toContain('Arbeitgeber gibt „nach den Lohnsteuermerkmalen (ELStAM)“ an');
    expect(hint?.message).toContain('„pauschal 2 % (Minijob)“');
  });

  it('stays silent for "Weiß ich nicht." and for the same answer', () => {
    for (const own of ['unbekannt', 'pauschal2']) {
      const q = employerSealed('pauschal2', personSigned(own));
      expect(checkHints(q, form.definition).map((h) => h.id)).not.toContain('fromRole:steuerart');
    }
  });
});

describe('the taken-over answer is the person’s own data', () => {
  it('seals with the person part and verifies without the employer part', () => {
    let session = minijobber(must(enterRole(sessionWith(employerSealed('pauschal2')), 'person')));
    const values = {
      familienname: 'Musterfrau',
      vorname: 'Erika',
      geburtsnameWieFamilienname: true,
      geburtsdatum: '17.05.2003',
      geburtsort: 'Musterstadt',
      geborenInDeutschland: true,
      geschlecht: 'weiblich',
      deutscheStaatsangehoerigkeit: true,
      anschriftAusland: false,
      strassenname: 'Musterweg',
      hausnummer: '1',
      postleitzahl: '12345',
      wohnort: 'Musterstadt',
      iban: 'DE89370400440532013000',
      kontoinhaberSelbst: true,
      studienArt: 'vollzeit',
      hochschule: 'Beispiel-Hochschule',
      urlaubssemester: false,
      fachsemester: '4',
      ueber20hJahr: false,
      weitereBeschaeftigung: false,
      krankenversicherung: 'gesetzlich',
      krankenkasse: 'Beispiel-Krankenkasse',
      rvBefreiungWunsch: 'nein',
      steuerId: '86095742719',
      kinder: false,
      schulabschluss: 'abitur',
      berufsabschluss: 'ohne',
    };
    for (const [id, raw] of Object.entries(values)) session = must(answer(session, id, raw));
    session = { ...session, acknowledged: { person: ['datenschutz'] } };
    expect(summaryOf(session)?.missingRequired).toEqual([]);
    const signed = must(
      seal(session, {
        nonce: 'c3'.repeat(16),
        systemNote: note(at.local, at.utc),
        signature: { method: 'drawn', strokes: STROKES },
        now: at,
      }),
    );
    const person = signed.questionnaire.parts.person?.[0];
    expect(person?.data.steuerart).toBe('pauschal2');
    const alone: Questionnaire = {
      ...signed.questionnaire,
      parts: { person: signed.questionnaire.parts.person ?? [] },
    };
    const verdict = verifyQuestionnaire(alone, { registry: registryOf([form]) });
    expect(verdict.parts.find((p) => p.role === 'person')?.level).toBe('consistent');
  });
});

// Audit 2026-11-14: the employer's new version no longer decides the kind of wage tax (now a job
// subject to insurance), while the person's part still holds the old decision — before, nobody
// was told. Loop 2 of the audit: deleting such a copy also deleted an answer the person gave
// herself, on every entry; so the answer stays and a check hint says what happened, to the person
// before she signs and to the Kanzlei.
describe('a decision the other role no longer makes in a new version', () => {
  function withdrawn(): Questionnaire {
    const q = ok(startPart(employerSealed('pauschal2'), form, 'arbeitgeber'));
    let v2 = q;
    for (const [id, raw] of Object.entries({
      agBeschaeftigungsart: 'svpflichtig',
      agEntgeltArt: 'monatsentgelt',
      agMonatsentgelt: '3.000,00',
    })) {
      v2 = ok(setValue(v2, form, 'arbeitgeber', id, raw));
    }
    return ok(
      sealPart(v2, form, 'arbeitgeber', {
        nonce: 'e5'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    );
  }

  it('stays as it is and is named to the person and to the Kanzlei', () => {
    const first = minijobber(must(enterRole(sessionWith(employerSealed('pauschal2')), 'person')));
    const employerV2 = ok(startPart(first.questionnaire, form, 'arbeitgeber'));
    let q = employerV2;
    for (const [id, raw] of Object.entries({
      agBeschaeftigungsart: 'svpflichtig',
      agEntgeltArt: 'monatsentgelt',
      agMonatsentgelt: '3.000,00',
    })) {
      q = ok(setValue(q, form, 'arbeitgeber', id, raw));
    }
    q = ok(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'e5'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    );
    const person = must(enterRole(sessionWith(q), 'person'));
    expect(person.questionnaire.parts.person?.at(-1)?.data.steuerart).toBe('pauschal2');
    const shown = fillingHints(person.questionnaire, form.definition, 'person');
    expect(shown.map((h) => h.id)).toContain('fromRoleWithdrawn:steuerart');
    expect(shown.find((h) => h.id === 'fromRoleWithdrawn:steuerart')?.fields).toEqual([
      'steuerart',
    ]);
    expect(checkHints(person.questionnaire, form.definition).map((h) => h.id)).toContain(
      'fromRoleWithdrawn:steuerart',
    );
  });

  it('never deletes an answer the person gives herself, however often she comes back', () => {
    let person = minijobber(must(enterRole(sessionWith(withdrawn()), 'person')));
    person = must(answer(person, 'steuerart', 'pauschal2'));
    for (let i = 0; i < 3; i++) person = must(enterRole(person, 'person'));
    expect(person.questionnaire.parts.person?.at(-1)?.data.steuerart).toBe('pauschal2');
  });
});
