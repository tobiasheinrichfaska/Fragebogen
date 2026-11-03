// The master-data link (Tobias 2026-11-03): firm policies on conditional questions are filled as
// soon as the question appears and follow the case while nobody changes them; a new link keeps the
// keys of other forms; one key means the same in every form; the link screen tells which special
// cases the firm data exclude before any person is asked. Fictitious data.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { masterDataOf, mergedMasterData, type MasterData } from '../../src/logic/masterData';
import {
  masterDataCatalog,
  masterDataExclusions,
  masterDataInput,
  unknownMasterDataKeys,
  type MasterDataEntry,
} from '../../src/logic/masterDataCatalog';
import {
  fragmentOf,
  masterDataFragment,
  masterDataLinkBase,
  parseMasterDataFragment,
} from '../../src/logic/masterDataLink';
import type { FieldValue } from '../../src/logic/model';
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
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;
const definitionFile = (dir: string) =>
  definitionFiles(dir).filter((file) => file.file.endsWith('.json'));
const allForms: RegisteredForm[] = [...definitionFile(FORMS_DIR), ...definitionFile(DRAFTS_DIR)]
  .filter((file) => file.folder !== 'published.json')
  .map((file) => registeredFrom(readJson(file.path)));
const latest = (forms: readonly RegisteredForm[]) => {
  const newest = new Map<string, RegisteredForm>();
  for (const candidate of forms) {
    const known = newest.get(candidate.definition.id);
    if (!known || known.definition.version < candidate.definition.version) {
      newest.set(candidate.definition.id, candidate);
    }
  }
  return [...newest.values()];
};

const POLICY: MasterData = {
  firma: 'Beispiel Gastro GmbH',
  tarifvertrag: 'Manteltarifvertrag Beispielbranche',
  betriebsstaette: 'Filiale Beispielstadt',
  gefahrtarifstelle: '12',
  lohnsteuerMinijob: 'pauschal2',
  abwaelzungMinijob: 'ja',
  lohnsteuerAushilfe: 'pauschal25',
  abwaelzungAushilfe: 'nein',
  mandantennummer: '99999',
};

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(' ')}`);
  return result.session;
}

function employerWithLink(record: MasterData): Session {
  const entered = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber'));
  const filled = fillMasterData(entered, record);
  if (!filled.ok) throw new Error('no draft');
  return filled.session;
}

const value = (s: Session, id: string): FieldValue | undefined =>
  currentPart(s.questionnaire, 'arbeitgeber')?.data[id];

describe('filling the link into the Personalfragebogen', () => {
  it('fills the always asked firm data at once and the wage tax when the Minijob is chosen', () => {
    let s = employerWithLink(POLICY);
    expect(value(s, 'agTarif')).toBe('Manteltarifvertrag Beispielbranche');
    expect(value(s, 'agBetriebsstaette')).toBe('Filiale Beispielstadt');
    expect(value(s, 'agGefahrtarif')).toBe('12');
    // Before the kind of employment is known, the wage-tax question does not exist yet.
    expect(value(s, 'agBesteuerung')).toBeUndefined();
    s = must(answer(s, 'agBeschaeftigungsart', 'minijob'));
    expect(value(s, 'agBesteuerung')).toBe('pauschal2');
    // The filled answer opens the next question, which the link fills too.
    expect(value(s, 'agPauschalsteuerAbgewaelzt')).toBe(true);
    expect(filledFromLink(s, 'agBesteuerung')).toBe(true);
    expect(filledFromLink(s, 'agBeschaeftigungsart')).toBe(false);
  });

  it('follows the case while nobody changed the value, and clears it when no case applies', () => {
    let s = must(answer(employerWithLink(POLICY), 'agBeschaeftigungsart', 'minijob'));
    s = must(answer(s, 'agBeschaeftigungsart', 'kurzfristig'));
    expect(value(s, 'agBesteuerung')).toBe('pauschal25');
    expect(value(s, 'agPauschalsteuerAbgewaelzt')).toBe(false);
    s = must(answer(s, 'agBeschaeftigungsart', 'pruefen'));
    expect(value(s, 'agBesteuerung')).toBeNull();
    expect(filledFromLink(s, 'agBesteuerung')).toBe(false);
  });

  it('never touches an answer the employer changed or cleared', () => {
    let s = must(answer(employerWithLink(POLICY), 'agBeschaeftigungsart', 'minijob'));
    s = must(answer(s, 'agBesteuerung', 'elstam'));
    s = must(answer(s, 'agBeschaeftigungsart', 'kurzfristig'));
    expect(value(s, 'agBesteuerung')).toBe('elstam');
    s = must(answer(s, 'agTarif', null));
    s = must(answer(s, 'agBeschaeftigungsart', 'minijob'));
    expect(value(s, 'agTarif')).toBeNull();
    expect(value(s, 'agBesteuerung')).toBe('elstam');
  });

  it('reports a value that does not fit the case once, with the question and the reason', () => {
    let s = employerWithLink({ lohnsteuerMinijob: 'pauschal25' });
    const result = answer(s, 'agBeschaeftigungsart', 'minijob');
    expect(result.ok && result.warnings).toEqual([
      'Art der Lohnsteuer: Bitte eine der angebotenen Möglichkeiten wählen.',
    ]);
    s = must(result);
    expect(value(s, 'agBesteuerung')).toBeUndefined();
    const again = answer(s, 'agTarif', 'Haustarif');
    expect(again.ok && again.warnings).toEqual([]);
  });

  it('keeps an answer given before the link was read', () => {
    let s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber'));
    s = must(answer(s, 'agTarif', 'Haustarif'));
    const filled = fillMasterData(s, POLICY);
    expect(filled.ok && value(filled.session, 'agTarif')).toBe('Haustarif');
  });
});

describe('the link for next time', () => {
  it('keeps the keys of other forms and lets the current answers win', () => {
    // Bug of 2026-11-03: the summary built the link from this form alone, so a bookmark made in the
    // Personalfragebogen lost the Monatsmeldung's Mandantennummer.
    let s = must(answer(employerWithLink(POLICY), 'agBeschaeftigungsart', 'minijob'));
    s = must(answer(s, 'agFirma', 'Beispiel Gastro und Partner GmbH'));
    const data = currentPart(s.questionnaire, 'arbeitgeber')?.data ?? {};
    const merged = mergedMasterData(s.masterData?.record, definition, 'arbeitgeber', data);
    expect(merged).toMatchObject({
      mandantennummer: '99999',
      firma: 'Beispiel Gastro und Partner GmbH',
      lohnsteuerMinijob: 'pauschal2',
      abwaelzungMinijob: 'ja',
      lohnsteuerAushilfe: 'pauschal25',
    });
    expect(masterDataFragment(merged).ok).toBe(true);
  });

  it('takes a conditional answer under the key of its case, only while it is asked', () => {
    let s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber'));
    s = must(answer(s, 'agBeschaeftigungsart', 'kurzfristig'));
    s = must(answer(s, 'agBesteuerung', 'pauschal25'));
    const data = () => currentPart(s.questionnaire, 'arbeitgeber')?.data ?? {};
    expect(masterDataOf(definition, 'arbeitgeber', data())).toMatchObject({
      lohnsteuerAushilfe: 'pauschal25',
    });
    // A Minijob with the helpers' flat rate does not fit the Minijob case: left out of the link.
    s = must(answer(s, 'agBeschaeftigungsart', 'minijob'));
    expect(masterDataOf(definition, 'arbeitgeber', data())).not.toHaveProperty('lohnsteuerMinijob');
    // Hidden (not asked for an employment subject to insurance): left out as well.
    s = must(answer(s, 'agBeschaeftigungsart', 'svpflichtig'));
    expect(Object.keys(masterDataOf(definition, 'arbeitgeber', data()))).not.toContain(
      'lohnsteuerAushilfe',
    );
  });
});

describe('the master-data catalogue of all forms', () => {
  it('means the same with every key in every form and version', () => {
    expect(masterDataCatalog(allForms).conflicts).toEqual([]);
  });

  it('lists every key once, the Personalfragebogen first, cases with their own options', () => {
    const catalog = masterDataCatalog(latest(allForms));
    const entries = catalog.groups.flatMap((group) => group.entries);
    const keys = entries.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(catalog.groups[0]?.title).toBe(`Angaben des Arbeitgebers (${definition.title})`);
    const byKey = new Map(entries.map((entry) => [entry.key, entry]));
    expect(byKey.get('firma')?.forms).toEqual(expect.arrayContaining([definition.title]));
    expect((byKey.get('firma')?.forms ?? []).length).toBeGreaterThan(2);
    const minijob = byKey.get('lohnsteuerMinijob');
    expect(minijob?.question).toBe('Lohnsteuer bei Minijobs');
    expect(minijob?.field.options?.map((option) => option.id)).toEqual([
      'elstam',
      'pauschal2',
      'pauschal20',
      'pruefen',
    ]);
    expect(byKey.get('lohnsteuerAushilfe')?.field.options?.map((option) => option.id)).toEqual([
      'elstam',
      'pauschal25',
      'pauschal5',
      'pruefen',
    ]);
    for (const key of ['tarifvertrag', 'betriebsstaette', 'gefahrtarifstelle', 'mandantennummer']) {
      expect(keys).toContain(key);
    }
  });

  it('stores entered values as the link carries them, with the reason for a wrong one', () => {
    const entries = new Map<string, MasterDataEntry>(
      masterDataCatalog(latest(allForms))
        .groups.flatMap((group) => group.entries)
        .map((entry) => [entry.key, entry]),
    );
    const entry = (key: string) => {
      const found = entries.get(key);
      if (!found) throw new Error(key);
      return found;
    };
    expect(masterDataInput(entry('betriebsnummer'), '1234 5678')).toEqual({
      ok: true,
      value: '12345678',
    });
    expect(masterDataInput(entry('privathaushalt'), true)).toEqual({ ok: true, value: 'ja' });
    expect(masterDataInput(entry('firma'), '  Beispiel   GmbH ')).toEqual({
      ok: true,
      value: 'Beispiel GmbH',
    });
    expect(masterDataInput(entry('lohnsteuerMinijob'), 'pauschal25')).toMatchObject({ ok: false });
    expect(masterDataInput(entry('betriebsnummer'), 'abc')).toMatchObject({ ok: false });
  });

  it('names keys no form of the app knows', () => {
    const catalog = masterDataCatalog(latest(allForms));
    expect(unknownMasterDataKeys(catalog, { firma: 'A', kuenftig: 'B' })).toEqual(['kuenftig']);
  });
});

describe('what the firm data exclude before any person is asked', () => {
  const forms = latest(allForms);
  const shown = (record: MasterData) =>
    masterDataExclusions(forms, record).map((e) => [e.form, e.kind, e.message.slice(0, 30)]);

  it('says nothing for an ordinary firm', () => {
    expect(shown({})).toEqual([]);
    expect(shown({ privathaushalt: 'nein', seeschifffahrt: 'nein', betriebsart: 'keine' })).toEqual(
      [],
    );
  });

  it('excludes every questionnaire of a knappschaftlicher Betrieb', () => {
    expect(shown({ betriebsart: 'knappschaft' })).toEqual([
      [definition.title, 'always', 'Beschäftigung in einem knappsc'],
    ]);
  });

  it.each<[string, MasterData, string]>([
    [
      'a private household (Minijobs, helpers)',
      { privathaushalt: 'ja' },
      'Minijob oder kurzfristige Besc',
    ],
    ['a shipping company (on board)', { seeschifffahrt: 'ja' }, 'Beschäftigung an Bord eines Se'],
    ['a farm (family members)', { landwirtschaft: 'ja' }, 'Mitarbeitende(r) Familienangeh'],
    ['a workshop (participants)', { betriebsart: 'werkstatt' }, 'Beschäftigung als behinderter '],
  ])('names the case %s makes possible', (_label, record, message) => {
    expect(shown(record)).toEqual([[definition.title, 'possible', message]]);
  });
});

describe('link addresses', () => {
  it('points a link made in a local file to the hosted app', () => {
    expect(masterDataLinkBase('https://app.example.org/fb/#stammdaten=1', undefined)).toBe(
      'https://app.example.org/fb/',
    );
    expect(masterDataLinkBase('file:///C:/fb/index.html', 'https://app.example.org/fb/')).toBe(
      'https://app.example.org/fb/',
    );
    expect(masterDataLinkBase('file:///C:/fb/index.html#x', undefined)).toBe(
      'file:///C:/fb/index.html',
    );
  });

  it('reads a pasted link or a bare fragment', () => {
    const pasted = '  https://app.example.org/#stammdaten=1&firma=Beispiel+GmbH ';
    expect(fragmentOf(pasted)).toBe('#stammdaten=1&firma=Beispiel+GmbH');
    expect(parseMasterDataFragment(fragmentOf(pasted))).toEqual({
      ok: true,
      data: { firma: 'Beispiel GmbH' },
    });
    expect(fragmentOf('stammdaten=1&firma=A')).toBe('stammdaten=1&firma=A');
  });
});
