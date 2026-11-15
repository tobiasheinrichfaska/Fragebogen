// Zustimmung, draft 1.1.0 (Tobias 2026-11-15: „EÜR: hier sollten mehrere (dann mit Namen) erfasst
// werden können, oder einfach nur eine, das gleiche gilt für GewSt, USt. und es fehlt die
// GewSt-Zerlegung“). For the Anlage EÜR, the Gewerbe- and the Umsatzsteuererklärung the Kanzlei
// says whether it sent one or several; several are named, one per line. With several GewSt it names
// those that carry a Zerlegungserklärung. The client's part copies all of it (fixed, not asked),
// so a difference is a contradiction when the client began without the Kanzlei part. Fictitious data.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import { writeQuestionnairePdf, type PdfFonts } from '../../src/io/pdfWriter';
import { contradictions } from '../../src/logic/consistency';
import { fieldsById } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import { latestSealed } from '../../src/logic/questionnaire';
import { completenessGaps } from '../../src/logic/requirements';
import {
  acknowledge,
  answer,
  enterRole,
  seal,
  signingOverview,
  startSession,
  stepsFor,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const raw = readJson(join(DRAFTS_DIR, 'steuerfreigabe', '1.1.0.json'));
const form: RegisteredForm = registeredFrom(raw);
const AT = { local: '2026-11-15T10:00:00.000+01:00', utc: '2026-11-15T09:00:00.000Z' };

type Values = Record<string, unknown>;

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const questions = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : []));
const notices = (s: Session) =>
  stepsFor(s).flatMap((step) => (step.kind === 'notice' ? [step.infoBlockId] : []));
const answerAll = (s: Session, values: Values) =>
  Object.entries(values).reduce((next, [id, value]) => must(answer(next, id, value)), s);
const confirmAll = (s: Session) => notices(s).reduce((next, id) => acknowledge(next, id, true), s);

function sealed(s: Session, nonce: string, name?: string): SessionResult {
  return seal(s, {
    nonce: nonce.repeat(16),
    systemNote: note(AT.local, AT.utc),
    ...(name === undefined ? {} : { signature: { method: 'typed' as const, name } }),
    now: AT,
  });
}

const BASE: Values = { mandantName: 'Erika Musterfrau', vorlageDatum: '28.10.2026' };
const EINE: Values = {
  ...BASE,
  erklaerungen: ['est', 'euer', 'gewst', 'ust'],
  veranlagung: 'einzel',
  euerAnzahl: 'eine',
  gewstAnzahl: 'eine',
  zerlegung: true,
  ustAnzahl: 'eine',
};
const MEHRERE: Values = {
  ...EINE,
  euerAnzahl: 'mehrere',
  euerBezeichnungen: 'Gewerbebetrieb Bäckerei\nFreiberufliche Tätigkeit Übersetzungen',
  gewstAnzahl: 'mehrere',
  gewstBezeichnungen: 'Bäckerei 2025\nBäckerei 2024',
  zerlegungBei: 'Bäckerei 2025',
  ustAnzahl: 'mehrere',
  ustBezeichnungen: '2025\n2024',
};

const kanzleiDraft = (values: Values) =>
  answerAll(must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'kanzlei')), values);
const kanzleiSealed = (values: Values) => must(sealed(kanzleiDraft(values), 'a1'));
function consented(base: Session, values: Values = {}) {
  const s = confirmAll(answerAll(must(enterRole(base, 'mandant')), values));
  return must(sealed(s, 'b2', 'Erika Musterfrau'));
}

describe('the draft 1.1.0', () => {
  it('is a valid definition', () => {
    expect(checkFormDefinition(form.definition)).toEqual([]);
  });

  it('keeps every field of the published 1.0.0 with its type', () => {
    const published = registeredFrom(readJson(join(FORMS_DIR, 'steuerfreigabe', '1.0.0.json')));
    const now = fieldsById(form.definition);
    for (const [id, field] of fieldsById(published.definition)) {
      expect(now.get(id)?.type, id).toBe(field.type);
    }
  });
});

describe('one or several of the Anlage EÜR, the GewSt and the USt', () => {
  it('asks how many only for what the Kanzlei names', () => {
    expect(questions(kanzleiDraft({ ...BASE, erklaerungen: ['kst'] }))).not.toEqual(
      expect.arrayContaining(['euerAnzahl']),
    );
    const asked = questions(kanzleiDraft({ ...BASE, erklaerungen: ['euer', 'gewst', 'ust'] }));
    expect(asked).toEqual(expect.arrayContaining(['euerAnzahl', 'gewstAnzahl', 'ustAnzahl']));
    expect(asked.filter((id) => id.endsWith('Bezeichnungen') || id === 'zerlegungBei')).toEqual([]);
  });

  it('asks for the names right after „Mehrere“, and nothing more after „Eine“', () => {
    expect(
      questions(kanzleiDraft(EINE)).filter((id) => /Bezeichnungen|zerlegungBei/.test(id)),
    ).toEqual([]);
    const asked = questions(kanzleiDraft(MEHRERE));
    const at = (id: string) => asked.indexOf(id);
    expect(at('euerBezeichnungen')).toBe(at('euerAnzahl') + 1);
    expect(at('gewstBezeichnungen')).toBe(at('gewstAnzahl') + 1);
    expect(at('ustBezeichnungen')).toBe(at('ustAnzahl') + 1);
  });

  it('refuses names after „Eine“', () => {
    expect(answer(kanzleiDraft(EINE), 'euerBezeichnungen', 'A\nB').ok).toBe(false);
  });

  it('needs the names before the Kanzlei completes its part', () => {
    const withoutNames = { ...MEHRERE, euerBezeichnungen: null };
    expect(sealed(kanzleiDraft(withoutNames), 'a1').ok).toBe(false);
    expect(sealed(kanzleiDraft(MEHRERE), 'a1').ok).toBe(true);
  });

  it('keeps the names one per line', () => {
    const data = latestSealed(kanzleiSealed(MEHRERE).questionnaire, 'kanzlei')?.data;
    expect(data?.gewstBezeichnungen).toBe('Bäckerei 2025\nBäckerei 2024');
  });
});

describe('the Zerlegungserklärung', () => {
  it('is asked right after the Gewerbesteuererklärungen, also with only one', () => {
    const asked = questions(kanzleiDraft(EINE));
    expect(asked.indexOf('zerlegung')).toBe(asked.indexOf('gewstAnzahl') + 1);
  });

  it('names the GewSt it belongs to only when there are several', () => {
    expect(questions(kanzleiDraft(EINE))).not.toContain('zerlegungBei');
    const withoutZerlegung = { ...MEHRERE, zerlegungBei: null };
    expect(questions(kanzleiDraft({ ...withoutZerlegung, zerlegung: false }))).not.toContain(
      'zerlegungBei',
    );
    const asked = questions(kanzleiDraft(MEHRERE));
    expect(asked.indexOf('zerlegungBei')).toBe(asked.indexOf('zerlegung') + 1);
  });

  it('is dropped with the GewSt when the Kanzlei takes it away again', () => {
    const changed = answerAll(kanzleiDraft(MEHRERE), { erklaerungen: ['est', 'euer', 'ust'] });
    const data = latestSealed(must(sealed(changed, 'a1')).questionnaire, 'kanzlei')?.data ?? {};
    for (const id of ['gewstAnzahl', 'gewstBezeichnungen', 'zerlegung', 'zerlegungBei']) {
      expect(data, id).not.toHaveProperty(id);
    }
  });
});

describe('the client consents to exactly what the Kanzlei named', () => {
  const COPIES = [
    'zustimmungEuerAnzahl',
    'zustimmungEuerBezeichnungen',
    'zustimmungGewstAnzahl',
    'zustimmungGewstBezeichnungen',
    'zustimmungZerlegung',
    'zustimmungZerlegungBei',
    'zustimmungUstAnzahl',
    'zustimmungUstBezeichnungen',
  ];

  it('takes count, names and Zerlegung over, fixed and not asked', () => {
    const mandant = must(enterRole(kanzleiSealed(MEHRERE), 'mandant'));
    expect(questions(mandant)).toEqual(['einschraenkungenMandant', 'unterzeichnerName']);
    for (const id of COPIES) expect(answer(mandant, id, null).ok, id).toBe(false);
    const own = signingOverview(answerAll(mandant, { unterzeichnerName: 'Erika Musterfrau' }));
    const rows = own?.own.flatMap((section) => section.rows) ?? [];
    expect(rows.map((row) => row.fieldId)).toEqual(expect.arrayContaining(COPIES));
    expect(rows.find((row) => row.fieldId === 'zustimmungZerlegungBei')?.value).toBe(
      'Bäckerei 2025',
    );
  });

  it('is complete, verifies and shows no contradiction', () => {
    const done = consented(kanzleiSealed(MEHRERE), { unterzeichnerName: 'Erika Musterfrau' });
    expect(completenessGaps(done.questionnaire, form)).toEqual([]);
    expect(contradictions(done.questionnaire, form.definition)).toEqual([]);
    const verdict = verifyQuestionnaire(done.questionnaire, { registry: registryOf([form]) });
    expect(verdict.level).toBe('ok');
  });

  it('asks the client without the Kanzlei part and shows a later difference', () => {
    const alone = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'mandant'));
    const own = answerAll(alone, {
      zustimmungMandant: 'Erika Musterfrau',
      zustimmungSchreibenVom: '28.10.2026',
      zustimmungErklaerungen: ['euer'],
    });
    expect(questions(own)).toContain('zustimmungEuerAnzahl');
    const signed = consented(own, {
      zustimmungEuerAnzahl: 'mehrere',
      zustimmungEuerBezeichnungen: 'Bäckerei',
      unterzeichnerName: 'Erika Musterfrau',
    });
    const withKanzlei = must(
      sealed(
        answerAll(must(enterRole(signed, 'kanzlei')), {
          ...BASE,
          erklaerungen: ['euer'],
          euerAnzahl: 'mehrere',
          euerBezeichnungen: 'Bäckerei\nÜbersetzungen',
        }),
        'd4',
      ),
    );
    expect(
      contradictions(withKanzlei.questionnaire, form.definition).map((c) => c.message),
    ).toEqual([
      'Die Bezeichnungen der Anlagen EÜR weichen zwischen der Vorlage der Kanzlei und der Zustimmung ab.',
    ]);
  });
});

describe('the PDF', () => {
  const font = (name: string) =>
    new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
  const FONTS: PdfFonts = {
    sans: font('NotoSans-Regular.subset.ttf'),
    bold: font('NotoSans-SemiBold.subset.ttf'),
    mono: font('NotoSansMono-Regular.subset.ttf'),
  };

  it('prints every named return and the Zerlegung', async () => {
    const done = consented(kanzleiSealed(MEHRERE), { unterzeichnerName: 'Erika Musterfrau' });
    const written = await writeQuestionnairePdf(
      { questionnaire: done.questionnaire, form, origin: 'embedded', config: {}, created: AT },
      FONTS,
    );
    const text = (await readPdfText(pdfjs as unknown as PdfJsLike, written.bytes)).lines.join('\n');
    for (const name of [
      'Freiberufliche Tätigkeit Übersetzungen',
      'Bäckerei 2024',
      'Zerlegungserklärung zu',
    ]) {
      expect(text).toContain(name);
    }
  }, 60_000);
});
