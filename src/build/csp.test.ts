// The CSP step of the build: hashes of exactly the inlined script and style, inserted before them;
// pages that load anything from outside are refused.
import { createHash } from 'node:crypto';
import { cspFor, withCsp } from './csp';

const hash = (text: string) =>
  `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const page = (head: string) =>
  `<!doctype html>\n<html lang="de">\n  <head>\n    <meta charset="UTF-8" />\n${head}\n  </head>\n  <body></body>\n</html>`;

describe('withCsp', () => {
  it('allows exactly the inlined script and style by their hashes', () => {
    const script = 'console.log("ä")\n';
    const style = ':root{color:red}';
    const html = withCsp(
      page(`<script type="module" crossorigin>${script}</script><style>${style}</style>`),
    );
    expect(html).toContain(
      `<meta http-equiv="Content-Security-Policy" content="${cspFor([hash(script)], [hash(style)])}" />`,
    );
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script'));
  });

  it('forbids network, eval, workers, plugins, base and form targets', () => {
    const policy = cspFor(["'sha256-a'"], ["'sha256-b'"]);
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("connect-src 'none'");
    expect(policy).toContain("worker-src 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'none'");
    expect(policy).not.toMatch(/unsafe-eval|unsafe-inline|https?:/);
  });

  it.each([
    ['an external script', '<script src="https://example.org/x.js"></script>'],
    ['an external stylesheet', '<link rel="stylesheet" href="x.css" /><script>1</script>'],
    [
      'an existing policy',
      '<meta http-equiv="Content-Security-Policy" content="x" /><script>1</script>',
    ],
    ['no inline script', '<style>a{}</style>'],
  ])('refuses a page with %s', (_name, head) => {
    expect(() => withCsp(page(head))).toThrow();
  });
});
