// Invented answers for any field, as a person would type or pick them: the walk over every form
// (tests/forms/walkWithNext.test.ts) tries them in order until the app takes one. The strategies
// reach different branches: "first" picks the first option and yes, "last" the last option and no,
// "lastYes" the last option and yes (e.g. a second account holder who must sign too).
import { normalizeFieldValue } from '../../src/logic/normalize';
import type { FieldDefinition, FormDefinition, TextFormat } from '../../src/logic/model';
import { optionsOf } from '../../src/logic/options';

export type Strategy = 'first' | 'last' | 'lastYes';
export const STRATEGIES: readonly Strategy[] = ['first', 'last', 'lastYes'];

const TEXT_BY_FORMAT: Readonly<Record<TextFormat, readonly string[]>> = {
  postleitzahlDe: ['12345'],
  kldb2010: ['71402', '12345'],
  halbeSchritte: ['1', '1,5', '2'],
  telefon: ['0721 123456'],
  email: ['erika@example.org'],
  bic: ['COBADEFFXXX'],
  steuernummer: ['12345/67890', '12/345/67890', '123/456/78901', '2181508150', '21815081508'],
  jahr: ['2026', '2025'],
  ziffern: ['1', '123'],
  kfzKennzeichen: ['KA-AB 123', 'KA AB 123'],
  glaeubigerId: ['DE98ZZZ09999999999'],
  mandatsreferenz: ['BSP-2026-001'],
};

// The date that dates a version (e.g. the start of employment) must lie in its validity; every
// form so far is valid in November 2026, and these days lie before any test run.
const VALIDITY_DATES = ['01.11.2026', '12.11.2026', '01.01.2026'];
// 31.12.2026 first: an end of a fixed term well after the start of 01.11.2026 (a term of under a
// week is a special case the forms refuse; an end before the start is not refused — see CLAUDE.md,
// Known Limitations). A field that allows no future day (a birth date) takes 17.05.1990.
const ADULT = ['31.12.2026', '17.05.1990', '01.11.2026', '01.01.2026', '12.11.2026', '01.01.2000'];
const RECENT = ['01.11.2026', '17.05.1990', '01.01.2026', '12.11.2026', '01.01.2000'];
const DATES: Readonly<Record<Strategy, readonly string[]>> = {
  first: ADULT,
  last: RECENT,
  lastYes: ADULT,
};

const ordered = <T>(items: readonly T[], strategy: Strategy): T[] =>
  strategy === 'first' ? [...items] : [...items].reverse();

/** The raw answers to try for `field`, best first. */
export function candidates(
  definition: FormDefinition,
  field: FieldDefinition,
  strategy: Strategy,
): unknown[] {
  const validityField = definition.validity?.field;
  switch (field.type) {
    case 'choice':
      return ordered(optionsOf(field), strategy).map((option) => option.id);
    case 'multiChoice': {
      const ids = optionsOf(field).map((option) => option.id);
      const singles = ordered(ids, strategy).map((id) => [id]);
      return strategy === 'first' ? singles : [ids, ...singles];
    }
    case 'boolean':
      return strategy === 'last' ? [false, true] : [true, false];
    case 'date':
      return field.id === validityField ? VALIDITY_DATES : [...DATES[strategy]];
    case 'month':
      return field.id === validityField ? ['11.2026'] : ['11.2026', '01.2026', '12.2025'];
    case 'money':
      return ordered(['1000', '3200'], strategy).concat(['450', '100']);
    case 'number': {
      const bounds = [field.min, field.max].filter((n): n is number => n !== undefined);
      return [...ordered(bounds, strategy), 1, 10, 40, 0].map(String);
    }
    case 'iban':
      return ['DE89370400440532013000'];
    case 'taxId':
      return ['86095742719'];
    case 'svNumber':
      return ['65170590M520'];
    case 'betriebsnummer':
      return ['12345671'];
    case 'text': {
      const texts = field.textFormat ? TEXT_BY_FORMAT[field.textFormat] : ['Beispiel'];
      return texts.map((text) =>
        field.maxLength === undefined ? text : text.slice(0, field.maxLength),
      );
    }
    case 'repeatGroup': {
      const row: Record<string, unknown> = { rowId: 'r1' };
      for (const column of field.columns ?? []) {
        const value = candidates(definition, column, strategy).find(
          (raw) => normalizeFieldValue(column, raw).ok,
        );
        if (value !== undefined) row[column.id] = value;
      }
      return [[row]];
    }
    case 'file':
    case 'calendar':
      return [];
  }
}
