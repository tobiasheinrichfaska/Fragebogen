// Suggested answers in the input box (Tobias 2026-11-05: the Mandatsreferenz from the
// Mandantennummer, the signer's name, place and date of signing) — the template, what the box
// shows first, and the definition rules that keep suggestions sound.
import { suggestedText } from './display';
import { fieldsById } from './form';
import { checkFormDefinition } from './formDefinition';
import { initialInput } from './interview';
import type { FieldDefinition, FormDefinition } from './model';
import { beispielForm } from '../../tests/support/sample';

const definition = (change: (d: FormDefinition) => void = () => undefined) => {
  const d = structuredClone(beispielForm().definition);
  change(d);
  return d;
};
const field = (d: FormDefinition, id: string): FieldDefinition => {
  const found = fieldsById(d).get(id);
  if (!found) throw new Error(`fixture has no ${id}`);
  return found;
};
const TODAY = '2026-11-05';

describe('the template', () => {
  const fields = fieldsById(beispielForm().definition);
  const fieldOf = (id: string) => fields.get(id);

  it('puts the answers in as typed, without quotes', () => {
    expect(suggestedText('{nachname}0000001', fieldOf, () => '10001')).toBe('100010000001');
    expect(suggestedText('Herr {nachname}', fieldOf, () => 'Muster')).toBe('Herr Muster');
  });

  it('proposes nothing while a placeholder is unanswered or the text is empty', () => {
    expect(suggestedText('{nachname}0000001', fieldOf, () => null)).toBeUndefined();
    expect(suggestedText('{nachname}0000001', fieldOf, () => undefined)).toBeUndefined();
    expect(suggestedText('{unbekannt}', fieldOf, () => 'x')).toBeUndefined();
    expect(suggestedText(' ', fieldOf, () => 'x')).toBeUndefined();
  });
});

describe('what the input box shows first', () => {
  const d = definition((def) => {
    field(def, 'bemerkungen').suggestedText = ['{weitereArt} bei {nachname}', '{nachname}'];
    field(def, 'geburtsdatum').suggestedText = 'today';
  });
  const box = (id: string, data: Record<string, unknown>) =>
    initialInput(d, field(d, id), data as never, TODAY);

  it('proposes the first template whose placeholders hold a visible answer', () => {
    expect(
      box('bemerkungen', { nachname: 'Muster', weitereBeschaeftigung: true, weitereArt: 'sv' }),
    ).toEqual({ text: 'sv bei Muster', suggested: true });
    // A hidden answer (no further employment) proposes nothing; the next template does.
    expect(
      box('bemerkungen', { nachname: 'Muster', weitereBeschaeftigung: false, weitereArt: 'sv' }),
    ).toEqual({ text: 'Muster', suggested: true });
    expect(box('bemerkungen', {})).toEqual({ text: '', suggested: false });
  });

  it('shows the answer once there is one, and nothing after it was left empty on purpose', () => {
    expect(box('bemerkungen', { nachname: 'Muster', bemerkungen: 'eigene' })).toEqual({
      text: 'eigene',
      suggested: false,
    });
    expect(box('bemerkungen', { nachname: 'Muster', bemerkungen: null })).toEqual({
      text: '',
      suggested: false,
    });
  });

  it('proposes today for a date as it is typed', () => {
    expect(box('geburtsdatum', {})).toEqual({ text: '05.11.2026', suggested: true });
    expect(box('geburtsdatum', { geburtsdatum: '1990-01-31' })).toEqual({
      text: '31.01.1990',
      suggested: false,
    });
  });

  it('proposes nothing for a field without a suggestion', () => {
    expect(box('nachname', {})).toEqual({ text: '', suggested: false });
  });
});

describe('definition rules for suggestions', () => {
  const problems = (change: (d: FormDefinition) => void) =>
    checkFormDefinition(definition(change)).map((issue) => `${issue.path} ${issue.message}`);

  it('accepts earlier answers of the same role, several templates and today on a date', () => {
    expect(
      problems((d) => {
        field(d, 'bemerkungen').suggestedText = ['{weitereArt}', '{nachname}'];
        field(d, 'geburtsdatum').suggestedText = 'today';
      }),
    ).toEqual([]);
  });

  it('refuses a later field, another role, a non-text field, a date template and master data', () => {
    expect(
      problems((d) => {
        field(d, 'nachname').suggestedText = '{bemerkungen}';
      }),
    ).toEqual([expect.stringContaining('"{bemerkungen}" must name an earlier field')]);
    expect(
      problems((d) => {
        field(d, 'eintritt').suggestedText = 'today';
        field(d, 'agNachname').suggestedText = '{nachname}';
      }),
    ).toEqual([expect.stringContaining('"{nachname}" belongs to another role')]);
    expect(
      problems((d) => {
        field(d, 'weitereBeschaeftigung').suggestedText = 'ja';
      }),
    ).toEqual([expect.stringContaining('only text and date fields suggest an answer')]);
    expect(
      problems((d) => {
        field(d, 'geburtsdatum').suggestedText = ['today', '{nachname}'];
      }),
    ).toEqual([expect.stringContaining('a date field can only suggest "today"')]);
    expect(
      problems((d) => {
        Object.assign(field(d, 'agNachname'), { masterData: 'firma', suggestedText: 'Firma' });
      }),
    ).toEqual([
      expect.stringContaining('a master-data field is filled from the link, not suggested'),
    ]);
  });
});
