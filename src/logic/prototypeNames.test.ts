// Ids named like members of Object.prototype (audit 2026-11-14): records are plain objects, so a role
// or field called "constructor" read as `parts[role] ?? []` found the inherited function, and a file
// with such an id decoded and verified, then made the Kanzlei merge throw (blank app). Such ids are
// refused wherever an id is decoded — in a form definition and in a questionnaire file.
import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import { twoRoles } from '../../tests/support/sample';
import { ID, parseFormDefinition } from './formDefinition';
import { decodeQuestionnaire } from './questionnaireFile';

const SHAPE = /^[a-z][a-zA-Z0-9]{0,63}$/;
const INHERITED = Object.getOwnPropertyNames(Object.prototype).filter((name) => SHAPE.test(name));

describe('ids named like members of Object.prototype', () => {
  it('are refused by the id pattern, every one of them', () => {
    expect(INHERITED).toContain('constructor');
    expect(INHERITED.filter((name) => ID.test(name))).toEqual([]);
  });

  it('leaves every other id of the shape as it was', () => {
    for (const name of ['person', 'arbeitgeber', 'constructorName', 'toStrings', 'valueOfX', 'a']) {
      expect(ID.test(name), name).toBe(true);
    }
  });

  it('refuses a form definition with a role named "constructor"', () => {
    const text = JSON.stringify(beispiel).replaceAll('"arbeitgeber"', '"constructor"');
    const result = parseFormDefinition(JSON.parse(text));
    expect(result.ok).toBe(false);
  });

  it.each([
    ['a data key', ['parts', 'person', 0, 'data', 'constructor'], 'x'],
    // A well-formed 64-bit field hash, so only the name can be the reason for the refusal.
    [
      'a field hash',
      ['parts', 'person', 0, 'seal', 'payload', 'fieldHashes', 'valueOf'],
      '0123456789abcdef',
    ],
  ] as const)('refuses a questionnaire file with %s named like one', (_label, path, value) => {
    const raw = JSON.parse(JSON.stringify(twoRoles())) as Record<string | number, unknown>;
    let node = raw;
    for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
    expect(decodeQuestionnaire(raw).ok).toBe(true);
    Reflect.set(node, path.at(-1) ?? '', value);
    expect(decodeQuestionnaire(raw).ok).toBe(false);
  });

  it('refuses a questionnaire file with a role named "toString"', () => {
    const raw = JSON.parse(JSON.stringify(twoRoles())) as { parts: Record<string, unknown> };
    Reflect.set(raw.parts, 'toString', raw.parts.person);
    expect(decodeQuestionnaire(raw).ok).toBe(false);
  });
});
