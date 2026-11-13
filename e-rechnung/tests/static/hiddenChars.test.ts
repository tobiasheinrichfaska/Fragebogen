import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Invisible characters in source code are bugs waiting to happen (an editing tool once turned
// byte-order-mark escapes into the real character). Code must spell them as char codes.
const INVISIBLE = [0x00ad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0xfeff, 0xffef];
const pattern = new RegExp(`[${INVISIBLE.map((c) => String.fromCharCode(c)).join('')}]`);

const ROOT = new URL('../../', import.meta.url);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'fixtures' ? [] : files(path);
    return /\.(ts|tsx|js|css|html|md|json)$/.test(name) ? [path] : [];
  });
}

describe('source files', () => {
  it('contain no invisible characters', () => {
    const root = new URL('.', ROOT).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const found = ['src', 'tests', 'docs', 'manual_tests']
      .flatMap((dir) => files(join(root, dir)))
      .filter((path) => pattern.test(readFileSync(path, 'utf8')));
    expect(found).toEqual([]);
  });
});
