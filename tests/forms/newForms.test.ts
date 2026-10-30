// The new form drafts of 2026-10-30 through the engine: release of a tax return (spouse only at a
// joint assessment), monthly payroll report (taken over from last month), company car (questions
// per drive, both parts sealable). Fictitious data.
import { join } from 'node:path';
import { missingRequired, visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import type { Questionnaire } from '../../src/logic/model';
import { prefillFrom } from '../../src/logic/prefill';
import {
  createQuestionnaire,
  currentPart,
  receivedPartFor,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID, STROKES } from '../support/sample';

const draft = (id: string): RegisteredForm =>
  registeredFrom(readJson(join(DRAFTS_DIR, id, '0.1.0.json')));

const at = (minute: number) => ({
  local: `2026-10-30T11:${String(minute).padStart(2, '0')}:00.000+01:00`,
  utc: `2026-10-30T10:${String(minute).padStart(2, '0')}:00.000Z`,
});

function fill(
  q: Questionnaire,
  form: RegisteredForm,
  role: string,
  values: Record<string, unknown>,
) {
  return Object.entries(values).reduce(
    (acc, [id, raw]) => ok(setValue(acc, form, role, id, raw)),
    ok(startPart(q, form, role)),
  );
}

function seal(
  q: Questionnaire,
  form: RegisteredForm,
  role: string,
  minute: number,
  extra: { acknowledged?: string[]; bind?: string } = {},
) {
  const t = at(minute);
  const bound = extra.bind === undefined ? undefined : currentPart(q, extra.bind);
  return ok(
    sealPart(q, form, role, {
      nonce: (minute + 10).toString(16).padStart(2, '0').repeat(16),
      systemNote: note(t.local, t.utc),
      acknowledged: extra.acknowledged ?? [],
      signature: { method: 'drawn', strokes: STROKES },
      ...(bound ? { receivedParts: [receivedPartFor(bound, t, 'same-device')] } : {}),
    }),
  );
}

describe('Steuerfreigabe draft', () => {
  const form = draft('steuerfreigabe');
  const kanzlei = (veranlagung: string) =>
    seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'kanzlei', {
        mandantNameKanzlei: 'Erika Musterfrau',
        steuerjahr: '2025',
        erklaerungen: ['est'],
        erklaerungArt: 'erstmalig',
        veranlagung,
        ...(veranlagung === 'zusammen' ? { ehegatteNameKanzlei: 'Max Mustermann' } : {}),
        ergebnis: 'erstattung',
        betrag: '1.234,56',
        vorgelegt: ['formular', 'berechnung'],
        vorlageBezeichnung: 'ESt 2025, Stand 28.10.2026, 34 Seiten',
        vorlageDatum: '28.10.2026',
      }),
      form,
      'kanzlei',
      0,
    );
  const mandant = (q: Questionnaire) =>
    seal(
      fill(q, form, 'mandant', {
        mandantName: 'Erika Musterfrau',
        mandantGeprueft: true,
        mandantVollstaendig: true,
        mandantEntscheidung: 'zustimmung',
      }),
      form,
      'mandant',
      5,
      { acknowledged: ['freigabeHinweis'], bind: 'kanzlei' },
    );

  it('is complete with the client alone at a single assessment', () => {
    const q = mandant(kanzlei('einzel'));
    expect(transmissionBlockers(q, form)).toEqual([]);
    expect(completenessGaps(q, form)).toEqual([]);
  });

  it('needs the spouse at a joint assessment, bound to the current Kanzlei version', () => {
    const q = mandant(kanzlei('zusammen'));
    expect(transmissionBlockers(q, form).map((b) => b.code)).toEqual(['conditionalRoleMissing']);
    const withSpouse = seal(
      fill(q, form, 'ehegatte', {
        ehegatteName: 'Max Mustermann',
        ehegatteGeprueft: true,
        ehegatteEntscheidung: 'zustimmung',
      }),
      form,
      'ehegatte',
      9,
      { acknowledged: ['freigabeHinweisEhegatte'], bind: 'kanzlei' },
    );
    expect(transmissionBlockers(withSpouse, form)).toEqual([]);
    expect(completenessGaps(withSpouse, form)).toEqual([]);
  });

  it('asks what to change when the client does not agree yet', () => {
    const ids = visibleFields(form.definition, 'mandant', { mandantEntscheidung: 'aendern' }).map(
      (f) => f.id,
    );
    expect(ids).toContain('mandantAenderung');
  });
});

describe('Lohnmeldung draft — taken over from last month', () => {
  const form = draft('lohnmeldung');
  const october = () =>
    seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', {
        abrechnungsmonat: '10.2026',
        leistungszeitraum: 'abrechnungsmonat',
        agFirma: 'Beispiel Bau GmbH',
        agBetriebsnummer: '12345678',
        ansprechpartner: 'Jürgen Beispiel',
        ansprechpartnerEmail: 'lohn@example.org',
        unterzeichnerName: 'Jürgen Beispiel',
        mitarbeitende: [
          {
            rowId: 'r1',
            maName: 'Musterfrau, Erika',
            maVerguetungsart: 'stundenlohn',
            maVerguetung: '14,50',
            maWochenstunden: '9',
            maArbeitsstunden: '38,5',
            maZeitkonto: '-2,5',
          },
        ],
        fragZuschlaege: false,
        fragFehlzeiten: true,
        fehlzeiten: [
          { rowId: 'r1', fzPerson: 'Musterfrau, Erika', fzArt: 'urlaub', fzVon: '12.10.2026' },
        ],
        fragZahlungen: false,
        fragEinAustritte: false,
        fragAenderungen: false,
        fragPfaendung: false,
      }),
      form,
      'arbeitgeber',
      0,
      { acknowledged: ['abgabe', 'arbeitszeit'] },
    );

  it('can be completed and signed', () => {
    expect(transmissionBlockers(october(), form)).toEqual([]);
  });

  it('moves the month on, keeps people and contacts, leaves every monthly value empty', () => {
    const { questionnaire } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', form),
      form,
      october(),
      form,
    );
    const data = currentPart(questionnaire, 'arbeitgeber')?.data ?? {};
    expect(data.abrechnungsmonat).toBe('2026-11');
    expect(data.unterzeichnerName).toBe('Jürgen Beispiel');
    expect(data.mitarbeitende).toEqual([
      {
        rowId: 'r1',
        maPersonalnummer: null,
        maName: 'Musterfrau, Erika',
        maVerguetungsart: 'stundenlohn',
        maVerguetung: '14.50',
        maWochenstunden: '9.00',
        maAenderungAb: null,
        maArbeitsstunden: null,
        maFeiertagsstunden: null,
        maUeberstunden: null,
        maZeitkonto: null,
        maScheidetAus: null,
        maBemerkung: null,
      },
    ]);
    for (const id of ['fragFehlzeiten', 'fehlzeiten', 'fragZuschlaege', 'fragPfaendung']) {
      expect(data[id] ?? null).toBeNull();
    }
    expect(missingRequired(form.definition, 'arbeitgeber', data).sort()).toEqual(
      [
        'fragAenderungen',
        'fragEinAustritte',
        'fragFehlzeiten',
        'fragPfaendung',
        'fragZahlungen',
        'fragZuschlaege',
      ].sort(),
    );
  });
});

describe('Dienstwagen draft', () => {
  const form = draft('dienstwagen');

  it('asks charging questions only for electric and plug-in cars', () => {
    const ids = (antrieb: string) =>
      visibleFields(form.definition, 'arbeitgeber', { agAntrieb: antrieb }).map((f) => f.id);
    expect(ids('elektro')).toEqual(expect.arrayContaining(['agHeimladenErstattung', 'agWallbox']));
    expect(ids('plugin')).toEqual(expect.arrayContaining(['agCo2', 'agReichweite']));
    expect(ids('verbrenner')).not.toContain('agWallbox');
  });

  it('seals the employer part and then the person part over it', () => {
    let q = seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', {
        agFirma: 'Beispiel Bau GmbH',
        agFamilienname: 'Musterfrau',
        agVorname: 'Erika',
        agKennzeichen: 'KA-B 1234',
        agFahrzeug: 'Beispielmarke Modell E',
        agErstzulassung: '01.03.2026',
        agFahrzeugHerkunft: 'geleast',
        agAnschaffung: '01.03.2026',
        agListenpreis: '48.900',
        agSonderausstattung: '2.100',
        agAntrieb: 'elektro',
        agErstUeberlassung: '01.04.2026',
        agUeberlassenAb: '01.04.2026',
        agUeberlassungsart: 'dauerhaft',
        agPrivatnutzung: true,
        agFahrtenWohnung: true,
        agTaetigkeitsstaette: 'Musterweg 2, 12345 Musterstadt',
        agTageVorOrt: '3',
        agPauschal15: false,
        agEinzelbewertungAusgeschlossen: false,
        agNutzerAnzahl: 'allein',
        agMaut: false,
        agMethodeAbJahr: '2026',
        agMethode: 'pauschal',
        agMethodeWohnung: 'einzeln',
        agNutzungsentgelt: ['nichts'],
        agLadenBetrieb: true,
        agHeimladenErstattung: true,
        agHeimladenAbrechnung: 'pauschale',
        agOeffentlichLaden: false,
        agWallbox: 'ueberlassen',
      }),
      form,
      'arbeitgeber',
      0,
    );
    expect(
      missingRequired(form.definition, 'arbeitgeber', currentPart(q, 'arbeitgeber')?.data ?? {}),
    ).toEqual([]);
    q = seal(
      fill(q, form, 'person', {
        familienname: 'Musterfrau',
        vorname: 'Erika',
        fahrtenWohnung: true,
        entfernungKm: '23',
        mehrereWohnungen: false,
        teilstrecke: false,
        einzelbewertungAntrag: true,
        einzelbewertungZusage: true,
        ladenZuhause: true,
        ladezaehler: true,
        stromtarif: 'fest',
      }),
      form,
      'person',
      5,
      { acknowledged: ['datenschutz', 'pflichten'], bind: 'arbeitgeber' },
    );
    expect(transmissionBlockers(q, form)).toEqual([]);
    expect(completenessGaps(q, form)).toEqual([]);
    expect(currentPart(q, 'person')?.data.entfernungKm).toBe('23');
  });
});
