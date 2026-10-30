// The local mapping of this machine (config/export.local.json, gitignored — it names the payroll
// program's fields). Runs only where the file exists; in the public repo it is skipped, which is NOT a
// pass for the mapping (see CLAUDE.md). Fictitious data.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeWindows1252 } from '../../src/io/windows1252';
import { checkExportMapping, parseExportMappings } from '../../src/logic/exportMapping';
import { buildLugImport } from '../../src/logic/lugImport';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const FILE = join(__dirname, '..', '..', 'config', 'export.local.json');
const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));

type Answers = Record<string, unknown>;
function filled(role: string, values: Answers, base: Questionnaire): Questionnaire {
  let q = ok(startPart(base, form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

describe.skipIf(!existsSync(FILE))('local export mapping (config/export.local.json)', () => {
  const parsed = parseExportMappings(JSON.parse(readFileSync(FILE, 'utf8')));
  const mappings = parsed.ok ? parsed.mappings : [];

  it('decodes and fits the Personalfragebogen draft', () => {
    expect(parsed.ok ? [] : parsed.issues).toEqual([]);
    for (const mapping of mappings.filter((m) => m.form === 'personalfragebogen')) {
      expect(checkExportMapping(mapping, form.definition)).toEqual([]);
    }
  });

  it('writes an import file for a typical new employee, only the wage type left to the user', () => {
    const q = filled(
      'arbeitgeber',
      {
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
      },
      filled(
        'person',
        {
          familienname: 'Musterfrau',
          vorname: 'Erika',
          geburtsdatum: '17.05.1990',
          geburtsort: 'Musterstadt',
          geburtsstaat: 'Deutschland',
          geschlecht: 'weiblich',
          staatsangehoerigkeitSchluessel: 'deutsch',
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
        },
        createQuestionnaire(QUESTIONNAIRE_ID, form),
      ),
    );
    const mapping = mappings.find((m) => m.form === 'personalfragebogen');
    expect(mapping).toBeDefined();
    if (!mapping) return;
    const result = buildLugImport(q, form.definition, mapping, { mandantennummer: '10001' });
    expect(result.blocking).toEqual([]);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain('selbst erfassen – Datensatz nicht übertragen');
    expect((result.text ?? '').split('\r\n').length).toBeGreaterThan(30);
    expect(result.text).toContain(';11/2026;1;1;1;1');
    expect(result.text).toContain('62102');
    expect(encodeWindows1252(result.text ?? '').ok).toBe(true);
  });
});
