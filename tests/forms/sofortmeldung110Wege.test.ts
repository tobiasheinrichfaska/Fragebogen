// Sofortmeldung 1.1.0 played to the end on every side path (check of 2026-11-08: the station tests
// run on the frozen 0.1.0, which lacks 13 of its 32 fields). Each case fills both parts the way
// the UI does, seals them, writes the PDF, reads it back and merges it at the Kanzlei. All data
// invented.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import { writeQuestionnairePdf, type PdfFonts } from '../../src/io/pdfWriter';
import { decodePackage } from '../../src/logic/dataPackage';
import { decodeDataLines } from '../../src/logic/dataPages';
import { registryOf } from '../../src/logic/formRegistry';
import { sha256Hex } from '../../src/logic/hash';
import { canonicalize } from '../../src/logic/jcs';
import { addToInbox, EMPTY_INBOX, mergeInbox } from '../../src/logic/kanzlei';
import { transmissionBlockers } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  seal,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import {
  NONCE_EMPLOYER,
  NONCE_GUARDIAN,
  NONCE_PERSON,
  QUESTIONNAIRE_ID,
  STROKES,
  note,
} from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '1.1.0.json')));
const registry = registryOf([form]);

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};
const PDFJS = pdfjs as unknown as PdfJsLike;
const at = (local: string, utc: string) => ({ local, utc });
const EMPLOYER_AT = at('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z');
const PERSON_AT = at('2026-10-30T09:00:00.000+01:00', '2026-10-30T08:00:00.000Z');
const GUARDIAN_AT = at('2026-10-30T09:05:00.000+01:00', '2026-10-30T08:05:00.000Z');
const CREATED = at('2026-10-30T10:00:00.000+01:00', '2026-10-30T09:00:00.000Z');

type Answers = Readonly<Record<string, unknown>>;

const EMPLOYER: Answers = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agBranche: 'bau',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
};

const PERSON: Answers = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  namensbestandteile: false,
  geburtsnameWieFamilienname: true,
  geburtsdatum: '17.05.1990',
  geborenInDeutschland: true,
  geburtsort: 'Musterstadt',
  geschlecht: 'weiblich',
  deutscheStaatsangehoerigkeit: true,
  versicherungsnummer: '65 170590 M 520',
  anschriftAusland: false,
  strassenname: 'Musterweg',
  hausnummer: '1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

/**
 * Answers in passes, as a person may answer a question only once it is asked: a follow-up waits
 * for the answer that opens it. A key set to undefined is left out (e.g. the German postcode).
 */
function fill(session: Session, values: Answers): Session {
  let s = session;
  let open = Object.entries(values).filter(([, value]) => value !== undefined);
  while (open.length > 0) {
    const refused: [string, unknown][] = [];
    for (const [id, value] of open) {
      const result = answer(s, id, value);
      if (result.ok) s = result.session;
      else refused.push([id, value]);
    }
    if (refused.length === open.length) {
      throw new Error(`not taken: ${refused.map(([id]) => id).join(', ')}`);
    }
    open = refused;
  }
  return s;
}

function employerSeals(s: Session, answers: Answers): SessionResult {
  return seal(fill(must(enterRole(s, 'arbeitgeber')), answers), {
    nonce: NONCE_EMPLOYER,
    systemNote: note(EMPLOYER_AT.local, EMPLOYER_AT.utc, ['keyboard']),
    now: EMPLOYER_AT,
  });
}

function personSigns(s: Session, answers: Answers): Session {
  const filled = fill(must(enterRole(s, 'person')), answers);
  const confirmed = acknowledge(
    acknowledge(filled, 'datenschutz', true),
    'mitfuehrungspflicht',
    true,
  );
  return must(
    seal(confirmed, {
      nonce: NONCE_PERSON,
      systemNote: note(PERSON_AT.local, PERSON_AT.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: PERSON_AT,
    }),
  );
}

function guardianSigns(s: Session, name: string): Session {
  return must(
    seal(fill(must(enterRole(s, 'vertretung')), { vertretungName: name }), {
      nonce: NONCE_GUARDIAN,
      systemNote: note(GUARDIAN_AT.local, GUARDIAN_AT.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: GUARDIAN_AT,
    }),
  );
}

interface Way {
  name: string;
  person?: Answers;
  employer?: Answers;
  guardian?: string;
  /** What the person sees under "Stand" once person and employer have sealed. */
  blockersBeforeGuardian?: string[];
  /** Text the PDF must show for this way. */
  shows: string[];
  /** Kanzlei: check hints and contradictions of the merged questionnaire. */
  hints?: string[];
  contradictions?: string[];
}

const WAYS: Way[] = [
  { name: 'the usual case', shows: ['Musterweg', '12345', 'Musterstadt'] },
  {
    name: 'an address abroad in a state with postcodes',
    person: {
      anschriftAusland: true,
      anschriftStaat: 'Österreich',
      postleitzahl: undefined,
      postleitzahlAusland: '1010',
      wohnort: 'Wien',
    },
    shows: ['Österreich', '1010', 'Wien'],
  },
  {
    name: 'an address abroad with a postcode in the wrong format (only a hint)',
    person: {
      anschriftAusland: true,
      anschriftStaat: 'Österreich',
      postleitzahl: undefined,
      postleitzahlAusland: '10100',
    },
    shows: ['Österreich', '10100'],
    hints: ['plzAuslandFormat'],
  },
  {
    name: 'an address abroad in a state without postcodes, left empty',
    person: { anschriftAusland: true, anschriftStaat: 'Katar', postleitzahl: undefined },
    shows: ['Katar'],
  },
  {
    name: 'born abroad, another nationality',
    person: {
      geborenInDeutschland: false,
      geburtsstaat: 'türkei',
      geburtsort: 'Ankara',
      deutscheStaatsangehoerigkeit: false,
      andereStaatsangehoerigkeit: 'Türkisch',
    },
    shows: ['Türkei', 'Ankara', 'türkisch'],
  },
  {
    name: 'title, name prefix and suffix',
    person: {
      namensbestandteile: true,
      titel: 'Dr.',
      vorsatzwort: 'Van der',
      namenszusatz: 'Freiherr',
    },
    shows: ['Dr.', 'van der', 'Freiherr'],
  },
  {
    name: 'another birth name: the SV number no longer fits its letter (only a hint)',
    person: { geburtsnameWieFamilienname: false, geburtsname: 'Schmidt' },
    shows: ['Schmidt'],
    hints: ['versicherungsnummerWeichtAb'],
  },
  {
    name: 'a minor with the legal guardian',
    person: { geburtsdatum: '01.03.2010', versicherungsnummer: undefined },
    guardian: 'Max Musterfrau',
    blockersBeforeGuardian: ['guardianMissing'],
    shows: ['01.03.2010', 'Max Musterfrau'],
  },
  {
    name: 'a family name that differs between employer and person',
    employer: { agFamilienname: 'Mustermann' },
    shows: ['Mustermann', 'Musterfrau'],
    contradictions: [
      'Der Familienname weicht zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.',
    ],
  },
];

async function writeAndRead(session: Session) {
  const written = await writeQuestionnairePdf(
    {
      questionnaire: session.questionnaire,
      form: session.form,
      origin: 'embedded',
      config: {},
      created: CREATED,
    },
    FONTS,
  );
  const text = await readPdfText(PDFJS, written.bytes);
  const lines = decodeDataLines(text.lines);
  if (!lines.ok) throw new Error(`${lines.issue} ${lines.detail.join(', ')}`);
  const decoded = decodePackage(JSON.parse(lines.text), registry);
  if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
  return { written, text: text.lines.join('\n'), decoded };
}

describe.each(WAYS)('Sofortmeldung 1.1.0 to the end: $name', (way) => {
  let session: Session;

  it('seals both parts, and the guardian where needed', () => {
    session = startSession(form, QUESTIONNAIRE_ID);
    session = must(employerSeals(session, { ...EMPLOYER, ...way.employer }));
    session = personSigns(session, { ...PERSON, ...way.person });
    expect(transmissionBlockers(session.questionnaire, form).map((b) => b.code)).toEqual(
      way.blockersBeforeGuardian ?? [],
    );
    if (way.guardian !== undefined) session = guardianSigns(session, way.guardian);
    expect(transmissionBlockers(session.questionnaire, form)).toEqual([]);
  });

  it('goes through the PDF unchanged and merges at the Kanzlei', async () => {
    const { written, text, decoded } = await writeAndRead(session);
    expect(written.complete).toBe(true);
    for (const shown of way.shows) expect(text).toContain(shown);
    expect(canonicalize(decoded.questionnaire)).toBe(canonicalize(session.questionnaire));

    const { inbox } = addToInbox(EMPTY_INBOX, {
      name: written.fileName,
      fileSha256: sha256Hex(written.bytes),
      questionnaire: decoded.questionnaire,
      form: decoded.form,
      origin: decoded.origin,
      received: { ...CREATED, timeZone: 'Europe/Berlin' },
    });
    const [group, ...others] = mergeInbox(inbox, registry).groups;
    expect(others).toEqual([]);
    expect(group?.conflicts).toEqual([]);
    expect(group?.gaps).toEqual([]);
    expect(group?.hints.map((h) => h.id)).toEqual(way.hints ?? []);
    expect(group?.contradictions.map((c) => c.message)).toEqual(way.contradictions ?? []);
  }, 60_000);
});

describe('Sofortmeldung 1.1.0: where the questionnaire stops', () => {
  it('"keiner dieser Bereiche" is refused at sealing with the reason', () => {
    const result = employerSeals(startSession(form, QUESTIONNAIRE_ID), {
      ...EMPLOYER,
      agBranche: 'keiner',
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.detail.join(' ')).toContain('nur in den genannten Wirtschaftsbereichen');
  });

  it('a start of employment before 2026 warns at once and is refused at sealing', () => {
    const s = fill(must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber')), EMPLOYER);
    const early = answer(s, 'agBeschaeftigungsbeginn', '31.12.2025');
    expect(early.ok).toBe(true);
    if (early.ok) expect(early.warnings.join(' ')).toMatch(/Gültigkeit|gilt/);
    const result = employerSeals(startSession(form, QUESTIONNAIRE_ID), {
      ...EMPLOYER,
      agBeschaeftigungsbeginn: '31.12.2025',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toContain('31.12.2025');
  });
});
