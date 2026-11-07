// deploy/.htaccess (Tobias 2026-10-31): headers for the hosted copy. Guards the parts that matter and
// keeps build-specific hashes out of it — the script/style policy lives in the meta tag of each build.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HTACCESS = readFileSync(new URL('../../deploy/.htaccess', import.meta.url), 'utf8');
const directives = HTACCESS.split('\n').filter((line) => !line.trim().startsWith('#'));
const active = directives.join('\n');

// The script block (2026-11-07): no PHP or other script may run anywhere on the subdomain.
const SCRIPT_BLOCK = /<FilesMatch "\(\?i\)([^"]+)">\s*Require all denied\s*<\/FilesMatch>/;
const SCRIPTS = ['x.php', 'x.PHP', 'x.php8', 'x.phtml', 'x.phar', 'x.phps', 'x.pht', 'x.php.txt'];
const OTHER_SCRIPTS = ['x.cgi', 'x.pl', 'x.py', 'x.sh', 'x.shtml'];
const helpFiles = readdirSync(fileURLToPath(new URL('../../docs/hilfe/', import.meta.url)), {
  recursive: true,
}).map(String);

describe('deploy/.htaccess', () => {
  it('forbids embedding, forces HTTPS and sends the protective headers', () => {
    for (const expected of [
      "frame-ancestors 'none'",
      'X-Frame-Options "DENY"',
      'Strict-Transport-Security',
      'X-Content-Type-Options "nosniff"',
      'Referrer-Policy "no-referrer"',
      'Permissions-Policy',
      'Cache-Control "no-cache"',
      'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      'Options -Indexes',
    ]) {
      expect(active).toContain(expected);
    }
  });

  it('restricts no visitor and holds nothing that changes with a build', () => {
    // "Require all denied" only guards hidden files; no login, no address filter for the app.
    expect(active).not.toMatch(/AuthType|Require ip|Require valid-user/);
    expect(active).not.toMatch(/script-src|style-src|sha256-/);
  });

  it('refuses every script file on the whole subdomain, in any case and before a further ending', () => {
    const source = SCRIPT_BLOCK.exec(active)?.[1];
    expect(source).toBeDefined();
    // Apache reads "(?i)" inline; JavaScript takes the same pattern with the "i" flag.
    const pattern = new RegExp(source ?? '$^', 'i');
    for (const name of [...SCRIPTS, ...OTHER_SCRIPTS]) expect(pattern.test(name), name).toBe(true);
  });

  it('never refuses a file the subdomain serves', () => {
    const pattern = new RegExp(SCRIPT_BLOCK.exec(active)?.[1] ?? '$^', 'i');
    expect(helpFiles.length).toBeGreaterThan(0);
    for (const name of ['index.html', ...helpFiles, 'x.plist', 'x.phpx', 'shop.html']) {
      expect(pattern.test(name.split(/[\\/]/).at(-1) ?? name), name).toBe(false);
    }
  });

  it('uses LF line endings like every text file of the repo', () => {
    expect(HTACCESS).not.toContain('\r');
  });
});
