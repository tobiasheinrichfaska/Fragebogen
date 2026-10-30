// docs/ki-anleitung-formulare.md is the prompt that lets any AI build or adapt a form: it must name
// every key and value the decoder knows, and its example must be a valid definition.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CONDITION_OPERATORS } from '../../src/logic/conditions';
import {
  FIELD_KEYS,
  FORM_KEYS,
  ROLE_KEYS,
  parseFormDefinition,
} from '../../src/logic/formDefinition';
import { HINT_TESTS } from '../../src/logic/hints';
import {
  ACKNOWLEDGEMENT_KINDS,
  FIELD_TYPES,
  SIGNATURE_POLICIES,
  SIGNATURE_REQUIREMENTS,
  TEXT_FORMATS,
} from '../../src/logic/model';

const doc = readFileSync(
  fileURLToPath(new URL('../../docs/ki-anleitung-formulare.md', import.meta.url)),
  'utf8',
);

describe('docs/ki-anleitung-formulare.md', () => {
  it.each([
    ['form keys', FORM_KEYS],
    ['role keys', ROLE_KEYS],
    ['field keys', FIELD_KEYS],
    ['field types', FIELD_TYPES],
    ['condition operators', CONDITION_OPERATORS],
    ['text formats', TEXT_FORMATS],
    ['signature policies', SIGNATURE_POLICIES],
    ['signature requirements', SIGNATURE_REQUIREMENTS],
    ['notice kinds', ACKNOWLEDGEMENT_KINDS],
    ['hint tests', Object.keys(HINT_TESTS)],
    ['role conditions', ['minorOnSigning', 'answer']],
  ])('names all %s', (_name, values) => {
    expect(values.filter((value) => !doc.includes(`\`${value}\``))).toEqual([]);
  });

  it('shows a valid definition as its example', () => {
    const example = /```json\n([\s\S]*?)\n```/.exec(doc)?.[1];
    expect(example).toBeDefined();
    const parsed = parseFormDefinition(JSON.parse(example ?? '{}'));
    expect(parsed.ok ? [] : parsed.issues).toEqual([]);
  });
});
