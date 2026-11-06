// The foreign postcode is required unless the state has none (Tobias 2026-11-06, test report
// MT-126: "Wieso ist die PLZ Ausland freiwillig?") — the set of states without a known postcode
// system, the condition `inSet` and the drafts that ask a foreign address.
import { join } from 'node:path';
import { evaluateCondition } from '../../src/logic/conditions';
import { fieldStates, fieldsById } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { FieldValue, FormDefinition } from '../../src/logic/model';
import { optionsOf, REFERENCE_LISTS, REFERENCE_SETS } from '../../src/logic/options';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';

const SET = 'staatenOhnePostleitzahl2026';
const draft = (folder: string, version: string) =>
  registeredFrom(readJson(join(DRAFTS_DIR, folder, `${version}.json`))).definition;

describe('the states without a known postcode system', () => {
  const set = REFERENCE_SETS[SET];
  if (!set) throw new Error('no set');

  it('names only entries of its list, each once, sorted', () => {
    const list = REFERENCE_LISTS[set.list];
    if (!list) throw new Error('no list');
    const ids = new Set(list.options.map((option) => option.id));
    expect(set.keys.filter((key) => !ids.has(key))).toEqual([]);
    expect(new Set(set.keys).size).toBe(set.keys.length);
    expect([...set.keys]).toEqual([...set.keys].sort((a, b) => a.localeCompare(b, 'de')));
  });

  it('holds the states the research found without postcodes and the unclear ones', () => {
    expect(set.keys).toHaveLength(62);
    for (const name of ['Hongkong', 'Katar', 'Vereinigte Arabische Emirate', 'Angola', 'Panama']) {
      expect(set.keys).toContain(name);
    }
    for (const name of ['Österreich', 'Frankreich', 'Irland', 'Dschibuti', 'Kiribati']) {
      expect(set.keys).not.toContain(name);
    }
  });
});

describe('the condition inSet', () => {
  const valueOf = (value: FieldValue) => () => value;
  it('holds for an entry of the set, not for another one or none', () => {
    const condition = { field: 'anschriftStaat', inSet: SET };
    expect(evaluateCondition(condition, valueOf('Hongkong'))).toBe(true);
    expect(evaluateCondition(condition, valueOf('Österreich'))).toBe(false);
    expect(evaluateCondition(condition, valueOf(null))).toBe(false);
  });

  it('is refused for an unknown set, a field of another list and a field that is no choice', () => {
    const base = draft('sepa-mandat', '1.1.0');
    const problems = (change: (d: FormDefinition) => void) => {
      const d = structuredClone(base);
      change(d);
      return checkFormDefinition(d).map((issue) => issue.message);
    };
    const postcode = (d: FormDefinition) => {
      const found = d.sections.flatMap((s) => s.fields).find((f) => f.id === 'postleitzahlAusland');
      if (!found) throw new Error('no postcode');
      return found;
    };
    expect(
      problems((d) => {
        postcode(d).requiredIf = { not: { field: 'anschriftStaat', inSet: 'unbekannt' } };
      }),
    ).toEqual([expect.stringContaining('unknown set "unbekannt"')]);
    expect(
      problems((d) => {
        postcode(d).requiredIf = { not: { field: 'kontoinhaberStrasse', inSet: SET } };
      }),
    ).toEqual([expect.stringContaining('"inSet" only applies to choice fields')]);
    expect(
      problems((d) => {
        postcode(d).requiredIf = { not: { field: 'mandatZahlungsart', inSet: SET } };
      }),
    ).toEqual([expect.stringContaining('the set belongs to the list "deuevStaatenAusland2025"')]);
  });
});

describe.each([
  ['sepa-mandat', '1.1.0', 'kontoinhaber'],
  ['sofortmeldung', '1.1.0', 'person'],
  ['personalfragebogen', '0.1.0', 'person'],
])('the foreign postcode in %s %s', (folder, version, role) => {
  const definition = draft(folder, version);
  const field = fieldsById(definition).get('postleitzahlAusland');
  const state = (staat: string | null) =>
    fieldStates(definition, role, { anschriftAusland: true, anschriftStaat: staat }).get(
      'postleitzahlAusland',
    );

  it('is required for a state with postcodes, also while no state is chosen', () => {
    expect(state('Österreich')).toMatchObject({ visible: true, required: true, missing: true });
    expect(state(null)?.required).toBe(true);
  });

  it('may stay empty for a state without postcodes, with the button "Keine Postleitzahl"', () => {
    expect(state('Hongkong')).toMatchObject({ visible: true, required: false, missing: false });
    expect(field?.quickAnswers).toEqual([{ label: 'Keine Postleitzahl', value: null }]);
    expect(field?.help).toContain('klicken Sie „Keine Postleitzahl“');
  });

  it('chooses the state from the list the set belongs to', () => {
    const staat = fieldsById(definition).get('anschriftStaat');
    if (!staat) throw new Error('no state field');
    expect(staat.optionsFrom).toBe(REFERENCE_SETS[SET]?.list);
    expect(optionsOf(staat)).toHaveLength(258);
  });
});
