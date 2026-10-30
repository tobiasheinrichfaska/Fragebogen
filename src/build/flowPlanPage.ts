// Renders the flow plans (src/logic/flowPlan.ts) of all forms as one self-contained German HTML
// page, docs/ablaufplan.html — offline, no scripts, no external resources. Kept in sync with the
// definitions by tests/forms/flowPlan.test.ts (`npm run catalogue` rewrites it).
import type { FlowPlan, FlowStation, FlowStep } from '../logic/flowPlan';

export interface FlowPlanEntry {
  plan: FlowPlan;
  /** e.g. "Entwurf zur fachlichen Freigabe". */
  status: string;
}

const DARK = `--bg:#16181b; --fg:#e7e5e0; --muted:#a3a8ae; --line:#3a3e44; --card:#1f2226;
  --accent:#7fb6dd; --decision:#3a3018; --decision-line:#c99a2e; --why:#1d2a1c; --why-line:#7bb26c;
  --taken:#2a2338; --taken-line:#a58ae0;`;

const STYLE = `
:root { --bg:#fbfaf7; --fg:#1d1f22; --muted:#5d636b; --line:#d9d6cf; --card:#ffffff;
  --accent:#1f5f8b; --decision:#fff4d6; --decision-line:#d9a520; --why:#eef5ec; --why-line:#5a8f4e;
  --taken:#efe9fb; --taken-line:#6a4fb3; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${DARK} } }
:root[data-theme="dark"] { ${DARK} }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg);
  font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 60rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
h1 { font-size: 1.6rem; margin: 0 0 .5rem; }
h2 { font-size: 1.35rem; margin: 3rem 0 .25rem; padding-top: 1rem; border-top: 2px solid var(--line); }
h3 { font-size: 1.15rem; margin: 2rem 0 .25rem; }
h4 { font-size: 1rem; margin: 1.25rem 0 .5rem; color: var(--muted); text-transform: uppercase;
  letter-spacing: .03em; }
p, li { overflow-wrap: anywhere; }
.muted { color: var(--muted); }
.legend { display:flex; flex-wrap:wrap; gap:.5rem 1rem; padding:0; list-style:none; }
.legend li { display:flex; align-items:center; gap:.4rem; }
.swatch { width:1rem; height:1rem; border-radius:3px; border-left:4px solid; display:inline-block; }
.order { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: .5rem 1rem; }
.station { background: var(--card); border: 1px solid var(--line); border-radius: 8px;
  padding: .25rem 1rem 1rem; margin-top: 1rem; }
.flow { list-style: none; margin: 0; padding: 0; }
.step { border-left: 3px solid var(--line); margin: 0 0 .4rem; padding: .35rem .6rem; }
.step.decision { background: var(--decision); border-left-color: var(--decision-line); }
.step.level-1 { margin-left: 1.5rem; } .step.level-2 { margin-left: 3rem; }
.step.level-3, .step.level-4, .step.level-5 { margin-left: 4.5rem; }
.num { display:inline-block; min-width:2.2rem; font-weight:600; color: var(--accent); }
.q { font-weight: 600; }
.meta { font-size: .9rem; color: var(--muted); }
.when, .why, .taken, .opens { font-size: .9rem; margin-top: .2rem; }
.why { background: var(--why); border-left: 3px solid var(--why-line); padding: .2rem .5rem; }
.taken { background: var(--taken); border-left: 3px solid var(--taken-line); padding: .2rem .5rem; }
.opens { font-weight: 500; }
code { font-size: .85em; overflow-wrap: anywhere; }
@media (max-width: 40rem) { .step.level-1 { margin-left: .75rem; } .step.level-2 { margin-left: 1.5rem; }
  .step.level-3, .step.level-4, .step.level-5 { margin-left: 2.25rem; } }
`;

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numbers(list: readonly number[]): string {
  return list.map((n) => `Nr. ${n}`).join(', ');
}

function stepHtml(step: FlowStep): string {
  const decision = step.opens.length > 0;
  const lines = [
    `<li class="step level-${Math.min(step.level, 5)}${decision ? ' decision' : ''}">`,
    `<span class="num">${step.number}</span> <span class="q">${esc(step.question)}</span>`,
    `<div class="meta">${esc(step.label)} · ${esc(step.kind)} · ${esc(step.requirement)}</div>`,
  ];
  if (step.when) {
    const refs = step.dependsOn.length > 0 ? ` (hängt ab von ${numbers(step.dependsOn)})` : '';
    lines.push(`<div class="when">Gefragt ${esc(step.when)}${refs}.</div>`);
  } else if (step.dependsOn.length > 0) {
    lines.push(`<div class="when">Pflicht hängt ab von ${numbers(step.dependsOn)}.</div>`);
  }
  if (step.fromRole) {
    lines.push(
      `<div class="taken">Legt die andere Station fest (${esc(step.fromRole)}): Liegt ihr ` +
        'abgeschlossener Teil schon vor, wird die Angabe übernommen und nicht gefragt.</div>',
    );
  }
  if (step.because) lines.push(`<div class="why">Warum: ${esc(step.because)}</div>`);
  if (decision)
    lines.push(`<div class="opens">Weiche: davon hängen ${numbers(step.opens)} ab.</div>`);
  lines.push('</li>');
  return lines.join('');
}

function stationHtml(station: FlowStation, anchor: string): string {
  const parts = [
    `<section class="station" id="${anchor}">`,
    `<h3>Station: ${esc(station.role.label)}</h3>`,
    `<p class="meta">Wird gebraucht: ${esc(station.needed)} · ${esc(station.signature)}</p>`,
  ];
  if (station.because) parts.push(`<p class="why">Warum: ${esc(station.because)}</p>`);
  if (station.notices.length > 0) {
    parts.push(
      `<p>Zuerst die Hinweise: ${station.notices.map((title) => `„${esc(title)}“`).join(', ')}.</p>`,
    );
  }
  if (station.sections.length === 0) {
    parts.push(
      '<p class="muted">Keine eigenen Fragen: Diese Station bestätigt und unterschreibt.</p>',
    );
  }
  for (const section of station.sections) {
    parts.push(`<h4>${esc(section.title)}</h4>`, '<ol class="flow">');
    parts.push(...section.steps.map(stepHtml));
    parts.push('</ol>');
  }
  parts.push(
    '<p class="muted">Danach: Zusammenfassung mit „ändern“, dann Abschluss.</p>',
    '</section>',
  );
  return parts.join('\n');
}

function planHtml({ plan, status }: FlowPlanEntry): string {
  const anchor = `${plan.id}-${plan.version}`;
  return [
    `<h2 id="${anchor}">${esc(plan.title)} <span class="muted">${esc(plan.version)}</span></h2>`,
    `<p class="meta">${esc(status)} · Definition <code>${plan.definitionHash}</code></p>`,
    '<div class="order"><h3>Reihenfolge der Stationen</h3><ul>',
    ...plan.order.map((note) => `<li>${esc(note)}</li>`),
    '</ul></div>',
    ...plan.stations.map((station) => stationHtml(station, `${anchor}-${station.role.id}`)),
  ].join('\n');
}

export function flowPlanPage(entries: readonly FlowPlanEntry[]): string {
  const toc = entries
    .map(
      ({ plan, status }) =>
        `<li><a href="#${plan.id}-${plan.version}">${esc(plan.title)} ${esc(plan.version)}</a> ` +
        `<span class="muted">– ${esc(status)}</span></li>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ablaufpläne der Fragebögen</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>Ablaufpläne der Fragebögen</h1>
<p class="muted">Aus den Formulardefinitionen erzeugt (<code>npm run catalogue</code>); nicht von Hand ändern.
Je Station die Fragen in der Reihenfolge des Interviews. Eine Frage erscheint nur, wenn ihre
Voraussetzung erfüllt ist; fällt sie später weg, bleibt die Antwort bis zur Unterschrift erhalten,
wird aber nicht mit unterschrieben.</p>
<ul class="legend">
<li><span class="swatch" style="background:var(--decision);border-color:var(--decision-line)"></span>Weiche: davon hängen andere Fragen ab</li>
<li><span class="swatch" style="background:var(--why);border-color:var(--why-line)"></span>Warum die Bedingung gilt</li>
<li><span class="swatch" style="background:var(--taken);border-color:var(--taken-line)"></span>Legt eine andere Station fest</li>
</ul>
<ol>
${toc}
</ol>
${entries.map(planHtml).join('\n')}
</main>
</body>
</html>
`;
}
