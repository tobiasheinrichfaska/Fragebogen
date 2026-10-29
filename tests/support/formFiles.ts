// The two form folders on disk: forms/ (published and frozen) and form-drafts/ (under expert
// review, never bundled). Files are read lazily so that a misnamed file is reported, not thrown.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFormDefinition } from '../../src/logic/formDefinition';
import { definitionHash, type RegisteredForm } from '../../src/logic/formRegistry';

export const FORMS_DIR = fileURLToPath(new URL('../../forms/', import.meta.url));
export const DRAFTS_DIR = fileURLToPath(new URL('../../form-drafts/', import.meta.url));

export interface DefinitionFile {
  folder: string;
  file: string;
  path: string;
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function definitionFiles(dir: string): DefinitionFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((folder) =>
      readdirSync(join(dir, folder.name)).map((file) => ({
        folder: folder.name,
        file,
        path: join(dir, folder.name, file),
      })),
    );
}

export function looseFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function registeredFrom(raw: unknown): RegisteredForm {
  const parsed = parseFormDefinition(raw);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  return { definition: parsed.definition, definitionHash: definitionHash(parsed.definition) };
}
