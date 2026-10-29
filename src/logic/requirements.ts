// When a questionnaire may be passed on ("übermitteln") and what is still missing.
// Nothing leaves a station half-done: no open draft, every required signature present, no altered
// part. If the person is under 18 on the day of their signature (the date of their own device),
// the legal guardian must sign with their name and confirm exactly the current version of the
// person's part. The io layer must refuse to write a transmission PDF while blockers exist.
import { AGE_OF_MAJORITY, ageOn, compareIsoDates, formatGermanDate, isIsoDate } from './dates';
import { ownerOfField, signerName } from './form';
import { registryOf, type RegisteredForm } from './formRegistry';
import type { FormDefinition, IsoDate, Questionnaire, RoleDefinition, RoleId } from './model';
import { currentPart, latestSealed } from './questionnaire';
import { verifyQuestionnaire } from './verify';

export type RequirementReason = 'always' | 'pending' | 'minor' | 'adult' | 'ageUnknown';

export interface RoleRequirement {
  role: RoleId;
  required: boolean;
  /**
   * `always`: unconditional role. For a conditional role: `pending` until the triggering part is
   * sealed, then `minor` / `adult`; `ageUnknown` (treated as required) if the birth date is not a
   * date or lies after the signing day.
   */
  reason: RequirementReason;
  triggerRole?: RoleId;
  /** Local date of the triggering signature, i.e. the day according to the signer's device. */
  signingDate?: IsoDate;
  age?: number;
}

export function roleRequirement(
  definition: FormDefinition,
  questionnaire: Questionnaire,
  role: RoleDefinition,
): RoleRequirement {
  const condition = role.requiredIf;
  if (!condition) return { role: role.id, required: true, reason: 'always' };
  const triggerRole = ownerOfField(definition, condition.birthDateField);
  const base = { role: role.id, ...(triggerRole === undefined ? {} : { triggerRole }) };
  const trigger = triggerRole === undefined ? undefined : latestSealed(questionnaire, triggerRole);
  if (!trigger?.seal) return { ...base, required: false, reason: 'pending' };
  const signingDate = trigger.seal.payload.systemNote.signedAtLocal.slice(0, 10);
  const birthDate = trigger.data[condition.birthDateField];
  if (
    typeof birthDate !== 'string' ||
    !isIsoDate(birthDate) ||
    !isIsoDate(signingDate) ||
    compareIsoDates(birthDate, signingDate) > 0
  ) {
    return { ...base, required: true, reason: 'ageUnknown', signingDate };
  }
  const age = ageOn(birthDate, signingDate);
  const minor = age < AGE_OF_MAJORITY;
  return { ...base, required: minor, reason: minor ? 'minor' : 'adult', signingDate, age };
}

export function roleRequirements(
  definition: FormDefinition,
  questionnaire: Questionnaire,
): RoleRequirement[] {
  return definition.roles.map((role) => roleRequirement(definition, questionnaire, role));
}

export type BlockerCode =
  | 'nothingSealed'
  | 'draftOpen'
  | 'signatureMissing'
  | 'partInvalid'
  | 'guardianMissing'
  | 'guardianNotBound'
  | 'guardianNameMissing'
  | 'ageUnknown'
  | 'roleMissing';

export const BLOCKER_MESSAGES: Readonly<Record<BlockerCode, string>> = {
  nothingSealed: 'Es gibt noch keinen abgeschlossenen Teil, der übermittelt werden kann.',
  draftOpen: 'Ein Teil ist noch nicht abgeschlossen. Entwürfe werden nicht übermittelt.',
  signatureMissing: 'Die Unterschrift fehlt. Ohne Unterschrift kann nicht übermittelt werden.',
  partInvalid: 'Ein Teil ist verändert oder fehlerhaft und kann nicht übermittelt werden.',
  guardianMissing:
    'Die Person ist am Tag ihrer Unterschrift minderjährig. Die gesetzliche Vertretung muss mit Namen unterschreiben.',
  guardianNotBound:
    'Die Unterschrift der gesetzlichen Vertretung gilt nicht der aktuellen Fassung. Sie muss erneut unterschreiben.',
  guardianNameMissing: 'Der Name der gesetzlichen Vertretung fehlt.',
  ageUnknown:
    'Das Alter am Tag der Unterschrift lässt sich nicht bestimmen. Bitte das Geburtsdatum prüfen.',
  roleMissing: 'Ein erforderlicher Teil fehlt noch.',
};

export interface Blocker {
  code: BlockerCode;
  role?: RoleId;
  detail: readonly string[];
}

/** Everything that prevents passing the questionnaire on; empty means it may be transmitted. */
export function transmissionBlockers(
  questionnaire: Questionnaire,
  form: RegisteredForm,
): Blocker[] {
  if (questionnaire.form.definitionHash !== form.definitionHash) {
    throw new RangeError('The form does not belong to this questionnaire');
  }
  const { definition } = form;
  const blockers: Blocker[] = [];
  const add = (code: BlockerCode, role?: RoleId, detail: readonly string[] = []) => {
    blockers.push({ code, ...(role === undefined ? {} : { role }), detail });
  };
  const label = (role: RoleId) => definition.roles.find((r) => r.id === role)?.label ?? role;

  const roles = Object.keys(questionnaire.parts);
  if (!roles.some((role) => latestSealed(questionnaire, role))) add('nothingSealed');
  for (const role of roles) {
    if (currentPart(questionnaire, role)?.status === 'draft') add('draftOpen', role, [label(role)]);
  }
  for (const role of definition.roles) {
    const part = latestSealed(questionnaire, role.id);
    if (part && role.signature === 'required' && part.status !== 'signed') {
      add('signatureMissing', role.id, [role.label]);
    }
  }
  const verdict = verifyQuestionnaire(questionnaire, { registry: registryOf([form]) });
  for (const part of verdict.parts) {
    if (part.level === 'invalid') {
      add('partInvalid', part.role, [label(part.role), `Fassung ${part.version ?? '–'}`]);
    }
  }
  for (const role of definition.roles) {
    if (role.requiredIf) guardianBlockers(definition, questionnaire, role, add);
  }
  return blockers;
}

function guardianBlockers(
  definition: FormDefinition,
  questionnaire: Questionnaire,
  role: RoleDefinition,
  add: (code: BlockerCode, role?: RoleId, detail?: readonly string[]) => void,
): void {
  const requirement = roleRequirement(definition, questionnaire, role);
  if (requirement.reason === 'ageUnknown') {
    add('ageUnknown', role.id, [role.label]);
    return;
  }
  if (!requirement.required || requirement.signingDate === undefined) return;
  const detail = [
    role.label,
    `${requirement.age ?? '?'} Jahre am ${formatGermanDate(requirement.signingDate)}`,
  ];
  const guardian = latestSealed(questionnaire, role.id);
  if (!guardian?.seal) {
    add('guardianMissing', role.id, detail);
    return;
  }
  const trigger =
    requirement.triggerRole === undefined
      ? undefined
      : latestSealed(questionnaire, requirement.triggerRole);
  const bound = guardian.seal.payload.receivedParts.some(
    (part) =>
      part.role === requirement.triggerRole && part.contentHash === trigger?.seal?.contentHash,
  );
  if (!bound) add('guardianNotBound', role.id, detail);
  if (signerName(role, guardian.data, guardian.seal.payload.signature) === undefined) {
    add('guardianNameMissing', role.id, [role.label]);
  }
}

/** What the Kanzlei still misses: all transmission blockers plus required roles without a part. */
export function completenessGaps(questionnaire: Questionnaire, form: RegisteredForm): Blocker[] {
  const gaps = transmissionBlockers(questionnaire, form).filter((b) => b.code !== 'nothingSealed');
  for (const role of form.definition.roles) {
    if (role.requiredIf || currentPart(questionnaire, role.id)) continue;
    gaps.push({ code: 'roleMissing', role: role.id, detail: [role.label] });
  }
  return gaps;
}
