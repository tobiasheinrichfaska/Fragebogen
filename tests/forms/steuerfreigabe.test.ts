// Zustimmung zur elektronischen Übermittlung (draft, Tobias 2026-11-12, after the Kanzlei's letter
// template): the Kanzlei only prefills client, date of its letter and the returns it sent; one
// person consents (Einzelveranlagung, firms) or two (Zusammenveranlagung). No tax number, no
// client number, no further questions. Fictitious data.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { fieldsById } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { initialInput } from '../../src/logic/interview';
import { optionsOf } from '../../src/logic/options';
import { currentPart, latestSealed } from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  proposedBy,
  roleToFillNext,
  seal,
  startSession,
  stepsFor,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(
  readJson(join(DRAFTS_DIR, 'steuerfreigabe', '0.1.0.json')),
);
const AT = { local: '2026-11-12T10:00:00.000+01:00', utc: '2026-11-12T09:00:00.000Z' };
const TODAY = '2026-11-12';

type Values = Record<string, unknown>;

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));
const answerAll = (s: Session, values: Values) =>
  Object.entries(values).reduce((next, [id, raw]) => must(answer(next, id, raw)), s);
const field = (id: string) => {
  const found = fieldsById(form.definition).get(id);
  if (!found) throw new Error(`no field ${id}`);
  return found;
};

function sealed(s: Session, nonce: string, name?: string): SessionResult {
  return seal(s, {
    nonce: nonce.repeat(16),
    systemNote: note(AT.local, AT.utc),
    ...(name === undefined ? {} : { signature: { method: 'typed' as const, name } }),
    now: AT,
  });
}

const EINZEL: Values = {
  mandantName: 'Erika Musterfrau',
  vorlageDatum: '28.10.2026',
  erklaerungen: ['est'],
  veranlagung: 'einzel',
};
const ZUSAMMEN: Values = {
  ...EINZEL,
  veranlagung: 'zusammen',
  ehegatteNameKanzlei: 'Max Mustermann',
};
const FIRMA: Values = {
  mandantName: 'Beispiel GmbH',
  vorlageDatum: '28.10.2026',
  erklaerungen: ['kst', 'gewst', 'ust', 'ebilanz', 'offenlegung'],
};

function kanzleiSealed(values: Values): Session {
  const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
  return must(sealed(answerAll(entered, values), 'a1'));
}

function consented(base: Session, role: string, notice: string, name: string, values: Values = {}) {
  const s = acknowledge(answerAll(must(enterRole(base, role)), values), notice, true);
  return must(sealed(s, role === 'ehegatte' ? 'c3' : 'b2', name));
}

describe('the form after the Kanzlei template', () => {
  it('is a valid definition without tax or client number', () => {
    expect(checkFormDefinition(form.definition)).toEqual([]);
    const ids = [...fieldsById(form.definition).keys()];
    expect(ids.filter((id) => /steuernummer|mandantennummer/i.test(id))).toEqual([]);
  });

  it('lets the Kanzlei only prefill, without a signature of its own', () => {
    const kanzlei = form.definition.roles.find((r) => r.id === 'kanzlei');
    expect(kanzlei?.prefills).toBe(true);
    expect(kanzlei?.signature).toBe('none');
  });

  it('offers the returns of the template, disclosure at the Unternehmensregister', () => {
    expect(optionsOf(field('erklaerungen')).map((o) => o.label)).toEqual([
      'Einkommensteuererklärung',
      'Gesonderte und einheitliche Feststellungserklärung',
      'Gewinnermittlung (Anlage EÜR)',
      'Körperschaftsteuererklärung',
      'Gewerbesteuererklärung',
      'Gewerbesteuererklärung mit Zerlegung',
      'Umsatzsteuererklärung',
      'Zusammenfassende Meldung',
      'E-Bilanz',
      'Digitaler Finanzbericht (an Banken)',
      'Offenlegung oder Hinterlegung beim Unternehmensregister',
    ]);
    // § 325 Abs. 1 HGB: the documents go to the body that keeps the Unternehmensregister.
    expect(JSON.stringify(form.definition)).not.toMatch(/Bundesanzeiger/);
    expect(optionsOf(field('zustimmungErklaerungen'))).toEqual(optionsOf(field('erklaerungen')));
  });
});

describe('who consents', () => {
  it('is one person at an Einzelveranlagung, asked only who signs', () => {
    const kanzlei = kanzleiSealed(EINZEL);
    expect(roleToFillNext(kanzlei)).toBe('mandant');
    expect(questions(must(enterRole(kanzlei, 'mandant')))).toEqual(['unterzeichnerName']);
    const done = consented(kanzlei, 'mandant', 'zustimmungHinweis', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(transmissionBlockers(done.questionnaire, form)).toEqual([]);
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    const signatureOf = (role: string) =>
      latestSealed(done.questionnaire, role)?.seal?.payload.signature;
    expect(signatureOf('kanzlei')).toBeUndefined();
    expect(signatureOf('mandant')).toEqual({ method: 'typed', typedName: 'Erika Musterfrau' });
  });

  it('is one person for a firm, where no Veranlagung is asked', () => {
    const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    expect(questions(answerAll(entered, FIRMA))).not.toContain('veranlagung');
    const kanzlei = kanzleiSealed(FIRMA);
    const mandant = must(enterRole(kanzlei, 'mandant'));
    const data = currentPart(mandant.questionnaire, 'mandant')?.data ?? {};
    // A firm: the proposal is its name, the person who signs for it replaces it.
    expect(initialInput(form.definition, field('unterzeichnerName'), data, TODAY)).toEqual({
      text: 'Beispiel GmbH',
      suggested: true,
    });
    const done = consented(kanzlei, 'mandant', 'zustimmungHinweis', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });

  it('is two at a Zusammenveranlagung; the spouse gets the name the Kanzlei gave', () => {
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    const first = consented(kanzlei, 'mandant', 'zustimmungHinweis', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(transmissionBlockers(first.questionnaire, form).map((b) => b.code)).toEqual([
      'conditionalRoleMissing',
    ]);
    const spouse = must(enterRole(first, 'ehegatte'));
    expect(currentPart(spouse.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max Mustermann');
    expect(proposedBy(spouse, 'ehegatteName')).toBe('Kanzlei');
    const both = consented(first, 'ehegatte', 'zustimmungHinweisEhegatte', 'Max Mustermann');
    expect(transmissionBlockers(both.questionnaire, form)).toEqual([]);
    expect(completenessGaps(both.questionnaire, form)).toEqual([]);
  });
});

// Tobias 2026-11-12: „Es wird den AGB zugestimmt, die mit der Erklärung übermittelt wurden.“ The
// app attaches no AGB; each signer agrees to those the Kanzlei sent with the returns.
describe('the AGB sent with the returns', () => {
  const confirmed = (q: Session, role: string) =>
    latestSealed(q.questionnaire, role)?.seal?.payload.confirmationText;

  it('are part of what each signer confirms, and the Kanzlei states it sent them', () => {
    const first = consented(kanzleiSealed(ZUSAMMEN), 'mandant', 'zustimmungHinweis', 'Erika', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    const both = consented(first, 'ehegatte', 'zustimmungHinweisEhegatte', 'Max Mustermann');
    expect(confirmed(both, 'mandant')).toContain(
      'Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit den Erklärungen übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden.',
    );
    expect(confirmed(both, 'ehegatte')).toContain(
      'Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit der Erklärung übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden.',
    );
    expect(confirmed(both, 'kanzlei')).toContain(
      'unsere Allgemeinen Geschäftsbedingungen haben wir mit den Erklärungen übersandt',
    );
  });
});

describe('what the Kanzlei names stays fixed', () => {
  it('refuses another list of returns, date or name in the consent', () => {
    const mandant = must(enterRole(kanzleiSealed(EINZEL), 'mandant'));
    for (const [id, raw] of [
      ['zustimmungErklaerungen', ['ust']],
      ['zustimmungSchreibenVom', '01.11.2026'],
      ['zustimmungMandant', 'Max Mustermann'],
      ['zustimmungVeranlagung', 'zusammen'],
    ] as const) {
      expect(answer(mandant, id, raw).ok).toBe(false);
    }
  });

  it('asks the client without the Kanzlei part and shows a later difference as a contradiction', () => {
    const alone = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'mandant'));
    expect(questions(alone)).toEqual([
      'zustimmungMandant',
      'zustimmungSchreibenVom',
      'zustimmungErklaerungen',
      'unterzeichnerName',
    ]);
    const signed = consented(alone, 'mandant', 'zustimmungHinweis', 'Erika Musterfrau', {
      zustimmungMandant: 'Erika Musterfrau',
      zustimmungSchreibenVom: '28.10.2026',
      zustimmungErklaerungen: ['ust'],
      unterzeichnerName: 'Erika Musterfrau',
    });
    const withKanzlei = must(
      sealed(answerAll(must(enterRole(signed, 'kanzlei')), { ...EINZEL }), 'd4'),
    );
    expect(
      contradictions(withKanzlei.questionnaire, form.definition).map((c) => c.message),
    ).toEqual(['Die Erklärungen weichen zwischen der Vorlage der Kanzlei und der Zustimmung ab.']);
  });
});
