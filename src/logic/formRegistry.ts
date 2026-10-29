// Registry of the bundled form definitions, addressed by (id, version) and by definitionHash.
// Published definitions are frozen: their hash is recorded in forms/published.json and must never
// change, published entries are never removed, and a field id keeps its type and role across all
// versions of a form. Questionnaires reference a definition by hash, so this is what keeps old
// questionnaires verifiable.
import { Decoder, type DecodeIssue } from './decode';
import { FORM_ID, SEMVER, parseFormDefinition } from './formDefinition';
import { SHA256_HEX, canonicalHash } from './hash';
import type { FieldDefinition, FormDefinition, Sha256Hex } from './model';

export interface PublishedForm {
  id: string;
  version: string;
  definitionHash: Sha256Hex;
}

export interface RegisteredForm {
  definition: FormDefinition;
  definitionHash: Sha256Hex;
}

/** A definition file as read from disk; `name` (its path) prefixes issue paths. */
export interface FormSource {
  name: string;
  raw: unknown;
}

export interface FormRegistry {
  readonly forms: readonly RegisteredForm[];
  get(id: string, version: string): RegisteredForm | undefined;
  byHash(hash: Sha256Hex): RegisteredForm | undefined;
  /** Highest version of a form. */
  latest(id: string): RegisteredForm | undefined;
}

export type RegistryResult =
  { ok: true; registry: FormRegistry } | { ok: false; issues: DecodeIssue[] };

export const PUBLISHED_LIST_NAME = 'forms/published.json';

export function definitionHash(definition: FormDefinition): Sha256Hex {
  return canonicalHash(definition);
}

/**
 * Versions 0.x.y are test versions (Tobias, 2026-10-29): frozen like any other, but they may be
 * removed before the app's first release as long as no real questionnaire was filled in with
 * them. From 1.0.0 on a published version stays forever.
 */
export function isTestVersion(version: string): boolean {
  return version.startsWith('0.');
}

/** Numeric semver comparison of `MAJOR.MINOR.PATCH`. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function parsePublishedList(
  raw: unknown,
): { ok: true; entries: PublishedForm[] } | { ok: false; issues: DecodeIssue[] } {
  const d = new Decoder();
  const entries = d.array(raw, PUBLISHED_LIST_NAME, (value, path) => {
    const o = d.object(value, path, ['id', 'version', 'definitionHash']);
    if (!o) return undefined;
    const id = d.string(o.id, `${path}.id`, FORM_ID);
    const version = d.string(o.version, `${path}.version`, SEMVER);
    const hash = d.string(o.definitionHash, `${path}.definitionHash`, SHA256_HEX);
    if (id === undefined || version === undefined || hash === undefined) return undefined;
    return { id, version, definitionHash: hash };
  });
  if (!entries || d.issues.length > 0) return { ok: false, issues: d.issues };
  return { ok: true, entries };
}

/** A field id must never change meaning: same type and same role in every version of a form. */
export function checkFieldIdStability(definitions: readonly FormDefinition[]): DecodeIssue[] {
  const issues: DecodeIssue[] = [];
  const firstSeen = new Map<string, { type: string; role: string; version: string }>();
  const sorted = [...definitions].sort((a, b) => compareVersions(a.version, b.version));
  for (const definition of sorted) {
    for (const field of allFields(definition)) {
      const key = `${definition.id}/${field.id}`;
      const seen = firstSeen.get(key);
      if (!seen) {
        firstSeen.set(key, { type: field.type, role: field.role, version: definition.version });
      } else if (seen.type !== field.type || seen.role !== field.role) {
        issues.push({
          path: `${definition.id} ${definition.version}: field "${field.id}"`,
          message:
            `was ${seen.type}/${seen.role} in ${seen.version}, now ${field.type}/${field.role} — ` +
            'field ids never change meaning; use a new id',
        });
      }
    }
  }
  return issues;
}

function allFields(definition: FormDefinition): FieldDefinition[] {
  return definition.sections.flatMap((section) =>
    section.fields.flatMap((field) => [field, ...(field.columns ?? [])]),
  );
}

export function buildFormRegistry(
  sources: readonly FormSource[],
  published: unknown,
): RegistryResult {
  const issues: DecodeIssue[] = [];
  const forms: RegisteredForm[] = [];
  for (const source of sources) {
    const parsed = parseFormDefinition(source.raw);
    if (!parsed.ok) {
      issues.push(...parsed.issues.map((i) => ({ ...i, path: `${source.name}: ${i.path}` })));
      continue;
    }
    forms.push({
      definition: parsed.definition,
      definitionHash: definitionHash(parsed.definition),
    });
  }

  const byKey = new Map<string, RegisteredForm>();
  for (const form of forms) {
    const key = `${form.definition.id} ${form.definition.version}`;
    if (byKey.has(key)) issues.push({ path: key, message: 'defined more than once' });
    byKey.set(key, form);
  }

  const list = parsePublishedList(published);
  if (!list.ok) {
    issues.push(...list.issues);
  } else {
    const listed = new Set<string>();
    for (const entry of list.entries) {
      const key = `${entry.id} ${entry.version}`;
      if (listed.has(key))
        issues.push({ path: PUBLISHED_LIST_NAME, message: `${key} listed twice` });
      listed.add(key);
      const form = byKey.get(key);
      if (!form) {
        issues.push({
          path: key,
          message: 'published but missing — published forms are never removed',
        });
      } else if (form.definitionHash !== entry.definitionHash) {
        issues.push({
          path: key,
          message:
            `changed after publication (published ${entry.definitionHash}, ` +
            `now ${form.definitionHash}) — publish a new version instead`,
        });
      }
    }
    for (const [key, form] of byKey) {
      if (!listed.has(key)) {
        issues.push({
          path: key,
          message: `not in ${PUBLISHED_LIST_NAME} — add it with definitionHash ${form.definitionHash}`,
        });
      }
    }
  }

  issues.push(...checkFieldIdStability(forms.map((form) => form.definition)));
  return issues.length > 0 ? { ok: false, issues } : { ok: true, registry: registryOf(forms) };
}

/** Registry over already trusted forms (the bundled ones), without the published-list check. */
export function registryOf(forms: readonly RegisteredForm[]): FormRegistry {
  const byHash = new Map(forms.map((form) => [form.definitionHash, form]));
  return {
    forms,
    get: (id, version) =>
      forms.find((form) => form.definition.id === id && form.definition.version === version),
    byHash: (hash) => byHash.get(hash),
    latest: (id) =>
      forms
        .filter((form) => form.definition.id === id)
        .reduce<RegisteredForm | undefined>(
          (best, form) =>
            !best || compareVersions(form.definition.version, best.definition.version) > 0
              ? form
              : best,
          undefined,
        ),
  };
}
