// When a questionnaire may be passed on ("übermitteln") and what is still missing.
// Nothing leaves a station half-done: no open draft, every required signature present, no altered
// part. If the person is under 18 on the day of their signature (the date of their own device),
// the legal guardian must sign with their name and confirm exactly the current version of the
// person's part. The io layer must refuse to write a transmission PDF while blockers exist.
import { AGE_OF_MAJORITY, ageOn, compareIsoDates, formatGermanDate, isIsoDate } from './dates';
import { activeExclusions } from './hints';
import { describeValidity, outsideValidity, validityRole } from './validity';
import { describeCondition, evaluateCondition } from './conditions';
import { fieldsById, missingRequired, signerName, triggerRoleOf, visibility } from './form';
import { registryOf, type RegisteredForm } from './formRegistry';
import type {
  FormDefinition,
  IsoDate,
  Questionnaire,
  RoleCondition,
  RoleDefinition,
  RoleId,
  Seal,
  Sha256Hex,
} from './model';
import { currentPart, latestSealed } from './questionnaire';
import { verifyQuestionnaire } from './verify';

export type RequirementReason =
  'always' | 'pending' | 'minor' | 'adult' | 'ageUnknown' | 'answerMet' | 'answerNotMet';

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
  const triggerRole = triggerRoleOf(definition, condition);
  const base = { role: role.id, ...(triggerRole === undefined ? {} : { triggerRole }) };
  const trigger = triggerRole === undefined ? undefined : latestSealed(questionnaire, triggerRole);
  if (!trigger?.seal || triggerRole === undefined) {
    return { ...base, required: false, reason: 'pending' };
  }
  if (condition.kind === 'answer') {
    const visible = visibility(definition, triggerRole, trigger.data);
    const met = evaluateCondition(condition.when, (id) =>
      visible.get(id) === true ? (trigger.data[id] ?? null) : null,
    );
    return { ...base, required: met, reason: met ? 'answerMet' : 'answerNotMet' };
  }
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

/** What the overview says about a conditional role (German); undefined for unconditional roles. */
export function requirementText(
  definition: FormDefinition,
  role: RoleDefinition,
  requirement: RoleRequirement,
): string | undefined {
  const condition = role.requiredIf;
  if (!condition) return undefined;
  if (condition.kind === 'answer') {
    const when = describeCondition(condition.when, fieldsById(definition));
    switch (requirement.reason) {
      case 'answerMet':
        return `Erforderlich, weil ${when}.`;
      case 'answerNotMet':
        return 'Nicht erforderlich nach den Angaben im Fragebogen.';
      default:
        return `Nur nötig, wenn ${when}.`;
    }
  }
  switch (requirement.reason) {
    case 'minor':
      return 'Erforderlich: Die Person ist am Tag ihrer Unterschrift minderjährig.';
    case 'adult':
      return 'Nicht erforderlich: Die Person ist volljährig.';
    case 'ageUnknown':
      return 'Das Alter lässt sich nicht bestimmen – bitte das Geburtsdatum prüfen.';
    default:
      return 'Nur nötig, wenn die Person am Tag ihrer Unterschrift minderjährig ist.';
  }
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
  | 'requiredFieldMissing'
  | 'partInvalid'
  | 'guardianMissing'
  | 'guardianNotBound'
  | 'guardianNameMissing'
  | 'conditionalRoleMissing'
  | 'conditionalRoleNotBound'
  | 'conditionalRoleNameMissing'
  | 'ageUnknown'
  | 'roleMissing'
  | 'partsNotLinked'
  | 'outsideValidity'
  | 'outOfScope';

export const BLOCKER_MESSAGES: Readonly<Record<BlockerCode, string>> = {
  nothingSealed: 'Es gibt noch keinen abgeschlossenen Teil, der übermittelt werden kann.',
  draftOpen: 'Ein Teil ist noch nicht abgeschlossen. Entwürfe werden nicht übermittelt.',
  signatureMissing: 'Die Unterschrift fehlt. Ohne Unterschrift kann nicht übermittelt werden.',
  requiredFieldMissing: 'In einem abgeschlossenen Teil fehlen Pflichtangaben.',
  partInvalid: 'Ein Teil ist verändert oder fehlerhaft und kann nicht übermittelt werden.',
  guardianMissing:
    'Die Person ist am Tag ihrer Unterschrift minderjährig. Die gesetzliche Vertretung muss mit Namen unterschreiben.',
  conditionalRoleMissing:
    'Nach den Angaben im Fragebogen ist ein weiterer Teil erforderlich; er muss mit Namen unterschrieben werden.',
  conditionalRoleNotBound:
    'Eine Unterschrift gilt nicht der aktuellen Fassung, auf der sie beruht. Sie muss erneut gegeben werden.',
  conditionalRoleNameMissing: 'Der Name der unterschreibenden Person fehlt.',
  guardianNotBound:
    'Die Unterschrift der gesetzlichen Vertretung gilt nicht der aktuellen Fassung. Sie muss erneut unterschreiben.',
  guardianNameMissing: 'Der Name der gesetzlichen Vertretung fehlt.',
  ageUnknown:
    'Das Alter am Tag der Unterschrift lässt sich nicht bestimmen. Bitte das Geburtsdatum prüfen.',
  roleMissing: 'Ein erforderlicher Teil fehlt noch.',
  outOfScope:
    'Für diesen Sonderfall ist der Fragebogen nicht gedacht; er kann so nicht weitergegeben werden. Bitte die lohnabrechnende Stelle fragen.',
  outsideValidity:
    'Der Stichtag liegt außerhalb der Gültigkeit dieser Formularfassung. Bitte die Fassung verwenden, die für diesen Tag gilt.',
  partsNotLinked:
    'Zwei Teile verweisen nicht aufeinander. Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils; nach einer Änderung muss neu abgeschlossen werden.',
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
    const missing = part ? missingRequired(definition, role.id, part.data) : [];
    if (missing.length > 0) {
      const labels = missing.map((id) => fieldLabel(definition, id));
      add('requiredFieldMissing', role.id, [role.label, ...labels]);
    }
  }
  const verdict = verifyQuestionnaire(questionnaire, { registry: registryOf([form]) });
  for (const part of verdict.parts) {
    if (part.level === 'invalid') {
      add('partInvalid', part.role, [label(part.role), `Fassung ${part.version ?? '–'}`]);
    }
  }
  for (const role of definition.roles) {
    if (role.requiredIf) conditionalRoleBlockers(definition, questionnaire, role, add);
  }
  const reference = validityRole(definition);
  const stated = reference === undefined ? undefined : latestSealed(questionnaire, reference);
  const outside =
    reference === undefined || !stated
      ? undefined
      : outsideValidity(definition, reference, stated.data);
  if (reference !== undefined && outside !== undefined) {
    add('outsideValidity', reference, [outside, describeValidity(definition) ?? '']);
  }
  const excluded = activeExclusions(questionnaire, definition);
  if (excluded.length > 0)
    add(
      'outOfScope',
      undefined,
      excluded.map((e) => e.message),
    );
  return blockers;
}

function fieldLabel(definition: FormDefinition, fieldId: string): string {
  return (
    definition.sections.flatMap((section) => section.fields).find((field) => field.id === fieldId)
      ?.label ?? fieldId
  );
}

/** Blocker codes per kind of conditional role: the guardian keeps its own wording. */
const CONDITIONAL_CODES: Readonly<
  Record<RoleCondition['kind'], { missing: BlockerCode; notBound: BlockerCode; name: BlockerCode }>
> = {
  minorOnSigning: {
    missing: 'guardianMissing',
    notBound: 'guardianNotBound',
    name: 'guardianNameMissing',
  },
  answer: {
    missing: 'conditionalRoleMissing',
    notBound: 'conditionalRoleNotBound',
    name: 'conditionalRoleNameMissing',
  },
};

function conditionalRoleBlockers(
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
  if (!requirement.required || !role.requiredIf) return;
  const codes = CONDITIONAL_CODES[role.requiredIf.kind];
  const detail =
    requirement.signingDate === undefined
      ? [role.label]
      : [
          role.label,
          `${requirement.age ?? '?'} Jahre am ${formatGermanDate(requirement.signingDate)}`,
        ];
  const guardian = latestSealed(questionnaire, role.id);
  if (!guardian?.seal) {
    add(codes.missing, role.id, detail);
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
  if (!bound) add(codes.notBound, role.id, detail);
  if (signerName(role, guardian.data, guardian.seal.payload.signature) === undefined) {
    add(codes.name, role.id, [role.label]);
  }
}

/**
 * What the recipient still misses: all transmission blockers, required roles without a part, and
 * linked parts (`partLinks`) of which neither confirms the other's current version. A missing part
 * or a missing link does not stop passing the questionnaire on to the next station.
 */
export function completenessGaps(questionnaire: Questionnaire, form: RegisteredForm): Blocker[] {
  const { definition } = form;
  const gaps = transmissionBlockers(questionnaire, form).filter((b) => b.code !== 'nothingSealed');
  for (const role of definition.roles) {
    if (role.requiredIf || currentPart(questionnaire, role.id)) continue;
    gaps.push({ code: 'roleMissing', role: role.id, detail: [role.label] });
  }
  const label = (role: RoleId) => definition.roles.find((r) => r.id === role)?.label ?? role;
  for (const [a, b] of definition.partLinks ?? []) {
    const sealA = latestSealed(questionnaire, a)?.seal;
    const sealB = latestSealed(questionnaire, b)?.seal;
    if (!sealA || !sealB) continue;
    if (!confirms(sealA, b, sealB.contentHash) && !confirms(sealB, a, sealA.contentHash)) {
      gaps.push({ code: 'partsNotLinked', detail: [label(a), label(b)] });
    }
  }
  return gaps;
}

function confirms(seal: Seal, role: RoleId, contentHash: Sha256Hex): boolean {
  return seal.payload.receivedParts.some(
    (part) => part.role === role && part.contentHash === contentHash,
  );
}
