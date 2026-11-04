// Testers of the hosted test folder (Tobias 2026-11-01: "wer kann testen", no PHP): managed on the
// Kanzlei PC, uploaded as an Apache .htpasswd. Only password hashes are kept (deploy/.local/,
// gitignored); a new password is shown once. CLI for deploy/tester.ps1:
//   node deploy/testers.ts liste | neu <name> | passwort <name> | sperren <name> | entsperren <name> | loeschen <name>
//   … --datei=deploy/.local/<list>.json   (the tester list of another protected folder)
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Tester {
  name: string;
  /** SHA-512-crypt ($6$), checked by Apache through crypt(3) on Linux. */
  hash: string;
  created: string;
  locked?: boolean;
}

const B64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
// Byte order of the final digest in the output (SHA-crypt.txt, step 22e for SHA-512).
const ORDER: readonly (readonly [number, number, number])[] = [
  [0, 21, 42],
  [22, 43, 1],
  [44, 2, 23],
  [3, 24, 45],
  [25, 46, 4],
  [47, 5, 26],
  [6, 27, 48],
  [28, 49, 7],
  [50, 8, 29],
  [9, 30, 51],
  [31, 52, 10],
  [53, 11, 32],
  [12, 33, 54],
  [34, 55, 13],
  [56, 14, 35],
  [15, 36, 57],
  [37, 58, 16],
  [59, 17, 38],
  [18, 39, 60],
  [40, 61, 19],
  [62, 20, 41],
];
export const DEFAULT_ROUNDS = 50_000;

const sha512 = (...parts: readonly Uint8Array[]) => {
  const hash = createHash('sha512');
  for (const part of parts) hash.update(part);
  return hash.digest();
};

/** `length` bytes of `block` repeated (steps 16 and 20). */
function stretch(block: Buffer, length: number): Buffer {
  const out = Buffer.alloc(length);
  for (let at = 0; at < length; at += block.length)
    block.copy(out, at, 0, Math.min(block.length, length - at));
  return out;
}

function b64(value: number, chars: number): string {
  let out = '';
  for (let i = 0; i < chars; i++, value >>>= 6) out += B64[value & 0x3f];
  return out;
}

/**
 * SHA-512-crypt after Ulrich Drepper's specification (https://www.akkadia.org/drepper/SHA-crypt.txt).
 * `rounds` undefined = the default 5000 without a "rounds=" field, as the specification writes it.
 */
export function sha512Crypt(password: string, saltText: string, rounds?: number): string {
  const key = Buffer.from(password, 'utf8');
  const salt = Buffer.from(saltText.slice(0, 16), 'utf8');
  const count = rounds === undefined ? 5000 : Math.min(999_999_999, Math.max(1000, rounds));
  const b = sha512(key, salt, key);
  const a = createHash('sha512').update(key).update(salt);
  let left = key.length;
  for (; left > 64; left -= 64) a.update(b);
  a.update(b.subarray(0, left));
  for (let bits = key.length; bits > 0; bits >>= 1) a.update(bits & 1 ? b : key);
  let c = a.digest();
  const p = stretch(sha512(...Array.from({ length: key.length }, () => key)), key.length);
  const firstByte = c[0] ?? 0;
  const s = stretch(sha512(...Array.from({ length: 16 + firstByte }, () => salt)), salt.length);
  for (let round = 0; round < count; round++) {
    const parts: Uint8Array[] = [round & 1 ? p : c];
    if (round % 3) parts.push(s);
    if (round % 7) parts.push(p);
    parts.push(round & 1 ? c : p);
    c = sha512(...parts);
  }
  const digest = c;
  const byte = (i: number) => digest[i] ?? 0;
  const text =
    ORDER.map(([x, y, z]) => b64((byte(x) << 16) | (byte(y) << 8) | byte(z), 4)).join('') +
    b64(byte(63), 2);
  const prefix = rounds === undefined ? '$6$' : `$6$rounds=${count}$`;
  return `${prefix}${salt.toString('utf8')}$${text}`;
}

/** Login names: what a tester types; Basic Auth forbids ":". */
export const TESTER_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{1,31}$/;

// Without 0/O, 1/l/I: read aloud or typed from a note without mistakes.
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Three groups of four, e.g. "k7mp-2qat-9fxe" (about 59 bits). */
export function newPassword(random: (n: number) => Uint8Array = randomBytes): string {
  const chars: string[] = [];
  while (chars.length < 12) {
    for (const value of random(16)) {
      // Rejection sampling keeps every character equally likely.
      if (value < 248 && chars.length < 12) chars.push(PASSWORD_ALPHABET[value % 31] ?? '');
    }
  }
  return [0, 4, 8].map((at) => chars.slice(at, at + 4).join('')).join('-');
}

export function newSalt(random: (n: number) => Uint8Array = randomBytes): string {
  return [...random(16)].map((value) => B64[value & 0x3f]).join('');
}

export function parseTesters(raw: unknown): Tester[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { name, hash, created, locked } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || typeof hash !== 'string' || typeof created !== 'string')
      return [];
    return [{ name, hash, created, ...(locked === true ? { locked: true } : {}) }];
  });
}

/** The .htpasswd: one "name:hash" line per tester who is not locked. */
export function htpasswd(testers: readonly Tester[]): string {
  return testers
    .filter((tester) => !tester.locked)
    .map((tester) => `${tester.name}:${tester.hash}\n`)
    .join('');
}

export const MIN_OWN_PASSWORD = 10;

/** Why a password chosen by hand cannot be used; undefined when it can. */
export function ownPasswordProblem(password: string): string | undefined {
  if (/[\r\n]/.test(password)) return 'Das Passwort darf keinen Zeilenumbruch enthalten.';
  if (password.trim() !== password)
    return 'Das Passwort darf nicht mit Leerzeichen beginnen oder enden.';
  if ([...password].length < MIN_OWN_PASSWORD) {
    return `Das Passwort braucht mindestens ${MIN_OWN_PASSWORD} Zeichen.`;
  }
  return undefined;
}

/**
 * The password as it arrives on stdin. Regression 2026-11-01: Windows PowerShell 5.1 sends a byte
 * order mark (U+FEFF) first and CRLF last, even with a UTF-8 encoding "without BOM" — the password
 * was refused as "beginning with a space".
 */
export function passwordFromStdin(text: string): string {
  return text.replace(/^\u{FEFF}/u, '').replace(/\r?\n$/, '');
}

export type Change =
  | { ok: true; testers: Tester[]; password?: string; message: string }
  | { ok: false; message: string };

/** One change of the tester list; `today` and the random source are injected for tests. */
export function changeTesters(
  testers: readonly Tester[],
  action: string,
  name: string,
  today: string,
  random: (n: number) => Uint8Array = randomBytes,
  /** A password typed by the Kanzlei; without one a new password is made (and shown once). */
  ownPassword?: string,
): Change {
  const known = testers.find((tester) => tester.name.toLowerCase() === name.toLowerCase());
  const others = testers.filter((tester) => tester !== known);
  const hashed = () => {
    const password = ownPassword ?? newPassword(random);
    return { password, hash: sha512Crypt(password, newSalt(random), DEFAULT_ROUNDS) };
  };
  const problem = ownPassword === undefined ? undefined : ownPasswordProblem(ownPassword);
  if (problem && (action === 'neu' || action === 'passwort'))
    return { ok: false, message: problem };
  // A password typed by hand is not shown again — the one who typed it knows it.
  const shown = (password: string) => (ownPassword === undefined ? { password } : {});
  switch (action) {
    case 'neu': {
      if (!TESTER_NAME.test(name)) {
        return {
          ok: false,
          message: `„${name}“: 2 bis 32 Zeichen, Buchstaben, Ziffern, Punkt, Binde- oder Unterstrich.`,
        };
      }
      if (known) return { ok: false, message: `„${known.name}“ gibt es schon.` };
      const { password, hash } = hashed();
      return {
        ok: true,
        testers: [...testers, { name, hash, created: today }],
        ...shown(password),
        message: `„${name}“ angelegt.`,
      };
    }
    case 'passwort': {
      if (!known) return { ok: false, message: `„${name}“ gibt es nicht.` };
      const { password, hash } = hashed();
      return {
        ok: true,
        testers: testers.map((tester) => (tester === known ? { ...tester, hash } : tester)),
        ...shown(password),
        message: `Neues Passwort für „${known.name}“.`,
      };
    }
    case 'sperren':
    case 'entsperren': {
      if (!known) return { ok: false, message: `„${name}“ gibt es nicht.` };
      const locked = action === 'sperren';
      return {
        ok: true,
        testers: testers.map((tester) => {
          if (tester !== known) return tester;
          const rest: Tester = { name: tester.name, hash: tester.hash, created: tester.created };
          return locked ? { ...rest, locked: true } : rest;
        }),
        message: locked ? `„${known.name}“ gesperrt.` : `„${known.name}“ wieder freigegeben.`,
      };
    }
    case 'loeschen':
      if (!known) return { ok: false, message: `„${name}“ gibt es nicht.` };
      return { ok: true, testers: others, message: `„${known.name}“ gelöscht.` };
    default:
      return { ok: false, message: `Unbekannte Aktion „${action}“.` };
  }
}

export const TESTERS_FILE = 'deploy/.local/tester.json';

/**
 * The tester list a command works on: "--datei=deploy/.local/<list>.json" (the list of another
 * protected folder, see "testers" in the upload targets) or the test folder's own.
 */
export function testersFileOf(args: readonly string[]): string | undefined {
  const given = args.find((arg) => arg.startsWith('--datei='))?.slice('--datei='.length);
  if (given === undefined) return TESTERS_FILE;
  return /^deploy\/\.local\/[A-Za-z0-9._-]+\.json$/.test(given) ? given : undefined;
}

function cli(args: readonly string[]): unknown {
  // "--passwort-stdin": the password typed in the window comes on stdin, never on a command line.
  const own = args.includes('--passwort-stdin')
    ? passwordFromStdin(readFileSync(0, 'utf8'))
    : undefined;
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const file = testersFileOf(args);
  if (!file) return { ok: false, message: '--datei=deploy/.local/<Name>.json' };
  const path = join(root, file);
  const testers = existsSync(path) ? parseTesters(JSON.parse(readFileSync(path, 'utf8'))) : [];
  const [action = 'liste', name = ''] = args.filter(
    (arg) => arg !== '--passwort-stdin' && !arg.startsWith('--datei='),
  );
  const list = (all: readonly Tester[]) =>
    all.map(({ name: n, created, locked }) => ({ name: n, created, locked: locked === true }));
  if (action === 'liste') return { ok: true, testers: list(testers) };
  const change = changeTesters(
    testers,
    action,
    name,
    new Date().toISOString().slice(0, 10),
    randomBytes,
    own,
  );
  if (!change.ok) return change;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(change.testers, null, 2)}\n`);
  return { ...change, testers: list(change.testers) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(cli(process.argv.slice(2)))}\n`);
}
