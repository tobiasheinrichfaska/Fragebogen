// Preselections are not answers (Tobias 2026-11-14: "wir sollten klar unterscheiden zwischen
// gemachten Angaben und Vorbelegungen"). The draft marks what the app put in — the form's own
// preselection, the master-data link, another role's answer (Part.preset) — so the mark survives
// the interim file; the app replaces only such values, never an answer a person gave, changed or
// cleared. Before, the app guessed: after an interim file an answer equal to the form's
// preselection counted as empty and the link overwrote it (audit 2026-11-14, S5). Fictitious data.
import { join } from 'node:path';
import { buildPackage, decodePackage, packageText } from '../../src/logic/dataPackage';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import type { MasterData } from '../../src/logic/masterData';
import { decodeQuestionnaire } from '../../src/logic/questionnaireFile';
import { currentPart, latestSealed, presetOf } from '../../src/logic/questionnaire';
import {
  acknowledge,
  answer,
  enterRole,
  fillMasterData,
  filledFromLink,
  preselected,
  proposedBy,
  reopen,
  seal,
  sessionFromFile,
  startNewVersion,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(readJson(join(FORMS_DIR, 'sepa-mandat', '1.1.0.json')));
const AT = { local: '2026-11-05T10:00:00.000+01:00', utc: '2026-11-05T09:00:00.000Z' };

const LINK: MasterData = {
  glaeubigerName: 'Musterkanzlei Beispiel',
  glaeubigerStrasse: 'Beispielweg 1',
  glaeubigerPlzOrt: '12345 Musterstadt',
  glaeubigerLand: 'Deutschland',
  glaeubigerId: 'DE98ZZZ09999999999',
  lastschriftZahlungsart: 'einmalig',
};
const ACCOUNT = {
  kontoVorab: ['nameAnschrift', 'bankverbindung'],
  khAnschriftAusland: false,
  khStrasse: 'Musterstraße 5',
  khPostleitzahl: '12345',
  khOrt: 'Musterstadt',
  khKreditinstitut: 'Beispielbank',
  khIban: 'DE89370400440532013000',
};

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const value = (s: Session, role: string, id: string) =>
  currentPart(s.questionnaire, role)?.data[id];
const answerAll = (s: Session, values: Readonly<Record<string, unknown>>) =>
  Object.entries(values).reduce((next, [id, raw]) => must(answer(next, id, raw)), s);

function withLink(s: Session, link: MasterData = LINK): Session {
  const filled = fillMasterData(s, link);
  if (!filled.ok) throw new Error('no draft');
  return filled.session;
}

function kanzleiDraft(link?: MasterData): Session {
  const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei'));
  return link === undefined ? entered : withLink(entered, link);
}

/** "Zwischenstand speichern", later opened again and the role entered — the link open again. */
function throughInterimFile(s: Session, role: string, link?: MasterData): Session {
  const decoded = decodePackage(
    JSON.parse(packageText(buildPackage(s.questionnaire, s.form))),
    registryOf([form]),
  );
  if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
  const entered = must(enterRole(sessionFromFile(decoded, { ...AT, source: 'file' }), role));
  return link === undefined ? entered : withLink(entered, link);
}

function sealedKanzlei(s: Session, nonce: string): Session {
  return must(seal(s, { nonce: nonce.repeat(16), systemNote: note(AT.local, AT.utc), now: AT }));
}

describe('the link and the interim file', () => {
  it('keeps a payment kind changed by hand, though the link says otherwise', () => {
    const linked = kanzleiDraft(LINK);
    expect(value(linked, 'kanzlei', 'zahlungsart')).toBe('einmalig');
    const changed = must(answer(linked, 'zahlungsart', 'wiederkehrend'));
    expect(filledFromLink(changed, 'zahlungsart')).toBe(false);
    const reopened = throughInterimFile(changed, 'kanzlei', LINK);
    expect(value(reopened, 'kanzlei', 'zahlungsart')).toBe('wiederkehrend');
    expect(filledFromLink(reopened, 'zahlungsart')).toBe(false);
  });

  it('keeps an unchanged link value marked as the link’s, also without the link', () => {
    const reopened = throughInterimFile(kanzleiDraft(LINK), 'kanzlei');
    expect(value(reopened, 'kanzlei', 'glaeubigerName')).toBe('Musterkanzlei Beispiel');
    expect(filledFromLink(reopened, 'glaeubigerName')).toBe(true);
    expect(filledFromLink(reopened, 'zahlungsart')).toBe(true);
  });

  it('lets a newer link replace an unchanged link value, never a changed one', () => {
    const changed = must(answer(kanzleiDraft(LINK), 'glaeubigerStrasse', 'Andere Straße 2'));
    const newer = { ...LINK, glaeubigerName: 'Musterkanzlei Neu', glaeubigerStrasse: 'Neuweg 3' };
    const reopened = throughInterimFile(changed, 'kanzlei', newer);
    expect(value(reopened, 'kanzlei', 'glaeubigerName')).toBe('Musterkanzlei Neu');
    expect(value(reopened, 'kanzlei', 'glaeubigerStrasse')).toBe('Andere Straße 2');
  });

  it('leaves a link value cleared by hand empty', () => {
    const cleared = must(answer(kanzleiDraft(LINK), 'glaeubigerStrasse', null));
    const reopened = throughInterimFile(cleared, 'kanzlei', LINK);
    expect(value(reopened, 'kanzlei', 'glaeubigerStrasse')).toBeNull();
  });
});

describe('the form’s own preselection', () => {
  it('is marked as such until someone changes it, and the mark survives the interim file', () => {
    const fresh = kanzleiDraft();
    expect(value(fresh, 'kanzlei', 'zahlungsart')).toBe('wiederkehrend');
    expect(preselected(fresh, 'zahlungsart')).toBe(true);
    // The same value again is no change ("Weiter" on an unchanged answer does the same).
    expect(preselected(must(answer(fresh, 'zahlungsart', 'wiederkehrend')), 'zahlungsart')).toBe(
      true,
    );
    expect(preselected(throughInterimFile(fresh, 'kanzlei'), 'zahlungsart')).toBe(true);
    const changed = must(answer(fresh, 'zahlungsart', 'einmalig'));
    expect(preselected(changed, 'zahlungsart')).toBe(false);
    // Changed back, it is an answer that merely equals the preselection: the link leaves it.
    const back = must(answer(changed, 'zahlungsart', 'wiederkehrend'));
    expect(preselected(back, 'zahlungsart')).toBe(false);
    expect(value(throughInterimFile(back, 'kanzlei', LINK), 'kanzlei', 'zahlungsart')).toBe(
      'wiederkehrend',
    );
  });

  it('gives way to the link, whose value is then marked as the link’s', () => {
    const linked = kanzleiDraft(LINK);
    expect(preselected(linked, 'zahlungsart')).toBe(false);
    expect(filledFromLink(linked, 'zahlungsart')).toBe(true);
  });

  it('is never sealed: signing makes every value the signer’s, also in a new version', () => {
    const sealed = sealedKanzlei(answerAll(kanzleiDraft(LINK), { mandantName: 'Erika M.' }), 'a1');
    expect(latestSealed(sealed.questionnaire, 'kanzlei')?.preset).toBeUndefined();
    const next = must(startNewVersion(sealed, 'kanzlei'));
    expect(currentPart(next.questionnaire, 'kanzlei')?.preset).toBeUndefined();
    expect(filledFromLink(withLink(next), 'zahlungsart')).toBe(false);
  });
});

describe('the file format', () => {
  const draft = () => kanzleiDraft(LINK).questionnaire;
  const raw = () => JSON.parse(JSON.stringify(draft())) as Record<string, unknown>;
  const kanzleiPart = (q: Record<string, unknown>) =>
    (q.parts as Record<string, Record<string, unknown>[]>).kanzlei?.[0] ?? {};

  it('reads the marks back exactly', () => {
    const decoded = decodeQuestionnaire(raw());
    expect(decoded.ok && decoded.questionnaire).toEqual(draft());
  });

  it.each<[string, (part: Record<string, unknown>) => void]>([
    ['an unknown source', (p) => Reflect.set(p.preset as object, 'zahlungsart', 'raten')],
    [
      'a mark on a field without a value',
      (p) => Reflect.set(p.preset as object, 'mandantName', 'link'),
    ],
    ['an empty set of marks', (p) => Reflect.set(p, 'preset', {})],
  ])('refuses %s', (_label, spoil) => {
    const q = raw();
    spoil(kanzleiPart(q));
    expect(decodeQuestionnaire(q).ok).toBe(false);
  });

  it('refuses marks on a sealed part', () => {
    const sealed = sealedKanzlei(answerAll(kanzleiDraft(LINK), { mandantName: 'Erika M.' }), 'a1');
    const q = JSON.parse(JSON.stringify(sealed.questionnaire)) as Record<string, unknown>;
    Reflect.set(kanzleiPart(q), 'preset', { zahlungsart: 'link' });
    expect(decodeQuestionnaire(q).ok).toBe(false);
  });
});

describe('a proposal of another role follows it while nobody changes it', () => {
  function kanzleiWith(values: Readonly<Record<string, unknown>>): Session {
    return sealedKanzlei(
      answerAll(kanzleiDraft(LINK), { mandantName: 'Erika M.', ...values }),
      'a1',
    );
  }
  /** The Kanzlei changes its own part again — as a new version or by taking its seal back. */
  function kanzleiAgain(
    s: Session,
    how: 'newVersion' | 'reopen',
    values: Readonly<Record<string, unknown>>,
  ): Session {
    const opened = must(
      how === 'newVersion' ? startNewVersion(s, 'kanzlei') : reopen(s, 'kanzlei'),
    );
    return sealedKanzlei(answerAll(opened, values), 'c3');
  }

  it.each(['newVersion', 'reopen'] as const)(
    'takes the Kanzlei’s newer IBAN into the holder’s draft (%s)',
    (how) => {
      const holder = must(enterRole(kanzleiWith(ACCOUNT), 'kontoinhaber'));
      expect(proposedBy(holder, 'iban')).toBe('Kanzlei (Zahlungsempfänger)');
      const again = kanzleiAgain(holder, how, { khIban: 'DE02120300000000202051' });
      const back = must(enterRole(again, 'kontoinhaber'));
      expect(value(back, 'kontoinhaber', 'iban')).toBe('DE02120300000000202051');
      expect(proposedBy(back, 'iban')).toBe('Kanzlei (Zahlungsempfänger)');
    },
  );

  it.each(['newVersion', 'reopen'] as const)(
    'takes a proposal the Kanzlei no longer makes out again, and says so (%s)',
    (how) => {
      const holder = must(enterRole(kanzleiWith(ACCOUNT), 'kontoinhaber'));
      const again = kanzleiAgain(holder, how, { kontoVorab: ['nameAnschrift'] });
      const back = enterRole(again, 'kontoinhaber');
      if (!back.ok) throw new Error(back.message);
      expect(value(back.session, 'kontoinhaber', 'iban')).toBeUndefined();
      expect(
        presetOf(currentPart(back.session.questionnaire, 'kontoinhaber'), 'iban'),
      ).toBeUndefined();
      expect(back.warnings).toContain(
        'Der Teil „Kanzlei (Zahlungsempfänger)“ gibt „IBAN“ nicht mehr vor; die übernommene Angabe ist entfernt.',
      );
    },
  );

  it('never touches an IBAN the holder changed', () => {
    const holder = must(
      answer(
        must(enterRole(kanzleiWith(ACCOUNT), 'kontoinhaber')),
        'iban',
        'DE75512108001245126199',
      ),
    );
    for (const values of [
      { khIban: 'DE02120300000000202051' },
      { kontoVorab: ['nameAnschrift'] },
    ]) {
      const back = must(enterRole(kanzleiAgain(holder, 'newVersion', values), 'kontoinhaber'));
      expect(value(back, 'kontoinhaber', 'iban')).toBe('DE75512108001245126199');
      expect(proposedBy(back, 'iban')).toBeUndefined();
    }
  });

  it('keeps the holder’s confirmed notices and answers while the proposal changes', () => {
    let holder = must(enterRole(kanzleiWith(ACCOUNT), 'kontoinhaber'));
    holder = acknowledge(must(answer(holder, 'weitereKontoinhaber', false)), 'datenschutz', true);
    const back = must(
      enterRole(
        kanzleiAgain(holder, 'newVersion', { khIban: 'DE02120300000000202051' }),
        'kontoinhaber',
      ),
    );
    expect(value(back, 'kontoinhaber', 'weitereKontoinhaber')).toBe(false);
    expect(currentPart(back.questionnaire, 'kontoinhaber')?.acknowledged).toEqual(['datenschutz']);
  });
});
