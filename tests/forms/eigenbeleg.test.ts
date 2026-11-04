// The Eigenbeleg draft through the engine (Tobias 2026-11-04): one form for an expense without an
// original receipt and for the cash events Privatentnahme, Einlage and Geldtransit. Bewirtung is
// selectable with a warning, never an exclusion; amounts from 250 € only raise a check hint; the
// Belegnummer is optional. Fictitious data.
import { join } from 'node:path';
import { activeExclusions, checkHints } from '../../src/logic/hints';
import { visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import type { Questionnaire } from '../../src/logic/model';
import {
  createQuestionnaire,
  currentPart,
  sealPart,
  setValue,
  startPart,
  type Transition,
} from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  fillMasterData,
  filledFromLink,
  seal as sealSession,
  startSession,
  stepsFor,
  summaryOf,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID, STROKES } from '../support/sample';

const raw = () => readJson(join(DRAFTS_DIR, 'eigenbeleg', '0.1.0.json'));
const form: RegisteredForm = registeredFrom(raw());
const ROLE = 'aussteller';
const NOTICES = ['aufbewahrung', 'keineVorsteuer', 'richtigkeit', 'wannEigenbeleg'];
const AT = { local: '2026-10-16T09:00:00.000+02:00', utc: '2026-10-16T07:00:00.000Z' };

type Values = Record<string, unknown>;

const BASE: Values = {
  firma: 'Beispiel Malerbetrieb',
  mandantennummer: '99999',
  ausstellerName: 'Erika Musterfrau',
};
const END: Values = { belegnummer: 'EB-2026-001', ausstellungsdatum: '16.10.2026' };

/** Parking fee paid from the till, the ticket kept at the barrier. */
const PARKEN: Values = {
  vorgangsart: 'ausgabe',
  vorgangsdatum: '15.10.2026',
  artAusgabe: 'parken',
  grundOhneOriginal: 'einbehalten',
  zahlungsempfaenger: 'Parkhaus Beispielplatz',
  ortDerAusgabe: 'Musterstadt, Beispielplatz 1',
  leistung: '2 Stunden Parken',
  betrieblicherAnlass: 'Kundentermin bei der Beispiel GmbH',
  inEuro: true,
  betrag: '4,50',
  zahlungsart: 'bar',
  kassenbuch: true,
};

const ENTNAHME: Values = {
  vorgangsart: 'privatentnahme',
  rechtsform: 'einzelunternehmen',
  vorgangsdatum: '15.10.2026',
  entnahmeAus: 'kasse',
  entnahmePerson: 'Erika Musterfrau',
  geldBetrag: '200,00',
  kassenbuchGeld: true,
};

const EINLAGE: Values = {
  vorgangsart: 'einlage',
  rechtsform: 'personengesellschaft',
  vorgangsdatum: '15.10.2026',
  einlageIn: 'kasse',
  kassenBezeichnung: 'Kasse Filiale Nord',
  einlagePerson: 'Max Mustermann',
  geldBetrag: '150,00',
  einlageHerkunft: 'vom privaten Girokonto abgehoben, als Wechselgeld',
  kassenbuchGeld: true,
};

const TRANSIT: Values = {
  vorgangsart: 'geldtransit',
  vorgangsdatum: '15.10.2026',
  geldtransitRichtung: 'kasseZuBank',
  transitPerson: 'Max Mustermann',
  geldBetrag: '1.250,00',
  transitGrund: 'Tageseinnahmen zur Bank gebracht',
  kassenbuchGeld: true,
  bankbeleg: true,
};

function draftWith(...parts: Values[]): Questionnaire {
  return Object.entries(Object.assign({}, BASE, ...parts) as Values).reduce(
    (q, [id, value]) => ok(setValue(q, form, ROLE, id, value)),
    ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, ROLE)),
  );
}

function sealed(q: Questionnaire): Transition {
  return sealPart(q, form, ROLE, {
    nonce: 'e1'.repeat(16),
    systemNote: note(AT.local, AT.utc),
    acknowledged: NOTICES,
    signature: { method: 'drawn', strokes: STROKES },
  });
}

const asked = (q: Questionnaire) =>
  visibleFields(form.definition, ROLE, currentPart(q, ROLE)?.data ?? {}).map((f) => f.id);
const hintIds = (q: Questionnaire) => checkHints(q, form.definition).map((h) => h.id);
const excluded = (q: Questionnaire) => activeExclusions(q, form.definition).map((e) => e.id);

function sealsCleanly(q: Questionnaire): Questionnaire {
  const signed = ok(sealed(q));
  expect(transmissionBlockers(signed, form)).toEqual([]);
  expect(completenessGaps(signed, form)).toEqual([]);
  return signed;
}

describe('one form for four kinds, each with its own questions', () => {
  it('asks an expense paid from the till what the voucher needs, and seals it', () => {
    const q = draftWith(PARKEN, END);
    expect(asked(q)).toEqual([
      'firma',
      'mandantennummer',
      'ausstellerName',
      'vorgangsart',
      'vorgangsdatum',
      'artAusgabe',
      'grundOhneOriginal',
      'grundErlaeuterung',
      'zahlungsempfaenger',
      'ortDerAusgabe',
      'leistung',
      'betrieblicherAnlass',
      'inEuro',
      'betrag',
      'zahlungsart',
      'kassenbuch',
      'belegnummer',
      'ausstellungsdatum',
    ]);
    sealsCleanly(q);
    expect(hintIds(q)).toEqual(['ohneVorsteuer']);
  });

  it('asks a Privatentnahme from the till who took how much, and nothing about an expense', () => {
    const q = draftWith(ENTNAHME, END);
    expect(asked(q)).toEqual([
      'firma',
      'mandantennummer',
      'ausstellerName',
      'vorgangsart',
      'rechtsform',
      'vorgangsdatum',
      'entnahmeAus',
      'kassenBezeichnung',
      'entnahmePerson',
      'geldBetrag',
      'entnahmeZweck',
      'kassenbuchGeld',
      'belegnummer',
      'ausstellungsdatum',
    ]);
    sealsCleanly(q);
    expect(hintIds(q)).toEqual([]);
    // The expense questions are not open for input at all.
    expect(setValue(q, form, ROLE, 'betrag', '10,00')).toMatchObject({
      ok: false,
      code: 'fieldNotAvailable',
    });
  });

  it('asks an Einlage where the money comes from', () => {
    const q = draftWith(EINLAGE, END);
    expect(asked(q)).toEqual([
      'firma',
      'mandantennummer',
      'ausstellerName',
      'vorgangsart',
      'rechtsform',
      'vorgangsdatum',
      'einlageIn',
      'kassenBezeichnung',
      'einlagePerson',
      'geldBetrag',
      'einlageHerkunft',
      'kassenbuchGeld',
      'belegnummer',
      'ausstellungsdatum',
    ]);
    sealsCleanly(q);
  });

  it('asks a Geldtransit to the bank for the bank receipt and tells the Kanzlei to book it once', () => {
    const q = draftWith(TRANSIT, END);
    expect(asked(q)).toEqual([
      'firma',
      'mandantennummer',
      'ausstellerName',
      'vorgangsart',
      'vorgangsdatum',
      'geldtransitRichtung',
      'kassenBezeichnung',
      'transitPerson',
      'geldBetrag',
      'transitGrund',
      'kassenbuchGeld',
      'bankbeleg',
      'belegnummer',
      'ausstellungsdatum',
    ]);
    sealsCleanly(q);
    expect(hintIds(q)).toEqual(['geldtransitBuchen']);
  });

  it('asks a transit between two tills for both tills and no bank receipt', () => {
    const q = draftWith(
      TRANSIT,
      {
        geldtransitRichtung: 'kasseZuKasse',
        bankbeleg: null,
        transitKassen: 'Hauptkasse → Kasse Filiale Nord',
      },
      END,
    );
    const ids = asked(q);
    expect(ids).toContain('transitKassen');
    expect(ids).not.toContain('bankbeleg');
    expect(ids).not.toContain('kassenBezeichnung');
    expect(ids).toContain('kassenbuchGeld');
    sealsCleanly(q);
  });

  it('never asks the Rechtsform for an expense or a Geldtransit', () => {
    expect(asked(draftWith(PARKEN))).not.toContain('rechtsform');
    expect(asked(draftWith(TRANSIT))).not.toContain('rechtsform');
  });

  it('points the Kanzlei to the bank statement for a withdrawal from the account', () => {
    const q = draftWith(ENTNAHME, { entnahmeAus: 'konto', kassenbuchGeld: null }, END);
    expect(asked(q)).not.toContain('kassenbuchGeld');
    expect(asked(q)).not.toContain('kassenBezeichnung');
    expect(hintIds(q)).toContain('geldUeberKonto');
    sealsCleanly(q);
  });

  it('flags cash that is not in the Kassenbuch on the day', () => {
    expect(hintIds(draftWith(ENTNAHME, { kassenbuchGeld: false }))).toContain(
      'kassenbuchGeldFehlt',
    );
    expect(hintIds(draftWith(PARKEN, { kassenbuch: false }))).toContain('kassenbuchFehlt');
    expect(hintIds(draftWith(TRANSIT, { bankbeleg: false }))).toContain('keinBankbeleg');
  });
});

describe('a GmbH has no Privatentnahme', () => {
  it('shows the issuer a note and gives the Kanzlei a check hint, but does not block', () => {
    const q = draftWith(ENTNAHME, { rechtsform: 'kapitalgesellschaft' });
    expect(asked(q)).toContain('hinweisKapitalgesellschaft');
    expect(sealed(q)).toMatchObject({ ok: false, code: 'missingRequired' });
    const confirmed = draftWith(
      ENTNAHME,
      { rechtsform: 'kapitalgesellschaft', hinweisKapitalgesellschaft: 'verstanden' },
      END,
    );
    expect(excluded(confirmed)).toEqual([]);
    expect(hintIds(confirmed)).toContain('privatentnahmeKapitalgesellschaft');
    sealsCleanly(confirmed);
  });

  it('flags an Einlage in a GmbH, and nothing for a sole trader or partnership', () => {
    const gmbh = draftWith(EINLAGE, {
      rechtsform: 'kapitalgesellschaft',
      hinweisKapitalgesellschaft: 'verstanden',
    });
    expect(hintIds(gmbh)).toContain('einlageKapitalgesellschaft');
    expect(hintIds(gmbh)).not.toContain('privatentnahmeKapitalgesellschaft');
    for (const rechtsform of ['einzelunternehmen', 'personengesellschaft']) {
      const q = draftWith(EINLAGE, { rechtsform });
      expect(asked(q)).not.toContain('hinweisKapitalgesellschaft');
      expect(hintIds(q).filter((id) => id.includes('Kapitalgesellschaft'))).toEqual([]);
    }
    expect(hintIds(draftWith(EINLAGE, { rechtsform: 'andere' }))).toContain('rechtsformAndere');
  });

  it('takes the Rechtsform from the bookmark link once the question appears', () => {
    const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), ROLE));
    const filled = fillMasterData(entered, {
      firma: 'Beispiel GmbH',
      rechtsform: 'kapitalgesellschaft',
    });
    if (!filled.ok) throw new Error('no draft');
    let s = filled.session;
    expect(value(s, 'rechtsform')).toBeUndefined();
    s = must(answer(s, 'vorgangsart', 'privatentnahme'));
    expect(value(s, 'rechtsform')).toBe('kapitalgesellschaft');
    expect(filledFromLink(s, 'rechtsform')).toBe(true);
    expect(questions(s)).toContain('hinweisKapitalgesellschaft');
  });
});

describe('exclusions', () => {
  it.each(['eigeneVerpflegung', 'kilometer', 'lohn', 'spende'])(
    '%s blocks sealing and passing on',
    (art) => {
      const q = draftWith(PARKEN, { artAusgabe: art }, END);
      expect(excluded(q)).toEqual([art]);
      expect(sealed(q)).toMatchObject({ ok: false, code: 'outOfScope' });
    },
  );

  it('blocks when the issuer already has a Zweitschrift', () => {
    const q = draftWith(PARKEN, { grundOhneOriginal: 'verloren', zweitschrift: 'erhalten' }, END);
    expect(excluded(q)).toEqual(['zweitschriftErhalten']);
    expect(sealed(q)).toMatchObject({ ok: false, code: 'outOfScope' });
  });

  it('lifts an exclusion when the kind changes to a cash event', () => {
    const q = draftWith(PARKEN, { artAusgabe: 'lohn' });
    expect(excluded(q)).toEqual(['lohn']);
    const switched = ok(setValue(q, form, ROLE, 'vorgangsart', 'einlage'));
    expect(excluded(switched)).toEqual([]);
  });

  it('asks for a Zweitschrift and notes when none was requested', () => {
    const q = draftWith(PARKEN, { grundOhneOriginal: 'verloren', zweitschrift: 'nein' }, END);
    expect(hintIds(q)).toEqual(
      expect.arrayContaining(['zweitschriftNichtVersucht', 'ticketAbrufbar']),
    );
    sealsCleanly(q);
  });
});

// Tobias 2026-11-04: Bewirtung stays selectable against the research recommendation, with a clear
// warning to the issuer and a hint for the Kanzlei.
describe('Bewirtung is selectable with a warning', () => {
  const BEWIRTUNG: Values = {
    artAusgabe: 'bewirtung',
    bewirtungHinweis: 'verstanden',
    bewirtungOrt: 'gaststaette',
    grundOhneOriginal: 'verloren',
    zweitschrift: 'vergeblich',
    zahlungsempfaenger: 'Gasthaus Beispiel',
    ortDerAusgabe: 'Gasthaus Beispiel, Musterstraße 1, Musterstadt',
    leistung: 'Mittagessen und Getränke für 3 Personen',
    betrieblicherAnlass: null,
    bewirtungAnlass: 'Besprechung des Auftrags Neubau Musterstraße',
    bewirtungTeilnehmer: 'Erika Musterfrau\nMax Mustermann, Beispiel GmbH',
    betrag: '86,40',
  };

  it('asks for the confirmation and the facts the law names instead of the general purpose', () => {
    const ids = asked(draftWith(PARKEN, { artAusgabe: 'bewirtung', betrieblicherAnlass: null }));
    expect(ids).toEqual(
      expect.arrayContaining([
        'bewirtungHinweis',
        'bewirtungOrt',
        'ortDerAusgabe',
        'vorgangsdatum',
        'bewirtungAnlass',
        'bewirtungTeilnehmer',
        'betrag',
      ]),
    );
    expect(ids).not.toContain('betrieblicherAnlass');
    expect(ids.indexOf('bewirtungHinweis')).toBe(ids.indexOf('artAusgabe') + 1);
  });

  it('states the warning in plain words: Gaststätte receipt, Zweitschrift, own home', () => {
    const field = form.definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'bewirtungHinweis');
    const text = `${field?.question ?? ''} ${field?.help ?? ''}`;
    for (const part of [
      '§ 4 Abs. 5 Satz 1 Nr. 2 EStG',
      'Zweitschrift',
      'eigenen Wohnung',
      'nicht abziehbar',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('is no exclusion: it seals once confirmed, and gives the Kanzlei hints', () => {
    const unconfirmed = draftWith(PARKEN, { ...BEWIRTUNG, bewirtungHinweis: null }, END);
    expect(excluded(unconfirmed)).toEqual([]);
    expect(sealed(unconfirmed)).toMatchObject({
      ok: false,
      code: 'missingRequired',
      detail: ['bewirtungHinweis'],
    });
    const q = draftWith(PARKEN, BEWIRTUNG, END);
    expect(hintIds(q)).toEqual(expect.arrayContaining(['bewirtung', 'bewirtungGaststaette']));
    sealsCleanly(q);
  });

  it('names a Bewirtung at home as private', () => {
    const q = draftWith(PARKEN, { ...BEWIRTUNG, bewirtungOrt: 'wohnung' });
    expect(hintIds(q)).toContain('bewirtungWohnung');
    expect(hintIds(q)).not.toContain('bewirtungGaststaette');
  });
});

describe('amounts', () => {
  // "ab 250 €": 250,00 raises the hint, 249,99 does not; never a block.
  it.each([
    ['249,99', false],
    ['250,00', true],
    ['250', true],
    ['1.000,00', true],
  ])('%s → check hint %s', (betrag, expected) => {
    const q = draftWith(PARKEN, { betrag }, END);
    expect(hintIds(q).includes('hoherBetrag')).toBe(expected);
    sealsCleanly(q);
  });

  it('says "ab 250 €" in the hint', () => {
    const hint = form.definition.checkHints?.find((h) => h.id === 'hoherBetrag');
    expect(hint?.message).toContain('ab 250 €');
  });

  it('does not apply the expense limit to cash events', () => {
    expect(hintIds(draftWith(TRANSIT, { geldBetrag: '5.000,00' }))).not.toContain('hoherBetrag');
  });

  it('asks the recipient of a gift and flags a gift over 50 €', () => {
    const gift = (betrag: string) =>
      draftWith(
        PARKEN,
        { artAusgabe: 'geschenk', geschenkEmpfaenger: 'Max Mustermann, Beispiel GmbH', betrag },
        END,
      );
    expect(asked(gift('50,00'))).toContain('geschenkEmpfaenger');
    expect(hintIds(gift('50,00'))).toContain('geschenkGesondert');
    expect(hintIds(gift('50,00'))).not.toContain('geschenkUeberFreigrenze');
    expect(hintIds(gift('50,01'))).toContain('geschenkUeberFreigrenze');
    sealsCleanly(gift('50,01'));
    const noRecipient = draftWith(PARKEN, { artAusgabe: 'geschenk' }, END);
    expect(sealed(noRecipient)).toMatchObject({ ok: false, detail: ['geschenkEmpfaenger'] });
  });

  it('asks currency, amount and conversion for a foreign currency', () => {
    const foreign = draftWith(
      PARKEN,
      { inEuro: false, waehrung: 'CHF', betragFremdwaehrung: '12,00', betrag: '12,80' },
      END,
    );
    expect(asked(foreign)).toEqual(
      expect.arrayContaining(['waehrung', 'betragFremdwaehrung', 'umrechnung']),
    );
    expect(hintIds(foreign)).toContain('fremdwaehrungOhneUmrechnung');
    const converted = ok(setValue(foreign, form, ROLE, 'umrechnung', 'Umgerechnet zum Tageskurs'));
    expect(hintIds(converted)).not.toContain('fremdwaehrungOhneUmrechnung');
    expect(currentPart(sealsCleanly(converted), ROLE)?.data.betragFremdwaehrung).toBe('12.00');
    expect(asked(draftWith(PARKEN))).not.toContain('waehrung');
  });

  it('suggests booking a privately paid expense as an Einlage', () => {
    const own = draftWith(PARKEN, { zahlungsart: 'barPrivat', kassenbuch: null }, END);
    expect(asked(own)).not.toContain('kassenbuch');
    expect(asked(own)).not.toContain('zahlungsnachweis');
    expect(hintIds(own)).toContain('privatBezahlt');
    sealsCleanly(own);
    const card = draftWith(PARKEN, {
      zahlungsart: 'karte',
      kassenbuch: null,
      zahlungsnachweis: false,
    });
    expect(hintIds(card)).toEqual(
      expect.arrayContaining(['unbarZuordnen', 'keinZahlungsnachweis']),
    );
  });
});

describe('voucher data', () => {
  it('seals without a Belegnummer and asks the Kanzlei to assign one', () => {
    const q = draftWith(PARKEN, { ausstellungsdatum: '16.10.2026' });
    expect(hintIds(q)).toContain('belegnummerFehlt');
    sealsCleanly(q);
  });

  it('takes 36 characters as the Belegnummer, not 37', () => {
    const q = draftWith(PARKEN);
    expect(setValue(q, form, ROLE, 'belegnummer', 'A'.repeat(36)).ok).toBe(true);
    expect(setValue(q, form, ROLE, 'belegnummer', 'A'.repeat(37))).toMatchObject({
      ok: false,
      code: 'invalidValue',
    });
  });

  it('refuses a transaction before 01.01.2025 and takes that day', () => {
    const early = draftWith(PARKEN, { vorgangsdatum: '31.12.2024' }, END);
    expect(sealed(early)).toMatchObject({ ok: false, code: 'outsideValidity' });
    expect(setValue(early, form, ROLE, 'vorgangsdatum', '31.12.2024')).toMatchObject({
      ok: true,
      warnings: ['validity.outside'],
    });
    sealsCleanly(draftWith(PARKEN, { vorgangsdatum: '01.01.2025' }, END));
  });

  it('flags a voucher written in a later month and one dated before the transaction', () => {
    const later = draftWith(PARKEN, { ausstellungsdatum: '03.11.2026' });
    expect(hintIds(later)).toContain('spaeterErstellt');
    expect(hintIds(draftWith(PARKEN, { ausstellungsdatum: '31.10.2026' }))).not.toContain(
      'spaeterErstellt',
    );
    expect(hintIds(later)).not.toContain('ausstellungVorVorgang');
    const before = draftWith(PARKEN, { ausstellungsdatum: '14.10.2026' });
    expect(hintIds(before)).toContain('ausstellungVorVorgang');
    expect(hintIds(before)).not.toContain('spaeterErstellt');
  });

  it('requires an explanation only for "aus einem anderen Grund"', () => {
    const other = draftWith(PARKEN, { grundOhneOriginal: 'andererGrund' }, END);
    expect(sealed(other)).toMatchObject({ ok: false, detail: ['grundErlaeuterung'] });
    sealsCleanly(
      ok(setValue(other, form, ROLE, 'grundErlaeuterung', 'Der Automat druckte nicht.')),
    );
  });
});

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(' ')}`);
  return result.session;
}

const value = (s: Session, id: string) => currentPart(s.questionnaire, ROLE)?.data[id];
const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));

describe('the interview as the issuer sees it', () => {
  it('shows an exclusion in the summary and refuses to sign', () => {
    let s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), ROLE));
    for (const [id, raw] of Object.entries({ ...BASE, ...PARKEN, artAusgabe: 'spende' })) {
      s = must(answer(s, id, raw));
    }
    const summary = summaryOf(s);
    expect(summary?.readyToSign).toBe(false);
    expect(summary?.outOfScope?.[0]).toContain('Zuwendungsbestätigung');
  });

  it('signs a Geldtransit after the four notices', () => {
    let s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), ROLE));
    for (const [id, raw] of Object.entries({ ...BASE, ...TRANSIT, ...END })) {
      s = must(answer(s, id, raw));
    }
    for (const id of NOTICES) s = acknowledge(s, id, true);
    expect(summaryOf(s)?.missingRequired).toEqual([]);
    const signed = must(
      sealSession(s, {
        nonce: 'e2'.repeat(16),
        systemNote: note(AT.local, AT.utc),
        signature: { method: 'typed', name: 'Erika Musterfrau' },
        now: AT,
      }),
    );
    expect(transmissionBlockers(signed.questionnaire, form)).toEqual([]);
    expect(currentPart(signed.questionnaire, ROLE)?.data.geldBetrag).toBe('1250.00');
  });
});
