// Typing aids for dates and months; the stored value still comes from normalize.ts on "Weiter".
// The German iPhone keypad offers digits and a comma but no dot (iPhone test reports 2026-11-01 and
// 2026-11-04), and nobody can know that the comma counts. So the mask shows the dots before they
// are typed, they appear by themselves after the digits of day and month, and a comma shows as a dot.
import { boundDay } from './clock';
import { formatGermanDate, isIsoDate } from './dates';
import type { FieldDefinition, FieldType, IsoDate } from './model';
import { normalizeDate } from './normalize';

export const TYPED_MASKS: Partial<Record<FieldType, string>> = {
  date: 'TT.MM.JJJJ',
  month: 'MM.JJJJ',
};

/** The text as it stays in the input while typing. Dots the person types stay where they are. */
export function typedText(type: FieldType, text: string): string {
  const mask = TYPED_MASKS[type];
  if (mask === undefined) return text;
  const dotted = text.replace(/,/g, '.');
  if (!/^[\d.]*$/.test(dotted)) return dotted;
  const widths = mask
    .split('.')
    .slice(0, -1)
    .map((part) => part.length);
  const parts: string[] = [];
  let rest = dotted;
  for (const width of widths) {
    const dot = rest.indexOf('.');
    const head = dot === -1 ? rest : rest.slice(0, dot);
    if (head.length > width) {
      parts.push(head.slice(0, width));
      rest = rest.slice(width);
    } else if (dot === -1) {
      return [...parts, head].join('.');
    } else {
      parts.push(head);
      rest = rest.slice(dot + 1);
    }
  }
  return [...parts, rest].join('.');
}

/**
 * The part of the mask still to type ("021" → "M.JJJJ"), or undefined when the text does not
 * follow the mask (one-digit day, pasted ISO date) — then no mask is shown.
 */
export function maskRest(type: FieldType, text: string): string | undefined {
  const mask = TYPED_MASKS[type];
  if (mask === undefined || text.length > mask.length) return undefined;
  for (const [index, char] of [...text].entries()) {
    if (mask[index] === '.' ? char !== '.' : !/^\d$/.test(char)) return undefined;
  }
  return mask.slice(text.length);
}

/** The date for the device's date picker: the typed one when it is a real date, else none. */
export function pickerValue(text: string): IsoDate | '' {
  const checked = normalizeDate(text);
  return checked.ok ? checked.value : '';
}

/** The picked date as typed text; '' for anything that is no date. */
export function fromPicker(value: string): string {
  return isIsoDate(value) ? formatGermanDate(value) : '';
}

/** The earliest and latest day the picker offers, from the field's bounds. */
export function pickerBounds(field: FieldDefinition): { min?: IsoDate; max?: IsoDate } {
  return {
    ...(field.minDate === undefined ? {} : { min: boundDay(field.minDate) }),
    ...(field.maxDate === undefined ? {} : { max: boundDay(field.maxDate) }),
  };
}
