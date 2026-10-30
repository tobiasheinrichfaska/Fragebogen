// Reference lists for choice fields (Tobias 2026-10-30: check name prefix and suffix against the
// official tables; nationality and countries with DEÜV keys). Lists never change silently.
import { canonicalHash } from './hash';
import { displayValue, editValue } from './display';
import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import { checkFormDefinition, parseFormDefinition } from './formDefinition';
import type { FieldDefinition, FormDefinition } from './model';
import { normalizeFieldValue } from './normalize';
import { listOptionFor, optionsOf, REFERENCE_LISTS } from './options';

const field = (optionsFrom: string): FieldDefinition => ({
  id: 'x',
  role: 'person',
  type: 'choice',
  label: 'X',
  required: false,
  purpose: 'Test',
  optionsFrom,
});

describe('REFERENCE_LISTS', () => {
  it.each([
    ['deuevVorsatzworte2026', 188],
    ['deuevNamenszusaetze2006', 70],
    ['deuevStaatsangehoerigkeit2025', 204],
    ['deuevStaaten2025', 259],
    ['deuevStaatenAusland2025', 258],
  ])('%s has %i entries, unique even ignoring case', (id, count) => {
    const options = REFERENCE_LISTS[id]?.options ?? [];
    expect(options).toHaveLength(count);
    expect(new Set(options.map((o) => o.id)).size).toBe(count);
    expect(new Set(options.map((o) => o.label.toLocaleLowerCase('de'))).size).toBe(count);
    for (const o of options) expect(o.label.normalize('NFC')).toBe(o.label);
  });

  // A frozen form names a list by id; its meaning must never change. A new Stand = a new id.
  it('keeps every list unchanged (hash per list id)', () => {
    const hashes = Object.fromEntries(
      Object.entries(REFERENCE_LISTS).map(([id, list]) => [id, canonicalHash(list.options)]),
    );
    expect(hashes).toMatchInlineSnapshot(`
      {
        "deuevNamenszusaetze2006": "990578962c8152f773a61e3679f406e9e8df4c0ca1ed05ecae15b76b8b445359",
        "deuevStaaten2025": "f4c7fc003e0f80580e6ffef15a86cd34b5fde8ecbcca62d05088fead9125b79a",
        "deuevStaatenAusland2025": "a2966925cb709c1f07b4199ea8a770a79b8ed1e49ddf2b73d5a91e64e65814e4",
        "deuevStaatsangehoerigkeit2025": "91d4abd592c9922c20e67ab8165fc0989bd4a3af780791363bc0b10dfcc9dff2",
        "deuevVorsatzworte2026": "2c4f022f374bf59659e8960580f0f55bba06734582ed7cf5bdad7460a4b358ca",
      }
    `);
  });

  it('holds the official spellings, including both versions of Anlage 6', () => {
    const vorsatz = optionsOf(field('deuevVorsatzworte2026')).map((o) => o.id);
    expect(vorsatz).toEqual(expect.arrayContaining(['von', 'van der', "de l'", "de l '", 'oude']));
    const zusatz = optionsOf(field('deuevNamenszusaetze2006')).map((o) => o.id);
    expect(zusatz).toEqual(expect.arrayContaining(['Freiherr', 'Gräfin', 'Frhr.', 'Edle']));
    expect(optionsOf(field('deuevStaatsangehoerigkeit2025'))).toContainEqual({
      id: '000',
      label: 'deutsch',
    });
    expect(optionsOf(field('deuevStaatenAusland2025')).map((o) => o.id)).not.toContain(
      'Deutschland',
    );
  });
});

describe('a choice from a list', () => {
  const nationality = field('deuevStaatsangehoerigkeit2025');

  it('stores the key for a typed label in any case, and the key itself', () => {
    for (const typed of ['deutsch', 'Deutsch', ' DEUTSCH ', '000']) {
      expect(normalizeFieldValue(nationality, typed)).toMatchObject({ ok: true, value: '000' });
    }
  });

  it('refuses anything not in the list, and keeps empty input unanswered', () => {
    expect(normalizeFieldValue(nationality, 'germanisch')).toMatchObject({
      ok: false,
      issue: 'choice.notInList',
    });
    expect(normalizeFieldValue(field('deuevVorsatzworte2026'), 'vonn')).toMatchObject({
      ok: false,
    });
    expect(normalizeFieldValue(nationality, '  ')).toMatchObject({ ok: true, value: null });
  });

  it('maps its own output to itself (idempotent) for every entry of every list', () => {
    for (const id of Object.keys(REFERENCE_LISTS)) {
      const f = field(id);
      for (const option of optionsOf(f)) {
        expect(normalizeFieldValue(f, option.id)).toMatchObject({ ok: true, value: option.id });
      }
    }
  });

  it('shows and edits the label, not the key', () => {
    expect(displayValue(nationality, '000')).toBe('deutsch');
    expect(editValue(nationality, '000')).toBe('deutsch');
  });

  it('finds an entry by id first, then by label', () => {
    expect(listOptionFor(optionsOf(nationality), 'Deutsch')?.id).toBe('000');
    expect(listOptionFor(optionsOf(nationality), 'nix')).toBeUndefined();
  });
});

describe('definition rules for optionsFrom', () => {
  // The fixture form with one more person field (section 0 belongs to the person).
  const problems = (f: Partial<FieldDefinition>) => {
    const parsed = parseFormDefinition(structuredClone(beispiel));
    if (!parsed.ok) throw new Error('fixture');
    const d = parsed.definition;
    const first = d.sections[0];
    if (!first) throw new Error('fixture');
    const role = first.fields[0]?.role ?? 'person';
    const probe = { ...field('deuevStaaten2025'), id: 'probeStaat', role, ...f };
    const changed: FormDefinition = {
      ...d,
      sections: [{ ...first, fields: [...first.fields, probe] }, ...d.sections.slice(1)],
    };
    return checkFormDefinition(changed).map((issue) => issue.message);
  };

  it('accepts a known list on a choice field, with quick answers and conditions on keys', () => {
    expect(problems({})).toEqual([]);
    expect(problems({ quickAnswers: [{ label: 'Deutschland', value: 'Deutschland' }] })).toEqual(
      [],
    );
  });

  it('refuses unknown lists, other field types and lists next to options', () => {
    expect(problems({ optionsFrom: 'erfunden' })).toContain('unknown list "erfunden"');
    expect(problems({ type: 'text' })).toContain('only choice fields take options from a list');
    expect(problems({ options: [{ id: 'a', label: 'A' }] })).toContain(
      'either options or optionsFrom',
    );
  });

  it('checks quick answers against the list', () => {
    expect(problems({ quickAnswers: [{ label: 'Atlantis', value: 'Atlantis' }] }).join()).toContain(
      'not a valid answer (choice.notInList)',
    );
  });
});
