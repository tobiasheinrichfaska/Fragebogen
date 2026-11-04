// Stamps `revised` (Tobias 2026-11-04: "zuletzt überarbeitet am … um …") into every form draft that
// differs from the last commit, so the date is never forgotten. Run by `npm run catalogue` before
// the generated documents; only that one line changes, the formatting stays. Published versions in
// forms/ are frozen and never touched.
//   node deploy/stampRevised.ts
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const two = (n: number) => String(n).padStart(2, '0');

/** Local wall time as `YYYY-MM-DDTHH:MM`, the format of `revised`. */
export function localStamp(date = new Date()): string {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

const sortedKeys = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(sortedKeys)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, sortedKeys((value as Record<string, unknown>)[key])]),
        )
      : value;

/** The definition without its `revised`, key order ignored — what counts as a change. */
function content(text: string): string {
  const definition = JSON.parse(text) as Record<string, unknown>;
  delete definition.revised;
  return JSON.stringify(sortedKeys(definition));
}

const REVISED_LINE = /^ {2}"revised": "[^"]*"/m;
const VERSION_LINE = /^( {2}"version": "[^"]*",)$/m;

/**
 * Whether a draft needs a new stamp: it has none, or its content differs from the committed file
 * (`committed` undefined: not committed yet — then only a missing stamp counts).
 */
export function needsStamp(text: string, committed: string | undefined): boolean {
  if (!REVISED_LINE.test(text)) return true;
  return committed !== undefined && content(committed) !== content(text);
}

/** The draft text with `revised` set to the stamp: the line replaced, or added after "version". */
export function stamped(text: string, stamp: string): string {
  if (REVISED_LINE.test(text)) return text.replace(REVISED_LINE, `  "revised": "${stamp}"`);
  if (!VERSION_LINE.test(text)) throw new Error('no top-level "version" line to stamp after');
  return text.replace(VERSION_LINE, `$1\n  "revised": "${stamp}",`);
}

function committedText(root: string, path: string): string | undefined {
  try {
    return execFileSync('git', ['show', `HEAD:${relative(root, path).replace(/\\/g, '/')}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined;
  }
}

function run(root: string, now: Date): string[] {
  const drafts = join(root, 'form-drafts');
  const changed: string[] = [];
  for (const id of readdirSync(drafts, { withFileTypes: true })) {
    if (!id.isDirectory()) continue;
    for (const file of readdirSync(join(drafts, id.name))) {
      if (!file.endsWith('.json')) continue;
      const path = join(drafts, id.name, file);
      const text = readFileSync(path, 'utf8');
      if (!needsStamp(text, committedText(root, path))) continue;
      writeFileSync(path, stamped(text, localStamp(now)));
      changed.push(`${id.name}/${file}`);
    }
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const changed = run(root, new Date());
  process.stdout.write(
    changed.length === 0
      ? 'Stand der Entwürfe: unverändert.\n'
      : `Stand gesetzt („zuletzt überarbeitet“): ${changed.join(', ')}\n`,
  );
}
