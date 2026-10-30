// The published forms compiled into the app (forms/<id>/<version>.json + forms/published.json).
// Drafts in form-drafts/ are bundled only in the review preview (`vite build --mode drafts`), where
// they are marked as drafts; the release build never contains them. The registry check runs at
// start, so a broken bundle shows an error instead of a half-working app.
import published from '../../forms/published.json';
import { parseFormDefinition } from '../logic/formDefinition';
import {
  buildFormRegistry,
  definitionHash,
  registryOf,
  type RegisteredForm,
  type RegistryResult,
} from '../logic/formRegistry';

const files = import.meta.glob<unknown>('../../forms/*/*.json', { eager: true, import: 'default' });

/** Review preview with the form drafts — never real data. */
export const DRAFT_PREVIEW = import.meta.env.MODE === 'drafts';

const draftFiles: Record<string, unknown> = DRAFT_PREVIEW
  ? import.meta.glob<unknown>('../../form-drafts/*/*.json', { eager: true, import: 'default' })
  : {};

function withDrafts(result: RegistryResult): { result: RegistryResult; drafts: Set<string> } {
  const drafts = new Set<string>();
  if (!result.ok) return { result, drafts };
  const forms: RegisteredForm[] = [];
  const issues = [];
  for (const [name, raw] of Object.entries(draftFiles)) {
    const parsed = parseFormDefinition(raw);
    if (!parsed.ok) {
      issues.push(...parsed.issues.map((issue) => ({ ...issue, path: `${name} ${issue.path}` })));
      continue;
    }
    const form = {
      definition: parsed.definition,
      definitionHash: definitionHash(parsed.definition),
    };
    forms.push(form);
    drafts.add(form.definitionHash);
  }
  if (issues.length > 0) return { result: { ok: false, issues }, drafts };
  return {
    result: { ok: true, registry: registryOf([...result.registry.forms, ...forms]) },
    drafts,
  };
}

const bundled = withDrafts(
  buildFormRegistry(
    Object.entries(files).map(([name, raw]) => ({ name, raw })),
    published,
  ),
);

export const BUNDLED_FORMS: RegistryResult = bundled.result;
/** definitionHash of every draft in the preview (empty in the release build). */
export const DRAFT_HASHES: ReadonlySet<string> = bundled.drafts;
