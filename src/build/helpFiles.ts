// The help pages "Wo finde ich …?" as files (Tobias 2026-11-15): reads their data from hilfe/ and
// writes them into a build folder. The build for the upload adds the Kanzlei's Impressum and
// Datenschutz from the local configuration (vite.config.ts → dist/hilfe/, dist-test/hilfe/); the
// copy in docs/hilfe/ (`npm run catalogue`) is written without them, so the public repo stays neutral.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { LegalLink } from '../logic/appConfig';
import {
  checkHelpPages,
  parseHelpPage,
  parseMuster,
  type HelpPage,
  type Muster,
} from '../logic/helpPages';
import { renderHelpIndex, renderHelpPage } from './helpPage';

export interface HelpContent {
  pages: HelpPage[];
  musters: Muster[];
}

function decodeAll<T>(
  root: string,
  dir: string,
  parse: (raw: unknown) => { ok: true; value: T } | { ok: false; issues: unknown },
  fileName: (value: T) => string,
): T[] {
  return readdirSync(join(root, dir))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const raw = JSON.parse(readFileSync(join(root, dir, name), 'utf8')) as unknown;
      const parsed = parse(raw);
      if (!parsed.ok) throw new Error(`${dir}/${name}: ${JSON.stringify(parsed.issues)}`);
      const expected = fileName(parsed.value);
      if (expected !== name) throw new Error(`${dir}/${name}: must be named ${expected}`);
      return parsed.value;
    });
}

/** Every page and Muster of a hilfe/ folder; any file that does not decode or fit stops the build. */
export function readHelpContent(root: string): HelpContent {
  const musters = decodeAll(root, 'muster', parseMuster, (m) => `${m.id}.json`);
  const pages = decodeAll(
    root,
    'seiten',
    parseHelpPage,
    (p) => `${p.path.replace(/\//g, '-')}.json`,
  );
  const problems = checkHelpPages(pages, musters);
  if (problems.length > 0) throw new Error(`hilfe/: ${problems.join('; ')}`);
  return { pages, musters };
}

/** Writes the overview and every page into `dir`; returns the written files, relative and sorted. */
export function writeHelpPages(
  dir: string,
  content: HelpContent,
  links: readonly LegalLink[],
): string[] {
  const files = new Map<string, string>([['index.html', renderHelpIndex(content.pages, links)]]);
  for (const page of content.pages) {
    files.set(`${page.path}/index.html`, renderHelpPage(page, content.musters, links));
  }
  for (const [file, html] of files) {
    const path = join(dir, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, html);
  }
  return [...files.keys()].sort();
}
