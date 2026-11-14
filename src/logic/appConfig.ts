// Kanzlei configuration (branding), injected at build time — never committed with real values;
// the public repo ships the neutral config/kanzlei.example.json. Addresses are https only, so a
// configuration can never turn a link into javascript: or a local file.
import { Decoder, type DecodeIssue } from './decode';

export interface AppConfig {
  /** Shown in the footer and the PDF, e.g. the Kanzlei's name. */
  kanzleiName?: string;
  /** Official address of the hosted app, printed and linked in every PDF. */
  appAddress?: string;
  /**
   * Base address of the help pages ("Wo finde ich …?") or explainer videos: https, or a plain
   * relative path such as "hilfe" next to the hosted app.
   */
  explainerBase?: string;
  /**
   * The test folder, linked on the start page of the hosted app (Tobias 2026-11-01) — a plain
   * relative path such as "test/" or an https address.
   */
  testAddress?: string;
  /**
   * The Kanzlei's colours (Tobias 2026-11-04: "orientiere dich an unserer Homepage") — branding, so
   * only in the local config. Each one must keep text readable (contrast at least 4.5:1).
   */
  colors?: KanzleiColors;
  /**
   * Asked before the hosted app opens (Tobias 2026-11-13: the tools are for the Kanzlei's clients
   * only), e.g. „Ich bestätige, dass ich Mandant der Kanzlei … bin.“ — names the Kanzlei, so only
   * in the local config. Without it the app asks nothing.
   */
  accessNotice?: string;
}

export interface KanzleiColors {
  /** Buttons, links, the chosen answer's border — white text must stay readable on it. */
  accent: string;
  /** Background of a chosen answer (light), dark text on it. */
  chosenBg?: string;
  /** Background of an info message (light), dark text on it. */
  infoBg?: string;
  /** The accent in dark mode — readable on the dark background. */
  accentDark?: string;
}

/** CSS custom properties the stylesheet reads (`var(--kanzlei-accent, …)`). */
const COLOR_VARIABLES: Readonly<Record<keyof KanzleiColors, string>> = {
  accent: '--kanzlei-accent',
  chosenBg: '--kanzlei-chosen-bg',
  infoBg: '--kanzlei-info-bg',
  accentDark: '--kanzlei-accent-dark',
};

// What each colour must stay readable against: [other colour, why].
const CONTRAST: Readonly<Record<keyof KanzleiColors, readonly [string, string]>> = {
  accent: ['#ffffff', 'white text on buttons and the white page'],
  chosenBg: ['#1d2330', 'the dark text of an answer'],
  infoBg: ['#1d2330', 'the dark text of a message'],
  accentDark: ['#111419', 'the dark background'],
};

export const MIN_CONTRAST = 4.5;
const HEX = /^#[0-9a-f]{6}$/i;
/** A text with something in it (the access notice). */
const NOT_BLANK = /\S/;

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** WCAG 2 contrast ratio of two `#rrggbb` colours (1 … 21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The CSS custom properties for the configured colours (none without a configuration). */
export function colorVariables(colors: KanzleiColors | undefined): Record<string, string> {
  if (!colors) return {};
  return Object.fromEntries(
    (Object.keys(COLOR_VARIABLES) as (keyof KanzleiColors)[]).flatMap((key) => {
      const value = colors[key];
      return value === undefined ? [] : [[COLOR_VARIABLES[key], value.toLowerCase()]];
    }),
  );
}

function decodeColors(d: Decoder, raw: unknown, path: string): KanzleiColors | undefined {
  const o = d.object(raw, path, ['accent', 'chosenBg', 'infoBg', 'accentDark']);
  if (!o) return undefined;
  const colors: Partial<KanzleiColors> = {};
  for (const key of Object.keys(COLOR_VARIABLES) as (keyof KanzleiColors)[]) {
    if (o[key] === undefined) continue;
    const value = d.string(o[key], `${path}.${key}`, HEX);
    if (value === undefined) continue;
    const [other, why] = CONTRAST[key];
    const ratio = contrastRatio(value, other);
    if (ratio < MIN_CONTRAST) {
      d.report(
        `${path}.${key}`,
        `contrast ${ratio.toFixed(1)}:1 against ${why} — at least ${MIN_CONTRAST}:1`,
      );
      continue;
    }
    colors[key] = value;
  }
  if (o.accent === undefined) return d.report(`${path}.accent`, 'is required');
  return colors.accent === undefined ? undefined : (colors as KanzleiColors);
}

// Letters, digits, "-", "_" and "/" only: never "..", a scheme or a query.
const RELATIVE_PATH = /^(?!.*\.\.)[a-z0-9][a-z0-9_\-/]*$/i;

function httpsAddress(d: Decoder, value: unknown, path: string): string | undefined {
  const text = d.string(value, path);
  if (text === undefined) return undefined;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return d.report(path, 'is not an address');
  }
  if (url.protocol !== 'https:') return d.report(path, 'must start with https://');
  if (url.username || url.password || url.search || url.hash) {
    return d.report(path, 'must not contain credentials, a query or a fragment');
  }
  return url.href;
}

export function parseAppConfig(
  raw: unknown,
): { ok: true; config: AppConfig } | { ok: false; issues: DecodeIssue[] } {
  const d = new Decoder();
  const o = d.object(raw, '$', [
    'kanzleiName',
    'appAddress',
    'explainerBase',
    'testAddress',
    'colors',
    'accessNotice',
  ]);
  if (!o) return { ok: false, issues: d.issues };
  const kanzleiName =
    o.kanzleiName === undefined ? undefined : d.string(o.kanzleiName, '$.kanzleiName');
  const appAddress =
    o.appAddress === undefined ? undefined : httpsAddress(d, o.appAddress, '$.appAddress');
  // A plain relative path resolves against the page: "hilfe" is /hilfe/ for the public app and
  // /test/hilfe/ for the test folder build (Tobias 2026-11-01).
  const relativeOrHttps = (value: unknown, path: string) =>
    typeof value === 'string' && RELATIVE_PATH.test(value) ? value : httpsAddress(d, value, path);
  const explainerBase =
    o.explainerBase === undefined ? undefined : relativeOrHttps(o.explainerBase, '$.explainerBase');
  const testAddress =
    o.testAddress === undefined ? undefined : relativeOrHttps(o.testAddress, '$.testAddress');
  const colors = o.colors === undefined ? undefined : decodeColors(d, o.colors, '$.colors');
  const accessNotice =
    o.accessNotice === undefined
      ? undefined
      : d.string(o.accessNotice, '$.accessNotice', NOT_BLANK);
  if (d.issues.length > 0) return { ok: false, issues: d.issues };
  return {
    ok: true,
    config: {
      ...(kanzleiName === undefined ? {} : { kanzleiName }),
      ...(appAddress === undefined ? {} : { appAddress }),
      ...(explainerBase === undefined ? {} : { explainerBase }),
      ...(testAddress === undefined ? {} : { testAddress }),
      ...(colors === undefined ? {} : { colors }),
      ...(accessNotice === undefined ? {} : { accessNotice }),
    },
  };
}

/** Full video address for a frozen path, or undefined without a configured base. */
export function explainerUrl(config: AppConfig, path: string | undefined): string | undefined {
  if (path === undefined || config.explainerBase === undefined) return undefined;
  return `${config.explainerBase.replace(/\/+$/, '')}/${path}`;
}
