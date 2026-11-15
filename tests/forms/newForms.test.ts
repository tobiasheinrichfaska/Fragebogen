// The new form drafts of 2026-10-30 through the engine (the tax-return consent has its own file,
// steuerfreigabe.test.ts): monthly payroll report (taken over from last month), company car (questions
// per drive, both parts sealable). Fictitious data.
import { join } from 'node:path';
import { answerSuggestions } from '../../src/logic/answerSuggestions';
import { displayValue, fillPlaceholders } from '../../src/logic/display';
import { missingRequired, visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { checkHints } from '../../src/logic/hints';
import type { FieldValue, FormDefinition, Questionnaire } from '../../src/logic/model';
import { prefillFrom } from '../../src/logic/prefill';
import {
  adoptFromOtherRoles,
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

// Tobias 2026-11-01: base = last month's report; a block per person with a calendar; Lohnart rows;
// hours only for an hourly wage; a notice confirmed once stays confirmed while its text is the same.
describe('Lohnmeldung draft — taken over from last month', () => {
  const form = draft('lohnmeldung');
  const october = (source: RegisteredForm = form) =>
    seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, source), source, 'arbeitgeber', {
        abrechnungsmonat: '10.2026',
        agFirma: 'Beispiel Bau GmbH',
        agBetriebsnummer: '12345671',
        mandantennummer: '99999',
        abgabetag: '15',
        ansprechpartner: 'Jürgen Beispiel',
        ansprechpartnerEmail: 'lohn@example.org',
        lohnarten: '1000 Stundenlohn\n2000 Nachtzuschlag 25 %',
        mitarbeitende: [
          {
            rowId: 'r1',
            maName: 'Musterfrau, Erika',
            maVerguetungsart: 'stundenlohn',
            maVerguetung: '14,50',
            maFehltage: ['2026-10-12:urlaub', '2026-10-13:halberUrlaub', '2026-10-27:krank'],
            maUrlaubStunden: '6',
            maKrankStunden: '8',
          },
          {
            rowId: 'r2',
            maName: 'Beispiel, Max',
            maVerguetungsart: 'monatsentgelt',
            maVerguetung: '2.400',
            maScheidetAus: true,
          },
        ],
        monatWerte: [
          {
            rowId: 'r1',
            monatPerson: 'Musterfrau, Erika',
            monatLohnart: '1000 Stundenlohn',
            monatWert: '100',
          },
        ],
        fragVormonat: false,
        besonderheiten: 'Max Beispiel scheidet zum 31.10.2026 aus.',
      }),
      source,
      'arbeitgeber',
      0,
      { acknowledged: ['abgabe', 'arbeitszeit'] },
    );
  const november = (source: Questionnaire, target: RegisteredForm = form) => {
    const { questionnaire, reports } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', target),
      target,
      source,
      form,
    );
    return { questionnaire, part: currentPart(questionnaire, 'arbeitgeber'), report: reports[0] };
  };

  it('can be completed and signed', () => {
    expect(transmissionBlockers(october(), form)).toEqual([]);
  });

  it('moves the month on, keeps the master data and the people, empties the monthly values', () => {
    const { part } = november(october());
    const data = part?.data ?? {};
    expect(data.abrechnungsmonat).toBe('2026-11');
    expect(data.ansprechpartner).toBe('Jürgen Beispiel');
    expect(data.mandantennummer).toBe('99999');
    expect(data.lohnarten).toBe('1000 Stundenlohn\n2000 Nachtzuschlag 25 %');
    expect(data.mitarbeitende).toEqual([
      {
        rowId: 'r1',
        maName: 'Musterfrau, Erika',
        maPersonalnummer: null,
        maVerguetungsart: 'stundenlohn',
        maVerguetung: '14.50',
        maVerguetungVormonat: '14.50',
        maAenderungAb: null,
        maScheidetAus: null,
        maFehltage: null,
        maUrlaubStunden: null,
        maKrankStunden: null,
      },
    ]);
    for (const id of ['monatWerte', 'vormonatWerte', 'besonderheiten']) {
      expect(data[id] ?? null).toBeNull();
    }
    expect(data.fragVormonat).toBe(false);
    expect(missingRequired(form.definition, 'arbeitgeber', data)).toEqual([]);
  });

  it('keeps the notices confirmed while their text is the same', () => {
    const { part, report } = november(october());
    expect(report?.notices).toEqual(['abgabe', 'arbeitszeit']);
    expect(part?.acknowledged).toEqual(['abgabe', 'arbeitszeit']);
  });

  it('asks again for a notice whose text changed', () => {
    const changed = structuredClone(readJson(join(DRAFTS_DIR, 'lohnmeldung', '0.1.0.json'))) as {
      version: string;
      infoBlocks: { id: string; text: string }[];
    };
    changed.version = '0.2.0';
    const abgabe = changed.infoBlocks.find((block) => block.id === 'abgabe');
    if (abgabe) abgabe.text += ' Neu: Abgabe auch per Datei.';
    const { report } = november(october(), registeredFrom(changed));
    expect(report?.notices).toEqual(['arbeitszeit']);
  });

  it('marks a pay that differs from last month', () => {
    const { questionnaire } = november(october());
    const rows = currentPart(questionnaire, 'arbeitgeber')?.data.mitarbeitende as Record<
      string,
      FieldValue
    >[];
    const raised = ok(
      setValue(questionnaire, form, 'arbeitgeber', 'mitarbeitende', [
        { ...rows[0], maVerguetung: '15,00', maAenderungAb: '01.11.2026' },
      ]),
    );
    const table = form.definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'mitarbeitende');
    if (!table) throw new Error('draft changed');
    const shown = displayValue(table, currentPart(raised, 'arbeitgeber')?.data.mitarbeitende);
    expect(shown).toContain('Im Vormonat: 14,50 € (geändert)');
  });

  it('asks the hours of absence only for an hourly wage', () => {
    const q = fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', {
      abrechnungsmonat: '11.2026',
      mitarbeitende: [
        {
          rowId: 'r1',
          maName: 'Beispiel, Max',
          maVerguetungsart: 'monatsentgelt',
          maVerguetung: '2.400',
          maFehltage: ['2026-11-03:krank'],
          maKrankStunden: '8',
        },
      ],
    });
    const row = (
      currentPart(q, 'arbeitgeber')?.data.mitarbeitende as Record<string, FieldValue>[]
    )[0];
    expect(row?.maFehltage).toEqual(['2026-11-03:krank']);
    expect(row?.maKrankStunden).toBeNull();
  });

  it('offers the employees and the Lohnarten as suggestions in the monthly rows', () => {
    const data = currentPart(october(), 'arbeitgeber')?.data ?? {};
    const columns = form.definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'monatWerte')?.columns;
    const person = columns?.find((c) => c.id === 'monatPerson');
    const lohnart = columns?.find((c) => c.id === 'monatLohnart');
    if (!person || !lohnart) throw new Error('draft changed');
    expect(answerSuggestions(form.definition, person, data)).toEqual([
      'Musterfrau, Erika',
      'Beispiel, Max',
    ]);
    expect(answerSuggestions(form.definition, lohnart, data)).toEqual([
      '1000 Stundenlohn',
      '2000 Nachtzuschlag 25 %',
    ]);
  });

  it('takes Firma, Mandantennummer, contact and Lohnarten from the bookmark link', () => {
    const keys = form.definition.sections
      .flatMap((s) => s.fields)
      .flatMap((f) => (f.masterData === undefined ? [] : [f.masterData]));
    expect(keys).toEqual(
      expect.arrayContaining([
        'firma',
        'betriebsnummer',
        'mandantennummer',
        'abgabetag',
        'ansprechpartner',
        'lohnarten',
      ]),
    );
  });

  // Tobias 2026-11-15: „30 reichen vorerst, erweitere aber vorsichtshalber auf 100“.
  it('takes up to 100 employees and 100 rows of values each month', () => {
    const start = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const people = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        rowId: `r${i + 1}`,
        maName: `Beispiel, Person ${i + 1}`,
        maVerguetungsart: 'monatsentgelt',
        maVerguetung: '2.400',
      }));
    expect(setValue(start, form, 'arbeitgeber', 'mitarbeitende', people(100)).ok).toBe(true);
    expect(setValue(start, form, 'arbeitgeber', 'mitarbeitende', people(101))).toMatchObject({
      ok: false,
    });
    const values = Array.from({ length: 100 }, (_, i) => ({
      rowId: `r${i + 1}`,
      monatPerson: `Beispiel, Person ${i + 1}`,
      monatLohnart: '1000 Stundenlohn',
      monatWert: '100',
    }));
    expect(setValue(start, form, 'arbeitgeber', 'monatWerte', values).ok).toBe(true);
    const fields = form.definition.sections.flatMap((section) => section.fields);
    expect(
      fields.filter((field) => field.type === 'repeatGroup').map((field) => field.maxRows),
    ).toEqual([100, 100, 100]);
    // Audit 2026-11-15: one row per person and wage type fills 100 rows soon; the help says where
    // the rest goes.
    for (const id of ['monatWerte', 'vormonatWerte']) {
      expect(fields.find((field) => field.id === id)?.help, id).toContain(
        'Reichen 100 Zeilen nicht',
      );
    }
  });

  // LM-5, Tobias 2026-11-15: „nein“ — the report is no reason to pay on last month's values.
  it('does not promise payroll on last month’s values when the report is missing', () => {
    expect(JSON.stringify(form.definition)).not.toContain('Werten des Vormonats');
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
    table(notTable, 'besonderheiten').carryRowsIf = { field: 'maScheidetAus', equals: true };
    expect(checkFormDefinition(notTable).map((i) => i.message)).toEqual(
      expect.arrayContaining(['only tables have carryRowsIf']),
    );
    const foreign = raw();
    table(foreign, 'monatWerte').carryRowsIf = { field: 'maScheidetAus', equals: true };
    expect(checkFormDefinition(foreign).map((i) => i.message)).toEqual(
      expect.arrayContaining(['"maScheidetAus" is not a column of this table']),
    );
    const notCarried = raw();
    table(notCarried, 'mitarbeitende').carryOver = false;
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
    // Review 2026-11-15 (DW-5): the purchase date decides only for electric and hybrid drives.
    expect(ids({ agAntrieb: 'verbrenner' })).not.toContain('agAnschaffung');
    expect(ids({ agAntrieb: 'elektro' })).toContain('agAnschaffung');
    const commuting = { agErsteTaetigkeitsstaette: 'ja' };
    expect(ids({ ...commuting, agFahrtenWohnung: true })).toContain('agPauschal15');
    expect(ids({ ...commuting, agFahrtenWohnung: false })).not.toContain('agPauschal15');
  });

  // DW-4, checked 2026-11-15 in BMF vom 03.03.2022 Rz. 19, 20 and BMF vom 05.11.2021 Rz. 22: the
  // employer's ban needs a record at the Lohnkonto, no paper; only the person's waiver is
  // „schriftlich“. For employees the first hand-over decides, not the purchase.
  it('asks where a ban is laid down, also for commuting, and wants paper only for a waiver', () => {
    const ids = (data: Record<string, FieldValue>) =>
      visibleFields(form.definition, 'arbeitgeber', data).map((f) => f.id);
    const place = { agErsteTaetigkeitsstaette: 'ja' };
    expect(ids({ ...place, agPrivatnutzung: true, agFahrtenWohnung: false })).toContain(
      'agNutzungsverbot',
    );
    expect(ids({ ...place, agPrivatnutzung: true, agFahrtenWohnung: true })).not.toContain(
      'agNutzungsverbot',
    );
    const ban = form.definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'agNutzungsverbot');
    const labels = ban?.options?.map((o) => o.label) ?? [];
    expect(labels.filter((label) => label.includes('Papier'))).toEqual([
      expect.stringContaining('Verzicht der Person'),
    ]);
    expect(ban?.help).toContain('als Datei');
    // Audit 2026-11-15: the help says the waiver is the one that needs paper.
    expect(ban?.help).toContain('einen Verzicht erklärt die Person auf Papier');
  });

  it('asks the purchase only without CO2, and the first hand-over for every electric drive', () => {
    const ids = (data: Record<string, FieldValue>) =>
      visibleFields(form.definition, 'arbeitgeber', data).map((f) => f.id);
    expect(ids({ agAntrieb: 'plugin' })).not.toContain('agAnschaffung');
    expect(ids({ agAntrieb: 'plugin' })).toContain('agErstUeberlassung');
    expect(ids({ agAntrieb: 'brennstoff' })).toEqual(
      expect.arrayContaining(['agAnschaffung', 'agErstUeberlassung']),
    );
  });

  // Tobias 2026-11-15 (DW-2): the employer decides the erste Tätigkeitsstätte (§ 9 Abs. 4 EStG), so
  // the employer names it; the person sees it in the question about the drives to work.
  it('lets the employer name the erste Tätigkeitsstätte and asks about drives only when there is one', () => {
    const ids = (data: Record<string, FieldValue>) =>
      visibleFields(form.definition, 'arbeitgeber', data).map((f) => f.id);
    expect(ids({ agErsteTaetigkeitsstaette: 'ja' })).toEqual(
      expect.arrayContaining(['agErsteTaetigkeitsstaetteAnschrift', 'agFahrtenWohnung']),
    );
    expect(ids({ agErsteTaetigkeitsstaette: 'keine' })).not.toContain(
      'agErsteTaetigkeitsstaetteAnschrift',
    );
    expect(ids({ agErsteTaetigkeitsstaette: 'keine', agFahrtenWohnung: true })).not.toEqual(
      expect.arrayContaining(['agFahrtenWohnung', 'agPauschal15']),
    );
  });

  // Review 2026-11-15 (DW-1): where the person starts only matters for drives to work.
  it('asks for the registered home only when the person drives to work with the car', () => {
    const ids = (data: Record<string, FieldValue>) =>
      visibleFields(form.definition, 'person', data).map((f) => f.id);
    expect(ids({ fahrtenWohnung: false })).not.toContain('wohnungMeldeanschrift');
    expect(ids({ fahrtenWohnung: true })).toContain('wohnungMeldeanschrift');
  });

  const EMPLOYER = {
    agFirma: 'Beispiel Bau GmbH',
    agFamilienname: 'Musterfrau',
    agVorname: 'Erika',
    agKennzeichen: 'KA-B 1234',
    agFahrzeug: 'Beispielmarke Modell E',
    agErstzulassung: '01.03.2026',
    agListenpreis: '48.900',
    agSonderausstattung: '2.100',
    agAntrieb: 'elektro',
    agAnschaffung: '01.03.2026',
    agErstUeberlassung: '01.04.2026',
    agUeberlassenAb: '01.04.2026',
    agPrivatnutzung: true,
    agErsteTaetigkeitsstaette: 'ja',
    agErsteTaetigkeitsstaetteAnschrift: 'Musterstraße 1, 12345 Musterstadt',
    agFahrtenWohnung: true,
    agPauschal15: true,
    agSonderfaelle: ['keine'],
  };

  it('seals the employer part and then the person part over it', () => {
    let q = seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', EMPLOYER),
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
        wohnungMeldeanschrift: true,
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

  it('shows the person the erste Tätigkeitsstätte the employer named', () => {
    const employer = seal(
      fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', EMPLOYER),
      form,
      'arbeitgeber',
      0,
    );
    const person = adoptFromOtherRoles(ok(startPart(employer, form, 'person')), form, 'person');
    expect(person.adopted).toContain('ersteTaetigkeitsstaette');
    const data = currentPart(person.questionnaire, 'person')?.data ?? {};
    const fields = new Map(
      form.definition.sections.flatMap((section) => section.fields).map((f) => [f.id, f]),
    );
    expect(
      fillPlaceholders(
        fields.get('fahrtenWohnung')?.question ?? '',
        (id) => fields.get(id),
        (id) => data[id],
      ),
    ).toBe(
      'Fahren Sie mit dem Dienstwagen zwischen Ihrer Wohnung und Ihrer ersten Tätigkeitsstätte „Musterstraße 1, 12345 Musterstadt“?',
    );
  });

  // Audit 2026-11-15: a person may fill in first, so the person is asked about drives to work; what
  // contradicts the employer's answer now reaches the Kanzlei as a check hint.
  describe('drives to work the employer did not allow or has no place for', () => {
    const hintsFor = (employer: Record<string, FieldValue>, drives: boolean) => {
      let q = seal(
        fill(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber', employer),
        form,
        'arbeitgeber',
        0,
      );
      q = fill(q, form, 'person', {
        familienname: 'Musterfrau',
        vorname: 'Erika',
        fahrtenWohnung: drives,
        ...(drives ? { wohnungMeldeanschrift: true, entfernungKm: '30' } : {}),
      });
      return checkHints(q, form.definition).map((hint) => hint.id);
    };
    const noPlace: Record<string, FieldValue> = { ...EMPLOYER, agErsteTaetigkeitsstaette: 'keine' };
    delete noPlace.agErsteTaetigkeitsstaetteAnschrift;
    delete noPlace.agFahrtenWohnung;
    delete noPlace.agPauschal15;
    const banned: Record<string, FieldValue> = {
      ...EMPLOYER,
      agFahrtenWohnung: false,
      agNutzungsverbot: 'arbeitsvertrag',
    };
    delete banned.agPauschal15;

    it('names a drive to work without an erste Tätigkeitsstätte', () => {
      expect(hintsFor(noPlace, true)).toContain('fahrtenOhneErsteTaetigkeitsstaette');
      expect(hintsFor(noPlace, false)).not.toContain('fahrtenOhneErsteTaetigkeitsstaette');
    });

    it('names a drive to work the employer has not allowed', () => {
      expect(hintsFor(banned, true)).toContain('fahrtenTrotzVerbot');
      expect(hintsFor(banned, false)).not.toContain('fahrtenTrotzVerbot');
      expect(hintsFor(EMPLOYER, true)).not.toContain('fahrtenTrotzVerbot');
    });

    it('does not tell the person the employer fills in a place he said there is none of', () => {
      const help = form.definition.sections
        .flatMap((s) => s.fields)
        .find((f) => f.id === 'ersteTaetigkeitsstaette')?.help;
      expect(help).toContain('Haben Sie keine');
      expect(help).not.toContain('trägt es ein');
    });
  });
});
