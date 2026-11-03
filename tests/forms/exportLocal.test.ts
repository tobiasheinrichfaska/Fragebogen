// The local mappings of this machine (config/export.local.json, gitignored — they name the payroll
// program's fields). Runs only where the file exists; in the public repo it is skipped, which is NOT a
// pass for the mapping (see CLAUDE.md). Fictitious data.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeWindows1252 } from '../../src/io/windows1252';
import {
  checkExportMapping,
  mappingFor,
  parseExportMappings,
  type ExportMapping,
} from '../../src/logic/exportMapping';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { buildLugImport, neededInputs, type LugEntries } from '../../src/logic/lugImport';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import {
  definitionFiles,
  DRAFTS_DIR,
  FIXTURE_FORMS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const FILE = join(__dirname, '..', '..', 'config', 'export.local.json');
const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const sofort = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.3.0.json')));
const sofortFrozen = registeredFrom(
  readJson(join(FIXTURE_FORMS_DIR, 'sofortmeldung', '0.1.0.json')),
);

type Answers = Record<string, unknown>;
function filled(
  target: RegisteredForm,
  role: string,
  values: Answers,
  base: Questionnaire,
): Questionnaire {
  let q = ok(startPart(base, target, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, target, role, id, raw));
  return q;
}

const PERSON: Answers = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  geburtsort: 'Musterstadt',
  geborenInDeutschland: true,
  geschlecht: 'weiblich',
  deutscheStaatsangehoerigkeit: true,
  anschriftAusland: false,
  strassenname: 'Musterweg',
  hausnummer: '1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
  zahlungsweg: 'ueberweisung',
  iban: 'DE89 3704 0044 0532 0130 00',
  weitereBeschaeftigung: false,
  krankenversicherung: 'gesetzlich',
  krankenkasse: 'Muster-BKK',
  schulabschluss: 'abitur',
  berufsabschluss: 'bachelor',
  steuerId: '86095742719',
  dienstverhaeltnis: 'erstes',
  steuerklasse: '1',
  kinderfreibetraege: '0',
  kirchensteuer: 'ev',
};
const EMPLOYER: Answers = {
  agPersonalnummer: '42',
  agBeschaeftigungsbeginn: '02.11.2026',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2.500,00',
  agBeschaeftigungsart: 'svpflichtig',
  agTaetigkeit: 'Verkauf',
  agKldb: '62102',
  agArbeitnehmerueberlassung: false,
  agBefristet: false,
  agArbeitszeitform: 'vollzeit',
  agUrlaubstage: '30',
};
const INPUTS = { lohnartGehalt: '2000', kkBetriebsnummer: '12345678', kkNummer: '1' };

function questionnaire(person: Answers = PERSON, employer: Answers = EMPLOYER): Questionnaire {
  const base = createQuestionnaire(QUESTIONNAIRE_ID, form);
  return filled(form, 'arbeitgeber', employer, filled(form, 'person', person, base));
}

describe.skipIf(!existsSync(FILE))('local export mappings (config/export.local.json)', () => {
  const parsed = parseExportMappings(JSON.parse(readFileSync(FILE, 'utf8')));
  const mappings = parsed.ok ? parsed.mappings : [];
  const lug = mappings.find((m) => mappingFor(m, form.definition)) as ExportMapping;
  const build = (q: Questionnaire, entries: LugEntries = {}) =>
    buildLugImport(q, form.definition, lug, {
      mandantennummer: '10001',
      mode: 'neu',
      inputs: INPUTS,
      ...entries,
    });

  it('decodes and fits the Personalfragebogen and the Sofortmeldung drafts', () => {
    expect(parsed.ok ? [] : parsed.issues).toEqual([]);
    expect(lug).toBeDefined();
    for (const target of [form, sofort]) {
      const own = mappings.filter((m) => mappingFor(m, target.definition));
      expect(own).toHaveLength(1);
      for (const mapping of own) expect(checkExportMapping(mapping, target.definition)).toEqual([]);
    }
    // The frozen Sofortmeldung 0.1.0 (street with number, nationality as text) has none.
    expect(mappings.some((m) => mappingFor(m, sofortFrozen.definition))).toBe(false);
  });

  it('has a mapping for every shipped version of a mapped form (2026-11-03: 0.3.0 had none)', () => {
    const mapped = new Set(mappings.map((m) => m.form));
    const shipped = [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
      .filter((file) => file.file.endsWith('.json'))
      .map((file) => registeredFrom(readJson(file.path)).definition)
      .filter((definition) => mapped.has(definition.id));
    const without = shipped
      .filter((definition) => !mappings.some((m) => mappingFor(m, definition)))
      .map((definition) => `${definition.id} ${definition.version}`);
    expect(without).toEqual([]);
    for (const definition of shipped) {
      for (const mapping of mappings.filter((m) => mappingFor(m, definition))) {
        expect(checkExportMapping(mapping, definition), definition.version).toEqual([]);
      }
    }
  });

  it('asks for wage type and health insurer, and writes a complete file once they are entered', () => {
    const q = questionnaire();
    expect(neededInputs(q, form.definition, lug).map((n) => n.input.id)).toEqual([
      'lohnartGehalt',
      'kkBetriebsnummer',
      'kkNummer',
    ]);
    const without = build(q, { inputs: {} });
    expect(without.problems).toEqual([
      expect.stringContaining('„Betriebsnummer der Krankenkasse“, „KK-Nr.'),
      expect.stringContaining('„Lohnart für das Monatsentgelt“ oben eintragen – Datensatz'),
    ]);
    const result = build(q);
    expect(result.blocking).toEqual([]);
    expect(result.problems).toEqual([]);
    expect(result.notes).toEqual([]);
    const text = result.text ?? '';
    expect(text.split('\r\n').length).toBeGreaterThan(30);
    expect(text).toContain('\r\n3;42;Musterfrau;Erika;02.11.2026;11/2026\r\n');
    expect(text).toContain(';11/2026;1;1;1;1');
    expect(text).toContain(';11/2026;12345678;1');
    expect(text).toContain(';2000;2500,00;mtl;11/2026');
    expect(text).toContain('62102');
    expect(encodeWindows1252(text).ok).toBe(true);
  });

  it('takes the health insurer of a Minijobber into its own field', () => {
    const q = questionnaire(PERSON, {
      ...EMPLOYER,
      agMonatsentgelt: '500,00',
      agBeschaeftigungsart: 'minijob',
    });
    expect(neededInputs(q, form.definition, lug).map((n) => n.input.id)).toEqual([
      'lohnartGehalt',
      'kkBetriebsnummer',
    ]);
    // Its own field takes only the insurer's number (no KK-Nr.); field names stay in the local file.
    const text = build(q).text ?? '';
    expect(text).toContain(';11/2026;12345678\r\n');
    expect(text).not.toContain(';11/2026;12345678;1');
  });

  it('writes more than three child allowances, another church tax code and Personengruppe 120', () => {
    const q = questionnaire({
      ...PERSON,
      bezugRente: true,
      rentenart: 'altersvoll',
      renteSeit: '01.01.2026',
      kinderfreibetraege: '4,5',
      kirchensteuer: 'andere',
      kirchensteuerAndere: 'Jüdische Gemeinde Musterstadt',
    });
    const needed = neededInputs(q, form.definition, lug);
    expect(needed.find((n) => n.input.id === 'konfession')?.context).toEqual([
      { label: 'Religionsgemeinschaft', value: 'Jüdische Gemeinde Musterstadt' },
    ]);
    const result = build(q, { inputs: { ...INPUTS, konfession: 'ib' } });
    expect(result.blocking).toEqual([]);
    expect(result.problems).toEqual([]);
    const text = result.text ?? '';
    expect(text).toContain(';11/2026;1;;4,5');
    expect(text).toContain(';11/2026;ib');
    expect(text).toContain(';11/2026;120');
    expect(text).toContain(';01.01.2026;11/2026;1');
    expect(result.notes).toEqual([
      expect.stringContaining('Personengruppe 120 fehlt in der Werteliste'),
    ]);
  });

  it('creates the employee from the Sofortmeldung, then completes it from the Personalfragebogen', () => {
    const mapping = mappings.find((m) => mappingFor(m, sofort.definition)) as ExportMapping;
    const early = filled(
      sofort,
      'arbeitgeber',
      { agPersonalnummer: '42', agBeschaeftigungsbeginn: '02.11.2026' },
      filled(
        sofort,
        'person',
        {
          familienname: 'Musterfrau',
          vorname: 'Erika',
          geburtsdatum: '17.05.1990',
          geburtsort: 'Musterstadt',
          geborenInDeutschland: true,
          geschlecht: 'weiblich',
          deutscheStaatsangehoerigkeit: true,
          anschriftAusland: false,
          strassenname: 'Musterweg',
          hausnummer: '1',
          postleitzahl: '12345',
          wohnort: 'Musterstadt',
        },
        createQuestionnaire(QUESTIONNAIRE_ID, sofort),
      ),
    );
    const first = buildLugImport(early, sofort.definition, mapping, {
      mandantennummer: '10001',
      mode: 'neu',
    });
    expect(first.blocking).toEqual([]);
    expect(first.problems).toEqual([]);
    expect(first.text).toContain('\r\n3;42;Musterfrau;Erika;02.11.2026;11/2026\r\n');
    expect(first.text).toContain('Musterweg;1;12345;Musterstadt');
    const later = build(questionnaire(), { mode: 'vorhanden' });
    expect(later.blocking).toEqual([]);
    expect(later.text).not.toContain('\r\n3;42');
    expect(later.text).toContain('\r\n[Mitarbeiter]\r\n4;42\r\n');
  });
});
