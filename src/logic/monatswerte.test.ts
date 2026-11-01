// Building blocks of the monthly report (Tobias 2026-11-01): last month's value next to this
// month's (carryFrom), and suggestions from earlier answers (the employees, the Lohnart list).
import { registeredFrom } from '../../tests/support/formFiles';
import { ok, QUESTIONNAIRE_ID, tableForm } from '../../tests/support/sample';
import { answerSuggestions } from './answerSuggestions';
import { displayValue } from './display';
import { checkFormDefinition } from './formDefinition';
import type { FieldDefinition, FormDefinition } from './model';
import { prefillFrom } from './prefill';
import { createQuestionnaire, currentPart, setValue, startPart } from './questionnaire';

function withMonthlyColumns(): FormDefinition {
  const definition = structuredClone(tableForm().definition);
  const fields = definition.sections[0]?.fields ?? [];
  const kinder = fields.find((field) => field.id === 'kinder');
  if (!kinder?.columns) throw new Error('fixture changed');
  kinder.rowTitle = ['kindName'];
  kinder.columns.push({
    id: 'kindNameVormonat',
    role: 'person',
    type: 'text',
    label: 'Name im Vormonat',
    required: false,
    purpose: 'Test',
    carryFrom: 'kindName',
  });
  fields.push(
    {
      id: 'liste',
      role: 'person',
      type: 'text',
      label: 'Liste',
      required: false,
      purpose: 'Test',
      multiline: true,
    },
    {
      id: 'zeilen',
      role: 'person',
      type: 'repeatGroup',
      label: 'Zeilen',
      required: false,
      purpose: 'Test',
      columns: [
        {
          id: 'zeilePerson',
          role: 'person',
          type: 'text',
          label: 'Person',
          required: false,
          purpose: 'Test',
          suggestionsFrom: 'kinder',
        },
        {
          id: 'zeileArt',
          role: 'person',
          type: 'text',
          label: 'Art',
          required: false,
          purpose: 'Test',
          suggestionsFrom: 'liste',
        },
      ],
    },
  );
  return definition;
}

const column = (definition: FormDefinition, table: string, id: string): FieldDefinition => {
  const found = definition.sections
    .flatMap((section) => section.fields)
    .find((field) => field.id === table)
    ?.columns?.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no column ${id}`);
  return found;
};

describe('the monthly building blocks in a definition', () => {
  const definition = withMonthlyColumns();

  it('accepts last month’s column and suggestions from earlier answers', () => {
    expect(checkFormDefinition(definition)).toEqual([]);
  });

  it.each<[string, (d: FormDefinition) => void, string]>([
    [
      'last month of a column that does not exist',
      (d) => {
        column(d, 'kinder', 'kindNameVormonat').carryFrom = 'gibtEsNicht';
      },
      'is not another column of this table',
    ],
    [
      'last month of a column of another type',
      (d) => {
        column(d, 'kinder', 'kindNameVormonat').carryFrom = 'kindGeburtsdatum';
      },
      'must have the type text',
    ],
    [
      'a required column from last month',
      (d) => {
        column(d, 'kinder', 'kindNameVormonat').required = true;
      },
      'cannot be required',
    ],
    [
      'suggestions from a later field',
      (d) => {
        column(d, 'zeilen', 'zeilePerson').suggestionsFrom = 'zeilen';
      },
      'must be an earlier field',
    ],
    [
      'suggestions from a single-line text',
      (d) => {
        const liste = d.sections[0]?.fields.find((field) => field.id === 'liste');
        if (liste) delete liste.multiline;
      },
      'must be a table with rowTitle or a multi-line text',
    ],
  ])('refuses %s', (_label, change, message) => {
    const d = structuredClone(definition);
    change(d);
    expect(
      checkFormDefinition(d)
        .map((issue) => issue.message)
        .join(' | '),
    ).toContain(message);
  });
});

describe('suggestions from earlier answers', () => {
  const definition = withMonthlyColumns();
  const data = {
    kinder: [
      { rowId: 'r1', kindName: 'Anna', kindGeburtsdatum: '2015-02-01', kindVerhaeltnis: null },
      { rowId: 'r2', kindName: 'Ben', kindGeburtsdatum: '2017-03-04', kindVerhaeltnis: null },
      { rowId: 'r3', kindName: null, kindGeburtsdatum: '2019-01-01', kindVerhaeltnis: null },
    ],
    liste: '1000 Stundenlohn\n2000 Nachtzuschlag 25 %\n\n1000 Stundenlohn',
  };

  it('offers the row titles of a table, without empty rows', () => {
    expect(
      answerSuggestions(definition, column(definition, 'zeilen', 'zeilePerson'), data),
    ).toEqual(['Anna', 'Ben']);
  });

  it('offers the lines of a multi-line text, each once', () => {
    expect(answerSuggestions(definition, column(definition, 'zeilen', 'zeileArt'), data)).toEqual([
      '1000 Stundenlohn',
      '2000 Nachtzuschlag 25 %',
    ]);
  });

  it('stores any text: suggestions are only offered', () => {
    const registered = registeredFrom(definition);
    const q = ok(
      startPart(createQuestionnaire(QUESTIONNAIRE_ID, registered), registered, 'person'),
    );
    const result = setValue(q, registered, 'person', 'zeilen', [
      { rowId: 'r1', zeilePerson: 'Carla', zeileArt: '3000 Prämie' },
    ]);
    expect(result).toMatchObject({ ok: true, warnings: [] });
  });
});

describe('last month’s value', () => {
  const definition = withMonthlyColumns();
  const registered = registeredFrom(definition);
  const kinder = definition.sections[0]?.fields.find((field) => field.id === 'kinder');
  if (!kinder) throw new Error('fixture changed');

  it('is filled from the other column when last month’s file is taken over', () => {
    let previous = ok(
      startPart(createQuestionnaire(QUESTIONNAIRE_ID, registered), registered, 'person'),
    );
    previous = ok(
      setValue(previous, registered, 'person', 'kinder', [
        { rowId: 'r1', kindName: 'Anna', kindGeburtsdatum: '01.02.2015' },
      ]),
    );
    const next = createQuestionnaire('4f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1d', registered);
    const { questionnaire } = prefillFrom(next, registered, previous, registered);
    expect(currentPart(questionnaire, 'person')?.data.kinder).toEqual([
      {
        rowId: 'r1',
        kindName: 'Anna',
        kindGeburtsdatum: '2015-02-01',
        kindVerhaeltnis: null,
        kindNameVormonat: 'Anna',
      },
    ]);
  });

  it('marks a row "geändert" when this month’s answer differs', () => {
    const row = (name: string) => [
      {
        rowId: 'r1',
        kindName: name,
        kindGeburtsdatum: '2015-02-01',
        kindVerhaeltnis: null,
        kindNameVormonat: 'Anna',
      },
    ];
    expect(displayValue(kinder, row('Anna'))).not.toContain('geändert');
    expect(displayValue(kinder, row('Anna Maria'))).toContain('Name im Vormonat: Anna (geändert)');
  });
});
