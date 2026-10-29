// Verification of a questionnaire in honest grades.
// Level 1 "in sich stimmig": a sealed part is recomputed from its stored payload and data.
// Level 2 "bestätigt": an independent record — another role's seal or a station's receipt — names
// the same contentHash. Hashes reveal changes; they do not prove who sealed, because anyone can
// produce a fresh, self-consistent seal.
import { canonicalize } from './jcs';
import { infoBlocksOfRole, noticeHash, roleOf, sealableData, typedNameIsPlausible } from './form';
import type { FormRegistry } from './formRegistry';
import type {
  FormDefinition,
  Part,
  PartStatus,
  Questionnaire,
  ReceiptSource,
  RoleId,
  Sha256Hex,
} from './model';
import { contentHashOf, diffFieldHashes, isEmptyDiff, strokesHashOf, type FieldDiff } from './seal';
import { linkedQuestionnaireIds, mergeHashOf } from './mergeRecord';
import { decodeStrokes, signatureShapeProblem } from './strokes';
import { days, minutes, sameInstant, utcMillis } from './time';

/** Device clocks differ; a receipt may appear slightly before the signature it receives. */
export const CLOCK_TOLERANCE_MS = minutes(15);
/** A part older than this when it is received may be an old part reused (warning only). */
export const MAX_PART_AGE_AT_RECEIPT_MS = days(90);

export type FindingCode =
  | 'payloadAltered'
  | 'misfiled'
  | 'dataChanged'
  | 'signatureImageChanged'
  | 'statusMismatch'
  | 'chainBroken'
  | 'draftNotLast'
  | 'signatureMissing'
  | 'signatureImplausible'
  | 'unknownDefinition'
  | 'fieldSetMismatch'
  | 'confirmationTextChanged'
  | 'noticeMismatch'
  | 'timeInconsistent'
  | 'timeImplausible'
  | 'staleAtReceipt'
  | 'referencesOtherVersion'
  | 'referencesUnknownPart'
  | 'linkedByDecision'
  | 'mergeAltered';

export type Severity = 'error' | 'warning';

export const FINDING_SEVERITY: Readonly<Record<FindingCode, Severity>> = {
  payloadAltered: 'error',
  misfiled: 'error',
  dataChanged: 'error',
  signatureImageChanged: 'error',
  statusMismatch: 'error',
  chainBroken: 'error',
  draftNotLast: 'error',
  signatureMissing: 'warning',
  signatureImplausible: 'warning',
  unknownDefinition: 'warning',
  fieldSetMismatch: 'warning',
  confirmationTextChanged: 'warning',
  noticeMismatch: 'warning',
  timeInconsistent: 'warning',
  timeImplausible: 'warning',
  staleAtReceipt: 'warning',
  referencesOtherVersion: 'warning',
  referencesUnknownPart: 'warning',
  linkedByDecision: 'warning',
  mergeAltered: 'error',
};

export const FINDING_MESSAGES: Readonly<Record<FindingCode, string>> = {
  payloadAltered:
    'Datensatz verändert: Das Siegel passt nicht mehr zu seinem Inhalt. Ein Feldvergleich ist nicht möglich.',
  misfiled:
    'Falsch einsortiert: Das Siegel gehört zu einem anderen Fragebogen, Formular oder einer anderen Rolle.',
  dataChanged: 'Nach dem Abschluss geändert: Diese Felder passen nicht mehr zum Siegel.',
  signatureImageChanged: 'Das Unterschriftsbild wurde verändert.',
  statusMismatch: 'Der angegebene Status passt nicht zum Siegel.',
  chainBroken: 'Die Fassungen dieser Rolle bilden keine lückenlose Kette.',
  draftNotLast: 'Ein Entwurf steht vor einer abgeschlossenen Fassung.',
  signatureMissing: 'Für diese Rolle ist eine Unterschrift vorgesehen, das Siegel enthält keine.',
  signatureImplausible: 'Die Unterschrift ist unplausibel kurz.',
  unknownDefinition:
    'Diese Formularversion ist der App nicht bekannt. Felder und Hinweise wurden nicht gegen das Formular geprüft.',
  fieldSetMismatch: 'Die gesiegelten Felder entsprechen nicht dem Formular.',
  confirmationTextChanged: 'Der bestätigte Text weicht vom Formular ab.',
  noticeMismatch: 'Die Kenntnisnahmen passen nicht zu den Hinweisen des Formulars.',
  timeInconsistent: 'Ortszeit und UTC-Zeit einer Zeitangabe widersprechen sich.',
  timeImplausible: 'Die Zeitangaben sind nicht plausibel.',
  staleAtReceipt: 'Der Teil war beim Eingang ungewöhnlich alt.',
  referencesOtherVersion: 'Der Verweis gilt einer älteren Fassung.',
  referencesUnknownPart: 'Der Verweis gilt einer Fassung, die nicht vorliegt.',
  linkedByDecision:
    'Zugeordnet durch Entscheidung bei der Zusammenführung – es gibt keine kryptografische Verknüpfung.',
  mergeAltered:
    'Der Zusammenführungsvermerk passt nicht mehr zu seinem Hash: Quellen, Entscheidungen oder Eingangsvermerke wurden verändert.',
};

export type PartLevel = 'draft' | 'invalid' | 'consistent' | 'confirmed';

export const LEVEL_LABELS: Readonly<Record<PartLevel, string>> = {
  draft: 'Entwurf, nicht abgeschlossen',
  invalid: 'Verändert oder fehlerhaft',
  consistent: 'In sich stimmig',
  confirmed: 'Bestätigt',
};

export interface Finding {
  code: FindingCode;
  severity: Severity;
  role?: RoleId;
  version?: number;
  detail: readonly string[];
}

export type Confirmation =
  { kind: 'seal'; role: RoleId } | { kind: 'receipt'; station: string; source: ReceiptSource };

export interface PartVerdict {
  role: RoleId;
  /** Index within the role's versions. */
  position: number;
  status: PartStatus;
  version?: number;
  contentHash?: Sha256Hex;
  /** Latest sealed version of its role. */
  current: boolean;
  level: PartLevel;
  findings: Finding[];
  confirmations: Confirmation[];
  fieldDiff?: FieldDiff;
}

export interface Verdict {
  level: 'ok' | 'warnings' | 'invalid';
  parts: PartVerdict[];
  /** Findings about the questionnaire as a whole (definition, receipts). */
  findings: Finding[];
}

export interface VerifyOptions {
  /** Without a registry, fields and notices are not checked against the form definition. */
  registry?: FormRegistry;
  clockToleranceMs?: number;
  maxPartAgeAtReceiptMs?: number;
}

function finding(
  code: FindingCode,
  detail: readonly string[] = [],
  role?: RoleId,
  version?: number,
): Finding {
  return {
    code,
    severity: FINDING_SEVERITY[code],
    ...(role === undefined ? {} : { role }),
    ...(version === undefined ? {} : { version }),
    detail,
  };
}

const hasErrors = (findings: readonly Finding[]) => findings.some((f) => f.severity === 'error');

export function verifyQuestionnaire(
  questionnaire: Questionnaire,
  options: VerifyOptions = {},
): Verdict {
  const tolerance = options.clockToleranceMs ?? CLOCK_TOLERANCE_MS;
  const maxAge = options.maxPartAgeAtReceiptMs ?? MAX_PART_AGE_AT_RECEIPT_MS;
  const global: Finding[] = [];
  const definition = resolveDefinition(questionnaire, options.registry, global);
  const linked = linkedQuestionnaireIds(questionnaire);
  if (
    (questionnaire.mergeRecord !== undefined || questionnaire.mergeHash !== undefined) &&
    questionnaire.mergeHash !== mergeHashOf(questionnaire)
  ) {
    global.push(finding('mergeAltered'));
  }

  const parts: PartVerdict[] = [];
  const sealedParts = new Map<PartVerdict, Part>();
  for (const [role, versions] of Object.entries(questionnaire.parts)) {
    const verdicts = versions.map((part, position) =>
      checkPart(
        questionnaire,
        role,
        part,
        position,
        position === versions.length - 1,
        definition,
        linked,
      ),
    );
    checkChain(versions, verdicts);
    const current = verdicts.filter((v) => v.contentHash !== undefined).at(-1);
    if (current) current.current = true;
    verdicts.forEach((verdict, i) => {
      const part = versions[i];
      if (part?.seal) sealedParts.set(verdict, part);
    });
    parts.push(...verdicts);
  }

  confirmByOtherSeals(sealedParts, tolerance);
  confirmByReceipts(questionnaire, sealedParts, global, tolerance, maxAge);

  for (const verdict of parts) {
    if (hasErrors(verdict.findings)) verdict.level = 'invalid';
    else if (verdict.status === 'draft' && verdict.contentHash === undefined)
      verdict.level = 'draft';
    else verdict.level = verdict.confirmations.length > 0 ? 'confirmed' : 'consistent';
  }
  const all = [...global, ...parts.flatMap((v) => v.findings)];
  const level = hasErrors(all) ? 'invalid' : all.length > 0 ? 'warnings' : 'ok';
  return { level, parts, findings: global };
}

function resolveDefinition(
  questionnaire: Questionnaire,
  registry: FormRegistry | undefined,
  global: Finding[],
): FormDefinition | undefined {
  if (!registry) return undefined;
  const { form } = questionnaire;
  const registered = registry.byHash(form.definitionHash);
  if (!registered) {
    global.push(finding('unknownDefinition', [`${form.id} ${form.version}`]));
    return undefined;
  }
  const { id, version } = registered.definition;
  if (id !== form.id || version !== form.version) {
    global.push(
      finding('misfiled', [
        `Formular ${form.id} ${form.version} trägt den Hash von ${id} ${version}`,
      ]),
    );
  }
  return registered.definition;
}

function checkPart(
  questionnaire: Questionnaire,
  role: RoleId,
  part: Part,
  position: number,
  isLast: boolean,
  definition: FormDefinition | undefined,
  linked: ReadonlySet<string>,
): PartVerdict {
  const verdict: PartVerdict = {
    role,
    position,
    status: part.status,
    current: false,
    level: 'consistent',
    findings: [],
    confirmations: [],
  };
  const version = part.seal?.payload.version;
  const add = (code: FindingCode, detail: readonly string[] = []) => {
    verdict.findings.push(finding(code, detail, role, version));
  };
  if (part.role !== role) add('misfiled', [`Teil trägt Rolle ${part.role}`]);

  if (!part.seal) {
    if (part.status !== 'draft') add('statusMismatch', [`${part.status} ohne Siegel`]);
    if (!isLast) add('draftNotLast');
    return verdict;
  }

  const { payload, contentHash } = part.seal;
  verdict.version = payload.version;
  verdict.contentHash = contentHash;
  if (contentHashOf(payload) !== contentHash) {
    add('payloadAltered');
    return verdict;
  }

  if (payload.questionnaireId !== questionnaire.questionnaireId) {
    if (linked.has(payload.questionnaireId)) add('linkedByDecision', [payload.questionnaireId]);
    else add('misfiled', ['Fragebogen-ID']);
  }
  if (canonicalize(payload.form) !== canonicalize(questionnaire.form))
    add('misfiled', ['Formular']);
  if (payload.role !== role) add('misfiled', [`Siegel nennt Rolle ${payload.role}`]);

  const expectedStatus = payload.signature ? 'signed' : 'sealed';
  if (part.status !== expectedStatus)
    add('statusMismatch', [`${part.status}, gesiegelt als ${expectedStatus}`]);

  const diff = diffFieldHashes(payload, part.data);
  if (!isEmptyDiff(diff)) {
    verdict.fieldDiff = diff;
    add('dataChanged', describeDiff(diff));
  }

  const signature = payload.signature;
  if (signature?.method === 'drawn') {
    const strokes = part.signatureStrokes;
    if (strokes === undefined) add('signatureImageChanged', ['Striche fehlen']);
    else if (strokesHashOf(strokes) !== signature.strokesHash) add('signatureImageChanged');
    else {
      const decoded = decodeStrokes(strokes);
      if (!decoded.ok) add('signatureImageChanged', ['Striche nicht lesbar']);
      else if (signatureShapeProblem(decoded.strokes)) add('signatureImplausible', ['gezeichnet']);
    }
  } else if (part.signatureStrokes !== undefined) {
    add('signatureImageChanged', ['Striche ohne gezeichnete Unterschrift']);
  }
  if (signature?.method === 'typed' && !typedNameIsPlausible(signature.typedName)) {
    add('signatureImplausible', ['getippt']);
  }

  const note = payload.systemNote;
  if (!sameInstant(note.signedAtLocal, note.signedAtUtc)) add('timeInconsistent', ['Unterschrift']);

  // Against the wrong container the definition checks would only produce follow-up noise.
  const misfiled = verdict.findings.some((f) => f.code === 'misfiled');
  if (definition && !misfiled)
    checkAgainstDefinition(definition, role, part, isEmptyDiff(diff), add);
  return verdict;
}

function checkAgainstDefinition(
  definition: FormDefinition,
  role: RoleId,
  part: Part,
  dataIntact: boolean,
  add: (code: FindingCode, detail?: readonly string[]) => void,
): void {
  const payload = part.seal?.payload;
  const roleDefinition = roleOf(definition, role);
  if (!payload) return;
  if (!roleDefinition) {
    add('misfiled', [`Rolle ${role} gehört nicht zum Formular`]);
    return;
  }
  if (dataIntact) {
    const expected = Object.keys(sealableData(definition, role, part.data)).sort();
    const sealed = Object.keys(payload.fieldHashes).sort();
    if (canonicalize(expected) !== canonicalize(sealed)) {
      add('fieldSetMismatch', [
        ...expected.filter((id) => !sealed.includes(id)).map((id) => `nicht gesiegelt: ${id}`),
        ...sealed.filter((id) => !expected.includes(id)).map((id) => `nicht vorgesehen: ${id}`),
      ]);
    }
  }
  if (payload.confirmationText !== roleDefinition.confirmationText) add('confirmationTextChanged');
  const expectedNotices = infoBlocksOfRole(definition, role)
    .map((block) => ({
      infoBlockId: block.id,
      kind: block.acknowledgement,
      textHash: noticeHash(block),
    }))
    .sort((a, b) => (a.infoBlockId < b.infoBlockId ? -1 : 1));
  const sealedNotices = [...payload.acknowledgements].sort((a, b) =>
    a.infoBlockId < b.infoBlockId ? -1 : 1,
  );
  if (canonicalize(expectedNotices) !== canonicalize(sealedNotices)) {
    add(
      'noticeMismatch',
      expectedNotices.map((notice) => notice.infoBlockId),
    );
  }
  if (roleDefinition.signature === 'required' && !payload.signature) add('signatureMissing');
}

function describeDiff(diff: FieldDiff): string[] {
  return [
    ...diff.changed.map((id) => `geändert: ${id}`),
    ...diff.missing.map((id) => `fehlt: ${id}`),
    ...diff.extra.map((id) => `hinzugefügt: ${id}`),
  ];
}

/** Versions of a role: numbered 1…n in order, each superseding the one before. */
function checkChain(versions: readonly Part[], verdicts: readonly PartVerdict[]): void {
  let previous: Part | undefined;
  let expectedVersion = 1;
  versions.forEach((part, i) => {
    const verdict = verdicts[i];
    if (!part.seal || !verdict) return;
    const { payload } = part.seal;
    const problems: string[] = [];
    if (payload.version !== expectedVersion) {
      problems.push(`Fassung ${payload.version} an Stelle ${expectedVersion}`);
    }
    const expectedSupersedes = previous?.seal?.contentHash;
    if (payload.supersedes !== expectedSupersedes) {
      problems.push(
        expectedSupersedes
          ? 'Verweis auf die Vorfassung stimmt nicht'
          : 'Verweis auf eine fehlende Vorfassung',
      );
    }
    if (problems.length > 0) {
      verdict.findings.push(finding('chainBroken', problems, verdict.role, payload.version));
    }
    previous = part;
    expectedVersion += 1;
  });
}

function signedAt(part: Part): number | undefined {
  const utc = part.seal?.payload.systemNote.signedAtUtc;
  return utc === undefined ? undefined : utcMillis(utc);
}

function findSealed(
  sealedParts: ReadonlyMap<PartVerdict, Part>,
  role: RoleId,
  contentHash: Sha256Hex,
): PartVerdict | undefined {
  for (const verdict of sealedParts.keys()) {
    if (verdict.role === role && verdict.contentHash === contentHash) return verdict;
  }
  return undefined;
}

/** Level 2 by the hash chain: a valid seal of another role lists the part it had received. */
function confirmByOtherSeals(sealedParts: ReadonlyMap<PartVerdict, Part>, tolerance: number): void {
  for (const [receiver, part] of sealedParts) {
    if (hasErrors(receiver.findings) || !part.seal) continue;
    const ownSignedAt = signedAt(part);
    for (const received of part.seal.payload.receivedParts) {
      const label = `${received.role} ${received.contentHash.slice(0, 12)}`;
      const add = (code: FindingCode, detail: readonly string[]) => {
        receiver.findings.push(finding(code, detail, receiver.role, receiver.version));
      };
      if (!sameInstant(received.receivedAtLocal, received.receivedAtUtc)) {
        add('timeInconsistent', [`Eingang ${label}`]);
      }
      const receivedAt = utcMillis(received.receivedAtUtc);
      if (
        receivedAt !== undefined &&
        ownSignedAt !== undefined &&
        receivedAt > ownSignedAt + tolerance
      ) {
        add('timeImplausible', [`Eingang ${label} nach der eigenen Unterschrift`]);
      }
      const target = findSealed(sealedParts, received.role, received.contentHash);
      if (!target) {
        add('referencesUnknownPart', [label]);
        continue;
      }
      if (!hasErrors(target.findings))
        target.confirmations.push({ kind: 'seal', role: receiver.role });
      if (!target.current)
        add('referencesOtherVersion', [`${received.role} Fassung ${target.version ?? '?'}`]);
      const targetPart = sealedParts.get(target);
      const targetSignedAt = targetPart && signedAt(targetPart);
      if (
        targetSignedAt !== undefined &&
        receivedAt !== undefined &&
        targetSignedAt > receivedAt + tolerance
      ) {
        add('timeImplausible', [`Eingang ${label} vor dessen Unterschrift`]);
      }
    }
  }
}

/** Level 2 by receipts: a station (e.g. the Kanzlei or the DATEV filing) recorded the hash. */
function confirmByReceipts(
  questionnaire: Questionnaire,
  sealedParts: ReadonlyMap<PartVerdict, Part>,
  global: Finding[],
  tolerance: number,
  maxAge: number,
): void {
  for (const receipt of questionnaire.receipts) {
    const station = `${receipt.station} (${receipt.source})`;
    if (!sameInstant(receipt.receivedAtLocal, receipt.receivedAtUtc)) {
      global.push(finding('timeInconsistent', [`Eingangsvermerk ${station}`]));
    }
    const receivedAt = utcMillis(receipt.receivedAtUtc);
    for (const ref of receipt.parts) {
      const label = `${station}: ${ref.role} ${ref.contentHash.slice(0, 12)}`;
      const target = findSealed(sealedParts, ref.role, ref.contentHash);
      if (!target) {
        global.push(finding('referencesUnknownPart', [label]));
        continue;
      }
      if (!hasErrors(target.findings)) {
        target.confirmations.push({
          kind: 'receipt',
          station: receipt.station,
          source: receipt.source,
        });
      }
      if (!target.current) {
        global.push(
          finding('referencesOtherVersion', [`${label}, Fassung ${target.version ?? '?'}`]),
        );
      }
      const targetPart = sealedParts.get(target);
      const targetSignedAt = targetPart && signedAt(targetPart);
      if (targetSignedAt === undefined || receivedAt === undefined) continue;
      if (targetSignedAt > receivedAt + tolerance) {
        global.push(finding('timeImplausible', [`${label}: Eingang vor der Unterschrift`]));
      } else if (receivedAt - targetSignedAt > maxAge) {
        const age = Math.floor((receivedAt - targetSignedAt) / days(1));
        global.push(finding('staleAtReceipt', [`${label}: ${age} Tage`]));
      }
    }
  }
}

export function allFindings(verdict: Verdict): Finding[] {
  return [...verdict.findings, ...verdict.parts.flatMap((part) => part.findings)];
}
