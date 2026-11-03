// Character rules of the DEÜV data fields name, birth data and address (DSME „Datensatz Meldung –
// Datensatz und Datenbausteine sowie Fehlerkatalog“, gültig ab 01.01.2026: DBNA014/020/022,
// DBNA034/036, DBNA084/086/089, DBGB134/136/138/142, DBAN022/024, DBAN124/130/140/144, DBAN156,
// DBAN174/176). Only hints: the report's own checks decide; a name as it stands in the passport is
// never refused here. Letters are those of the Latin script („westeuropäischer Zeichensatz“,
// Gemeinsames Rundschreiben Meldeverfahren Tz. 1.3.3.1).
import type { IssueCode } from './issues';
import type { DeuevRule } from './model';

interface CharacterRule {
  /** Every character of the value. */
  allowed: RegExp;
  /** The first character(s). */
  first?: RegExp;
  /** The last character. */
  last?: RegExp;
  /** At least this many letters. */
  minLetters?: number;
}

const L = '\\p{Script=Latin}';
const APOSTROPHE = "'’";
const rule = (
  allowed: string,
  first?: string,
  last?: string,
  minLetters?: number,
): CharacterRule => ({
  allowed: new RegExp(`^[${allowed}]+$`, 'u'),
  ...(first === undefined ? {} : { first: new RegExp(`^(?:${first})`, 'u') }),
  ...(last === undefined ? {} : { last: new RegExp(`(?:${last})$`, 'u') }),
  ...(minLetters === undefined ? {} : { minLetters }),
});

export const DEUEV_CHARACTER_RULES: Readonly<Record<DeuevRule, CharacterRule>> = {
  // Familien- und Geburtsname: letters, spaces, hyphens, apostrophes, digits, brackets, full stops;
  // first a letter other than ß (or an apostrophe and a letter); last a letter, digit, ")", "." or
  // an apostrophe.
  familienname: rule(
    `${L}\\d ${APOSTROPHE}\\-().`,
    `(?!ß)${L}|[${APOSTROPHE}]${L}`,
    `[${L}\\d).${APOSTROPHE}]`,
  ),
  // Vorname: letters, hyphens, spaces, apostrophes, full stops; first a letter other than ß.
  vorname: rule(`${L} ${APOSTROPHE}\\-.`, `(?!ß)${L}`, `[${L}.${APOSTROPHE}]`),
  // Titel: letters, spaces, full stops, hyphens, brackets; first a letter, last a letter, "." or ")".
  titel: rule(`${L} .\\-()`, L, `[${L}.)]`),
  // Geburtsort: letters, digits, spaces, full stops, commas, hyphens, slashes, apostrophes,
  // brackets; first a letter, at least two letters, last a letter, ".", ")" or a digit.
  geburtsort: rule(`${L}\\d .,\\-/${APOSTROPHE}()`, L, `[${L}.)\\d]`, 2),
  // Wohnort (the wider rule of an address abroad, which also allows digits and apostrophes).
  wohnort: rule(`${L}\\d .,\\-/${APOSTROPHE}()`, L, `[${L}\\d.)]`, 2),
  // Straße: letters, digits, spaces, full stops, commas, hyphens, slashes, apostrophes, brackets,
  // ampersands and quotation marks.
  strasse: rule(`${L}\\d .,\\-/${APOSTROPHE}()&"„“`),
  // Hausnummer: letters, digits, commas, spaces, hyphens, slashes, full stops; first and last a
  // letter or a digit.
  hausnummer: rule(`${L}\\d ,\\-/.`, `[${L}\\d]`, `[${L}\\d]`),
  // Postleitzahl abroad: letters, digits, hyphens, spaces.
  plzAusland: rule('A-Za-z\\d \\-'),
};

const LETTER = /\p{Script=Latin}/gu;

/** The hints for a value under a DEÜV character rule; none when it fits. */
export function deuevHints(name: DeuevRule, text: string): IssueCode[] {
  const { allowed, first, last, minLetters } = DEUEV_CHARACTER_RULES[name];
  const hints: IssueCode[] = [];
  const letters = text.match(LETTER)?.length ?? 0;
  if (
    !allowed.test(text) ||
    (minLetters !== undefined && letters < minLetters) ||
    (name === 'plzAusland' && text.includes('--'))
  ) {
    hints.push('deuev.zeichen');
  }
  if (first && !first.test(text)) hints.push('deuev.anfang');
  if (last && !last.test(text)) hints.push('deuev.ende');
  return hints;
}
