// State transitions of a questionnaire. Every function is pure: it returns a new questionnaire or a
// refusal with a reason and never mutates its input. Time, nonce and device data are arguments
// (gathered by the io layer), so sealing is deterministic and testable.
import { canonicalize } from './jcs';
import { Decoder } from './decode';
import {
  fieldsOfRole,
  infoBlocksOfRole,
  missingRequired,
  noticeHash,
  roleOf,
  sealableData,
} from './form';
import type { RegisteredForm } from './formRegistry';
import { SHA256_HEX } from './hash';
import type { IssueCode } from './issues';
import type {
  FieldId,
  Part,
  Questionnaire,
  Receipt,
  ReceivedPart,
  RoleId,
  SealPayload,
  SealSignature,
  SystemNote,
} from './model';
import { CANON_VERSION, normalizeFieldValue, normalizeText } from './normalize';
import {
  FORMAT,
  FORMAT_VERSION,
  QUESTIONNAIRE_ID,
  decodeReceipt,
  decodeReceivedPart,
  decodeSystemNote,
} from './questionnaireFile';
import { NONCE_PATTERN, SEAL_SCHEMA, contentHashOf, fieldHashesOf, strokesHashOf } from './seal';
import { decodeStrokes } from './strokes';
import { sameInstant } from './time';

export type TransitionCode =
  | 'wrongForm'
  | 'unknownRole'
  | 'draftExists'
  | 'noDraft'
  | 'unknownField'
  | 'notOwnField'
  | 'invalidValue'
  | 'missingRequired'
  | 'noticeNotAcknowledged'
  | 'unknownNotice'
  | 'signatureRequired'
  | 'signatureNotAllowed'
  | 'invalidSignature'
  | 'invalidNonce'
  | 'invalidSystemNote'
  | 'invalidReceivedPart'
  | 'invalidReceipt'
  | 'unknownPart';

export const TRANSITION_MESSAGES: Readonly<Record<TransitionCode, string>> = {
  wrongForm: 'Die Formularversion passt nicht zu diesem Fragebogen.',
  unknownRole: 'Diese Rolle gibt es in diesem Formular nicht.',
  draftExists: 'Für diese Rolle gibt es bereits einen Entwurf.',
  noDraft: 'Für diese Rolle gibt es keinen Entwurf, der bearbeitet werden kann.',
  unknownField: 'Dieses Feld gibt es in diesem Formular nicht.',
  notOwnField: 'Dieses Feld füllt eine andere Rolle aus.',
  invalidValue: 'Ein Wert ist ungültig.',
  missingRequired: 'Es fehlen Pflichtangaben.',
  noticeNotAcknowledged: 'Es wurden nicht alle Hinweise zur Kenntnis genommen.',
  unknownNotice: 'Dieser Hinweis gehört nicht zu dieser Rolle.',
  signatureRequired: 'Für diese Rolle ist eine Unterschrift erforderlich.',
  signatureNotAllowed: 'Für diese Rolle ist keine Unterschrift vorgesehen.',
  invalidSignature: 'Die Unterschrift ist leer oder ungültig.',
  invalidNonce: 'Interner Fehler: Die Zufallszahl für das Siegel ist ungültig.',
  invalidSystemNote: 'Interner Fehler: Der Systemvermerk ist unvollständig oder widersprüchlich.',
  invalidReceivedPart: 'Ein Eingangsvermerk ist ungültig.',
  invalidReceipt: 'Der Eingangsvermerk ist ungültig.',
  unknownPart: 'Der Eingangsvermerk verweist auf einen Teil, der nicht vorliegt.',
};

export type Transition =
  | { ok: true; questionnaire: Questionnaire; warnings: readonly IssueCode[] }
  | { ok: false; code: TransitionCode; detail: readonly string[] };

function done(questionnaire: Questionnaire, warnings: readonly IssueCode[] = []): Transition {
  return { ok: true, questionnaire, warnings };
}

function refuse(code: TransitionCode, detail: readonly string[] = []): Transition {
  return { ok: false, code, detail };
}

export type SignatureInput =
  { method: 'drawn'; strokes: string } | { method: 'typed'; name: string };

export interface SealInput {
  /** 128-bit random value, lower-case hex (from crypto.getRandomValues in the io layer). */
  nonce: string;
  systemNote: SystemNote;
  /** Ids of the role's notices the person confirmed (read, or handed out on paper). */
  acknowledged: readonly string[];
  signature?: SignatureInput;
  /** Parts of other roles this station had received, with their receipt times. */
  receivedParts?: readonly ReceivedPart[];
}

export function createQuestionnaire(questionnaireId: string, form: RegisteredForm): Questionnaire {
  if (!QUESTIONNAIRE_ID.test(questionnaireId)) {
    throw new RangeError(`Not a lower-case UUID v4: ${questionnaireId}`);
  }
  const { definition, definitionHash } = form;
  return {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    questionnaireId,
    form: { id: definition.id, version: definition.version, definitionHash },
    parts: {},
    receipts: [],
  };
}

export function versionsOf(questionnaire: Questionnaire, role: RoleId): readonly Part[] {
  return questionnaire.parts[role] ?? [];
}

export function currentPart(questionnaire: Questionnaire, role: RoleId): Part | undefined {
  return versionsOf(questionnaire, role).at(-1);
}

/** The latest sealed or signed version of a role. */
export function latestSealed(questionnaire: Questionnaire, role: RoleId): Part | undefined {
  return versionsOf(questionnaire, role)
    .filter((part) => part.seal !== undefined)
    .at(-1);
}

function withVersions(questionnaire: Questionnaire, role: RoleId, versions: Part[]): Questionnaire {
  const parts = { ...questionnaire.parts };
  if (versions.length === 0) Reflect.deleteProperty(parts, role);
  else parts[role] = versions;
  return { ...questionnaire, parts };
}

function matchesForm(questionnaire: Questionnaire, form: RegisteredForm): boolean {
  return questionnaire.form.definitionHash === form.definitionHash;
}

/** Opens a draft for the role; after an earlier seal the draft starts from its data (new version). */
export function startPart(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  role: RoleId,
): Transition {
  if (!matchesForm(questionnaire, form)) return refuse('wrongForm');
  if (!roleOf(form.definition, role)) return refuse('unknownRole', [role]);
  if (currentPart(questionnaire, role)?.status === 'draft') return refuse('draftExists', [role]);
  const previous = latestSealed(questionnaire, role);
  const draft: Part = { role, status: 'draft', data: { ...(previous?.data ?? {}) } };
  return done(withVersions(questionnaire, role, [...versionsOf(questionnaire, role), draft]));
}

/** Normalises and stores one value in the role's draft. */
export function setValue(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  role: RoleId,
  fieldId: FieldId,
  raw: unknown,
): Transition {
  if (!matchesForm(questionnaire, form)) return refuse('wrongForm');
  const draft = currentPart(questionnaire, role);
  if (draft?.status !== 'draft') return refuse('noDraft', [role]);
  const field = form.definition.sections
    .flatMap((section) => section.fields)
    .find((candidate) => candidate.id === fieldId);
  if (!field) return refuse('unknownField', [fieldId]);
  if (field.role !== role) return refuse('notOwnField', [fieldId]);
  const value = normalizeFieldValue(field, raw);
  if (!value.ok) return refuse('invalidValue', [fieldId, value.issue]);
  const versions = [...versionsOf(questionnaire, role)];
  versions[versions.length - 1] = { ...draft, data: { ...draft.data, [fieldId]: value.value } };
  return done(withVersions(questionnaire, role, versions), value.warnings);
}

export function discardDraft(questionnaire: Questionnaire, role: RoleId): Transition {
  const versions = versionsOf(questionnaire, role);
  if (versions.at(-1)?.status !== 'draft') return refuse('noDraft', [role]);
  return done(withVersions(questionnaire, role, versions.slice(0, -1)));
}

/**
 * Completes the role's draft: hidden fields are dropped, every value must be valid and every
 * required visible field answered, all notices of the role acknowledged, and the signature must
 * fit the role (required / optional / none). With a signature the part becomes `signed`, without
 * one `sealed`. A re-seal becomes the next version and points to the previous one (`supersedes`).
 */
export function sealPart(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  role: RoleId,
  input: SealInput,
): Transition {
  const { definition } = form;
  if (!matchesForm(questionnaire, form)) return refuse('wrongForm');
  const roleDefinition = roleOf(definition, role);
  if (!roleDefinition) return refuse('unknownRole', [role]);
  const draft = currentPart(questionnaire, role);
  if (draft?.status !== 'draft') return refuse('noDraft', [role]);
  if (!NONCE_PATTERN.test(input.nonce)) return refuse('invalidNonce');

  const noteProblems = systemNoteProblems(input.systemNote);
  if (noteProblems.length > 0) return refuse('invalidSystemNote', noteProblems);

  if (roleDefinition.signature === 'required' && !input.signature)
    return refuse('signatureRequired');
  if (roleDefinition.signature === 'none' && input.signature) return refuse('signatureNotAllowed');
  const signature = input.signature && signatureOf(input.signature);
  if (signature === null) return refuse('invalidSignature');

  const notices = infoBlocksOfRole(definition, role);
  const unknownNotices = input.acknowledged.filter((id) => !notices.some((b) => b.id === id));
  if (unknownNotices.length > 0) return refuse('unknownNotice', unknownNotices);
  const unacknowledged = notices.filter((b) => !input.acknowledged.includes(b.id)).map((b) => b.id);
  if (unacknowledged.length > 0) return refuse('noticeNotAcknowledged', unacknowledged);

  const data = sealableData(definition, role, draft.data);
  const invalid = fieldsOfRole(definition, role)
    .filter((field) => Object.hasOwn(data, field.id))
    .filter((field) => {
      const value = data[field.id] ?? null;
      const checked = normalizeFieldValue(field, value);
      return !checked.ok || canonicalize(checked.value) !== canonicalize(value);
    })
    .map((field) => field.id);
  if (invalid.length > 0) return refuse('invalidValue', invalid);
  const missing = missingRequired(definition, role, data);
  if (missing.length > 0) return refuse('missingRequired', missing);

  const receivedParts = input.receivedParts ?? [];
  const receivedProblems = receivedPartProblems(receivedParts, role, form);
  if (receivedProblems.length > 0) return refuse('invalidReceivedPart', receivedProblems);

  const previous = latestSealed(questionnaire, role)?.seal;
  const payload: SealPayload = {
    schema: SEAL_SCHEMA,
    canon: CANON_VERSION,
    questionnaireId: questionnaire.questionnaireId,
    form: { ...questionnaire.form },
    role,
    version: previous ? previous.payload.version + 1 : 1,
    ...(previous ? { supersedes: previous.contentHash } : {}),
    fieldHashes: fieldHashesOf(input.nonce, data),
    confirmationText: roleDefinition.confirmationText,
    acknowledgements: notices.map((block) => ({
      infoBlockId: block.id,
      kind: block.acknowledgement,
      textHash: noticeHash(block),
    })),
    ...(signature ? { signature: signature.seal } : {}),
    systemNote: { ...input.systemNote, inputTypes: [...input.systemNote.inputTypes] },
    receivedParts: receivedParts.map((part) => ({ ...part })),
    nonce: input.nonce,
  };
  const sealed: Part = {
    role,
    status: signature ? 'signed' : 'sealed',
    data,
    ...(signature?.strokes === undefined ? {} : { signatureStrokes: signature.strokes }),
    seal: { payload, contentHash: contentHashOf(payload) },
  };
  const versions = [...versionsOf(questionnaire, role)];
  versions[versions.length - 1] = sealed;
  return done(withVersions(questionnaire, role, versions));
}

function signatureOf(input: SignatureInput): { seal: SealSignature; strokes?: string } | null {
  if (input.method === 'drawn') {
    if (!decodeStrokes(input.strokes).ok) return null;
    return {
      seal: { method: 'drawn', strokesHash: strokesHashOf(input.strokes) },
      strokes: input.strokes,
    };
  }
  const name = normalizeText(input.name);
  if (!name.ok || name.value === '') return null;
  return { seal: { method: 'typed', typedName: name.value } };
}

function systemNoteProblems(note: SystemNote): string[] {
  const d = new Decoder();
  const decoded = decodeSystemNote(d, note, 'systemNote');
  const problems = d.issues.map((issue) => `${issue.path}: ${issue.message}`);
  if (decoded && !sameInstant(decoded.signedAtLocal, decoded.signedAtUtc)) {
    problems.push('systemNote: signedAtLocal and signedAtUtc are different instants');
  }
  return problems;
}

function receivedPartProblems(
  parts: readonly ReceivedPart[],
  ownRole: RoleId,
  form: RegisteredForm,
): string[] {
  const d = new Decoder();
  const seen = new Set<string>();
  parts.forEach((part, i) => {
    const path = `receivedParts[${i}]`;
    if (!decodeReceivedPart(d, part, path)) return;
    if (part.role === ownRole) d.report(`${path}.role`, 'a station does not receive its own part');
    else if (!roleOf(form.definition, part.role)) d.report(`${path}.role`, 'unknown role');
    if (!sameInstant(part.receivedAtLocal, part.receivedAtUtc)) {
      d.report(path, 'receivedAtLocal and receivedAtUtc are different instants');
    }
    const key = `${part.role} ${part.contentHash}`;
    if (seen.has(key)) d.report(path, 'listed twice');
    seen.add(key);
  });
  return d.issues.map((issue) => `${issue.path}: ${issue.message}`);
}

/** Records that a station received sealed parts (e.g. the Kanzlei, or the DATEV filing date). */
export function addReceipt(questionnaire: Questionnaire, receipt: Receipt): Transition {
  const d = new Decoder();
  decodeReceipt(d, receipt, 'receipt');
  if (d.issues.length > 0) {
    return refuse(
      'invalidReceipt',
      d.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }
  if (!sameInstant(receipt.receivedAtLocal, receipt.receivedAtUtc)) {
    return refuse('invalidReceipt', ['receivedAtLocal and receivedAtUtc are different instants']);
  }
  const unknown = receipt.parts.filter(
    (ref) =>
      !versionsOf(questionnaire, ref.role).some(
        (part) => part.seal?.contentHash === ref.contentHash,
      ),
  );
  if (unknown.length > 0)
    return refuse(
      'unknownPart',
      unknown.map((ref) => `${ref.role} ${ref.contentHash}`),
    );
  const copy: Receipt = { ...receipt, parts: receipt.parts.map((ref) => ({ ...ref })) };
  return done({ ...questionnaire, receipts: [...questionnaire.receipts, copy] });
}

/** Receipt note for a sealed part of another role, as stored in the receiving station's seal. */
export function receivedPartFor(
  part: Part,
  received: { local: string; utc: string },
  source: ReceivedPart['source'],
  fileSha256?: string,
): ReceivedPart {
  if (!part.seal) throw new RangeError('Only sealed parts can be received');
  if (fileSha256 !== undefined && !SHA256_HEX.test(fileSha256)) {
    throw new RangeError('fileSha256 must be a lower-case SHA-256');
  }
  return {
    role: part.role,
    contentHash: part.seal.contentHash,
    receivedAtLocal: received.local,
    receivedAtUtc: received.utc,
    source,
    ...(fileSha256 === undefined ? {} : { fileSha256 }),
  };
}
