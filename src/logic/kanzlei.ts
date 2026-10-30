// The Kanzlei station (step 9): many files in, grouped and merged by the rules of merge.ts. The
// human decisions (link two questionnaires, choose a version) live in the inbox and can be
// withdrawn; the app never takes them itself. Every merged questionnaire gets a receipt per file it
// came from — when the file was read here and which of its sealed parts went in — so the parts are
// "bestätigt" (level 2) by the Kanzlei. Pure: files arrive decoded, with their arrival time, from
// the io layer.
import type { FormOrigin } from './dataPackage';
import { registryOf, type FormRegistry, type RegisteredForm } from './formRegistry';
import { canonicalize } from './jcs';
import { mergeSources, type MergeGroup, type MergeResult } from './merge';
import { mergeHashOf } from './mergeRecord';
import type { MergeDecision, Questionnaire, RoleId, Sha256Hex } from './model';
import { addReceipt, TRANSITION_MESSAGES } from './questionnaire';

export const KANZLEI_STATION = 'Kanzlei';

export interface InboxFile {
  name: string;
  fileSha256: Sha256Hex;
  questionnaire: Questionnaire;
  form: RegisteredForm;
  origin: FormOrigin;
  received: { local: string; utc: string; timeZone: string };
}

export interface Inbox {
  files: readonly InboxFile[];
  decisions: readonly MergeDecision[];
}

export const EMPTY_INBOX: Inbox = { files: [], decisions: [] };

/** The same file (same SHA-256) is taken once; the caller says so. */
export function addToInbox(inbox: Inbox, file: InboxFile): { inbox: Inbox; duplicate: boolean } {
  if (inbox.files.some((f) => f.fileSha256 === file.fileSha256)) return { inbox, duplicate: true };
  return { inbox: { ...inbox, files: [...inbox.files, file] }, duplicate: false };
}

/** Removes a file; decisions about questionnaires no file carries any more go with it. */
export function removeFromInbox(inbox: Inbox, fileSha256: Sha256Hex): Inbox {
  const files = inbox.files.filter((f) => f.fileSha256 !== fileSha256);
  const ids = new Set(
    files.flatMap((f) => [
      f.questionnaire.questionnaireId,
      ...(f.questionnaire.mergeRecord?.sources.map((s) => s.questionnaireId) ?? []),
    ]),
  );
  const decisions = inbox.decisions.filter((d) =>
    d.kind === 'link'
      ? d.questionnaireIds.filter((id) => ids.has(id)).length >= 2
      : ids.has(d.questionnaireId),
  );
  return { files, decisions };
}

const sameDecision = (a: MergeDecision, b: MergeDecision) => canonicalize(a) === canonicalize(b);

/** Records a human decision; a new version choice replaces an earlier one for the same role. */
export function decide(inbox: Inbox, decision: MergeDecision): Inbox {
  const others = inbox.decisions.filter(
    (d) =>
      !sameDecision(d, decision) &&
      !(
        decision.kind === 'chooseVersion' &&
        d.kind === 'chooseVersion' &&
        d.questionnaireId === decision.questionnaireId &&
        d.role === decision.role
      ),
  );
  return { ...inbox, decisions: [...others, decision] };
}

export function withdraw(inbox: Inbox, decision: MergeDecision): Inbox {
  return { ...inbox, decisions: inbox.decisions.filter((d) => !sameDecision(d, decision)) };
}

/** Published forms plus the forms files only describe themselves — for labels, rules and gaps. */
export function inboxRegistry(published: FormRegistry, inbox: Inbox): FormRegistry {
  const forms = new Map(published.forms.map((form) => [form.definitionHash, form]));
  for (const file of inbox.files) {
    if (!forms.has(file.form.definitionHash)) forms.set(file.form.definitionHash, file.form);
  }
  return registryOf([...forms.values()]);
}

export function mergeInbox(inbox: Inbox, published: FormRegistry): MergeResult {
  return mergeSources(
    inbox.files.map((file) => ({
      questionnaire: file.questionnaire,
      fileSha256: file.fileSha256,
    })),
    { registry: inboxRegistry(published, inbox), decisions: inbox.decisions },
  );
}

/** The files a group was built from, in the order they arrived. */
export function filesOfGroup(group: MergeGroup, inbox: Inbox): InboxFile[] {
  return inbox.files
    .filter((file) => group.sourceIds.includes(file.questionnaire.questionnaireId))
    .sort((a, b) =>
      a.received.utc === b.received.utc
        ? a.fileSha256 < b.fileSha256
          ? -1
          : 1
        : a.received.utc < b.received.utc
          ? -1
          : 1,
    );
}

/**
 * The merged questionnaire with a Kanzlei receipt for every file it came from: arrival time and the
 * file's sealed parts that went into the result. A part already received by the Kanzlei (an earlier
 * receipt, or the same part in an earlier file) is not recorded twice, so a merged file read again
 * adds nothing. The merge hash is renewed, because it covers the receipts. A receipt the
 * questionnaire refuses is returned with its reason, never dropped silently.
 */
export function withKanzleiReceipts(
  group: MergeGroup,
  inbox: Inbox,
  appVersion: string,
): { questionnaire: Questionnaire; refused: { fileName: string; reason: string }[] } | undefined {
  let q = group.questionnaire;
  if (!q) return undefined;
  const refused: { fileName: string; reason: string }[] = [];
  const kept = new Map<Sha256Hex, RoleId>();
  for (const [role, parts] of Object.entries(q.parts)) {
    for (const part of parts) if (part.seal) kept.set(part.seal.contentHash, role);
  }
  const covered = new Set(
    q.receipts
      .filter((r) => r.station === KANZLEI_STATION)
      .flatMap((r) => r.parts.map((p) => p.contentHash)),
  );
  for (const file of filesOfGroup(group, inbox)) {
    const parts = Object.values(file.questionnaire.parts)
      .flat()
      .flatMap((part) => {
        const hash = part.seal?.contentHash;
        const role = hash === undefined ? undefined : kept.get(hash);
        return hash === undefined || role === undefined || covered.has(hash)
          ? []
          : [{ role, contentHash: hash }];
      });
    if (parts.length === 0) continue;
    const result = addReceipt(q, {
      station: KANZLEI_STATION,
      receivedAtLocal: file.received.local,
      receivedAtUtc: file.received.utc,
      timeZone: file.received.timeZone,
      source: 'app',
      fileName: file.name,
      fileSha256: file.fileSha256,
      parts,
      appVersion,
    });
    if (!result.ok) {
      refused.push({
        fileName: file.name,
        reason: [TRANSITION_MESSAGES[result.code], ...result.detail].join(' '),
      });
      continue;
    }
    q = result.questionnaire;
    parts.forEach((p) => covered.add(p.contentHash));
  }
  return { questionnaire: q.mergeRecord ? { ...q, mergeHash: mergeHashOf(q) } : q, refused };
}
