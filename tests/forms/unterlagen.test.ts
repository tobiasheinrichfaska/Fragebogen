// The list of documents offers only what fits the answers (Tobias 2026-11-13: „nur anzeigen was
// sinnvoll ist? dann ja“) — answers with a condition, also over the person's sealed part.
import { join } from 'node:path';
import { parseFormDefinition } from '../../src/logic/formDefinition';
import type { PartData } from '../../src/logic/form';
import type { FieldDefinition } from '../../src/logic/model';
import { availableOptions } from '../../src/logic/optionConditions';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';

const raw = readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json'));
const { definition } = registeredFrom(raw);
const field = definition.sections
  .flatMap((s) => s.fields)
  .find((f) => f.id === 'agUnterlagen') as FieldDefinition;

const offered = (employer: PartData, person?: PartData) =>
  availableOptions(definition, field, employer, (role) =>
    role === 'person' ? person : undefined,
  ).map((option) => option.id);

describe('Personalfragebogen 1.1.0: the documents the employer has', () => {
  it('offers every document that hangs on the person while the person has not finished', () => {
    const shown = offered({}, undefined);
    for (const byPerson of [
      'aufenthaltstitel',
      'kvNachweis',
      'pkvBescheinigung',
      'kvBefreiungsbescheid',
      'rentenbescheid',
      'pensionsbescheid',
      'kinderNachweise',
      'lstbVorarbeitgeber',
      'elternzeitZustimmung',
      'versorgungswerkBefreiung',
      'schulbescheinigung',
      'rvBefreiung',
    ]) {
      expect(shown).toContain(byPerson);
    }
    // The employer's own answers are known: without „VL: Ja“ no VL contract.
    expect(shown).not.toContain('vwlVertrag');
  });

  it('hides what the person’s answers rule out, keeps what is always possible', () => {
    const shown = offered(
      { agBeschaeftigungsart: 'svpflichtig', agVwl: false, agBav: 'keine', agSozialkasse: 'nein' },
      {
        deutscheStaatsangehoerigkeit: true,
        krankenversicherung: 'gesetzlich',
        bezugRente: false,
        bezugPension: false,
        vorbeschJahr: false,
        elternzeitAnderswo: false,
      },
    );
    for (const always of ['arbeitsvertrag', 'steuerId', 'svAusweis', 'jarbschg', 'kirchensteuer']) {
      expect(shown).toContain(always);
    }
    expect(shown).toContain('kvNachweis');
    for (const ruledOut of [
      'aufenthaltstitel',
      'pkvBescheinigung',
      'rentenbescheid',
      'pensionsbescheid',
      'lstbVorarbeitgeber',
      'vwlVertrag',
      'bav',
      'rvVerzicht',
      'praktikumOrdnung',
      'sozialkasse',
    ]) {
      expect(shown).not.toContain(ruledOut);
    }
  });

  it('offers a document as soon as an answer on either side calls for it', () => {
    expect(offered({ agVwl: true }, {})).toContain('vwlVertrag');
    expect(offered({ agSozialkasse: 'nein' }, { sozialkasseBetrieb: 'ja' })).toContain(
      'sozialkasse',
    );
    expect(offered({ agBeschaeftigungsart: 'werkstudent' }, {})).toContain('immatrikulation');
    expect(offered({}, { deutscheStaatsangehoerigkeit: false })).toContain('aufenthaltstitel');
  });
});

describe('answers with a condition — definition rules', () => {
  const withCondition = (condition: unknown) => {
    const copy = structuredClone(raw) as {
      sections: { fields: { id: string; options?: Record<string, unknown>[] }[] }[];
    };
    const target = copy.sections.flatMap((s) => s.fields).find((f) => f.id === 'agUnterlagen');
    const option = target?.options?.[0];
    if (option) option.showIf = condition;
    const parsed = parseFormDefinition(copy);
    return parsed.ok ? [] : parsed.issues.map((issue) => issue.message);
  };

  it('accepts a condition over the person’s and the employer’s earlier answers', () => {
    expect(withCondition({ field: 'kinder', equals: true })).toEqual([]);
    expect(withCondition({ field: 'agVwl', equals: true })).toEqual([]);
  });

  it('refuses an unknown field and a value the field cannot have', () => {
    expect(withCondition({ field: 'gibtEsNicht', equals: true })).toContain(
      'unknown field "gibtEsNicht"',
    );
    expect(withCondition({ field: 'krankenversicherung', equals: 'gibtEsNicht' })).not.toEqual([]);
  });

  it('refuses an answer of the same role asked later', () => {
    const later = definition.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.role === 'arbeitgeber');
    const after = later[later.findIndex((f) => f.id === 'agUnterlagen') + 1];
    if (after === undefined) return;
    expect(withCondition({ field: after.id, answered: true })).toContain(
      `"${after.id}" must come before "agUnterlagen" (interview order)`,
    );
  });
});
