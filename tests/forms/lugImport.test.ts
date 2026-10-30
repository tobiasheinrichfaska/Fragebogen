// Import file for a payroll program and the Erfassungsblatt (Tobias 2026-10-30), with a fictitious
// mapping — the real DATEV mapping stays out of the public repo. Fictitious data.
import { join } from 'node:path';
import mappingsRaw from '../fixtures/export/beispiel.json';
import { encodeWindows1252 } from '../../src/io/windows1252';
import {
  checkExportMapping,
  parseExportMappings,
  subFields,
  type ExportMapping,
} from '../../src/logic/exportMapping';
import { buildLugImport } from '../../src/logic/lugImport';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
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
  staatsangehoerigkeitSchluessel: 'deutsch',
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
        'needs exactly one of field, derivation, const, blank',
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

  it('splits combination fields into their sub-fields, nested ones too', () => {
    expect(subFields('Land(Kennzeichen;Name)')).toEqual(['Kennzeichen', 'Name']);
    expect(subFields('T(Gueltig_ab;A(B;C);D)')).toEqual(['Gueltig_ab', 'B', 'C', 'D']);
    expect(subFields('Ort')).toEqual(['Ort']);
  });
});

describe('import file', () => {
  const result = buildLugImport(questionnaire(), definition, mapping(), {
    mandantennummer: '123',
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

  it('creates or selects the employee, then writes the records', () => {
    const first = lines.indexOf('[Mitarbeiter]');
    expect(lines[first + 1]).toBe('15;42;Musterfrau;Erika;02.11.2026;11/2026');
    expect(lines).toContain('14;42');
    expect(lines.lastIndexOf('[Mitarbeiter]')).toBeGreaterThan(first);
  });

  it('formats dates, months, decimals, codes, mapped choices and proposals', () => {
    expect(lines).toContain('1000;Musterfrau;Erika;A;Österreich;Wien');
    expect(lines).toContain('1001;17.05.1990;w;000;');
    expect(lines).toContain('1002;11/2026;1;1;1;1');
    expect(lines).toContain('1003;DE89370400440532013000;SEPA');
    expect(lines).toContain('1004;2500,00;"Verkauf; Kasse"');
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
      { mandantennummer: '123' },
    );
    expect(bar.problems.join(' ')).toContain('für „bar“ gibt es keine Zuordnung');
    expect(bar.text).not.toContain(';SEPA');
  });

  it('names an open proposal and leaves the whole combination field out', () => {
    const q = filled('arbeitgeber', EMPLOYER, createQuestionnaire(QUESTIONNAIRE_ID, form));
    const open = buildLugImport(q, definition, mapping(), {
      mandantennummer: '123',
      mitarbeiternummer: '7',
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
      { mandantennummer: '123' },
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
      'Mitarbeiternummer (1 bis 5 Ziffern) fehlt.',
    ]);
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
