import { beispielForm, chainForm, logicForm } from '../../tests/support/sample';
import { fieldDependencies } from './dependencies';

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
