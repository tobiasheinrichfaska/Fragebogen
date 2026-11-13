// Findings of the Claude-in-Chrome evaluation of the public app (2026-11-13, import
// chrome-evaluierung-teil1.json) that change form texts. Published versions stay frozen; the
// fixes live in the drafts that will replace them.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { visibility } from '../../src/logic/form';
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

// Part 2 B4: the spouse saw the client's restriction under „Ihre Einschränkungen“, as if his own.
describe('Zustimmung: restrictions are named after whose they are', () => {
  const zustimmung = load(DRAFTS_DIR, 'steuerfreigabe', '0.1.0').definition;
  const label = (id: string) =>
    zustimmung.sections.flatMap((s) => s.fields).find((f) => f.id === id)?.label;
  it('labels each restriction field with its role, read alike from every role', () => {
    expect(label('einschraenkungenMandant')).toBe(
      'Einschränkungen des Mandanten / Steuerpflichtigen',
    );
    expect(label('einschraenkungenEhegatte')).toBe(
      'Einschränkungen des Ehegatten / Lebenspartners',
    );
    expect(label('einschraenkungenKanzlei')).toBe('Einschränkungen der Kanzlei');
  });
});

// Part 3 (Austritt, Dienstwagen, Eigenbeleg, Monatsmeldung): wording and legal precision.
describe('part 3: texts of the drafts', () => {
  const text = (id: string) => JSON.stringify(load(DRAFTS_DIR, id, '0.1.0').definition);

  it('B6, B7: Austritt counts the periods from the day after the notice, the report from the end', () => {
    const austritt = text('austritt');
    expect(austritt).not.toContain('Ab diesem Tag laufen');
    expect(austritt).not.toContain('ab dann laufen');
    expect(austritt).toContain('§ 187 Abs. 1 BGB');
    expect(austritt).toContain('spätestens sechs Wochen nach dem Ende der Beschäftigung');
  });

  it('B12, B14, B15: Dienstwagen — plug-in hybrids only, the first workplace, the commuting cap', () => {
    const dienstwagen = text('dienstwagen');
    expect(dienstwagen).not.toContain('bei Elektro- und Hybridfahrzeugen weniger');
    expect(dienstwagen).toContain('Plug-in-Hybridfahrzeugen unter Bedingungen weniger');
    expect(dienstwagen).toContain('Erste Tätigkeitsstätte ist');
    expect(dienstwagen).toContain('als Entfernungspauschale');
  });

  it('B22: Monatsmeldung names eight hours a working day (§ 16 Abs. 2, § 3 ArbZG)', () => {
    expect(text('lohnmeldung')).toContain('Arbeitszeit über acht Stunden je Werktag');
  });

  it('B18: one word for the link that keeps the master data', () => {
    for (const draft of DRAFTS) expect(JSON.stringify(draft)).not.toContain('Lesezeichen-Link');
  });
});

// Part 3 B2 (Tobias 2026-11-13: „kann man das verbessern?“): the social selection was asked without
// knowing why the employer gave notice; now the reason comes first.
describe('Austritt: the reason of a dismissal decides what follows', () => {
  const austritt = load(DRAFTS_DIR, 'austritt', '0.1.0').definition;
  const shown = (grund: string | undefined) => {
    const data = {
      agBeendigungsart: 'kuendigungArbeitgeber',
      ...(grund === undefined ? {} : { agKuendigungsgrund: grund }),
    };
    const visible = visibility(austritt, 'arbeitgeber', data);
    return ['agSozialauswahl', 'agAbfindungsangebot1a', 'agAbmahnung'].filter(
      (id) => visible.get(id) === true,
    );
  };

  it('asks the social selection and the offer of § 1a KSchG only for business reasons', () => {
    expect(shown('betriebsbedingt')).toEqual(['agSozialauswahl', 'agAbfindungsangebot1a']);
    expect(shown('personenbedingt')).toEqual([]);
    expect(shown('ohneKschg')).toEqual([]);
  });

  it('asks about a warning only for conduct', () => {
    expect(shown('verhaltensbedingt')).toEqual(['agAbmahnung']);
  });

  it('asks the reason only when the employer gave notice, and the social selection has no detour', () => {
    const visible = visibility(austritt, 'arbeitgeber', { agBeendigungsart: 'kuendigungPerson' });
    expect(visible.get('agKuendigungsgrund')).toBe(false);
    const field = austritt.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'agSozialauswahl');
    expect(field?.options?.map((o) => o.id)).toEqual(['ja', 'nein']);
  });
});
