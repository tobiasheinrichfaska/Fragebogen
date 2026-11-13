// The uniform invoice model: UBL and CII become the same tree of EN 16931 groups (BG) and terms
// (BT). IO fills a raw tree from the binding (binding.ts); normalize() trims values, turns dates
// into ISO form and drops groups that carry nothing. Raw text stays next to each value.
import { isoDate } from './dates';
import { INVOICE } from './binding';
import type { GroupDef } from './binding';

export type BtId = `BT-${number}`;
export type GroupId = GroupDef['bg'];

export interface RawGroup {
  bg: GroupId;
  terms: Partial<Record<BtId, string[]>>;
  groups: Partial<Record<GroupId, RawGroup[]>>;
}

export interface TermValue {
  /** Trimmed; dates as YYYY-MM-DD when readable */
  value: string;
  /** As written in the XML */
  raw: string;
}

export interface ModelGroup {
  bg: GroupId;
  terms: Partial<Record<BtId, TermValue[]>>;
  groups: Partial<Record<GroupId, ModelGroup[]>>;
}

export type InvoiceModel = ModelGroup;

function normalizeGroup(raw: RawGroup, def: GroupDef): ModelGroup | undefined {
  const terms: Partial<Record<BtId, TermValue[]>> = {};
  for (const termDef of def.terms) {
    const values = (raw.terms[termDef.bt] ?? [])
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text) => ({
        value: termDef.kind === 'date' ? (isoDate(text) ?? text) : text,
        raw: text,
      }));
    if (values.length > 0) terms[termDef.bt] = values;
  }
  const groups: Partial<Record<GroupId, ModelGroup[]>> = {};
  for (const childDef of def.groups) {
    const kept = (raw.groups[childDef.bg] ?? [])
      .map((child) => normalizeGroup(child, childDef))
      .filter((child): child is ModelGroup => child !== undefined);
    if (kept.length > 0) groups[childDef.bg] = kept;
  }
  if (Object.keys(terms).length === 0 && Object.keys(groups).length === 0) return undefined;
  return { bg: def.bg, terms, groups };
}

const UBL_NOTE_SUBJECT = /^#([A-Z]{3})#([\s\S]*)$/;

/**
 * UBL has no element for the note subject (BT-21); XRechnung writes it as a prefix "#ADU#Text".
 * Splits it so UBL and CII notes look alike.
 */
function splitUblNoteSubjects(raw: RawGroup): RawGroup {
  const notes = (raw.groups['BG-1'] ?? []).map((note) => {
    const text = note.terms['BT-22']?.[0] ?? '';
    const match = UBL_NOTE_SUBJECT.exec(text.trim());
    if (!match || note.terms['BT-21']?.length) return note;
    return {
      ...note,
      terms: { ...note.terms, 'BT-21': [match[1] ?? ''], 'BT-22': [match[2] ?? ''] },
    };
  });
  return { ...raw, groups: { ...raw.groups, 'BG-1': notes } };
}

export interface NormalizeOptions {
  /** The raw tree comes from UBL (note subjects are written as a prefix there) */
  ubl?: boolean;
}

/** Trims, normalises dates and drops empty groups. An empty invoice stays an (empty) root. */
export function normalize(raw: RawGroup, options: NormalizeOptions = {}): InvoiceModel {
  const prepared = options.ubl ? splitUblNoteSubjects(raw) : raw;
  return normalizeGroup(prepared, INVOICE) ?? { bg: 'INVOICE', terms: {}, groups: {} };
}

/**
 * Values at a path like "BG-4/BT-27" or "BG-25/BG-31/BT-153", collected over every occurrence of
 * the groups on the way (all lines, all VAT breakdowns …).
 */
export function valuesOf(model: ModelGroup, path: string): TermValue[] {
  const [head, ...rest] = path.split('/');
  if (!head) return [];
  if (rest.length === 0) return model.terms[head as BtId] ?? [];
  return (model.groups[head as GroupId] ?? []).flatMap((group) => valuesOf(group, rest.join('/')));
}

/** The occurrences of a group, e.g. "BG-25" or "BG-25/BG-27". */
export function groupsOf(model: ModelGroup, path: string): ModelGroup[] {
  const [head, ...rest] = path.split('/');
  if (!head) return [model];
  const found = model.groups[head as GroupId] ?? [];
  return rest.length === 0 ? found : found.flatMap((group) => groupsOf(group, rest.join('/')));
}

export function firstValue(model: ModelGroup, path: string): string | undefined {
  return valuesOf(model, path)[0]?.value;
}

/** Raw text per BT for the recognition step (verdict, comparison, details). */
export type HeaderValues = Readonly<Partial<Record<BtId, readonly string[]>>>;

const CORE: Readonly<Record<string, string>> = {
  'BT-1': 'BT-1',
  'BT-2': 'BT-2',
  'BT-3': 'BT-3',
  'BT-5': 'BT-5',
  'BT-24': 'BT-24',
  'BT-27': 'BG-4/BT-27',
  'BT-112': 'BG-22/BT-112',
};

export function coreValues(model: ModelGroup): HeaderValues {
  return Object.fromEntries(
    Object.entries(CORE).map(([bt, path]) => [bt, valuesOf(model, path).map((v) => v.raw)]),
  );
}

/** The first non-empty value of a header term, trimmed. */
export function first(values: HeaderValues, bt: BtId): string | undefined {
  return values[bt]?.map((v) => v.trim()).find((v) => v.length > 0);
}
