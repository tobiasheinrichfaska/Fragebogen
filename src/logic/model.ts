// Data model. Behaviour lives next to it in src/logic (canon, registry; seal/verify and merge follow
// in steps 3–4). Keep docs/data-model.html in sync whenever these types change.
// Enumerations are const arrays so that the decoder and the types share one source.

/** Calendar date `YYYY-MM-DD`. Never parsed through `Date` (UTC off-by-one). */
export type IsoDate = string;
/** Lower-case hex SHA-256 digest. */
export type Sha256Hex = string;
export type RoleId = string;
export type FieldId = string;

// ---------------------------------------------------------------------------
// Form definition (bundled, frozen once published, keyed by definitionHash)
// ---------------------------------------------------------------------------

export const SIGNATURE_REQUIREMENTS = ['required', 'optional', 'none'] as const;
export type SignatureRequirement = (typeof SIGNATURE_REQUIREMENTS)[number];

/** Whether the form's legal form requirement allows the in-app simple e-signature. */
export const SIGNATURE_POLICIES = ['electronic', 'paperRecommended', 'paperRequired'] as const;
export type SignaturePolicy = (typeof SIGNATURE_POLICIES)[number];

/** A role becomes mandatory only when its condition holds (e.g. legal guardian of a minor). */
/**
 * When a conditional role is required — always decided on the latest sealed part of another role:
 * - `minorOnSigning`: that person is under 18 on the local date of their signature (guardian);
 * - `answer`: that role's answers meet the condition (e.g. the spouse when the Kanzlei states a
 *   joint assessment). All fields of the condition belong to one other role.
 */
export type RoleCondition =
  { kind: 'minorOnSigning'; birthDateField: FieldId } | { kind: 'answer'; when: Condition };

export interface RoleDefinition {
  id: RoleId;
  label: string;
  /** PDF heading of this station, e.g. "Fassung Arbeitnehmer". */
  stationHeading: string;
  confirmationText: string;
  /** Conditional roles (`requiredIf`) must have `required`. */
  signature: SignatureRequirement;
  requiredIf?: RoleCondition;
  /** Why the role is needed only under `requiredIf` (the flow plan shows it). */
  because?: string;
  /**
   * Required text field of this role holding the signer's name. Without it, a conditional role
   * (legal guardian) can only sign with a typed name — the name is mandatory either way.
   */
  signerNameField?: FieldId;
}

export const FIELD_TYPES = [
  'text',
  'date',
  'choice',
  'multiChoice',
  'boolean',
  'iban',
  'taxId',
  'svNumber',
  'betriebsnummer',
  'money',
  'repeatGroup',
  'file',
  'number',
  'month',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface QuickAnswer {
  label: string;
  value: string | null;
}

export const TEXT_FORMATS = ['postleitzahlDe'] as const;
export type TextFormat = (typeof TEXT_FORMATS)[number];

export interface ChoiceOption {
  id: string;
  label: string;
}

/**
 * Condition over fields of the same role (see conditions.ts). Leaves: `equals` (yes/no or choice),
 * `in` (choice is one of), `contains` (multiple choice includes), `answered` (has a value / is
 * empty). A hidden field counts as unanswered.
 */
export type Condition =
  | { field: FieldId; equals: string | boolean }
  | { field: FieldId; in: string[] }
  | { field: FieldId; contains: string }
  | { field: FieldId; answered: boolean }
  | { field: FieldId; startsWith: string }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

export interface FieldDefinition {
  id: FieldId;
  /** Owner of the field — ownership is per field, sections are shared between roles. */
  role: RoleId;
  type: FieldType;
  label: string;
  /** Wording in the interview, e.g. "Wie lautet Ihr Familienname?"; the label otherwise. */
  question?: string;
  /** Short help shown with the question, e.g. where to find a number. */
  help?: string;
  /**
   * Explainer video: path below the configured video address of the Kanzlei homepage (e.g.
   * `sofortmeldung/versicherungsnummer`). Frozen with the form; the host stays configuration.
   */
  explainer?: string;
  /** Always required while available. Mutually exclusive with `requiredIf`. */
  required: boolean;
  /** Required only while this condition holds (and the field is available). */
  requiredIf?: Condition;
  /** Why the field is collected; feeds the Art. 13 GDPR notice. */
  purpose: string;
  /** Answer is voluntary (e.g. severe disability during the first six months). */
  voluntary?: boolean;
  /** `text` only: keep line breaks (e.g. remarks); otherwise all whitespace collapses. */
  multiline?: boolean;
  options?: ChoiceOption[];
  /** The field is available for input only while this condition holds; otherwise it is hidden. */
  showIf?: Condition;
  /**
   * Why `showIf`, `requiredIf` or `fromRole` apply — the flow plan explains every dependency with
   * it. Only on fields that have one of them.
   */
  because?: string;
  /**
   * The answer is decided by another role (e.g. the kind of wage tax by the employer): while that
   * role's sealed part holds a value, it is copied into this field and the field is fixed (not
   * asked); without it, the field is asked like any other. Same type; a choice must offer every
   * option of the other field.
   */
  fromRole?: { role: RoleId; field: FieldId };
  /** Columns of a repeat group (table); v1: same role as the table, no conditions. */
  columns?: FieldDefinition[];
  /** Tables only: what one row is called on screen, e.g. "Kind" → "Kind 1", "Kind 2". */
  rowLabel?: string;
  /**
   * How the answer is taken over from another questionnaire (prefill.ts). Default: as it is, when
   * the other form has the same field id and type. `false`: not at all (e.g. the hours of last
   * month's payroll report). `nextMonth` (`month` fields only): one month later.
   */
  carryOver?: false | 'nextMonth';
  /**
   * Tables only: when taken over from another questionnaire, only rows meeting this condition
   * (leaves name columns of this table), e.g. absences that continue past the month's end.
   */
  carryRowsIf?: Condition;
  /**
   * Buttons that answer and move on at once, e.g. "Deutschland", "Kenne ich nicht". `value` is the
   * typed answer (normalised like any input); null leaves an optional field empty.
   */
  quickAnswers?: QuickAnswer[];
  /** `text` only: a named format the answer must have, e.g. a German postcode. */
  textFormat?: TextFormat;
  /** `number` only: unit shown after the value, e.g. "Std.", "km", "kWh". */
  unit?: string;
  /** `number` only: decimal places, 0 (default), 1 or 2; stored with exactly that many. */
  decimals?: number;
  /** `number` only: negative values allowed (e.g. a working-time account). */
  signed?: boolean;
  /** Derived value: name of a pure function in the logic layer, never code in data. */
  computed?: { fn: string; args: FieldId[] };
  /**
   * Preselected answer of a yes/no field (boolean) or a choice field (option id), set when the
   * role's first version is opened; it can be changed like any other answer. Not on conditional
   * fields.
   */
  initial?: boolean | string;
  /**
   * Key of a master datum (e.g. `betriebsnummer`) that a station may remember on its own device and
   * reuse in every form with the same key. Only for the station's own data, never the person's.
   */
  masterData?: string;
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
export const ACKNOWLEDGEMENT_KINDS = ['read', 'paperHandout'] as const;
export type AcknowledgementKind = (typeof ACKNOWLEDGEMENT_KINDS)[number];

export interface InfoBlock {
  id: string;
  /** Role that must acknowledge the notice. */
  role: RoleId;
  title: string;
  text: string;
  /** "Stand" of the text. */
  asOf: IsoDate;
  acknowledgement: AcknowledgementKind;
  /** Explainer video path, as for fields. */
  explainer?: string;
}

export interface ConsistencyRule {
  kind: 'equal';
  fields: [FieldId, FieldId];
  message: string;
}

/**
 * A check hint (Prüfhinweis) for the recipient: answers — of any roles — that call for a closer
 * look, e.g. "registered unemployed" plus "short-term job". Informational only: never blocks and is
 * never sealed, so it may combine roles. It holds when `when` holds and the named `test` (a pure
 * function in hints.ts, e.g. Regelaltersgrenze from the birth date) is met; it is evaluated only
 * once every role it names has a part.
 */
export interface CheckHint {
  id: string;
  when?: Condition;
  test?: { fn: string; args: FieldId[] };
  message: string;
  /** Legal source shown with the hint, e.g. "§ 8 Abs. 1 Nr. 2 SGB IV". */
  source?: string;
}

/** Fields that identify the same person across roles when no shared questionnaire id exists. */
export interface MatchKey {
  label: string;
  fields: Record<RoleId, FieldId>;
}

/** Period a form version applies to, judged by one reference date of the questionnaire. */
export interface FormValidity {
  /** Required, always available date or month field, e.g. the first working day. */
  field: FieldId;
  from: IsoDate;
  /** Open-ended without. */
  until?: IsoDate;
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
  /**
   * Pairs of roles whose parts must reference each other: whoever seals later confirms the
   * current version of the other part (`receivedParts`). Without that link the questionnaire is
   * not complete; passing it on to the next station stays possible.
   */
  partLinks?: [RoleId, RoleId][];
  checkHints?: CheckHint[];
  /**
   * Why the signature in the app suffices for this form, with sources — shown on the signature
   * screen ("Warum genügt das?").
   */
  signatureBasis?: string;
  /**
   * The period this version applies to (Tobias 2026-10-30): an entry in October 2026 needs a version
   * valid on that day. Mandatory in drafts (test); the frozen 0.1.0 test version has none.
   */
  validity?: FormValidity;
  /** What this questionnaire does not cover — shown to every station, in the PDF and the docs. */
  limits?: string[];
  /**
   * Special cases the form is not made for (Tobias 2026-10-30): pre-questions such as "home
   * work?" lead here. While one holds (answers of any role, a draft included), signing and passing
   * on are refused — the form does not know which answers such a case needs.
   */
  exclusions?: CheckHint[];
}

// ---------------------------------------------------------------------------
// Questionnaire instance (travels inside the PDF's data pages)
// ---------------------------------------------------------------------------

/** Only strings, booleans, null and nested arrays/objects — never JSON numbers. */
export type FieldValue = string | boolean | null | FieldValue[] | { [key: string]: FieldValue };

/** `sealed` = completed without signature (still hashed and chained). */
export const PART_STATUSES = ['draft', 'sealed', 'signed'] as const;
export type PartStatus = (typeof PART_STATUSES)[number];

export const INPUT_TYPES = ['pen', 'touch', 'mouse', 'keyboard'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

/** Source of browser and OS in the system note: UA Client Hints or the User-Agent string. */
export const UA_SOURCES = ['ua-ch', 'ua-string'] as const;
export const RECEIVED_SOURCES = ['file', 'same-device'] as const;

export interface SystemNote {
  /** ISO 8601 with UTC offset, from the signer's device. */
  signedAtLocal: string;
  /** IANA time zone, e.g. Europe/Berlin. */
  timeZone: string;
  signedAtUtc: string;
  os: string;
  browser: string;
  browserVersion: string;
  uaSource: (typeof UA_SOURCES)[number];
  language: string;
  inputTypes: InputType[];
  appVersion: string;
}

export interface ReceivedPart {
  role: RoleId;
  contentHash: Sha256Hex;
  receivedAtLocal: string;
  receivedAtUtc: string;
  source: (typeof RECEIVED_SOURCES)[number];
  fileSha256?: Sha256Hex;
}

export interface Acknowledgement {
  infoBlockId: string;
  kind: AcknowledgementKind;
  /** Hash of the exact notice text that was shown or handed out. */
  textHash: Sha256Hex;
}

/** Drawn: hash of the encoded strokes (`Part.signatureStrokes`). Typed: the name as typed. */
export type SealSignature =
  { method: 'drawn'; strokesHash: Sha256Hex } | { method: 'typed'; typedName: string };

export interface FormReference {
  id: string;
  version: string;
  definitionHash: Sha256Hex;
}

export interface SealPayload {
  schema: 'fragebogen.siegel/1';
  canon: 1;
  questionnaireId: string;
  form: FormReference;
  role: RoleId;
  /** 1 for the first seal of a role, +1 per re-seal. */
  version: number;
  /** contentHash of the previous version of the same role. */
  supersedes?: Sha256Hex;
  /**
   * Per visible field of the role: SHA-256(JCS({f, n: nonce, v})) truncated to 64 bit. Names the
   * changed fields; integrity itself rests on the 256-bit contentHash. The nonce makes low-entropy
   * values (tax id, birth date) unguessable from the digest.
   */
  fieldHashes: Record<FieldId, string>;
  confirmationText: string;
  acknowledgements: Acknowledgement[];
  signature?: SealSignature;
  systemNote: SystemNote;
  receivedParts: ReceivedPart[];
  /** 128-bit random, lower-case hex. */
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
  /** Drawn signature, encoded by strokes.ts (shape only, no timing or pressure). */
  signatureStrokes?: string;
  seal?: Seal;
  /**
   * Drafts only: questions put back with "Weiß ich gerade nicht", in form order. Never sealed; a
   * required one still has to be answered before signing.
   */
  deferred?: FieldId[];
}

/** Where a receipt time comes from: this app's clock or the DATEV filing date. */
export const RECEIPT_SOURCES = ['app', 'datev'] as const;
export type ReceiptSource = (typeof RECEIPT_SOURCES)[number];

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

/**
 * Human decisions of a merge — the app never takes them itself:
 * - `link`: questionnaires without a shared id belong together (proposed via matchKeys).
 * - `chooseVersion`: of competing versions of a role, this one is kept; the others are dropped.
 */
export type MergeDecision =
  | { kind: 'link'; questionnaireIds: string[] }
  | { kind: 'chooseVersion'; questionnaireId: string; role: RoleId; contentHash: Sha256Hex };

export interface MergeRecord {
  /** The original files (a merged file contributes its own sources, not itself). */
  sources: { fileSha256: Sha256Hex; questionnaireId: string }[];
  decisions: MergeDecision[];
}

export interface Questionnaire {
  format: 'fragebogen';
  formatVersion: 1;
  questionnaireId: string;
  /** Pinned to the form version of the first part. */
  form: FormReference;
  /** Versions per role, oldest first (re-signing appends with `supersedes`). */
  parts: Record<RoleId, Part[]>;
  receipts: Receipt[];
  mergeRecord?: MergeRecord;
  mergeHash?: Sha256Hex;
}
