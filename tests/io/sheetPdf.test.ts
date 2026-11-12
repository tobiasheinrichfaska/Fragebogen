// The Erfassungsblatt of a hand-over as a PDF of its own for the Personalakte (Tobias 2026-10-31:
// "PDF auch für die Akte"): readable text, PDF/A markers, no script or attachment, file name with
// numbers only. Fictitious mapping and data.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import mappingsRaw from '../fixtures/export/beispiel.json';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import type { PdfFonts } from '../../src/io/pdfWriter';
import { writeSheetPdf } from '../../src/io/sheetPdf';
import { parseExportMappings } from '../../src/logic/exportMapping';
import { buildLugImport, neededInputs } from '../../src/logic/lugImport';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};
const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
const parsed = parseExportMappings(structuredClone(mappingsRaw));
if (!parsed.ok || !parsed.mappings[0]) throw new Error('fixture mapping does not decode');
const mapping = parsed.mappings[0];

function filled(role: string, values: Record<string, unknown>, base: Questionnaire) {
  let q = ok(startPart(base, form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

const questionnaire = filled(
  'arbeitgeber',
  {
    agPersonalnummer: '42',
    agBeschaeftigungsbeginn: '02.11.2026',
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '2.500,00',
    agBeschaeftigungsart: 'svpflichtig',
  },
  filled(
    'person',
    {
      familienname: 'Musterfrau',
      vorname: 'Erika',
      geburtsdatum: '17.05.1990',
      anschriftAusland: false,
      wohnort: 'Musterstadt',
      weitereBeschaeftigung: false,
      krankenversicherung: 'gesetzlich',
      krankenkasse: 'Muster-BKK',
    },
    createQuestionnaire(QUESTIONNAIRE_ID, form),
  ),
);

describe('Erfassungsblatt as PDF', () => {
  const entries = { mandantennummer: '123', mode: 'neu' as const, inputs: { lohnart: '2000' } };
  const result = buildLugImport(questionnaire, form.definition, mapping, entries);
  let written: Awaited<ReturnType<typeof writeSheetPdf>>;
  beforeAll(async () => {
    written = await writeSheetPdf(
      {
        questionnaire,
        definition: form.definition,
        mapping,
        result,
        inputs: neededInputs(questionnaire, form.definition, mapping, entries.inputs),
        mandant: '123',
        mode: 'neu',
        config: { kanzleiName: 'Musterkanzlei' },
        created: { local: '2026-10-31T10:00:00.000+01:00', utc: '2026-10-31T09:00:00.000Z' },
      },
      FONTS,
    );
  }, 60_000);

  it('is named by numbers only (Gemeinsame Grundsätze § 9a BVV)', () => {
    expect(written.fileName).toBe(
      `Erfassungsblatt_LuG_M123_MA42_${QUESTIONNAIRE_ID.slice(0, 8)}.pdf`,
    );
  });

  it('shows whom it is about, what the Kanzlei entered, the values and what was left out', async () => {
    const text = await readPdfText(pdfjs as unknown as PdfJsLike, written.bytes);
    const all = text.lines.join('\n');
    for (const expected of [
      'Erfassungsblatt Beispielprogramm',
      'Mandant 123 · Mitarbeiter 42 (neu anlegen) · Musterfrau, Erika · Eintritt 02.11.2026',
      'Lohnart für das Gehalt: 2000',
      'Angabe im Fragebogen: Gesetzliche Krankenkasse: Muster-BKK',
      'Grundlage: noch kein abgeschlossener Teil',
      'Beispiel › Gehalt',
      '2500,00',
      'Nicht übertragen – in Beispielprogramm selbst erfassen',
      'Betriebsnummer der Krankenkasse',
      'Im Beispielprogramm: Datei | Einlesen.',
      'Seite 1 von',
    ]) {
      expect(all).toContain(expected);
    }
  });

  it('carries PDF/A markers, but no script, attachment or launch action', () => {
    const raw = Buffer.from(written.bytes).toString('latin1');
    expect(raw).toMatch(/pdfaid:part[^0-9]*2/);
    expect(raw).toMatch(/pdfaid:conformance[^A-Z]*U/);
    for (const forbidden of ['/JavaScript', '/JS ', '/EmbeddedFile', '/Launch', '/Encrypt']) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
