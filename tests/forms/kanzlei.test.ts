// The Kanzlei station with the Sofortmeldung: files in, duplicates, human decisions, receipts per
// file and the verification level they give. Fictitious data.
import {
  addToInbox,
  decide,
  EMPTY_INBOX,
  filesOfGroup,
  KANZLEI_STATION,
  mergeInbox,
  removeFromInbox,
  withdraw,
  withKanzleiReceipts,
  type Inbox,
  type InboxFile,
} from '../../src/logic/kanzlei';
import { registryOf } from '../../src/logic/formRegistry';
import type { Questionnaire } from '../../src/logic/model';
import {
  acknowledge,
  answer,
  enterRole,
  seal,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { NONCE_PERSON_V2, note, STROKES } from '../support/sample';
import {
  completeSofortmeldung,
  employerOnly,
  sofortmeldung,
} from '../support/sofortmeldungSession';

const published = registryOf([sofortmeldung]);
const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

let counter = 0;
function file(questionnaire: Questionnaire, name: string, minute = 0): InboxFile {
  counter += 1;
  return {
    name,
    fileSha256: counter.toString(16).padStart(64, '0'),
    questionnaire,
    form: sofortmeldung,
    origin: 'published',
    received: {
      local: `2026-10-30T11:${String(minute).padStart(2, '0')}:00.000+01:00`,
      utc: `2026-10-30T10:${String(minute).padStart(2, '0')}:00.000Z`,
      timeZone: 'Europe/Berlin',
    },
  };
}

/** The person signs over the same employer part, with another first name — a competing version. */
function otherPersonVersion(): Questionnaire {
  let s = must(enterRole(employerOnly(), 'person'));
  for (const [id, raw] of Object.entries({
    familienname: 'Müller-Lüdenscheidt',
    vorname: 'Jürgen Paul',
    geburtsdatum: '17.05.1990',
    geburtsort: 'Musterstadt',
    geburtsland: 'Deutschland',
    geschlecht: 'maennlich',
    staatsangehoerigkeit: 'deutsch',
    strasse: 'Musterweg 1',
    postleitzahl: '12345',
    wohnort: 'Musterstadt',
  })) {
    s = must(answer(s, id, raw));
  }
  s = acknowledge(acknowledge(s, 'datenschutz', true), 'mitfuehrungspflicht', true);
  const at = { local: '2026-10-30T09:10:00.000+01:00', utc: '2026-10-30T08:10:00.000Z' };
  return must(
    seal(s, {
      nonce: NONCE_PERSON_V2,
      systemNote: note(at.local, at.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: at,
    }),
  ).questionnaire;
}

/** The person alone, in a questionnaire of their own (another id than the employer's). */
function personOnly(): Questionnaire {
  let s = must(
    enterRole(startSession(sofortmeldung, '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'), 'person'),
  );
  for (const [id, raw] of Object.entries({
    familienname: 'Müller-Lüdenscheidt',
    vorname: 'Jürgen',
    geburtsdatum: '17.05.1990',
    geburtsort: 'Musterstadt',
    geburtsland: 'Deutschland',
    geschlecht: 'maennlich',
    staatsangehoerigkeit: 'deutsch',
    strasse: 'Musterweg 1',
    postleitzahl: '12345',
    wohnort: 'Musterstadt',
  })) {
    s = must(answer(s, id, raw));
  }
  s = acknowledge(acknowledge(s, 'datenschutz', true), 'mitfuehrungspflicht', true);
  const at = { local: '2026-10-30T09:20:00.000+01:00', utc: '2026-10-30T08:20:00.000Z' };
  return must(
    seal(s, {
      nonce: NONCE_PERSON_V2,
      systemNote: note(at.local, at.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: at,
    }),
  ).questionnaire;
}

function inboxOf(...files: InboxFile[]): Inbox {
  return files.reduce((inbox, f) => addToInbox(inbox, f).inbox, EMPTY_INBOX);
}

describe('Kanzlei inbox', () => {
  it('takes the same file once and says so', () => {
    const a = file(employerOnly().questionnaire, 'a.pdf');
    const once = addToInbox(EMPTY_INBOX, a);
    const twice = addToInbox(once.inbox, a);
    expect(once.duplicate).toBe(false);
    expect(twice.duplicate).toBe(true);
    expect(twice.inbox.files).toHaveLength(1);
  });

  it('merges the employer file and the complete file into one questionnaire', () => {
    const employerFile = file(employerOnly().questionnaire, 'arbeitgeber.pdf', 1);
    const completeFile = file(completeSofortmeldung().questionnaire, 'vollstaendig.pdf', 2);
    const inbox = inboxOf(completeFile, employerFile);
    const { groups } = mergeInbox(inbox, published);
    expect(groups).toHaveLength(1);
    const [group] = groups;
    if (!group) throw new Error('no group');
    expect(group.conflicts).toEqual([]);
    expect(group.gaps).toEqual([]);
    expect(group.notes.map((n) => n.code)).toContain('duplicateCollapsed');
    expect(filesOfGroup(group, inbox).map((f) => f.name)).toEqual([
      'arbeitgeber.pdf',
      'vollstaendig.pdf',
    ]);
  });

  it('records one receipt per file with the parts it brought, and every part is confirmed', () => {
    const employerFile = file(employerOnly().questionnaire, 'arbeitgeber.pdf', 1);
    const completeFile = file(completeSofortmeldung().questionnaire, 'vollstaendig.pdf', 2);
    const inbox = inboxOf(employerFile, completeFile);
    const [group] = mergeInbox(inbox, published).groups;
    if (!group) throw new Error('no group');
    const result = withKanzleiReceipts(group, inbox, '0.1.0');
    if (!result) throw new Error('no questionnaire');
    expect(result.refused).toEqual([]);
    const receipts = result.questionnaire.receipts;
    expect(receipts.map((r) => [r.fileName, r.parts.map((p) => p.role)])).toEqual([
      ['arbeitgeber.pdf', ['arbeitgeber']],
      ['vollstaendig.pdf', ['person']],
    ]);
    expect(receipts.every((r) => r.station === KANZLEI_STATION && r.source === 'app')).toBe(true);
    const verdict = verifyQuestionnaire(result.questionnaire, { registry: published });
    expect(verdict.level).not.toBe('invalid');
    expect(verdict.parts.every((p) => p.level === 'confirmed')).toBe(true);
  });

  it('adds no second receipt when the merged file is read again', () => {
    const inbox = inboxOf(file(completeSofortmeldung().questionnaire, 'vollstaendig.pdf', 2));
    const [group] = mergeInbox(inbox, published).groups;
    if (!group) throw new Error('no group');
    const first = withKanzleiReceipts(group, inbox, '0.1.0');
    if (!first) throw new Error('no questionnaire');
    const again = inboxOf(file(first.questionnaire, 'zusammengefuehrt.pdf', 30));
    const [regroup] = mergeInbox(again, published).groups;
    if (!regroup) throw new Error('no group');
    const second = withKanzleiReceipts(regroup, again, '0.1.0');
    expect(second?.questionnaire.receipts).toEqual(first.questionnaire.receipts);
  });

  it('leaves competing versions to a human; a choice resolves them and can be withdrawn', () => {
    const one = file(completeSofortmeldung().questionnaire, 'eins.pdf', 1);
    const two = file(otherPersonVersion(), 'zwei.pdf', 2);
    const inbox = inboxOf(one, two);
    const [group] = mergeInbox(inbox, published).groups;
    const conflict = group?.conflicts[0];
    expect(conflict?.code).toBe('versionConflict');
    expect(group?.questionnaire).toBeUndefined();
    expect(conflict?.comparison.map((c) => c.fieldId)).toContain('vorname');

    const chosen = conflict?.candidates[0]?.contentHash ?? '';
    const decision = {
      kind: 'chooseVersion' as const,
      questionnaireId: group?.questionnaireId ?? '',
      role: 'person',
      contentHash: chosen,
    };
    const decided = decide(inbox, decision);
    const [resolved] = mergeInbox(decided, published).groups;
    expect(resolved?.conflicts).toEqual([]);
    expect(resolved?.questionnaire?.mergeRecord?.decisions).toEqual([decision]);

    const other = conflict?.candidates[1]?.contentHash ?? '';
    const changed = decide(decided, { ...decision, contentHash: other });
    expect(changed.decisions).toEqual([{ ...decision, contentHash: other }]);
    expect(withdraw(changed, { ...decision, contentHash: other }).decisions).toEqual([]);
  });

  it('drops decisions about questionnaires whose files were removed', () => {
    const one = file(completeSofortmeldung().questionnaire, 'eins.pdf', 1);
    const two = file(otherPersonVersion(), 'zwei.pdf', 2);
    const decided = decide(inboxOf(one, two), {
      kind: 'chooseVersion',
      questionnaireId: one.questionnaire.questionnaireId,
      role: 'person',
      contentHash: 'b'.repeat(64),
    });
    expect(removeFromInbox(decided, two.fileSha256).decisions).toHaveLength(1);
    const empty = removeFromInbox(removeFromInbox(decided, two.fileSha256), one.fileSha256);
    expect(empty).toEqual(EMPTY_INBOX);
  });

  it('proposes to join separate questionnaires of person and employer; joined, they still need a link', () => {
    const inbox = inboxOf(
      file(employerOnly().questionnaire, 'arbeitgeber.pdf', 1),
      file(personOnly(), 'person.pdf', 2),
    );
    const before = mergeInbox(inbox, published);
    expect(before.groups).toHaveLength(2);
    expect(before.groups.every((g) => g.gaps.some((gap) => gap.code === 'roleMissing'))).toBe(true);
    expect(before.proposals).toEqual([
      { questionnaireIds: expect.any(Array), matchKeys: ['Familienname', 'Vornamen'] },
    ]);

    const ids = before.proposals[0]?.questionnaireIds ?? ['', ''];
    const after = mergeInbox(
      decide(inbox, { kind: 'link', questionnaireIds: [...ids] }),
      published,
    );
    expect(after.groups).toHaveLength(1);
    expect(after.proposals).toEqual([]);
    expect(after.groups[0]?.gaps.map((gap) => gap.code)).toEqual(['partsNotLinked']);
  });
});
