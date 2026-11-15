// The Austritt draft against the data set of the electronic Arbeitsbescheinigung (Tobias 2026-11-15:
// „prüfe das mit einem agenten“). Checked that day in the BA's „Datensatz und Datenbausteine sowie
// Fehlerkatalog im BEA-Verfahren“ 4.6 (Datenbaustein DBKE), the Vordruck BA II 2 – 08/2023 and
// § 312 SGB III: what the Bescheinigung requires is asked, in its order; the special cases it treats
// apart are excluded; § 159 Abs. 1 S. 2 Nr. 9 and § 41 Abs. 3 SGB VI read in the law. Fictitious data.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { activeExclusions, checkHints } from '../../src/logic/hints';
import type { Questionnaire } from '../../src/logic/model';
import {
  createQuestionnaire,
  currentPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(readJson(join(DRAFTS_DIR, 'austritt', '0.1.0.json')));
const ROLE = 'arbeitgeber';

function draftWith(values: Record<string, unknown>): Questionnaire {
  return Object.entries(values).reduce(
    (q, [id, value]) => ok(setValue(q, form, ROLE, id, value)),
    ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, ROLE)),
  );
}
const asked = (q: Questionnaire) =>
  visibleFields(form.definition, ROLE, currentPart(q, ROLE)?.data ?? {}).map((f) => f.id);
const hintIds = (q: Questionnaire) => checkHints(q, form.definition).map((h) => h.id);
const excluded = (q: Questionnaire) => activeExclusions(q, form.definition).map((e) => e.id);
const proposal = (q: Questionnaire, id: string) =>
  derive(q, form.definition).find((d) => d.id === id)?.value;
const fieldOf = (id: string) =>
  form.definition.sections.flatMap((s) => s.fields).find((f) => f.id === id);

const BEFRISTUNG = {
  agBeendigungsart: 'befristung',
  agSonderfall: 'keiner',
  agEndeArbeitsverhaeltnis: '31.12.2026',
};

describe('Befristung in the order of the Arbeitsbescheinigung (Nr. 62 to 67)', () => {
  it('asks the first end, the day of the contract, an extension, the form and the prospect', () => {
    const ids = asked(draftWith({ ...BEFRISTUNG, agBefristungVerlaengert: true }));
    const block = [
      'agBefristungUrspruenglichBis',
      'agBefristungAbschluss',
      'agBefristungVerlaengert',
      'agBefristungVerlaengertAm',
      'agBefristetBis',
      'agBefristungSchriftlich',
      'agBefristungWeiterbeschaeftigung',
    ];
    expect(ids.filter((id) => block.includes(id))).toEqual(block);
  });

  it('asks when and until when only after an extension', () => {
    const ids = asked(draftWith({ ...BEFRISTUNG, agBefristungVerlaengert: false }));
    expect(ids).not.toContain('agBefristungVerlaengertAm');
    expect(ids).not.toContain('agBefristetBis');
  });

  it('refuses a contract concluded after its first end', () => {
    const q = draftWith({ ...BEFRISTUNG, agBefristungUrspruenglichBis: '30.06.2026' });
    expect(setValue(q, form, ROLE, 'agBefristungAbschluss', '01.07.2026')).toMatchObject({
      ok: false,
    });
    expect(setValue(q, form, ROLE, 'agBefristungAbschluss', '01.01.2026').ok).toBe(true);
  });

  // § 41 Abs. 3 SGB VI: „bedarf … der Textform. § 14 Absatz 4 des Teilzeit- und
  // Befristungsgesetzes gilt nicht.“
  it('takes Textform for an end at the Regelaltersgrenze, and flags only a missing form', () => {
    expect(hintIds(draftWith({ ...BEFRISTUNG, agBefristungSchriftlich: 'nein' }))).toContain(
      'befristungNichtSchriftlich',
    );
    expect(
      hintIds(draftWith({ ...BEFRISTUNG, agBefristungSchriftlich: 'textformRegelaltersgrenze' })),
    ).not.toContain('befristungNichtSchriftlich');
    expect(fieldOf('agBefristungSchriftlich')?.help).toContain('§ 41 Abs. 3 SGB VI');
  });
});

describe('Kündigung, Sozialauswahl and Abmahnung', () => {
  const AG = { agBeendigungsart: 'kuendigungArbeitgeber', agSonderfall: 'keiner' };

  it('asks the delivery only for the employer’s notice, with the two values of the data set', () => {
    expect(asked(draftWith(AG))).toContain('agKuendigungZustellung');
    expect(
      asked(draftWith({ agBeendigungsart: 'kuendigungPerson', agSonderfall: 'keiner' })),
    ).not.toContain('agKuendigungZustellung');
    expect(fieldOf('agKuendigungZustellung')?.options?.map((o) => o.id)).toEqual([
      'persoenlich',
      'nichtPersoenlich',
    ]);
  });

  it('asks the Sozialauswahl for an Aufhebungsvertrag too, and the agency only after its check', () => {
    const aufhebung = { agBeendigungsart: 'aufhebungsvertrag', agSonderfall: 'keiner' };
    expect(asked(draftWith(aufhebung))).toEqual(
      expect.arrayContaining(['agSozialauswahl', 'agZusatzvereinbarung']),
    );
    expect(asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja' }))).toContain(
      'agSozialauswahlGeprueft',
    );
    expect(
      asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja', agSozialauswahlGeprueft: false })),
    ).not.toContain('agSozialauswahlAgentur');
    expect(
      asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja', agSozialauswahlGeprueft: true })),
    ).toContain('agSozialauswahlAgentur');
  });

  it('derives the Sozialauswahl from the reason where it follows from it', () => {
    expect(
      proposal(draftWith({ ...AG, agKuendigungsgrund: 'personenbedingt' }), 'sozialauswahl'),
    ).toBe('entfällt');
    expect(
      proposal(draftWith({ ...AG, agKuendigungsgrund: 'verhaltensbedingt' }), 'sozialauswahl'),
    ).toBe('nein');
    expect(
      proposal(
        draftWith({ ...AG, agKuendigungsgrund: 'betriebsbedingt', agSozialauswahl: 'ja' }),
        'sozialauswahl',
      ),
    ).toBe('ja');
  });

  it('asks for an Abmahnung also when the employer would have dismissed for a breach of duty', () => {
    const q = draftWith({
      agBeendigungsart: 'aufhebungsvertrag',
      agSonderfall: 'keiner',
      agHaetteGekuendigt: 'selberZeitpunkt',
      agHaetteVertragswidrig: true,
    });
    expect(asked(q)).toContain('agAbmahnung');
  });
});

describe('payments because of the end', () => {
  const BASE = { agBeendigungsart: 'aufhebungsvertrag', agSonderfall: 'keiner' };

  it('asks whether the Abfindung would have been paid on a dismissal, for every Aufhebungsvertrag', () => {
    expect(asked(draftWith({ ...BASE, agHaetteGekuendigt: 'nein', agAbfindung: 'ja' }))).toContain(
      'agAbfindungAuchBeiAgKuendigung',
    );
  });

  it('takes an open Arbeitsentgelt after the end and then asks why', () => {
    const q = draftWith({ ...BASE, agEntgeltUeberEnde: 'offen' });
    expect(asked(q)).toContain('agUngewissGrund');
    expect(proposal(q, 'leistungBeiBeendigung')).toBe('ungewiss');
    expect(fieldOf('agEntgeltUeberEnde')?.help).toContain('§ 8 EFZG');
  });

  it('asks a Vorruhestandsleistung with its start and its share of the gross pay', () => {
    const q = draftWith({ ...BASE, agAbfindung: 'nein', agVorruhestand: 'ja' });
    expect(asked(q)).toEqual(expect.arrayContaining(['agVorruhestandAb', 'agVorruhestandProzent']));
    expect(proposal(q, 'leistungBeiBeendigung')).toBe('ja');
    expect(hintIds(q)).toContain('vorruhestand');
  });
});

describe('special cases the Arbeitsbescheinigung treats apart', () => {
  it.each([
    ['insolvenz', 'sonderfallInsolvenz'],
    ['arbeitskampf', 'sonderfallArbeitskampf'],
    ['heimarbeit', 'sonderfallHeimarbeit'],
    ['transfer', 'sonderfallTransfer'],
    ['altersteilzeitVorzeitig', 'sonderfallAltersteilzeitVorzeitig'],
  ])('excludes %s', (option, exclusion) => {
    expect(excluded(draftWith({ ...BEFRISTUNG, agSonderfall: option }))).toEqual([exclusion]);
  });

  it('only notes an Altersteilzeit that ends as agreed', () => {
    const q = draftWith({ ...BEFRISTUNG, agSonderfall: 'altersteilzeit' });
    expect(excluded(q)).toEqual([]);
    expect(hintIds(q)).toContain('altersteilzeitEnde');
  });
});

it('says the Sperrzeit of a late registration lasts one week, after § 159 Abs. 1 S. 2 Nr. 9', () => {
  const text = form.definition.infoBlocks.find((b) => b.id === 'hinweisArbeitsuche')?.text ?? '';
  expect(text).toContain('Sperrzeit von einer Woche');
  expect(text).toContain('§ 159 Abs. 1 S. 2 Nr. 9, Abs. 6 SGB III');
});
