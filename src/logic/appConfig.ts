// Kanzlei configuration (branding), injected at build time — never committed with real values;
// the public repo ships the neutral config/kanzlei.example.json. Addresses are https only, so a
// configuration can never turn a link into javascript: or a local file.
import { Decoder, type DecodeIssue } from './decode';

export interface AppConfig {
  /** Shown in the footer and the PDF, e.g. the Kanzlei's name. */
  kanzleiName?: string;
  /** Official address of the hosted app, printed and linked in every PDF. */
  appAddress?: string;
  /** Base address of the explainer videos on the Kanzlei homepage. */
  explainerBase?: string;
}

export const NEUTRAL_CONFIG: AppConfig = {};

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
  const o = d.object(raw, '$', ['kanzleiName', 'appAddress', 'explainerBase']);
  if (!o) return { ok: false, issues: d.issues };
  const kanzleiName =
    o.kanzleiName === undefined ? undefined : d.string(o.kanzleiName, '$.kanzleiName');
  const appAddress =
    o.appAddress === undefined ? undefined : httpsAddress(d, o.appAddress, '$.appAddress');
  const explainerBase =
    o.explainerBase === undefined ? undefined : httpsAddress(d, o.explainerBase, '$.explainerBase');
  if (d.issues.length > 0) return { ok: false, issues: d.issues };
  return {
    ok: true,
    config: {
      ...(kanzleiName === undefined ? {} : { kanzleiName }),
      ...(appAddress === undefined ? {} : { appAddress }),
      ...(explainerBase === undefined ? {} : { explainerBase }),
    },
  };
}

/** Full video address for a frozen path, or undefined without a configured base. */
export function explainerUrl(config: AppConfig, path: string | undefined): string | undefined {
  if (path === undefined || config.explainerBase === undefined) return undefined;
  return `${config.explainerBase.replace(/\/+$/, '')}/${path}`;
}
