// docs/data-model.html, generated from the source (`npm run docs`): the binding tree, the profile
// and syntax tables and the type codes come straight from the data; entities and functions are
// listed here and checked against real objects by tests/docs/dataModel.test.ts.
import { INVOICE } from '../logic/binding';
import type { GroupDef } from '../logic/binding';
import { PROFILES } from '../logic/profiles';
import { SYNTAXES } from '../logic/syntax';
import { TYPE_CODES } from '../logic/texts';

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface EntityDoc {
  name: string;
  file: string;
  purpose: string;
  fields: { name: string; type: string; required: boolean; meaning: string }[];
}

export const ENTITIES: EntityDoc[] = [
  {
    name: 'Analysis',
    file: 'src/logic/analysis.ts',
    purpose: 'Was IO in einer Datei gefunden hat – nur Werte, kein XML-Dokument, kein PDF.',
    fields: [
      { name: 'fileName', type: 'string', required: true, meaning: 'Name der geprüften Datei' },
      {
        name: 'kind',
        type: "'pdf' | 'xml' | 'unknown'",
        required: true,
        meaning: 'Dateiart nach Inhalt',
      },
      {
        name: 'problem',
        type: '{ kind: FileProblemKind; problems: Problem[] }',
        required: false,
        meaning: 'Datei unlesbar, leer, zu groß, geschützt, DOCTYPE, fehlerhaftes XML',
      },
      {
        name: 'root',
        type: '{ name; namespace }',
        required: false,
        meaning: 'Wurzel einer XML-Datei ohne bekannte Rechnungssyntax',
      },
      {
        name: 'pdf',
        type: '{ pages; unreadable: string[]; truncated }',
        required: false,
        meaning: 'Seitenzahl, nicht lesbare Anhänge, mehr als 50 Anhänge',
      },
      {
        name: 'invoices',
        type: 'InvoicePart[]',
        required: true,
        meaning: 'Gefundene Rechnungs-XML (Datei oder Anhänge)',
      },
      { name: 'others', type: 'OtherPart[]', required: true, meaning: 'Andere Anhänge eines PDF' },
    ],
  },
  {
    name: 'InvoicePart',
    file: 'src/logic/analysis.ts',
    purpose: 'Eine Rechnungs-XML.',
    fields: [
      {
        name: 'origin',
        type: 'string',
        required: true,
        meaning: 'Dateiname oder Name des Anhangs',
      },
      {
        name: 'syntax',
        type: 'SyntaxId',
        required: true,
        meaning: 'ubl-invoice, ubl-creditnote, cii, zugferd1',
      },
      {
        name: 'header',
        type: 'HeaderValues',
        required: true,
        meaning: 'Kernwerte wie geschrieben (BT-1, -2, -3, -5, -24, -27, -112)',
      },
      {
        name: 'model',
        type: 'InvoiceModel',
        required: false,
        meaning: 'Das ganze EN-16931-Modell; fehlt bei ZUGFeRD 1.0',
      },
    ],
  },
  {
    name: 'OtherPart',
    file: 'src/logic/analysis.ts',
    purpose: 'Ein PDF-Anhang, der keine Rechnungs-XML ist.',
    fields: [
      { name: 'origin', type: 'string', required: true, meaning: 'Name des Anhangs' },
      {
        name: 'kind',
        type: "'otherXml' | 'brokenXml' | 'doctypeXml' | 'notXml'",
        required: true,
        meaning: 'Warum keine Rechnung',
      },
      {
        name: 'root',
        type: '{ name; namespace }',
        required: false,
        meaning: 'Wurzel eines fremden XML',
      },
      {
        name: 'problems',
        type: 'Problem[]',
        required: false,
        meaning: 'Fehler beim Lesen mit Zeile',
      },
    ],
  },
  {
    name: 'Problem',
    file: 'src/logic/analysis.ts',
    purpose: 'Eine Meldung des XML- oder PDF-Lesers.',
    fields: [
      { name: 'message', type: 'string', required: true, meaning: 'Text der Meldung' },
      { name: 'line', type: 'number', required: false, meaning: 'Zeile' },
      { name: 'col', type: 'number', required: false, meaning: 'Spalte' },
    ],
  },
  {
    name: 'ModelGroup (InvoiceModel)',
    file: 'src/logic/model.ts',
    purpose:
      'Einheitliches Modell: Gruppe (BG) mit Termen (BT) und Untergruppen; die Wurzel heißt INVOICE.',
    fields: [
      { name: 'bg', type: 'GroupId', required: true, meaning: "'INVOICE' oder 'BG-n'" },
      {
        name: 'terms',
        type: 'Partial<Record<BtId, TermValue[]>>',
        required: true,
        meaning: 'Nur Terme mit Wert',
      },
      {
        name: 'groups',
        type: 'Partial<Record<GroupId, ModelGroup[]>>',
        required: true,
        meaning: 'Nur Gruppen mit Inhalt',
      },
    ],
  },
  {
    name: 'TermValue',
    file: 'src/logic/model.ts',
    purpose: 'Ein Wert eines Terms.',
    fields: [
      {
        name: 'value',
        type: 'string',
        required: true,
        meaning: 'Getrimmt; Datum als JJJJ-MM-TT, wenn lesbar',
      },
      { name: 'raw', type: 'string', required: true, meaning: 'Wie in der XML geschrieben' },
    ],
  },
  {
    name: 'Verdict',
    file: 'src/logic/verdict.ts',
    purpose: 'Ergebnis des Erkennens – immer Hinweis, nie Freigabe.',
    fields: [
      {
        name: 'tone',
        type: "'ok' | 'warn' | 'bad'",
        required: true,
        meaning: 'Farbe der Ergebnisbox',
      },
      {
        name: 'headline',
        type: 'string',
        required: true,
        meaning: 'Überschrift (Texte aus texts.ts)',
      },
      { name: 'explanation', type: 'string[]', required: true, meaning: 'Erklärende Sätze' },
      { name: 'invoices', type: 'InvoiceVerdict[]', required: true, meaning: 'Je Rechnungs-XML' },
      {
        name: 'comparison',
        type: '{ same; differing: BtId[] }',
        required: false,
        meaning: 'Vergleich mehrerer Rechnungs-XML',
      },
    ],
  },
  {
    name: 'InvoiceVerdict',
    file: 'src/logic/verdict.ts',
    purpose: 'Einordnung einer Rechnungs-XML.',
    fields: [
      { name: 'part', type: 'InvoicePart', required: true, meaning: 'Die geprüfte XML' },
      { name: 'syntaxLabel', type: 'string', required: true, meaning: 'Bezeichnung der Syntax' },
      { name: 'profile', type: 'ProfileMatch', required: true, meaning: 'Treffer in PROFILES' },
      {
        name: 'einordnung',
        type: "'eRechnung' | 'keineERechnung' | 'nichtBeurteilt'",
        required: true,
        meaning: 'Einordnung',
      },
      {
        name: 'specLabel',
        type: 'string',
        required: true,
        meaning: 'Bezeichnung der Spezifikation',
      },
    ],
  },
];

export const FUNCTIONS: { layer: string; signature: string; purpose: string }[] = [
  {
    layer: 'io',
    signature: 'analyzeFile(fileName, bytes, loadPdfJs): Promise<Analysis>',
    purpose: 'Dateiart nach Inhalt, PDF-Anhänge, XML lesen, Modell bilden',
  },
  {
    layer: 'io',
    signature: 'readXml(bytes): XmlRead',
    purpose: 'XML lesen: Größe, DOCTYPE abgewiesen, ohne Netz und externe Entitäten',
  },
  {
    layer: 'io',
    signature: 'extractModel(doc, syntax): RawGroup | undefined',
    purpose: 'Die Zuordnung (binding) über das Dokument laufen lassen',
  },
  {
    layer: 'io',
    signature: 'readPdfAttachments(pdfjs, bytes): Promise<PdfRead>',
    purpose: 'Eingebettete Dateien eines PDF',
  },
  {
    layer: 'io',
    signature: 'xsdValidator(entry, files) / schemaProblems(doc, validator)',
    purpose: 'XSD-Prüfung mit den mitgelieferten Schemas (Schritt 2)',
  },
  {
    layer: 'logic',
    signature: 'normalize(raw, { ubl? }): InvoiceModel',
    purpose: 'Trimmen, Datum nach ISO, leere Gruppen entfernen, UBL-Betreff „#ADU#“ trennen',
  },
  {
    layer: 'logic',
    signature: 'valuesOf(model, "BG-4/BT-27"): TermValue[]',
    purpose: 'Werte über alle Vorkommen der Gruppen',
  },
  {
    layer: 'logic',
    signature: 'groupsOf(model, "BG-25"): ModelGroup[]',
    purpose: 'Vorkommen einer Gruppe',
  },
  {
    layer: 'logic',
    signature: 'coreValues(model): HeaderValues',
    purpose: 'Kernwerte für das Erkennen',
  },
  {
    layer: 'logic',
    signature: 'profileOf(bt24): ProfileMatch',
    purpose: 'Kennung → Einordnung (exakt vor längstem Präfix)',
  },
  {
    layer: 'logic',
    signature: 'verdictOf(analysis): Verdict',
    purpose: 'Ergebnis mit Überschrift und Erklärung',
  },
  {
    layer: 'logic',
    signature: 'differingTerms(parts): BtId[]',
    purpose: 'Unterschiede zwischen mehreren Rechnungs-XML',
  },
  {
    layer: 'logic',
    signature: 'invoiceDetails(invoice, inPdf): DetailRow[]',
    purpose: 'Detailzeilen (deutsches Datum und Betrag)',
  },
  {
    layer: 'logic',
    signature: 'scanProlog(text) / looksLikeXml(bytes)',
    purpose: 'XML am Inhalt erkennen, DOCTYPE finden',
  },
  {
    layer: 'logic',
    signature: 'parseDecimal / decimalEquals / formatAmount',
    purpose: 'Genaue Dezimalzahlen auf BigInt',
  },
];

/** id-reference links between the entities: from · field · to · cardinality */
export const RELATIONS: [string, string, string, string][] = [
  ['Analysis', 'invoices', 'InvoicePart', '0..n'],
  ['Analysis', 'others', 'OtherPart', '0..n'],
  ['Analysis', 'problem.problems', 'Problem', '0..n'],
  ['OtherPart', 'problems', 'Problem', '0..n'],
  ['InvoicePart', 'syntax', 'SyntaxEntry (SYNTAXES)', '1'],
  ['InvoicePart', 'model', 'ModelGroup', '0..1'],
  ['ModelGroup', 'groups', 'ModelGroup', '0..n'],
  ['ModelGroup', 'terms', 'TermValue', '0..n'],
  ['ModelGroup', 'bg', 'GroupDef (binding)', '1'],
  ['Verdict', 'invoices', 'InvoiceVerdict', '0..n'],
  ['InvoiceVerdict', 'part', 'InvoicePart', '1'],
  ['InvoiceVerdict', 'profile.entry', 'ProfileEntry (PROFILES)', '0..1'],
];

function bindingRows(group: GroupDef, depth: number): string {
  const indent = depth * 16;
  const groupRow = `<tr class="grp"><td style="padding-left:${indent}px"><b>${esc(group.bg)}</b> ${esc(group.label)}${group.repeats ? ' <span class="tag">wiederholbar</span>' : ''}</td><td><code>${esc(group.ubl ?? '–')}</code>${group.ublCreditNote ? `<br><small>CreditNote: <code>${esc(group.ublCreditNote)}</code></small>` : ''}</td><td><code>${esc(group.cii ?? '–')}</code></td></tr>`;
  const termRows = group.terms
    .map(
      (t) =>
        `<tr><td style="padding-left:${indent + 16}px">${esc(t.bt)} ${esc(t.label)} <span class="tag">${t.kind}</span></td><td><code>${esc(t.ubl ?? '–')}</code>${t.ublCreditNote ? `<br><small>CreditNote: <code>${esc(t.ublCreditNote)}</code></small>` : ''}</td><td><code>${esc(t.cii ?? '–')}</code></td></tr>`,
    )
    .join('');
  return groupRow + termRows + group.groups.map((g) => bindingRows(g, depth + 1)).join('');
}

function erDiagram(): string {
  const boxes: Record<string, [number, number]> = {
    Analysis: [20, 30],
    InvoicePart: [250, 30],
    OtherPart: [20, 150],
    Problem: [20, 250],
    ModelGroup: [480, 30],
    TermValue: [480, 150],
    SyntaxEntry: [250, 150],
    GroupDef: [700, 30],
    Verdict: [250, 250],
    InvoiceVerdict: [480, 250],
    ProfileEntry: [700, 250],
  };
  const w = 170;
  const h = 40;
  const center = (name: string) => {
    const [x, y] = boxes[name] ?? [0, 0];
    return [x + w / 2, y + h / 2] as const;
  };
  const edges: [string, string, string][] = [
    ['Analysis', 'InvoicePart', 'own'],
    ['Analysis', 'OtherPart', 'own'],
    // Analysis → Problem is in the table; drawn it would run through OtherPart
    ['OtherPart', 'Problem', 'own'],
    ['InvoicePart', 'ModelGroup', 'own'],
    ['ModelGroup', 'TermValue', 'own'],
    ['InvoicePart', 'SyntaxEntry', 'ref'],
    ['ModelGroup', 'GroupDef', 'ref'],
    ['Verdict', 'InvoiceVerdict', 'own'],
    ['InvoiceVerdict', 'InvoicePart', 'ref'],
    ['InvoiceVerdict', 'ProfileEntry', 'ref'],
  ];
  // Lines start and end on the box borders so the arrow heads stay visible.
  const toBorder = (dx: number, dy: number) => {
    const t = Math.min(
      dx === 0 ? Infinity : w / 2 / Math.abs(dx),
      dy === 0 ? Infinity : h / 2 / Math.abs(dy),
    );
    return [dx * t, dy * t] as const;
  };
  const lines = edges
    .map(([a, b, kind]) => {
      const [ax, ay] = center(a);
      const [bx, by] = center(b);
      const [ox, oy] = toBorder(bx - ax, by - ay);
      const r = (n: number) => Math.round(n * 10) / 10;
      return `<line x1="${r(ax + ox)}" y1="${r(ay + oy)}" x2="${r(bx - ox)}" y2="${r(by - oy)}" class="${kind}" marker-end="url(#arrow-${kind})"/>`;
    })
    .join('');
  const rects = Object.entries(boxes)
    .map(
      ([name, [x, y]]) =>
        `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="${['SyntaxEntry', 'GroupDef', 'ProfileEntry'].includes(name) ? 'data' : 'entity'}"/><text x="${x + w / 2}" y="${y + 25}" text-anchor="middle">${name}</text></g>`,
    )
    .join('');
  return `<svg viewBox="0 0 900 310" role="img" aria-label="Beziehungen der Entitäten">
<defs><marker id="arrow-own" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" class="own-head"/></marker><marker id="arrow-ref" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" class="ref-head"/></marker></defs>
${lines}${rects}</svg>`;
}

export function dataModelPage(): string {
  const entityTables = ENTITIES.map(
    (
      e,
    ) => `<h3>${esc(e.name)}</h3><p>${esc(e.purpose)} <small><code>${esc(e.file)}</code></small></p>
<table><thead><tr><th>Feld</th><th>Typ</th><th>Pflicht</th><th>Bedeutung</th></tr></thead><tbody>${e.fields
      .map(
        (f) =>
          `<tr><td><code>${esc(f.name)}</code></td><td><code>${esc(f.type)}</code></td><td>${f.required ? 'ja' : 'nein'}</td><td>${esc(f.meaning)}</td></tr>`,
      )
      .join('')}</tbody></table>`,
  ).join('\n');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>E-Rechnung prüfen – Datenmodell</title>
<style>
:root{--bg:#fff;--fg:#1d1d1f;--muted:#5f6368;--line:#d0d5da;--panel:#f4f6f8;--own:#0b5cad;--ref:#8a5300;--data:#e8f4ec}
@media (prefers-color-scheme:dark){:root{--bg:#16181b;--fg:#e8eaed;--muted:#a0a4a8;--line:#3a3f45;--panel:#202327;--own:#6aa8ef;--ref:#e0a050;--data:#1f3326}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}
table{border-collapse:collapse;width:100%;margin:8px 0 20px}th,td{border-bottom:1px solid var(--line);padding:4px 8px;text-align:left;vertical-align:top}
th{background:var(--panel)}code{font-size:12.5px;overflow-wrap:anywhere}tr.grp td{background:var(--panel)}
.tag{font-size:11px;border:1px solid var(--line);border-radius:4px;padding:0 4px;color:var(--muted)}
svg{width:100%;height:auto;max-width:900px}svg text{fill:var(--fg);font-size:13px}
rect.entity{fill:var(--panel);stroke:var(--line)}rect.data{fill:var(--data);stroke:var(--line)}
line.own{stroke:var(--own);stroke-width:1.6}line.ref{stroke:var(--ref);stroke-width:1.6;stroke-dasharray:5 4}
.own-head{fill:var(--own)}.ref-head{fill:var(--ref)}
</style>
</head>
<body><main>
<h1>E-Rechnung prüfen – Datenmodell</h1>
<p>Erzeugt aus dem Quelltext mit <code>npm run docs</code> – bei jeder Änderung am Modell neu erzeugen. Ein Test schlägt fehl, wenn diese Datei veraltet ist.</p>

<h2>Ablauf</h2>
<p>Datei (Bytes) → <b>analyzeFile</b> (io) → <b>Analysis</b> mit <b>InvoicePart</b>s → <b>verdictOf</b> (logic) → <b>Verdict</b>. Jede Rechnungs-XML in UBL oder CII wird über die Zuordnung (<code>src/logic/binding.ts</code>) zum einheitlichen <b>InvoiceModel</b>.</p>

<h2>Beziehungen</h2>
${erDiagram()}
<p><small>Blau durchgezogen: enthält. Braun gestrichelt: verweist auf feste Daten oder ein anderes Objekt. Grün hinterlegt: fest eingebaute Daten.</small></p>
<table><thead><tr><th>Von</th><th>Feld</th><th>Nach</th><th>Kardinalität</th></tr></thead><tbody>${RELATIONS.map(
    ([from, field, to, card]) =>
      `<tr><td>${esc(from)}</td><td><code>${esc(field)}</code></td><td>${esc(to)}</td><td>${card}</td></tr>`,
  ).join('')}</tbody></table>

<h2>Entitäten</h2>
${entityTables}

<h2>Funktionen, die das Modell bilden und auswerten</h2>
<table><thead><tr><th>Schicht</th><th>Signatur</th><th>Zweck</th></tr></thead><tbody>${FUNCTIONS.map(
    (f) =>
      `<tr><td>${f.layer}</td><td><code>${esc(f.signature)}</code></td><td>${esc(f.purpose)}</td></tr>`,
  ).join('')}</tbody></table>

<h2>Zuordnung EN 16931 → Syntax (${esc('binding.ts')})</h2>
<p>Quelle: KoSIT „XRechnung Visualization“ v2026-10-13 (Apache-2.0); XPath 2.0 in XPath 1.0 umgeschrieben. Gruppenpfade relativ zur übergeordneten Gruppe, Terme relativ zu ihrer Gruppe.</p>
<table><thead><tr><th>Gruppe / Term</th><th>UBL 2.1</th><th>CII D16B</th></tr></thead><tbody>${bindingRows(INVOICE, 0)}</tbody></table>

<h2>Werkseinstellungen</h2>
<p>Das Tool speichert nichts und hat keine Nutzerdaten. Es gibt <b>keine</b> geseedeten, änderbaren Daten. Fest eingebaut (nur durch ein neues Programm änderbar):</p>
<ul>
<li><b>Syntaxen</b> (<code>SYNTAXES</code>): ${SYNTAXES.map((s) => esc(s.label)).join(', ')}.</li>
<li><b>Profilkennungen</b> (<code>PROFILES</code>, ${PROFILES.length} Einträge) – Tabelle unten.</li>
<li><b>Zuordnung</b> (<code>INVOICE</code> in binding.ts) – Tabelle oben.</li>
<li><b>Rechnungsarten</b> (<code>TYPE_CODES</code>): ${Object.entries(TYPE_CODES)
    .map(([code, label]) => `${code} ${esc(label)}`)
    .join('; ')}.</li>
<li><b>Schemadateien</b> UBL 2.1 und CII D16B (<code>schemas/</code>), unverändert.</li>
<li><b>Texte</b> (<code>TEXTS</code> in texts.ts).</li>
</ul>
<table><thead><tr><th>Kennung (BT-24)</th><th>Vergleich</th><th>Bezeichnung</th><th>Einordnung</th><th>Quelle</th><th>geprüft</th></tr></thead><tbody>${PROFILES.map(
    (p) =>
      `<tr><td><code>${esc(p.id)}</code></td><td>${p.match === 'exact' ? 'genau' : 'Anfang'}</td><td>${esc(p.label)}</td><td>${p.einordnung}</td><td>${esc(p.source)}</td><td>${p.checked ? 'ja' : 'nein'}</td></tr>`,
  ).join('')}</tbody></table>
</main></body></html>
`;
}
