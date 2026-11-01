// The manual tests (manual_tests/*.md) as data for the test page of the hosted test folder
// (Tobias 2026-11-01: "manual_tests als Quelle"): one case per "## MT-xx: title", its labelled parts
// ("**Schritte:**", "**Erwartet:**", …) as paragraphs, lists and code. Inline Markdown stays in the
// strings; inlineMarkdown() splits it for a renderer that never uses HTML.

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; text: string };

export interface CasePart {
  /** "Voraussetzungen", "Schritte", "Erwartet", …; "" for text before the first label. */
  label: string;
  blocks: Block[];
}

export interface ManualTestCase {
  id: string;
  title: string;
  parts: CasePart[];
}

export interface ManualTestFile {
  /** The file's heading without its number, e.g. "Ausfüllen (Interview)". */
  area: string;
  source: string;
  /** Text between the heading and the first case (environment, test files). */
  intro: Block[];
  cases: ManualTestCase[];
}

// MT-… from manual_tests/ (public), L-… from the local file with DATEV's names (never committed).
const CASE = /^## ((?:MT|L)-\d+[a-z]?): (.+)$/;
const LABEL = /^\*\*([^*]+?):\*\*\s*(.*)$/;
const ORDERED = /^\d+\.\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;

/** Paragraphs, lists and code fences of a run of lines. */
export function blocksOf(lines: readonly string[]): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;
  let code: string[] | undefined;
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'text', text: paragraph.join(' ') });
    paragraph = [];
  };
  const closeList = () => {
    if (list) blocks.push({ kind: 'list', ...list });
    list = undefined;
  };
  for (const raw of lines) {
    if (code) {
      if (raw.trim().startsWith('```')) {
        blocks.push({ kind: 'code', text: code.join('\n') });
        code = undefined;
      } else code.push(raw);
      continue;
    }
    const line = raw.trimEnd();
    if (line.trim().startsWith('```')) {
      flush();
      closeList();
      code = [];
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    const ordered = ORDERED.exec(line);
    const bullet = ordered ? undefined : BULLET.exec(line);
    if (ordered || bullet) {
      flush();
      const isOrdered = ordered !== null;
      if (list && list.ordered !== isOrdered) closeList();
      list ??= { ordered: isOrdered, items: [] };
      list.items.push((ordered ?? bullet)?.[1]?.trim() ?? '');
      continue;
    }
    if (list && /^\s+\S/.test(line)) {
      // An indented line continues the last list item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  if (code) blocks.push({ kind: 'code', text: code.join('\n') });
  flush();
  closeList();
  return blocks;
}

function partsOf(lines: readonly string[]): CasePart[] {
  const parts: { label: string; lines: string[] }[] = [{ label: '', lines: [] }];
  for (const line of lines) {
    const label = LABEL.exec(line);
    if (label) parts.push({ label: label[1]?.trim() ?? '', lines: label[2] ? [label[2]] : [] });
    else parts[parts.length - 1]?.lines.push(line);
  }
  return parts
    .map((part) => ({ label: part.label, blocks: blocksOf(part.lines) }))
    .filter((part) => part.label !== '' || part.blocks.length > 0);
}

export function parseManualTests(markdown: string, source: string): ManualTestFile {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const heading = lines.find((line) => line.startsWith('# ')) ?? '';
  const area = heading.replace(/^#\s+(\d+\s*[–-]\s*)?/, '').trim();
  const intro: string[] = [];
  const cases: { id: string; title: string; lines: string[] }[] = [];
  let inIntro = false;
  for (const line of lines) {
    const start = CASE.exec(line);
    if (start) {
      cases.push({ id: start[1] ?? '', title: start[2]?.trim() ?? '', lines: [] });
      continue;
    }
    if (line === heading) {
      inIntro = true;
      continue;
    }
    if (/^---\s*$/.test(line) || (line.startsWith('## ') && cases.length === 0)) {
      inIntro = false;
      continue;
    }
    if (line.startsWith('## ')) continue;
    const current = cases[cases.length - 1];
    if (current) current.lines.push(line);
    else if (inIntro) intro.push(line);
  }
  return {
    area,
    source,
    intro: blocksOf(intro),
    cases: cases.map((c) => ({ id: c.id, title: c.title, parts: partsOf(c.lines) })),
  };
}

export type InlineToken =
  | { kind: 'text' | 'strong' | 'em' | 'code'; text: string }
  | { kind: 'link'; text: string; href: string }
  /** A reference to another test ("MT-10", "MT-83/84" gives two), clickable on the test page. */
  | { kind: 'ref'; text: string; id: string };

const REF = /\b((?:MT|L)-\d+[a-z]?)\b/g;

/** Plain text with its test references split out. */
function withRefs(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let at = 0;
  for (const match of text.matchAll(REF)) {
    if (match.index > at) tokens.push({ kind: 'text', text: text.slice(at, match.index) });
    tokens.push({ kind: 'ref', text: match[0], id: match[1] ?? match[0] });
    at = match.index + match[0].length;
  }
  if (at < text.length) tokens.push({ kind: 'text', text: text.slice(at) });
  return tokens;
}

/**
 * Whether a case can be run in the hosted test area (Tobias 2026-11-01): a part "Testbereich"
 * starting with "nein" says it cannot (e.g. a double-click on the downloaded file); any other text
 * there is a hint for the tester.
 */
export function testAreaOf(testCase: ManualTestCase): { offered: boolean; note?: string } {
  const part = testCase.parts.find((p) => p.label === 'Testbereich');
  const first = part?.blocks[0];
  const note = first && first.kind !== 'list' ? first.text : undefined;
  if (note === undefined) return { offered: true };
  return { offered: !/^nein\b/i.test(note), note };
}

const INLINE =
  /\*\*(.+?)\*\*|`([^`]+)`|(?<![A-Za-z0-9])_(.+?)_(?![A-Za-z0-9])|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Bold, code, italics and links of one line; a link is kept only with an https address (relative
 * links into the repository mean nothing on the test page — their text stays).
 */
export function inlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index;
    if (index > at) tokens.push(...withRefs(text.slice(at, index)));
    const [, strong, code, em, linkText, href] = match;
    if (strong !== undefined) tokens.push({ kind: 'strong', text: strong });
    else if (code !== undefined) tokens.push({ kind: 'code', text: code });
    else if (em !== undefined) tokens.push({ kind: 'em', text: em });
    else if (linkText !== undefined && href !== undefined) {
      tokens.push(
        href.startsWith('https://')
          ? { kind: 'link', text: linkText, href }
          : { kind: 'text', text: linkText.replace(/^`|`$/g, '') },
      );
    }
    at = index + match[0].length;
  }
  if (at < text.length) tokens.push(...withRefs(text.slice(at)));
  return tokens;
}
