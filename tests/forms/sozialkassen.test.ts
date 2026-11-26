// Personalfragebogen draft 1.2.0 (Tobias 2026-11-26: „ergänze ein Auswahlfeld für die konkrete
// Sozialkasse“): after „Ja“ to the Sozialkassenverfahren the employer names its Kassen, several at
// once, from the BMAS Merkblatt über Beitragsverpflichtungen zu tariflichen Sozialkassenverfahren
// (Stand Mai 2026); „Eine andere Sozialkasse“ asks its name. The choice travels in the master-data
// link as the option ids joined by commas („Mehrfachauswahl passt in einen Link, indem alle Werte
// aufgezählt werden“). The Dienstwagen draft proposes the names both ways like the
// Personalfragebogen (check of 2026-11-26: every field asked of two roles). Fictitious data.
import { join } from 'node:path';
import {
  linkValue,
  masterDataOf,
  MASTER_DATA_LIST_SEPARATOR,
  storedValue,
} from '../../src/logic/masterData';
import { masterDataCatalog, masterDataInput } from '../../src/logic/masterDataCatalog';
import { masterDataFragment, parseMasterDataFragment } from '../../src/logic/masterDataLink';
import type { FieldDefinition, FieldValue } from '../../src/logic/model';
import { currentPart } from '../../src/logic/questionnaire';
import {
  answer,
  enterRole,
  fillMasterData,
  filledFromLink,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.2.0.json')));
const { definition } = form;
const fieldOf = (id: string): FieldDefinition => {
  const found = definition.sections.flatMap((s) => s.fields).find((f) => f.id === id);
  if (!found) throw new Error(id);
  return found;
};

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(' ')}`);
  return result.session;
}
const employer = (): Session =>
  must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber'));
const value = (s: Session, id: string): FieldValue | undefined =>
  currentPart(s.questionnaire, 'arbeitgeber')?.data[id];

/** Every Kasse of the BMAS Merkblatt (Stand Mai 2026), one option each, and „andere“. */
const BMAS_MAI_2026 = [
  'sokaBau',
  'berlinBau',
  'ukbBayern',
  'sokaDach',
  'sokaGeruestbau',
  'malerkasse',
  'zvkSteineErdenBayern',
  'steinmetz',
  'galabau',
  'qlfHessen',
  'qlfSchleswigHolstein',
  'qffNiedersachsen',
  'zlf',
  'presse',
  'schornsteinfeger',
  'brotindustrie',
  'baeckerhandwerk',
  'andere',
];

describe('Personalfragebogen 1.2.0: which Sozialkassen', () => {
  it('offers every Kasse of the BMAS Merkblatt, several at once, right after „Ja“', () => {
    const kassen = fieldOf('agSozialkassen');
    expect(kassen.type).toBe('multiChoice');
    expect(kassen.role).toBe('arbeitgeber');
    expect(kassen.options?.map((o) => o.id)).toEqual(BMAS_MAI_2026);
    expect(kassen.showIf).toEqual({ field: 'agSozialkasse', equals: 'ja' });
    expect(kassen.required).toBe(true);
    expect(kassen.help).toContain('Stand Mai 2026');
  });

  it('asks it only after „Ja“, and the name only for another Kasse', () => {
    let s = employer();
    expect(answer(s, 'agSozialkassen', ['sokaBau']).ok).toBe(false);
    s = must(answer(s, 'agSozialkasse', 'ja'));
    s = must(answer(s, 'agSozialkassen', ['ukbBayern', 'sokaBau']));
    expect(value(s, 'agSozialkassen')).toEqual(['sokaBau', 'ukbBayern']);
    expect(answer(s, 'agSozialkasseAndere', 'Beispielkasse').ok).toBe(false);
    s = must(answer(s, 'agSozialkassen', ['sokaBau', 'andere']));
    s = must(answer(s, 'agSozialkasseAndere', 'Beispielkasse'));
    expect(value(s, 'agSozialkasseAndere')).toBe('Beispielkasse');
  });

  it('differs from the published 1.1.0 only by the two new questions', () => {
    const published = registeredFrom(
      readJson(join(FORMS_DIR, 'personalfragebogen', '1.1.0.json')),
    ).definition;
    const strip = (d: typeof definition) => ({
      ...d,
      version: '',
      revised: '',
      sections: d.sections.map((s) => ({
        ...s,
        fields: s.fields.filter((f) => !['agSozialkassen', 'agSozialkasseAndere'].includes(f.id)),
      })),
    });
    expect(strip(definition)).toEqual(strip(published));
  });
});

describe('a multiple choice in the master-data link (Tobias 2026-11-26)', () => {
  it('travels as the chosen option ids joined by commas', () => {
    expect(MASTER_DATA_LIST_SEPARATOR).toBe(',');
    expect(linkValue(['sokaBau', 'ukbBayern'])).toBe('sokaBau,ukbBayern');
    expect(storedValue({ type: 'multiChoice' }, 'sokaBau,ukbBayern')).toEqual([
      'sokaBau',
      'ukbBayern',
    ]);
    // a single choice with a comma in its text stays one value
    expect(storedValue({ type: 'text' }, 'a,b')).toBe('a,b');
  });

  it('is written into the link for next time and read back into the field', () => {
    let s = employer();
    s = must(answer(s, 'agSozialkasse', 'ja'));
    s = must(answer(s, 'agSozialkassen', ['sokaBau', 'ukbBayern']));
    const data = currentPart(s.questionnaire, 'arbeitgeber')?.data ?? {};
    const record = masterDataOf(definition, 'arbeitgeber', data);
    expect(record).toMatchObject({ sozialkasse: 'ja', sozialkassen: 'sokaBau,ukbBayern' });

    const made = masterDataFragment(record, 'personalfragebogen');
    if (!made.ok) throw new Error(made.issue);
    expect(made.fragment).toContain('sozialkassen=sokaBau%2CukbBayern');
    const parsed = parseMasterDataFragment(made.fragment);
    if (!parsed.ok || !parsed.data) throw new Error('not parsed');

    const filled = fillMasterData(employer(), parsed.data);
    if (!filled.ok) throw new Error('no draft');
    expect(value(filled.session, 'agSozialkasse')).toBe('ja');
    expect(value(filled.session, 'agSozialkassen')).toEqual(['sokaBau', 'ukbBayern']);
    expect(filledFromLink(filled.session, 'agSozialkassen')).toBe(true);
  });

  it('refuses a list with an unknown Kasse and says so, the rest of the link still fills', () => {
    const filled = fillMasterData(employer(), {
      sozialkasse: 'ja',
      sozialkassen: 'sokaBau,unbekannteKasse',
    });
    if (!filled.ok) throw new Error('no draft');
    expect(value(filled.session, 'agSozialkasse')).toBe('ja');
    expect(value(filled.session, 'agSozialkassen')).toBeUndefined();
    expect(filled.skipped.join(' ')).toContain('Sozialkassen des Betriebs');
  });

  it('is entered on the link screen like in the interview', () => {
    const entry = masterDataCatalog([form])
      .groups.flatMap((g) => g.entries)
      .find((e) => e.key === 'sozialkassen');
    if (!entry) throw new Error('no entry');
    expect(masterDataInput(entry, ['ukbBayern', 'sokaBau'])).toEqual({
      ok: true,
      value: 'sokaBau,ukbBayern',
    });
    expect(masterDataInput(entry, [])).toEqual({ ok: true, value: null });
    expect(masterDataInput(entry, ['keineKasse'])).toMatchObject({ ok: false });
  });
});

describe('Dienstwagen draft: the names are proposed both ways (check 2026-11-26)', () => {
  const dienstwagen = registeredFrom(
    readJson(join(DRAFTS_DIR, 'dienstwagen', '0.1.0.json')),
  ).definition;
  const field = (id: string) =>
    dienstwagen.sections.flatMap((s) => s.fields).find((f) => f.id === id);

  it.each([
    ['familienname', 'agFamilienname'],
    ['vorname', 'agVorname'],
  ])('%s and %s propose each other', (own, other) => {
    expect(field(own)?.fromRole).toEqual({ role: 'arbeitgeber', field: other, changeable: true });
    expect(field(other)?.fromRole).toEqual({ role: 'person', field: own, changeable: true });
    expect(field(other)?.because).toBeTruthy();
  });
});
