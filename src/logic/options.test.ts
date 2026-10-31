// Reference lists for choice fields (Tobias 2026-10-30: check name prefix and suffix against the
// official tables; nationality and countries with DEÜV keys). Lists never change silently.
import { canonicalHash } from './hash';
import { displayValue, editValue } from './display';
import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import { checkFormDefinition, parseFormDefinition } from './formDefinition';
import type { FieldDefinition, FormDefinition } from './model';
import { normalizeFieldValue } from './normalize';
import {
  filterOptions,
  listCodesOf,
  listEntryOf,
  listOptionFor,
  listValidityOf,
  optionsOf,
  REFERENCE_LISTS,
  searchWordsOf,
  validityNote,
  validOn,
} from './options';
import { KRANKENKASSEN } from './data/krankenkassen';

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
        "gkvKrankenkassen202610": "ebb01eb3c1df77ef1e1173a46cca139429d79ad0ebc08d35abe0d758db1d874c",
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

describe('search lists (filterOptions)', () => {
  const OPTIONS = [
    { value: 'fb', label: 'Freireligiöse Landesgemeinde Baden' },
    { value: 'ib', label: 'Israelitische Religionsgemeinschaft Baden' },
    { value: 'is', label: 'Israelitische / Jüdische Kultussteuer' },
  ];
  const values = (query: string) => filterOptions(OPTIONS, query).shown.map((o) => o.value);

  it('keeps entries that contain every typed word, in any case and without accents', () => {
    expect(values('baden')).toEqual(['fb', 'ib']);
    expect(values('isr bad')).toEqual(['ib']);
    expect(values('JUDISCH')).toEqual(['is']);
    expect(values('')).toEqual(['fb', 'ib', 'is']);
    expect(values('xyz')).toEqual([]);
  });

  it('puts entries starting with the typed text first, by value or label', () => {
    expect(values('is')).toEqual(['is', 'ib']);
    expect(values('Israel')).toEqual(['ib', 'is']);
  });

  it('shows at most the limit and says how many more match', () => {
    expect(filterOptions(OPTIONS, '', 2)).toEqual({ shown: OPTIONS.slice(0, 2), more: 1 });
  });

  it('works on the DEÜV lists (ß as ss)', () => {
    const states = optionsOf({ optionsFrom: 'deuevStaaten2025' } as FieldDefinition).map((o) => ({
      value: o.id,
      label: o.label,
    }));
    expect(filterOptions(states, 'deutschl').shown.map((o) => o.label)).toContain('Deutschland');
  });
});

describe('statutory health insurers (gkvKrankenkassen202610)', () => {
  const LIST = 'gkvKrankenkassen202610';
  const kasse = { suggestionsFrom: LIST } as FieldDefinition;

  it('has all 92 insurers of the GKV-Spitzenverband list, numbers with 8 digits', () => {
    expect(REFERENCE_LISTS[LIST]?.options).toHaveLength(92);
    for (const [, number] of KRANKENKASSEN) expect(number).toMatch(/^(\d{8})?$/);
    expect(listCodesOf(LIST, 'BMW BKK')).toEqual({ betriebsnummer: '87271125' });
    expect(listCodesOf(LIST, 'Techniker Krankenkasse')).toEqual({ betriebsnummer: '15027365' });
    // Several numbers (regions, Rechtskreise): none, the Kanzlei picks.
    expect(
      listCodesOf(LIST, 'Sozialversicherung für Landwirtschaft, Forsten und Gartenbau (SVLFG)'),
    ).toEqual({});
  });

  // Numbers and validity matter for the hand-over: any change must be deliberate (new Stand = new id).
  it('keeps the numbers and validities unchanged', () => {
    expect(canonicalHash(KRANKENKASSEN.map((entry) => [...entry]))).toMatchInlineSnapshot(
      `"c5a5603fbfb8068af084b5686b594e0b270fa5d37e3272867d90df6696b785e2"`,
    );
  });

  it('finds an entry by its name in a text field, and short names people type', () => {
    expect(listEntryOf(kasse, 'BMW BKK')).toBe('BMW BKK');
    expect(listEntryOf(kasse, 'Meine Betriebskasse')).toBeUndefined();
    expect(searchWordsOf(LIST, 'Techniker Krankenkasse')).toBe('TK');
    const options = (REFERENCE_LISTS[LIST]?.options ?? []).map((o) => ({
      value: o.id,
      label: o.label,
      keywords: searchWordsOf(LIST, o.id),
    }));
    expect(filterOptions(options, 'tk').shown[0]?.label).toBe('Techniker Krankenkasse');
    expect(filterOptions(options, 'aok bad').shown.map((o) => o.label)).toEqual([
      'AOK Baden-Württemberg',
    ]);
  });

  it('describes and checks the validity of an entry', () => {
    expect(listValidityOf(LIST, 'BMW BKK')).toBeUndefined();
    expect(validityNote({ to: '2026-12-31' })).toBe('gültig bis 31.12.2026');
    expect(validityNote({ from: '2027-01-01' })).toBe('gültig ab 01.01.2027');
    expect(validOn({ to: '2026-12-31' }, '2026-12-31')).toBe(true);
    expect(validOn({ to: '2026-12-31' }, '2027-01-01')).toBe(false);
    expect(validOn({ from: '2027-01-01' }, '2026-12-31')).toBe(false);
    expect(validOn(undefined, '2027-01-01')).toBe(true);
  });
});
