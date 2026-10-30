// The new form drafts of 2026-10-30 through the engine: release of a tax return (spouse only at a
// joint assessment), monthly payroll report (taken over from last month), company car (questions
// per drive, both parts sealable). Fictitious data.
import { join } from 'node:path';
import { missingRequired, visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { FieldValue, FormDefinition, Questionnaire } from '../../src/logic/model';
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
  const october = (fehlzeiten: Record<string, unknown>[] | null = null) =>
    seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', {
        abrechnungsmonat: '10.2026',
        leistungszeitraum: 'abrechnungsmonat',
        agFirma: 'Beispiel Bau GmbH',
        agBetriebsnummer: '12345678',
        abgabetag: '15',
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
          {
            rowId: 'r2',
            maName: 'Beispiel, Max',
            maVerguetungsart: 'monatsentgelt',
            maVerguetung: '2.400',
            maWochenstunden: '40',
            maScheidetAus: true,
          },
        ],
        fragZuschlaege: false,
        fragFehlzeiten: fehlzeiten !== null,
        ...(fehlzeiten === null ? {} : { fehlzeiten }),
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
  const november = (source: Questionnaire) => {
    const { questionnaire, reports } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', form),
      form,
      source,
      form,
    );
    return { data: currentPart(questionnaire, 'arbeitgeber')?.data ?? {}, report: reports[0] };
  };

  it('can be completed and signed', () => {
    expect(transmissionBlockers(october(), form)).toEqual([]);
  });

  it('moves the month on, keeps contacts and the deadline, drops leavers, empties monthly values', () => {
    const { data } = november(october());
    expect(data.abrechnungsmonat).toBe('2026-11');
    expect(data.unterzeichnerName).toBe('Jürgen Beispiel');
    expect(data.abgabetag).toBe('15');
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

  it('takes over absences that continue, with their start, and answers the question opening them', () => {
    const { data, report } = november(
      october([
        {
          rowId: 'r1',
          fzPerson: 'Musterfrau, Erika',
          fzArt: 'urlaub',
          fzVon: '12.10.2026',
          fzBis: '16.10.2026',
          fzArbeitstage: '5',
        },
        {
          rowId: 'r2',
          fzPerson: 'Beispiel, Max',
          fzArt: 'krank',
          fzVon: '27.10.2026',
          fzDauertAn: true,
          fzArbeitstage: '4',
          fzNachweis: 'eau',
        },
      ]),
    );
    expect(data.fragFehlzeiten).toBe(true);
    expect(data.fehlzeiten).toEqual([
      {
        rowId: 'r2',
        fzPerson: 'Beispiel, Max',
        fzArt: 'krank',
        fzVon: '2026-10-27',
        fzBis: null,
        fzDauertAn: null,
        fzArbeitstage: null,
        fzStunden: null,
        fzNachweis: 'eau',
        fzBemerkung: null,
      },
    ]);
    expect(report?.applied).toEqual(expect.arrayContaining(['fragFehlzeiten', 'fehlzeiten']));
    expect(report?.skipped).toEqual([]);
  });

  it('opens nothing when no absence continues', () => {
    const { data } = november(
      october([
        { rowId: 'r1', fzPerson: 'Musterfrau, Erika', fzArt: 'urlaub', fzVon: '12.10.2026' },
      ]),
    );
    expect(data.fragFehlzeiten ?? null).toBeNull();
    expect(data.fehlzeiten ?? null).toBeNull();
  });

  it('accepts the deadline as master data from the bookmark link', () => {
    const field = form.definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'abgabetag');
    expect(field?.masterData).toBe('abgabetag');
  });
});

describe('table row rule (carryRowsIf) — definition rules', () => {
  const raw = () =>
    structuredClone(readJson(join(DRAFTS_DIR, 'lohnmeldung', '0.1.0.json'))) as FormDefinition;
  const table = (d: FormDefinition, id: string) => {
    const field = d.sections.flatMap((s) => s.fields).find((f) => f.id === id);
    if (!field) throw new Error(`no field ${id}`);
    return field;
  };

  it('refuses a rule on a field that is no table, on a column of another table, or without takeover', () => {
    const notTable = raw();
    table(notTable, 'bemerkungen').carryRowsIf = { field: 'fzDauertAn', equals: true };
    expect(checkFormDefinition(notTable).map((i) => i.message)).toEqual(
      expect.arrayContaining(['only tables have carryRowsIf']),
    );
    const foreign = raw();
    table(foreign, 'zahlungen').carryRowsIf = { field: 'fzDauertAn', equals: true };
    expect(checkFormDefinition(foreign).map((i) => i.message)).toEqual(
      expect.arrayContaining(['"fzDauertAn" is not a column of this table']),
    );
    const notCarried = raw();
    table(notCarried, 'fehlzeiten').carryOver = false;
    expect(checkFormDefinition(notCarried).map((i) => i.message)).toEqual(
      expect.arrayContaining(['a table that is not taken over cannot filter its rows']),
    );
  });
});

describe('Dienstwagen draft — standard only', () => {
  const form = draft('dienstwagen');

  it('asks plug-in details only for plug-in hybrids and the 15 % question only with commuting', () => {
    const ids = (data: Record<string, FieldValue>) =>
      visibleFields(form.definition, 'arbeitgeber', data).map((f) => f.id);
    expect(ids({ agAntrieb: 'plugin' })).toEqual(expect.arrayContaining(['agCo2', 'agReichweite']));
    expect(ids({ agAntrieb: 'verbrenner' })).not.toContain('agCo2');
    expect(ids({ agFahrtenWohnung: true })).toContain('agPauschal15');
    expect(ids({ agFahrtenWohnung: false })).not.toContain('agPauschal15');
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
        agAnschaffung: '01.03.2026',
        agListenpreis: '48.900',
        agSonderausstattung: '2.100',
        agAntrieb: 'elektro',
        agErstUeberlassung: '01.04.2026',
        agUeberlassenAb: '01.04.2026',
        agPrivatnutzung: true,
        agFahrtenWohnung: true,
        agPauschal15: true,
        agSonderfaelle: ['keine'],
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
