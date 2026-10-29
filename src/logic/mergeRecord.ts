// What a merge adds to a questionnaire and how it is protected: the mergeHash covers the merge
// record (sources and human decisions), all receipts and the contentHash of every part version.
import { canonicalHash } from './hash';
import type { Questionnaire, Sha256Hex } from './model';

export function mergeHashOf(questionnaire: Questionnaire): Sha256Hex {
  return canonicalHash({
    mergeRecord: questionnaire.mergeRecord ?? null,
    parts: Object.fromEntries(
      Object.entries(questionnaire.parts).map(([role, versions]) => [
        role,
        versions.map((part) => part.seal?.contentHash ?? null),
      ]),
    ),
    receipts: questionnaire.receipts,
  });
}

/** Questionnaire ids joined into this one by a human link decision (including its own id). */
export function linkedQuestionnaireIds(questionnaire: Questionnaire): ReadonlySet<string> {
  const ids = new Set([questionnaire.questionnaireId]);
  for (const decision of questionnaire.mergeRecord?.decisions ?? []) {
    if (decision.kind === 'link') decision.questionnaireIds.forEach((id) => ids.add(id));
  }
  return ids;
}
