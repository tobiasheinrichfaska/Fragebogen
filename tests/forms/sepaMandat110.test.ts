// SEPA-Mandat 1.1.0 (Tobias 2026-11-05, production 2026-11-06): the Kanzlei only prefills — it is
// never "offen", a link with its part opens straight in the account holder's part, and the holder
// may change what the Kanzlei entered about the account (never the creditor, contract, kind of
// payment, client number or Mandatsreferenz). The Mandatsreferenz is proposed from the
// Mandantennummer, the signer is named (two holders), place and date of signing are proposed.
// Fictitious data.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { decodePackage } from '../../src/logic/dataPackage';
import { checkFormDefinition, parseFormDefinition } from '../../src/logic/formDefinition';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import { fieldsById, signerName } from '../../src/logic/form';
import { checkHints } from '../../src/logic/hints';
import { initialInput } from '../../src/logic/interview';
import type { MasterData } from '../../src/logic/masterData';
import type { FormDefinition } from '../../src/logic/model';
import { currentPart, latestSealed } from '../../src/logic/questionnaire';
import { completenessGaps } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  fillMasterData,
  proposedBy,
  roleToFillNext,
  seal,
  sessionFromFile,
  signingOverview,
  startSession,
  stepsFor,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import {
  parseTransferFragment,
  transferFragment,
  transferPackageText,
} from '../../src/logic/transferLink';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(readJson(join(FORMS_DIR, 'sepa-mandat', '1.1.0.json')));
const published = registeredFrom(readJson(join(FORMS_DIR, 'sepa-mandat', '1.0.0.json')));
const AT = { local: '2026-11-05T10:00:00.000+01:00', utc: '2026-11-05T09:00:00.000Z' };
const TODAY = '2026-11-05';
const KANZLEI_LABEL = 'Kanzlei (Zahlungsempfänger)';

type Values = Record<string, unknown>;

const LINK: MasterData = {
  glaeubigerName: 'Musterkanzlei Beispiel',
  glaeubigerStrasse: 'Beispielweg 1',
  glaeubigerPlzOrt: '12345 Musterstadt',
  glaeubigerLand: 'Deutschland',
  glaeubigerId: 'DE98ZZZ09999999999',
};
const ACCOUNT: Values = {
  kontoVorab: ['nameAnschrift', 'bankverbindung'],
  khAnschriftAusland: false,
  khStrasse: 'Musterstraße 5',
  khPostleitzahl: '12345',
  khOrt: 'Musterstadt',
  khKreditinstitut: 'Beispielbank',
  khIban: 'DE89370400440532013000',
};
const SIGNING: Values = {
  weitereKontoinhaber: false,
  unterzeichnerName: 'Erika Musterfrau',
  unterschriftOrt: 'Musterstadt',
  unterschriftDatum: '05.11.2026',
};

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));
const value = (s: Session, role: string, id: string) =>
  currentPart(s.questionnaire, role)?.data[id];
const answerAll = (s: Session, values: Values) =>
  Object.entries(values).reduce((next, [id, raw]) => must(answer(next, id, raw)), s);
const field = (id: string) => {
  const found = fieldsById(form.definition).get(id);
  if (!found) throw new Error(`no field ${id}`);
  return found;
};
/** What the input box of a question shows first in the role's draft. */
const box = (s: Session, role: string, id: string) =>
  initialInput(form.definition, field(id), currentPart(s.questionnaire, role)?.data ?? {}, TODAY);

function sealed(s: Session, nonce: string, name?: string): SessionResult {
  return seal(s, {
    nonce: nonce.repeat(16),
    systemNote: note(AT.local, AT.utc),
    ...(name === undefined ? {} : { signature: { method: 'typed' as const, name } }),
    now: AT,
  });
}

function kanzleiSealed(extra: Values = {}): Session {
  const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
  const filled = fillMasterData(entered, LINK);
  if (!filled.ok) throw new Error('no draft');
  return must(
    sealed(answerAll(filled.session, { mandantName: 'Erika Musterfrau', ...extra }), 'a1'),
  );
}

function holderSigned(base: Session, values: Values, name = 'Erika Musterfrau'): SessionResult {
  let s = answerAll(must(enterRole(base, 'kontoinhaber')), values);
  for (const id of ['mandatstext', 'datenschutz']) s = acknowledge(s, id, true);
  return sealed(s, 'b2', name);
}

/** The Kanzlei part passed on as a link and opened on the holder's device. */
function throughLink(kanzlei: Session): Session {
  const made = transferFragment(kanzlei.questionnaire);
  if (!made.ok) throw new Error(made.issue);
  const parsed = parseTransferFragment(made.fragment);
  if (!parsed?.ok) throw new Error('not parsed');
  const opened = transferPackageText(parsed.questionnaireText, (hash) =>
    hash === form.definitionHash ? form.definition : undefined,
  );
  if (!opened.ok) throw new Error(opened.issue);
  const decoded = decodePackage(JSON.parse(opened.text), registryOf([form]));
  if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
  return sessionFromFile(decoded, { local: AT.local, utc: AT.utc, source: 'file' });
}

describe('the form', () => {
  it('is a newer version of the production form', () => {
    expect(form.definition.version).toBe('1.1.0');
    expect(published.definition.version).toBe('1.0.0');
    expect(checkFormDefinition(form.definition)).toEqual([]);
  });

  it('keeps creditor, contract and kind of payment fixed and makes the account data changeable', () => {
    const fromKanzlei = [...fieldsById(form.definition).values()].filter(
      (f) => f.fromRole?.role === 'kanzlei',
    );
    expect(fromKanzlei.filter((f) => f.fromRole?.changeable !== true).map((f) => f.id)).toEqual([
      'zahlungsempfaenger',
      'zahlungsempfaengerGlaeubigerId',
      'vertragMit',
      'mandatZahlungsart',
      'mitinhaberZahlungsempfaenger',
      'mitinhaberGlaeubigerId',
    ]);
    expect(fromKanzlei.filter((f) => f.fromRole?.changeable === true).map((f) => f.id)).toEqual([
      'mandatKontoinhaberArt',
      'kontoinhaberName',
      'anschriftAusland',
      'anschriftStaat',
      'kontoinhaberStrasse',
      'postleitzahl',
      'postleitzahlAusland',
      'kontoinhaberOrt',
      'kreditinstitut',
      'iban',
      'bic',
    ]);
  });
});

describe('the Kanzlei only prefills', () => {
  it('is never a missing part', () => {
    const holderFirst = must(
      holderSigned(startSession(form, QUESTIONNAIRE_ID), {
        zahlungsempfaenger: 'Musterkanzlei Beispiel',
        zahlungsempfaengerGlaeubigerId: 'DE98ZZZ09999999999',
        vertragMit: 'Erika Musterfrau',
        mandatKontoinhaberArt: 'identisch',
        mandatZahlungsart: 'wiederkehrend',
        anschriftAusland: false,
        kontoinhaberStrasse: 'Musterstraße 5',
        postleitzahl: '12345',
        kontoinhaberOrt: 'Musterstadt',
        iban: 'DE89370400440532013000',
        ...SIGNING,
      }),
    );
    expect(completenessGaps(holderFirst.questionnaire, form)).toEqual([]);
    // The same in 1.0.0 still counts the Kanzlei as missing.
    expect(published.definition.roles.find((r) => r.id === 'kanzlei')?.prefills).toBeUndefined();
  });

  it('sends a link with its part straight to the account holder', () => {
    const kanzlei = kanzleiSealed(ACCOUNT);
    expect(roleToFillNext(kanzlei)).toBe('kontoinhaber');
    expect(roleToFillNext(startSession(form, QUESTIONNAIRE_ID))).toBeUndefined();
    const signed = must(holderSigned(kanzlei, SIGNING));
    expect(roleToFillNext(signed)).toBeUndefined();
    // Forms without a prefilling role keep asking who fills in.
    const old = must(enterRole(startSession(published, QUESTIONNAIRE_ID), 'kanzlei'));
    expect(roleToFillNext(old)).toBeUndefined();
  });
});

describe('the account holder may change what the Kanzlei entered about the account', () => {
  it('asks the prefilled account data with the Kanzlei values, marked as prefilled', () => {
    const holder = must(enterRole(throughLink(kanzleiSealed(ACCOUNT)), 'kontoinhaber'));
    expect(questions(holder)).toEqual([
      'mandatKontoinhaberArt',
      'weitereKontoinhaber',
      'anschriftAusland',
      'kontoinhaberStrasse',
      'postleitzahl',
      'kontoinhaberOrt',
      'kreditinstitut',
      'iban',
      'unterzeichnerName',
      'unterschriftOrt',
      'unterschriftDatum',
    ]);
    expect(value(holder, 'kontoinhaber', 'iban')).toBe('DE89370400440532013000');
    expect(value(holder, 'kontoinhaber', 'kontoinhaberStrasse')).toBe('Musterstraße 5');
    expect(proposedBy(holder, 'iban')).toBe(KANZLEI_LABEL);
    expect(proposedBy(holder, 'zahlungsempfaenger')).toBeUndefined();
  });

  it('takes a changed IBAN and tells the Kanzlei, without a contradiction', () => {
    const kanzlei = kanzleiSealed(ACCOUNT);
    const holder = must(
      answer(must(enterRole(kanzlei, 'kontoinhaber')), 'iban', 'DE02120300000000202051'),
    );
    expect(proposedBy(holder, 'iban')).toBeUndefined();
    const signed = must(holderSigned(holder, SIGNING));
    expect(latestSealed(signed.questionnaire, 'kontoinhaber')?.data.iban).toBe(
      'DE02120300000000202051',
    );
    expect(contradictions(signed.questionnaire, form.definition)).toEqual([]);
    const hint = checkHints(signed.questionnaire, form.definition).find(
      (h) => h.id === 'fromRole:iban',
    );
    expect(hint?.message).toBe(
      '„IBAN“ geändert: Kanzlei (Zahlungsempfänger) hatte „DE89 3704 0044 0532 0130 00“ vorbelegt, im Teil „Kontoinhaberin oder Kontoinhaber“ steht jetzt „DE02 1203 0000 0000 2020 51“.',
    );
  });

  it('may switch to a deviating holder and is then asked the name', () => {
    const holder = must(
      answer(
        must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber')),
        'mandatKontoinhaberArt',
        'abweichend',
      ),
    );
    expect(questions(holder)).toContain('kontoinhaberName');
    expect(questions(holder)).toContain('kontoinhaberEmail');
  });

  it('never changes the creditor, the contract or the kind of payment', () => {
    const holder = must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber'));
    for (const [id, raw] of [
      ['zahlungsempfaenger', 'Andere GmbH'],
      ['vertragMit', 'Max Mustermann'],
      ['mandatZahlungsart', 'einmalig'],
    ] as const) {
      expect(answer(holder, id, raw).ok).toBe(false);
    }
    expect(questions(holder)).not.toContain('zahlungsempfaenger');
  });

  it('never overwrites an own answer, not even one left empty', () => {
    const kanzlei = kanzleiSealed(ACCOUNT);
    let holder = must(answer(must(enterRole(kanzlei, 'kontoinhaber')), 'kreditinstitut', null));
    holder = must(answer(holder, 'kontoinhaberOrt', 'Andersort'));
    const again = must(enterRole(holder, 'kontoinhaber'));
    expect(value(again, 'kontoinhaber', 'kreditinstitut')).toBeNull();
    expect(value(again, 'kontoinhaber', 'kontoinhaberOrt')).toBe('Andersort');
  });
});

describe('proposed answers', () => {
  it('proposes the Mandatsreferenz from the Mandantennummer', () => {
    const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    expect(box(entered, 'kanzlei', 'mandatsreferenz')).toEqual({ text: '', suggested: false });
    const numbered = must(answer(entered, 'mandantennummer', '10001'));
    expect(box(numbered, 'kanzlei', 'mandatsreferenz')).toEqual({
      text: '100010000001',
      suggested: true,
    });
    expect(answer(numbered, 'mandatsreferenz', '100010000001').ok).toBe(true);
  });

  it('proposes the signer: the payer, or the deviating holder', () => {
    const identical = must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber'));
    expect(box(identical, 'kontoinhaber', 'unterzeichnerName').text).toBe('Erika Musterfrau');
    const deviating = answerAll(identical, {
      mandatKontoinhaberArt: 'abweichend',
      kontoinhaberName: 'Max Mustermann',
    });
    expect(box(deviating, 'kontoinhaber', 'unterzeichnerName').text).toBe('Max Mustermann');
    // Back to identical: the hidden name proposes nothing any more.
    const back = must(answer(deviating, 'mandatKontoinhaberArt', 'identisch'));
    expect(box(back, 'kontoinhaber', 'unterzeichnerName').text).toBe('Erika Musterfrau');
  });

  it('proposes the place from the address and today as the date', () => {
    const holder = must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber'));
    expect(box(holder, 'kontoinhaber', 'unterschriftOrt')).toEqual({
      text: 'Musterstadt',
      suggested: true,
    });
    expect(box(holder, 'kontoinhaber', 'unterschriftDatum')).toEqual({
      text: '05.11.2026',
      suggested: true,
    });
  });
});

describe('who signs (Tobias 2026-11-05)', () => {
  it('needs the signer named and puts that name at the signature', () => {
    const missing = holderSigned(kanzleiSealed(ACCOUNT), { ...SIGNING, unterzeichnerName: null });
    expect(missing.ok).toBe(false);
    const signed = must(holderSigned(kanzleiSealed(ACCOUNT), SIGNING));
    const part = latestSealed(signed.questionnaire, 'kontoinhaber');
    const role = form.definition.roles.find((r) => r.id === 'kontoinhaber');
    if (!part?.seal || !role) throw new Error('not sealed');
    expect(signerName(role, part.data, part.seal.payload.signature)).toBe('Erika Musterfrau');
  });

  it('warns when the typed signature names someone else', () => {
    const result = holderSigned(kanzleiSealed(ACCOUNT), SIGNING, 'Max Mustermann');
    expect(result.ok && result.warnings).toEqual([
      'Der getippte Name weicht vom angegebenen Namen ab. Bitte prüfen.',
    ]);
  });

  it('asks a further holder and how they may dispose; one signature when either may', () => {
    const holder = must(
      answer(must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber')), 'weitereKontoinhaber', true),
    );
    expect(questions(holder)).toEqual(
      expect.arrayContaining(['weitererKontoinhaberName', 'verfuegung']),
    );
    const alone = must(
      holderSigned(kanzleiSealed(ACCOUNT), {
        ...SIGNING,
        weitereKontoinhaber: true,
        weitererKontoinhaberName: 'Max Mustermann',
        verfuegung: 'allein',
      }),
    );
    expect(completenessGaps(alone.questionnaire, form)).toEqual([]);
  });

  it('needs the second signature when both may only dispose together, with the name proposed', () => {
    const first = must(
      holderSigned(kanzleiSealed(ACCOUNT), {
        ...SIGNING,
        weitereKontoinhaber: true,
        weitererKontoinhaberName: 'Max Mustermann',
        verfuegung: 'gemeinsam',
      }),
    );
    expect(completenessGaps(first.questionnaire, form).map((gap) => gap.code)).toContain(
      'conditionalRoleMissing',
    );
    let second = must(enterRole(first, 'mitinhaber'));
    expect(value(second, 'mitinhaber', 'mitinhaberName')).toBe('Max Mustermann');
    expect(proposedBy(second, 'mitinhaberName')).toBe('Kontoinhaberin oder Kontoinhaber');
    expect(questions(second)).toEqual(['mitinhaberName']);
    for (const id of ['mandatstextMitinhaber', 'datenschutzMitinhaber']) {
      second = acknowledge(second, id, true);
    }
    const done = must(sealed(second, 'd4', 'Max Mustermann'));
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });
});

describe('what the signature covers stands above the confirmation (MT-122, Tobias 2026-11-06)', () => {
  it('shows the own answers as sealed and the Kanzlei part, so "mit den Angaben oben" is true', () => {
    let holder = answerAll(must(enterRole(kanzleiSealed(ACCOUNT), 'kontoinhaber')), SIGNING);
    for (const id of ['mandatstext', 'datenschutz']) holder = acknowledge(holder, id, true);
    const overview = signingOverview(holder);
    if (!overview) throw new Error('no overview');
    const own = new Map(overview.own.flatMap((s) => s.rows).map((r) => [r.fieldId, r.value]));
    expect(own.get('zahlungsempfaenger')).toBe('Musterkanzlei Beispiel');
    expect(own.get('iban')).toBe('DE89 3704 0044 0532 0130 00');
    expect(own.get('unterzeichnerName')).toBe('Erika Musterfrau');
    // Hidden for an identical holder, so not sealed — and not shown.
    expect(own.has('kontoinhaberName')).toBe(false);
    expect(overview.own.map((s) => s.title)).toEqual([
      'Mandat',
      'Kontoinhaberin oder Kontoinhaber',
      'Anschrift',
      'Bankverbindung',
      'Unterschrift',
    ]);
    expect(overview.others.map((o) => o.label)).toEqual(['Kanzlei (Zahlungsempfänger)']);
    const kanzlei = overview.others[0]?.sections.flatMap((s) => s.rows) ?? [];
    expect(kanzlei.find((r) => r.fieldId === 'glaeubigerId')?.value).toBe('DE98ZZZ09999999999');
    for (const role of form.definition.roles.filter((r) => r.signature === 'required')) {
      expect(role.confirmationText).toMatch(/mit den Angaben oben\.$/);
    }
  });

  it('has nothing to show without a draft', () => {
    expect(signingOverview(startSession(form, QUESTIONNAIRE_ID))).toBeUndefined();
  });
});

describe('definition rules for prefilling roles and changeable answers', () => {
  const problems = (change: (d: FormDefinition) => void) => {
    const d = structuredClone(form.definition);
    change(d);
    return checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`);
  };
  const role = (d: FormDefinition, id: string) => {
    const found = d.roles.find((r) => r.id === id);
    if (!found) throw new Error(`no role ${id}`);
    return found;
  };

  it('refuses a prefilling role that signs, is conditional or leaves nobody to fill in', () => {
    expect(
      problems((d) => {
        role(d, 'kanzlei').signature = 'required';
      }),
    ).toContain('$.roles[0].prefills a prefilling role does not sign');
    expect(
      problems((d) => {
        role(d, 'mitinhaber').prefills = true;
      }),
    ).toEqual(
      expect.arrayContaining([
        '$.roles[2].prefills a prefilling role does not sign',
        '$.roles[2].prefills a prefilling role is never conditional',
      ]),
    );
    const alone = problems((d) => {
      d.roles = [role(d, 'kanzlei')];
    });
    expect(alone).toContain('$.roles[0].prefills another role must fill in what it prefills');
  });

  it('reads "changeable" as yes/no and nothing else in fromRole', () => {
    const raw = structuredClone(readJson(join(FORMS_DIR, 'sepa-mandat', '1.1.0.json'))) as {
      sections: { fields: { id: string; fromRole?: Record<string, unknown> }[] }[];
    };
    const iban = raw.sections.flatMap((s) => s.fields).find((f) => f.id === 'iban');
    if (!iban?.fromRole) throw new Error('no iban');
    iban.fromRole.changeable = 'ja';
    expect(parseFormDefinition(raw).ok).toBe(false);
    iban.fromRole.changeable = true;
    iban.fromRole.extra = 1;
    expect(parseFormDefinition(raw).ok).toBe(false);
  });
});
