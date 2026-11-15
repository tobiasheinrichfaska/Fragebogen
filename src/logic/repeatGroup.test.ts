import {
  QUESTIONNAIRE_ID,
  ok,
  personSealInput,
  PERSON_VALUES,
  tableForm,
} from '../../tests/support/sample';
import { displayValue } from './display';
import { fieldStates, fieldsById } from './form';
import { checkFormDefinition } from './formDefinition';
import { canonicalize } from './jcs';
import type { FieldDefinition, Questionnaire } from './model';
import { issueMessage } from './issues';
import { MAX_ROWS, missingCells, nextRowId, normalizeRows } from './normalize';
import { createQuestionnaire, currentPart, sealPart, setValue, startPart } from './questionnaire';
import { verifyQuestionnaire } from './verify';
import { registryOf } from './formRegistry';

const form = tableForm();
const table = fieldsById(form.definition).get('kinder') as FieldDefinition;

const ANNA = {
  rowId: 'r1',
  kindName: ' Anna ',
  kindGeburtsdatum: '1.2.2015',
  kindVerhaeltnis: 'leiblich',
};
const BEN = { rowId: 'r2', kindName: 'Ben', kindGeburtsdatum: '2017-03-04' };

describe('normalizeRows', () => {
  it('normalises every cell by its column type and lists all columns', () => {
    expect(normalizeRows(table, [ANNA, BEN])).toEqual({
      ok: true,
      warnings: [],
      value: [
        {
          rowId: 'r1',
          kindName: 'Anna',
          kindGeburtsdatum: '2015-02-01',
          kindVerhaeltnis: 'leiblich',
        },
        { rowId: 'r2', kindName: 'Ben', kindGeburtsdatum: '2017-03-04', kindVerhaeltnis: null },
      ],
    });
  });

  it('is idempotent on its own output', () => {
    const once = normalizeRows(table, [ANNA, BEN]);
    if (!once.ok) throw new Error(once.issue);
    expect(normalizeRows(table, once.value)).toEqual(once);
  });

  it('drops rows without any answer; no rows is unanswered', () => {
    expect(normalizeRows(table, [{ rowId: 'r1', kindName: '  ' }])).toEqual({
      ok: true,
      value: null,
      warnings: [],
    });
    expect(normalizeRows(table, [])).toEqual({ ok: true, value: null, warnings: [] });
    expect(normalizeRows(table, null)).toEqual({ ok: true, value: null, warnings: [] });
  });

  it.each<[string, unknown, Record<string, unknown>]>([
    ['not a list', 'Anna', { issue: 'value.type' }],
    ['a row that is no object', ['Anna'], { issue: 'value.type', row: 0 }],
    [
      'an unknown column',
      [{ rowId: 'r1', alter: '9' }],
      { issue: 'rows.unknownColumn', row: 0, column: 'alter' },
    ],
    ['a missing row id', [{ kindName: 'Anna' }], { issue: 'rows.rowId', row: 0 }],
    ['a malformed row id', [{ rowId: 'x1', kindName: 'Anna' }], { issue: 'rows.rowId', row: 0 }],
    ['a row id twice', [ANNA, { ...BEN, rowId: 'r1' }], { issue: 'rows.rowId', row: 1 }],
    [
      'an invalid cell',
      [ANNA, { ...BEN, kindGeburtsdatum: '31.02.2017' }],
      { issue: 'date.invalid', row: 1, column: 'kindGeburtsdatum' },
    ],
    [
      'too many rows',
      Array.from({ length: MAX_ROWS + 1 }, (_, i) => ({ rowId: `r${i + 1}`, kindName: 'X' })),
      { issue: 'rows.tooMany' },
    ],
  ])('refuses %s and names the cell', (_label, raw, expected) => {
    expect(normalizeRows(table, raw)).toEqual({ ok: false, ...expected });
  });
});

// Tobias 2026-11-15: „30 reichen vorerst, erweitere aber vorsichtshalber auf 100“ — a table may name
// its own limit up to 100; without one it keeps 30, so frozen forms take what they took.
describe('maxRows', () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ rowId: `r${i + 1}`, kindName: 'X' }));
  const wide: FieldDefinition = { ...table, maxRows: 100 };

  it('takes 30 rows without a limit of its own and as many as the table names', () => {
    expect(MAX_ROWS).toBe(30);
    expect(normalizeRows(table, rows(30)).ok).toBe(true);
    expect(normalizeRows(table, rows(31))).toEqual({ ok: false, issue: 'rows.tooMany' });
    expect(normalizeRows(wide, rows(100)).ok).toBe(true);
    expect(normalizeRows(wide, rows(101))).toEqual({ ok: false, issue: 'rows.tooMany' });
  });

  it('names the limit in the message', () => {
    expect(issueMessage('rows.tooMany', table)).toBe(
      'Die Tabelle hat zu viele Zeilen (höchstens 30).',
    );
    expect(issueMessage('rows.tooMany', wide)).toBe(
      'Die Tabelle hat zu viele Zeilen (höchstens 100).',
    );
  });

  it('belongs to tables only and goes up to 100', () => {
    const problems = (change: (definition: typeof form.definition) => void) => {
      const definition = structuredClone(form.definition);
      change(definition);
      return checkFormDefinition(definition).map((issue) => issue.message);
    };
    const group = (definition: typeof form.definition) =>
      definition.sections[0]?.fields.find((f) => f.id === 'kinder') as FieldDefinition;
    expect(problems((d) => (group(d).maxRows = 100))).toEqual([]);
    expect(problems((d) => (group(d).maxRows = 101))).toEqual(['at most 100 rows']);
    expect(
      problems((d) => {
        const column = group(d).columns?.[0];
        if (column) column.maxRows = 5;
      }),
    ).toEqual(['only tables have maxRows']);
  });
});

describe('nextRowId', () => {
  it('takes one above the highest number, so ids never shift', () => {
    expect(nextRowId([])).toBe('r1');
    expect(nextRowId([{ rowId: 'r1' }, { rowId: 'r3' }])).toBe('r4');
    expect(nextRowId([{ rowId: 'kaputt' }, {}])).toBe('r1');
  });
});

describe('tables in a questionnaire', () => {
  const started = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
  const fill = (q: Questionnaire) =>
    Object.entries(PERSON_VALUES).reduce(
      (acc, [id, raw]) => ok(setValue(acc, form, 'person', id, raw)),
      q,
    );

  it('marks a table with an empty required cell as incomplete, and refuses to sign it', () => {
    const q = ok(
      setValue(fill(started()), form, 'person', 'kinder', [{ rowId: 'r1', kindName: 'Anna' }]),
    );
    const value = currentPart(q, 'person')?.data.kinder;
    expect(missingCells(table, value)).toEqual([{ rowId: 'r1', column: 'kindGeburtsdatum' }]);
    expect(
      fieldStates(form.definition, 'person', currentPart(q, 'person')?.data ?? {}).get('kinder'),
    ).toMatchObject({
      required: false,
      missing: true,
    });
    const refused = sealPart(q, form, 'person', personSealInput());
    expect(refused.ok ? [] : [refused.code, ...refused.detail]).toEqual([
      'missingRequired',
      'kinder',
    ]);
  });

  it('seals a complete table and names it when a cell is changed afterwards', () => {
    let q = ok(setValue(fill(started()), form, 'person', 'kinder', [ANNA, BEN]));
    q = ok(sealPart(q, form, 'person', personSealInput()));
    const registry = registryOf([form]);
    expect(verifyQuestionnaire(q, { registry }).level).toBe('ok');
    const changed = structuredClone(q);
    const rows = changed.parts.person?.[0]?.data.kinder as Record<string, unknown>[];
    if (rows[1]) rows[1].kindName = 'Benjamin';
    const verdict = verifyQuestionnaire(changed, { registry });
    expect(verdict.parts[0]?.fieldDiff?.changed).toEqual(['kinder']);
    expect(canonicalize(q)).not.toBe(canonicalize(changed));
  });

  it('reads as numbered lines', () => {
    const rows = normalizeRows(table, [ANNA, BEN]);
    if (!rows.ok) throw new Error(rows.issue);
    expect(displayValue(table, rows.value)).toBe(
      '1. Name: Anna; Geburtsdatum: 01.02.2015; Verhältnis: leibliches Kind\n' +
        '2. Name: Ben; Geburtsdatum: 04.03.2017; Verhältnis: –',
    );
  });
});

describe('table columns in a definition', () => {
  const variant = (change: (column: FieldDefinition) => void) => {
    const definition = structuredClone(form.definition);
    const group = definition.sections[0]?.fields.find((f) => f.id === 'kinder');
    const column = group?.columns?.[0];
    if (!column) throw new Error('fixture changed');
    change(column);
    return checkFormDefinition(definition)
      .map((issue) => issue.message)
      .join(' | ');
  };

  it('accepts the test form', () => {
    expect(checkFormDefinition(form.definition)).toEqual([]);
  });

  it.each<[string, (column: FieldDefinition) => void, string]>([
    [
      'another role',
      (c) => {
        c.role = 'arbeitgeber';
      },
      "must belong to the table's role",
    ],
    [
      'a condition on a field outside the row',
      (c) => {
        c.showIf = { field: 'nachname', answered: true };
      },
      '"nachname" is not an earlier column of this table',
    ],
    [
      'a condition on a later column',
      (c) => {
        c.showIf = { field: 'kindVerhaeltnis', equals: 'leiblich' };
      },
      '"kindVerhaeltnis" is not an earlier column of this table',
    ],
    [
      'a preselection',
      (c) => {
        c.initial = 'x';
      },
      'table columns cannot have initial',
    ],
    [
      'the reserved id',
      (c) => {
        c.id = 'rowId';
      },
      'reserved',
    ],
    [
      'a file type',
      (c) => {
        c.type = 'file';
      },
      'cannot hold a file',
    ],
  ])('refuses a column with %s', (_label, change, message) => {
    expect(variant(change)).toContain(message);
  });
});

// Tobias 2026-11-01: hours of absence only for an hourly wage — a column asked by the row's own
// earlier answers.
describe('row conditions', () => {
  const definition = structuredClone(form.definition);
  const kinder = definition.sections[0]?.fields.find((f) => f.id === 'kinder');
  const geburt = kinder?.columns?.find((c) => c.id === 'kindGeburtsdatum');
  if (!kinder || !geburt) throw new Error('fixture changed');
  geburt.showIf = { field: 'kindName', answered: true };

  it('accepts a condition on an earlier column of the same row', () => {
    expect(checkFormDefinition(definition)).toEqual([]);
  });

  it('stores a cell whose condition does not hold as empty', () => {
    const rows = normalizeRows(kinder, [
      { rowId: 'r1', kindGeburtsdatum: '2015-02-01', kindVerhaeltnis: 'leiblich' },
      { rowId: 'r2', kindName: 'Ben', kindGeburtsdatum: '2017-03-04' },
    ]);
    expect(rows).toMatchObject({
      ok: true,
      value: [
        { rowId: 'r1', kindName: null, kindGeburtsdatum: null, kindVerhaeltnis: 'leiblich' },
        { rowId: 'r2', kindName: 'Ben', kindGeburtsdatum: '2017-03-04' },
      ],
    });
  });

  it('does not miss a required cell that is not asked in its row', () => {
    const required = {
      ...kinder,
      columns: (kinder.columns ?? []).map((c) => ({ ...c, required: true })),
    };
    expect(
      missingCells(required, [
        { rowId: 'r1', kindName: null, kindGeburtsdatum: null, kindVerhaeltnis: 'leiblich' },
      ]),
    ).toEqual([{ rowId: 'r1', column: 'kindName' }]);
  });
});
