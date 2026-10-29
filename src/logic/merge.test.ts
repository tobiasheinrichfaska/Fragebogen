import {
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  beispielForm,
  beispielRegistry,
  fill,
  guardianForm,
  kanzleiReceipt,
  minorSigned,
  note,
  ok,
  personSealInput,
  personSigned,
  withEmployer,
} from '../../tests/support/sample';
import { canonicalize } from './jcs';
import { mergeSources, type MergeGroup, type MergeResult, type MergeSource } from './merge';
import { mergeHashOf } from './mergeRecord';
import type { MergeDecision, Questionnaire } from './model';
import {
  addReceipt,
  createQuestionnaire,
  latestSealed,
  receivedPartFor,
  sealPart,
  setValue,
  startPart,
} from './questionnaire';
import { verifyQuestionnaire } from './verify';
import { decodeQuestionnaire } from './questionnaireFile';

const registry = beispielRegistry();
const form = beispielForm();
const OTHER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const sha = (digit: string) => digit.repeat(64);

function merge(sources: MergeSource[], decisions: MergeDecision[] = []): MergeResult {
  return mergeSources(sources, { registry, decisions });
}

function only(result: MergeResult): MergeGroup {
  expect(result.groups).toHaveLength(1);
  const [group] = result.groups;
  if (!group) throw new Error('no group');
  return group;
}

function merged(group: MergeGroup): Questionnaire {
  if (!group.questionnaire) throw new Error(`conflicts: ${JSON.stringify(group.conflicts)}`);
  return group.questionnaire;
}

const noteCodes = (group: MergeGroup) => group.notes.map((n) => `${n.code}@${n.role ?? '-'}`);

/** The person re-signs at the employer (same device); the employer then seals, binding version 2. */
function resignedAtEmployer(): Questionnaire {
  let q = ok(startPart(personSigned(), form, 'person'));
  q = ok(setValue(q, form, 'person', 'bemerkungen', 'Beim Arbeitgeber ergänzt'));
  q = ok(
    sealPart(
      q,
      form,
      'person',
      personSealInput({
        nonce: 'c'.repeat(32),
        systemNote: note('2026-10-30T08:05:00.000+01:00', '2026-10-30T07:05:00.000Z', ['touch']),
      }),
    ),
  );
  const v2 = latestSealed(q, 'person');
  if (!v2) throw new Error('no v2');
  q = ok(startPart(q, form, 'arbeitgeber'));
  q = fill(q, 'arbeitgeber', {
    agNachname: 'Musterfrau',
    eintritt: '01.11.2026',
    bruttoMonat: '2.450,00',
  });
  return ok(
    sealPart(q, form, 'arbeitgeber', {
      nonce: 'f'.repeat(32),
      systemNote: note('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z', ['keyboard']),
      acknowledged: [],
      receivedParts: [
        receivedPartFor(
          v2,
          { local: '2026-10-30T08:06:00.000+01:00', utc: '2026-10-30T07:06:00.000Z' },
          'same-device',
        ),
      ],
    }),
  );
}

/** A second, independent first version of the person's part under the same id (not a chain). */
function competingPerson(): Questionnaire {
  let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
  q = fill(q, 'person', { ...PERSON_VALUES, nachname: 'Musterfrau-Beispiel' });
  return ok(sealPart(q, form, 'person', personSealInput({ nonce: 'd'.repeat(32) })));
}

/** The employer filled in a questionnaire of its own (other id), without the person's part. */
function employerSeparately(name = 'Musterfrau'): Questionnaire {
  let q = ok(startPart(createQuestionnaire(OTHER_ID, form), form, 'arbeitgeber'));
  q = fill(q, 'arbeitgeber', { agNachname: name, eintritt: '01.11.2026', bruttoMonat: '2.450,00' });
  return ok(
    sealPart(q, form, 'arbeitgeber', {
      nonce: 'e'.repeat(32),
      systemNote: note('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z', ['keyboard']),
      acknowledged: [],
    }),
  );
}

describe('mergeSources — one questionnaire', () => {
  it('passes a single file through unchanged and without merge record', () => {
    const q = withEmployer(personSigned());
    const group = only(merge([{ questionnaire: q, fileSha256: sha('1') }]));
    expect(merged(group)).toEqual(q);
    expect(group.notes).toEqual([]);
    expect(group.conflicts).toEqual([]);
  });

  it('collapses the person part that arrived directly and with the employer file', () => {
    const group = only(
      merge([
        { questionnaire: personSigned(), fileSha256: sha('1') },
        { questionnaire: withEmployer(personSigned()), fileSha256: sha('2') },
      ]),
    );
    const q = merged(group);
    expect(Object.keys(q.parts)).toEqual(['person', 'arbeitgeber']);
    expect(q.parts.person).toHaveLength(1);
    expect(noteCodes(group)).toEqual(['duplicateCollapsed@person']);
    expect(q.mergeRecord?.sources).toEqual([
      { fileSha256: sha('1'), questionnaireId: QUESTIONNAIRE_ID },
      { fileSha256: sha('2'), questionnaireId: QUESTIONNAIRE_ID },
    ]);
    expect(q.mergeHash).toBe(mergeHashOf(q));
    expect(verifyQuestionnaire(q, { registry }).level).toBe('ok');
  });

  it('lets the newer version win when the person re-signed at the employer, and names the change', () => {
    const group = only(
      merge([
        { questionnaire: personSigned(), fileSha256: sha('1') },
        { questionnaire: resignedAtEmployer(), fileSha256: sha('2') },
      ]),
    );
    const q = merged(group);
    expect(q.parts.person?.map((p) => p.seal?.payload.version)).toEqual([1, 2]);
    const newer = group.notes.find((n) => n.code === 'newerVersionWins');
    expect(newer?.detail).toEqual([
      'Beschäftigte Person',
      'Fassung 2 vom 30.10.2026, 08:05 Uhr ersetzt Fassung 1 vom 29.10.2026, 10:15 Uhr',
      'geändert: Bemerkungen',
    ]);
    expect(verifyQuestionnaire(q, { registry }).level).toBe('ok');
  });

  it('never picks between competing versions — a human must choose', () => {
    const group = only(
      merge([
        { questionnaire: personSigned(), fileSha256: sha('1') },
        { questionnaire: competingPerson(), fileSha256: sha('2') },
      ]),
    );
    expect(group.questionnaire).toBeUndefined();
    expect(group.conflicts).toHaveLength(1);
    const [conflict] = group.conflicts;
    expect(conflict?.code).toBe('versionConflict');
    expect(conflict?.candidates.map((c) => c.sources)).toEqual(
      expect.arrayContaining([[sha('1')], [sha('2')]]),
    );
    expect(conflict?.comparison).toEqual([
      {
        fieldId: 'nachname',
        values: expect.arrayContaining(['Musterfrau', 'Musterfrau-Beispiel']),
      },
    ]);
  });

  it('resolves the conflict by a recorded decision and drops the other version', () => {
    const chosen = latestSealed(competingPerson(), 'person')?.seal?.contentHash ?? '';
    const decision: MergeDecision = {
      kind: 'chooseVersion',
      questionnaireId: QUESTIONNAIRE_ID,
      role: 'person',
      contentHash: chosen,
    };
    const group = only(
      merge(
        [
          { questionnaire: personSigned(), fileSha256: sha('1') },
          { questionnaire: competingPerson(), fileSha256: sha('2') },
        ],
        [decision],
      ),
    );
    const q = merged(group);
    expect(q.parts.person?.map((p) => p.seal?.contentHash)).toEqual([chosen]);
    expect(q.mergeRecord?.decisions).toEqual([decision]);
    expect(noteCodes(group)).toEqual(['versionChosen@person']);
    expect(verifyQuestionnaire(q, { registry }).level).toBe('ok');
  });

  it('reports a choice that names no present version', () => {
    const group = only(
      merge(
        [
          { questionnaire: personSigned(), fileSha256: sha('1') },
          { questionnaire: competingPerson(), fileSha256: sha('2') },
        ],
        [
          {
            kind: 'chooseVersion',
            questionnaireId: QUESTIONNAIRE_ID,
            role: 'person',
            contentHash: sha('9'),
          },
        ],
      ),
    );
    expect(group.conflicts.map((c) => c.code)).toEqual(['choiceInvalid']);
  });

  it('refuses different form versions under one id', () => {
    const group = only(
      merge([
        { questionnaire: personSigned(), fileSha256: sha('1') },
        { questionnaire: minorSigned(guardianForm()), fileSha256: sha('2') },
      ]),
    );
    expect(group.conflicts.map((c) => c.code)).toEqual(['formMismatch']);
    expect(group.questionnaire).toBeUndefined();
  });
});

describe('mergeSources — what is left out', () => {
  it('ignores open drafts', () => {
    const withDraft = ok(startPart(personSigned(), form, 'arbeitgeber'));
    const group = only(merge([{ questionnaire: withDraft, fileSha256: sha('1') }]));
    expect(Object.keys(merged(group).parts)).toEqual(['person']);
    expect(noteCodes(group)).toEqual(['draftIgnored@arbeitgeber']);
  });

  it('leaves out an altered copy and keeps the intact one', () => {
    const tampered = structuredClone(personSigned());
    const person = tampered.parts.person?.[0];
    if (person) person.data.nachname = 'Mustermann';
    const group = only(
      merge([
        { questionnaire: tampered, fileSha256: sha('1') },
        { questionnaire: personSigned(), fileSha256: sha('2') },
      ]),
    );
    expect(merged(group).parts.person?.[0]?.data.nachname).toBe('Musterfrau');
    expect(group.notes).toEqual([
      {
        code: 'invalidExcluded',
        role: 'person',
        detail: ['Beschäftigte Person', 'Fassung 1', 'dataChanged'],
      },
    ]);
  });

  it('reports a version whose predecessor is missing', () => {
    const both = resignedAtEmployer();
    const tampered = structuredClone(both);
    const v1 = tampered.parts.person?.[0];
    if (v1) v1.data.nachname = 'Mustermann';
    const group = only(merge([{ questionnaire: tampered, fileSha256: sha('1') }]));
    expect(group.conflicts.map((c) => `${c.code}@${c.role ?? '-'}`)).toEqual([
      'chainIncomplete@person',
    ]);
  });

  it('does not trust a merged file whose merge record was altered', () => {
    const first = merged(
      only(
        merge([
          { questionnaire: personSigned(), fileSha256: sha('1') },
          { questionnaire: withEmployer(personSigned()), fileSha256: sha('2') },
        ]),
      ),
    );
    const altered = structuredClone(first);
    altered.mergeRecord?.sources.pop();
    const group = only(merge([{ questionnaire: altered, fileSha256: sha('3') }]));
    expect(merged(group).parts).toEqual({});
    expect(
      group.notes.every((n) => n.code === 'invalidExcluded' && n.detail.includes('mergeAltered')),
    ).toBe(true);
    expect(group.notes).toHaveLength(2);
  });
});

describe('mergeSources — questionnaires without a shared id', () => {
  it('proposes joining parts whose names agree, but does not join them', () => {
    const result = merge([
      { questionnaire: personSigned(), fileSha256: sha('1') },
      { questionnaire: employerSeparately(), fileSha256: sha('2') },
    ]);
    expect(result.groups).toHaveLength(2);
    expect(result.proposals).toEqual([
      { questionnaireIds: [QUESTIONNAIRE_ID, OTHER_ID], matchKeys: ['Nachname'] },
    ]);
  });

  it('proposes nothing when the names differ', () => {
    const result = merge([
      { questionnaire: personSigned(), fileSha256: sha('1') },
      { questionnaire: employerSeparately('Beispiel'), fileSha256: sha('2') },
    ]);
    expect(result.proposals).toEqual([]);
  });

  it('joins them on a link decision; verification marks the missing cryptographic link', () => {
    const link: MergeDecision = { kind: 'link', questionnaireIds: [QUESTIONNAIRE_ID, OTHER_ID] };
    const result = merge(
      [
        { questionnaire: personSigned(), fileSha256: sha('1') },
        { questionnaire: employerSeparately(), fileSha256: sha('2') },
      ],
      [link],
    );
    const group = only(result);
    const q = merged(group);
    expect(q.questionnaireId).toBe(QUESTIONNAIRE_ID < OTHER_ID ? QUESTIONNAIRE_ID : OTHER_ID);
    expect(group.sourceIds).toEqual([QUESTIONNAIRE_ID, OTHER_ID].sort());
    expect(noteCodes(group)).toEqual(['linked@-']);
    expect(result.proposals).toEqual([]);
    const verdict = verifyQuestionnaire(q, { registry });
    expect(verdict.level).toBe('warnings');
    expect(
      verdict.parts.flatMap((p) => p.findings.map((f) => `${f.code}@${f.role ?? '-'}`)),
    ).toEqual(['linkedByDecision@arbeitgeber']);
  });

  it('keeps the link when the merged file is merged again', () => {
    const link: MergeDecision = { kind: 'link', questionnaireIds: [QUESTIONNAIRE_ID, OTHER_ID] };
    const once = merged(
      only(
        merge(
          [
            { questionnaire: personSigned(), fileSha256: sha('1') },
            { questionnaire: employerSeparately(), fileSha256: sha('2') },
          ],
          [link],
        ),
      ),
    );
    const again = merged(only(merge([{ questionnaire: once, fileSha256: sha('7') }])));
    expect(canonicalize(again)).toBe(canonicalize(once));
  });
});

describe('mergeSources — properties', () => {
  const a: MergeSource = { questionnaire: personSigned(), fileSha256: sha('1') };
  const b: MergeSource = { questionnaire: withEmployer(personSigned()), fileSha256: sha('2') };
  const withReceipt = withEmployer(personSigned());
  const c: MergeSource = {
    questionnaire: ok(addReceipt(withReceipt, kanzleiReceipt(withReceipt))),
    fileSha256: sha('3'),
  };

  it('is associative: merging a merged file with more files equals merging all at once', () => {
    const ab = merged(only(merge([a, b])));
    const stepwise = merged(only(merge([{ questionnaire: ab, fileSha256: sha('8') }, c])));
    const atOnce = merged(only(merge([a, b, c])));
    expect(canonicalize(stepwise)).toBe(canonicalize(atOnce));
  });

  it('does not depend on the order of the files', () => {
    expect(canonicalize(merged(only(merge([c, b, a]))))).toBe(
      canonicalize(merged(only(merge([a, b, c])))),
    );
  });

  it('is idempotent: merging the result again changes nothing', () => {
    const once = merged(only(merge([a, b, c])));
    expect(canonicalize(merged(only(merge([{ questionnaire: once, fileSha256: sha('9') }]))))).toBe(
      canonicalize(once),
    );
  });

  it('keeps every receipt and protects record and receipts by the merge hash', () => {
    const q = merged(only(merge([a, b, c])));
    expect(q.receipts).toHaveLength(1);
    const altered = structuredClone(q);
    const receipt = altered.receipts[0];
    if (receipt) receipt.station = 'Jemand anderes';
    expect(verifyQuestionnaire(altered, { registry }).findings.map((f) => f.code)).toContain(
      'mergeAltered',
    );
  });
});

describe('mergeSources — contradictions and gaps', () => {
  it('shows a contradicting name and the missing employer part', () => {
    const group = only(merge([{ questionnaire: personSigned(), fileSha256: sha('1') }]));
    expect(group.gaps.map((g) => g.code)).toEqual(['roleMissing']);
    let q = ok(startPart(personSigned(), form, 'arbeitgeber'));
    q = fill(q, 'arbeitgeber', {
      agNachname: 'Mustermann',
      eintritt: '01.11.2026',
      bruttoMonat: '1',
    });
    q = ok(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'e'.repeat(32),
        systemNote: note('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z'),
        acknowledged: [],
      }),
    );
    const withEmployerName = only(merge([{ questionnaire: q, fileSha256: sha('2') }]));
    expect(withEmployerName.contradictions).toEqual([
      {
        message: 'Der Nachname weicht zwischen den Angaben ab.',
        fields: ['nachname', 'agNachname'],
        values: ['Musterfrau', 'Mustermann'],
      },
    ]);
    expect(withEmployerName.gaps).toEqual([]);
  });

  it('treats a name differing only in case as no contradiction', () => {
    let q = ok(startPart(personSigned(), form, 'arbeitgeber'));
    q = fill(q, 'arbeitgeber', {
      agNachname: 'MUSTERFRAU',
      eintritt: '01.11.2026',
      bruttoMonat: '1',
    });
    q = ok(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'e'.repeat(32),
        systemNote: note('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z'),
        acknowledged: [],
      }),
    );
    expect(only(merge([{ questionnaire: q, fileSha256: sha('2') }])).contradictions).toEqual([]);
  });
});

describe('merged files on disk', () => {
  const link: MergeDecision = { kind: 'link', questionnaireIds: [QUESTIONNAIRE_ID, OTHER_ID] };
  const linked = () =>
    merged(
      only(
        merge(
          [
            { questionnaire: personSigned(), fileSha256: sha('1') },
            { questionnaire: employerSeparately(), fileSha256: sha('2') },
          ],
          [link],
        ),
      ),
    );

  it('decode without any change, decisions included', () => {
    const raw: unknown = JSON.parse(JSON.stringify(linked()));
    const result = decodeQuestionnaire(raw);
    expect(result.ok ? [] : result.issues).toEqual([]);
    if (result.ok) expect(canonicalize(result.questionnaire)).toBe(canonicalize(raw));
  });

  it.each<[string, unknown, string]>([
    [
      'a link with one id',
      { kind: 'link', questionnaireIds: [QUESTIONNAIRE_ID] },
      'needs at least 2',
    ],
    [
      'a link naming an id twice',
      { kind: 'link', questionnaireIds: [OTHER_ID, OTHER_ID] },
      'twice',
    ],
    ['an unknown decision', { kind: 'override', questionnaireIds: [] }, 'link'],
    [
      'a choice without hash',
      { kind: 'chooseVersion', questionnaireId: QUESTIONNAIRE_ID, role: 'person' },
      'missing required property',
    ],
  ])('reject %s', (_label, decision, message) => {
    const raw = JSON.parse(JSON.stringify(linked())) as { mergeRecord: { decisions: unknown[] } };
    raw.mergeRecord.decisions = [decision];
    const result = decodeQuestionnaire(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain(message);
  });
});
