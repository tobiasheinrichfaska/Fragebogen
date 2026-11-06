// The SEPA-Mandat draft through the engine (Tobias 2026-11-05): the Kanzlei fills first, its
// standard data (creditor name, address, Gläubiger-ID) from its Stammdaten-Link, the Mandatsreferenz
// from a link or empty ("wird separat mitgeteilt"). The account holder's own part repeats creditor,
// Gläubiger-ID and contract (fromRole), so a mandate never goes out without them; a joint account
// adds a second signer. Fictitious data; DE98ZZZ09999999999 is the Bundesbank's test number.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { decodePackage } from '../../src/logic/dataPackage';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import { mergedMasterData, type MasterData } from '../../src/logic/masterData';
import { checkHints } from '../../src/logic/hints';
import { currentPart } from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  fillMasterData,
  filledFromLink,
  seal,
  sessionFromFile,
  startSession,
  stepsFor,
  summaryOf,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import {
  TRANSFER_LINK_MAX_LENGTH,
  parseTransferFragment,
  transferFragment,
  transferPackageText,
} from '../../src/logic/transferLink';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(readJson(join(FORMS_DIR, 'sepa-mandat', '1.0.0.json')));
const AT = { local: '2026-11-02T10:00:00.000+01:00', utc: '2026-11-02T09:00:00.000Z' };

type Values = Record<string, unknown>;

const LINK: MasterData = {
  glaeubigerName: 'Musterkanzlei Beispiel',
  glaeubigerStrasse: 'Beispielweg 1',
  glaeubigerPlzOrt: '12345 Musterstadt',
  glaeubigerLand: 'Deutschland',
  glaeubigerId: 'DE98ZZZ09999999999',
};

const ADDRESS: Values = {
  anschriftAusland: false,
  kontoinhaberStrasse: 'Musterstraße 5',
  postleitzahl: '12345',
  kontoinhaberOrt: 'Musterstadt',
};

const HOLDER: Values = {
  ...ADDRESS,
  kreditinstitut: 'Beispielbank',
  iban: 'DE89 3704 0044 0532 0130 00',
  zweiteUnterschrift: false,
  unterschriftOrt: 'Musterstadt',
  unterschriftDatum: '02.11.2026',
};

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));

const value = (s: Session, role: string, id: string) =>
  currentPart(s.questionnaire, role)?.data[id];

function answerAll(s: Session, values: Values): Session {
  return Object.entries(values).reduce((next, [id, raw]) => must(answer(next, id, raw)), s);
}

function sealed(s: Session, nonce: string, name?: string): Session {
  return must(
    seal(s, {
      nonce: nonce.repeat(16),
      systemNote: note(AT.local, AT.utc),
      ...(name === undefined ? {} : { signature: { method: 'typed' as const, name } }),
      now: AT,
    }),
  );
}

/** The Kanzlei opens its bookmark link, names the client and seals without a signature. */
function kanzleiSealed(extra: Values = {}, link: MasterData = LINK): Session {
  const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
  const filled = fillMasterData(entered, link);
  if (!filled.ok) throw new Error('no draft');
  const s = answerAll(filled.session, { mandantName: 'Erika Musterfrau', ...extra });
  return sealed(s, 'a1');
}

function holderSealed(base: Session, values: Values = HOLDER): Session {
  let s = answerAll(must(enterRole(base, 'kontoinhaber')), values);
  for (const id of ['mandatstext', 'datenschutz']) s = acknowledge(s, id, true);
  return sealed(s, 'b2', 'Erika Musterfrau');
}

describe('the Kanzlei fills first, with its standard data from the link', () => {
  it('fills the creditor from the link and leaves the Mandatsreferenz to the Kanzlei', () => {
    const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    const filled = fillMasterData(entered, LINK);
    if (!filled.ok) throw new Error('no draft');
    const s = filled.session;
    for (const id of Object.keys(LINK)) expect(filledFromLink(s, id)).toBe(true);
    expect(value(s, 'kanzlei', 'glaeubigerId')).toBe('DE98ZZZ09999999999');
    expect(value(s, 'kanzlei', 'mandatsreferenz')).toBeUndefined();
    expect(summaryOf(s)?.missingRequired).toEqual(['mandantName']);
  });

  it('seals without a signature, and the account holder is asked only for his own data', () => {
    const kanzlei = kanzleiSealed({ mandatsreferenz: '100010000001' });
    expect(currentPart(kanzlei.questionnaire, 'kanzlei')?.status).toBe('sealed');
    const holder = must(
      answer(must(enterRole(kanzlei, 'kontoinhaber')), 'anschriftAusland', false),
    );
    expect(value(holder, 'kontoinhaber', 'zahlungsempfaenger')).toBe('Musterkanzlei Beispiel');
    expect(value(holder, 'kontoinhaber', 'mandatZahlungsart')).toBe('wiederkehrend');
    expect(value(holder, 'kontoinhaber', 'zahlungsempfaengerGlaeubigerId')).toBe(
      'DE98ZZZ09999999999',
    );
    expect(value(holder, 'kontoinhaber', 'vertragMit')).toBe('Erika Musterfrau');
    // The payer holds the account (Vordruck 1): no name of its own, no e-mail for the notice.
    expect(value(holder, 'kontoinhaber', 'mandatKontoinhaberArt')).toBe('identisch');
    expect(questions(holder)).toEqual([
      'anschriftAusland',
      'kontoinhaberStrasse',
      'postleitzahl',
      'kontoinhaberOrt',
      'kreditinstitut',
      'iban',
      'zweiteUnterschrift',
      'unterschriftOrt',
      'unterschriftDatum',
    ]);
  });

  it('is complete once the account holder signs, the Kanzlei part confirmed', () => {
    const done = holderSealed(kanzleiSealed({ mandatsreferenz: '100010000001' }));
    expect(transmissionBlockers(done.questionnaire, form)).toEqual([]);
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    expect(contradictions(done.questionnaire, form.definition)).toEqual([]);
    expect(value(done, 'kontoinhaber', 'iban')).toBe('DE89370400440532013000');
  });

  it('is complete without a Mandatsreferenz — it is announced before the first debit', () => {
    const done = holderSealed(kanzleiSealed());
    expect(currentPart(done.questionnaire, 'kanzlei')?.data.mandatsreferenz ?? null).toBeNull();
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });

  it('asks a deviating account holder for the name and the notice address (Vordruck 2)', () => {
    const kanzlei = kanzleiSealed({ mandantName: 'Beispiel GmbH', kontoinhaberArt: 'abweichend' });
    const holder = must(enterRole(kanzlei, 'kontoinhaber'));
    expect(questions(holder).slice(0, 2)).toEqual(['kontoinhaberName', 'kontoinhaberEmail']);
    const done = holderSealed(kanzlei, {
      kontoinhaberName: 'Erika Musterfrau',
      kontoinhaberEmail: 'erika@example.org',
      ...HOLDER,
    });
    expect(value(done, 'kontoinhaber', 'vertragMit')).toBe('Beispiel GmbH');
    expect(value(done, 'kontoinhaber', 'kontoinhaberName')).toBe('Erika Musterfrau');
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    expect(contradictions(done.questionnaire, form.definition)).toEqual([]);
    // The Kanzlei is told whom the pre-notification goes to.
    expect(checkHints(done.questionnaire, form.definition).map((hint) => hint.id)).toEqual([
      'abweichenderKontoinhaber',
    ]);
  });

  it('gives no such hint when the payer holds the account', () => {
    const done = holderSealed(kanzleiSealed());
    expect(checkHints(done.questionnaire, form.definition)).toEqual([]);
  });
});

describe('the account holder without the Kanzlei part', () => {
  it('must name creditor, Gläubiger-ID and contract himself before signing', () => {
    const s = answerAll(
      must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kontoinhaber')),
      HOLDER,
    );
    expect(questions(s).slice(0, 5)).toEqual([
      'zahlungsempfaenger',
      'zahlungsempfaengerGlaeubigerId',
      'vertragMit',
      'mandatKontoinhaberArt',
      'mandatZahlungsart',
    ]);
    expect(summaryOf(s)?.missingRequired).toEqual([
      'zahlungsempfaenger',
      'zahlungsempfaengerGlaeubigerId',
      'vertragMit',
      'mandatKontoinhaberArt',
      'mandatZahlungsart',
    ]);
  });

  it('shows a contradiction when the Kanzlei later names another creditor', () => {
    const typed = holderSealed(startSession(form, QUESTIONNAIRE_ID), {
      zahlungsempfaenger: 'Musterkanzlei',
      zahlungsempfaengerGlaeubigerId: 'DE98ZZZ09999999999',
      vertragMit: 'Erika Musterfrau',
      mandatKontoinhaberArt: 'identisch',
      mandatZahlungsart: 'wiederkehrend',
      ...HOLDER,
    });
    const entered = must(enterRole(typed, 'kanzlei'));
    const filled = fillMasterData(entered, LINK);
    if (!filled.ok) throw new Error('no draft');
    const both = sealed(answerAll(filled.session, { mandantName: 'Erika Musterfrau' }), 'c3');
    expect(contradictions(both.questionnaire, form.definition).map((c) => c.message)).toEqual([
      'Der Zahlungsempfänger im Mandat weicht von den Angaben der Kanzlei ab.',
    ]);
  });
});

describe('a joint account', () => {
  it('needs the second holder, whose part takes the creditor over', () => {
    const first = holderSealed(kanzleiSealed(), { ...HOLDER, zweiteUnterschrift: true });
    expect(completenessGaps(first.questionnaire, form).map((gap) => gap.code)).toContain(
      'conditionalRoleMissing',
    );
    let second = must(enterRole(first, 'mitinhaber'));
    expect(value(second, 'mitinhaber', 'mitinhaberGlaeubigerId')).toBe('DE98ZZZ09999999999');
    expect(questions(second)).toEqual(['mitinhaberName']);
    second = must(answer(second, 'mitinhaberName', 'Max Mustermann'));
    for (const id of ['mandatstextMitinhaber', 'datenschutzMitinhaber']) {
      second = acknowledge(second, id, true);
    }
    const done = sealed(second, 'd4', 'Max Mustermann');
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    expect(contradictions(done.questionnaire, form.definition)).toEqual([]);
  });

  it('does not ask for a second holder when one may decide alone', () => {
    const done = holderSealed(kanzleiSealed());
    expect(completenessGaps(done.questionnaire, form).map((gap) => gap.code)).not.toContain(
      'conditionalRoleMissing',
    );
  });
});

describe('the Kanzlei may enter the account details or leave them to the holder (2026-11-05)', () => {
  const NAME_ADDRESS: Values = {
    khAnschriftAusland: false,
    khStrasse: 'Musterstraße 5',
    khPostleitzahl: '12345',
    khOrt: 'Musterstadt',
  };
  const BANK: Values = { khKreditinstitut: 'Beispielbank', khIban: 'DE89370400440532013000' };

  it('asks nothing about the account when the Kanzlei names everything', () => {
    const kanzlei = kanzleiSealed({
      kontoVorab: ['nameAnschrift', 'bankverbindung'],
      ...NAME_ADDRESS,
      ...BANK,
    });
    const holder = must(enterRole(kanzlei, 'kontoinhaber'));
    expect(questions(holder)).toEqual([
      'zweiteUnterschrift',
      'unterschriftOrt',
      'unterschriftDatum',
    ]);
    expect(value(holder, 'kontoinhaber', 'kontoinhaberStrasse')).toBe('Musterstraße 5');
    expect(value(holder, 'kontoinhaber', 'postleitzahl')).toBe('12345');
    expect(value(holder, 'kontoinhaber', 'iban')).toBe('DE89370400440532013000');
    // A fixed value cannot be changed by the holder; the Kanzlei changes its part instead.
    expect(answer(holder, 'iban', 'AT611904300234573201').ok).toBe(false);
    const done = holderSealed(kanzlei, {
      zweiteUnterschrift: false,
      unterschriftOrt: 'Musterstadt',
      unterschriftDatum: '02.11.2026',
    });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
  });

  it('names a deviating holder too, when the Kanzlei knows it', () => {
    const kanzlei = kanzleiSealed({
      kontoinhaberArt: 'abweichend',
      kontoVorab: ['nameAnschrift'],
      khName: 'Max Mustermann',
      ...NAME_ADDRESS,
    });
    const holder = must(enterRole(kanzlei, 'kontoinhaber'));
    expect(value(holder, 'kontoinhaber', 'kontoinhaberName')).toBe('Max Mustermann');
    expect(questions(holder)).toContain('kontoinhaberEmail');
    expect(questions(holder)).not.toContain('kontoinhaberName');
    // For an identical holder the Kanzlei is never asked a name: it is the payer's.
    const identical = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    const ticked = must(answer(identical, 'kontoVorab', ['nameAnschrift']));
    expect(questions(ticked)).not.toContain('khName');
    expect(questions(ticked)).toContain('khStrasse');
  });

  it('leaves the address to the holder when the Kanzlei names only the bank', () => {
    const holder = must(
      enterRole(kanzleiSealed({ kontoVorab: ['bankverbindung'], ...BANK }), 'kontoinhaber'),
    );
    const asked = questions(holder);
    expect(asked).toContain('anschriftAusland');
    expect(asked).not.toContain('iban');
    expect(asked).not.toContain('kreditinstitut');
  });

  it('asks nothing of the Kanzlei about the account unless it ticks it', () => {
    const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    expect(questions(entered)).not.toContain('khName');
    expect(questions(entered)).not.toContain('khIban');
    const ticked = must(answer(entered, 'kontoVorab', ['bankverbindung']));
    expect(questions(ticked)).toContain('khIban');
    expect(questions(ticked)).not.toContain('khName');
  });
});

describe('the address as in the Personalfragebogen', () => {
  const holder = () => must(enterRole(kanzleiSealed(), 'kontoinhaber'));

  it('checks a German postcode and asks no state', () => {
    const s = must(answer(holder(), 'anschriftAusland', false));
    expect(questions(s)).toContain('postleitzahl');
    expect(questions(s)).not.toContain('anschriftStaat');
    expect(answer(s, 'postleitzahl', '1234').ok).toBe(false);
  });

  it('asks the state abroad and checks the postcode only as a hint', () => {
    const s = answerAll(holder(), {
      anschriftAusland: true,
      anschriftStaat: 'Österreich',
      postleitzahlAusland: '123',
    });
    expect(questions(s)).toContain('anschriftStaat');
    expect(questions(s)).not.toContain('postleitzahl');
    expect(checkHints(s.questionnaire, form.definition).map((hint) => hint.id)).toContain(
      'plzAuslandFormat',
    );
  });
});

describe('payment type and the link for next time', () => {
  it('names the payment type the banks require, recurring unless the Kanzlei says once', () => {
    const once = must(enterRole(kanzleiSealed({ zahlungsart: 'einmalig' }), 'kontoinhaber'));
    expect(value(once, 'kontoinhaber', 'mandatZahlungsart')).toBe('einmalig');
    expect(questions(once)).not.toContain('mandatZahlungsart');
  });

  // Tobias 2026-11-05: "da es Stammdaten sind, haben hier Mandantenangaben im Sepa nix zu suchen".
  it('puts only the Kanzlei standard data in the link for next time, nothing of the client', () => {
    const kanzlei = kanzleiSealed({
      mandantennummer: '10001',
      mandatsreferenz: '100010000001',
      kontoinhaberArt: 'abweichend',
    });
    const data = currentPart(kanzlei.questionnaire, 'kanzlei')?.data ?? {};
    const next = mergedMasterData({ betriebsnummer: '12345671' }, form.definition, 'kanzlei', data);
    expect(next).toEqual({
      ...LINK,
      lastschriftZahlungsart: 'wiederkehrend',
      betriebsnummer: '12345671',
    });
  });

  it('still fits in a link when the Kanzlei names everything', () => {
    const kanzlei = kanzleiSealed({
      mandantennummer: '10001',
      mandatsreferenz: '100010000001',
      kontoinhaberArt: 'abweichend',
      kontoVorab: ['nameAnschrift', 'bankverbindung'],
      khName: 'Max Mustermann',
      khAnschriftAusland: false,
      khStrasse: 'Musterstraße 5',
      khPostleitzahl: '12345',
      khOrt: 'Musterstadt',
      khKreditinstitut: 'Beispielbank',
      khIban: 'DE89370400440532013000',
    });
    expect(transferFragment(kanzlei.questionnaire).ok).toBe(true);
  });
});

describe('bank details and formats', () => {
  const holder = () => must(enterRole(kanzleiSealed(), 'kontoinhaber'));

  it('asks the BIC only for a foreign IBAN', () => {
    expect(questions(must(answer(holder(), 'iban', 'DE89370400440532013000')))).not.toContain(
      'bic',
    );
    expect(questions(must(answer(holder(), 'iban', 'AT611904300234573201')))).toContain('bic');
  });

  it('flags a BIC of another country than the IBAN', () => {
    const s = answerAll(holder(), { iban: 'AT611904300234573201', bic: 'COBADEFFXXX' });
    expect(checkHints(s.questionnaire, form.definition).map((hint) => hint.id)).toEqual([
      'bicPasstNichtZurIban',
    ]);
  });

  it('refuses a Gläubiger-ID with a wrong check digit and a Mandatsreferenz with a space', () => {
    const kanzlei = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
    expect(answer(kanzlei, 'glaeubigerId', 'DE97ZZZ09999999999').ok).toBe(false);
    expect(answer(kanzlei, 'mandatsreferenz', '10001 0000001').ok).toBe(false);
    expect(answer(kanzlei, 'mandatsreferenz', '100010000001').ok).toBe(true);
  });

  it('refuses a signing date in the future', () => {
    expect(answer(holder(), 'unterschriftDatum', '01.01.2099').ok).toBe(false);
  });
});

describe('passing the Kanzlei part on as a link (Tobias 2026-11-05)', () => {
  it('fits in a link, and the account holder opens it verified, ready to fill', () => {
    const kanzlei = kanzleiSealed({ mandatsreferenz: '100010000001' });
    const made = transferFragment(kanzlei.questionnaire);
    if (!made.ok) throw new Error(`${made.issue} ${made.length}`);
    expect(made.fragment.length).toBeLessThan(TRANSFER_LINK_MAX_LENGTH);
    const parsed = parseTransferFragment(made.fragment);
    if (parsed?.ok !== true || parsed.kind !== 'open') throw new Error('not parsed');
    const opened = transferPackageText(parsed.questionnaireText, (hash) =>
      hash === form.definitionHash ? form.definition : undefined,
    );
    if (!opened.ok) throw new Error(opened.issue);
    const registry = registryOf([form]);
    const decoded = decodePackage(JSON.parse(opened.text), registry);
    if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
    expect(verifyQuestionnaire(decoded.questionnaire, { registry }).level).toBe('ok');
    const holder = must(
      enterRole(
        sessionFromFile(decoded, { local: AT.local, utc: AT.utc, source: 'file' }),
        'kontoinhaber',
      ),
    );
    expect(value(holder, 'kontoinhaber', 'zahlungsempfaenger')).toBe('Musterkanzlei Beispiel');
    expect(questions(holder)[0]).toBe('anschriftAusland');
  });
});
