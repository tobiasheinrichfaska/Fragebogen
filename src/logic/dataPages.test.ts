import {
  CHARS_PER_LINE,
  DATA_LINES_MESSAGES,
  decodeDataLines,
  encodeDataLines,
  fromBase64Url,
  toBase64Url,
} from './dataPages';

const ID = '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c';
const TEXT = JSON.stringify({
  hinweis: 'Erfundene Testdaten – Müller, Straße, „Zitat“',
  werte: Array.from({ length: 120 }, (_, i) => `Wert ${i} ${'x'.repeat(i % 17)}`),
});

function allLines(text = TEXT): string[] {
  const block = encodeDataLines(text, ID);
  return [...block.header, ...block.lines];
}

describe('base64url', () => {
  it('round-trips every length and byte value', () => {
    for (let length = 0; length < 40; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 97 + length * 13) % 256);
      expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    }
  });

  it.each(['ab+c', 'ab/c', 'abc=', 'a', 'ab c'])('refuses %j', (text) => {
    expect(fromBase64Url(text)).toBeUndefined();
  });
});

describe('encodeDataLines / decodeDataLines', () => {
  it('round-trips the exact text', () => {
    expect(decodeDataLines(allLines())).toMatchObject({
      ok: true,
      text: TEXT,
      questionnaireId: ID,
    });
  });

  it('reads lines in any order and with extra whitespace (pdf.js output)', () => {
    const shuffled = allLines()
      .reverse()
      .map((line) => line.replace(/ /g, '   '));
    expect(decodeDataLines(['Anlage: Daten', ...shuffled, 'Seite 3 von 3'])).toMatchObject({
      ok: true,
      text: TEXT,
    });
  });

  it('keeps every line inside the page: at most 106 characters', () => {
    const block = encodeDataLines(TEXT, ID);
    for (const line of [...block.header, ...block.lines]) {
      expect(line.length).toBeLessThanOrEqual(4 + 1 + CHARS_PER_LINE + 1 + 4);
    }
  });

  it('names a damaged and a missing line', () => {
    const lines = allLines();
    const damaged = lines.map((line, i) =>
      i === 3
        ? line.replace(/ ([A-Za-z0-9_-])/, (_m, c: string) => ` ${c === 'A' ? 'B' : 'A'}`)
        : line,
    );
    const result = decodeDataLines(damaged.filter((_, i) => i !== 5));
    expect(result).toEqual({
      ok: false,
      issue: 'badLines',
      detail: ['Zeile 2 beschädigt', 'Zeile 4 fehlt'],
    });
  });

  it.each<[string, (lines: string[]) => string[], string]>([
    ['no data pages at all', () => ['Personalfragebogen', 'Seite 1 von 2'], 'notFound'],
    [
      'a newer format version',
      (l) => l.map((x) => x.replace('FRAGEBOGEN-DATEN 1 ', 'FRAGEBOGEN-DATEN 2 ')),
      'unknownVersion',
    ],
    ['a missing digest line', (l) => l.filter((x) => !x.startsWith('SHA256')), 'digestLineMissing'],
    [
      'a wrong digest',
      (l) => l.map((x) => (x.startsWith('SHA256') ? `SHA256 ${'0'.repeat(64)}` : x)),
      'digestMismatch',
    ],
    ['a wrong length', (l) => l.map((x) => x.replace(/BYTES \d+$/, 'BYTES 7')), 'lengthMismatch'],
  ])('refuses %s', (_label, change, issue) => {
    expect(decodeDataLines(change(allLines()))).toMatchObject({ ok: false, issue });
  });

  it('has a German message for every issue', () => {
    for (const message of Object.values(DATA_LINES_MESSAGES)) expect(message).toMatch(/\.$/);
  });
});
