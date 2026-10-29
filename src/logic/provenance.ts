// Which signature covers which value — the basis for signature lines and footnotes in the PDF.
// Every sealed version of a role gets a numbered line. A field's value is covered by the current
// version and by every earlier version in which it was already the same; if it changed in a later
// version, it carries a footnote to the line of that version, so differing signing dates are
// visible at the field (user requirement 2026-10-29).
import { signerName } from './form';
import { canonicalize } from './jcs';
import type {
  FieldId,
  FieldValue,
  FormDefinition,
  PartStatus,
  Questionnaire,
  RoleId,
  Sha256Hex,
} from './model';

export interface SignatureLine {
  /** 1-based, in form role order, versions oldest first. */
  number: number;
  role: RoleId;
  roleLabel: string;
  version: number;
  status: PartStatus;
  method?: 'drawn' | 'typed';
  signerName?: string;
  signedAtLocal: string;
  timeZone: string;
  contentHash: Sha256Hex;
  /** The current (latest) version of its role. */
  current: boolean;
}

export interface FieldProvenance {
  fieldId: FieldId;
  role: RoleId;
  value: FieldValue;
  /** Line of the current version. */
  line: number;
  /** All lines whose version carries exactly this value (oldest first). */
  coveredBy: number[];
  /** Line of the version that last changed the value, if that is not the role's first version. */
  footnote?: number;
}

export interface SignatureLayout {
  lines: SignatureLine[];
  fields: FieldProvenance[];
}

export function signatureLayout(
  questionnaire: Questionnaire,
  definition: FormDefinition,
): SignatureLayout {
  const lines: SignatureLine[] = [];
  const fields: FieldProvenance[] = [];
  const known = definition.roles.map((role) => role.id);
  const roles = [
    ...known,
    ...Object.keys(questionnaire.parts)
      .filter((role) => !known.includes(role))
      .sort(),
  ];

  for (const roleId of roles) {
    const roleDefinition = definition.roles.find((role) => role.id === roleId);
    const sealed = (questionnaire.parts[roleId] ?? []).filter((part) => part.seal !== undefined);
    const first = lines.length + 1;
    sealed.forEach((part, i) => {
      const seal = part.seal;
      if (!seal) return;
      const name = roleDefinition && signerName(roleDefinition, part.data, seal.payload.signature);
      lines.push({
        number: first + i,
        role: roleId,
        roleLabel: roleDefinition?.label ?? roleId,
        version: seal.payload.version,
        status: part.status,
        ...(seal.payload.signature ? { method: seal.payload.signature.method } : {}),
        ...(name === undefined ? {} : { signerName: name }),
        signedAtLocal: seal.payload.systemNote.signedAtLocal,
        timeZone: seal.payload.systemNote.timeZone,
        contentHash: seal.contentHash,
        current: i === sealed.length - 1,
      });
    });

    const current = sealed.at(-1);
    if (!current) continue;
    for (const [fieldId, value] of Object.entries(current.data)) {
      const coveredBy: number[] = [];
      for (let i = sealed.length - 1; i >= 0; i--) {
        const version = sealed[i];
        if (!version || !Object.hasOwn(version.data, fieldId)) break;
        if (canonicalize(version.data[fieldId] ?? null) !== canonicalize(value)) break;
        coveredBy.unshift(first + i);
      }
      const since = coveredBy[0] ?? first + sealed.length - 1;
      fields.push({
        fieldId,
        role: roleId,
        value,
        line: first + sealed.length - 1,
        coveredBy,
        ...(since !== first ? { footnote: since } : {}),
      });
    }
  }
  return { lines, fields };
}
