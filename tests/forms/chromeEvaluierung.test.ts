// Findings of the Claude-in-Chrome evaluation of the public app (2026-11-13, import
// chrome-evaluierung-teil1.json) that change form texts. Published versions stay frozen; the
// fixes live in the drafts that will replace them.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import type { FormDefinition } from '../../src/logic/model';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';

const load = (dir: string, id: string, version: string): RegisteredForm =>
  registeredFrom(readJson(join(dir, id, `${version}.json`)));
const DRAFTS = definitionFiles(DRAFTS_DIR)
  .filter((f) => f.file.endsWith('.json'))
  .map((f) => registeredFrom(readJson(f.path)).definition);
const help = (definition: FormDefinition, id: string) =>
  definition.sections.flatMap((s) => s.fields).find((f) => f.id === id)?.help ?? '';
const notice = (definition: FormDefinition, id: string) =>
  definition.infoBlocks.find((b) => b.id === id)?.text ?? '';

describe('B1: privacy notices tell of the browser memory of the hosted app', () => {
  it.each(DRAFTS.map((d) => [`${d.id} ${d.version}`, d] as const))(
    '%s never says the app keeps nothing',
    (_name, definition) => {
      for (const block of definition.infoBlocks) {
        expect(block.text).not.toContain('speichert und versendet nichts');
        expect(block.text).not.toContain('speichert und versendet Ihre Angaben nicht');
      }
    },
  );

  it.each(['datenschutz', 'datenschutzMitinhaber'])(
    'SEPA-Mandat 1.2.0 (%s) names the memory of at most 7 days',
    (id) => {
      const text = notice(load(DRAFTS_DIR, 'sepa-mandat', '1.2.0').definition, id);
      expect(text).toContain('merkt sich die Online-Fassung einen angefangenen Fragebogen');
      expect(text).toContain('höchstens 7 Tage');
    },
  );
});

describe('SEPA-Mandat 1.2.0', () => {
  const sepa110 = load(FORMS_DIR, 'sepa-mandat', '1.1.0').definition;
  const sepa120 = load(DRAFTS_DIR, 'sepa-mandat', '1.2.0').definition;

  it('B20: words the payment for another person as the legitimate interest it cites', () => {
    const text = notice(sepa120, 'datenschutz');
    expect(text).not.toContain('geschieht das zur Erfüllung dieses Vertrags');
    expect(text).toContain('das ist ihr berechtigtes Interesse (Art. 6 Abs. 1 Buchst. f DSGVO)');
  });

  it('differs from 1.1.0 only in its version, its stamp and the two privacy notices', () => {
    const strip = (d: FormDefinition) =>
      JSON.stringify({
        ...d,
        version: undefined,
        revised: undefined,
        infoBlocks: d.infoBlocks.filter((b) => !b.id.startsWith('datenschutz')),
      });
    expect(strip(sepa120)).toBe(strip(sepa110));
  });
});

describe('Personalfragebogen 1.1.0: texts', () => {
  const pfb = load(DRAFTS_DIR, 'personalfragebogen', '1.1.0').definition;

  it('B4: further pay asks only for what was not asked above', () => {
    const text = help(pfb, 'agWeitereBezuege');
    for (const asked of ['Sachbezüge', 'Dienstwagen', 'Einmalzahlungen', 'vermögenswirksame']) {
      expect(text).not.toContain(asked);
    }
  });

  it('B15: helps say what a question means, not how the form is built', () => {
    expect(help(pfb, 'anschriftAusland')).not.toContain('Diese Frage steht');
    expect(help(pfb, 'agEntgeltArt')).not.toContain('fragen wir ihn vor');
  });

  it('B3: the company car points to the payroll office, not to a form the app may not offer', () => {
    expect(help(pfb, 'agSachbezuege')).toContain('schickt Ihnen die lohnabrechnende Stelle');
  });

  it('B16: the job title says how it differs from the activity', () => {
    expect(help(pfb, 'agBerufsbezeichnung')).toContain('Tätigkeit');
  });
});
