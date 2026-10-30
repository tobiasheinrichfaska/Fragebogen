// Options of choice fields: written in the definition (`options`) or taken from a reference list
// compiled into the app (`optionsFrom`, e.g. the DEÜV tables). A list id names one Stand of its
// source; a new Stand gets a new id, so a frozen form keeps its meaning.
import { NAMENSZUSAETZE, STAATEN, STAATSANGEHOERIGKEITEN, VORSATZWORTE } from './data/deuevListen';
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
};

// Codes of list entries for exports (e.g. the Länderkennzeichen of a state); the options stay
// {id, label}, so the lists and their hashes are unchanged.
const stateCodes = new Map(
  STAATEN.map(([name, key, sign]) => [name, { schluessel: key, laenderkennzeichen: sign }]),
);
const nationalityCodes = new Map(STAATSANGEHOERIGKEITEN.map(([key]) => [key, { schluessel: key }]));
const LIST_CODES: Readonly<Record<string, ReadonlyMap<string, Readonly<Record<string, string>>>>> =
  {
    deuevStaatsangehoerigkeit2025: nationalityCodes,
    deuevStaaten2025: stateCodes,
    deuevStaatenAusland2025: stateCodes,
  };

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
