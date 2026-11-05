// The SEPA-Mandat draft through the engine (Tobias 2026-11-05): the Kanzlei fills first, its
// standard data (creditor name, address, Gläubiger-ID) from its Stammdaten-Link, the Mandatsreferenz
// from a link or empty ("wird separat mitgeteilt"). The account holder's own part repeats creditor,
// Gläubiger-ID and contract (fromRole), so a mandate never goes out without them; a joint account
// adds a second signer. Fictitious data; DE98ZZZ09999999999 is the Bundesbank's test number.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { decodePackage } from '../../src/logic/dataPackage';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import type { MasterData } from '../../src/logic/masterData';
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
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(
  readJson(join(DRAFTS_DIR, 'sepa-mandat', '0.1.0.json')),
);
const AT = { local: '2026-11-02T10:00:00.000+01:00', utc: '2026-11-02T09:00:00.000Z' };

type Values = Record<string, unknown>;

const LINK: MasterData = {
  glaeubigerName: 'Musterkanzlei Beispiel',
  glaeubigerStrasse: 'Beispielweg 1',
  glaeubigerPlzOrt: '12345 Musterstadt',
  glaeubigerLand: 'Deutschland',
  glaeubigerId: 'DE98ZZZ09999999999',
};

const HOLDER: Values = {
  kontoinhaberName: 'Erika Musterfrau',
  kontoinhaberStrasse: 'Musterstraße 5',
  kontoinhaberPlzOrt: '12345 Musterstadt',
  kontoinhaberLand: 'Deutschland',
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

  it('takes a Mandatsreferenz from a link made for one client', () => {
    const s = kanzleiSealed({}, { ...LINK, mandatsreferenz: '100010000001' });
    expect(value(s, 'kanzlei', 'mandatsreferenz')).toBe('100010000001');
  });

  it('seals without a signature, and the account holder is asked only for his own data', () => {
    const kanzlei = kanzleiSealed({ mandatsreferenz: '100010000001' });
    expect(currentPart(kanzlei.questionnaire, 'kanzlei')?.status).toBe('sealed');
    const holder = must(enterRole(kanzlei, 'kontoinhaber'));
    expect(value(holder, 'kontoinhaber', 'zahlungsempfaenger')).toBe('Musterkanzlei Beispiel');
    expect(value(holder, 'kontoinhaber', 'zahlungsempfaengerGlaeubigerId')).toBe(
      'DE98ZZZ09999999999',
    );
    expect(value(holder, 'kontoinhaber', 'vertragMit')).toBe('Erika Musterfrau');
    expect(questions(holder)).toEqual([
      'kontoinhaberName',
      'kontoinhaberStrasse',
      'kontoinhaberPlzOrt',
      'kontoinhaberLand',
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

  it('allows an account holder other than the client (abweichender Schuldner)', () => {
    const done = holderSealed(kanzleiSealed({ mandantName: 'Beispiel GmbH' }));
    expect(value(done, 'kontoinhaber', 'vertragMit')).toBe('Beispiel GmbH');
    expect(value(done, 'kontoinhaber', 'kontoinhaberName')).toBe('Erika Musterfrau');
    expect(contradictions(done.questionnaire, form.definition)).toEqual([]);
  });
});

describe('the account holder without the Kanzlei part', () => {
  it('must name creditor, Gläubiger-ID and contract himself before signing', () => {
    const s = answerAll(
      must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kontoinhaber')),
      HOLDER,
    );
    expect(questions(s).slice(0, 3)).toEqual([
      'zahlungsempfaenger',
      'zahlungsempfaengerGlaeubigerId',
      'vertragMit',
    ]);
    expect(summaryOf(s)?.missingRequired).toEqual([
      'zahlungsempfaenger',
      'zahlungsempfaengerGlaeubigerId',
      'vertragMit',
    ]);
  });

  it('shows a contradiction when the Kanzlei later names another creditor', () => {
    const typed = holderSealed(startSession(form, QUESTIONNAIRE_ID), {
      zahlungsempfaenger: 'Musterkanzlei',
      zahlungsempfaengerGlaeubigerId: 'DE98ZZZ09999999999',
      vertragMit: 'Erika Musterfrau',
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
  it('needs the second holder, whose part takes account and creditor over', () => {
    const first = holderSealed(kanzleiSealed(), { ...HOLDER, zweiteUnterschrift: true });
    expect(completenessGaps(first.questionnaire, form).map((gap) => gap.code)).toContain(
      'conditionalRoleMissing',
    );
    let second = must(enterRole(first, 'mitinhaber'));
    expect(value(second, 'mitinhaber', 'mitinhaberIban')).toBe('DE89370400440532013000');
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
    if (!parsed?.ok) throw new Error('not parsed');
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
    expect(questions(holder)[0]).toBe('kontoinhaberName');
  });
});
