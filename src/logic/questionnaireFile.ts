// The questionnaire file format (format "fragebogen", version 1) and its strict decoder. Imported
// files are untrusted: every property is checked, nothing is defaulted, and the decoded object is
// canonically identical to the parsed JSON, so verification hashes exactly what was received.
import { Decoder, type DecodeIssue } from './decode';
import { FORM_ID, ID, SEMVER } from './formDefinition';
import { SHA256_HEX } from './hash';
import { isPlainObject, isWellFormed } from './jcs';
import {
  ACKNOWLEDGEMENT_KINDS,
  INPUT_TYPES,
  PART_STATUSES,
  RECEIPT_SOURCES,
  RECEIVED_SOURCES,
  UA_SOURCES,
  type Acknowledgement,
  type FieldValue,
  type FormReference,
  type MergeRecord,
  type Part,
  type Questionnaire,
  type Receipt,
  type ReceivedPart,
  type Seal,
  type SealPayload,
  type SealSignature,
  type SystemNote,
} from './model';
import { FIELD_HASH_PATTERN, NONCE_PATTERN, SEAL_SCHEMA } from './seal';
import { isLocalTime, isUtcTime } from './time';

export const FORMAT = 'fragebogen';
export const FORMAT_VERSION = 1;
/** UUID version 4, lower case. */
export const QUESTIONNAIRE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const MAX_VALUE_DEPTH = 8;

export type QuestionnaireResult =
  { ok: true; questionnaire: Questionnaire } | { ok: false; issues: DecodeIssue[] };

export function decodeQuestionnaire(raw: unknown): QuestionnaireResult {
  const d = new Decoder();
  const questionnaire = decodeRoot(d, raw, '$');
  if (!questionnaire || d.issues.length > 0) return { ok: false, issues: d.issues };
  return { ok: true, questionnaire };
}

function decodeRoot(d: Decoder, raw: unknown, path: string): Questionnaire | undefined {
  const o = d.object(raw, path, [
    'format',
    'formatVersion',
    'questionnaireId',
    'form',
    'parts',
    'receipts',
    'mergeRecord',
    'mergeHash',
  ]);
  if (!o) return undefined;
  const format = d.literal(o.format, `${path}.format`, [FORMAT] as const);
  const formatVersion = d.integer(o.formatVersion, `${path}.formatVersion`, 1);
  if (formatVersion !== undefined && formatVersion !== FORMAT_VERSION) {
    d.report(`${path}.formatVersion`, `unsupported format version ${formatVersion}`);
  }
  const questionnaireId = d.string(o.questionnaireId, `${path}.questionnaireId`, QUESTIONNAIRE_ID);
  const form = decodeFormReference(d, o.form, `${path}.form`);
  const parts = d.record(o.parts, `${path}.parts`, ID, (v, p) =>
    d.array(v, p, (part, partPath) => decodePart(d, part, partPath), 1),
  );
  const receipts = d.array(o.receipts, `${path}.receipts`, (v, p) => decodeReceipt(d, v, p));
  const mergeRecord =
    o.mergeRecord === undefined
      ? undefined
      : decodeMergeRecord(d, o.mergeRecord, `${path}.mergeRecord`);
  const mergeHash =
    o.mergeHash === undefined ? undefined : d.string(o.mergeHash, `${path}.mergeHash`, SHA256_HEX);
  if (
    format === undefined ||
    formatVersion !== FORMAT_VERSION ||
    questionnaireId === undefined ||
    form === undefined ||
    parts === undefined ||
    receipts === undefined
  ) {
    return undefined;
  }
  return {
    format,
    formatVersion,
    questionnaireId,
    form,
    parts,
    receipts,
    ...(mergeRecord === undefined ? {} : { mergeRecord }),
    ...(mergeHash === undefined ? {} : { mergeHash }),
  };
}

function decodeFormReference(d: Decoder, raw: unknown, path: string): FormReference | undefined {
  const o = d.object(raw, path, ['id', 'version', 'definitionHash']);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, FORM_ID);
  const version = d.string(o.version, `${path}.version`, SEMVER);
  const definitionHash = d.string(o.definitionHash, `${path}.definitionHash`, SHA256_HEX);
  if (id === undefined || version === undefined || definitionHash === undefined) return undefined;
  return { id, version, definitionHash };
}

function decodePart(d: Decoder, raw: unknown, path: string): Part | undefined {
  const o = d.object(raw, path, ['role', 'status', 'data', 'signatureStrokes', 'seal']);
  if (!o) return undefined;
  const role = d.string(o.role, `${path}.role`, ID);
  const status = d.literal(o.status, `${path}.status`, PART_STATUSES);
  const data = d.record(o.data, `${path}.data`, ID, (v, p) => decodeFieldValue(d, v, p, 0));
  const signatureStrokes =
    o.signatureStrokes === undefined
      ? undefined
      : d.string(o.signatureStrokes, `${path}.signatureStrokes`);
  const seal = o.seal === undefined ? undefined : decodeSeal(d, o.seal, `${path}.seal`);
  if (role === undefined || status === undefined || data === undefined) return undefined;
  return {
    role,
    status,
    data,
    ...(signatureStrokes === undefined ? {} : { signatureStrokes }),
    ...(seal === undefined ? {} : { seal }),
  };
}

/** Field values never contain numbers: strings, booleans, null, arrays and objects of those. */
function decodeFieldValue(
  d: Decoder,
  raw: unknown,
  path: string,
  depth: number,
): FieldValue | undefined {
  if (raw === null || typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    return isWellFormed(raw) ? raw : d.report(path, 'contains an unpaired surrogate');
  }
  if (depth >= MAX_VALUE_DEPTH) return d.report(path, 'value nested too deeply');
  if (Array.isArray(raw)) {
    return d.array(raw, path, (v, p) => decodeFieldValue(d, v, p, depth + 1));
  }
  if (isPlainObject(raw))
    return d.record(raw, path, ID, (v, p) => decodeFieldValue(d, v, p, depth + 1));
  return d.report(path, 'field values are strings, booleans, null, arrays or objects — no numbers');
}

function decodeSeal(d: Decoder, raw: unknown, path: string): Seal | undefined {
  const o = d.object(raw, path, ['payload', 'contentHash']);
  if (!o) return undefined;
  const payload = decodePayload(d, o.payload, `${path}.payload`);
  const contentHash = d.string(o.contentHash, `${path}.contentHash`, SHA256_HEX);
  if (payload === undefined || contentHash === undefined) return undefined;
  return { payload, contentHash };
}

function decodePayload(d: Decoder, raw: unknown, path: string): SealPayload | undefined {
  const o = d.object(raw, path, [
    'schema',
    'canon',
    'questionnaireId',
    'form',
    'role',
    'version',
    'supersedes',
    'fieldHashes',
    'confirmationText',
    'acknowledgements',
    'signature',
    'systemNote',
    'receivedParts',
    'nonce',
  ]);
  if (!o) return undefined;
  const schema = d.literal(o.schema, `${path}.schema`, [SEAL_SCHEMA] as const);
  const canon = d.integer(o.canon, `${path}.canon`, 1);
  if (canon !== undefined && canon !== 1) d.report(`${path}.canon`, `unsupported canon ${canon}`);
  const questionnaireId = d.string(o.questionnaireId, `${path}.questionnaireId`, QUESTIONNAIRE_ID);
  const form = decodeFormReference(d, o.form, `${path}.form`);
  const role = d.string(o.role, `${path}.role`, ID);
  const version = d.integer(o.version, `${path}.version`, 1);
  const supersedes =
    o.supersedes === undefined
      ? undefined
      : d.string(o.supersedes, `${path}.supersedes`, SHA256_HEX);
  const fieldHashes = d.record(o.fieldHashes, `${path}.fieldHashes`, ID, (v, p) =>
    d.string(v, p, FIELD_HASH_PATTERN),
  );
  const confirmationText = d.string(o.confirmationText, `${path}.confirmationText`);
  const acknowledgements = d.array(o.acknowledgements, `${path}.acknowledgements`, (v, p) =>
    decodeAcknowledgement(d, v, p),
  );
  const signature =
    o.signature === undefined ? undefined : decodeSignature(d, o.signature, `${path}.signature`);
  const systemNote = decodeSystemNote(d, o.systemNote, `${path}.systemNote`);
  const receivedParts = d.array(o.receivedParts, `${path}.receivedParts`, (v, p) =>
    decodeReceivedPart(d, v, p),
  );
  const nonce = d.string(o.nonce, `${path}.nonce`, NONCE_PATTERN);
  if (
    schema === undefined ||
    canon !== 1 ||
    questionnaireId === undefined ||
    form === undefined ||
    role === undefined ||
    version === undefined ||
    fieldHashes === undefined ||
    confirmationText === undefined ||
    acknowledgements === undefined ||
    systemNote === undefined ||
    receivedParts === undefined ||
    nonce === undefined
  ) {
    return undefined;
  }
  return {
    schema,
    canon,
    questionnaireId,
    form,
    role,
    version,
    ...(supersedes === undefined ? {} : { supersedes }),
    fieldHashes,
    confirmationText,
    acknowledgements,
    ...(signature === undefined ? {} : { signature }),
    systemNote,
    receivedParts,
    nonce,
  };
}

function decodeAcknowledgement(
  d: Decoder,
  raw: unknown,
  path: string,
): Acknowledgement | undefined {
  const o = d.object(raw, path, ['infoBlockId', 'kind', 'textHash']);
  if (!o) return undefined;
  const infoBlockId = d.string(o.infoBlockId, `${path}.infoBlockId`, ID);
  const kind = d.literal(o.kind, `${path}.kind`, ACKNOWLEDGEMENT_KINDS);
  const textHash = d.string(o.textHash, `${path}.textHash`, SHA256_HEX);
  if (infoBlockId === undefined || kind === undefined || textHash === undefined) return undefined;
  return { infoBlockId, kind, textHash };
}

function decodeSignature(d: Decoder, raw: unknown, path: string): SealSignature | undefined {
  if (isPlainObject(raw) && raw.method === 'drawn') {
    const o = d.object(raw, path, ['method', 'strokesHash']);
    const strokesHash = o && d.string(o.strokesHash, `${path}.strokesHash`, SHA256_HEX);
    return strokesHash === undefined ? undefined : { method: 'drawn', strokesHash };
  }
  if (isPlainObject(raw) && raw.method === 'typed') {
    const o = d.object(raw, path, ['method', 'typedName']);
    const typedName = o && d.string(o.typedName, `${path}.typedName`);
    return typedName === undefined ? undefined : { method: 'typed', typedName };
  }
  return d.report(path, 'expected a signature with method "drawn" or "typed"');
}

/** Decodes and checks a system note; also used when sealing, to vet what the device reported. */
export function decodeSystemNote(d: Decoder, raw: unknown, path: string): SystemNote | undefined {
  const o = d.object(raw, path, [
    'signedAtLocal',
    'timeZone',
    'signedAtUtc',
    'os',
    'browser',
    'browserVersion',
    'uaSource',
    'language',
    'inputTypes',
    'appVersion',
  ]);
  if (!o) return undefined;
  const signedAtLocal = localTime(d, o.signedAtLocal, `${path}.signedAtLocal`);
  const timeZone = d.string(o.timeZone, `${path}.timeZone`);
  const signedAtUtc = utcTime(d, o.signedAtUtc, `${path}.signedAtUtc`);
  const os = d.string(o.os, `${path}.os`);
  const browser = d.string(o.browser, `${path}.browser`);
  const browserVersion = d.string(o.browserVersion, `${path}.browserVersion`);
  const uaSource = d.literal(o.uaSource, `${path}.uaSource`, UA_SOURCES);
  const language = d.string(o.language, `${path}.language`);
  const inputTypes = d.array(
    o.inputTypes,
    `${path}.inputTypes`,
    (v, p) => d.literal(v, p, INPUT_TYPES),
    1,
  );
  const appVersion = d.string(o.appVersion, `${path}.appVersion`);
  if (
    signedAtLocal === undefined ||
    timeZone === undefined ||
    signedAtUtc === undefined ||
    os === undefined ||
    browser === undefined ||
    browserVersion === undefined ||
    uaSource === undefined ||
    language === undefined ||
    inputTypes === undefined ||
    appVersion === undefined
  ) {
    return undefined;
  }
  return {
    signedAtLocal,
    timeZone,
    signedAtUtc,
    os,
    browser,
    browserVersion,
    uaSource,
    language,
    inputTypes,
    appVersion,
  };
}

export function decodeReceivedPart(
  d: Decoder,
  raw: unknown,
  path: string,
): ReceivedPart | undefined {
  const o = d.object(raw, path, [
    'role',
    'contentHash',
    'receivedAtLocal',
    'receivedAtUtc',
    'source',
    'fileSha256',
  ]);
  if (!o) return undefined;
  const role = d.string(o.role, `${path}.role`, ID);
  const contentHash = d.string(o.contentHash, `${path}.contentHash`, SHA256_HEX);
  const receivedAtLocal = localTime(d, o.receivedAtLocal, `${path}.receivedAtLocal`);
  const receivedAtUtc = utcTime(d, o.receivedAtUtc, `${path}.receivedAtUtc`);
  const source = d.literal(o.source, `${path}.source`, RECEIVED_SOURCES);
  const fileSha256 =
    o.fileSha256 === undefined
      ? undefined
      : d.string(o.fileSha256, `${path}.fileSha256`, SHA256_HEX);
  if (
    role === undefined ||
    contentHash === undefined ||
    receivedAtLocal === undefined ||
    receivedAtUtc === undefined ||
    source === undefined
  ) {
    return undefined;
  }
  return {
    role,
    contentHash,
    receivedAtLocal,
    receivedAtUtc,
    source,
    ...(fileSha256 === undefined ? {} : { fileSha256 }),
  };
}

export function decodeReceipt(d: Decoder, raw: unknown, path: string): Receipt | undefined {
  const o = d.object(raw, path, [
    'station',
    'receivedAtLocal',
    'receivedAtUtc',
    'timeZone',
    'source',
    'fileName',
    'fileSha256',
    'parts',
    'appVersion',
  ]);
  if (!o) return undefined;
  const station = d.string(o.station, `${path}.station`);
  const receivedAtLocal = localTime(d, o.receivedAtLocal, `${path}.receivedAtLocal`);
  const receivedAtUtc = utcTime(d, o.receivedAtUtc, `${path}.receivedAtUtc`);
  const timeZone = d.string(o.timeZone, `${path}.timeZone`);
  const source = d.literal(o.source, `${path}.source`, RECEIPT_SOURCES);
  const fileName = d.string(o.fileName, `${path}.fileName`);
  const fileSha256 = d.string(o.fileSha256, `${path}.fileSha256`, SHA256_HEX);
  const parts = d.array(
    o.parts,
    `${path}.parts`,
    (v, p) => {
      const part = d.object(v, p, ['role', 'contentHash']);
      const role = part && d.string(part.role, `${p}.role`, ID);
      const contentHash = part && d.string(part.contentHash, `${p}.contentHash`, SHA256_HEX);
      return role === undefined || contentHash === undefined ? undefined : { role, contentHash };
    },
    1,
  );
  const appVersion = d.string(o.appVersion, `${path}.appVersion`);
  if (
    station === undefined ||
    receivedAtLocal === undefined ||
    receivedAtUtc === undefined ||
    timeZone === undefined ||
    source === undefined ||
    fileName === undefined ||
    fileSha256 === undefined ||
    parts === undefined ||
    appVersion === undefined
  ) {
    return undefined;
  }
  return {
    station,
    receivedAtLocal,
    receivedAtUtc,
    timeZone,
    source,
    fileName,
    fileSha256,
    parts,
    appVersion,
  };
}

function decodeMergeRecord(d: Decoder, raw: unknown, path: string): MergeRecord | undefined {
  const o = d.object(raw, path, ['sources', 'decisions']);
  if (!o) return undefined;
  const sources = d.array(o.sources, `${path}.sources`, (v, p) => {
    const source = d.object(v, p, ['fileSha256', 'questionnaireId']);
    const fileSha256 = source && d.string(source.fileSha256, `${p}.fileSha256`, SHA256_HEX);
    const questionnaireId =
      source && d.string(source.questionnaireId, `${p}.questionnaireId`, QUESTIONNAIRE_ID);
    return fileSha256 === undefined || questionnaireId === undefined
      ? undefined
      : { fileSha256, questionnaireId };
  });
  const decisions = d.array(o.decisions, `${path}.decisions`, (v, p) => {
    const decision = d.object(v, p, ['kind', 'detail']);
    const kind = decision && d.string(decision.kind, `${p}.kind`);
    const detail = decision && d.string(decision.detail, `${p}.detail`);
    return kind === undefined || detail === undefined ? undefined : { kind, detail };
  });
  if (sources === undefined || decisions === undefined) return undefined;
  return { sources, decisions };
}

function localTime(d: Decoder, raw: unknown, path: string): string | undefined {
  const value = d.string(raw, path);
  if (value === undefined) return undefined;
  return isLocalTime(value)
    ? value
    : d.report(path, 'expected local time like 2026-10-29T10:15:00+01:00');
}

function utcTime(d: Decoder, raw: unknown, path: string): string | undefined {
  const value = d.string(raw, path);
  if (value === undefined) return undefined;
  return isUtcTime(value) ? value : d.report(path, 'expected UTC time like 2026-10-29T09:15:00Z');
}
