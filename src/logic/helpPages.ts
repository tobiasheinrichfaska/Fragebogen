// Help pages "Wo finde ich …?" (Tobias 2026-10-31): per data item a page on the Kanzlei homepage with
// a choice of documents ("Was haben Sie zur Hand?"); each choice shows a sample document (Muster)
// that zooms to the spot and marks it, plus a short text. Pages and Muster are data; the build
// renders them (src/build/helpPage.ts). A page's path is the field's frozen `explainer` path.
// Muster are drawn simplified with fictitious values and always carry the "MUSTER" watermark.
import { Decoder, type DecodeIssue } from './decode';
import { EXPLAINER_PATH, ID } from './formDefinition';

/** Elements of a Muster, in millimetres on the page (A4 = 210 × 297). */
export const MUSTER_ITEM_KINDS = ['title', 'text', 'lines', 'box', 'field'] as const;
export type MusterItemKind = (typeof MUSTER_ITEM_KINDS)[number];

export interface MusterItem {
  kind: MusterItemKind;
  x: number;
  y: number;
  /** `lines`, `box`, `field`. */
  w?: number;
  /** `box`, `field`. */
  h?: number;
  /** `title`, `text`; the label of a `field`. */
  text?: string;
  /** `field`: the fictitious value. */
  value?: string;
  /** `field`: the id a help page points at. */
  id?: string;
  /** `lines`: grey placeholder rows. */
  rows?: number;
  /** Font size in tenths of a millimetre (default 32 = 3.2 mm). */
  size?: number;
}

export interface Muster {
  id: string;
  /** What the sample shows, e.g. "Ausdruck der elektronischen Lohnsteuerbescheinigung". */
  title: string;
  /** Where the layout comes from: an official Muster (with Stand) or "vereinfacht gezeichnet". */
  basis: string;
  width: number;
  height: number;
  items: MusterItem[];
}

export interface HelpLink {
  label: string;
  /** https only. */
  url: string;
}

export interface HelpChoice {
  id: string;
  /** The tile, e.g. "Lohnsteuerbescheinigung". */
  label: string;
  /** The sample to show and the field it zooms to; none for "Nichts davon". */
  muster?: string;
  target?: string;
  /** Shows a number that is easily confused with the one asked for (e.g. on the health card). */
  trap?: boolean;
  /** One to three short paragraphs. */
  text: string[];
  links?: HelpLink[];
  /** Where the statement comes from (official source). */
  source?: HelpLink;
}

export interface HelpPage {
  /** = the `explainer` path of the fields that link here, e.g. "steuer-id". */
  path: string;
  title: string;
  intro: string[];
  /** e.g. "Was haben Sie zur Hand?" */
  choicesTitle: string;
  choices: HelpChoice[];
  /** Typical confusions, e.g. "Nicht die Steuernummer …". */
  traps?: string[];
  /** Date of the last check of the content (YYYY-MM-DD). */
  stand: string;
}

const HTTPS = /^https:\/\/[^\s"'<>]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function link(d: Decoder, raw: unknown, path: string): HelpLink | undefined {
  const o = d.object(raw, path, ['label', 'url']);
  const label = o && d.string(o.label, `${path}.label`);
  const url = o && d.string(o.url, `${path}.url`, HTTPS);
  return label === undefined || url === undefined ? undefined : { label, url };
}

const texts = (d: Decoder, raw: unknown, path: string, min = 1) =>
  d.array(raw, path, (v, p) => d.string(v, p), min);

function decodeItem(d: Decoder, raw: unknown, path: string): MusterItem | undefined {
  const o = d.object(raw, path, [
    'kind',
    'x',
    'y',
    'w',
    'h',
    'text',
    'value',
    'id',
    'rows',
    'size',
  ]);
  if (!o) return undefined;
  const kind = d.literal(o.kind, `${path}.kind`, MUSTER_ITEM_KINDS);
  const num = (key: 'x' | 'y' | 'w' | 'h' | 'rows' | 'size') =>
    o[key] === undefined ? undefined : d.integer(o[key], `${path}.${key}`);
  const x = num('x');
  const y = num('y');
  const w = num('w');
  const h = num('h');
  const rows = num('rows');
  const size = num('size');
  const text = o.text === undefined ? undefined : d.string(o.text, `${path}.text`);
  const value = o.value === undefined ? undefined : d.string(o.value, `${path}.value`);
  const id = o.id === undefined ? undefined : d.string(o.id, `${path}.id`, ID);
  if (!kind || x === undefined || y === undefined) return undefined;
  const needs: Record<MusterItemKind, readonly string[]> = {
    title: ['text'],
    text: ['text'],
    lines: ['w', 'rows'],
    box: ['w', 'h'],
    field: ['w', 'h', 'text', 'value', 'id'],
  };
  for (const key of needs[kind]) {
    if (o[key] === undefined) d.report(`${path}.${key}`, `a ${kind} needs ${key}`);
  }
  return {
    kind,
    x,
    y,
    ...(w === undefined ? {} : { w }),
    ...(h === undefined ? {} : { h }),
    ...(text === undefined ? {} : { text }),
    ...(value === undefined ? {} : { value }),
    ...(id === undefined ? {} : { id }),
    ...(rows === undefined ? {} : { rows }),
    ...(size === undefined ? {} : { size }),
  };
}

function decodeMuster(d: Decoder, raw: unknown, path: string): Muster | undefined {
  const o = d.object(raw, path, ['id', 'title', 'basis', 'width', 'height', 'items']);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const title = d.string(o.title, `${path}.title`);
  const basis = d.string(o.basis, `${path}.basis`);
  const width = d.integer(o.width, `${path}.width`, 1);
  const height = d.integer(o.height, `${path}.height`, 1);
  const items = d.array(o.items, `${path}.items`, (v, p) => decodeItem(d, v, p), 1);
  if (!id || !title || !basis || !width || !height || !items) return undefined;
  return { id, title, basis, width, height, items };
}

function decodeChoice(d: Decoder, raw: unknown, path: string): HelpChoice | undefined {
  const o = d.object(raw, path, [
    'id',
    'label',
    'muster',
    'target',
    'trap',
    'text',
    'links',
    'source',
  ]);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const label = d.string(o.label, `${path}.label`);
  const muster = o.muster === undefined ? undefined : d.string(o.muster, `${path}.muster`, ID);
  const target = o.target === undefined ? undefined : d.string(o.target, `${path}.target`, ID);
  const trap = o.trap === undefined ? undefined : d.boolean(o.trap, `${path}.trap`);
  const text = texts(d, o.text, `${path}.text`);
  const links =
    o.links === undefined
      ? undefined
      : d.array(o.links, `${path}.links`, (v, p) => link(d, v, p), 1);
  const source = o.source === undefined ? undefined : link(d, o.source, `${path}.source`);
  if ((muster === undefined) !== (target === undefined)) {
    d.report(path, 'muster and target go together');
  }
  if (!id || !label || !text) return undefined;
  return {
    id,
    label,
    ...(muster === undefined ? {} : { muster }),
    ...(target === undefined ? {} : { target }),
    ...(trap === undefined ? {} : { trap }),
    text,
    ...(links === undefined ? {} : { links }),
    ...(source === undefined ? {} : { source }),
  };
}

function decodePage(d: Decoder, raw: unknown, path: string): HelpPage | undefined {
  const o = d.object(raw, path, [
    'path',
    'title',
    'intro',
    'choicesTitle',
    'choices',
    'traps',
    'stand',
  ]);
  if (!o) return undefined;
  const pagePath = d.string(o.path, `${path}.path`, EXPLAINER_PATH);
  const title = d.string(o.title, `${path}.title`);
  const intro = texts(d, o.intro, `${path}.intro`);
  const choicesTitle = d.string(o.choicesTitle, `${path}.choicesTitle`);
  const choices = d.array(o.choices, `${path}.choices`, (v, p) => decodeChoice(d, v, p), 1);
  const traps = o.traps === undefined ? undefined : texts(d, o.traps, `${path}.traps`);
  const stand = d.string(o.stand, `${path}.stand`, ISO_DATE);
  if (!pagePath || !title || !intro || !choicesTitle || !choices || !stand) return undefined;
  return {
    path: pagePath,
    title,
    intro,
    choicesTitle,
    choices,
    ...(traps === undefined ? {} : { traps }),
    stand,
  };
}

export type HelpResult<T> = { ok: true; value: T } | { ok: false; issues: DecodeIssue[] };

export function parseMuster(raw: unknown): HelpResult<Muster> {
  const d = new Decoder();
  const value = decodeMuster(d, raw, '$');
  return value && d.issues.length === 0 ? { ok: true, value } : { ok: false, issues: d.issues };
}

export function parseHelpPage(raw: unknown): HelpResult<HelpPage> {
  const d = new Decoder();
  const value = decodePage(d, raw, '$');
  return value && d.issues.length === 0 ? { ok: true, value } : { ok: false, issues: d.issues };
}

/** References and geometry: every tile's Muster and target exist, items stay on the page, ids unique. */
export function checkHelpPages(pages: readonly HelpPage[], musters: readonly Muster[]): string[] {
  const problems: string[] = [];
  const byId = new Map(musters.map((m) => [m.id, m] as const));
  if (byId.size !== musters.length) problems.push('Muster ids must be unique');
  for (const muster of musters) {
    const fieldIds = new Set<string>();
    muster.items.forEach((item, i) => {
      const right = item.x + (item.w ?? 0);
      const bottom = item.y + (item.h ?? 0);
      if (right > muster.width || bottom > muster.height) {
        problems.push(`${muster.id}: item ${i} leaves the page`);
      }
      if (item.id !== undefined) {
        if (fieldIds.has(item.id)) problems.push(`${muster.id}: field id "${item.id}" twice`);
        fieldIds.add(item.id);
      }
    });
  }
  const paths = new Set<string>();
  for (const page of pages) {
    if (paths.has(page.path)) problems.push(`page "${page.path}" twice`);
    paths.add(page.path);
    const ids = new Set<string>();
    for (const choice of page.choices) {
      if (ids.has(choice.id)) problems.push(`${page.path}: choice "${choice.id}" twice`);
      ids.add(choice.id);
      if (choice.muster === undefined) continue;
      const muster = byId.get(choice.muster);
      if (!muster) problems.push(`${page.path}/${choice.id}: unknown Muster "${choice.muster}"`);
      else if (!muster.items.some((item) => item.kind === 'field' && item.id === choice.target)) {
        problems.push(
          `${page.path}/${choice.id}: "${choice.muster}" has no field "${choice.target}"`,
        );
      }
    }
  }
  return problems;
}
