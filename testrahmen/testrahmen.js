// GENERATED from Testumgebung (testrahmen/) by `npm run rahmen` — do not edit here: change it
// there and copy it again. Stand 61c19c6. Checked by pruefen.mjs against testrahmen.json.
// Test reports without free text (Tobias 2026-11-15, docs/testbericht.md). Pure and import-free:
// the build puts it into every script ahead of logik.ts, which answers the routes
// (`POST /_zugang/bericht`, `/_zugang/berichte`).
//
// - A report holds only the version, per test the result and the time, and for a failed test the
//   steps with a reason from a fixed list. Every string is checked against a pattern or a list, so
//   no field can carry text of its own; anything unknown is refused.
// - The script adds the tester (from the login, never from the report), the time it came in and a
//   coarse device class from the User-Agent; the full User-Agent is never stored.

const REPORT_FORMAT = 'testbericht/1';
const REPORT_MAX_BYTES = 64 * 1024;
const REPORTS_SHOWN = 200;

const RESULTS = ['bestanden', 'nicht bestanden', 'nicht getestet']         ;
                                       

/** Reason key → label shown to the fixed testers. */
const REASONS                                   = {
  'anderes-ergebnis': 'Anderes Ergebnis als erwartet',
  fehlermeldung: 'Fehlermeldung',
  fehlt: 'Knopf oder Text fehlt',
  haengt: 'Lädt nicht oder hängt',
  darstellung: 'Darstellung falsch',
};

const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung', 'andere']         ;
const SYSTEMS = ['iPhone', 'iPad', 'Android', 'Windows', 'macOS', 'Linux', 'andere']         ;

                      
                      
                         
 

                      
                      
                            
                             
                                            
 

                  
                          
                       
                           
                         
                                        
 

                  
                           
                          
 

                                       
                          
                           
                          
 

                                                                                                                     

const APP_ID = /^[a-z][a-z0-9-]{1,40}$/;
const VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const COMMIT = /^[0-9a-f]{7,40}$/;
const TEST_ID = /^MT-\d{2,3}(-\d{2})?[a-z]?$/;
const TESTER_NAME = /^[A-Za-z0-9._-]{1,32}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const REPORT_FILE = /^\d{8}-\d{6}-[A-Za-z0-9._-]{1,32}-[0-9a-f]{12}\.json$/;

const isAppId = (value         )                  => typeof value === 'string' && APP_ID.test(value);
const isReportFile = (name        )          => REPORT_FILE.test(name);

const isObject = (value         )                                   =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isWhole = (value         , min        , max        )                  =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
/** Names a refused field only when its name is harmless to show. */
const fieldName = (key        ) => (/^[A-Za-z0-9_-]{1,40}$/.test(key) ? `„${key}“` : 'mit diesem Namen');

function unknownField(raw                         , allowed                   , where        )                     {
  const extra = Object.keys(raw).find((k) => !allowed.includes(k));
  return extra === undefined ? undefined : `${where}Feld ${fieldName(extra)} ist nicht erlaubt.`;
}

function checkSteps(raw         , where        )                                                {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 99) {
    return { message: `${where}schritte braucht bei „nicht bestanden“ 1 bis 99 Einträge.` };
  }
  const steps               = [];
  const seen = new Set        ();
  for (const [j, entry] of raw.entries()) {
    const at = `${where}schritte[${j}]: `;
    if (!isObject(entry)) return { message: `${at}Eintrag muss ein Objekt sein.` };
    const extra = unknownField(entry, ['nr', 'grund'], at);
    if (extra) return { message: extra };
    if (!isWhole(entry.nr, 1, 99)) return { message: `${at}nr muss eine ganze Zahl von 1 bis 99 sein.` };
    if (seen.has(entry.nr)) return { message: `${at}Schritt ${entry.nr} kommt doppelt vor.` };
    if (typeof entry.grund !== 'string' || !Object.prototype.hasOwnProperty.call(REASONS, entry.grund)) {
      return { message: `${at}grund muss einer von ${Object.keys(REASONS).join(', ')} sein.` };
    }
    seen.add(entry.nr);
    steps.push({ nr: entry.nr, grund: entry.grund });
  }
  return { steps };
}

function checkTest(raw         , i        )                                             {
  const at = `tests[${i}]: `;
  if (!isObject(raw)) return { message: `${at}Eintrag muss ein Objekt sein.` };
  const extra = unknownField(raw, ['id', 'ergebnis', 'sekunden', 'schritte'], at);
  if (extra) return { message: extra };
  if (typeof raw.id !== 'string' || !TEST_ID.test(raw.id)) return { message: `${at}id muss wie MT-03 aussehen.` };
  const result = RESULTS.find((r) => r === raw.ergebnis);
  if (!result) return { message: `${at}ergebnis muss „bestanden“, „nicht bestanden“ oder „nicht getestet“ sein.` };
  if (result === 'nicht getestet') {
    if ('sekunden' in raw || 'schritte' in raw) return { message: `${at}sekunden und schritte gibt es nicht bei „nicht getestet“.` };
    return { test: { id: raw.id, ergebnis: result } };
  }
  if (!isWhole(raw.sekunden, 0, 86_400)) return { message: `${at}sekunden muss eine ganze Zahl von 0 bis 86400 sein.` };
  if (result === 'bestanden') {
    if ('schritte' in raw) return { message: `${at}schritte gibt es nur bei „nicht bestanden“.` };
    return { test: { id: raw.id, ergebnis: result, sekunden: raw.sekunden } };
  }
  const steps = checkSteps(raw.schritte, at);
  if ('message' in steps) return steps;
  return { test: { id: raw.id, ergebnis: result, sekunden: raw.sekunden, schritte: steps.steps } };
}

/**
 * The strict check of a report for the app of this test area. On success the report is rebuilt
 * from the checked values only, so nothing else can reach the store.
 */
function checkReport(raw         , app        )              {
  const fail = (message        )              => ({ ok: false, message });
  if (!isObject(raw)) return fail('Der Bericht muss ein JSON-Objekt sein.');
  const extra = unknownField(raw, ['format', 'app', 'version', 'stand', 'tests'], '');
  if (extra) return fail(extra);
  if (raw.format !== REPORT_FORMAT) return fail(`format muss „${REPORT_FORMAT}“ sein.`);
  if (raw.app !== app) return fail(`app muss „${app}“ sein.`);
  if (typeof raw.version !== 'string' || !VERSION.test(raw.version)) return fail('version muss wie 1.4.2 aussehen.');
  if (typeof raw.stand !== 'string' || !COMMIT.test(raw.stand)) return fail('stand muss ein Commit sein: 7 bis 40 Zeichen aus 0-9 und a-f.');
  if (!Array.isArray(raw.tests) || raw.tests.length === 0 || raw.tests.length > 300) return fail('tests braucht 1 bis 300 Einträge.');
  const tests               = [];
  const ids = new Set        ();
  for (const [i, entry] of raw.tests.entries()) {
    const checked = checkTest(entry, i);
    if ('message' in checked) return fail(checked.message);
    if (ids.has(checked.test.id)) return fail(`tests[${i}]: ${checked.test.id} kommt doppelt vor.`);
    ids.add(checked.test.id);
    tests.push(checked.test);
  }
  return { ok: true, report: { format: REPORT_FORMAT, app, version: raw.version, stand: raw.stand, tests } };
}

/** Browser and system in fixed classes; the order of the checks matters (Edge and Samsung say Chrome too). */
function deviceClass(userAgent               )         {
  const ua = userAgent ?? '';
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser\//.test(ua)
      ? 'Samsung'
      : /OPR\/|Opera|YaBrowser\//.test(ua)
        ? 'andere'
        : /Firefox\/|FxiOS\//.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS\/|Chromium\//.test(ua)
            ? 'Chrome'
            : /Version\/.*Safari\//.test(ua)
              ? 'Safari'
              : 'andere';
  const system = /iPhone|iPod/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Macintosh|Mac OS X/.test(ua)
            ? 'macOS'
            : /CrOS/.test(ua)
              ? 'andere'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'andere';
  return { browser, system };
}

/** Seconds since 1970 as `2026-11-15T19:40:00Z`. */
const instant = (seconds        )         => new Date(seconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** `<Eingang>-<Tester>-<Zufall>.json`, e.g. `20261115-194000-tobias-0a1b2c3d4e5f.json`; sorts by time. */
function reportFileName(seconds        , tester        , random            )         {
  const stamp = instant(seconds).replace(/[-:]/g, '').replace('T', '-').replace('Z', '');
  const hex = [...random.slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${stamp}-${tester}-${hex}.json`;
}

function storedReportText(report        , tester        , seconds        , device        )         {
  const stored               = {
    format: report.format,
    app: report.app,
    version: report.version,
    stand: report.stand,
    tester,
    eingang: instant(seconds),
    geraet: { browser: device.browser, system: device.system },
    tests: report.tests,
  };
  // Compact: a stored report is about as large as the one sent (at most 64 KB), not 2.6 times.
  return `${JSON.stringify(stored)}\n`;
}

/** A stored report, checked again as strictly as on the way in; undefined for anything broken. */
function parseStoredReport(text                    , app        )                           {
  if (text === undefined) return undefined;
  let raw         ;
  try {
    raw = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!isObject(raw)) return undefined;
  const { tester, eingang, geraet, ...rest } = raw;
  if (typeof tester !== 'string' || !TESTER_NAME.test(tester) || typeof eingang !== 'string' || !INSTANT.test(eingang)) return undefined;
  if (!isObject(geraet) || Object.keys(geraet).length !== 2) return undefined;
  const browser = BROWSERS.find((b) => b === geraet.browser);
  const system = SYSTEMS.find((s) => s === geraet.system);
  if (!browser || !system) return undefined;
  const checked = checkReport(rest, app);
  return checked.ok ? { ...checked.report, tester, eingang, geraet: { browser, system } } : undefined;
}

                     
                      
                    
                         
                        
                                    
                                         
 

                          
                           
                            
                                   
                              
 

const byNumbers = (a        , b        ) => a.localeCompare(b, 'en', { numeric: true });

/** Per version (newest first) and per test: how often each result came, and the failed steps with their reasons. */
function summarize(reports                         )                   {
  const versions = new Map                                                                                         ();
  for (const report of reports) {
    const entry = versions.get(report.version) ?? { stande: new Set        (), reports: [], tests: new Map                   () };
    versions.set(report.version, entry);
    entry.stande.add(report.stand);
    entry.reports.push(report);
    for (const test of report.tests) {
      const tally = entry.tests.get(test.id) ?? { id: test.id, bestanden: 0, nichtBestanden: 0, nichtGetestet: 0, schritte: new Map                () };
      entry.tests.set(test.id, tally);
      if (test.ergebnis === 'bestanden') tally.bestanden++;
      else if (test.ergebnis === 'nicht getestet') tally.nichtGetestet++;
      else tally.nichtBestanden++;
      for (const step of test.schritte ?? []) {
        const stepKey = `${step.nr}:${step.grund}`;
        tally.schritte.set(stepKey, (tally.schritte.get(stepKey) ?? 0) + 1);
      }
    }
  }
  return [...versions.entries()]
    .sort(([a], [b]) => byNumbers(b, a))
    .map(([version, entry]) => ({
      version,
      stande: [...entry.stande].sort(),
      reports: [...entry.reports].sort((a, b) => (a.eingang < b.eingang ? 1 : a.eingang > b.eingang ? -1 : 0)),
      tests: [...entry.tests.values()].sort((a, b) => byNumbers(a.id, b.id)),
    }));
}

// The manual tests of an app (manual_tests/*.md) as data for the shared test page (Tobias
// 2026-11-15, docs/plan.md). Ported from the Fragebogen (src/logic/manualTests.ts), whose format is
// the standard: one case per "## MT-xx: title", labelled parts ("**Voraussetzungen:**",
// "**Schritte:**", …), numbered steps with "   - **Danach:** …" under each. A numbered list right
// under another label (E-Rechnung, Testumgebung) counts as the steps too, and "- Erwartet: …" works
// like "**Danach:**". Pure and import-free: the bundle puts it into one file.

            
                                  
                                                                                                  
                                                                           
                                   

                    
                                                                                          
                
                  
 

                          
             
                
                    
 

                          
                                                                             
               
                 
                                                     
                 
                          
 

/** The label of the steps; a numbered list under any other label without one becomes it. */
const STEPS_LABEL = 'Schritte';

// MT-… as the report names them; L-… are local tests of an app that never reach a report.
const CASE = /^## ((?:MT|L)-\d{2,3}(?:-\d{2})?[a-z]?): (.+)$/;
const LABEL = /^\*\*([^*]+?):\*\*\s*(.*)$/;
const ORDERED = /^\d+\.\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NOTE = /^\s+[-*]\s+(?:\*\*(?:Danach|Erwartet):\*\*|Erwartet:)\s*(.*)$/;

/** Paragraphs, lists and code fences of a run of lines. */
function blocksOf(lines                   )          {
  const blocks          = [];
  let paragraph           = [];
  let list                                                                      ;
  let inNote = false;
  let code                      ;
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'text', text: paragraph.join(' ') });
    paragraph = [];
  };
  const closeList = () => {
    if (list) {
      const { notes, ...rest } = list;
      blocks.push({ kind: 'list', ...rest, ...(notes.some((n) => n.length > 0) ? { notes } : {}) });
    }
    list = undefined;
    inNote = false;
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
    const note = list?.ordered ? NOTE.exec(line) : null;
    if (list && note) {
      list.notes[list.notes.length - 1]?.push(note[1]?.trim() ?? '');
      inNote = true;
      continue;
    }
    const ordered = ORDERED.exec(line);
    const bullet = ordered ? undefined : BULLET.exec(line);
    if (ordered || bullet) {
      flush();
      const isOrdered = ordered !== null;
      if (list && list.ordered !== isOrdered) closeList();
      list ??= { ordered: isOrdered, items: [], notes: [] };
      list.items.push((ordered ?? bullet)?.[1]?.trim() ?? '');
      list.notes.push([]);
      inNote = false;
      continue;
    }
    if (list && /^\s+\S/.test(line)) {
      // An indented line continues the last note, else the last list item.
      const step = list.notes[list.notes.length - 1];
      if (inNote && step && step.length > 0) step[step.length - 1] += ` ${line.trim()}`;
      else list.items[list.items.length - 1] += ` ${line.trim()}`;
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

const isSteps = (block                   ) => block?.kind === 'list' && block.ordered;

function partsOf(lines                   )             {
  const raw                                       = [{ label: '', lines: [] }];
  for (const line of lines) {
    const label = LABEL.exec(line);
    if (label) raw.push({ label: label[1]?.trim() ?? '', lines: label[2] ? [label[2]] : [] });
    else raw[raw.length - 1]?.lines.push(line);
  }
  const parts = raw
    .map((part) => ({ label: part.label, blocks: blocksOf(part.lines) }))
    .filter((part) => part.label !== '' || part.blocks.length > 0);
  if (parts.some((part) => part.label === STEPS_LABEL)) return parts;
  // No "Schritte": the first numbered list (after the text of its label) is the steps.
  const at = parts.findIndex((part) => part.blocks.some(isSteps));
  const part = parts[at];
  if (!part) return parts;
  const first = part.blocks.findIndex(isSteps);
  const before = part.blocks.slice(0, first);
  const steps           = { label: STEPS_LABEL, blocks: part.blocks.slice(first) };
  return [
    ...parts.slice(0, at),
    ...(before.length > 0 ? [{ label: part.label, blocks: before }] : []),
    steps,
    ...parts.slice(at + 1),
  ].filter((p) => p.label !== '' || p.blocks.length > 0);
}

function parseManualTests(markdown        , source        )                 {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const heading = lines.find((line) => line.startsWith('# ')) ?? '';
  const area = heading.replace(/^#\s+(\d+\s*[–-]\s*)?/, '').trim();
  const intro           = [];
  const cases                                                   = [];
  let inIntro = false;
  // Another level-2 heading after the cases ends the last case: its text is no part of a test.
  let inCase = false;
  for (const line of lines) {
    const start = CASE.exec(line);
    if (start) {
      cases.push({ id: start[1] ?? '', title: start[2]?.trim() ?? '', lines: [] });
      inCase = true;
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
    if (line.startsWith('## ')) {
      inCase = false;
      continue;
    }
    const current = inCase ? cases[cases.length - 1] : undefined;
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

/** A test with the area of its file, as the page lists it. */
                                                
               
                                                                                                 
                  
 

/** 12 hex digits of two FNV-1a hashes: enough to notice a rewritten test, not a security check. */
function fingerprint(text        )         {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
}

/** All files in name order (`01_…`, `02_…`), each test with its area; a doubled id is kept once. */
function catalogueOf(files                                            )                  {
  const seen = new Set        ();
  return [...files]
    .sort((x, y) => x.datei.localeCompare(y.datei))
    .map((file) => parseManualTests(file.text, file.datei))
    .flatMap((file) =>
      file.cases.map((c) => ({
        ...c,
        area: file.area || file.source,
        version: fingerprint(JSON.stringify({ title: c.title, parts: c.parts })),
      })),
    )
    .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

                  
                                                                     
                                                
                                                                           
                                             
                                                                       
                                                

/** The ids a start link can name: lower-case letters, digits and single hyphens. */
const START_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const START_LINK = /^start:([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const REF = /\b((?:MT|L)-\d{2,3}(?:-\d{2})?[a-z]?)\b/g;
// No lookbehind (Safari before 16.4 cannot parse it, and the whole page would fail): the character
// before an _emphasis_ is captured instead and given back as text. Links come before emphasis, so
// "[_text_](start:x)" stays a link.
const INLINE =
  /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(^|[^A-Za-z0-9])_(.+?)_(?![A-Za-z0-9])|<kbd>([^<]+)<\/kbd>/g;

function withRefs(text        )                {
  const tokens                = [];
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
 * Bold, code, italics and links of one line; a link stays a link only with an https address or as
 * a start link — a relative link into the repository means nothing on the test page, its text stays.
 */
function inlineMarkdown(text        )                {
  const tokens                = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    const [, strong, code, linkText, href, lead = '', em, kbd] = match;
    const index = match.index + (em === undefined ? 0 : lead.length);
    if (index > at) tokens.push(...withRefs(text.slice(at, index)));
    if (kbd !== undefined) tokens.push({ kind: 'kbd', text: kbd });
    else if (strong !== undefined) tokens.push({ kind: 'strong', text: strong });
    else if (code !== undefined) tokens.push({ kind: 'code', text: code });
    else if (em !== undefined) tokens.push({ kind: 'em', text: em });
    else if (linkText !== undefined && href !== undefined) {
      const start = START_LINK.exec(href)?.[1];
      tokens.push(
        start !== undefined
          ? { kind: 'start', text: linkText, id: start }
          : href.startsWith('https://')
            ? { kind: 'link', text: linkText, href }
            : { kind: 'text', text: linkText.replace(/^`|`$/g, '') },
      );
    }
    at = match.index + match[0].length;
  }
  if (at < text.length) tokens.push(...withRefs(text.slice(at)));
  return tokens;
}

/** The plain text of a line, without its markup. */
const plainText = (text        )         =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');

/**
 * The steps as the report numbers them (`schritte[].nr`, docs/testbericht.md): the items of the
 * numbered list under „Schritte“, so the numbers are those the tester reads.
 */
function stepsOf(testCase                               )           {
  return testCase.parts
    .filter((part) => part.label === STEPS_LABEL)
    .flatMap((part) => part.blocks)
    .flatMap((block) => (block.kind === 'list' && block.ordered ? block.items : []))
    .map(plainText);
}

/**
 * Whether a test can be done in the test area: a part "Testbereich" starting with "nein" says it
 * cannot (e.g. a double-click on a downloaded file); any other text there is a hint.
 */
function testAreaOf(testCase                )                                      {
  const first = testCase.parts.find((p) => p.label === 'Testbereich')?.blocks[0];
  const note = first && first.kind !== 'list' ? first.text : undefined;
  if (note === undefined) return { offered: true };
  return { offered: !/^nein\b/i.test(note), note };
}

// A tester's run on the shared test page, without any free text (Tobias 2026-11-15,
// docs/testbericht.md): per test the result, the seconds the page measured and, for a failed test,
// the steps with a reason from the fixed list. The clock runs while a test is open and has no
// result; leaving the test pauses it, the result ends it — no correction by hand. Ported from the
// Fragebogen (src/logic/testRun.ts). Pure state transitions; times are milliseconds since 1970.
//
// The report is built here and checked with the login script's own `checkReport` before it is
// sent, so a test page never sends what the test area would refuse.

/** The results a tester can give; a test without one is „nicht getestet“ in the report. */
                                               
const OUTCOMES                     = ['bestanden', 'nicht bestanden'];
const OUTCOME_LABELS                                    = {
  bestanden: 'Bestanden',
  'nicht bestanden': 'Nicht bestanden',
};

/** The reason keys in the order the page offers them (labels in `REASONS`). */
const REASON_KEYS                    = Object.keys(REASONS);

                      
                                                            
             
                
 

                    
                                                     
                  
                                                                                    
                    
                   
                                                                          
                       
                                                               
                   
                                                                                  
                    
     
                                                                                                   
                                                                             
     
                
 

/** Version and commit of a build of the app. */
                 
                  
                
 

/** Version and commit in the form a report needs. */
const isBuild = (b         )             =>
  typeof b === 'object' && b !== null &&
  typeof (b         ).version === 'string' && /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test((b         ).version) &&
  typeof (b         ).stand === 'string' && /^[0-9a-f]{7,40}$/.test((b         ).stand);

const sameBuild = (a                   , b                   ) => a?.version === b?.version && a?.stand === b?.stand;

/**
 * The result was given on another build than `running`. It then changes only by `resetTest`: a new
 * result or step would rewrite what the tester saw on that build (and, unsent, it would be lost).
 */
function fromOlderBuild(entry                      , running       )          {
  return entry?.result !== undefined && isBuild(entry.build) && !sameBuild(entry.build, running);
}

/** Two entries say the same about a test: the same result, text, build, time and steps. */
function sameEntry(a                      , b                      )          {
  if (a === undefined || b === undefined) return a === b;
  const steps = (e          ) => (e.steps ?? []).map((s) => `${s.nr}:${s.grund}`).join(',');
  return a.result === b.result && a.version === b.version && a.seconds === b.seconds && sameBuild(a.build, b.build) && steps(a) === steps(b);
}

                   
                                    
 

/** The longest time a report may name for one test (`tests[].sekunden`). */
const MAX_SECONDS = 86_400;
const MAX_STEP = 99;

const emptyRun = ()          => ({ entries: {} });

const entryOf = (run         , id        )           => run.entries[id] ?? { seconds: 0 };

const withEntry = (run         , id        , entry          )          => ({
  ...run,
  entries: { ...run.entries, [id]: entry },
});

/** A changed result belongs in the next report again. */
function unreported(entry          )           {
  const rest           = { ...entry };
  delete rest.reported;
  return rest;
}

/** The seconds the test has been open so far, the running part up to `now` included. */
function elapsedSeconds(entry                      , now        )         {
  if (!entry) return 0;
  const running = entry.openedAt === undefined ? 0 : (now - entry.openedAt) / 1000;
  const total = entry.seconds + (Number.isFinite(running) && running > 0 ? running : 0);
  return Math.min(MAX_SECONDS, Math.floor(total));
}

/** The test is opened: its clock runs, unless it has a result already. */
function openTest(run         , id        , now        )          {
  const entry = entryOf(run, id);
  if (entry.result !== undefined || entry.openedAt !== undefined) return run;
  return withEntry(run, id, { ...entry, openedAt: now });
}

/**
 * The test is left (another test, the overview, the page closed): its clock pauses. A page that is only
 * hidden keeps the clock running (`checkpoint`): a test may need another app.
 */
function leaveTest(run         , id        , now        )          {
  const entry = run.entries[id];
  if (entry?.openedAt === undefined) return run;
  const rest           = { ...entry, seconds: elapsedSeconds(entry, now) };
  delete rest.openedAt;
  return withEntry(run, id, rest);
}

/**
 * The page is hidden (another app, the phone locked): the time so far is stored while the clock goes
 * on — a page closed for good then loses only the time since.
 */
function checkpoint(run         , id        , now        )          {
  const entry = run.entries[id];
  if (entry?.openedAt === undefined) return run;
  const left = leaveTest(run, id, now);
  const stored = left.entries[id]            ;
  // The clock goes on from the whole seconds stored: the part of a second is not lost.
  const rest = Math.max(0, entry.seconds + Math.max(0, (now - entry.openedAt) / 1000) - stored.seconds);
  return withEntry(left, id, { ...stored, openedAt: now - rest * 1000 });
}

/**
 * What another tab's stored copy of a test holds beyond this tab's running clock, in seconds
 * (negative: this tab measured more). Counted up to the 24 h cap, all a store can hold: two tabs at
 * the cap are never ahead of each other, so neither keeps storing its clock.
 */
function storedBeyond(own          , theirs                      , now        )         {
  const running = own.openedAt === undefined ? 0 : Math.max(0, (now - own.openedAt) / 1000);
  return (theirs?.seconds ?? 0) - Math.min(MAX_SECONDS, own.seconds + running);
}

/**
 * A result ends the clock. „Bestanden“ drops the failed steps, „nicht bestanden“ keeps them. A result
 * of an earlier build stays as it is (`fromOlderBuild`).
 */
function setResult(run         , id        , result         , now        , version         , build        )          {
  const entry = entryOf(run, id);
  // A build that does not know its version or commit takes no result: it could never be sent under it.
  if (build !== undefined && !isBuild(build)) return run;
  const given = isBuild(build) ? { version: build.version, stand: build.stand } : undefined;
  if (given && fromOlderBuild(entry, given)) return run;
  // The same result for the same text on the same build again changes nothing: a sent one is not
  // sent twice.
  if (entry.result === result && entry.version === version && sameBuild(entry.build, given)) return run;
  const rest           = { ...unreported(entry), seconds: elapsedSeconds(entry, now) };
  delete rest.openedAt;
  delete rest.version;
  delete rest.build;
  // „Bestanden“ drops the failed steps; so does a rewritten text, whose numbers mean other steps.
  if (result === 'bestanden' || entry.version !== version) delete rest.steps;
  return withEntry(run, id, { ...rest, result, ...(version === undefined ? {} : { version }), ...(given ? { build: given } : {}) });
}

/**
 * A step of a failed test with its reason; `undefined` takes it out again. With the running `build`,
 * a result of an earlier build stays as it is.
 */
function setStep(run         , id        , nr        , grund                    , build        )          {
  const entry = run.entries[id];
  if (entry?.result !== 'nicht bestanden' || !Number.isInteger(nr) || nr < 1 || nr > MAX_STEP) return run;
  if (build && fromOlderBuild(entry, build)) return run;
  if (grund !== undefined && !Object.prototype.hasOwnProperty.call(REASONS, grund)) return run;
  const others = (entry.steps ?? []).filter((step) => step.nr !== nr);
  const steps = (grund === undefined ? others : [...others, { nr, grund }]).sort((a, b) => a.nr - b.nr);
  const rest           = unreported(entry);
  delete rest.steps;
  return withEntry(run, id, steps.length === 0 ? rest : { ...rest, steps });
}

/** Back to „nicht getestet“: result, steps and time gone; an open test starts its clock anew. */
function resetTest(run         , id        , now         )          {
  const entries = Object.fromEntries(Object.entries(run.entries).filter(([key]) => key !== id));
  const reset = { ...run, entries };
  return now === undefined ? reset : openTest(reset, id, now);
}

/** The test was rewritten after the tester's result: the result belongs to an older text. */
function changedSince(entry                      , current        )          {
  return entry?.result !== undefined && entry.version !== undefined && entry.version !== current;
}

/** Failed tests whose steps are still missing — a report cannot be sent with them. */
function missingSteps(run         )           {
  return Object.entries(run.entries)
    .filter(([, entry]) => entry.result === 'nicht bestanden' && (entry.steps ?? []).length === 0)
    .map(([id]) => id)
    .sort();
}

/** Whole minutes for the page (at least 1 once a second counted). */
const minutesOf = (seconds        )         => (seconds <= 0 ? 0 : Math.ceil(seconds / 60));

                     
                 
                 
                 
                  
 

function totalsOf(run         , ids                    )            {
  const totals            = { tested: 0, passed: 0, failed: 0, seconds: 0 };
  for (const [id, entry] of Object.entries(run.entries)) {
    if (!entry.result || (ids && !ids.includes(id))) continue;
    totals.tested += 1;
    if (entry.result === 'bestanden') totals.passed += 1;
    else totals.failed += 1;
    totals.seconds += entry.seconds;
  }
  return totals;
}

// --- The report (`testbericht/1`) -------------------------------------------------------------

/** The ids a report may name; local tests („L-…“) stay out of it. */
const REPORT_ID = /^MT-\d{2,3}(-\d{2})?[a-z]?$/;
const MAX_REPORT_TESTS = 300;

/** What the app's build knows about itself. */
                    
                                                                      
              
                                                            
                  
                             
                
 

/** One report to send, and the results it carries, to be marked once it arrived. */
                         
               
                 
 

                                                                                          

/**
 * The reports to send. The first is for the running build: every result given on it and not sent
 * yet, and every other test of the catalogue as „nicht getestet“ (also a test whose result belongs to
 * an earlier build). Then one report per earlier build with its unsent results only, also of tests
 * the running build no longer has; a failed one without a step is left out (it cannot be completed
 * any more). Results sent before stay out (they were counted). Refused while a failed test of the
 * running build names no step, when there is no new result, or when the login script would refuse a
 * report.
 */
function reportPlan(run         , caseIds                   , build          )             {
  if (!isAppId(build.app)) {
    return { ok: false, problem: `Die App nennt keinen gültigen Namen für ihre Berichte („${build.app}“); erlaubt sind z. B. „fragebogen“ oder „azp“.` };
  }
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(build.version) || !/^[0-9a-f]{7,40}$/.test(build.stand)) {
    return { ok: false, problem: 'Diese Fassung der App kennt ihre Version oder ihren Stand nicht und kann keinen Bericht senden.' };
  }
  const current        = { version: build.version, stand: build.stand };
  const ids = [...new Set(caseIds)].filter((id) => REPORT_ID.test(id)).slice(0, MAX_REPORT_TESTS);
  const onCurrent = (entry                      ) => entry?.result !== undefined && !fromOlderBuild(entry, current);
  const missing = missingSteps(run).filter((id) => ids.includes(id) && onCurrent(run.entries[id]));
  if (missing.length > 0) {
    return {
      ok: false,
      problem: `Bei „Nicht bestanden“ fehlt noch der Schritt mit dem Problem: ${missing.join(', ')}. Bitte einen Schritt wählen oder das Ergebnis zurücknehmen.`,
    };
  }
  const resultOf = (id        , entry          ) => {
    const sekunden = Math.min(MAX_SECONDS, entry.seconds);
    return entry.result === 'bestanden'
      ? { id, ergebnis: 'bestanden', sekunden }
      : { id, ergebnis: 'nicht bestanden', sekunden, schritte: (entry.steps ?? []).map((s) => ({ nr: s.nr, grund: s.grund })) };
  };
  const currentGroup = { build: current, tests: []             , sent: []             };
  for (const id of ids) {
    const entry = run.entries[id];
    if (entry === undefined || !onCurrent(entry)) currentGroup.tests.push({ id, ergebnis: 'nicht getestet' });
    else if (entry.reported === undefined) {
      currentGroup.sent.push(id);
      currentGroup.tests.push(resultOf(id, entry));
    }
  }
  // Results of earlier builds, also of tests the running build no longer has: the catalogue's order
  // first, then the rest by id.
  const groups = new Map                                                            ();
  const order = [...ids, ...Object.keys(run.entries).filter((id) => !ids.includes(id)).sort()];
  for (const id of order) {
    const entry = run.entries[id];
    if (entry === undefined || entry.reported !== undefined || !REPORT_ID.test(id) || !fromOlderBuild(entry, current)) continue;
    // A failed result without a step cannot go out any more; the page asks to take it back.
    if (entry.result === 'nicht bestanden' && (entry.steps ?? []).length === 0) continue;
    const older = entry.build         ;
    const key = `${older.version} ${older.stand}`;
    const group = groups.get(key) ?? { build: { version: older.version, stand: older.stand }, tests: [], sent: [] };
    groups.set(key, group);
    if (group.tests.length >= MAX_REPORT_TESTS) continue;
    group.sent.push(id);
    group.tests.push(resultOf(id, entry));
  }
  const reports                  = [];
  for (const group of [currentGroup, ...groups.values()]) {
    if (group.sent.length === 0) continue;
    const checked = checkReport({ format: 'testbericht/1', app: build.app, version: group.build.version, stand: group.build.stand, tests: group.tests }, build.app);
    if (!checked.ok) return { ok: false, problem: `Der Bericht passt nicht zum Testbereich: ${checked.message}` };
    reports.push({ body: checked.report, sent: group.sent });
  }
  if (reports.length === 0) return { ok: false, problem: 'Es gibt kein neues Ergebnis zu senden.' };
  return { ok: true, reports };
}

/** The report arrived: its results are marked and leave the next one until they change. */
function markReported(run         , ids                   , now        )          {
  let next = run;
  for (const id of ids) {
    const entry = next.entries[id];
    if (entry?.result !== undefined) next = withEntry(next, id, { ...entry, reported: now });
  }
  return next;
}

/** What the page says after sending, from the answer of the test area (zugang/src/logik.ts). */
function sendOutcome(status        , text        )                                     {
  const said = text.replace(/\s+/g, ' ').trim().slice(0, 300);
  // Only the login script's own answer counts as stored (201 „Bericht gespeichert.“); another 2xx
  // came from something else and stored nothing.
  if (status === 201) return { sent: true, message: said || 'Bericht gespeichert.' };
  if (status >= 200 && status < 300) return { sent: false, message: `Der Testbereich antwortet unerwartet (Antwort ${status}); der Bericht ist nicht gespeichert. Bitte später noch einmal senden.` };
  if (status === 400) return { sent: false, message: `Der Testbereich hat den Bericht abgelehnt${said ? `: ${said}` : '.'}` };
  if (status === 401) return { sent: false, message: 'Bitte im Testbereich anmelden und den Bericht noch einmal senden.' };
  if (status === 404) return { sent: false, message: 'Dieser Testbereich nimmt noch keine Berichte an (Antwort 404).' };
  if (said && (status === 403 || status === 503)) return { sent: false, message: said };
  return { sent: false, message: `Der Testbereich antwortet mit Fehler ${status}. Bitte später noch einmal senden.` };
}

// --- Stored run -------------------------------------------------------------------------------

const isRecord = (value         )                                   =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isMoment = (value         )                  => typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * The run kept in the browser storage; anything malformed is dropped, never trusted. A clock still
 * running from an earlier visit is stopped where it was last saved: the time the page was closed
 * does not count.
 */
function decodeRun(raw         )          {
  if (!isRecord(raw) || !isRecord(raw.entries)) return emptyRun();
  const entries                           = {};
  for (const [id, value] of Object.entries(raw.entries)) {
    if (!isRecord(value) || !/^(?:MT|L)-\d{2,3}(?:-\d{2})?[a-z]?$/.test(id)) continue;
    const result = OUTCOMES.find((o) => o === value.result);
    const steps = result === 'nicht bestanden' && Array.isArray(value.steps)
      ? [...new Map(
          value.steps
            .filter((s)                               => isRecord(s))
            .filter((s) => typeof s.nr === 'number' && Number.isInteger(s.nr) && s.nr >= 1 && s.nr <= MAX_STEP)
            .filter((s) => typeof s.grund === 'string' && Object.prototype.hasOwnProperty.call(REASONS, s.grund))
            .map((s) => [s.nr          , s.grund          ]         ),
        )]
          .sort(([a], [b]) => a - b)
          .map(([nr, grund]) => ({ nr, grund }))
      : [];
    const seconds = typeof value.seconds === 'number' && Number.isInteger(value.seconds)
      ? Math.min(MAX_SECONDS, Math.max(0, value.seconds))
      : 0;
    const entry           = {
      seconds,
      ...(result ? { result } : {}),
      ...(steps.length > 0 ? { steps } : {}),
      ...(result && typeof value.version === 'string' && /^[0-9a-f]{12}$/.test(value.version) ? { version: value.version } : {}),
      ...(result && isMoment(value.reported) ? { reported: value.reported } : {}),
      ...(result && isBuild(value.build) ? { build: { version: value.build.version, stand: value.build.stand } } : {}),
    };
    if (entry.result !== undefined || entry.seconds > 0) entries[id] = entry;
  }
  return { entries };
}

// The test page as HTML text from its state (docs/testrahmen.md). Pure: every text is escaped, the
// markup has no inline script and no inline style (the apps' CSP forbids both), and every control
// names its action in `data-aktion` for the page's one event listener (seite.ts).

/** What the page says while the browser keeps nothing. */
const UNSAVED_NOTICE =
  'Dieser Browser speichert die Ergebnisse nicht (z. B. ein privates Fenster oder gesperrter Speicher). Sie gehen verloren, wenn die Seite neu lädt oder schließt: bitte vorher „Bericht senden“.';

/** A question the page asks before it acts. */
               
                        
                             
                                      
                       

                     
                                      
               
                                            
                
                    
                                                      
                       
                      
                                                    
                                                                                                         
                    
                   
              
 

/** What the app told the page about itself. */
                    
               
                  
                                                                                
                
                                                        
                                                                                        
                              
                     
 

const esc = (text        )         =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const attrs = (values                                    )         =>
  Object.entries(values)
    .filter((entry)                            => entry[1] !== undefined)
    .map(([key, value]) => ` ${key}="${esc(value)}"`)
    .join('');

const button = (label        , aktion        , extra                                     = {})         =>
  `<button type="button"${attrs({ 'data-aktion': aktion, ...extra })}>${esc(label)}</button>`;

/** One line of a test text; a start link becomes a button, a test reference opens that test. */
function inline(text        , ids                     )         {
  return inlineMarkdown(text)
    .map((token) => {
      switch (token.kind) {
        case 'strong':
          return `<strong>${esc(token.text)}</strong>`;
        case 'em':
          return `<em>${esc(token.text)}</em>`;
        case 'code':
          return `<code>${esc(token.text)}</code>`;
        case 'kbd':
          return `<kbd>${esc(token.text)}</kbd>`;
        case 'link':
          return `<a${attrs({ href: token.href, target: '_blank', rel: 'noopener noreferrer' })}>${esc(token.text)}</a>`;
        case 'ref':
          return ids.has(token.id)
            ? `<button type="button" class="tr-verweis"${attrs({ 'data-aktion': 'oeffnen', 'data-id': token.id })}>${esc(token.text)}</button>`
            : esc(token.text);
        case 'start':
          return `<button type="button" class="tr-start"${attrs({ 'data-aktion': 'startpunkt', 'data-id': token.id, 'data-fokus': `start-${token.id}` })}>${esc(token.text)}</button>`;
        default:
          return esc(token.text);
      }
    })
    .join('');
}

/** `start`: the number of the first item, so an interrupted list of steps counts on like the report. */
function blockHtml(block       , ids                     , start = 1)         {
  if (block.kind === 'text') return `<p>${inline(block.text, ids)}</p>`;
  if (block.kind === 'code') return `<pre><code>${esc(block.text)}</code></pre>`;
  const tag = block.ordered ? `ol${start > 1 ? ` start="${start}"` : ''}` : 'ul';
  const items = block.items.map((item, i) => {
    const notes = (block.notes?.[i] ?? []).map((note) => `<p class="tr-danach"><span>Danach:</span> ${inline(note, ids)}</p>`);
    return `<li>${inline(item, ids)}${notes.join('')}</li>`;
  });
  return `<${tag}>${items.join('')}</${block.ordered ? 'ol' : 'ul'}>`;
}

                                                                   

function statusOf(run         , id        )         {
  const entry = run.entries[id];
  if (entry?.result === 'bestanden') return 'bestanden';
  if (entry?.result === 'nicht bestanden') return 'nicht-bestanden';
  return entry?.openedAt !== undefined || (entry?.seconds ?? 0) > 0 ? 'laeuft' : 'offen';
}

const STATUS_LABELS                                   = {
  offen: 'nicht getestet',
  laeuft: 'begonnen',
  bestanden: 'bestanden',
  'nicht-bestanden': 'nicht bestanden',
};

/** Done on the running build: a result given on it. One of an earlier build is to be tested again. */
const doneHere = (entry                      , running                                    )          =>
  entry?.result !== undefined && !fromOlderBuild(entry, running);

function header(state           , info          )         {
  const ids = state.catalogue.map((c) => c.id);
  const totals = totalsOf(state.run, ids.filter((id) => !fromOlderBuild(state.run.entries[id], info)));
  const summary = `${totals.tested} von ${ids.length} getestet · ${totals.passed} bestanden · ${totals.failed} nicht bestanden`;
  return [
    '<header class="tr-kopf">',
    `<p class="tr-titel">Testbereich · ${esc(info.name)} <span>${esc(info.version)}</span></p>`,
    '<div class="tr-knoepfe">',
    button('App neu starten', 'frage', { 'data-frage': 'neustart', 'data-fokus': 'frage-neustart' }),
    button('App vollständig zurücksetzen', 'frage', { 'data-frage': 'zuruecksetzen', 'data-fokus': 'frage-zuruecksetzen' }),
    button(state.sending ? 'Wird gesendet …' : 'Bericht senden', 'frage', {
      'data-frage': 'senden',
      'data-fokus': 'frage-senden',
      'aria-disabled': state.sending ? 'true' : undefined,
    }),
    `<a class="tr-einladen"${attrs({ href: info.inviteHref })}>Tester einladen</a>`,
    '</div>',
    `<p class="tr-stand">${esc(summary)}</p>`,
    // No live roles here: the panel is drawn anew on every change, and a live region announces only
    // what changes while it stands. The page speaks through one region of its own (seite.ts).
    ...info.problems.map((problem) => `<p class="tr-meldung tr-fehler">${esc(problem)}</p>`),
    state.unsaved ? `<p class="tr-meldung tr-fehler">${esc(UNSAVED_NOTICE)}</p>` : '',
    state.message
      ? `<p class="tr-meldung tr-${state.message.kind}" data-meldung="">${esc(state.message.text)}</p>`
      : '',
    '</header>',
  ].join('');
}

const QUESTION_TEXTS                                                                                   = {
  neustart: { title: 'App neu starten?', text: 'Die App beginnt wieder auf ihrer Startseite. Was Sie in der App eingegeben haben, bleibt erhalten.', yes: 'Neu starten' },
  zuruecksetzen: { title: 'App vollständig zurücksetzen?', text: 'Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.', yes: 'Zurücksetzen' },
  startpunkt: { title: 'Vorbereiteten Stand laden?', text: 'Die App startet neu mit diesem Stand. Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.', yes: 'Laden' },
  senden: { title: 'Bericht senden?', text: 'Gesendet werden die Ergebnisse, die noch nicht gesendet wurden. Jeder andere Test zählt als „nicht getestet“. Ein Freitext wird nie gesendet.', yes: 'Senden' },
};

function questionHtml(question          , info          )         {
  const texts = QUESTION_TEXTS[question.kind];
  const point = question.kind === 'startpunkt' ? info.startpunkte.find((p) => p.id === question.id) : undefined;
  return [
    '<section class="tr-frage" role="alertdialog" aria-labelledby="tr-frage-titel">',
    `<p class="tr-frage-titel" id="tr-frage-titel">${esc(texts.title)}</p>`,
    point ? `<p><strong>${esc(point.titel)}</strong></p>` : '',
    `<p>${esc(texts.text)}</p>`,
    '<div class="tr-knoepfe">',
    button(texts.yes, 'ja', { class: 'tr-haupt', 'data-fokus': 'ja' }),
    button('Abbrechen', 'nein', { 'data-fokus': 'nein' }),
    '</div>',
    '</section>',
  ].join('');
}

function overview(state           , info          )         {
  const areas = new Map                         ();
  for (const c of state.catalogue) areas.set(c.area, [...(areas.get(c.area) ?? []), c]);
  const sections = [...areas].map(([area, cases]) => {
    const shown = cases.filter((c) => !state.hideDone || !doneHere(state.run.entries[c.id], info));
    if (shown.length === 0) return '';
    const boxes = shown.map((c) => {
      const status = statusOf(state.run, c.id);
      const changed = changedSince(state.run.entries[c.id], c.version) ? ' · geändert' : '';
      const older = fromOlderBuild(state.run.entries[c.id], info) ? ` · Fassung ${state.run.entries[c.id]?.build?.version ?? ''}` : '';
      const away = testAreaOf(c).offered ? '' : ' · nicht im Testbereich';
      return (
        `<li><button type="button" class="tr-test tr-${status}"${attrs({ 'data-aktion': 'oeffnen', 'data-id': c.id, 'data-fokus': `test-${c.id}` })}>` +
        `<span class="tr-id">${esc(c.id)}</span> ${esc(c.title)}<span class="tr-status">${esc(STATUS_LABELS[status] + changed + older + away)}</span></button></li>`
      );
    });
    return `<section class="tr-bereich"><h2>${esc(area)}</h2><ul class="tr-tests">${boxes.join('')}</ul></section>`;
  });
  const points = info.startpunkte.length === 0
    ? ''
    : `<section class="tr-bereich"><h2>Vorbereitete Stände</h2><ul class="tr-staende">${info.startpunkte
        .map((p) => `<li>${esc(p.titel)} ${button('Laden', 'startpunkt', { 'data-id': p.id, 'data-fokus': `start-${p.id}` })}</li>`)
        .join('')}</ul></section>`;
  return [
    '<div class="tr-uebersicht">',
    `<p class="tr-zeile"><label><input type="checkbox"${attrs({ 'data-aktion': 'erledigte', 'data-fokus': 'erledigte', checked: state.hideDone ? 'checked' : undefined })}> Erledigte ausblenden</label></p>`,
    state.catalogue.length === 0 ? '<p>Diese App hat noch keine Handtests.</p>' : sections.join(''),
    points,
    '</div>',
  ].join('');
}

function stepChoice(id        , steps                   , run         )         {
  const chosen = new Map((run.entries[id]?.steps ?? []).map((s) => [s.nr, s.grund]));
  const rows = steps.map((text, i) => {
    const nr = i + 1;
    const options = [`<option value=""${chosen.has(nr) ? '' : ' selected'}>kein Problem</option>`]
      .concat(REASON_KEYS.map((key) => `<option${attrs({ value: key, selected: chosen.get(nr) === key ? 'selected' : undefined })}>${esc(REASONS[key] ?? key)}</option>`))
      .join('');
    return (
      `<li><label><span class="tr-schritt">Schritt ${nr}: ${esc(text.length > 90 ? `${text.slice(0, 89)}…` : text)}</span>` +
      `<select${attrs({ 'data-aktion': 'schritt', 'data-id': id, 'data-nr': String(nr), 'data-fokus': `schritt-${nr}` })}>${options}</select></label></li>`
    );
  });
  return `<section class="tr-schritte"><p class="tr-frage-titel">In welchen Schritten gab es ein Problem?</p><ol>${rows.join('')}</ol></section>`;
}

/**
 * A result of an earlier build: shown as it was given, never changed here. Unsent, it waits for
 * „Bericht senden“; sent (or one that cannot go out), the test starts anew for the running build.
 */
function olderResult(id        , entry          )         {
  const build = `der Fassung ${entry.build?.version ?? ''} (Stand ${entry.build?.stand ?? ''})`;
  const steps = (entry.steps ?? []).map((s) => `Schritt ${s.nr}: ${REASONS[s.grund] ?? s.grund}`);
  const given = `Ergebnis ${build}: ${entry.result === undefined ? '' : OUTCOME_LABELS[entry.result]}${steps.length > 0 ? ` – ${steps.join(', ')}` : ''}.`;
  const stuck = entry.result === 'nicht bestanden' && steps.length === 0;
  const note = entry.reported !== undefined
    ? 'Es ist gesendet. Für die laufende Fassung bitte neu prüfen.'
    : stuck
      ? 'Es nennt keinen Schritt und lässt sich nicht mehr senden. Bitte zurücknehmen und für die laufende Fassung neu prüfen.'
      : 'Es ist noch nicht gesendet: Bitte zuerst „Bericht senden“, danach den Test für die laufende Fassung neu prüfen.';
  return [
    `<p class="tr-meldung tr-fehler">${esc(`${given} ${note}`)}</p>`,
    entry.reported !== undefined
      ? button('Für die laufende Fassung neu prüfen', 'zuruecknehmen', { 'data-id': id, 'data-fokus': 'neu-pruefen' })
      : button('Ergebnis zurücknehmen', 'zuruecknehmen', { 'data-id': id, 'data-fokus': 'zuruecknehmen' }),
  ].join('');
}

function testView(state           , testCase               , info          )         {
  const ids = new Set(state.catalogue.map((c) => c.id));
  const index = state.catalogue.findIndex((c) => c.id === testCase.id);
  const previous = state.catalogue[index - 1];
  const next = state.catalogue[index + 1];
  const entry = state.run.entries[testCase.id];
  const steps = stepsOf(testCase);
  const clock = clockText(entry, state.now);
  // The steps count on across every „Schritte“ part, like the numbers the report sends.
  let stepNo = 1;
  const parts = testCase.parts.map((part) => {
    const blocks = part.blocks.map((block) => {
      if (part.label !== STEPS_LABEL || block.kind !== 'list' || !block.ordered) return blockHtml(block, ids);
      const html = blockHtml(block, ids, stepNo);
      stepNo += block.items.length;
      return html;
    });
    return (part.label ? `<h3>${esc(part.label)}</h3>` : '') + blocks.join('');
  });
  const results = OUTCOMES.map((outcome) =>
    `<button type="button"${attrs({
      class: `tr-ergebnis tr-${outcome === 'bestanden' ? 'bestanden' : 'nicht-bestanden'}`,
      'data-aktion': 'ergebnis',
      'data-id': testCase.id,
      'data-wert': outcome,
      'aria-pressed': entry?.result === outcome ? 'true' : 'false',
      'data-fokus': `ergebnis-${outcome}`,
    })}>${esc(OUTCOME_LABELS[outcome])}</button>`,
  );
  return [
    '<article class="tr-einzeln">',
    '<nav class="tr-blaettern">',
    button('‹ Testübersicht', 'uebersicht', { 'data-fokus': 'uebersicht' }),
    previous ? button('‹ Vorheriger', 'oeffnen', { 'data-id': previous.id, 'data-fokus': 'vorheriger' }) : '',
    next ? button('Nächster ›', 'oeffnen', { 'data-id': next.id, 'data-fokus': 'naechster' }) : '',
    '</nav>',
    `<p class="tr-bereichsname">${esc(testCase.area)}</p>`,
    `<h2><span class="tr-id">${esc(testCase.id)}</span> ${esc(testCase.title)}</h2>`,
    changedSince(entry, testCase.version) ? '<p class="tr-meldung tr-fehler">Dieser Test wurde geändert, seit Sie ihn bewertet haben. Bitte noch einmal prüfen.</p>' : '',
    parts.join(''),
    '<section class="tr-bewertung">',
    `<p class="tr-uhr">${esc(clock)}</p>`,
    entry !== undefined && fromOlderBuild(entry, info)
      ? olderResult(testCase.id, entry)
      : !isBuild({ version: info.version, stand: info.stand })
        ? '<p class="tr-meldung tr-fehler">Diese Fassung kennt ihre Version oder ihren Stand nicht. Ergebnisse lassen sich hier nicht geben, denn sie gingen sonst unter einer anderen Fassung hinaus.</p>'
        : [
          `<div class="tr-knoepfe">${results.join('')}</div>`,
          entry?.result === 'nicht bestanden'
            ? steps.length > 0
              ? stepChoice(testCase.id, steps, state.run)
              : '<p class="tr-meldung tr-fehler">Dieser Test hat keine nummerierten Schritte; „Nicht bestanden“ lässt sich so nicht senden.</p>'
            : '',
          entry?.result !== undefined ? button('Ergebnis zurücknehmen', 'zuruecknehmen', { 'data-id': testCase.id, 'data-fokus': 'zuruecknehmen' }) : '',
        ].join(''),
    '</section>',
    '</article>',
  ].join('');
}

/** The clock line of a test: running while it is open without a result, else the measured time. */
function clockText(entry                      , now        )         {
  const minutes = minutesOf(elapsedSeconds(entry, now));
  return entry?.result !== undefined ? `Gemessene Zeit: ${minutes} Min.` : `Die Uhr läuft: ${minutes} Min.`;
}

/** The whole test side for the state. */
function panelHtml(state           , info          )         {
  const open = state.open === undefined ? undefined : state.catalogue.find((c) => c.id === state.open);
  return [
    header(state, info),
    state.question ? questionHtml(state.question, info) : '',
    open ? testView(state, open, info) : overview(state, info),
  ].join('');
}

// The shared test page in the browser (docs/testrahmen.md): `starteTestrahmen` puts the page next to
// the app — two tabs on a narrow screen — and runs it. The app calls it only in its test build and
// mounts itself into the returned `appBehaelter`. One listener for clicks and one for changes act on
// the `data-aktion` of the controls; every change is stored at once in the browser, under one key
// per app that a reset of the app leaves alone.

/** What the app gives the test page (its test build only). */
                            
                                                                                                 
              
                                    
               
                                                  
                  
                                                               
                
                                                                                 
                                                        
                                                                
                                                         
                                                                                    
                                           
                                                                      
                                      
                                                                                                 
                                                    
                                         
 

                           
                     
                       
                        
                          
                           
 

                             
                                    
                            
     
                                                                                                       
                                                     
     
                  
 

/** How much more than the store a tab must have measured before it stores its clock (adoptStored). */
const AHEAD_SECONDS = 2;

export const BERICHT_ADRESSE = '/_zugang/bericht';
export const EINLADEN_ADRESSE = '/_zugang/einladen';

/** The test page's own key in the browser storage; a reset of the app never removes it. */
export const speicherSchluessel = (app        )         => `testrahmen:${app}`;

/** What is wrong with a binding; the page shows it on top and sends no report while it is wrong. */
export function bindingProblems(anbindung           )           {
  const problems           = [];
  if (!isAppId(anbindung.app)) problems.push(`Die App nennt keinen gültigen Namen für ihre Berichte („${anbindung.app}“).`);
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(anbindung.version)) problems.push(`Die Version „${anbindung.version}“ hat nicht die Form 1.4.2; Berichte gehen so nicht.`);
  if (!/^[0-9a-f]{7,40}$/.test(anbindung.stand)) problems.push(`Der Stand „${anbindung.stand}“ ist kein Commit; Berichte gehen so nicht.`);
  const points = anbindung.startpunkte ?? [];
  if (points.length > 0 && typeof anbindung.laden !== 'function') problems.push('Die App nennt vorbereitete Stände, kann sie aber nicht laden.');
  if (new Set(points.map((p) => p.id)).size !== points.length) problems.push('Ein vorbereiteter Stand ist doppelt genannt.');
  // A start link can only name such ids; any other would never load from the test text.
  for (const p of points) if (!START_ID.test(p.id)) problems.push(`Der vorbereitete Stand „${p.id}“ hat keine gültige Kennung (nur Kleinbuchstaben, Ziffern und Bindestriche).`);
  return problems;
}

                 
               
                
                    
 

function readSaved(store                     , key        )        {
  try {
    const raw = JSON.parse(store?.getItem(key) ?? 'null')                                  ;
    if (raw === null || typeof raw !== 'object') return { run: emptyRun(), hideDone: false };
    return {
      run: decodeRun(raw.run),
      ...(typeof raw.open === 'string' ? { open: raw.open } : {}),
      hideDone: raw.hideDone === true,
    };
  } catch {
    return { run: emptyRun(), hideDone: false };
  }
}

function storageOf(win        , which                                   )                      {
  try {
    return win[which];
  } catch {
    return undefined;
  }
}

/** The default reset: every key of the page's storage except `keep`, and its databases. */
async function clearAppStorage(win        , keep        )                {
  for (const store of [storageOf(win, 'localStorage'), storageOf(win, 'sessionStorage')]) {
    if (!store) continue;
    const keys           = [];
    for (let i = 0; i < store.length; i++) keys.push(store.key(i) ?? '');
    for (const key of keys) if (key !== keep) store.removeItem(key);
  }
  try {
    const databases = await win.indexedDB?.databases?.();
    for (const db of databases ?? []) if (db.name) win.indexedDB.deleteDatabase(db.name);
  } catch {
    // A browser without the list keeps its databases; the app's own reset can remove them.
  }
}

export function starteTestrahmen(ziel             , anbindung           , optionen           = {})             {
  const doc = ziel.ownerDocument;
  const win = doc.defaultView          ;
  const store = optionen.speicher ?? storageOf(win, 'localStorage');
  const now = optionen.jetzt ?? (() => Date.now());
  const send = optionen.senden ?? ((input                   , init              ) => win.fetch(input, init));
  const key = speicherSchluessel(anbindung.app);
  const catalogue = catalogueOf(anbindung.handtests);
  const info           = {
    name: anbindung.name,
    version: anbindung.version,
    stand: anbindung.stand,
    // Only start points with a valid id: one with a quote or a space would break the page's selectors.
    startpunkte: (anbindung.startpunkte ?? []).filter((p) => START_ID.test(p.id)),
    problems: bindingProblems(anbindung),
    inviteHref: optionen.einladenAdresse ?? EINLADEN_ADRESSE,
  };
  const saved = readSaved(store, key);
  const open = saved.open !== undefined && catalogue.some((c) => c.id === saved.open) ? saved.open : undefined;
  let state            = {
    catalogue,
    run: open === undefined ? saved.run : openTest(saved.run, open, now()),
    ...(open === undefined ? {} : { open }),
    hideDone: saved.hideDone,
    tab: 'tests',
    sending: false,
    now: now(),
    ...(store ? {} : { unsaved: true }),
  };

  // The frame: tabs (narrow screens only), the app, the test side.
  const huelle = doc.createElement('div');
  huelle.className = 'tr-huelle';
  const reiter = doc.createElement('nav');
  reiter.className = 'tr-reiter';
  reiter.setAttribute('aria-label', 'Ansicht');
  for (const [wert, label] of [['app', 'App'], ['tests', 'Tests']]         ) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.aktion = 'reiter';
    b.dataset.wert = wert;
    reiter.append(b);
  }
  const appBehaelter = doc.createElement('div');
  appBehaelter.className = 'tr-app';
  const feld = doc.createElement('aside');
  feld.className = 'tr-feld';
  feld.setAttribute('aria-label', 'Testbereich');
  // The one live region: it stays while the panel is drawn anew, so a screen reader announces
  // each new message (a region inserted together with its text is often not read).
  const ansage = doc.createElement('div');
  ansage.className = 'tr-ansage';
  ansage.setAttribute('role', 'status');
  ansage.setAttribute('aria-live', 'polite');
  huelle.append(reiter, appBehaelter, feld, ansage);
  ziel.append(huelle);
  let ansageTimer                                           ;
  let ansageText = '';
  /**
   * Says `text` through the live region; emptied first, so the same text is said again. A text still
   * waiting is said with it (a message and the storage notice of the same change), not dropped.
   */
  const announce = (text        ) => {
    ansage.textContent = '';
    if (ansageTimer !== undefined) win.clearTimeout(ansageTimer);
    ansageText = ansageText === '' || ansageText.includes(text) ? (ansageText || text) : `${ansageText} ${text}`;
    ansageTimer = win.setTimeout(() => {
      ansage.textContent = ansageText;
      ansageText = '';
      ansageTimer = undefined;
    }, 60);
  };

  /** `open`: the test to store as open; a tab that only passes its clock on keeps the stored one. */
  const save = (open = state.open) => {
    if (!store) return;
    try {
      store.setItem(key, JSON.stringify({ run: state.run, open, hideDone: state.hideDone }));
      if (state.unsaved) state = { ...state, unsaved: false };
    } catch {
      // A full or blocked storage: the page goes on, the results stay for this visit, and it says so.
      if (!state.unsaved) announce(UNSAVED_NOTICE);
      state = { ...state, unsaved: true };
    }
  };

  /**
   * `top`: the view starts at the top (a test opened). `reveal`: what the tester must see now — the
   * question or the message this change brought, or the focused control. A plain re-render keeps the
   * reader's place (focus without scrolling); a message shown before is not scrolled to again.
   */
  const render = (focus         , top = false, reveal                                    ) => {
    const active = doc.activeElement instanceof win.HTMLElement && feld.contains(doc.activeElement) ? doc.activeElement.dataset.fokus : undefined;
    state = { ...state, now: now() };
    feld.innerHTML = panelHtml(state, info);
    huelle.dataset.reiter = state.tab;
    for (const b of reiter.querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.wert === state.tab ? 'true' : 'false');
    if (top) feld.scrollTop = 0;
    const target = focus ?? active;
    const control = target ? (feld.querySelector(`[data-fokus="${target}"]`)                      ) : null;
    control?.focus({ preventScroll: true });
    const shown = reveal === 'frage' ? feld.querySelector('.tr-frage') : reveal === 'meldung' ? feld.querySelector('.tr-kopf [data-meldung]') : null;
    if (reveal) (shown ?? control)?.scrollIntoView?.({ block: 'nearest' });
  };

  const change = (next                    , focus         , top = false) => {
    if (next.message !== undefined) announce(next.message.text);
    const reveal = next.question !== undefined ? 'frage' : next.message !== undefined ? 'meldung' : focus !== undefined && !top ? 'bedienung' : undefined;
    state = { ...state, ...next };
    save();
    render(focus, top, reveal);
  };

  /** The open test's clock pauses (before the app restarts or the page goes). */
  const pause = () => {
    if (state.open !== undefined) state = { ...state, run: leaveTest(state.run, state.open, now()) };
    save();
  };

  const versionOf = (id        ) => catalogue.find((c) => c.id === id)?.version;

  /** Where the focus goes back to after a question: the control that asked it. */
  const askedBy = (question          ) => (question.kind === 'startpunkt' ? `start-${question.id}` : `frage-${question.kind}`);

  async function answer(question          )                {
    change({ question: undefined }, askedBy(question));
    if (question.kind === 'senden') return sendReport();
    pause();
    let failed = false;
    try {
      if (question.kind === 'neustart') await (anbindung.neuStarten ? anbindung.neuStarten() : win.location.reload());
      else if (question.kind === 'zuruecksetzen') {
        if (anbindung.zuruecksetzen) await anbindung.zuruecksetzen();
        else {
          await clearAppStorage(win, key);
          win.location.reload();
        }
      } else if (anbindung.laden) await anbindung.laden(question.id);
    } catch {
      failed = true;
    } finally {
      // The app may restart in place, or fail to: either way the open test's clock goes on.
      change({
        run: state.open === undefined ? state.run : openTest(state.run, state.open, now()),
        ...(failed ? { message: { kind: 'fehler'         , text: 'Die App konnte das nicht ausführen. Bitte die Seite neu laden und es noch einmal versuchen.' } } : {}),
      }, askedBy(question));
    }
  }

  async function sendReport()                {
    const plan = info.problems.length > 0
      ? { ok: false         , problem: info.problems.join(' ') }
      : reportPlan(state.run, catalogue.map((c) => c.id), anbindung);
    if (!plan.ok) return change({ message: { kind: 'fehler', text: plan.problem } }, 'frage-senden');
    // What each report carries, as planned: a result changed while the reports travel (also before
    // its own report leaves) still belongs in the next one.
    const planned = plan.reports.map((report) => report.sent.map((id) => [id, state.run.entries[id]]         ));
    change({ sending: true, message: undefined }, 'frage-senden');
    // One report per build; each that arrived marks its unchanged results.
    let message = { kind: 'ok'                   , text: '' };
    for (const [index, report] of plan.reports.entries()) {
      const sentEntries = planned[index] ?? [];
      let outcome                                    ;
      try {
        const response = await send(optionen.berichtAdresse ?? BERICHT_ADRESSE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report.body),
          credentials: 'same-origin',
        });
        outcome = sendOutcome(response.status, await response.text());
      } catch {
        outcome = { sent: false, message: 'Keine Verbindung zum Testbereich. Bitte später noch einmal senden.' };
      }
      if (!outcome.sent) {
        message = { kind: 'fehler', text: outcome.message };
        break;
      }
      const unchanged = sentEntries.filter(([id, sent]) => sameEntry(state.run.entries[id], sent)).map(([id]) => id);
      state = { ...state, run: markReported(state.run, unchanged, now()) };
      save();
      message = { kind: 'ok', text: plan.reports.length > 1 ? `${outcome.message} (${plan.reports.length} Berichte, je Fassung einer)` : outcome.message };
    }
    // Back to the button only when the tester has not gone on elsewhere (e.g. into the app).
    // Only while the focus is still on the button: anyone who went on (in the app or on the test side)
    // keeps his place; the message stands on top without being scrolled to.
    const stayed = doc.activeElement instanceof win.HTMLElement && doc.activeElement.dataset.fokus === 'frage-senden';
    if (stayed) change({ sending: false, message }, 'frage-senden');
    else {
      announce(message.text);
      state = { ...state, sending: false, message };
      save();
      render();
    }
  }

  const openCase = (id        ) => {
    if (!catalogue.some((c) => c.id === id)) return;
    const left = state.open === undefined ? state.run : leaveTest(state.run, state.open, now());
    change({ run: openTest(left, id, now()), open: id, tab: 'tests', message: undefined }, 'uebersicht', true);
  };

  const onClick = (event       ) => {
    // The second click of a double click acts on what the first one brought up (a question's „Ja“
    // stands where its button was): only the first counts.
    if (event instanceof win.MouseEvent && event.detail > 1) return;
    const control = (event.target                  )?.closest?.('[data-aktion]');
    // Only the test side and the tabs: the app's own markup never triggers the page.
    if (!(control instanceof win.HTMLElement) || !(feld.contains(control) || reiter.contains(control))) return;
    if (control instanceof win.HTMLSelectElement || control instanceof win.HTMLInputElement) return;
    const { aktion, id, wert, frage } = control.dataset;
    switch (aktion) {
      case 'oeffnen':
        if (id) openCase(id);
        break;
      case 'uebersicht':
        // A test hidden as done cannot take the focus: the checkbox above the list does.
        change({ run: state.open === undefined ? state.run : leaveTest(state.run, state.open, now()), open: undefined }, state.open === undefined ? undefined : state.hideDone && doneHere(state.run.entries[state.open], anbindung) ? 'erledigte' : `test-${state.open}`, true);
        break;
      case 'ergebnis':
        if (id && (wert === 'bestanden' || wert === 'nicht bestanden')) {
          change({ run: setResult(state.run, id, wert           , now(), versionOf(id), { version: anbindung.version, stand: anbindung.stand }), message: undefined }, `ergebnis-${wert}`);
        }
        break;
      case 'zuruecknehmen':
        if (id) change({ run: resetTest(state.run, id, now()), message: undefined }, 'ergebnis-bestanden');
        break;
      // A question that loses the app's data starts on „Abbrechen“, so a double Enter wipes nothing.
      case 'frage':
        if (frage === 'senden' && state.sending) break;
        if (frage === 'neustart' || frage === 'senden') change({ question: { kind: frage }, message: undefined }, 'ja');
        else if (frage === 'zuruecksetzen') change({ question: { kind: frage }, message: undefined }, 'nein');
        break;
      case 'startpunkt':
        if (id && info.startpunkte.some((p) => p.id === id)) change({ question: { kind: 'startpunkt', id }, message: undefined }, 'nein');
        else if (id) change({ message: { kind: 'fehler', text: `Den vorbereiteten Stand „${id}“ kennt diese App nicht.` } });
        break;
      case 'ja':
        if (state.question) void answer(state.question);
        break;
      case 'nein':
        if (state.question) change({ question: undefined }, askedBy(state.question));
        break;
      case 'reiter':
        if (wert === 'app' || wert === 'tests') change({ tab: wert });
        break;
    }
  };

  const onChange = (event       ) => {
    const control = event.target;
    if (control instanceof win.HTMLSelectElement && control.dataset.aktion === 'schritt') {
      const { id, nr } = control.dataset;
      if (id && nr) change({ run: setStep(state.run, id, Number(nr), control.value === '' ? undefined : control.value, { version: anbindung.version, stand: anbindung.stand }), message: undefined }, `schritt-${nr}`);
    } else if (control instanceof win.HTMLInputElement && control.dataset.aktion === 'erledigte') {
      change({ hideDone: control.checked }, 'erledigte');
    }
  };

  const onKey = (event               ) => {
    if (event.key === 'Escape' && state.question && event.target instanceof win.Node && feld.contains(event.target)) {
      event.preventDefault();
      change({ question: undefined }, askedBy(state.question));
    }
  };

  /**
   * Another tab of the test page stored its run (or this page comes back from the browser's
   * back/forward cache): take it over, so neither tab overwrites the other. The test open here keeps
   * its own running clock while it has no result there — the copy as read never holds a running
   * clock (decodeRun stops it). Both clocks ran at the same time, so the time counts once: only what
   * the other tab measured beyond this one is added (this clock then starts that much earlier).
   */
  const adoptStored = () => {
    const saved = readSaved(store, key);
    let run = saved.run;
    let ahead = false;
    if (state.open !== undefined) {
      const own = state.run.entries[state.open];
      const theirs = saved.run.entries[state.open];
      if (own?.openedAt !== undefined && theirs?.result === undefined) {
        const extra = storedBeyond(own, theirs, now());
        run = { entries: { ...run.entries, [state.open]: extra > 0 ? { ...own, openedAt: own.openedAt - extra * 1000 } : own } };
        // This tab measured clearly more than the store holds (two windows side by side, neither
        // hidden): store it, so a result given in the other tab carries it. Above the 1 s the stored
        // whole seconds may lose, so two tabs never keep answering each other.
        ahead = extra < -AHEAD_SECONDS;
      } else run = openTest(run, state.open, now());
    }
    state = { ...state, run, hideDone: saved.hideDone };
    if (ahead && state.open !== undefined) {
      state = { ...state, run: checkpoint(state.run, state.open, now()) };
      save(saved.open);
    }
  };
  const onStorage = (event              ) => {
    if (event.key !== key) return;
    adoptStored();
    render();
  };

  const onVisibility = () => {
    if (doc.visibilityState === 'hidden' && state.open !== undefined) {
      state = { ...state, run: checkpoint(state.run, state.open, now()) };
      save();
    }
  };
  const onHide = () => pause();
  const onShow = (event                     ) => {
    // Back from the bfcache: another tab may have stored meanwhile, and its storage events come only
    // after this one. Take its run over first (and start the open test's clock), then store.
    if (!event.persisted) return;
    adoptStored();
    change({});
  };

  huelle.addEventListener('click', onClick);
  feld.addEventListener('change', onChange);
  feld.addEventListener('keydown', onKey);
  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('pagehide', onHide);
  win.addEventListener('pageshow', onShow);
  win.addEventListener('storage', onStorage);
  // The clock on the page moves while a test without a result is open. Only its text changes: a
  // whole new page would lose the reader's place, the focus and a screen reader's position.
  const timer = win.setInterval(() => {
    const entry = state.open === undefined ? undefined : state.run.entries[state.open];
    const line = feld.querySelector('.tr-uhr');
    if (entry?.openedAt !== undefined && line) line.textContent = clockText(entry, now());
  }, 15_000);

  save();
  render();
  // What is wrong from the start is said once, not on every new drawing of the panel.
  const atStart = [...info.problems, ...(state.unsaved ? [UNSAVED_NOTICE] : [])];
  if (atStart.length > 0) announce(atStart.join(' '));
  return {
    appBehaelter,
    beenden() {
      win.clearInterval(timer);
      if (ansageTimer !== undefined) win.clearTimeout(ansageTimer);
      huelle.removeEventListener('click', onClick);
      feld.removeEventListener('change', onChange);
      feld.removeEventListener('keydown', onKey);
      doc.removeEventListener('visibilitychange', onVisibility);
      win.removeEventListener('pagehide', onHide);
      win.removeEventListener('pageshow', onShow);
      win.removeEventListener('storage', onStorage);
      pause();
      // The app unmounts its own root in `appBehaelter` first; a restart then builds a fresh frame.
      huelle.remove();
    },
  };
}
