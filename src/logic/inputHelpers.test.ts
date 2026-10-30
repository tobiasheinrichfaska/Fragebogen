// Review of 2026-10-30: German postcode format, earlier answers in question texts, quick-answer
// buttons — and the definition rules that keep them sound.
import { fillPlaceholders, placeholderIds } from './display';
import { checkFormDefinition } from './formDefinition';
import type { FieldDefinition, FormDefinition } from './model';
import { normalizeFieldValue } from './normalize';
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
