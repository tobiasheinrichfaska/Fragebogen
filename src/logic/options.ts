// Options of choice fields: written in the definition (`options`) or taken from a reference list
// compiled into the app (`optionsFrom`, e.g. the DEÜV tables). A list id names one Stand of its
// source; a new Stand gets a new id, so a frozen form keeps its meaning.
import { NAMENSZUSAETZE, STAATEN, STAATSANGEHOERIGKEITEN, VORSATZWORTE } from './data/deuevListen';
import { formatGermanDate } from './dates';
import { KRANKENKASSEN } from './data/krankenkassen';
import type { ChoiceOption, FieldDefinition } from './model';

export interface ReferenceList {
  title: string;
  source: string;
  options: readonly ChoiceOption[];
}

const plain = (values: readonly string[]): ChoiceOption[] =>
  values.map((value) => ({ id: value, label: value }));
const states = (withGermany: boolean): ChoiceOption[] =>
  STAATEN.filter(([, key]) => withGermany || key !== '000').map(([name]) => ({
    id: name,
    label: name,
  }));

export const REFERENCE_LISTS: Readonly<Record<string, ReferenceList>> = {
  deuevVorsatzworte2026: {
    title: 'Vorsatzworte',
    source: 'DEÜV-Rundschreiben, Anlage 6 (Stand 18.03.2026, mit den Schreibweisen vom 08.08.2007)',
    options: plain(VORSATZWORTE),
  },
  deuevNamenszusaetze2006: {
    title: 'Namenszusätze',
    source: 'DEÜV-Rundschreiben, Anlage 7 (Stand 04.05.2006)',
    options: plain(NAMENSZUSAETZE),
  },
  deuevStaatsangehoerigkeit2025: {
    title: 'Staatsangehörigkeiten',
    source: 'DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)',
    options: STAATSANGEHOERIGKEITEN.map(([key, label]) => ({ id: key, label })),
  },
  deuevStaatsangehoerigkeitAusland2025: {
    title: 'Staatsangehörigkeiten außer der deutschen',
    source: 'DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)',
    options: STAATSANGEHOERIGKEITEN.filter(([key]) => key !== '000').map(([key, label]) => ({
      id: key,
      label,
    })),
  },
  deuevStaaten2025: {
    title: 'Staaten und Gebiete',
    source: 'DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)',
    options: states(true),
  },
  deuevStaatenAusland2025: {
    title: 'Staaten und Gebiete außer Deutschland',
    source: 'DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)',
    options: states(false),
  },
  gkvKrankenkassen202610: {
    title: 'Gesetzliche Krankenkassen',
    source:
      'GKV-Spitzenverband, Krankenkassenliste (Stand 31.10.2026); Betriebsnummern von den Kassen selbst (docs/quellen-krankenkassen.md)',
    options: plain(KRANKENKASSEN.map(([name]) => name)),
  },
};

// Codes of list entries for exports (e.g. the Länderkennzeichen of a state); the options stay
// {id, label}, so the lists and their hashes are unchanged.
const stateCodes = new Map(
  STAATEN.map(([name, key, sign]) => [name, { schluessel: key, laenderkennzeichen: sign }]),
);
const nationalityCodes = new Map(STAATSANGEHOERIGKEITEN.map(([key]) => [key, { schluessel: key }]));
const insurerCodes = new Map(
  KRANKENKASSEN.flatMap(([name, number]) => (number ? [[name, { betriebsnummer: number }]] : [])),
);
const LIST_CODES: Readonly<Record<string, ReadonlyMap<string, Readonly<Record<string, string>>>>> =
  {
    deuevStaatsangehoerigkeit2025: nationalityCodes,
    deuevStaatsangehoerigkeitAusland2025: nationalityCodes,
    deuevStaaten2025: stateCodes,
    deuevStaatenAusland2025: stateCodes,
    gkvKrankenkassen202610: insurerCodes,
  };

// Common short names people type, which the official names do not contain.
const LIST_KEYWORDS: Readonly<Record<string, ReadonlyMap<string, string>>> = {
  gkvKrankenkassen202610: new Map([['Techniker Krankenkasse', 'TK']]),
};

/** Extra search words of a list entry (not shown, not stored). */
export function searchWordsOf(listId: string, optionId: string): string {
  return LIST_KEYWORDS[listId]?.get(optionId) ?? '';
}

/** Validity of a list entry (YYYY-MM-DD, both inclusive); without a limit, none is known. */
export interface EntryValidity {
  from?: string;
  to?: string;
}

const LIST_VALIDITY: Readonly<Record<string, ReadonlyMap<string, EntryValidity>>> = {
  gkvKrankenkassen202610: new Map(
    KRANKENKASSEN.flatMap(([name, , from, to]) =>
      from || to ? [[name, { ...(from ? { from } : {}), ...(to ? { to } : {}) }]] : [],
    ),
  ),
};

export function listValidityOf(listId: string, optionId: string): EntryValidity | undefined {
  return LIST_VALIDITY[listId]?.get(optionId);
}

/** "gültig bis 31.12.2026", "gültig ab 01.01.2027" or both; empty without a limit. */
export function validityNote(validity: EntryValidity | undefined): string {
  if (!validity) return '';
  const parts = [
    validity.from ? `ab ${formatGermanDate(validity.from)}` : '',
    validity.to ? `bis ${formatGermanDate(validity.to)}` : '',
  ].filter(Boolean);
  return parts.length ? `gültig ${parts.join(' ')}` : '';
}

/** Whether an entry with this validity applies on a day (YYYY-MM-DD compares as text). */
export function validOn(validity: EntryValidity | undefined, day: string): boolean {
  return (!validity?.from || validity.from <= day) && (!validity?.to || day <= validity.to);
}

/** The validity of the entry named `name` in any list that has validities (for check hints). */
export function validityByName(name: string): EntryValidity | undefined {
  for (const map of Object.values(LIST_VALIDITY)) {
    const found = map.get(name);
    if (found) return found;
  }
  return undefined;
}

/** The codes of one entry of a reference list (empty when the list has none). */
export function listCodesOf(listId: string, optionId: string): Readonly<Record<string, string>> {
  return LIST_CODES[listId]?.get(optionId) ?? {};
}

export function optionsOf(
  field: Pick<FieldDefinition, 'options' | 'optionsFrom'>,
): readonly ChoiceOption[] {
  if (field.options) return field.options;
  return field.optionsFrom === undefined ? [] : (REFERENCE_LISTS[field.optionsFrom]?.options ?? []);
}

/** The list entry typed by a person: its id, or its label in any case. */
/** Lower case without accents, ß as ss: "Müller" and "muller" find each other. */
function fold(text: string): string {
  return text.toLocaleLowerCase('de').replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Search list: entries containing every typed word (in label or value); an exact value first,
 * then those starting with the typed text; at most `limit`, `more` = how many matched beyond that.
 */
export function filterOptions<T extends { label: string; value?: string; keywords?: string }>(
  options: readonly T[],
  query: string,
  limit = 50,
): { shown: T[]; more: number } {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const start = fold(query.trim());
  const matches = options.filter((option) => {
    const text = fold(`${option.value ?? ''} ${option.label} ${option.keywords ?? ''}`);
    return words.every((word) => text.includes(word));
  });
  // An exact value (e.g. a typed code) first, then entries starting with the text, then the rest.
  const rank = (option: T) => {
    const value = fold(option.value ?? '');
    if (value === start) return 0;
    return fold(option.label).startsWith(start) || value.startsWith(start) ? 1 : 2;
  };
  const sorted = start === '' ? matches : [...matches].sort((a, b) => rank(a) - rank(b));
  return { shown: sorted.slice(0, limit), more: Math.max(0, sorted.length - limit) };
}

/** Suggestions of a text field (`suggestionsFrom`); empty without a list. */
export function suggestionsOf(
  field: Pick<FieldDefinition, 'suggestionsFrom'>,
): readonly ChoiceOption[] {
  return field.suggestionsFrom === undefined
    ? []
    : (REFERENCE_LISTS[field.suggestionsFrom]?.options ?? []);
}

/** The list behind a field (`optionsFrom` or `suggestionsFrom`). */
export function listOf(
  field: Pick<FieldDefinition, 'optionsFrom' | 'suggestionsFrom'>,
): string | undefined {
  return field.optionsFrom ?? field.suggestionsFrom;
}

/**
 * The list entry of a stored value: the option id of a list choice, or — for a text field with
 * suggestions — the entry whose name is the stored text (free text has none).
 */
export function listEntryOf(
  field: Pick<FieldDefinition, 'optionsFrom' | 'suggestionsFrom'>,
  stored: string,
): string | undefined {
  if (field.optionsFrom !== undefined) return stored;
  return field.suggestionsFrom === undefined
    ? undefined
    : suggestionsOf(field).find((option) => option.label === stored)?.id;
}

export function listOptionFor(
  options: readonly ChoiceOption[],
  typed: string,
): ChoiceOption | undefined {
  const lower = typed.toLocaleLowerCase('de');
  return (
    options.find((option) => option.id === typed) ??
    options.find((option) => option.label.toLocaleLowerCase('de') === lower)
  );
}
