// Merging questionnaires at the Kanzlei (rules decided with the user, 2026-10-29):
// - Every source is verified first; altered versions and open drafts are left out, with a note. A
//   source whose merge record was altered contributes nothing.
// - Identical versions (same contentHash) from several files are collapsed, with a note.
// - Different versions of a role are accepted only as a supersedes chain — the person re-signed at
//   the employer. The newer version wins, with a note naming the changed fields.
// - Anything else (competing versions, a missing predecessor, different form versions) is a
//   conflict. The app never picks: a human decides (`chooseVersion`), and the decision goes into
//   the merge record.
// - Questionnaires without a shared id are joined only by a human `link` decision; the app proposes
//   candidates via the form's matchKeys.
// The result is again a questionnaire, so merging is associative: merging a merged file with
// further files equals merging all original files at once.
import { comparable, contradictions, type Contradiction } from './consistency';
import type { FormRegistry } from './formRegistry';
import { checkHints, type HintResult } from './hints';
import { canonicalize } from './jcs';
import { linkedQuestionnaireIds, mergeHashOf } from './mergeRecord';
import type {
  FieldId,
  FieldValue,
  FormDefinition,
  MergeDecision,
  Part,
  PartStatus,
  Questionnaire,
  RoleId,
  Sha256Hex,
} from './model';
import { latestSealed } from './questionnaire';
import { FORMAT, FORMAT_VERSION } from './questionnaireFile';
import { completenessGaps, type Blocker } from './requirements';
import { formatLocalDateTime } from './time';
import { verifyQuestionnaire, type Verdict } from './verify';

export interface MergeSource {
  questionnaire: Questionnaire;
  /** SHA-256 of the imported file. */
  fileSha256: Sha256Hex;
}

export interface MergeOptions {
  registry: FormRegistry;
  decisions?: readonly MergeDecision[];
}

export type MergeNoteCode =
  | 'invalidExcluded'
  | 'draftIgnored'
  | 'duplicateCollapsed'
  | 'newerVersionWins'
  | 'versionChosen'
  | 'linked';

export const MERGE_NOTE_MESSAGES: Readonly<Record<MergeNoteCode, string>> = {
  invalidExcluded: 'Eine veränderte oder fehlerhafte Fassung wurde nicht übernommen.',
  draftIgnored: 'Ein nicht abgeschlossener Entwurf wurde nicht übernommen.',
  duplicateCollapsed: 'Dieselbe Fassung ist mehrfach eingegangen und wurde einmal übernommen.',
  newerVersionWins: 'Eine neuere Fassung wurde unterschrieben; sie ersetzt die ältere.',
  versionChosen: 'Von mehreren Fassungen gilt die ausgewählte; die anderen wurden verworfen.',
  linked: 'Fragebögen ohne gemeinsame ID wurden auf Entscheidung zusammengeführt.',
};

export type MergeConflictCode =
  'formMismatch' | 'versionConflict' | 'chainIncomplete' | 'choiceInvalid';

export const MERGE_CONFLICT_MESSAGES: Readonly<Record<MergeConflictCode, string>> = {
  formMismatch: 'Unter derselben Fragebogen-ID liegen verschiedene Formularversionen vor.',
  versionConflict:
    'Für dieselbe Rolle liegen verschiedene Fassungen vor, die nicht aufeinander aufbauen. Bitte eine Fassung auswählen.',
  chainIncomplete: 'Eine Fassung baut auf einer Vorfassung auf, die nicht vorliegt.',
  choiceInvalid: 'Die ausgewählte Fassung gibt es in dieser Gruppe nicht.',
};

export interface VersionCandidate {
  contentHash: Sha256Hex;
  version: number;
  status: PartStatus;
  signedAtLocal: string;
  /** Files the version came from. */
  sources: Sha256Hex[];
}

/** A field whose value differs between conflicting versions; one value per candidate. */
export interface FieldComparison {
  fieldId: FieldId;
  values: FieldValue[];
}

export interface MergeNote {
  code: MergeNoteCode;
  role?: RoleId;
  detail: readonly string[];
}

export interface MergeConflict {
  code: MergeConflictCode;
  role?: RoleId;
  detail: readonly string[];
  candidates: VersionCandidate[];
  comparison: FieldComparison[];
}

export interface MergeGroup {
  /** Id of the merged questionnaire: the smallest id of the joined questionnaires. */
  questionnaireId: string;
  /** All questionnaire ids joined into this group. */
  sourceIds: string[];
  /** Absent while conflicts remain. */
  questionnaire?: Questionnaire;
  notes: MergeNote[];
  conflicts: MergeConflict[];
  contradictions: Contradiction[];
  /** Check hints of the form for the recipient (informational, see hints.ts). */
  hints: HintResult[];
  gaps: Blocker[];
}

export interface LinkProposal {
  questionnaireIds: [string, string];
  /** Labels of the matchKeys that agree. */
  matchKeys: string[];
}

export interface MergeResult {
  groups: MergeGroup[];
  proposals: LinkProposal[];
}

interface Checked {
  source: MergeSource;
  verdict: Verdict;
  /** False when the source's merge record was altered — then it contributes nothing. */
  trusted: boolean;
}

interface Entry {
  part: Part;
  sources: Set<Sha256Hex>;
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function uniqueSorted<T>(items: readonly T[]): T[] {
  const byKey = new Map(items.map((item) => [canonicalize(item), item]));
  return [...byKey.entries()].sort(([a], [b]) => byText(a, b)).map(([, item]) => item);
}

/** Union-find over questionnaire ids; the root of a set is always its smallest id. */
class IdSets {
  private readonly parent = new Map<string, string>();

  find(id: string): string {
    let root = id;
    for (
      let next = this.parent.get(root);
      next !== undefined && next !== root;
      next = this.parent.get(root)
    ) {
      root = next;
    }
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const [rootA, rootB] = [this.find(a), this.find(b)];
    if (rootA === rootB) return;
    const [keep, drop] = rootA < rootB ? [rootA, rootB] : [rootB, rootA];
    this.parent.set(drop, keep);
  }
}

export function mergeSources(sources: readonly MergeSource[], options: MergeOptions): MergeResult {
  const { registry } = options;
  const checked: Checked[] = sources.map((source) => {
    const verdict = verifyQuestionnaire(source.questionnaire, { registry });
    return { source, verdict, trusted: !verdict.findings.some((f) => f.code === 'mergeAltered') };
  });
  const decisions = uniqueSorted([
    ...(options.decisions ?? []),
    ...checked.flatMap((c) =>
      c.trusted ? (c.source.questionnaire.mergeRecord?.decisions ?? []) : [],
    ),
  ]);

  const ids = new IdSets();
  for (const { source, trusted } of checked) {
    const own = source.questionnaire.questionnaireId;
    ids.find(own);
    if (trusted) linkedQuestionnaireIds(source.questionnaire).forEach((id) => ids.union(own, id));
  }
  for (const decision of decisions) {
    if (decision.kind !== 'link') continue;
    const [first, ...rest] = decision.questionnaireIds;
    if (first !== undefined) rest.forEach((id) => ids.union(first, id));
  }

  const members = new Map<string, Checked[]>();
  for (const item of checked) {
    const group = ids.find(item.source.questionnaire.questionnaireId);
    members.set(group, [...(members.get(group) ?? []), item]);
  }
  const groups = [...members.entries()]
    .sort(([a], [b]) => byText(a, b))
    .map(([groupId, items]) => mergeGroup(groupId, items, decisions, ids, registry));
  return { groups, proposals: proposeLinks(groups, registry) };
}

function mergeGroup(
  groupId: string,
  items: readonly Checked[],
  decisions: readonly MergeDecision[],
  ids: IdSets,
  registry: FormRegistry,
): MergeGroup {
  const inGroup = (id: string) => ids.find(id) === groupId;
  const groupDecisions = decisions.filter((d) =>
    d.kind === 'link' ? d.questionnaireIds.some(inGroup) : inGroup(d.questionnaireId),
  );
  const notes: MergeNote[] = [];
  const conflicts: MergeConflict[] = [];
  const containerIds = uniqueSorted(items.map((item) => item.source.questionnaire.questionnaireId));
  const group: MergeGroup = {
    questionnaireId: groupId,
    sourceIds: uniqueSorted([
      ...containerIds,
      ...items.flatMap((item) => [...linkedQuestionnaireIds(item.source.questionnaire)]),
    ]),
    notes,
    conflicts,
    contradictions: [],
    hints: [],
    gaps: [],
  };

  const forms = uniqueSorted(items.map((item) => item.source.questionnaire.form));
  const [form] = forms;
  if (!form || forms.length > 1) {
    conflicts.push({
      code: 'formMismatch',
      detail: forms.map((f) => `${f.id} ${f.version}`),
      candidates: [],
      comparison: [],
    });
    return group;
  }
  const registered = registry.byHash(form.definitionHash);
  const definition = registered?.definition;
  const label = (role: RoleId) => definition?.roles.find((r) => r.id === role)?.label ?? role;
  if (containerIds.length > 1) notes.push({ code: 'linked', detail: containerIds });

  const versions = collectVersions(items, notes, label);
  const parts: Record<RoleId, Part[]> = {};
  for (const role of roleOrder(definition, [...versions.keys()])) {
    const entries = versions.get(role) ?? new Map<Sha256Hex, Entry>();
    const choice = groupDecisions.find(
      (d): d is Extract<MergeDecision, { kind: 'chooseVersion' }> =>
        d.kind === 'chooseVersion' && d.role === role,
    );
    const resolved = resolveChain(entries, choice?.contentHash);
    if ('conflict' in resolved) {
      conflicts.push({
        code: resolved.conflict,
        role,
        detail: [label(role)],
        candidates: resolved.candidates.map(candidateOf),
        comparison: compareFields(resolved.candidates),
      });
      continue;
    }
    describeChain(resolved, role, label, definition, notes);
    parts[role] = resolved.chain.map((entry) => entry.part);
  }
  if (conflicts.length > 0) return group;

  const trusted = items.filter((item) => item.trusted);
  const receipts = uniqueSorted(trusted.flatMap((item) => item.source.questionnaire.receipts)).sort(
    (a, b) => byText(a.receivedAtUtc, b.receivedAtUtc),
  );
  const recordSources = uniqueSorted(
    trusted.flatMap(
      ({ source }) =>
        source.questionnaire.mergeRecord?.sources ?? [
          { fileSha256: source.fileSha256, questionnaireId: source.questionnaire.questionnaireId },
        ],
    ),
  );
  const withRecord = recordSources.length > 1 || groupDecisions.length > 0;
  const merged: Questionnaire = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    questionnaireId: groupId,
    form,
    parts,
    receipts,
    ...(withRecord
      ? { mergeRecord: { sources: recordSources, decisions: [...groupDecisions] } }
      : {}),
  };
  group.questionnaire = withRecord ? { ...merged, mergeHash: mergeHashOf(merged) } : merged;
  if (definition && registered) {
    group.contradictions = contradictions(group.questionnaire, definition);
    group.hints = checkHints(group.questionnaire, definition);
    group.gaps = completenessGaps(group.questionnaire, registered);
  }
  return group;
}

function collectVersions(
  items: readonly Checked[],
  notes: MergeNote[],
  label: (role: RoleId) => string,
): Map<RoleId, Map<Sha256Hex, Entry>> {
  const versions = new Map<RoleId, Map<Sha256Hex, Entry>>();
  for (const { source, verdict, trusted } of items) {
    for (const [role, parts] of Object.entries(source.questionnaire.parts)) {
      parts.forEach((part, position) => {
        const partVerdict = verdict.parts.find((v) => v.role === role && v.position === position);
        const version = part.seal ? `Fassung ${part.seal.payload.version}` : 'Entwurf';
        if (!part.seal) {
          notes.push({ code: 'draftIgnored', role, detail: [label(role)] });
          return;
        }
        if (!trusted || partVerdict?.level === 'invalid') {
          const reasons = trusted
            ? (partVerdict?.findings ?? []).filter((f) => f.severity === 'error').map((f) => f.code)
            : ['mergeAltered'];
          notes.push({ code: 'invalidExcluded', role, detail: [label(role), version, ...reasons] });
          return;
        }
        const entries = versions.get(role) ?? new Map<Sha256Hex, Entry>();
        versions.set(role, entries);
        const existing = entries.get(part.seal.contentHash);
        if (existing) existing.sources.add(source.fileSha256);
        else entries.set(part.seal.contentHash, { part, sources: new Set([source.fileSha256]) });
      });
    }
  }
  return versions;
}

function roleOrder(definition: FormDefinition | undefined, roles: readonly RoleId[]): RoleId[] {
  const known = definition?.roles.map((role) => role.id) ?? [];
  return [
    ...known.filter((role) => roles.includes(role)),
    ...roles.filter((role) => !known.includes(role)).sort(byText),
  ];
}

type Resolution =
  { chain: Entry[]; dropped: Entry[] } | { conflict: MergeConflictCode; candidates: Entry[] };

const hashOf = (entry: Entry) => entry.part.seal?.contentHash ?? '';
const predecessorOf = (entry: Entry) => entry.part.seal?.payload.supersedes;

/**
 * Orders a role's distinct versions into one supersedes chain. Without a decision the chain must be
 * unambiguous; a `chooseVersion` decision keeps the chosen version, its predecessors and its line
 * of successors, and drops the competing branches.
 */
function resolveChain(
  entries: ReadonlyMap<Sha256Hex, Entry>,
  chosen: Sha256Hex | undefined,
): Resolution {
  const all = [...entries.values()];
  const missing = all.filter((entry) => {
    const predecessor = predecessorOf(entry);
    return predecessor !== undefined && !entries.has(predecessor);
  });
  if (missing.length > 0) return { conflict: 'chainIncomplete', candidates: missing };
  const successors = (hash: Sha256Hex | undefined) =>
    all.filter((entry) => predecessorOf(entry) === hash);

  let chain: Entry[];
  if (chosen === undefined) {
    const roots = successors(undefined);
    const [root] = roots;
    if (!root || roots.length > 1) return { conflict: 'versionConflict', candidates: roots };
    chain = [root];
  } else {
    const pick = entries.get(chosen);
    if (!pick) return { conflict: 'choiceInvalid', candidates: [] };
    chain = [];
    for (let entry: Entry | undefined = pick; entry;) {
      chain.unshift(entry);
      const predecessor = predecessorOf(entry);
      entry = predecessor === undefined ? undefined : entries.get(predecessor);
    }
  }
  for (let last = chain.at(-1); last;) {
    const next = successors(hashOf(last));
    if (next.length > 1) return { conflict: 'versionConflict', candidates: next };
    last = next[0];
    if (last) chain.push(last);
  }
  const kept = new Set(chain);
  return { chain, dropped: all.filter((entry) => !kept.has(entry)) };
}

function describeChain(
  resolved: { chain: Entry[]; dropped: Entry[] },
  role: RoleId,
  label: (role: RoleId) => string,
  definition: FormDefinition | undefined,
  notes: MergeNote[],
): void {
  const fieldLabel = (id: FieldId) =>
    definition?.sections.flatMap((s) => s.fields).find((f) => f.id === id)?.label ?? id;
  for (const entry of resolved.chain) {
    if (entry.sources.size > 1) {
      notes.push({
        code: 'duplicateCollapsed',
        role,
        detail: [label(role), versionText(entry), `aus ${entry.sources.size} Dateien`],
      });
    }
  }
  resolved.chain.forEach((entry, i) => {
    const previous = resolved.chain[i - 1];
    if (!previous) return;
    const changed = changedFields(previous.part, entry.part).map(fieldLabel);
    notes.push({
      code: 'newerVersionWins',
      role,
      detail: [
        label(role),
        `${versionText(entry)} ersetzt ${versionText(previous)}`,
        changed.length > 0 ? `geändert: ${changed.join(', ')}` : 'keine Angabe geändert',
      ],
    });
  });
  if (resolved.dropped.length > 0) {
    const kept = resolved.chain.at(-1);
    notes.push({
      code: 'versionChosen',
      role,
      detail: [
        label(role),
        kept ? `gilt: ${versionText(kept)}` : '',
        ...resolved.dropped.map((entry) => `verworfen: ${versionText(entry)}`),
      ],
    });
  }
}

function versionText(entry: Entry): string {
  const seal = entry.part.seal;
  if (!seal) return 'Entwurf';
  return `Fassung ${seal.payload.version} vom ${formatLocalDateTime(seal.payload.systemNote.signedAtLocal)}`;
}

function changedFields(older: Part, newer: Part): FieldId[] {
  const ids = [...new Set([...Object.keys(older.data), ...Object.keys(newer.data)])];
  return ids.filter(
    (id) => canonicalize(older.data[id] ?? null) !== canonicalize(newer.data[id] ?? null),
  );
}

function candidateOf(entry: Entry): VersionCandidate {
  const seal = entry.part.seal;
  return {
    contentHash: hashOf(entry),
    version: seal?.payload.version ?? 0,
    status: entry.part.status,
    signedAtLocal: seal?.payload.systemNote.signedAtLocal ?? '',
    sources: [...entry.sources].sort(byText),
  };
}

function compareFields(candidates: readonly Entry[]): FieldComparison[] {
  const ids = [...new Set(candidates.flatMap((entry) => Object.keys(entry.part.data)))];
  return ids
    .map((fieldId) => ({
      fieldId,
      values: candidates.map((entry) => entry.part.data[fieldId] ?? null),
    }))
    .filter(({ values }) => new Set(values.map((value) => canonicalize(value))).size > 1);
}

/**
 * Proposes joining two groups of the same form without shared roles whose matchKeys agree (e.g.
 * the person's name equals the name in the employer's part). Only a human decision links them.
 */
function proposeLinks(groups: readonly MergeGroup[], registry: FormRegistry): LinkProposal[] {
  const proposals: LinkProposal[] = [];
  groups.forEach((a, i) => {
    groups.slice(i + 1).forEach((b) => {
      const qa = a.questionnaire;
      const qb = b.questionnaire;
      if (!qa || !qb || qa.form.definitionHash !== qb.form.definitionHash) return;
      const definition = registry.byHash(qa.form.definitionHash)?.definition;
      if (!definition) return;
      const rolesA = Object.keys(qa.parts);
      if (Object.keys(qb.parts).some((role) => rolesA.includes(role))) return;
      const matched: string[] = [];
      let mismatch = false;
      for (const key of definition.matchKeys) {
        const pair = matchPair(key.fields, qa, qb);
        if (!pair) continue;
        const [left, right] = pair;
        if (left !== null && right !== null && comparable(left) === comparable(right)) {
          matched.push(key.label);
        } else {
          mismatch = true;
        }
      }
      if (matched.length > 0 && !mismatch) {
        proposals.push({
          questionnaireIds: [a.questionnaireId, b.questionnaireId],
          matchKeys: matched,
        });
      }
    });
  });
  return proposals;
}

/** Values of one matchKey: a role present in a and another role present in b. */
function matchPair(
  fields: Readonly<Record<RoleId, FieldId>>,
  a: Questionnaire,
  b: Questionnaire,
): [FieldValue, FieldValue] | undefined {
  const entries = Object.entries(fields);
  for (const [roleA, fieldA] of entries) {
    const partA = latestSealed(a, roleA);
    if (!partA) continue;
    for (const [roleB, fieldB] of entries) {
      const partB = roleB === roleA ? undefined : latestSealed(b, roleB);
      if (partB) return [partA.data[fieldA] ?? null, partB.data[fieldB] ?? null];
    }
  }
  return undefined;
}
