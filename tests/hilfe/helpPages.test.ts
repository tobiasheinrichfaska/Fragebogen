// Help pages "Wo finde ich …?" (Tobias 2026-10-31): strict data, references, the rendered page loads
// nothing, runs no script, marks the spot, falls back to a still picture for reduced motion, and every
// Muster carries the watermark. Fictitious example.
import example from '../fixtures/hilfe/beispiel.json';
import { musterSvg, renderHelpIndex, renderHelpPage } from '../../src/build/helpPage';
import {
  checkHelpPages,
  parseHelpPage,
  parseMuster,
  type HelpPage,
  type Muster,
} from '../../src/logic/helpPages';

function load(): { musters: Muster[]; pages: HelpPage[] } {
  const raw = structuredClone(example);
  const musters = raw.musters.map((m) => {
    const parsed = parseMuster(m);
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
    return parsed.value;
  });
  const pages = raw.pages.map((p) => {
    const parsed = parseHelpPage(p);
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
    return parsed.value;
  });
  return { musters, pages };
}

describe('help page data', () => {
  it('decodes the example and finds every reference', () => {
    const { musters, pages } = load();
    expect(checkHelpPages(pages, musters)).toEqual([]);
  });

  it('refuses unknown keys, a field without value, http links and a lone target', () => {
    const muster = parseMuster({
      ...example.musters[0],
      items: [{ kind: 'field', id: 'x', x: 1, y: 1, w: 5, h: 5, text: 'A', extra: 1 }],
    });
    expect(muster.ok ? [] : muster.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining(['unknown property', 'a field needs value']),
    );
    const page = parseHelpPage({
      ...example.pages[0],
      choices: [
        { id: 'a', label: 'A', target: 'kundennummer', text: ['x'] },
        { id: 'b', label: 'B', text: ['x'], links: [{ label: 'L', url: 'http://example.org' }] },
      ],
    });
    expect(page.ok ? [] : page.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining(['muster and target go together', expect.stringContaining('https')]),
    );
  });

  it('names unknown Muster and fields, items off the page and duplicates', () => {
    const { musters, pages } = load();
    const [muster] = musters;
    const [page] = pages;
    if (!muster || !page) throw new Error('example');
    const off: Muster = {
      ...muster,
      items: [...muster.items, { kind: 'box', x: 200, y: 1, w: 20, h: 5 }],
    };
    const broken: HelpPage = {
      ...page,
      choices: [
        ...page.choices,
        { id: 'c', label: 'C', muster: 'gibtsNicht', target: 'x', text: ['x'] },
        { id: 'd', label: 'D', muster: 'beispielschreiben', target: 'aktennummer', text: ['x'] },
        { id: 'nichts', label: 'Nochmal', text: ['x'] },
      ],
    };
    expect(checkHelpPages([broken, broken], [off])).toEqual([
      'beispielschreiben: item 6 leaves the page',
      'beispiel-nummer/c: unknown Muster "gibtsNicht"',
      'beispiel-nummer/d: "beispielschreiben" has no field "aktennummer"',
      'beispiel-nummer: choice "nichts" twice',
      'page "beispiel-nummer" twice',
      'beispiel-nummer/c: unknown Muster "gibtsNicht"',
      'beispiel-nummer/d: "beispielschreiben" has no field "aktennummer"',
      'beispiel-nummer: choice "nichts" twice',
    ]);
  });
});

describe('rendered help page', () => {
  const { musters, pages } = load();
  const [page] = pages;
  if (!page) throw new Error('example');
  const html = renderHelpPage(page, musters);

  it('is one German document without script and without external resources', () => {
    expect(html.startsWith('<!doctype html><html lang="de">')).toBe(true);
    expect(html).not.toMatch(/<script|<link|<img|<iframe|@import|url\(/i);
    // The only addresses are the links of the content.
    expect([...html.matchAll(/https?:\/\/[^"<\s]+/g)].map((m) => m[0])).toEqual([
      'https://www.example.org/quelle',
      'https://www.example.org/anfordern',
    ]);
  });

  it('offers every choice as a tile and shows it with :target', () => {
    expect(html).toContain('<a href="#schreiben">Beispielschreiben</a>');
    expect(html).toContain('<section class="choice" id="schreiben"');
    expect(html).toContain('.choice:target { display:block; }');
    expect(html).toContain('<a class="back" href="#auswahl">Andere Auswahl</a>');
  });

  it('marks the field, zooms to it, and keeps a still picture for reduced motion', () => {
    expect(html).toContain('<rect class="mark" x="118" y="36" width="74" height="16" rx="1.5"/>');
    expect(html).toContain('style="--tx:-60.0%;--ty:0.0%;--s:1.60"');
    expect(html).toContain('Hier: Kundennummer');
    expect(html).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{[^}]*animation: zoom/);
  });

  it('puts the watermark on every Muster and says the values are invented', () => {
    const [muster] = musters;
    if (!muster) throw new Error('example');
    expect(musterSvg(muster)).toContain('>MUSTER</text>');
    expect(html).toContain('alle Werte erfunden');
    expect(html).toContain('Stand 31.10.2026');
  });

  it('escapes text and lists every page on the overview', () => {
    const odd = { ...page, title: 'A <b> & "B"' };
    expect(renderHelpPage(odd, musters)).toContain('<h1>A &lt;b&gt; &amp; &quot;B&quot;</h1>');
    expect(renderHelpIndex(pages)).toContain(
      '<a href="beispiel-nummer/">Wo finde ich meine Beispielnummer?</a>',
    );
  });
});
