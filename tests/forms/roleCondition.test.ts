// A conditional role decided by another role's answer (requiredIf kind "answer"): the spouse must
// release a tax return only when the Kanzlei states a joint assessment. Fictitious form and data.
import { checkFormDefinition, parseFormDefinition } from '../../src/logic/formDefinition';
import type { FormDefinition } from '../../src/logic/model';
import {
  createQuestionnaire,
  receivedPartFor,
  sealPart,
  startPart,
} from '../../src/logic/questionnaire';
import {
  completenessGaps,
  requirementText,
  roleRequirement,
  transmissionBlockers,
} from '../../src/logic/requirements';
import { formCatalogue } from '../../src/logic/catalogue';
import { registeredFrom } from '../support/formFiles';
import { fill, note, ok, QUESTIONNAIRE_ID, STROKES } from '../support/sample';

const RAW: FormDefinition = {
  id: 'freigabe-test',
  version: '0.1.0',
  title: 'Freigabe (nur für Tests)',
  signaturePolicy: 'electronic',
  recipient: { label: 'Kanzlei' },
  roles: [
    {
      id: 'kanzlei',
      label: 'Kanzlei',
      stationHeading: 'Vorlage der Kanzlei',
      confirmationText: 'Wir haben diese Fassung vorgelegt.',
      signature: 'required',
    },
    {
      id: 'ehegatte',
      label: 'Ehegatte',
      stationHeading: 'Freigabe des Ehegatten',
      confirmationText: 'Ich gebe frei.',
      signature: 'required',
      requiredIf: { kind: 'answer', when: { field: 'veranlagung', equals: 'zusammen' } },
      signerNameField: 'ehegatteName',
    },
  ],
  sections: [
    {
      id: 'vorlage',
      title: 'Vorlage',
      fields: [
        {
          id: 'veranlagung',
          role: 'kanzlei',
          type: 'choice',
          label: 'Veranlagungsart',
          required: true,
          purpose: 'Test',
          options: [
            { id: 'einzel', label: 'Einzelveranlagung' },
            { id: 'zusammen', label: 'Zusammenveranlagung' },
          ],
        },
      ],
    },
    {
      id: 'freigabe',
      title: 'Freigabe',
      fields: [
        {
          id: 'ehegatteName',
          role: 'ehegatte',
          type: 'text',
          label: 'Ihr Name',
          required: true,
          purpose: 'Test',
        },
      ],
    },
  ],
  infoBlocks: [],
  consistencyRules: [],
  matchKeys: [],
  legalNotes: ['Nur für Tests.'],
};

const form = registeredFrom(structuredClone(RAW));
const ehegatte = form.definition.roles[1];
if (!ehegatte) throw new Error('fixture changed');

const at = (minute: number) => ({
  local: `2026-10-30T10:${String(minute).padStart(2, '0')}:00.000+01:00`,
  utc: `2026-10-30T09:${String(minute).padStart(2, '0')}:00.000Z`,
});

function kanzleiSealed(veranlagung: string) {
  let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'kanzlei'));
  q = fill(q, 'kanzlei', { veranlagung }, form);
  const t = at(0);
  return ok(
    sealPart(q, form, 'kanzlei', {
      nonce: 'a1'.repeat(16),
      systemNote: note(t.local, t.utc),
      acknowledged: [],
      signature: { method: 'drawn', strokes: STROKES },
    }),
  );
}

describe('role condition "answer"', () => {
  it('is pending until the deciding role has sealed, then follows its answer', () => {
    const empty = createQuestionnaire(QUESTIONNAIRE_ID, form);
    expect(roleRequirement(form.definition, empty, ehegatte)).toMatchObject({
      required: false,
      reason: 'pending',
      triggerRole: 'kanzlei',
    });
    expect(roleRequirement(form.definition, kanzleiSealed('einzel'), ehegatte)).toMatchObject({
      required: false,
      reason: 'answerNotMet',
    });
    expect(roleRequirement(form.definition, kanzleiSealed('zusammen'), ehegatte)).toMatchObject({
      required: true,
      reason: 'answerMet',
    });
  });

  it('says in German why the role is (not) needed', () => {
    const text = (q: ReturnType<typeof kanzleiSealed>) =>
      requirementText(form.definition, ehegatte, roleRequirement(form.definition, q, ehegatte));
    expect(text(createQuestionnaire(QUESTIONNAIRE_ID, form))).toMatch(
      /^Nur nötig, wenn .*Veranlagungsart.*Zusammenveranlagung.*\.$/,
    );
    expect(text(kanzleiSealed('zusammen'))).toMatch(/^Erforderlich, weil /);
    expect(text(kanzleiSealed('einzel'))).toBe(
      'Nicht erforderlich nach den Angaben im Fragebogen.',
    );
  });

  it('blocks transmission until the spouse signs with name over the current Kanzlei version', () => {
    const q = kanzleiSealed('zusammen');
    expect(transmissionBlockers(q, form).map((b) => b.code)).toEqual(['conditionalRoleMissing']);
    expect(transmissionBlockers(kanzleiSealed('einzel'), form)).toEqual([]);

    let withSpouse = ok(startPart(q, form, 'ehegatte'));
    withSpouse = fill(withSpouse, 'ehegatte', { ehegatteName: 'Erika Musterfrau' }, form);
    const t = at(5);
    const input = {
      nonce: 'b2'.repeat(16),
      systemNote: note(t.local, t.utc),
      acknowledged: [],
      signature: { method: 'drawn' as const, strokes: STROKES },
    };
    const unbound = sealPart(withSpouse, form, 'ehegatte', input);
    expect(unbound).toMatchObject({ ok: false, code: 'mustBindPart' });

    const kanzleiPart = q.parts.kanzlei?.[0];
    if (!kanzleiPart) throw new Error('no Kanzlei part');
    const signed = ok(
      sealPart(withSpouse, form, 'ehegatte', {
        ...input,
        receivedParts: [receivedPartFor(kanzleiPart, t, 'same-device')],
      }),
    );
    expect(transmissionBlockers(signed, form)).toEqual([]);
    expect(completenessGaps(signed, form)).toEqual([]);
  });

  it('describes the condition in the catalogue', () => {
    expect(formCatalogue(form, 'draft')).toContain('nur wenn');
  });
});

describe('role condition "answer" — definition rules', () => {
  const problems = (change: (d: FormDefinition) => void) => {
    const d = structuredClone(RAW);
    change(d);
    return checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`);
  };

  it('accepts the fixture and decodes it strictly', () => {
    expect(problems(() => undefined)).toEqual([]);
    expect(parseFormDefinition(structuredClone(RAW)).ok).toBe(true);
    const extra = structuredClone(RAW) as unknown as { roles: Record<string, unknown>[] };
    const role = extra.roles[1];
    if (role)
      role.requiredIf = {
        kind: 'answer',
        when: { field: 'veranlagung', equals: 'zusammen' },
        birthDateField: 'x',
      };
    expect(parseFormDefinition(extra).ok).toBe(false);
  });

  it('refuses a condition on the role itself, an unknown field and a role that need not sign', () => {
    expect(
      problems((d) => {
        const role = d.roles[1];
        if (role)
          role.requiredIf = { kind: 'answer', when: { field: 'ehegatteName', answered: true } };
      }),
    ).toEqual([expect.stringContaining('must reference fields of another role')]);
    expect(
      problems((d) => {
        const role = d.roles[1];
        if (role)
          role.requiredIf = { kind: 'answer', when: { field: 'gibtEsNicht', equals: true } };
      }),
    ).toEqual([expect.stringContaining('unknown field "gibtEsNicht"')]);
    expect(
      problems((d) => {
        const role = d.roles[1];
        if (role) role.signature = 'optional';
      }),
    ).toEqual([expect.stringContaining('a conditional role must sign')]);
  });

  it('refuses a comparison value the deciding field cannot have', () => {
    expect(
      problems((d) => {
        const role = d.roles[1];
        if (role)
          role.requiredIf = { kind: 'answer', when: { field: 'veranlagung', equals: 'getrennt' } };
      }),
    ).not.toEqual([]);
  });
});

// A chain (Tobias 2026-11-13: „dann muss gesetzlicher Vertreter 1 eine Angabe machen, ob er allein
// sorgeberechtigt ist, sonst 2“): a second conditional role decided by the first conditional one.
describe('role condition chain', () => {
  const chained = structuredClone(RAW);
  chained.roles.push({
    id: 'zweit',
    label: 'Zweite Person',
    stationHeading: 'Freigabe der zweiten Person',
    confirmationText: 'Ich gebe auch frei.',
    signature: 'required',
    requiredIf: { kind: 'answer', when: { field: 'alleinFrei', equals: false } },
    signerNameField: 'zweitName',
  });
  chained.sections[1]?.fields.push({
    id: 'alleinFrei',
    role: 'ehegatte',
    type: 'boolean',
    label: 'Gibt allein frei',
    required: true,
    purpose: 'Test',
  });
  chained.sections.push({
    id: 'zweit',
    title: 'Zweite Person',
    fields: [
      {
        id: 'zweitName',
        role: 'zweit',
        type: 'text',
        label: 'Name',
        required: true,
        purpose: 'Test',
      },
    ],
  });
  const chainForm = registeredFrom(structuredClone(chained));
  const zweit = chainForm.definition.roles[2];
  if (!zweit) throw new Error('fixture changed');

  function kanzlei(veranlagung: string) {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, chainForm), chainForm, 'kanzlei'));
    q = fill(q, 'kanzlei', { veranlagung }, chainForm);
    const t = at(0);
    return ok(
      sealPart(q, chainForm, 'kanzlei', {
        nonce: 'a1'.repeat(16),
        systemNote: note(t.local, t.utc),
        acknowledged: [],
        signature: { method: 'drawn', strokes: STROKES },
      }),
    );
  }
  function spouse(alleinFrei: boolean) {
    const base = kanzlei('zusammen');
    let q = ok(startPart(base, chainForm, 'ehegatte'));
    q = fill(q, 'ehegatte', { ehegatteName: 'Erika Musterfrau', alleinFrei }, chainForm);
    const kanzleiPart = base.parts.kanzlei?.[0];
    if (!kanzleiPart) throw new Error('no Kanzlei part');
    const t = at(5);
    return ok(
      sealPart(q, chainForm, 'ehegatte', {
        nonce: 'b2'.repeat(16),
        systemNote: note(t.local, t.utc),
        acknowledged: [],
        signature: { method: 'drawn', strokes: STROKES },
        receivedParts: [receivedPartFor(kanzleiPart, t, 'same-device')],
      }),
    );
  }
  const requirement = (q: ReturnType<typeof kanzlei>) =>
    roleRequirement(chainForm.definition, q, zweit);

  it('is a valid definition', () => {
    expect(checkFormDefinition(chainForm.definition)).toEqual([]);
  });

  it('is not needed once the deciding role is decided not needed, not pending forever', () => {
    expect(requirement(kanzlei('einzel'))).toMatchObject({
      required: false,
      reason: 'triggerNotNeeded',
    });
    expect(transmissionBlockers(kanzlei('einzel'), chainForm)).toEqual([]);
    expect(requirementText(chainForm.definition, zweit, requirement(kanzlei('einzel')))).toBe(
      'Nicht erforderlich nach den Angaben im Fragebogen.',
    );
  });

  it('waits for the deciding role, then follows its answer', () => {
    expect(requirement(kanzlei('zusammen'))).toMatchObject({ required: false, reason: 'pending' });
    expect(requirement(spouse(true))).toMatchObject({ required: false, reason: 'answerNotMet' });
    expect(requirement(spouse(false))).toMatchObject({ required: true, reason: 'answerMet' });
    expect(transmissionBlockers(spouse(false), chainForm).map((b) => b.code)).toEqual([
      'conditionalRoleMissing',
    ]);
  });

  it('refuses deciding roles that form a cycle', () => {
    const cycle = structuredClone(chained);
    const ehegatteRole = cycle.roles[1];
    if (ehegatteRole)
      ehegatteRole.requiredIf = { kind: 'answer', when: { field: 'zweitName', answered: true } };
    expect(checkFormDefinition(cycle).map((issue) => issue.message)).toContain(
      'the deciding roles form a cycle',
    );
  });
});
