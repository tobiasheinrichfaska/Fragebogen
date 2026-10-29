import { readFileSync } from 'node:fs';

// The app must never load anything from the network. This guards the source entry point;
// the built single file gets the same check (plus CSP) in step 10.
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

describe('index.html', () => {
  it('references no external URLs', () => {
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/(?:src|href)\s*=\s*["']\/\//i);
  });

  it('loads no external stylesheets or fonts', () => {
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/@import/i);
  });

  it('declares German and a data: favicon so no /favicon.ico request happens', () => {
    expect(html).toMatch(/<html lang="de">/);
    expect(html).toMatch(/<link rel="icon" href="data:,"/);
  });
});
