// Data model (draft from step 0). Behaviour follows in steps 2–4 (canon, seal/verify, merge).
// Keep docs/data-model.html in sync whenever these types change.

/** Calendar date `YYYY-MM-DD`. Never parsed through `Date` (UTC off-by-one). */
export type IsoDate = string;
/** Lower-case hex SHA-256 digest. */
export type Sha256Hex = string;
export type RoleId = string;
export type FieldId = string;

// ---------------------------------------------------------------------------
// Form definition (bundled, frozen once published, keyed by definitionHash)
// ---------------------------------------------------------------------------

export type SignatureRequirement = 'required' | 'optional' | 'none';

/** Whether the form's legal form requirement allows the in-app simple e-signature. */
export type SignaturePolicy = 'electronic' | 'paperRecommended' | 'paperRequired';

/** A role becomes mandatory only when its condition holds (e.g. legal guardian of a minor). */
export interface RoleCondition {
  kind: 'minorOnSigning';
  birthDateField: FieldId;
}

export interface RoleDefinition {
  id: RoleId;
  label: string;
  /** PDF heading of this station, e.g. "Fassung Arbeitnehmer". */
  stationHeading: string;
  confirmationText: string;
  signature: SignatureRequirement;
  requiredIf?: RoleCondition;
}

export type FieldType =
  | 'text'
  | 'date'
  | 'choice'
  | 'multiChoice'
  | 'boolean'
  | 'iban'
  | 'taxId'
  | 'svNumber'
  | 'money'
  | 'repeatGroup'
  | 'file';

export interface ChoiceOption {
  id: string;
  label: string;
}

/** Visibility condition; evaluated only against fields of the same role. */
export type Condition =
  { field: FieldId; equals: string | boolean } | { all: Condition[] } | { any: Condition[] };

export interface FieldDefinition {
  id: FieldId;
  /** Owner of the field — ownership is per field, sections are shared between roles. */
  role: RoleId;
  type: FieldType;
  label: string;
  required: boolean;
  /** Why the field is collected; feeds the Art. 13 GDPR notice. */
  purpose: string;
  /** Answer is voluntary (e.g. severe disability during the first six months). */
  voluntary?: boolean;
  options?: ChoiceOption[];
  showIf?: Condition;
  /** Columns of a repeat group; a column may belong to another role (referenced by row id). */
  columns?: FieldDefinition[];
  /** Derived value: name of a pure function in the logic layer, never code in data. */
  computed?: { fn: string; args: FieldId[] };
}

export interface SectionDefinition {
  id: string;
  title: string;
  fields: FieldDefinition[];
}

/**
 * How a notice is acknowledged:
 * - `read`: shown in the app and confirmed there.
 * - `paperHandout`: the notice is handed out on paper; the form only confirms the handout.
 */
export type AcknowledgementKind = 'read' | 'paperHandout';

export interface InfoBlock {
  id: string;
  /** Role that must acknowledge the notice. */
  role: RoleId;
  title: string;
  text: string;
  /** "Stand" of the text. */
  asOf: IsoDate;
  acknowledgement: AcknowledgementKind;
}

export interface ConsistencyRule {
  kind: 'equal';
  fields: [FieldId, FieldId];
  message: string;
}

/** Fields that identify the same person across roles when no shared questionnaire id exists. */
export interface MatchKey {
  label: string;
  fields: Record<RoleId, FieldId>;
}

export interface FormDefinition {
  id: string;
  version: string;
  title: string;
  signaturePolicy: SignaturePolicy;
  roles: RoleDefinition[];
  recipient: { label: string };
  sections: SectionDefinition[];
  infoBlocks: InfoBlock[];
  consistencyRules: ConsistencyRule[];
  matchKeys: MatchKey[];
  legalNotes: string[];
}

// ---------------------------------------------------------------------------
// Questionnaire instance (travels inside the PDF's data pages)
// ---------------------------------------------------------------------------

/** Only strings, booleans, null and nested arrays/objects — never JSON numbers. */
export type FieldValue = string | boolean | null | FieldValue[] | { [key: string]: FieldValue };

/** `sealed` = completed without signature (still hashed and chained). */
export type PartStatus = 'draft' | 'sealed' | 'signed';

export type InputType = 'pen' | 'touch' | 'mouse' | 'keyboard';

/** Signature shape as quantised x/y pairs — deliberately no timing or pressure (biometrics). */
export interface Stroke {
  points: number[];
}

export interface SystemNote {
  /** ISO 8601 with UTC offset, from the signer's device. */
  signedAtLocal: string;
  /** IANA time zone, e.g. Europe/Berlin. */
  timeZone: string;
  signedAtUtc: string;
  os: string;
  browser: string;
  browserVersion: string;
  uaSource: 'ua-ch' | 'ua-string';
  language: string;
  inputTypes: InputType[];
  appVersion: string;
}

export interface ReceivedPart {
  role: RoleId;
  contentHash: Sha256Hex;
  receivedAtLocal: string;
  receivedAtUtc: string;
  source: 'file' | 'same-device';
  fileSha256?: Sha256Hex;
}

export interface Acknowledgement {
  infoBlockId: string;
  kind: AcknowledgementKind;
  /** Hash of the exact notice text that was shown or handed out. */
  textHash: Sha256Hex;
}

export interface SealPayload {
  schema: 'fragebogen.siegel/1';
  canon: 1;
  questionnaireId: string;
  form: { id: string; version: string; definitionHash: Sha256Hex };
  role: RoleId;
  version: number;
  supersedes?: Sha256Hex;
  /** Per-field digests (truncated to 128 bit) — lets verification name the changed fields. */
  fieldHashes: Record<FieldId, string>;
  confirmationText: string;
  acknowledgements: Acknowledgement[];
  signature?: { method: 'drawn' | 'typed'; strokesHash?: Sha256Hex; typedName?: string };
  systemNote: SystemNote;
  receivedParts: ReceivedPart[];
  nonce: string;
}

export interface Seal {
  payload: SealPayload;
  /** SHA-256 over JCS(payload); kept outside the payload, so there is no circularity. */
  contentHash: Sha256Hex;
}

export interface Part {
  role: RoleId;
  status: PartStatus;
  data: Record<FieldId, FieldValue>;
  strokes?: Stroke[];
  seal?: Seal;
}

/** Where a receipt time comes from: this app's clock or the DATEV filing date. */
export type ReceiptSource = 'app' | 'datev';

export interface Receipt {
  station: string;
  receivedAtLocal: string;
  receivedAtUtc: string;
  timeZone: string;
  source: ReceiptSource;
  fileName: string;
  fileSha256: Sha256Hex;
  parts: { role: RoleId; contentHash: Sha256Hex }[];
  appVersion: string;
}

export interface MergeRecord {
  sources: { fileSha256: Sha256Hex; questionnaireId: string }[];
  decisions: { kind: string; detail: string }[];
}

export interface Questionnaire {
  format: 'fragebogen';
  formatVersion: 1;
  questionnaireId: string;
  /** Pinned to the form version of the first part. */
  form: { id: string; version: string; definitionHash: Sha256Hex };
  /** Versions per role, oldest first (re-signing appends with `supersedes`). */
  parts: Record<RoleId, Part[]>;
  receipts: Receipt[];
  mergeRecord?: MergeRecord;
  mergeHash?: Sha256Hex;
}
