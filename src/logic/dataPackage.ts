// The data package: one canonical JSON document with the questionnaire AND its form definition.
// It is what the PDF data pages, the QR codes and the interim-state file carry (Tobias,
// 2026-10-29: the definition travels along). The seal pins the definition by hash, so an altered
// definition is detected; whether the definition is one this app published (the frozen list) is
// stated separately — a file can describe itself, but only the app can vouch for its forms.
import { Decoder, type DecodeIssue } from './decode';
import { parseFormDefinition } from './formDefinition';
import { definitionHash, type FormRegistry, type RegisteredForm } from './formRegistry';
import { canonicalize } from './jcs';
import type { FormDefinition, Questionnaire } from './model';
import { decodeQuestionnaire } from './questionnaireFile';

export const PACKAGE_FORMAT = 'fragebogen-paket';
export const PACKAGE_FORMAT_VERSION = 1;

export interface DataPackage {
  format: typeof PACKAGE_FORMAT;
  formatVersion: typeof PACKAGE_FORMAT_VERSION;
  questionnaire: Questionnaire;
  definition: FormDefinition;
}

/**
 * Where the form of a package comes from:
 * - `published`: the definition is one of this app's frozen forms.
 * - `embedded`: only the file carries it (e.g. a deleted test version or another installation);
 *   its integrity is checked, its origin is not vouched for.
 */
export type FormOrigin = 'published' | 'embedded';

export const ORIGIN_MESSAGES: Readonly<Record<FormOrigin, string>> = {
  published: 'Formular dieser App (veröffentlichte Fassung).',
  embedded:
    'Das Formular stammt aus der Datei und ist in dieser App-Version nicht veröffentlicht. Es ist unverändert, seine Herkunft bestätigt die App aber nicht.',
};

export function buildPackage(questionnaire: Questionnaire, form: RegisteredForm): DataPackage {
  if (questionnaire.form.definitionHash !== form.definitionHash) {
    throw new RangeError('The form does not belong to this questionnaire');
  }
  return {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_FORMAT_VERSION,
    questionnaire,
    definition: form.definition,
  };
}

/** The exact text that is compressed, hashed and carried (RFC 8785). */
export function packageText(pkg: DataPackage): string {
  return canonicalize(pkg);
}

export type PackageResult =
  | { ok: true; questionnaire: Questionnaire; form: RegisteredForm; origin: FormOrigin }
  | { ok: false; issues: DecodeIssue[] };

/**
 * Strictly decodes an untrusted package. The definition must hash to the one the questionnaire
 * names; if the published registry knows that hash, its definition is used.
 */
export function decodePackage(raw: unknown, published: FormRegistry): PackageResult {
  const d = new Decoder();
  const o = d.object(raw, '$', ['format', 'formatVersion', 'questionnaire', 'definition']);
  if (!o) return { ok: false, issues: d.issues };
  d.literal(o.format, '$.format', [PACKAGE_FORMAT] as const);
  if (o.formatVersion !== PACKAGE_FORMAT_VERSION) {
    d.report('$.formatVersion', `expected ${PACKAGE_FORMAT_VERSION}`);
  }
  if (d.issues.length > 0) return { ok: false, issues: d.issues };

  const questionnaire = decodeQuestionnaire(o.questionnaire);
  if (!questionnaire.ok)
    return { ok: false, issues: prefixed(questionnaire.issues, '$.questionnaire') };
  const definition = parseFormDefinition(o.definition);
  if (!definition.ok) return { ok: false, issues: prefixed(definition.issues, '$.definition') };

  const hash = definitionHash(definition.definition);
  const named = questionnaire.questionnaire.form;
  if (hash !== named.definitionHash) {
    return {
      ok: false,
      issues: [
        {
          path: '$.definition',
          message: `does not match the questionnaire's form ${named.id} ${named.version} (hash ${hash})`,
        },
      ],
    };
  }
  const known = published.byHash(hash);
  return known
    ? { ok: true, questionnaire: questionnaire.questionnaire, form: known, origin: 'published' }
    : {
        ok: true,
        questionnaire: questionnaire.questionnaire,
        form: { definition: definition.definition, definitionHash: hash },
        origin: 'embedded',
      };
}

function prefixed(issues: readonly DecodeIssue[], prefix: string): DecodeIssue[] {
  return issues.map((issue) => ({ ...issue, path: prefix + issue.path.replace(/^\$/, '') }));
}
