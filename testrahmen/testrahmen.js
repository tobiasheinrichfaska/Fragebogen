// GENERATED from Testumgebung (testrahmen/) by `npm run rahmen` — do not edit here: change it
// there and copy it again. Stand 76382af. Checked by pruefen.mjs against testrahmen.json.
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
    if (typeof entry.grund !== 'string' || !Object.hasOwn(REASONS, entry.grund)) {
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
  return `${JSON.stringify(stored, null, 2)}\n`;
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

                  
                                                                     
                                                
                                                                           
                                             
                                                                       
                                                

const START_LINK = /^start:([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const REF = /\b((?:MT|L)-\d{2,3}(?:-\d{2})?[a-z]?)\b/g;
const INLINE =
  /\*\*(.+?)\*\*|`([^`]+)`|(?<![A-Za-z0-9])_(.+?)_(?![A-Za-z0-9])|\[([^\]]+)\]\(([^)\s]+)\)|<kbd>([^<]+)<\/kbd>/g;

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
    const index = match.index;
    if (index > at) tokens.push(...withRefs(text.slice(at, index)));
    const [, strong, code, em, linkText, href, kbd] = match;
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
    at = index + match[0].length;
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

/** The test is left (another test, the overview, the page hidden): its clock pauses. */
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
  return run.entries[id]?.openedAt === undefined ? run : openTest(leaveTest(run, id, now), id, now);
}

/** A result ends the clock. „Bestanden“ drops the failed steps, „nicht bestanden“ keeps them. */
function setResult(run         , id        , result         , now        , version         )          {
  const entry = entryOf(run, id);
  const rest           = { ...unreported(entry), seconds: elapsedSeconds(entry, now) };
  delete rest.openedAt;
  delete rest.version;
  if (result === 'bestanden') delete rest.steps;
  return withEntry(run, id, { ...rest, result, ...(version === undefined ? {} : { version }) });
}

/** A step of a failed test with its reason; `undefined` takes it out again. */
function setStep(run         , id        , nr        , grund                    )          {
  const entry = run.entries[id];
  if (entry?.result !== 'nicht bestanden' || !Number.isInteger(nr) || nr < 1 || nr > MAX_STEP) return run;
  if (grund !== undefined && !Object.hasOwn(REASONS, grund)) return run;
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
                    
                                                                      
              
                                                            
                  
                             
                
 

                 
                                                                                                         
                                   

/**
 * The report to send: every result not sent yet, and every test of the catalogue without a result
 * as „nicht getestet“; results sent before stay out (they were counted). Refused while a failed
 * test names no step, when there is no new result, or when the login script would refuse it.
 */
function reportPlan(run         , caseIds                   , build          )             {
  if (!isAppId(build.app)) {
    return { ok: false, problem: `Die App nennt keinen gültigen Namen für ihre Berichte („${build.app}“); erlaubt sind z. B. „fragebogen“ oder „azp“.` };
  }
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(build.version) || !/^[0-9a-f]{7,40}$/.test(build.stand)) {
    return { ok: false, problem: 'Diese Fassung der App kennt ihre Version oder ihren Stand nicht und kann keinen Bericht senden.' };
  }
  const ids = [...new Set(caseIds)].filter((id) => REPORT_ID.test(id)).slice(0, MAX_REPORT_TESTS);
  const missing = missingSteps(run).filter((id) => ids.includes(id));
  if (missing.length > 0) {
    return { ok: false, problem: `Bei „Nicht bestanden“ fehlt noch der Schritt mit dem Problem: ${missing.join(', ')}.` };
  }
  const tests            = [];
  const sent           = [];
  for (const id of ids) {
    const entry = run.entries[id];
    if (entry?.result === undefined) {
      tests.push({ id, ergebnis: 'nicht getestet' });
      continue;
    }
    if (entry.reported !== undefined) continue;
    sent.push(id);
    const sekunden = Math.min(MAX_SECONDS, entry.seconds);
    tests.push(
      entry.result === 'bestanden'
        ? { id, ergebnis: 'bestanden', sekunden }
        : { id, ergebnis: 'nicht bestanden', sekunden, schritte: (entry.steps ?? []).map((s) => ({ nr: s.nr, grund: s.grund })) },
    );
  }
  if (sent.length === 0) return { ok: false, problem: 'Es gibt kein neues Ergebnis zu senden.' };
  const checked = checkReport({ format: 'testbericht/1', app: build.app, version: build.version, stand: build.stand, tests }, build.app);
  if (!checked.ok) return { ok: false, problem: `Der Bericht passt nicht zum Testbereich: ${checked.message}` };
  return { ok: true, body: checked.report, sent };
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
  if (status >= 200 && status < 300) return { sent: true, message: said || 'Bericht gespeichert.' };
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
            .filter((s) => typeof s.grund === 'string' && Object.hasOwn(REASONS, s.grund))
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
    };
    if (entry.result !== undefined || entry.seconds > 0) entries[id] = entry;
  }
  return { entries };
}

// The test page as HTML text from its state (docs/testrahmen.md). Pure: every text is escaped, the
// markup has no inline script and no inline style (the apps' CSP forbids both), and every control
// names its action in `data-aktion` for the page's one event listener (seite.ts).

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
          return `<button type="button" class="tr-start"${attrs({ 'data-aktion': 'startpunkt', 'data-id': token.id })}>${esc(token.text)}</button>`;
        default:
          return esc(token.text);
      }
    })
    .join('');
}

function blockHtml(block       , ids                     )         {
  if (block.kind === 'text') return `<p>${inline(block.text, ids)}</p>`;
  if (block.kind === 'code') return `<pre><code>${esc(block.text)}</code></pre>`;
  const tag = block.ordered ? 'ol' : 'ul';
  const items = block.items.map((item, i) => {
    const notes = (block.notes?.[i] ?? []).map((note) => `<p class="tr-danach"><span>Danach:</span> ${inline(note, ids)}</p>`);
    return `<li>${inline(item, ids)}${notes.join('')}</li>`;
  });
  return `<${tag}>${items.join('')}</${tag}>`;
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

function header(state           , info          )         {
  const ids = state.catalogue.map((c) => c.id);
  const totals = totalsOf(state.run, ids);
  const summary = `${totals.tested} von ${ids.length} getestet · ${totals.passed} bestanden · ${totals.failed} nicht bestanden`;
  return [
    '<header class="tr-kopf">',
    `<p class="tr-titel">Testbereich · ${esc(info.name)} <span>${esc(info.version)}</span></p>`,
    '<div class="tr-knoepfe">',
    button('App neu starten', 'frage', { 'data-frage': 'neustart' }),
    button('App vollständig zurücksetzen', 'frage', { 'data-frage': 'zuruecksetzen' }),
    button(state.sending ? 'Wird gesendet …' : 'Bericht senden', 'frage', { 'data-frage': 'senden', disabled: state.sending ? 'disabled' : undefined }),
    `<a class="tr-einladen"${attrs({ href: info.inviteHref })}>Tester einladen</a>`,
    '</div>',
    `<p class="tr-stand">${esc(summary)}</p>`,
    ...info.problems.map((problem) => `<p class="tr-meldung tr-fehler" role="alert">${esc(problem)}</p>`),
    state.message
      ? `<p class="tr-meldung tr-${state.message.kind}" role="status">${esc(state.message.text)}</p>`
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
    button('Abbrechen', 'nein'),
    '</div>',
    '</section>',
  ].join('');
}

function overview(state           , info          )         {
  const areas = new Map                         ();
  for (const c of state.catalogue) areas.set(c.area, [...(areas.get(c.area) ?? []), c]);
  const sections = [...areas].map(([area, cases]) => {
    const shown = cases.filter((c) => !state.hideDone || state.run.entries[c.id]?.result === undefined);
    if (shown.length === 0) return '';
    const boxes = shown.map((c) => {
      const status = statusOf(state.run, c.id);
      const changed = changedSince(state.run.entries[c.id], c.version) ? ' · geändert' : '';
      const away = testAreaOf(c).offered ? '' : ' · nicht im Testbereich';
      return (
        `<li><button type="button" class="tr-test tr-${status}"${attrs({ 'data-aktion': 'oeffnen', 'data-id': c.id, 'data-fokus': `test-${c.id}` })}>` +
        `<span class="tr-id">${esc(c.id)}</span> ${esc(c.title)}<span class="tr-status">${esc(STATUS_LABELS[status] + changed + away)}</span></button></li>`
      );
    });
    return `<section class="tr-bereich"><h2>${esc(area)}</h2><ul class="tr-tests">${boxes.join('')}</ul></section>`;
  });
  const points = info.startpunkte.length === 0
    ? ''
    : `<section class="tr-bereich"><h2>Vorbereitete Stände</h2><ul class="tr-staende">${info.startpunkte
        .map((p) => `<li>${esc(p.titel)} ${button('Laden', 'startpunkt', { 'data-id': p.id })}</li>`)
        .join('')}</ul></section>`;
  return [
    '<div class="tr-uebersicht">',
    `<p class="tr-zeile"><label><input type="checkbox"${attrs({ 'data-aktion': 'erledigte', checked: state.hideDone ? 'checked' : undefined })}> Erledigte ausblenden</label></p>`,
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

function testView(state           , testCase               )         {
  const ids = new Set(state.catalogue.map((c) => c.id));
  const index = state.catalogue.findIndex((c) => c.id === testCase.id);
  const previous = state.catalogue[index - 1];
  const next = state.catalogue[index + 1];
  const entry = state.run.entries[testCase.id];
  const steps = stepsOf(testCase);
  const seconds = elapsedSeconds(entry, state.now);
  const clock = entry?.result !== undefined
    ? `Gemessene Zeit: ${minutesOf(seconds)} Min.`
    : `Die Uhr läuft: ${minutesOf(seconds)} Min.`;
  const parts = testCase.parts.map((part) =>
    (part.label ? `<h3>${esc(part.label)}</h3>` : '') + part.blocks.map((block) => blockHtml(block, ids)).join(''),
  );
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
    previous ? button('‹ Vorheriger', 'oeffnen', { 'data-id': previous.id }) : '',
    next ? button('Nächster ›', 'oeffnen', { 'data-id': next.id, 'data-fokus': 'naechster' }) : '',
    '</nav>',
    `<p class="tr-bereichsname">${esc(testCase.area)}</p>`,
    `<h2><span class="tr-id">${esc(testCase.id)}</span> ${esc(testCase.title)}</h2>`,
    changedSince(entry, testCase.version) ? '<p class="tr-meldung tr-fehler">Dieser Test wurde geändert, seit Sie ihn bewertet haben. Bitte noch einmal prüfen.</p>' : '',
    parts.join(''),
    '<section class="tr-bewertung">',
    `<p class="tr-uhr">${esc(clock)}</p>`,
    `<div class="tr-knoepfe">${results.join('')}</div>`,
    entry?.result === 'nicht bestanden'
      ? steps.length > 0
        ? stepChoice(testCase.id, steps, state.run)
        : '<p class="tr-meldung tr-fehler">Dieser Test hat keine nummerierten Schritte; „Nicht bestanden“ lässt sich so nicht senden.</p>'
      : '',
    entry?.result !== undefined ? button('Ergebnis zurücknehmen', 'zuruecknehmen', { 'data-id': testCase.id }) : '',
    '</section>',
    '</article>',
  ].join('');
}

/** The whole test side for the state. */
function panelHtml(state           , info          )         {
  const open = state.open === undefined ? undefined : state.catalogue.find((c) => c.id === state.open);
  return [
    header(state, info),
    state.question ? questionHtml(state.question, info) : '',
    open ? testView(state, open) : overview(state, info),
  ].join('');
}

// The shared test page in the browser (docs/testrahmen.md): `starteTestrahmen` puts the page next to
// the app — two tabs on a narrow screen — and runs it. The app calls it only in its test build and
// mounts itself into the returned `appBehaelter`. One listener for clicks and one for changes act on
// the `data-aktion` of the controls; every change is stored at once in the browser, under one key
// per app that a reset of the app leaves alone.

/** What the app gives the test page (its test build only). */
                            
                                                                                                 
              
                                    
               
                                                  
                  
                                                               
                
                                                                                 
                                                        
                                                                
                                                         
                                                                                    
                                           
                                                                      
                                      
                                                                                                 
                                                    
                                         
 

                           
                     
                       
                        
                          
                           
 

                             
                                    
                            
                                                                                      
                  
 

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
    startpunkte: anbindung.startpunkte ?? [],
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
  huelle.append(reiter, appBehaelter, feld);
  ziel.append(huelle);

  const save = () => {
    try {
      store?.setItem(key, JSON.stringify({ run: state.run, open: state.open, hideDone: state.hideDone }));
    } catch {
      // A full or blocked storage: the page goes on, the results stay for this visit.
    }
  };

  const render = (focus         , top = false) => {
    const active = doc.activeElement instanceof win.HTMLElement && feld.contains(doc.activeElement) ? doc.activeElement.dataset.fokus : undefined;
    state = { ...state, now: now() };
    feld.innerHTML = panelHtml(state, info);
    huelle.dataset.reiter = state.tab;
    for (const b of reiter.querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.wert === state.tab ? 'true' : 'false');
    if (top) feld.scrollTop = 0;
    const target = focus ?? active;
    if (target) (feld.querySelector(`[data-fokus="${target}"]`)                      )?.focus();
  };

  const change = (next                    , focus         , top = false) => {
    state = { ...state, ...next };
    save();
    render(focus, top);
  };

  /** The open test's clock pauses (before the app restarts or the page goes). */
  const pause = () => {
    if (state.open !== undefined) state = { ...state, run: leaveTest(state.run, state.open, now()) };
    save();
  };

  const versionOf = (id        ) => catalogue.find((c) => c.id === id)?.version;

  async function answer(question          )                {
    change({ question: undefined });
    if (question.kind === 'senden') return sendReport();
    pause();
    if (question.kind === 'neustart') await (anbindung.neuStarten ? anbindung.neuStarten() : win.location.reload());
    else if (question.kind === 'zuruecksetzen') {
      if (anbindung.zuruecksetzen) await anbindung.zuruecksetzen();
      else {
        await clearAppStorage(win, key);
        win.location.reload();
      }
    } else if (anbindung.laden) await anbindung.laden(question.id);
    // The app may restart in place: the open test's clock goes on.
    if (state.open !== undefined) change({ run: openTest(state.run, state.open, now()) });
  }

  async function sendReport()                {
    const plan = info.problems.length > 0
      ? { ok: false         , problem: info.problems.join(' ') }
      : reportPlan(state.run, catalogue.map((c) => c.id), anbindung);
    if (!plan.ok) return change({ message: { kind: 'fehler', text: plan.problem } });
    change({ sending: true, message: undefined });
    try {
      const response = await send(optionen.berichtAdresse ?? BERICHT_ADRESSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan.body),
        credentials: 'same-origin',
      });
      const outcome = sendOutcome(response.status, await response.text());
      change({
        sending: false,
        run: outcome.sent ? markReported(state.run, plan.sent, now()) : state.run,
        message: { kind: outcome.sent ? 'ok' : 'fehler', text: outcome.message },
      });
    } catch {
      change({ sending: false, message: { kind: 'fehler', text: 'Keine Verbindung zum Testbereich. Bitte später noch einmal senden.' } });
    }
  }

  const openCase = (id        ) => {
    if (!catalogue.some((c) => c.id === id)) return;
    const left = state.open === undefined ? state.run : leaveTest(state.run, state.open, now());
    change({ run: openTest(left, id, now()), open: id, tab: 'tests', message: undefined }, 'uebersicht', true);
  };

  const onClick = (event       ) => {
    const control = (event.target                  )?.closest?.('[data-aktion]');
    if (!(control instanceof win.HTMLElement) || !huelle.contains(control)) return;
    if (control instanceof win.HTMLSelectElement || control instanceof win.HTMLInputElement) return;
    const { aktion, id, wert, frage } = control.dataset;
    switch (aktion) {
      case 'oeffnen':
        if (id) openCase(id);
        break;
      case 'uebersicht':
        change({ run: state.open === undefined ? state.run : leaveTest(state.run, state.open, now()), open: undefined }, state.open ? `test-${state.open}` : undefined, true);
        break;
      case 'ergebnis':
        if (id && (wert === 'bestanden' || wert === 'nicht bestanden')) {
          change({ run: setResult(state.run, id, wert           , now(), versionOf(id)), message: undefined }, `ergebnis-${wert}`);
        }
        break;
      case 'zuruecknehmen':
        if (id) change({ run: resetTest(state.run, id, now()), message: undefined }, 'ergebnis-bestanden');
        break;
      case 'frage':
        if (frage === 'neustart' || frage === 'zuruecksetzen' || frage === 'senden') change({ question: { kind: frage }, message: undefined }, 'ja');
        break;
      case 'startpunkt':
        if (id && info.startpunkte.some((p) => p.id === id)) change({ question: { kind: 'startpunkt', id }, message: undefined }, 'ja');
        else if (id) change({ message: { kind: 'fehler', text: `Den vorbereiteten Stand „${id}“ kennt diese App nicht.` } });
        break;
      case 'ja':
        if (state.question) void answer(state.question);
        break;
      case 'nein':
        change({ question: undefined });
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
      if (id && nr) change({ run: setStep(state.run, id, Number(nr), control.value === '' ? undefined : control.value), message: undefined }, `schritt-${nr}`);
    } else if (control instanceof win.HTMLInputElement && control.dataset.aktion === 'erledigte') {
      change({ hideDone: control.checked });
    }
  };

  const onVisibility = () => {
    if (doc.visibilityState === 'hidden' && state.open !== undefined) {
      state = { ...state, run: checkpoint(state.run, state.open, now()) };
      save();
    }
  };
  const onHide = () => pause();
  const onShow = (event                     ) => {
    if (event.persisted && state.open !== undefined) change({ run: openTest(state.run, state.open, now()) });
  };

  huelle.addEventListener('click', onClick);
  huelle.addEventListener('change', onChange);
  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('pagehide', onHide);
  win.addEventListener('pageshow', onShow);
  // The clock on the page moves while a test without a result is open.
  const timer = win.setInterval(() => {
    const entry = state.open === undefined ? undefined : state.run.entries[state.open];
    if (entry?.openedAt !== undefined && state.question === undefined) render();
  }, 15_000);

  save();
  render();
  return {
    appBehaelter,
    beenden() {
      win.clearInterval(timer);
      huelle.removeEventListener('click', onClick);
      huelle.removeEventListener('change', onChange);
      doc.removeEventListener('visibilitychange', onVisibility);
      win.removeEventListener('pagehide', onHide);
      win.removeEventListener('pageshow', onShow);
      pause();
    },
  };
}
