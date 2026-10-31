// deploy/.htaccess (Tobias 2026-10-31): headers for the hosted copy. Guards the parts that matter and
// keeps build-specific hashes out of it — the script/style policy lives in the meta tag of each build.
import { readFileSync } from 'node:fs';

const HTACCESS = readFileSync(new URL('../../deploy/.htaccess', import.meta.url), 'utf8');
const directives = HTACCESS.split('\n').filter((line) => !line.trim().startsWith('#'));
const active = directives.join('\n');

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

  it('uses LF line endings like every text file of the repo', () => {
    expect(HTACCESS).not.toContain('\r');
  });
});
