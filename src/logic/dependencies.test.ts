import { beispielForm, chainForm, logicForm } from '../../tests/support/sample';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../../tests/support/formFiles';
import { forEachLeaf } from './conditions';
import { fieldDependencies } from './dependencies';
import type { FieldDefinition } from './model';

describe('fieldDependencies', () => {
  it('assigns levels along the chain (the deepest parent counts)', () => {
    const dependencies = fieldDependencies(chainForm().definition);
    expect(
      ['weitereBeschaeftigung', 'weitereArt', 'weitereFirma', 'weitereStunden', 'nachname'].map(
        (id) => dependencies.get(id)?.level,
      ),
    ).toEqual([0, 1, 2, 3, 0]);
  });

  it('names what makes a field available and what it enables', () => {
    const dependencies = fieldDependencies(chainForm().definition);
    expect(dependencies.get('weitereStunden')).toEqual({
      fieldId: 'weitereStunden',
      level: 3,
      availableThrough: ['weitereBeschaeftigung', 'weitereFirma'],
      requiredThrough: [],
      enables: [],
    });
    expect(dependencies.get('weitereBeschaeftigung')?.enables).toEqual([
      'weitereArt',
      'weitereStunden',
    ]);
  });

  it('keeps requiredIf apart: it decides "required", not "available"', () => {
    const telefon = fieldDependencies(logicForm().definition).get('telefon');
    expect(telefon).toMatchObject({ level: 0, availableThrough: [], requiredThrough: ['email'] });
  });

  it('covers every top-level field of the form', () => {
    const { definition } = beispielForm();
    const ids = definition.sections.flatMap((section) => section.fields.map((field) => field.id));
    expect([...fieldDependencies(definition).keys()]).toEqual(ids);
  });
});

// Audit 2026-11-14: `enables` is built in one pass now; the result must be exactly what the former
// quadratic search gave, for every form and draft.
describe('fieldDependencies against the former search', () => {
  const definitions = [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
    .filter((file) => file.file.endsWith('.json'))
    .map((file) => registeredFrom(readJson(file.path)).definition);

  it.each(definitions.map((d) => [`${d.id} ${d.version}`, d] as const))('%s', (_name, d) => {
    const fields = d.sections.flatMap((section) => section.fields);
    const leaves = (field: FieldDefinition) => {
      const ids: string[] = [];
      if (field.showIf) forEachLeaf(field.showIf, '$', (leaf) => ids.push(leaf.field));
      return ids;
    };
    const dependencies = fieldDependencies(d);
    for (const field of fields) {
      const formerEnables = fields
        .filter((other) => leaves(other).includes(field.id))
        .map((other) => other.id);
      expect(dependencies.get(field.id)?.enables, field.id).toEqual(formerEnables);
    }
  });
});
