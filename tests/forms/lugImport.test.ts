// Import file for a payroll program and the Erfassungsblatt (Tobias 2026-10-30), with a fictitious
// mapping — the real DATEV mapping stays out of the public repo. Fictitious data.
import { join } from 'node:path';
import mappingsRaw from '../fixtures/export/beispiel.json';
import { encodeWindows1252 } from '../../src/io/windows1252';
import {
  checkExportMapping,
  inputProblem,
  mappingFor,
  parseExportMappings,
  subFields,
  type ExportMapping,
} from '../../src/logic/exportMapping';
import { buildLugImport, neededInputs } from '../../src/logic/lugImport';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
const { definition } = form;

function mapping(): ExportMapping {
  const parsed = parseExportMappings(structuredClone(mappingsRaw));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  const first = parsed.mappings[0];
  if (!first) throw new Error('no mapping');
  return first;
}

type Answers = Record<string, unknown>;
function filled(role: string, values: Answers, base: Questionnaire): Questionnaire {
  let q = ok(startPart(base, form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

const PERSON: Answers = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  geschlecht: 'weiblich',
  deutscheStaatsangehoerigkeit: true,
  anschriftAusland: true,
  anschriftStaat: 'Österreich',
  wohnort: 'Wien',
  zahlungsweg: 'ueberweisung',
  iban: 'DE89 3704 0044 0532 0130 00',
  weitereBeschaeftigung: false,
  krankenversicherung: 'gesetzlich',
  krankenkasse: 'Muster-BKK',
};
const EMPLOYER: Answers = {
  agPersonalnummer: '42',
  agBeschaeftigungsbeginn: '02.11.2026',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2.500,00',
  agBeschaeftigungsart: 'svpflichtig',
  agTaetigkeit: 'Verkauf; Kasse',
};

const withoutKey = (answers: Answers, key: string): Answers =>
  Object.fromEntries(Object.entries(answers).filter(([k]) => k !== key));

function questionnaire(person: Answers = PERSON, employer: Answers = EMPLOYER): Questionnaire {
  const base = createQuestionnaire(QUESTIONNAIRE_ID, form);
  return filled('arbeitgeber', employer, filled('person', person, base));
}

describe('export mapping', () => {
  it('decodes the example and fits the Personalfragebogen', () => {
    expect(checkExportMapping(mapping(), definition)).toEqual([]);
  });

  it('refuses unknown keys, a missing or a second source and a bad slice', () => {
    const raw = structuredClone(mappingsRaw) as unknown as Record<string, unknown>[];
    const record = (raw[0]?.records as Record<string, unknown>[])[0] as Record<string, unknown>;
    (record.fields as Record<string, unknown>[])[0] = {
      name: 'X',
      values: [{ field: 'familienname', const: 'zwei' }],
      extra: true,
    };
    const parsed = parseExportMappings(raw);
    expect(parsed.ok).toBe(false);
    const messages = parsed.ok ? [] : parsed.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'unknown property',
        'needs exactly one of field, derivation, const, blank, input, first',
      ]),
    );
    expect(parseExportMappings([{ ...raw[0], version: 2 }]).ok).toBe(false);
  });

  it('checks fields, proposals, list codes and the number of sub-fields against the form', () => {
    const broken: ExportMapping = {
      ...mapping(),
      records: [
        {
          mask: 'X',
          fields: [
            { name: 'A', values: [{ field: 'gibtsNicht' }] },
            { name: 'B', values: [{ derivation: 'gibtsNicht' }] },
            { name: 'C', values: [{ field: 'wohnort', code: 'schluessel' }] },
            { name: 'D(x;y)', values: [{ field: 'wohnort' }] },
            { name: 'E', values: [{ field: 'weitereJobs' }] },
          ],
        },
      ],
    };
    const messages = checkExportMapping(broken, definition).map((i) => i.message);
    expect(messages).toEqual([
      'unknown field "gibtsNicht"',
      'unknown derivation "gibtsNicht"',
      '"wohnort" has no list code "schluessel"',
      '"D(x;y)" has 2 sub-field(s), 1 value(s) given',
      '"weitereJobs" is a table',
    ]);
  });

  it('checks inputs: references, the fields they show and their conditions', () => {
    const base = mapping();
    const broken: ExportMapping = {
      ...base,
      inputs: [
        ...(base.inputs ?? []),
        {
          id: 'extra',
          label: 'X',
          digits: [1, 2],
          context: ['gibtsNicht'],
          when: { field: 'auchNicht', equals: 'a' },
        },
        // Prefilled from another input: could go round in circles.
        { id: 'loop', label: 'L', digits: [1, 1], defaultFrom: { input: 'extra' } },
      ],
      records: [{ mask: 'X', fields: [{ name: 'A', values: [{ input: 'unbekannt' }] }] }],
    };
    expect(checkExportMapping(broken, definition).map((i) => i.message)).toEqual([
      'unknown field "auchNicht"',
      'unknown field "gibtsNicht"',
      'cannot come from an input',
      'unknown input "unbekannt"',
    ]);
  });

  it('refuses inputs with two kinds, a default that does not fit, twice the same id, deep nesting', () => {
    const raw = structuredClone(mappingsRaw) as unknown as Record<string, unknown>[];
    const first = raw[0] as Record<string, unknown>;
    first.inputs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', digits: [8, 8], default: '123' },
      { id: 'b', label: 'B2', digits: [1, 1] },
    ];
    const record = (first.records as Record<string, unknown>[])[0] as Record<string, unknown>;
    (record.fields as Record<string, unknown>[])[0] = {
      name: 'X',
      values: [{ first: [{ first: [{ first: [{ const: 'x' }] }] }] }],
    };
    const parsed = parseExportMappings(raw);
    const messages = parsed.ok ? [] : parsed.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'needs digits or options',
        'does not fit digits or options',
        'input ids must be unique',
        'nested too deeply',
      ]),
    );
  });

  it('is meant for one form version only when it names one', () => {
    const base = mapping();
    expect(mappingFor(base, definition)).toBe(true);
    const other = { ...base, formVersion: '9.9.9' };
    expect(mappingFor(other, definition)).toBe(false);
    expect(checkExportMapping(other, definition).map((i) => i.path)).toContain('$.form');
    expect(mappingFor({ ...base, formVersion: definition.version }, definition)).toBe(true);
  });

  it('names the Kanzlei input problems in German', () => {
    expect(inputProblem({ id: 'a', label: 'A', digits: [8, 8] }, '1234')).toBe('genau 8 Ziffern');
    expect(inputProblem({ id: 'a', label: 'A', digits: [1, 4] }, '12a')).toBe('1 bis 4 Ziffern');
    expect(inputProblem({ id: 'a', label: 'A', digits: [1, 4] }, '2000')).toBeUndefined();
    const list = { id: 'a', label: 'A', options: [{ value: 'ib', label: 'Baden' }] };
    expect(inputProblem(list, 'ib')).toBeUndefined();
    expect(inputProblem(list, 'xx')).toBe('bitte aus der Liste wählen');
    // With digits the list only suggests: a number missing from it is accepted.
    const kasse = { ...list, digits: [8, 8] as [number, number] };
    expect(inputProblem(kasse, '12345678')).toBeUndefined();
    expect(inputProblem(kasse, 'ib')).toBe('genau 8 Ziffern');
  });

  it('splits combination fields into their sub-fields, nested ones too', () => {
    expect(subFields('Land(Kennzeichen;Name)')).toEqual(['Kennzeichen', 'Name']);
    expect(subFields('T(Gueltig_ab;A(B;C);D)')).toEqual(['Gueltig_ab', 'B', 'C', 'D']);
    expect(subFields('Ort')).toEqual(['Ort']);
  });
});

describe('import file', () => {
  const result = buildLugImport(questionnaire(), definition, mapping(), {
    mandantennummer: '123',
    mode: 'neu',
  });
  const lines = (result.text ?? '').split('\r\n');

  it('writes the header, the record descriptions and the client', () => {
    expect(result.blocking).toEqual([]);
    expect(lines.slice(0, 3)).toEqual(['[Allgemein]', 'Ziel=LuG', 'VersionImportDatei=1.0']);
    expect(lines).toContain('Datumsformat=TT.MM.JJJJ');
    expect(lines).toContain(
      '1000;Beispiel|Personal|Name;Nachname;Vorname;Land(Kennzeichen;Name);Ort',
    );
    expect(lines).toContain('[Mandant]');
    expect(lines).toContain('12;123');
  });

  it('creates the employee in a section of its own, then selects it and writes the records', () => {
    const first = lines.indexOf('[Mitarbeiter]');
    expect(lines[first + 1]).toBe('13;42;Musterfrau;Erika;02.11.2026;11/2026');
    expect(lines).toContain('14;42');
    expect(lines.lastIndexOf('[Mitarbeiter]')).toBeGreaterThan(first);
    expect(result.employee).toEqual({
      number: '42',
      source: 'form',
      name: 'Musterfrau',
      firstName: 'Erika',
      start: '02.11.2026',
    });
  });

  it('formats dates, months, decimals, codes, mapped choices and proposals', () => {
    expect(lines).toContain('1000;Musterfrau;Erika;A;Österreich;Wien');
    expect(lines).toContain('1001;17.05.1990;w;000;');
    expect(lines).toContain('1002;11/2026;1;1;1;1');
    expect(lines).toContain('1003;DE89370400440532013000;SEPA');
    expect(lines).toContain('1004;2500,00;"Verkauf; Kasse"');
  });

  // Regression 2026-11-01: a free entry used to give an empty code silently, so a `first` with a
  // fallback (German nationality "000") would have exported the wrong state.
  it('names a free entry where a list code is needed and never falls back past it', () => {
    const other = (nationality: string) =>
      buildLugImport(
        questionnaire({
          ...PERSON,
          deutscheStaatsangehoerigkeit: false,
          andereStaatsangehoerigkeit: nationality,
        }),
        definition,
        mapping(),
        { mandantennummer: '123', mode: 'neu' },
      );
    const free = other('sowjetisch');
    expect(free.problems.join(' ')).toContain(
      '„sowjetisch“ steht nicht in der Liste – bitte von Hand eintragen',
    );
    expect(free.text ?? '').not.toContain(';w;000');
    expect((other('türkisch').text ?? '').split('\r\n')).toContain('1001;17.05.1990;w;163;');
  });

  it('leaves out records whose condition does not hold', () => {
    expect(result.text).not.toContain('Beispiel|Minijob');
  });

  it('lists every mapped value in the Erfassungsblatt, in the order of the masks', () => {
    expect(result.sheet.map((row) => row.mask)[0]).toBe('Beispiel|Personal|Name');
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|SV|Gruppen',
      field: 'Beitragsgruppen › KV',
      value: '1',
    });
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|Personal|Name',
      field: 'Land › Kennzeichen',
      value: 'A',
    });
  });

  it('names a value without a mapping and leaves the field out', () => {
    const bar = buildLugImport(
      questionnaire(withoutKey({ ...PERSON, zahlungsweg: 'bar' }, 'iban')),
      definition,
      mapping(),
      { mandantennummer: '123', mode: 'neu' },
    );
    // The answer is named as the person read it, not by its stored id.
    expect(bar.problems.join(' ')).toContain('für „bar (so vereinbart)“ gibt es keine Zuordnung');
    expect(bar.text).not.toContain(';SEPA');
  });

  it('names an open proposal and leaves the whole combination field out', () => {
    const q = filled('arbeitgeber', EMPLOYER, createQuestionnaire(QUESTIONNAIRE_ID, form));
    const open = buildLugImport(q, definition, mapping(), {
      mandantennummer: '123',
      mitarbeiternummer: '7',
      mode: 'neu',
    });
    expect(open.problems.join(' ')).toContain('Vorschlag „Beitragsgruppen (KV RV AV PV)“ fehlt');
    expect(open.sheet.find((row) => row.field === 'Beitragsgruppen › KV')?.problem).toBeDefined();
    // Without the person part the new employee has no name: no file.
    expect(open.text).toBeUndefined();
    expect(open.blocking).toContain('Für die Neuanlage fehlt: Familienname.');
  });

  it('leaves out a record whose key only the user knows (wage type) and says so', () => {
    expect(result.text).not.toContain('Beispiel|Bezug');
    expect(result.problems).toContain(
      'Beispiel|Bezug: „Lohnart“ selbst erfassen – Datensatz nicht übertragen',
    );
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|Bezug',
      field: 'Lohnart',
      value: '',
      problem: 'selbst erfassen',
    });
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|Bezug',
      field: 'Betrag',
      value: '2500,00',
    });
  });

  it('leaves out a combination field with such a gap, but writes the rest of the record', () => {
    expect(result.problems).toContain(
      'Beispiel|Vertrag – Beitrag: unvollständig, nicht übertragen',
    );
    expect(lines).toContain('1005;Beispiel|Vertrag;Ort');
    expect(lines).toContain('1005;Wien');
  });

  it('leaves out a history field without its value, silently (the month alone is no value)', () => {
    expect(result.text).not.toContain('Beispiel|Historie');
    expect(result.problems.join(' ')).not.toContain('Nummer');
    const withNumber = buildLugImport(
      questionnaire({ ...PERSON, versicherungsnummer: '65 170839 J 003' }),
      definition,
      mapping(),
      { mandantennummer: '123', mode: 'neu' },
    );
    expect(withNumber.text).toContain('Beispiel|Historie;Nummer(Gueltig_ab;Nummer)');
    expect(withNumber.text).toContain(';11/2026;65170839J003');
  });

  it('writes no file without client and employee number', () => {
    const blocked = buildLugImport(
      questionnaire(PERSON, withoutKey(EMPLOYER, 'agPersonalnummer')),
      definition,
      mapping(),
      {},
    );
    expect(blocked.text).toBeUndefined();
    expect(blocked.blocking).toEqual([
      'Mandantennummer (1 bis 5 Ziffern) fehlt.',
      'Mitarbeiternummer fehlt: Der Fragebogen nennt keine Personalnummer. Bitte oben die Nummer aus dem Lohnprogramm eintragen (1 bis 5 Ziffern).',
      'Bitte wählen: Mitarbeiter neu anlegen oder vorhandenen Mitarbeiter ergänzen.',
    ]);
    expect(blocked.employee.source).toBe('none');
  });

  it('names a questionnaire number that does not fit, and takes an entered one instead', () => {
    const odd = questionnaire(PERSON, { ...EMPLOYER, agPersonalnummer: 'A-17' });
    const refused = buildLugImport(odd, definition, mapping(), {
      mandantennummer: '1',
      mode: 'neu',
    });
    expect(refused.blocking).toEqual([
      'Die Personalnummer laut Fragebogen („A-17“) passt nicht (1 bis 5 Ziffern). Bitte oben die Mitarbeiternummer aus dem Lohnprogramm eintragen.',
    ]);
    const entered = buildLugImport(odd, definition, mapping(), {
      mandantennummer: '1',
      mitarbeiternummer: '17',
      mode: 'neu',
    });
    expect(entered.blocking).toEqual([]);
    expect(entered.employee).toMatchObject({ number: '17', source: 'entered' });
  });

  it('asks before the download whether the number is free or belongs to this person', () => {
    expect(result.confirm).toBe(
      'Mitarbeiternummer 42 (aus dem Fragebogen): Ist sie in Beispielprogramm beim Mandanten 123 noch frei? Die Datei legt Musterfrau, Erika unter dieser Nummer neu an.',
    );
    const follow = buildLugImport(questionnaire(), definition, mapping(), {
      mandantennummer: '123',
      mitarbeiternummer: '42',
      mode: 'vorhanden',
    });
    expect(follow.confirm).toBe(
      'Gehört die Mitarbeiternummer 42 (eingetragen) in Beispielprogramm beim Mandanten 123 zu Musterfrau, Erika, Eintritt 02.11.2026? Die Datei überschreibt die Stammdaten dieses Mitarbeiters mit den Angaben des Fragebogens.',
    );
  });

  it('completes an existing employee without creating one (follow-up import)', () => {
    // Only the employer part: no name for a new employee, but none is needed to select one.
    const q = filled('arbeitgeber', EMPLOYER, createQuestionnaire(QUESTIONNAIRE_ID, form));
    const follow = buildLugImport(q, definition, mapping(), {
      mandantennummer: '123',
      mode: 'vorhanden',
    });
    expect(follow.blocking).toEqual([]);
    const text = (follow.text ?? '').split('\r\n');
    expect(text).toContain('14;42');
    expect(text.some((line) => line.startsWith('13;42'))).toBe(false);
    expect(text.filter((line) => line === '[Mitarbeiter]')).toHaveLength(1);
  });
});

describe('inputs of the Kanzlei', () => {
  it('asks only for the inputs of written records whose condition holds, with helpful answers', () => {
    const needed = neededInputs(questionnaire(), definition, mapping());
    expect(needed.map((n) => [n.input.id, n.value])).toEqual([
      ['lohnart', ''],
      ['kasse', ''],
      ['stelle', '7'],
    ]);
    expect(needed[1]?.context).toEqual([
      { label: 'Gesetzliche Krankenkasse', value: 'Muster-BKK' },
    ]);
  });

  it('prefills the insurer number from the list choice of the person; free text gives none', () => {
    const listed = questionnaire({ ...PERSON, krankenkasse: 'techniker krankenkasse' });
    expect(neededInputs(listed, definition, mapping())[1]?.value).toBe('15027365');
    const lines = (
      buildLugImport(listed, definition, mapping(), {
        mandantennummer: '123',
        mode: 'neu',
        inputs: { lohnart: '2000' },
      }).text ?? ''
    ).split('\r\n');
    expect(lines.some((line) => line.endsWith(';11/2026;15027365;7'))).toBe(true);
    // The Kanzlei can still override it, and a free name (Muster-BKK) prefills nothing.
    expect(neededInputs(listed, definition, mapping(), { kasse: '87654321' })[1]?.value).toBe(
      '87654321',
    );
    expect(neededInputs(questionnaire(), definition, mapping())[1]?.value).toBe('');
  });

  it('leaves out a record whose key is not entered, and a combination field missing an input', () => {
    const result = buildLugImport(questionnaire(), definition, mapping(), {
      mandantennummer: '123',
      mode: 'neu',
    });
    expect(result.problems).toContain(
      'Beispiel|Gehalt: „Lohnart für das Gehalt“ oben eintragen – Datensatz nicht übertragen',
    );
    expect(result.problems).toContain(
      'Beispiel|Kasse – Krankenkasse: „Betriebsnummer der Krankenkasse“ oben eintragen – nicht übertragen',
    );
    expect(result.text).not.toContain('Beispiel|Gehalt');
    // The rest of the record is written; the default fills its input.
    expect(result.text).toContain('Beispiel|Kasse;Stelle');
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|Kasse',
      field: 'Krankenkasse › Nummer',
      value: '',
      problem: 'oben eintragen',
    });
  });

  it('writes what the Kanzlei entered', () => {
    const result = buildLugImport(questionnaire(), definition, mapping(), {
      mandantennummer: '123',
      mode: 'neu',
      inputs: { lohnart: '2000', kasse: '12345678', stelle: '3' },
    });
    expect(result.problems.join(' ')).not.toContain('oben eintragen');
    const lines = (result.text ?? '').split('\r\n');
    const gehalt = lines.find((line) => line.endsWith(';Beispiel|Gehalt;Lohnart;Betrag'));
    expect(gehalt).toBeDefined();
    expect(lines).toContain(`${gehalt?.split(';')[0] ?? ''};2000;2500,00`);
    const kasse = lines.find((line) =>
      line.endsWith(';Beispiel|Kasse;Kasse(Gueltig_ab;Nummer);Stelle'),
    );
    expect(lines).toContain(`${kasse?.split(';')[0] ?? ''};11/2026;12345678;3`);
  });

  it('refuses an input that does not fit, and blocks the file until it is corrected', () => {
    const result = buildLugImport(questionnaire(), definition, mapping(), {
      mandantennummer: '123',
      mode: 'neu',
      inputs: { lohnart: '2000', kasse: '1234' },
    });
    expect(result.blocking).toEqual(['„Betriebsnummer der Krankenkasse“: genau 8 Ziffern.']);
    expect(result.text).toBeUndefined();
    const needed = neededInputs(questionnaire(), definition, mapping(), { kasse: '1234' });
    expect(needed[1]?.problem).toBe('genau 8 Ziffern');
  });
});

describe('child allowances, the first source that has a value, and notes', () => {
  const TAX: Answers = { ...PERSON, dienstverhaeltnis: 'erstes', steuerklasse: '1' };
  const tax = (answers: Answers, inputs: Record<string, string> = {}) =>
    buildLugImport(
      questionnaire({ ...TAX, kirchensteuer: 'ev', ...answers }),
      definition,
      mapping(),
      { mandantennummer: '123', mode: 'neu', inputs },
    );
  const rowOf = (result: ReturnType<typeof tax>, field: string) =>
    result.sheet.find((row) => row.mask === 'Beispiel|Steuer' && row.field === field);

  it('writes the child allowances as entered, in half steps', () => {
    expect(rowOf(tax({ kinderfreibetraege: '4,5' }), 'Kfb')?.value).toBe('4,5');
    expect(rowOf(tax({ kinderfreibetraege: '0' }), 'Kfb')?.value).toBe('0');
  });

  it('asks the Kanzlei for the church tax code of another community, showing the answer', () => {
    const other: Answers = {
      kinderfreibetraege: '0',
      kirchensteuer: 'andere',
      kirchensteuerAndere: 'Gemeinde X',
    };
    const needed = neededInputs(questionnaire({ ...TAX, ...other }), definition, mapping());
    expect(needed.find((n) => n.input.id === 'konfession')?.context).toEqual([
      { label: 'Religionsgemeinschaft', value: 'Gemeinde X' },
    ]);
    expect(tax(other).problems).toContain(
      'Beispiel|Steuer – Konfession: „Konfession (Kürzel)“ oben eintragen – nicht übertragen',
    );
    expect(rowOf(tax(other, { konfession: 'is' }), 'Konfession › Kuerzel')?.value).toBe('is');
    expect(rowOf(tax({ kinderfreibetraege: '0' }), 'Konfession › Kuerzel')?.value).toBe('ev');
    expect(tax(other, { konfession: 'xx' }).blocking).toEqual([
      '„Konfession (Kürzel)“: bitte aus der Liste wählen.',
    ]);
  });

  it('writes Personengruppe 120 with its note, and lists the note to check', () => {
    const pensioner = questionnaire({
      ...PERSON,
      bezugRente: true,
      rentenart: 'altersvoll',
      renteSeit: '01.01.2026',
    });
    const result = buildLugImport(pensioner, definition, mapping(), {
      mandantennummer: '123',
      mode: 'neu',
    });
    expect(result.sheet).toContainEqual({
      mask: 'Beispiel|Gruppe',
      field: 'PGS',
      value: '120',
      note: 'steht nicht in der Werteliste – im Protokoll prüfen',
    });
    expect(result.notes).toEqual([
      'Beispiel|Gruppe – PGS: steht nicht in der Werteliste – im Protokoll prüfen',
    ]);
    // An ordinary employee: no note.
    const ordinary = buildLugImport(questionnaire(), definition, mapping(), {
      mandantennummer: '1',
      mode: 'neu',
    });
    expect(ordinary.notes).toEqual([]);
  });
});

describe('Windows-1252', () => {
  it('encodes umlauts, ß and the euro sign as single bytes', () => {
    const encoded = encodeWindows1252('Äöüß €');
    expect(encoded).toEqual({
      ok: true,
      bytes: Uint8Array.from([0xc4, 0xf6, 0xfc, 0xdf, 0x20, 0x80]),
    });
  });

  it('names characters it cannot encode instead of replacing them', () => {
    expect(encodeWindows1252('Łódź')).toEqual({ ok: false, unsupported: ['Ł', 'ź'] });
  });
});
