// Build step: the minifier writes the escape of U+FFFD (REPLACEMENT CHARACTER) as the character
// itself. Browsers accept that, but tools that guard against text damaged by an edit (e.g. the
// artifact upload) refuse files containing it. In JavaScript the character can only stand in a
// string, template, regular expression or comment, where the six-character escape means the same
// (String.raw would differ; the bundle uses none on this character). Built from code points so
// no editing tool can turn the escape back into the character.
export const REPLACEMENT_CHAR = String.fromCodePoint(0xfffd);
export const REPLACEMENT_ESCAPE = `${String.fromCodePoint(0x5c)}uFFFD`;

export function escapeReplacementChar(code: string): string {
  return code.split(REPLACEMENT_CHAR).join(REPLACEMENT_ESCAPE);
}
