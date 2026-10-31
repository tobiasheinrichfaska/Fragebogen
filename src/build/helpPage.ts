// Renders the help pages "Wo finde ich …?" (src/logic/helpPages.ts) as self-contained German HTML for
// the Kanzlei homepage: no script, no external resources. The tiles are anchors, a chosen document is
// shown with :target; its Muster zooms to the spot and marks it (CSS animation, a still picture when
// the system asks for reduced motion). Every Muster carries the "MUSTER" watermark.
import type { HelpChoice, HelpPage, Muster, MusterItem } from '../logic/helpPages';

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAD = 2;

function item(i: MusterItem): string {
  const size = (i.size ?? 32) / 10;
  switch (i.kind) {
    case 'title':
      return `<text x="${i.x}" y="${i.y}" font-size="${size}" font-weight="700">${esc(i.text ?? '')}</text>`;
    case 'text':
      return `<text x="${i.x}" y="${i.y}" font-size="${size}">${esc(i.text ?? '')}</text>`;
    case 'lines':
      return Array.from({ length: i.rows ?? 1 }, (_, r) => {
        // Rows of slightly different length read as text without saying anything.
        const w = (i.w ?? 0) * (r % 3 === 2 ? 0.62 : r % 2 === 1 ? 0.86 : 1);
        return `<rect class="filler" x="${i.x}" y="${i.y + r * 5}" width="${w.toFixed(1)}" height="2" rx="1"/>`;
      }).join('');
    case 'box':
      return `<rect class="frame" x="${i.x}" y="${i.y}" width="${i.w}" height="${i.h}"/>`;
    case 'field':
      return (
        `<rect class="frame" x="${i.x}" y="${i.y}" width="${i.w}" height="${i.h}"/>` +
        `<text x="${i.x + 1.5}" y="${i.y + 3.2}" font-size="2.4" class="label">${esc(i.text ?? '')}</text>` +
        `<text x="${i.x + 1.5}" y="${i.y + (i.h ?? 0) - 2}" font-size="${size}" class="value">${esc(i.value ?? '')}</text>`
      );
  }
}

/** The Muster as inline SVG; with a target, the stage zooms to it and the field is marked. */
export function musterSvg(muster: Muster, target?: string, label?: string, trap = false): string {
  const field = muster.items.find((i) => i.kind === 'field' && i.id === target);
  const mark = field
    ? `<rect class="mark${trap ? ' trap' : ''}" x="${field.x - PAD}" y="${field.y - PAD}" width="${(field.w ?? 0) + 2 * PAD}" height="${(field.h ?? 0) + 2 * PAD}" rx="1.5"/>`
    : '';
  const style = field
    ? (() => {
        const cx = field.x + (field.w ?? 0) / 2;
        const cy = field.y + (field.h ?? 0) / 2;
        const scale = Math.min(3, Math.max(1.6, muster.width / ((field.w ?? 1) * 2.2)));
        // Move the field to the middle of the stage, but never past the edge of the sheet.
        const shift = (centre: number, size: number) =>
          Math.min(0, Math.max(100 - scale * 100, 50 - (scale * centre * 100) / size));
        return ` style="--tx:${shift(cx, muster.width).toFixed(1)}%;--ty:${shift(cy, muster.height).toFixed(1)}%;--s:${scale.toFixed(2)}"`;
      })()
    : '';
  const cx = muster.width / 2;
  const cy = muster.height / 2;
  return (
    `<div class="stage"${style}><svg viewBox="0 0 ${muster.width} ${muster.height}" role="img" ` +
    `aria-label="${esc(`Muster: ${muster.title}${label ? ` – markiert: ${label}` : ''}`)}">` +
    `<rect class="paper" width="${muster.width}" height="${muster.height}"/>` +
    muster.items.map(item).join('') +
    `<text class="watermark" x="${cx}" y="${cy}" transform="rotate(-30 ${cx} ${cy})" text-anchor="middle" font-size="${(muster.width / 5).toFixed(0)}">MUSTER</text>` +
    mark +
    `</svg></div>`
  );
}

function choiceSection(choice: HelpChoice, musters: ReadonlyMap<string, Muster>): string {
  const muster = choice.muster === undefined ? undefined : musters.get(choice.muster);
  const field = muster?.items.find((i) => i.kind === 'field' && i.id === choice.target);
  const figure =
    muster && field
      ? `<figure>${musterSvg(muster, choice.target, field.text, choice.trap === true)}<figcaption>` +
        (choice.trap
          ? `<span class="found">Achtung, andere Nummer: ${esc(field.text ?? '')}</span>`
          : `<span class="found">Hier: ${esc(field.text ?? '')}</span>`) +
        `<span class="muted">${esc(muster.title)} – ${esc(muster.basis)}; alle Werte erfunden.</span>` +
        `</figcaption></figure>`
      : '';
  const links = (choice.links ?? [])
    .map((l) => `<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.label)}</a></li>`)
    .join('');
  return (
    `<section class="choice" id="${choice.id}" aria-labelledby="${choice.id}-h">` +
    `<h3 id="${choice.id}-h">${esc(choice.label)}</h3>` +
    figure +
    choice.text.map((t) => `<p>${esc(t)}</p>`).join('') +
    (links ? `<ul class="links">${links}</ul>` : '') +
    (choice.source
      ? `<p class="muted source">Quelle: <a href="${esc(choice.source.url)}" rel="noopener noreferrer">${esc(choice.source.label)}</a></p>`
      : '') +
    `<p><a class="back" href="#auswahl">Andere Auswahl</a></p></section>`
  );
}

const DARK = `--bg:#141619; --fg:#e8e6e1; --muted:#a4a9b0; --line:#3a3e44; --card:#1d2024;
  --accent:#86bce6; --paper:#f4f2ec; --ink:#2a2c30; --filler:#c9c6bf; --mark:#e8590c;`;

const STYLE = `
:root { --bg:#f7f6f2; --fg:#1d1f22; --muted:#5d636b; --line:#d9d6cf; --card:#ffffff;
  --accent:#1f5f8b; --paper:#ffffff; --ink:#1d1f22; --filler:#d4d1ca; --mark:#d9480f; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${DARK} } }
:root[data-theme="dark"] { ${DARK} }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg);
  font:17px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 44rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
h1 { font-size: 1.55rem; line-height: 1.25; margin: 0 0 .75rem; }
h2 { font-size: 1.2rem; margin: 2rem 0 .75rem; }
h3 { font-size: 1.15rem; margin: 0 0 .75rem; }
a { color: var(--accent); }
.muted { color: var(--muted); }
.tiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap:.75rem;
  padding:0; margin:0; list-style:none; }
.tiles a { display:block; height:100%; padding:1rem; border:1px solid var(--line); border-radius:10px;
  background:var(--card); color:var(--fg); text-decoration:none; font-weight:600; }
.tiles a:hover, .tiles a:focus-visible { border-color: var(--accent); outline: 2px solid var(--accent); }
.choice { display:none; margin-top:1.5rem; padding:1rem; border:1px solid var(--line);
  border-radius:12px; background:var(--card); }
.choice:target { display:block; }
figure { margin:0 0 1rem; }
.stage { overflow:hidden; border-radius:6px; border:1px solid var(--line); max-width:30rem; }
.stage svg { display:block; width:100%; height:auto; transform-origin: 0 0; }
.paper { fill: var(--paper); }
svg text { fill: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
svg .label { fill: var(--muted); }
svg .value { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; }
.filler { fill: var(--filler); }
/* Strokes keep their width on screen, whatever the size of the sheet or the zoom. */
.frame { fill: none; stroke: var(--filler); stroke-width: 1.5px; vector-effect: non-scaling-stroke; }
.watermark { fill: var(--mark); opacity: .12; font-weight: 800; letter-spacing: 2px; }
.mark { fill: none; stroke: var(--mark); stroke-width: 3.5px; vector-effect: non-scaling-stroke; }
.mark.trap { stroke-dasharray: 9 6; }
figcaption { display:flex; flex-direction:column; gap:.2rem; margin-top:.5rem; font-size:.92rem; }
.found { font-weight:700; color: var(--mark); }
.traps { border-left: 4px solid var(--mark); padding:.25rem 1rem; background: var(--card); }
.links { padding-left: 1.2rem; }
footer { margin-top: 3rem; font-size: .85rem; }
@media (prefers-reduced-motion: no-preference) {
  .choice:target .stage svg { animation: zoom 1.6s ease-in-out .6s both; }
  .choice:target .mark { animation: mark 1.2s ease-out 2.1s both; }
  .choice:target .found { animation: show .6s ease-out 2.4s both; }
}
@keyframes zoom { from { transform: none; } to { transform: translate(var(--tx), var(--ty)) scale(var(--s)); } }
@keyframes mark { 0% { opacity: 0; stroke-width: 10px; } 60% { opacity: 1; } 100% { opacity: 1; stroke-width: 3.5px; } }
@keyframes show { from { opacity: 0; } to { opacity: 1; } }
`;

function shell(title: string, body: string): string {
  return (
    `<!doctype html><html lang="de"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>\n`
  );
}

/** One help page as a self-contained HTML document. */
export function renderHelpPage(page: HelpPage, musters: readonly Muster[]): string {
  const byId = new Map(musters.map((m) => [m.id, m] as const));
  const tiles = page.choices.map((c) => `<li><a href="#${c.id}">${esc(c.label)}</a></li>`).join('');
  return shell(
    page.title,
    `<h1>${esc(page.title)}</h1>` +
      page.intro.map((t) => `<p>${esc(t)}</p>`).join('') +
      `<h2 id="auswahl">${esc(page.choicesTitle)}</h2><ul class="tiles">${tiles}</ul>` +
      page.choices.map((c) => choiceSection(c, byId)).join('') +
      (page.traps?.length
        ? `<h2>Nicht verwechseln</h2><div class="traps">${page.traps.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`
        : '') +
      `<footer class="muted"><p>Die Muster sind vereinfacht und enthalten nur erfundene Werte. ` +
      `Keine Rechts- oder Steuerberatung. Stand ${esc(page.stand.split('-').reverse().join('.'))}.</p></footer>`,
  );
}

/** Overview of all help pages (relative links, works from any folder). */
export function renderHelpIndex(pages: readonly HelpPage[]): string {
  const items = [...pages]
    .sort((a, b) => a.title.localeCompare(b.title, 'de'))
    .map((p) => `<li><a href="${p.path}/">${esc(p.title)}</a></li>`)
    .join('');
  return shell('Hilfe zum Fragebogen', `<h1>Hilfe zum Fragebogen</h1><ul>${items}</ul>`);
}
