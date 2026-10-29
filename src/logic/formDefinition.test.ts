import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import beispiel110 from '../../tests/fixtures/forms/beispiel/1.1.0.json';
import { checkFormDefinition, findCycle, parseFormDefinition } from './formDefinition';
import { canonicalHash } from './hash';
import { linkedForm, logicForm } from '../../tests/support/sample';
import type { FieldDefinition, FormDefinition, RoleDefinition } from './model';

const REMOVE = Symbol('remove');

/** Clone of the fixture with one raw change at `path` (or the property removed). */
function rawWith(path: readonly (string | number)[], change: unknown): unknown {
  const raw: unknown = structuredClone(beispiel);
  let node = raw as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
  const last = path.at(-1) ?? '';
  if (change === REMOVE) Reflect.deleteProperty(node, last);
  else node[last] = change;
  return raw;
}

function definition(): FormDefinition {
  const result = parseFormDefinition(structuredClone(beispiel));
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.definition;
}

function fieldAt(d: FormDefinition, section: number, index: number): FieldDefinition {
  const field = d.sections[section]?.fields[index];
  if (!field) throw new Error(`no field ${section}/${index}`);
  return field;
}

function roleAt(d: FormDefinition, index: number): RoleDefinition {
  const role = d.roles[index];
  if (!role) throw new Error(`no role ${index}`);
  return role;
}

const textField = (id: string): FieldDefinition => ({
  id,
  role: 'person',
  type: 'text',
  label: 'Spalte',
  required: false,
  purpose: 'Test',
});

describe('parseFormDefinition — valid input', () => {
  it('accepts the fixture form', () => {
    const result = parseFormDefinition(beispiel);
    expect(result.ok).toBe(true);
  });

  it('decodes without adding or dropping anything (hash of raw = hash of decoded)', () => {
    expect(canonicalHash(definition())).toBe(canonicalHash(beispiel));
  });
});

describe('parseFormDefinition — shape and type errors', () => {
  it.each<[string, readonly (string | number)[], unknown, string, string]>([
    ['unknown property', ['extra'], 1, '$.extra', 'unknown property'],
    ['bad version', ['version'], '1.0', '$.version', 'must match'],
    ['bad form id', ['id'], 'Beispiel', '$.id', 'must match'],
    ['missing title', ['title'], REMOVE, '$.title', 'missing required property'],
    ['no roles', ['roles'], [], '$.roles', 'needs at least 1'],
    [
      'bad signature',
      ['roles', 0, 'signature'],
      'maybe',
      '$.roles[0].signature',
      'expected one of',
    ],
    [
      'bad role condition',
      ['roles', 1, 'requiredIf', 'kind'],
      'adult',
      '$.roles[1].requiredIf.kind',
      'expected one of',
    ],
    [
      'bad field type',
      ['sections', 0, 'fields', 0, 'type'],
      'number',
      '$.sections[0].fields[0].type',
      'expected one of',
    ],
    [
      'non-boolean required',
      ['sections', 0, 'fields', 0, 'required'],
      'yes',
      '$.sections[0].fields[0].required',
      'expected a boolean',
    ],
    [
      'empty label',
      ['sections', 0, 'fields', 0, 'label'],
      '',
      '$.sections[0].fields[0].label',
      'must not be empty',
    ],
    [
      'non-NFC label',
      ['sections', 0, 'fields', 0, 'label'],
      'Zoe\u0308',
      '$.sections[0].fields[0].label',
      'NFC',
    ],
    [
      'unpaired surrogate',
      ['sections', 0, 'fields', 0, 'purpose'],
      'a\ud800',
      '$.sections[0].fields[0].purpose',
      'unpaired surrogate',
    ],
    [
      'bad field id',
      ['sections', 0, 'fields', 0, 'id'],
      'Nach-Name',
      '$.sections[0].fields[0].id',
      'must match',
    ],
    ['empty field list', ['sections', 0, 'fields'], [], '$.sections[0].fields', 'needs at least 1'],
    [
      'empty options',
      ['sections', 0, 'fields', 4, 'options'],
      [],
      '$.sections[0].fields[4].options',
      'needs at least 1',
    ],
    [
      'bad option id',
      ['sections', 0, 'fields', 4, 'options', 0, 'id'],
      'mini job',
      '$.sections[0].fields[4].options[0].id',
      'must match',
    ],
    [
      'empty all',
      ['sections', 0, 'fields', 4, 'showIf'],
      { all: [] },
      '$.sections[0].fields[4].showIf.all',
      'needs at least 1',
    ],
    [
      'all and any',
      ['sections', 0, 'fields', 4, 'showIf'],
      { all: [{ field: 'a', equals: true }], any: [] },
      '$.sections[0].fields[4].showIf.any',
      'unknown property',
    ],
    [
      'numeric equals',
      ['sections', 0, 'fields', 4, 'showIf', 'equals'],
      1,
      '$.sections[0].fields[4].showIf.equals',
      'expected a string',
    ],
    [
      'bad computed',
      ['sections', 0, 'fields', 0, 'computed'],
      { fn: 'alter' },
      '$.sections[0].fields[0].computed.args',
      'missing required property',
    ],
    [
      'three compared fields',
      ['consistencyRules', 0, 'fields'],
      ['nachname', 'agNachname', 'eintritt'],
      '$.consistencyRules[0].fields',
      'exactly 2',
    ],
    [
      'bad match-key role',
      ['matchKeys', 0, 'fields'],
      { Person: 'nachname', arbeitgeber: 'agNachname' },
      '$.matchKeys[0].fields.Person',
      'key must match',
    ],
    [
      'German date in asOf',
      ['infoBlocks', 0, 'asOf'],
      '29.10.2026',
      '$.infoBlocks[0].asOf',
      'must match',
    ],
    [
      'bad acknowledgement',
      ['infoBlocks', 0, 'acknowledgement'],
      'signed',
      '$.infoBlocks[0].acknowledgement',
      'expected one of',
    ],
    ['recipient as string', ['recipient'], 'Lohnbüro', '$.recipient', 'expected an object'],
    ['legal notes as string', ['legalNotes'], 'Hinweis', '$.legalNotes', 'expected an array'],
  ])('reports %s', (_label, path, change, issuePath, message) => {
    const result = parseFormDefinition(rawWith(path, change));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      path: issuePath,
      message: expect.stringContaining(message),
    });
  });

  it.each<[string, unknown]>([
    ['an array', []],
    ['null', null],
    ['a string', 'form'],
  ])('rejects %s as root', (_label, raw) => {
    expect(parseFormDefinition(raw)).toEqual({
      ok: false,
      issues: [{ path: '$', message: 'expected an object' }],
    });
  });

  it('limits the nesting of conditions', () => {
    let condition: unknown = { field: 'weitereBeschaeftigung', equals: true };
    for (let i = 0; i < 8; i++) condition = { all: [condition] };
    const result = parseFormDefinition(rawWith(['sections', 0, 'fields', 4, 'showIf'], condition));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message)).toContain('condition nested too deeply');
  });

  it('accepts nested all/any conditions within the limit', () => {
    const condition = {
      any: [
        { all: [{ field: 'weitereBeschaeftigung', equals: true }] },
        { field: 'weitereBeschaeftigung', equals: false },
      ],
    };
    expect(parseFormDefinition(rawWith(['sections', 0, 'fields', 4, 'showIf'], condition)).ok).toBe(
      true,
    );
  });
});

describe('checkFormDefinition — references', () => {
  it.each<[string, (d: FormDefinition) => void, string, string]>([
    [
      'duplicate field id',
      (d) => {
        fieldAt(d, 1, 1).id = 'nachname';
      },
      '$.sections[1].fields[1].id',
      'duplicate field id "nachname"',
    ],
    [
      'duplicate column id',
      (d) => {
        Object.assign(fieldAt(d, 0, 5), { type: 'repeatGroup', columns: [textField('nachname')] });
        delete fieldAt(d, 0, 5).multiline;
      },
      '$.sections[0].fields[5].columns[0].id',
      'duplicate field id',
    ],
    [
      'unknown field role',
      (d) => {
        fieldAt(d, 0, 0).role = 'kanzlei';
      },
      '$.sections[0].fields[0].role',
      'unknown role "kanzlei"',
    ],
    [
      'choice without options',
      (d) => {
        delete fieldAt(d, 0, 4).options;
      },
      '$.sections[0].fields[4]',
      'needs options',
    ],
    [
      'options on a text field',
      (d) => {
        fieldAt(d, 0, 0).options = [{ id: 'x', label: 'X' }];
      },
      '$.sections[0].fields[0].options',
      'only choice fields',
    ],
    [
      'duplicate option id',
      (d) => {
        fieldAt(d, 0, 4).options = [
          { id: 'sv', label: 'A' },
          { id: 'sv', label: 'B' },
        ];
      },
      '$.sections[0].fields[4].options[1].id',
      'duplicate option id',
    ],
    [
      'repeat group without columns',
      (d) => {
        fieldAt(d, 0, 5).type = 'repeatGroup';
        delete fieldAt(d, 0, 5).multiline;
      },
      '$.sections[0].fields[5]',
      'needs columns',
    ],
    [
      'columns on a text field',
      (d) => {
        fieldAt(d, 0, 0).columns = [textField('spalte')];
      },
      '$.sections[0].fields[0].columns',
      'only repeatGroup',
    ],
    [
      'nested repeat groups',
      (d) => {
        Object.assign(fieldAt(d, 0, 5), {
          type: 'repeatGroup',
          columns: [{ ...textField('innen'), type: 'repeatGroup', columns: [textField('tief')] }],
        });
        delete fieldAt(d, 0, 5).multiline;
      },
      '$.sections[0].fields[5].columns[0]',
      'cannot be nested',
    ],
    [
      'multiline date',
      (d) => {
        fieldAt(d, 0, 1).multiline = true;
      },
      '$.sections[0].fields[1].multiline',
      'only text fields',
    ],
    [
      'showIf on an unknown field',
      (d) => {
        fieldAt(d, 0, 4).showIf = { field: 'gibtEsNicht', equals: true };
      },
      '$.sections[0].fields[4].showIf.field',
      'unknown field',
    ],
    [
      'showIf across roles',
      (d) => {
        fieldAt(d, 0, 3).role = 'arbeitgeber';
      },
      '$.sections[0].fields[4].showIf.field',
      'same role',
    ],
    [
      'boolean compared with a string',
      (d) => {
        fieldAt(d, 0, 4).showIf = { field: 'weitereBeschaeftigung', equals: 'ja' };
      },
      '$.sections[0].fields[4].showIf.equals',
      'expected a boolean',
    ],
    [
      'unknown option in showIf',
      (d) => {
        fieldAt(d, 0, 5).showIf = { field: 'weitereArt', equals: 'teilzeit' };
      },
      '$.sections[0].fields[5].showIf.equals',
      'not an option id',
    ],
    [
      'showIf on a text field',
      (d) => {
        fieldAt(d, 0, 5).showIf = { field: 'nachname', equals: 'x' };
      },
      '$.sections[0].fields[5].showIf.field',
      'boolean or choice',
    ],
    [
      'showIf cycle',
      (d) => {
        fieldAt(d, 0, 3).showIf = { field: 'weitereArt', equals: 'sv' };
      },
      '$',
      'cycle',
    ],
    [
      'showIf on itself',
      (d) => {
        fieldAt(d, 0, 3).showIf = { field: 'weitereBeschaeftigung', equals: true };
      },
      '$',
      'cycle: weitereBeschaeftigung → weitereBeschaeftigung',
    ],
    [
      'unknown compute function',
      (d) => {
        fieldAt(d, 0, 0).computed = { fn: 'alter', args: ['geburtsdatum'] };
      },
      '$.sections[0].fields[0].computed.fn',
      'unknown compute function',
    ],
    [
      'unknown compute argument',
      (d) => {
        fieldAt(d, 0, 0).computed = { fn: 'alter', args: ['geburtstag'] };
      },
      '$.sections[0].fields[0].computed.args[0]',
      'unknown field',
    ],
    [
      'requiredIf on an unknown field',
      (d) => {
        roleAt(d, 1).requiredIf = { kind: 'minorOnSigning', birthDateField: 'geburtstag' };
      },
      '$.roles[1].requiredIf.birthDateField',
      'unknown field',
    ],
    [
      'requiredIf on a text field',
      (d) => {
        roleAt(d, 1).requiredIf = { kind: 'minorOnSigning', birthDateField: 'nachname' };
      },
      '$.roles[1].requiredIf.birthDateField',
      'date field',
    ],
    [
      'role without fields and signature',
      (d) => {
        roleAt(d, 1).signature = 'none';
      },
      '$.roles[1]',
      'neither fields nor a signature',
    ],
    [
      'duplicate role id',
      (d) => {
        roleAt(d, 2).id = 'person';
      },
      '$.roles[2].id',
      'duplicate id "person"',
    ],
    [
      'duplicate section id',
      (d) => {
        Object.assign(d.sections[1] ?? {}, { id: 'persoenlich' });
      },
      '$.sections[1].id',
      'duplicate id',
    ],
    [
      'notice for an unknown role',
      (d) => {
        Object.assign(d.infoBlocks[0] ?? {}, { role: 'kanzlei' });
      },
      '$.infoBlocks[0].role',
      'unknown role',
    ],
    [
      'notice dated 30 February',
      (d) => {
        Object.assign(d.infoBlocks[0] ?? {}, { asOf: '2026-02-30' });
      },
      '$.infoBlocks[0].asOf',
      'not a calendar date',
    ],
    [
      'rule on an unknown field',
      (d) => {
        Object.assign(d.consistencyRules[0] ?? {}, { fields: ['nachname', 'name'] });
      },
      '$.consistencyRules[0].fields[1]',
      'unknown field',
    ],
    [
      'rule comparing a field with itself',
      (d) => {
        Object.assign(d.consistencyRules[0] ?? {}, { fields: ['nachname', 'nachname'] });
      },
      '$.consistencyRules[0].fields',
      'with itself',
    ],
    [
      'match key with one role',
      (d) => {
        Object.assign(d.matchKeys[0] ?? {}, { fields: { person: 'nachname' } });
      },
      '$.matchKeys[0].fields',
      'at least 2 roles',
    ],
    [
      'match key on an unknown role',
      (d) => {
        Object.assign(d.matchKeys[0] ?? {}, {
          fields: { person: 'nachname', kanzlei: 'agNachname' },
        });
      },
      '$.matchKeys[0].fields.kanzlei',
      'unknown role',
    ],
    [
      'match key field of another role',
      (d) => {
        Object.assign(d.matchKeys[0] ?? {}, {
          fields: { person: 'agNachname', arbeitgeber: 'nachname' },
        });
      },
      '$.matchKeys[0].fields.person',
      'belongs to role "arbeitgeber"',
    ],
  ])('reports %s', (_label, mutate, path, message) => {
    const d = definition();
    expect(checkFormDefinition(d)).toEqual([]);
    mutate(d);
    expect(checkFormDefinition(d)).toContainEqual({
      path,
      message: expect.stringContaining(message),
    });
  });

  it('reports issues through parseFormDefinition as well', () => {
    const result = parseFormDefinition(rawWith(['sections', 0, 'fields', 1, 'role'], 'kanzlei'));
    expect(result).toEqual({
      ok: false,
      issues: [{ path: '$.sections[0].fields[1].role', message: 'unknown role "kanzlei"' }],
    });
  });
});

describe('findCycle', () => {
  it('finds none in an acyclic graph', () => {
    expect(
      findCycle(
        new Map([
          ['a', ['b', 'c']],
          ['b', ['c']],
          ['c', []],
        ]),
      ),
    ).toBeUndefined();
  });

  it('returns the cycle path', () => {
    expect(
      findCycle(
        new Map([
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['a']],
        ]),
      ),
    ).toEqual(['a', 'b', 'c', 'a']);
  });

  it('finds a cycle that does not include the first node', () => {
    expect(
      findCycle(
        new Map([
          ['a', ['b']],
          ['b', ['c']],
          ['c', ['b']],
        ]),
      ),
    ).toEqual(['b', 'c', 'b']);
  });
});

describe('checkFormDefinition — signer name and conditional roles', () => {
  it('accepts the fixture with a guardian name field (1.1.0)', () => {
    const result = parseFormDefinition(beispiel110);
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it.each<[string, (d: FormDefinition) => void, string, string]>([
    [
      'a signer name on an unknown field',
      (d) => {
        roleAt(d, 1).signerNameField = 'gibtEsNicht';
      },
      '$.roles[1].signerNameField',
      'unknown field',
    ],
    [
      "a signer name on another role's field",
      (d) => {
        roleAt(d, 1).signerNameField = 'nachname';
      },
      '$.roles[1].signerNameField',
      'same role',
    ],
    [
      'a signer name on a date field',
      (d) => {
        roleAt(d, 0).signerNameField = 'geburtsdatum';
      },
      '$.roles[0].signerNameField',
      'required, always visible text field',
    ],
    [
      'a signer name on an optional field',
      (d) => {
        roleAt(d, 0).signerNameField = 'bemerkungen';
      },
      '$.roles[0].signerNameField',
      'required, always visible text field',
    ],
    [
      'a conditional role that may skip signing',
      (d) => {
        roleAt(d, 1).signature = 'optional';
      },
      '$.roles[1].signature',
      'must sign',
    ],
    [
      'a person who may skip signing although the guardian depends on the age',
      (d) => {
        roleAt(d, 0).signature = 'optional';
      },
      '$.roles[1].requiredIf.birthDateField',
      'role "person" must sign',
    ],
    [
      'a role conditional on its own birth date',
      (d) => {
        roleAt(d, 0).requiredIf = { kind: 'minorOnSigning', birthDateField: 'geburtsdatum' };
      },
      '$.roles[0].requiredIf.birthDateField',
      'another role',
    ],
  ])('reports %s', (_label, mutate, path, message) => {
    const d = definition();
    mutate(d);
    expect(checkFormDefinition(d)).toContainEqual({
      path,
      message: expect.stringContaining(message),
    });
  });
});

describe('conditions — operators and requiredIf', () => {
  it('accepts every operator (in-memory logic form)', () => {
    expect(logicForm().definition.sections.at(-1)?.fields).toHaveLength(6);
  });

  it('decodes in, contains, answered and not, and checks them', () => {
    const condition = {
      any: [
        { field: 'weitereArt', in: ['minijob', 'sv'] },
        { not: { field: 'bemerkungen', answered: true } },
      ],
    };
    const result = parseFormDefinition(
      rawWith(['sections', 0, 'fields', 0, 'requiredIf'], condition),
    );
    expect(result.ok ? [] : result.issues).toEqual([
      {
        path: '$.sections[0].fields[0].requiredIf',
        message: 'use either "required": true or "requiredIf", not both',
      },
    ]);
  });

  it.each<[string, readonly (string | number)[], unknown, string, string]>([
    [
      'two operators in one leaf',
      ['sections', 0, 'fields', 4, 'showIf'],
      { field: 'weitereBeschaeftigung', equals: true, answered: true },
      '$.sections[0].fields[4].showIf',
      'needs exactly one of',
    ],
    [
      'a leaf without operator',
      ['sections', 0, 'fields', 4, 'showIf'],
      { field: 'weitereBeschaeftigung' },
      '$.sections[0].fields[4].showIf',
      'needs exactly one of',
    ],
    [
      'an empty "in" list',
      ['sections', 0, 'fields', 5, 'showIf'],
      { field: 'weitereArt', in: [] },
      '$.sections[0].fields[5].showIf.in',
      'needs at least 1',
    ],
    [
      '"answered" as text',
      ['sections', 0, 'fields', 5, 'showIf'],
      { field: 'weitereArt', answered: 'ja' },
      '$.sections[0].fields[5].showIf.answered',
      'expected a boolean',
    ],
    [
      '"not" with a list',
      ['sections', 0, 'fields', 5, 'showIf'],
      { not: [{ field: 'weitereArt', answered: true }] },
      '$.sections[0].fields[5].showIf.not',
      'expected an object',
    ],
  ])('rejects %s', (_label, path, change, issuePath, message) => {
    const result = parseFormDefinition(rawWith(path, change));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      path: issuePath,
      message: expect.stringContaining(message),
    });
  });

  it.each<[string, (d: FormDefinition) => void, string, string]>([
    [
      'required together with requiredIf',
      (d) => {
        fieldAt(d, 0, 0).requiredIf = { field: 'bemerkungen', answered: true };
      },
      '$.sections[0].fields[0].requiredIf',
      'not both',
    ],
    [
      'requiredIf on its own field',
      (d) => {
        fieldAt(d, 0, 5).requiredIf = { field: 'bemerkungen', answered: true };
      },
      '$.sections[0].fields[5].requiredIf.field',
      'cannot make itself required',
    ],
    [
      'requiredIf across roles',
      (d) => {
        fieldAt(d, 0, 5).requiredIf = { field: 'eintritt', answered: true };
      },
      '$.sections[0].fields[5].requiredIf.field',
      'same role',
    ],
    [
      'requiredIf on an unknown option',
      (d) => {
        fieldAt(d, 0, 5).requiredIf = { field: 'weitereArt', in: ['teilzeit'] };
      },
      '$.sections[0].fields[5].requiredIf.in',
      'not an option id',
    ],
    [
      'contains on a single choice',
      (d) => {
        fieldAt(d, 0, 5).showIf = { field: 'weitereArt', contains: 'sv' };
      },
      '$.sections[0].fields[5].showIf.field',
      'only applies to multiChoice',
    ],
    [
      'a cycle through "not"',
      (d) => {
        fieldAt(d, 0, 3).showIf = { not: { field: 'weitereArt', answered: true } };
      },
      '$',
      'cycle',
    ],
  ])('reports %s', (_label, mutate, path, message) => {
    const d = definition();
    mutate(d);
    expect(checkFormDefinition(d)).toContainEqual({
      path,
      message: expect.stringContaining(message),
    });
  });

  it('allows requiredIf dependencies in both directions (phone or e-mail)', () => {
    expect(checkFormDefinition(logicForm().definition)).toEqual([]);
  });
});

describe('preselection, master data and linked parts', () => {
  it('accepts them and decodes without adding anything', () => {
    const raw = structuredClone(beispiel) as unknown as Record<string, unknown>;
    const parsed = parseFormDefinition(linkedFormRaw(raw));
    expect(parsed.ok ? [] : parsed.issues).toEqual([]);
    if (parsed.ok) expect(canonicalHash(parsed.definition)).toBe(canonicalHash(raw));
    expect(checkFormDefinition(linkedForm().definition)).toEqual([]);
  });

  it.each<[string, readonly (string | number)[], unknown, string, string]>([
    [
      'a numeric preselection',
      ['sections', 0, 'fields', 3, 'initial'],
      1,
      '$.sections[0].fields[3].initial',
      'expected a string',
    ],
    [
      'a master-data key that is no id',
      ['sections', 1, 'fields', 0, 'masterData'],
      'Firma Name',
      '$.sections[1].fields[0].masterData',
      'must match',
    ],
    [
      'a link of three roles',
      ['partLinks'],
      [['person', 'arbeitgeber', 'vertretung']],
      '$.partLinks[0]',
      'needs exactly 2 role ids',
    ],
    ['an empty list of links', ['partLinks'], [], '$.partLinks', 'needs at least 1'],
  ])('rejects %s', (_label, path, change, issuePath, message) => {
    const result = parseFormDefinition(rawWith(path, change));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      path: issuePath,
      message: expect.stringContaining(message),
    });
  });

  it.each<[string, (d: FormDefinition) => void, string, string]>([
    [
      'a preselected text field',
      (d) => {
        fieldAt(d, 0, 0).initial = 'x';
      },
      '$.sections[0].fields[0].initial',
      'only yes/no and choice fields',
    ],
    [
      'a yes/no field preselected with an option id',
      (d) => {
        fieldAt(d, 0, 3).initial = 'ja';
      },
      '$.sections[0].fields[3].initial',
      'expected a boolean',
    ],
    [
      'an unknown option as preselection',
      (d) => {
        fieldAt(d, 0, 4).initial = 'teilzeit';
      },
      '$.sections[0].fields[4].initial',
      'not an option id',
    ],
    [
      'a preselected conditional field',
      (d) => {
        fieldAt(d, 0, 4).initial = 'minijob';
      },
      '$.sections[0].fields[4].initial',
      'only always available',
    ],
    [
      'a yes/no field as master data',
      (d) => {
        fieldAt(d, 0, 3).masterData = 'frage';
      },
      '$.sections[0].fields[3].masterData',
      'only single text values',
    ],
    [
      'a master-data key used twice',
      (d) => {
        fieldAt(d, 1, 0).masterData = 'name';
        fieldAt(d, 1, 1).masterData = 'name';
      },
      '$.sections[1].fields[1].masterData',
      'already used by "agNachname"',
    ],
    [
      'a link to an unknown role',
      (d) => {
        d.partLinks = [['person', 'kanzlei']];
      },
      '$.partLinks[0]',
      'unknown role "kanzlei"',
    ],
    [
      'a role linked with itself',
      (d) => {
        d.partLinks = [['person', 'person']];
      },
      '$.partLinks[0]',
      'with itself',
    ],
    [
      'a link to the conditional guardian',
      (d) => {
        d.partLinks = [['person', 'vertretung']];
      },
      '$.partLinks[0]',
      'conditional',
    ],
    [
      'the same pair twice',
      (d) => {
        d.partLinks = [
          ['person', 'arbeitgeber'],
          ['arbeitgeber', 'person'],
        ];
      },
      '$.partLinks[1]',
      'listed twice',
    ],
  ])('reports %s', (_label, mutate, path, message) => {
    const d = definition();
    mutate(d);
    expect(checkFormDefinition(d)).toContainEqual({
      path,
      message: expect.stringContaining(message),
    });
  });
});

/** The fixture with a preselection, a master-data field and a part link (raw JSON). */
function linkedFormRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const sections = raw.sections as { fields: Record<string, unknown>[] }[];
  const question = sections[0]?.fields[3];
  const employer = sections[1]?.fields[0];
  if (!question || !employer) throw new Error('fixture changed');
  question.initial = false;
  employer.masterData = 'name';
  raw.partLinks = [['person', 'arbeitgeber']];
  return raw;
}
