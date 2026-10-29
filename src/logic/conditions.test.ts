import { logicForm } from '../../tests/support/sample';
import {
  describeCondition,
  evaluateCondition,
  leafProblem,
  type LeafCondition,
} from './conditions';
import { fieldsById } from './form';
import type { Condition, FieldValue } from './model';

const fields = fieldsById(logicForm().definition);

function field(id: string) {
  const definition = fields.get(id);
  if (!definition) throw new Error(`no field ${id}`);
  return definition;
}

const data = (values: Record<string, FieldValue>) => (id: string) => values[id] ?? null;

describe('evaluateCondition', () => {
  it.each<[string, Condition, Record<string, FieldValue>, boolean]>([
    [
      'equals yes',
      { field: 'weitereBeschaeftigung', equals: true },
      { weitereBeschaeftigung: true },
      true,
    ],
    [
      'equals yes, answered no',
      { field: 'weitereBeschaeftigung', equals: true },
      { weitereBeschaeftigung: false },
      false,
    ],
    ['equals no, unanswered', { field: 'weitereBeschaeftigung', equals: false }, {}, false],
    ['in, listed', { field: 'kvArt', in: ['gesetzlich', 'privat'] }, { kvArt: 'privat' }, true],
    ['in, not listed', { field: 'kvArt', in: ['gesetzlich', 'privat'] }, { kvArt: 'keine' }, false],
    ['in, unanswered', { field: 'kvArt', in: ['gesetzlich'] }, {}, false],
    ['contains', { field: 'sprachen', contains: 'pl' }, { sprachen: ['de', 'pl'] }, true],
    ['contains, missing', { field: 'sprachen', contains: 'pl' }, { sprachen: ['de'] }, false],
    ['contains, unanswered', { field: 'sprachen', contains: 'pl' }, {}, false],
    ['answered, filled', { field: 'telefon', answered: true }, { telefon: '0721 1234' }, true],
    ['answered, empty', { field: 'telefon', answered: true }, {}, false],
    ['answered false, empty', { field: 'telefon', answered: false }, {}, true],
    [
      'answered counts "no" as an answer',
      { field: 'weitereBeschaeftigung', answered: true },
      { weitereBeschaeftigung: false },
      true,
    ],
    ['not', { not: { field: 'kvArt', equals: 'keine' } }, {}, true],
    [
      'all',
      {
        all: [
          { field: 'telefon', answered: true },
          { field: 'email', answered: true },
        ],
      },
      { telefon: 'x' },
      false,
    ],
    [
      'any',
      {
        any: [
          { field: 'telefon', answered: true },
          { field: 'email', answered: true },
        ],
      },
      { email: 'a@b.de' },
      true,
    ],
  ])('%s', (_label, condition, values, expected) => {
    expect(evaluateCondition(condition, data(values))).toBe(expected);
  });
});

describe('leafProblem', () => {
  it.each<[string, LeafCondition, string, string | undefined]>([
    [
      'equals on yes/no with a boolean',
      { field: 'weitereBeschaeftigung', equals: true },
      'weitereBeschaeftigung',
      undefined,
    ],
    [
      'equals on yes/no with text',
      { field: 'weitereBeschaeftigung', equals: 'ja' },
      'weitereBeschaeftigung',
      'equals: expected a boolean',
    ],
    ['equals on a choice with an option', { field: 'kvArt', equals: 'privat' }, 'kvArt', undefined],
    [
      'equals on a choice with a label',
      { field: 'kvArt', equals: 'Privat' },
      'kvArt',
      'equals: "Privat" is not an option id',
    ],
    [
      'equals on a text field',
      { field: 'telefon', equals: 'x' },
      'telefon',
      'field: "equals" only applies to boolean or choice fields',
    ],
    ['in with an empty list', { field: 'kvArt', in: [] }, 'kvArt', 'in: expected a non-empty list'],
    [
      'in with an unknown option',
      { field: 'kvArt', in: ['privat', 'beamte'] },
      'kvArt',
      'in: "beamte" is not an option id',
    ],
    [
      'in with a repeated option',
      { field: 'kvArt', in: ['privat', 'privat'] },
      'kvArt',
      'in: lists an option twice',
    ],
    [
      'in on a multiple choice',
      { field: 'sprachen', in: ['pl'] },
      'sprachen',
      'field: "in" only applies to choice fields',
    ],
    [
      'contains on a choice',
      { field: 'kvArt', contains: 'privat' },
      'kvArt',
      'field: "contains" only applies to multiChoice fields',
    ],
    [
      'contains with an unknown option',
      { field: 'sprachen', contains: 'en' },
      'sprachen',
      'contains: "en" is not an option id',
    ],
    [
      'answered on any field type',
      { field: 'geburtsdatum', answered: true },
      'geburtsdatum',
      undefined,
    ],
  ])('%s', (_label, leaf, target, expected) => {
    const problem = leafProblem(leaf, field(target));
    expect(problem && `${problem.at}: ${problem.message}`).toBe(expected);
  });
});

describe('describeCondition', () => {
  it.each<[Condition, string]>([
    [
      { field: 'weitereBeschaeftigung', equals: true },
      '„Üben Sie eine weitere Beschäftigung aus?“ ist „Ja“',
    ],
    [{ field: 'kvArt', equals: 'keine' }, '„Krankenversicherung“ ist „keine Angabe“'],
    [
      { field: 'kvArt', in: ['gesetzlich', 'privat'] },
      '„Krankenversicherung“ ist „gesetzlich“ oder „privat“',
    ],
    [{ field: 'sprachen', contains: 'pl' }, '„Sprachen“ enthält „Polnisch“'],
    [{ field: 'telefon', answered: false }, '„Telefon“ ist leer'],
    [{ field: 'telefon', answered: true }, '„Telefon“ ist ausgefüllt'],
    [
      { not: { field: 'kvArt', equals: 'keine' } },
      'nicht („Krankenversicherung“ ist „keine Angabe“)',
    ],
    [
      {
        all: [
          { field: 'telefon', answered: true },
          {
            any: [
              { field: 'email', answered: true },
              { field: 'kvArt', equals: 'privat' },
            ],
          },
        ],
      },
      '„Telefon“ ist ausgefüllt und („E-Mail“ ist ausgefüllt oder „Krankenversicherung“ ist „privat“)',
    ],
    [{ field: 'gibtEsNicht', answered: true }, '„gibtEsNicht“ (unbekanntes Feld)'],
  ])('%j', (condition, text) => {
    expect(describeCondition(condition, fields)).toBe(text);
  });
});
