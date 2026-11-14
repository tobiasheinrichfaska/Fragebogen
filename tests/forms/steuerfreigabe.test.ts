// Zustimmung zur elektronischen Übermittlung (Tobias 2026-11-12, after the Kanzlei's letter
// template): the Kanzlei only prefills client, date of its letter and the returns it sent; one
// person consents (Einzelveranlagung, firms) or two (Zusammenveranlagung). No tax number, no
// client number, no further questions. Fixed packages (KSt, GewSt, Zerlegung only with GewSt), one
// page per return the Kanzlei names, the AGB sent with the returns, and the PDF first once every
// part is done. Published as 1.0.0 on 2026-11-14 (Tobias). Fictitious data.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import { writeQuestionnairePdf, type PdfFonts } from '../../src/io/pdfWriter';
import { formCatalogue } from '../../src/logic/catalogue';
import { checkHints, fillingHints } from '../../src/logic/hints';
import { contradictions } from '../../src/logic/consistency';
import { fieldsById } from '../../src/logic/form';
import { checkFormDefinition, parseFormDefinition } from '../../src/logic/formDefinition';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import { initialInput } from '../../src/logic/interview';
import type { FormDefinition } from '../../src/logic/model';
import { optionsOf } from '../../src/logic/options';
import { currentPart, latestSealed } from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import {
  acknowledge,
  allPartsDone,
  currentStep,
  answer,
  enterRole,
  leaveRole,
  nextStep,
  proposedBy,
  roleToFillNext,
  seal,
  signingOverview,
  startNewVersion,
  startSession,
  stepsFor,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const raw = readJson(join(FORMS_DIR, 'steuerfreigabe', '1.0.0.json'));
const form: RegisteredForm = registeredFrom(raw);
const AT = { local: '2026-11-12T10:00:00.000+01:00', utc: '2026-11-12T09:00:00.000Z' };
const TODAY = '2026-11-12';

type Values = Record<string, unknown>;

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));
const notices = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'notice' ? [step.infoBlockId] : []));
/** The interview in order: notices by id, questions by field id. */
const flow = (s: Session) =>
  stepsFor(s).flatMap((step) =>
    step.kind === 'notice' ? [step.infoBlockId] : step.kind === 'question' ? [step.fieldId] : [],
  );
const answerAll = (s: Session, values: Values) =>
  Object.entries(values).reduce((next, [id, value]) => must(answer(next, id, value)), s);
const confirmAll = (s: Session) => notices(s).reduce((next, id) => acknowledge(next, id, true), s);
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
  zerlegung: false,
};

const kanzleiDraft = (values: Values) =>
  answerAll(must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei')), values);
const kanzleiSealed = (values: Values) => must(sealed(kanzleiDraft(values), 'a1'));

/** The role confirms every page it is shown and signs. */
function consented(base: Session, role: string, name: string, values: Values = {}) {
  const s = confirmAll(answerAll(must(enterRole(base, role)), values));
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

  it('names the roles „Mandant / Steuerpflichtiger“ and „Ehegatte / Lebenspartner“', () => {
    expect(form.definition.roles.map((r) => r.label)).toEqual([
      'Kanzlei',
      'Mandant / Steuerpflichtiger',
      'Ehegatte / Lebenspartner',
    ]);
  });

  it('offers the returns of the template, disclosure at the Unternehmensregister', () => {
    expect(optionsOf(field('erklaerungen')).map((o) => o.label)).toEqual([
      'Einkommensteuererklärung',
      'Gesonderte und einheitliche Feststellungserklärung',
      'Gewinnermittlung (Anlage EÜR)',
      'Körperschaftsteuererklärung',
      'Gewerbesteuererklärung',
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

// Tobias 2026-11-12: KSt alone, GewSt alone, KSt with GewSt; the Zerlegung only with the GewSt —
// so KSt + GewSt + Zerlegung is a package as well (§ 14a Satz 1 GewStG).
describe('fixed packages of KSt, GewSt and Zerlegung', () => {
  it.each([
    ['KSt alone', ['kst'], {}],
    ['GewSt alone', ['gewst'], { zerlegung: false }],
    ['KSt with GewSt', ['kst', 'gewst'], { zerlegung: false }],
    ['GewSt with Zerlegung', ['gewst'], { zerlegung: true }],
    ['KSt with GewSt and Zerlegung', ['kst', 'gewst'], { zerlegung: true }],
  ])('%s is a complete consent', (_name, erklaerungen, extra) => {
    const kanzlei = kanzleiSealed({
      mandantName: 'Beispiel GmbH',
      vorlageDatum: '28.10.2026',
      erklaerungen,
      ...extra,
    });
    const done = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });

  it('asks the Zerlegung only once the GewSt is chosen', () => {
    expect(questions(kanzleiDraft({ erklaerungen: ['kst'] }))).not.toContain('zerlegung');
    expect(questions(kanzleiDraft({ erklaerungen: ['kst', 'gewst'] }))).toContain('zerlegung');
  });

  it('refuses a Zerlegung without the GewSt', () => {
    expect(answer(kanzleiDraft({ erklaerungen: ['kst'] }), 'zerlegung', true).ok).toBe(false);
  });

  it('drops the Zerlegung when the GewSt is taken away again', () => {
    const changed = answerAll(kanzleiDraft({ erklaerungen: ['gewst'], zerlegung: true }), {
      erklaerungen: ['kst'],
    });
    const done = must(
      sealed(
        answerAll(changed, { mandantName: 'Beispiel GmbH', vorlageDatum: '28.10.2026' }),
        'a1',
      ),
    );
    expect(latestSealed(done.questionnaire, 'kanzlei')?.data).not.toHaveProperty('zerlegung');
  });
});

// Tobias 2026-11-12: first „eigene Seite für jeden einzelnen Punkt … nicht eine Generalerklärung
// zu Beginn“, then „Können wir die Hinweise bündeln?“ — one page per recipient: the Finanzverwaltung
// (any tax return), banks (Digitaler Finanzbericht), the Unternehmensregister (Offenlegung).
describe('one page per recipient of what the Kanzlei names', () => {
  /** The returns a notice's condition names. */
  const named = (id: string): string[] => {
    const block = form.definition.infoBlocks.find((b) => b.id === id);
    const leaves = block?.showIf && 'any' in block.showIf ? block.showIf.any : [block?.showIf];
    return leaves.flatMap((leaf) => (leaf && 'contains' in leaf ? [leaf.contains] : []));
  };

  // Bug 2026-11-12, Tobias: „Bestätigung für Steuererklärung wurde mir als Mandant nicht vorgelegt,
  // erst bei der Zusammenfassung wurde es als fehlend markiert.“ The first step was chosen before
  // the Kanzlei's answers were taken over, so the page they open lay before the start.
  it('starts at the first page and leads through every page with „Weiter“', () => {
    let s = must(enterRole(kanzleiSealed(EINZEL), 'mandant'));
    expect(currentStep(s)?.key).toBe('notice:seiteSteuererklaerungen');
    const visited: string[] = [];
    for (let i = 0; i < 10; i++) {
      const step = currentStep(s);
      if (!step || step.kind === 'summary') break;
      visited.push(step.key);
      s = nextStep(step.kind === 'notice' ? acknowledge(s, step.infoBlockId, true) : s);
    }
    expect(visited).toEqual([
      'notice:seiteSteuererklaerungen',
      'notice:agbDatenschutz',
      'question:einschraenkungenMandant',
      'question:unterzeichnerName',
    ]);
  });

  // Audit 2026-11-14: the same symptom after an interruption — a draft resumed at its first open
  // question, so the pages not confirmed yet before it were passed over.
  it('continues an interrupted part at the first page still to confirm', () => {
    const kanzlei = kanzleiSealed({ ...EINZEL, erklaerungen: ['est', 'difin', 'offenlegung'] });
    let s = must(enterRole(kanzlei, 'mandant'));
    expect(currentStep(s)?.key).toBe('notice:seiteSteuererklaerungen');
    s = nextStep(acknowledge(s, 'seiteSteuererklaerungen', true));
    const interruptedAt = currentStep(s)?.key;
    expect(interruptedAt).toMatch(/^notice:/);
    s = must(enterRole(leaveRole(s), 'mandant'));
    expect(currentStep(s)?.key).toBe(interruptedAt);
  });

  it('bundles every tax return into one page, then AGB and data protection', () => {
    const mandant = must(
      enterRole(
        kanzleiSealed({ ...FIRMA, erklaerungen: ['kst', 'gewst', 'ust'], zerlegung: true }),
        'mandant',
      ),
    );
    expect(flow(mandant)).toEqual([
      'seiteSteuererklaerungen',
      'agbDatenschutz',
      'einschraenkungenMandant',
      'unterzeichnerName',
    ]);
  });

  it('adds the pages for banks and the Unternehmensregister only where named', () => {
    expect(notices(must(enterRole(kanzleiSealed(FIRMA), 'mandant')))).toEqual([
      'seiteSteuererklaerungen',
      'seiteOffenlegung',
      'agbDatenschutz',
    ]);
    const banksOnly = kanzleiSealed({
      mandantName: 'Beispiel GmbH',
      vorlageDatum: '28.10.2026',
      erklaerungen: ['difin'],
    });
    expect(notices(must(enterRole(banksOnly, 'mandant')))).toEqual([
      'seiteDifin',
      'agbDatenschutz',
    ]);
  });

  it('covers every return of the list by exactly one page', () => {
    const pages = ['seiteSteuererklaerungen', 'seiteDifin', 'seiteOffenlegung'];
    const covered = pages.flatMap(named).sort();
    expect(covered).toEqual(
      optionsOf(field('zustimmungErklaerungen'))
        .map((o) => o.id)
        .sort(),
    );
    expect(named('seiteDifin')).toEqual(['difin']);
    expect(named('seiteOffenlegung')).toEqual(['offenlegung']);
  });

  it('refuses to sign while a page is not confirmed', () => {
    const mandant = answerAll(must(enterRole(kanzleiSealed(FIRMA), 'mandant')), {
      unterzeichnerName: 'Erika Musterfrau',
    });
    const allButOne = notices(mandant)
      .filter((id) => id !== 'seiteOffenlegung')
      .reduce((next, id) => acknowledge(next, id, true), mandant);
    const refused = sealed(allButOne, 'b2', 'Erika Musterfrau');
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.detail).toEqual(['seiteOffenlegung']);
  });

  it('puts the page right after the answer when the client names the returns', () => {
    const alone = answerAll(must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'mandant')), {
      zustimmungErklaerungen: ['ust'],
    });
    expect(flow(alone)).toEqual([
      'agbDatenschutz',
      'zustimmungMandant',
      'zustimmungSchreibenVom',
      'zustimmungErklaerungen',
      'seiteSteuererklaerungen',
      'einschraenkungenMandant',
      'unterzeichnerName',
    ]);
  });

  it('drops a confirmed page whose return was taken away, and the file still verifies', () => {
    let s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'mandant'));
    s = confirmAll(
      answerAll(s, {
        zustimmungMandant: 'Erika Musterfrau',
        zustimmungSchreibenVom: '28.10.2026',
        zustimmungErklaerungen: ['ust'],
        unterzeichnerName: 'Erika Musterfrau',
      }),
    );
    s = confirmAll(answerAll(s, { zustimmungErklaerungen: ['difin'] }));
    const done = must(sealed(s, 'b2', 'Erika Musterfrau'));
    const sealedNotices = latestSealed(done.questionnaire, 'mandant')
      ?.seal?.payload.acknowledgements.map((a) => a.infoBlockId)
      .sort();
    expect(sealedNotices).toEqual(['agbDatenschutz', 'seiteDifin']);
    const verdict = verifyQuestionnaire(done.questionnaire, { registry: registryOf([form]) });
    expect(verdict.parts.flatMap((p) => p.findings.map((f) => f.code))).not.toContain(
      'noticeMismatch',
    );
    expect(verdict.level).not.toBe('invalid');
  });

  it('names the condition of each page in the catalogue', () => {
    expect(formCatalogue(form, 'published')).toContain(
      '- Nur wenn bei „Erklärungen“ „Offenlegung oder Hinterlegung beim Unternehmensregister“ angekreuzt ist',
    );
  });
});

// Tobias 2026-11-12: „Können wir ein Freitextfeld für Einschränkungen erfassen?“ — „Beide“: the
// Kanzlei's restrictions belong to what the client consents to; the client's and the spouse's
// reach the Kanzlei as a check hint. All or nothing stays: none of them is required.
describe('restrictions as free text', () => {
  it('shows the Kanzlei restriction to the client before signing', () => {
    const kanzlei = kanzleiSealed({
      ...EINZEL,
      einschraenkungenKanzlei: 'Ohne die noch fehlende Spendenbescheinigung.',
    });
    const mandant = answerAll(confirmAll(must(enterRole(kanzlei, 'mandant'))), {
      unterzeichnerName: 'Erika Musterfrau',
    });
    const rows = signingOverview(mandant)
      ?.others.find((o) => o.role === 'kanzlei')
      ?.sections.flatMap((section) => section.rows);
    expect(rows?.find((r) => r.fieldId === 'einschraenkungenKanzlei')?.value).toBe(
      'Ohne die noch fehlende Spendenbescheinigung.',
    );
    // The client's seal confirms the Kanzlei part it saw, restriction included.
    const done = must(sealed(mandant, 'b2', 'Erika Musterfrau'));
    expect(
      latestSealed(done.questionnaire, 'mandant')?.seal?.payload.receivedParts.map((p) => p.role),
    ).toContain('kanzlei');
  });

  it('tells the Kanzlei about a restriction of the client or the spouse', () => {
    const hintIds = (s: Session) => checkHints(s.questionnaire, form.definition).map((h) => h.id);
    const first = consented(kanzleiSealed(ZUSAMMEN), 'mandant', 'Erika Musterfrau', {
      einschraenkungenMandant: 'Nur, wenn die Erstattung auf das neue Konto geht.',
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(hintIds(first)).toContain('einschraenkungenMandant');
    const both = consented(first, 'ehegatte', 'Max Mustermann', {
      einschraenkungenEhegatte: 'Bitte die Kirchensteuer noch einmal prüfen.',
    });
    expect(hintIds(both)).toEqual(
      expect.arrayContaining(['einschraenkungenMandant', 'einschraenkungenEhegatte']),
    );
  });

  it('needs no restriction and gives no hint without one', () => {
    const done = consented(kanzleiSealed(EINZEL), 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    expect(checkHints(done.questionnaire, form.definition).map((h) => h.id)).not.toContain(
      'einschraenkungenMandant',
    );
  });
});

describe('who consents', () => {
  it('is one person at an Einzelveranlagung, asked only who signs', () => {
    const kanzlei = kanzleiSealed(EINZEL);
    expect(roleToFillNext(kanzlei)).toBe('mandant');
    expect(questions(must(enterRole(kanzlei, 'mandant')))).toEqual([
      'einschraenkungenMandant',
      'unterzeichnerName',
    ]);
    const done = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
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
    expect(questions(kanzleiDraft(FIRMA))).not.toContain('veranlagung');
    const kanzlei = kanzleiSealed(FIRMA);
    const mandant = must(enterRole(kanzlei, 'mandant'));
    const data = currentPart(mandant.questionnaire, 'mandant')?.data ?? {};
    // A firm: the proposal is its name, the person who signs for it replaces it.
    expect(initialInput(form.definition, field('unterzeichnerName'), data, TODAY)).toEqual({
      text: 'Beispiel GmbH',
      suggested: true,
    });
    const done = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });

  it('is two at a Zusammenveranlagung; the spouse gets the name the Kanzlei gave', () => {
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    const first = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(transmissionBlockers(first.questionnaire, form).map((b) => b.code)).toEqual([
      'conditionalRoleMissing',
    ]);
    const spouse = must(enterRole(first, 'ehegatte'));
    expect(currentPart(spouse.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max Mustermann');
    expect(proposedBy(spouse, 'ehegatteName')).toBe('Kanzlei');
    expect(notices(spouse)).toEqual(['ehegatteSeiteEst', 'ehegatteAgbDatenschutz']);
    const both = consented(first, 'ehegatte', 'Max Mustermann');
    expect(transmissionBlockers(both.questionnaire, form)).toEqual([]);
    expect(completenessGaps(both.questionnaire, form)).toEqual([]);
  });

  // Audit 2026-11-14: a correction in the Kanzlei's new version never reached the spouse, and the
  // check hint said the spouse had changed the name. Loop 2: renewing the value overwrote a name the
  // spouse typed back on purpose — even its signer name after "Unterschrift zurücknehmen". So the
  // value stays and a hint names the new proposal, to the spouse before signing and to the Kanzlei.
  it('names a proposal the Kanzlei corrects in a new version, without changing the answer', () => {
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    let s = must(enterRole(kanzlei, 'ehegatte'));
    expect(currentPart(s.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max Mustermann');
    s = answerAll(must(startNewVersion(leaveRole(s), 'kanzlei')), {
      ehegatteNameKanzlei: 'Maximilian Mustermann',
    });
    s = must(enterRole(must(sealed(s, 'd4')), 'ehegatte'));
    expect(currentPart(s.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max Mustermann');
    const shown = fillingHints(s.questionnaire, form.definition, 'ehegatte');
    expect(shown.find((h) => h.id === 'fromRole:ehegatteName')?.message).toContain(
      'jetzt „Maximilian Mustermann“ vor',
    );
    const kanzleiSees = checkHints(s.questionnaire, form.definition);
    expect(kanzleiSees.find((h) => h.id === 'fromRole:ehegatteName')?.message).not.toContain(
      'geändert',
    );
  });

  it("keeps the name a spouse signed with in the spouse's new version (loop 2)", () => {
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    const client = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    const signed = consented(client, 'ehegatte', 'Max Mustermann');
    let s = answerAll(must(startNewVersion(signed, 'kanzlei')), {
      ehegatteNameKanzlei: 'Maximilian Mustermann',
    });
    // The Kanzlei's new version confirms the spouse's part, so the spouse changes it in a new one.
    s = must(startNewVersion(must(sealed(s, 'd4')), 'ehegatte'));
    expect(currentPart(s.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max Mustermann');
  });

  it('keeps a name the spouse changed when the Kanzlei corrects its proposal', () => {
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    let s = must(answer(must(enterRole(kanzlei, 'ehegatte')), 'ehegatteName', 'Max M. Mustermann'));
    s = answerAll(must(startNewVersion(leaveRole(s), 'kanzlei')), {
      ehegatteNameKanzlei: 'Maximilian Mustermann',
    });
    s = must(enterRole(must(sealed(s, 'd4')), 'ehegatte'));
    expect(currentPart(s.questionnaire, 'ehegatte')?.data.ehegatteName).toBe('Max M. Mustermann');
  });
});

// Tobias 2026-11-12: „wenn alle Rollen erfüllt sind, sollte nicht Weitergeben prominent sein,
// sondern PDF erstellen“.
describe('every needed part done', () => {
  it('is false before and while a person is missing, true once all are done', () => {
    expect(allPartsDone(startSession(form, QUESTIONNAIRE_ID))).toBe(false);
    const kanzlei = kanzleiSealed(ZUSAMMEN);
    expect(allPartsDone(kanzlei)).toBe(false);
    const first = consented(kanzlei, 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(allPartsDone(first)).toBe(false);
    expect(allPartsDone(consented(first, 'ehegatte', 'Max Mustermann'))).toBe(true);
  });

  it('is true after the one person at an Einzelveranlagung', () => {
    const done = consented(kanzleiSealed(EINZEL), 'mandant', 'Erika Musterfrau', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    expect(allPartsDone(done)).toBe(true);
  });
});

describe('what the Kanzlei names stays fixed', () => {
  it('refuses another list of returns, date, name, Zerlegung or Veranlagung in the consent', () => {
    const mandant = must(
      enterRole(
        kanzleiSealed({ ...EINZEL, erklaerungen: ['est', 'gewst'], zerlegung: false }),
        'mandant',
      ),
    );
    for (const [id, value] of [
      ['zustimmungErklaerungen', ['ust']],
      ['zustimmungSchreibenVom', '01.11.2026'],
      ['zustimmungMandant', 'Max Mustermann'],
      ['zustimmungZerlegung', true],
      ['zustimmungVeranlagung', 'zusammen'],
    ] as const) {
      expect(answer(mandant, id, value).ok).toBe(false);
    }
  });

  it('asks the client without the Kanzlei part and shows a later difference as a contradiction', () => {
    const alone = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'mandant'));
    expect(questions(alone)).toEqual([
      'zustimmungMandant',
      'zustimmungSchreibenVom',
      'zustimmungErklaerungen',
      'einschraenkungenMandant',
      'unterzeichnerName',
    ]);
    const signed = consented(alone, 'mandant', 'Erika Musterfrau', {
      zustimmungMandant: 'Erika Musterfrau',
      zustimmungSchreibenVom: '28.10.2026',
      zustimmungErklaerungen: ['ust'],
      unterzeichnerName: 'Erika Musterfrau',
    });
    const withKanzlei = must(sealed(answerAll(must(enterRole(signed, 'kanzlei')), EINZEL), 'd4'));
    expect(
      contradictions(withKanzlei.questionnaire, form.definition).map((c) => c.message),
    ).toEqual(['Die Erklärungen weichen zwischen der Vorlage der Kanzlei und der Zustimmung ab.']);
  });
});

// Tobias 2026-11-12: „Es wird den AGB zugestimmt, die mit der Erklärung übermittelt wurden.“ The
// app attaches no AGB; each signer agrees to those the Kanzlei sent with the returns.
describe('the AGB sent with the returns', () => {
  const confirmed = (q: Session, role: string) =>
    latestSealed(q.questionnaire, role)?.seal?.payload.confirmationText;

  it('are part of what each signer confirms, and the Kanzlei states it sent them', () => {
    const first = consented(kanzleiSealed(ZUSAMMEN), 'mandant', 'Erika', {
      unterzeichnerName: 'Erika Musterfrau',
    });
    const both = consented(first, 'ehegatte', 'Max Mustermann');
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

describe('the PDF', () => {
  const font = (name: string) =>
    new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
  const FONTS: PdfFonts = {
    sans: font('NotoSans-Regular.subset.ttf'),
    bold: font('NotoSans-SemiBold.subset.ttf'),
    mono: font('NotoSansMono-Regular.subset.ttf'),
  };

  it('prints the pages of the named returns only', async () => {
    const done = consented(
      kanzleiSealed({
        mandantName: 'Beispiel GmbH',
        vorlageDatum: '28.10.2026',
        erklaerungen: ['kst'],
      }),
      'mandant',
      'Erika',
      {
        unterzeichnerName: 'Erika Musterfrau',
      },
    );
    const written = await writeQuestionnairePdf(
      {
        questionnaire: done.questionnaire,
        form,
        origin: 'embedded',
        config: {},
        created: AT,
      },
      FONTS,
    );
    const text = (await readPdfText(pdfjs as unknown as PdfJsLike, written.bytes)).lines.join('\n');
    expect(text).toContain('Bundeszentralamt für Steuern');
    expect(text).toContain('Allgemeine Geschäftsbedingungen und Datenschutz');
    expect(text).not.toContain('Digitaler Finanzbericht');
    expect(text).not.toContain('Gemeinsame Einkommensteuererklärung');
  }, 60_000);
});

describe('definition rules for conditional notices', () => {
  const mutated = (change: (d: FormDefinition) => void) => {
    const copy = structuredClone(raw) as FormDefinition;
    change(copy);
    const parsed = parseFormDefinition(copy);
    if (!parsed.ok) return parsed.issues.map((i) => `${i.path} ${i.message}`);
    return checkFormDefinition(parsed.definition).map((p) => `${p.path} ${p.message}`);
  };
  const page = (d: FormDefinition) => {
    const block = d.infoBlocks.find((b) => b.id === 'seiteDifin');
    if (!block) throw new Error('no page');
    return block;
  };

  it('reads only fields of its own role and says why', () => {
    expect(
      mutated((d) => {
        page(d).showIf = { field: 'erklaerungen', contains: 'difin' };
      }),
    ).toContain('$.infoBlocks[1].showIf.field showIf may only reference fields of the same role');
    expect(
      mutated((d) => {
        page(d).showIf = { field: 'gibtEsNicht', contains: 'difin' };
      }),
    ).toContain('$.infoBlocks[1].showIf.field unknown field "gibtEsNicht"');
    expect(
      mutated((d) => {
        delete page(d).because;
      }),
    ).toContain('$.infoBlocks[1].because a conditional notice says why');
    expect(
      mutated((d) => {
        delete page(d).showIf;
      }),
    ).toContain('$.infoBlocks[1].because only conditional notices explain their condition');
  });
});
