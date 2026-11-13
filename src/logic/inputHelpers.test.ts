// Review of 2026-10-30: German postcode format, earlier answers in question texts, quick-answer
// buttons — and the definition rules that keep them sound.
import { fillPlaceholders, placeholderIds } from './display';
import { checkFormDefinition } from './formDefinition';
import type { FieldDefinition, FormDefinition } from './model';
import { normalizeFieldValue, stepHalfSteps } from './normalize';
import { beispielForm } from '../../tests/support/sample';

const plain: FieldDefinition = {
  id: 'postleitzahl',
  role: 'person',
  type: 'text',
  label: 'Postleitzahl',
  required: true,
  purpose: 'Test',
};
const plz: FieldDefinition = { ...plain, textFormat: 'postleitzahlDe' };

describe('German postcode (textFormat postleitzahlDe)', () => {
  it.each([
    ['12345', '12345'],
    [' 76 131 ', '76131'],
    ['01067', '01067'],
  ])('%j → %s', (raw, stored) => {
    expect(normalizeFieldValue(plz, raw)).toEqual({ ok: true, value: stored, warnings: [] });
  });

  it.each(['1234', '123456', 'A1234', '00123', '12 34'])('%j is refused', (raw) => {
    expect(normalizeFieldValue(plz, raw)).toEqual({ ok: false, issue: 'plz.format' });
  });

  // Tobias 2026-11-01: "Telefonnummer muss auf Stimmigkeit geprüft werden, ebenso Mailadresse".
  it.each([
    ['0721 123456', '0721 123456'],
    ['+49 721 123456', '+49 721 123456'],
    ['+49 (0) 721 / 12 34-56', '+49 (0) 721 / 12 34-56'],
    ['(0721) 123456', '(0721) 123456'],
    ['0151.23456789', '0151.23456789'],
  ])('phone %j is kept as written', (raw, stored) => {
    const phone: FieldDefinition = { ...plain, textFormat: 'telefon' };
    expect(normalizeFieldValue(phone, raw)).toEqual({ ok: true, value: stored, warnings: [] });
    expect(normalizeFieldValue(phone, stored)).toEqual({ ok: true, value: stored, warnings: [] });
  });

  it.each([
    '12345',
    '721 123456',
    '0721 12 34 56 78 90 12',
    '+0 721 123456',
    '0721-HALLO',
    '07+21',
  ])('phone %j is refused', (raw) => {
    const phone: FieldDefinition = { ...plain, textFormat: 'telefon' };
    expect(normalizeFieldValue(phone, raw)).toEqual({ ok: false, issue: 'telefon.format' });
  });

  it.each([
    ['erika.musterfrau@beispiel.de', 'erika.musterfrau@beispiel.de'],
    ['Erika.Muster@Beispiel.DE', 'Erika.Muster@beispiel.de'],
    [' erika@mail.beispiel-firma.com ', 'erika@mail.beispiel-firma.com'],
    ['jörg@müller.de', 'jörg@müller.de'],
  ])('e-mail %j → %s', (raw, stored) => {
    const mail: FieldDefinition = { ...plain, textFormat: 'email' };
    expect(normalizeFieldValue(mail, raw)).toEqual({ ok: true, value: stored, warnings: [] });
    expect(normalizeFieldValue(mail, stored)).toEqual({ ok: true, value: stored, warnings: [] });
  });

  it.each([
    'erika.beispiel.de',
    'erika@beispiel',
    '@beispiel.de',
    'erika@.de',
    'erika..m@beispiel.de',
    '.erika@beispiel.de',
    'erika@beispiel.d',
    'erika@-beispiel.de',
    'eri(ka)@beispiel.de',
    'erika@beispiel.de1',
  ])('e-mail %j is refused', (raw) => {
    const mail: FieldDefinition = { ...plain, textFormat: 'email' };
    expect(normalizeFieldValue(mail, raw)).toEqual({ ok: false, issue: 'email.format' });
  });

  it('takes counts in half steps (Kinderfreibetragszähler) and stores them with a comma', () => {
    const half: FieldDefinition = { ...plain, textFormat: 'halbeSchritte' };
    for (const [raw, stored] of [
      ['4', '4'],
      ['4,5', '4,5'],
      ['4.5', '4,5'],
      [' 04,50 ', '4,5'],
      ['10,0', '10'],
    ] as const) {
      expect(normalizeFieldValue(half, raw)).toEqual({ ok: true, value: stored, warnings: [] });
      expect(normalizeFieldValue(half, stored)).toEqual({ ok: true, value: stored, warnings: [] });
    }
    for (const raw of ['4,3', '4,25', '100', 'vier', '-1']) {
      expect(normalizeFieldValue(half, raw)).toEqual({ ok: false, issue: 'halbeSchritte.format' });
    }
  });

  it('steps a count in half steps with − and +, never below 0', () => {
    expect(stepHalfSteps('', 1)).toBe('0,5');
    expect(stepHalfSteps('1,5', 1)).toBe('2');
    expect(stepHalfSteps('2', -1)).toBe('1,5');
    expect(stepHalfSteps('0', -1)).toBe('0');
    expect(stepHalfSteps('quatsch', 1)).toBe('0,5');
    expect(stepHalfSteps('99,5', 1)).toBe('99,5');
  });

  it('stores a list entry of a suggestion field by its exact name, free text with a warning', () => {
    const kasse: FieldDefinition = { ...plain, suggestionsFrom: 'gkvKrankenkassen202610' };
    expect(normalizeFieldValue(kasse, ' techniker  krankenkasse ')).toEqual({
      ok: true,
      value: 'Techniker Krankenkasse',
      warnings: [],
    });
    expect(normalizeFieldValue(kasse, 'Meine Betriebskasse')).toEqual({
      ok: true,
      value: 'Meine Betriebskasse',
      warnings: ['list.freeEntry'],
    });
    expect(normalizeFieldValue(kasse, 'Techniker Krankenkasse')).toEqual({
      ok: true,
      value: 'Techniker Krankenkasse',
      warnings: [],
    });
  });

  it('leaves text fields without a format alone', () => {
    expect(normalizeFieldValue(plain, '1234')).toEqual({ ok: true, value: '1234', warnings: [] });
  });
});

describe('placeholders in question texts', () => {
  const name: FieldDefinition = { ...plain, id: 'familienname', label: 'Familienname' };
  const fieldOf = (id: string) => (id === 'familienname' ? name : undefined);
  const text = 'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen {familienname}?';

  it('shows the earlier answer in quotes', () => {
    expect(fillPlaceholders(text, fieldOf, () => 'Musterfrau')).toBe(
      'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Musterfrau“?',
    );
  });

  it('drops the placeholder and its space while the answer is missing', () => {
    expect(fillPlaceholders(text, fieldOf, () => null)).toBe(
      'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen?',
    );
  });

  // Chrome evaluation 2026-11-13 (part 3 B1): „Erika“ „Musterfrau“.
  it('quotes two answers side by side once, as one name', () => {
    const first: FieldDefinition = { ...plain, id: 'vorname', label: 'Vorname' };
    const both = (id: string) => (id === 'vorname' ? first : fieldOf(id));
    const value = (id: string) => (id === 'vorname' ? 'Erika' : 'Musterfrau');
    expect(
      fillPlaceholders(
        'Wodurch endet das Arbeitsverhältnis mit {vorname} {familienname}?',
        both,
        value,
      ),
    ).toBe('Wodurch endet das Arbeitsverhältnis mit „Erika Musterfrau“?');
  });

  it('lists the ids it names', () => {
    expect(placeholderIds(text)).toEqual(['familienname']);
    expect(placeholderIds('ohne')).toEqual([]);
  });
});

describe('definition rules for placeholders, quick answers and formats', () => {
  const problems = (change: (d: FormDefinition) => void) => {
    const d = structuredClone(beispielForm().definition);
    change(d);
    return checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`);
  };
  const field = (d: FormDefinition, id: string) => {
    const found = d.sections.flatMap((s) => s.fields).find((f) => f.id === id);
    if (!found) throw new Error(`fixture has no ${id}`);
    return found;
  };
  const ids = beispielForm().definition.sections.flatMap((s) =>
    s.fields.map((f) => `${f.role}:${f.id}:${f.type}`),
  );

  it('has the fields the cases below use', () => {
    expect(ids).toEqual(expect.arrayContaining(['person:nachname:text']));
  });

  it('accepts a placeholder of an earlier field of the same role', () => {
    const d = structuredClone(beispielForm().definition);
    const later = d.sections.flatMap((s) => s.fields).filter((f) => f.role === 'person')[1];
    if (!later) throw new Error('fixture changed');
    later.question = 'Stimmt {nachname}?';
    expect(checkFormDefinition(d)).toEqual([]);
  });

  it('refuses a placeholder of an unknown or later field', () => {
    expect(
      problems((d) => {
        field(d, 'nachname').question = 'Wie heißen Sie, {nachname}?';
      }),
    ).toEqual([expect.stringContaining('must name an earlier field')]);
  });

  it('refuses an invalid quick answer, an empty one on a required field and one on a choice', () => {
    expect(
      problems((d) => {
        Object.assign(field(d, 'nachname'), { quickAnswers: [{ label: 'Leer', value: null }] });
      }),
    ).toEqual([expect.stringContaining('a required field cannot be left empty')]);
    const date = beispielForm()
      .definition.sections.flatMap((s) => s.fields)
      .find((f) => f.type === 'date');
    if (date) {
      expect(
        problems((d) => {
          Object.assign(field(d, date.id), { quickAnswers: [{ label: 'Bald', value: 'bald' }] });
        }),
      ).toEqual([expect.stringContaining('not a valid answer (date.format)')]);
    }
    const choice = beispielForm()
      .definition.sections.flatMap((s) => s.fields)
      .find((f) => f.type === 'choice' || f.type === 'boolean');
    if (choice) {
      expect(
        problems((d) => {
          Object.assign(field(d, choice.id), { quickAnswers: [{ label: 'Ja', value: 'ja' }] });
        }),
      ).toEqual([expect.stringContaining('only typed fields have quick answers')]);
    }
  });

  it('refuses a text format on a field that is not text', () => {
    const date = beispielForm()
      .definition.sections.flatMap((s) => s.fields)
      .find((f) => f.type === 'date');
    if (!date) throw new Error('fixture has no date field');
    expect(
      problems((d) => {
        Object.assign(field(d, date.id), { textFormat: 'postleitzahlDe' });
      }),
    ).toEqual([expect.stringContaining('only text fields have a text format')]);
  });
});
