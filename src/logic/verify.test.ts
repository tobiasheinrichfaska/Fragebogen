import {
  QUESTIONNAIRE_ID,
  beispielForm,
  beispielRegistry,
  newVersion,
  ok,
  personSigned,
  twoRoles,
  withEmployer,
} from '../../tests/support/sample';
import { buildFormRegistry } from './formRegistry';
import type { Part, Questionnaire } from './model';
import { addReceipt, startPart } from './questionnaire';
import { contentHashOf, fieldHash } from './seal';
import { encodeStrokes } from './strokes';
import {
  FINDING_MESSAGES,
  FINDING_SEVERITY,
  LEVEL_LABELS,
  allFindings,
  verifyQuestionnaire,
  type FindingCode,
  type Verdict,
} from './verify';

const registry = beispielRegistry();

function verify(q: Questionnaire): Verdict {
  return verifyQuestionnaire(q, { registry });
}

function levels(verdict: Verdict): Record<string, string> {
  return Object.fromEntries(verdict.parts.map((p) => [`${p.role}#${p.position}`, p.level]));
}

function codes(verdict: Verdict): string[] {
  return allFindings(verdict).map((f) => (f.role ? `${f.code}@${f.role}` : f.code));
}

function versionOf(q: Questionnaire, role: string, index = 0): Part {
  const part = q.parts[role]?.[index];
  if (!part) throw new Error(`no part ${role}#${index}`);
  return part;
}

function sealOf(part: Part) {
  if (!part.seal) throw new Error('not sealed');
  return part.seal;
}

/** Re-seals a tampered payload so that level 1 holds again — what a deliberate forger would do. */
function forgeReseal(part: Part): void {
  const seal = sealOf(part);
  seal.payload.fieldHashes = Object.fromEntries(
    Object.entries(part.data).map(([id, value]) => [id, fieldHash(seal.payload.nonce, id, value)]),
  );
  seal.contentHash = contentHashOf(seal.payload);
}

describe('verifyQuestionnaire — clean scenarios', () => {
  it('confirms both parts of the two-role scenario', () => {
    const verdict = verify(twoRoles());
    expect(verdict.level).toBe('ok');
    expect(allFindings(verdict)).toEqual([]);
    expect(levels(verdict)).toEqual({ 'person#0': 'confirmed', 'arbeitgeber#0': 'confirmed' });
    const person = verdict.parts[0];
    expect(person?.confirmations).toEqual([
      { kind: 'seal', role: 'arbeitgeber' },
      { kind: 'receipt', station: 'Kanzlei', source: 'datev' },
    ]);
    expect(person?.current).toBe(true);
  });

  it('rates a single sealed part as consistent but unconfirmed', () => {
    const verdict = verify(personSigned());
    expect(verdict.level).toBe('ok');
    expect(levels(verdict)).toEqual({ 'person#0': 'consistent' });
  });

  it('rates an open draft as draft', () => {
    const q = ok(startPart(personSigned(), beispielForm(), 'arbeitgeber'));
    expect(levels(verify(q))).toEqual({ 'person#0': 'consistent', 'arbeitgeber#0': 'draft' });
  });

  it('marks a reference to an older version and confirms only that version', () => {
    const verdict = verify(newVersion());
    expect(verdict.level).toBe('warnings');
    expect(levels(verdict)).toEqual({
      'person#0': 'confirmed',
      'person#1': 'consistent',
      'arbeitgeber#0': 'consistent',
    });
    expect(codes(verdict)).toEqual(['referencesOtherVersion@arbeitgeber']);
    expect(verdict.parts.find((p) => p.role === 'person' && p.position === 1)?.current).toBe(true);
  });

  it('works without a registry, but then cannot check against the form', () => {
    expect(verifyQuestionnaire(twoRoles()).level).toBe('ok');
    const empty = buildFormRegistry([], []);
    if (!empty.ok) throw new Error('registry');
    const verdict = verifyQuestionnaire(twoRoles(), { registry: empty.registry });
    expect(verdict.level).toBe('warnings');
    expect(codes(verdict)).toEqual(['unknownDefinition']);
  });
});

describe('verifyQuestionnaire — tamper matrix', () => {
  it.each<[string, (q: Questionnaire) => void, readonly string[]]>([
    [
      'a changed value',
      (q) => {
        versionOf(q, 'person').data.nachname = 'Mustermann';
      },
      ['dataChanged@person'],
    ],
    [
      'a removed value',
      (q) => {
        delete versionOf(q, 'person').data.bemerkungen;
      },
      ['dataChanged@person'],
    ],
    [
      'an added value',
      (q) => {
        versionOf(q, 'person').data.weitereArt2 = 'sv';
      },
      ['dataChanged@person'],
    ],
    [
      'a hidden answer revived',
      (q) => {
        const person = versionOf(q, 'person');
        person.data.weitereBeschaeftigung = false;
      },
      ['dataChanged@person'],
    ],
    [
      'an edited field hash',
      (q) => {
        sealOf(versionOf(q, 'person')).payload.fieldHashes.nachname = '0'.repeat(16);
      },
      ['payloadAltered@person'],
    ],
    [
      'an edited content hash',
      (q) => {
        sealOf(versionOf(q, 'person')).contentHash = 'f'.repeat(64);
      },
      ['payloadAltered@person', 'referencesUnknownPart@arbeitgeber', 'referencesUnknownPart'],
    ],
    [
      'an edited signing time',
      (q) => {
        sealOf(versionOf(q, 'person')).payload.systemNote.signedAtUtc = '2026-10-28T09:15:00.000Z';
      },
      ['payloadAltered@person'],
    ],
    [
      'a swapped signature image',
      (q) => {
        versionOf(q, 'person').signatureStrokes = encodeStrokes([[{ x: 1, y: 1 }]]);
      },
      ['signatureImageChanged@person'],
    ],
    [
      'a removed signature image',
      (q) => {
        delete versionOf(q, 'person').signatureStrokes;
      },
      ['signatureImageChanged@person'],
    ],
    [
      'strokes added to an unsigned part',
      (q) => {
        versionOf(q, 'arbeitgeber').signatureStrokes = '1,1';
      },
      ['signatureImageChanged@arbeitgeber'],
    ],
    [
      'a downgraded status',
      (q) => {
        versionOf(q, 'person').status = 'sealed';
      },
      ['statusMismatch@person'],
    ],
    [
      'a seal removed but status kept',
      (q) => {
        delete versionOf(q, 'arbeitgeber').seal;
      },
      ['statusMismatch@arbeitgeber', 'referencesUnknownPart'],
    ],
    [
      'a part filed under another role',
      (q) => {
        const person = q.parts.person;
        if (!person) throw new Error('no person');
        q.parts.vertretung = person;
        delete q.parts.person;
      },
      [
        'misfiled@vertretung',
        'misfiled@vertretung',
        'referencesUnknownPart@arbeitgeber',
        'referencesUnknownPart',
      ],
    ],
    [
      'another questionnaire id',
      (q) => {
        q.questionnaireId = '11111111-2222-4333-8444-555555555555';
      },
      ['misfiled@person', 'misfiled@arbeitgeber'],
    ],
    [
      'another form version in the container',
      (q) => {
        q.form.version = '1.1.0';
      },
      ['misfiled', 'misfiled@person', 'misfiled@arbeitgeber'],
    ],
    [
      'a receipt for an unknown hash',
      (q) => {
        const ref = q.receipts[0]?.parts[0];
        if (ref) ref.contentHash = 'b'.repeat(64);
      },
      ['referencesUnknownPart'],
    ],
    [
      'a receipt dated before the signature',
      (q) => {
        const receipt = q.receipts[0];
        if (!receipt) throw new Error('no receipt');
        receipt.receivedAtLocal = '2026-10-29T09:00:00.000+01:00';
        receipt.receivedAtUtc = '2026-10-29T08:00:00.000Z';
      },
      ['timeImplausible', 'timeImplausible'],
    ],
    [
      'a receipt with contradicting times',
      (q) => {
        const receipt = q.receipts[0];
        if (receipt) receipt.receivedAtLocal = '2026-11-02T09:00:00.000+02:00';
      },
      ['timeInconsistent'],
    ],
    [
      'a receipt half a year later',
      (q) => {
        const receipt = q.receipts[0];
        if (!receipt) throw new Error('no receipt');
        receipt.receivedAtLocal = '2027-05-02T09:00:00.000+02:00';
        receipt.receivedAtUtc = '2027-05-02T07:00:00.000Z';
      },
      ['staleAtReceipt', 'staleAtReceipt'],
    ],
  ])('detects %s', (_label, tamper, expected) => {
    const q = structuredClone(twoRoles());
    tamper(q);
    const verdict = verify(q);
    expect(codes(verdict).sort()).toEqual([...expected].sort());
    const severeExpected = expected.some(
      (code) => FINDING_SEVERITY[code.split('@')[0] as FindingCode] === 'error',
    );
    expect(verdict.level).toBe(severeExpected ? 'invalid' : 'warnings');
  });

  it('names the changed fields', () => {
    const q = structuredClone(twoRoles());
    versionOf(q, 'person').data.nachname = 'Mustermann';
    delete versionOf(q, 'person').data.bemerkungen;
    const person = verify(q).parts[0];
    expect(person?.level).toBe('invalid');
    expect(person?.fieldDiff).toEqual({
      changed: ['nachname'],
      missing: ['bemerkungen'],
      extra: [],
    });
    expect(person?.findings[0]?.detail).toEqual(['geändert: nachname', 'fehlt: bemerkungen']);
  });

  it('does not let an altered part confirm others', () => {
    const q = structuredClone(twoRoles());
    sealOf(versionOf(q, 'arbeitgeber')).contentHash = 'f'.repeat(64);
    const verdict = verify(q);
    expect(verdict.parts[0]?.confirmations).toEqual([
      { kind: 'receipt', station: 'Kanzlei', source: 'datev' },
    ]);
  });

  it('a full re-seal by a forger passes level 1 but loses every confirmation', () => {
    const q = structuredClone(twoRoles());
    const person = versionOf(q, 'person');
    person.data.steuerId = '65929970489';
    forgeReseal(person);
    const verdict = verify(q);
    expect(verdict.parts[0]?.level).toBe('consistent');
    expect(verdict.parts[0]?.confirmations).toEqual([]);
    expect(codes(verdict).sort()).toEqual([
      'referencesUnknownPart',
      'referencesUnknownPart@arbeitgeber',
    ]);
  });

  it('checks the fields against the form when the payload was forged consistently', () => {
    const q = structuredClone(twoRoles());
    const person = versionOf(q, 'person');
    person.data.agNachname = 'Fremdfeld';
    sealOf(person).payload.confirmationText = 'Anderer Text';
    sealOf(person).payload.acknowledgements = [];
    forgeReseal(person);
    expect(codes(verify(q))).toEqual(
      expect.arrayContaining([
        'fieldSetMismatch@person',
        'confirmationTextChanged@person',
        'noticeMismatch@person',
      ]),
    );
  });

  it('flags a seal without the required signature', () => {
    const q = structuredClone(twoRoles());
    const person = versionOf(q, 'person');
    delete sealOf(person).payload.signature;
    delete person.signatureStrokes;
    person.status = 'sealed';
    forgeReseal(person);
    expect(codes(verify(q))).toEqual(expect.arrayContaining(['signatureMissing@person']));
  });
});

describe('verifyQuestionnaire — versions and chain', () => {
  it.each<[string, (q: Questionnaire) => void, readonly string[]]>([
    [
      'the older version removed',
      (q) => {
        q.parts.person?.shift();
      },
      ['chainBroken@person', 'referencesUnknownPart@arbeitgeber'],
    ],
    [
      'the versions swapped',
      (q) => {
        q.parts.person?.reverse();
      },
      ['chainBroken@person', 'chainBroken@person'],
    ],
    [
      'a draft before a sealed version',
      (q) => {
        q.parts.person?.unshift({ role: 'person', status: 'draft', data: {} });
      },
      ['draftNotLast@person', 'referencesOtherVersion@arbeitgeber'],
    ],
  ])('detects %s', (_label, tamper, expected) => {
    const q = structuredClone(newVersion());
    tamper(q);
    expect(codes(verify(q)).sort()).toEqual([...expected].sort());
  });

  it('flags a receipt that received an older version', () => {
    const q = newVersion();
    const v1 = sealOf(versionOf(q, 'person', 0));
    const receipt = {
      station: 'Kanzlei',
      receivedAtLocal: '2026-11-02T09:00:00.000+01:00',
      receivedAtUtc: '2026-11-02T08:00:00.000Z',
      timeZone: 'Europe/Berlin',
      source: 'app' as const,
      fileName: `${QUESTIONNAIRE_ID}.pdf`,
      fileSha256: 'b'.repeat(64),
      parts: [{ role: 'person', contentHash: v1.contentHash }],
      appVersion: '0.1.0',
    };
    const verdict = verify(ok(addReceipt(q, receipt)));
    expect(codes(verdict)).toContain('referencesOtherVersion');
  });

  it('flags a received part that is newer than the receiving seal', () => {
    const q = structuredClone(withEmployer(personSigned()));
    const received = sealOf(versionOf(q, 'arbeitgeber')).payload.receivedParts[0];
    if (!received) throw new Error('no receipt note');
    received.receivedAtLocal = '2026-10-31T08:00:00.000+01:00';
    received.receivedAtUtc = '2026-10-31T07:00:00.000Z';
    forgeReseal(versionOf(q, 'arbeitgeber'));
    expect(codes(verify(q))).toEqual(['timeImplausible@arbeitgeber']);
  });
});

describe('messages', () => {
  it('has a German sentence for every finding and level', () => {
    for (const message of [...Object.values(FINDING_MESSAGES), ...Object.values(LEVEL_LABELS)]) {
      expect(message).toMatch(/^[A-ZÄÖÜ]/);
    }
    expect(Object.keys(FINDING_MESSAGES).sort()).toEqual(Object.keys(FINDING_SEVERITY).sort());
  });
});
