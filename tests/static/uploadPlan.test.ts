// SFTP upload (Tobias 2026-11-01): the plan decides which files leave the PC, before any connection.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  mappingMarkers,
  parseUploadSpec,
  planUpload,
  psftpBatch,
  type UploadSpec,
} from '../../deploy/uploadPlan';

const ROOT = join(__dirname, '..', '..');
const text = (path: string) => readFileSync(join(ROOT, path), 'utf8');

function spec(raw: unknown): UploadSpec {
  const parsed = parseUploadSpec(raw);
  if (!parsed.ok) throw new Error(parsed.problems.join(' '));
  return parsed.spec;
}

const files = (entries: Record<string, string>) => (path: string) =>
  path in entries ? new TextEncoder().encode(entries[path]) : undefined;

const SPEC = spec({
  targets: {
    oeffentlich: {
      description: 'App',
      build: 'build',
      files: [
        { from: 'dist/index.html', to: 'index.html', verify: true },
        { from: 'deploy/.htaccess', to: '.htaccess' },
      ],
    },
    falsch: {
      description: 'Kanzlei',
      files: [{ from: 'dist-kanzlei/index.html', to: 'index.html' }],
    },
  },
  forbidden: ['dist-kanzlei/', 'config/'],
});

describe('deploy/upload.json', () => {
  it('uploads only the public app and the .htaccess', () => {
    const committed = spec(JSON.parse(text('deploy/upload.json')));
    expect(committed.targets.oeffentlich?.files.map((f) => [f.from, f.to])).toEqual([
      ['dist/index.html', 'index.html'],
      ['deploy/.htaccess', '.htaccess'],
    ]);
    expect(committed.forbidden).toEqual(
      expect.arrayContaining(['dist-kanzlei/', 'dist-preview/', 'config/', 'deploy/.local/']),
    );
  });

  it('keeps the local credentials out of git', () => {
    expect(text('.gitignore')).toMatch(/^deploy\/\.local\/$/m);
  });
});

describe('planUpload', () => {
  const both = files({ 'dist/index.html': '<html>App</html>', 'deploy/.htaccess': 'Header' });

  it('lists every file with its size and SHA-256', () => {
    const plan = planUpload(SPEC, 'oeffentlich', both, []);
    expect(plan).toMatchObject({ ok: true, build: 'build' });
    expect(plan.ok && plan.files[0]).toEqual({
      from: 'dist/index.html',
      to: 'index.html',
      verify: true,
      bytes: 16,
      sha256: createHash('sha256').update('<html>App</html>').digest('hex'),
    });
  });

  it.each<[string, string, (path: string) => Uint8Array | undefined, string[], string]>([
    ['an unknown target', 'test', both, [], 'Unbekanntes Ziel „test“'],
    [
      'a forbidden source',
      'falsch',
      both,
      [],
      '„dist-kanzlei/index.html“ darf nie hochgeladen werden',
    ],
    [
      'a file not built yet',
      'oeffentlich',
      files({ 'deploy/.htaccess': 'x' }),
      [],
      '„dist/index.html“ fehlt – erst bauen (npm run build)',
    ],
    [
      'a page with the payroll mapping',
      'oeffentlich',
      files({ 'dist/index.html': 'x Personal|Name y', 'deploy/.htaccess': 'x' }),
      ['Personal|Name'],
      'enthält die Zuordnung zum Lohnprogramm',
    ],
  ])('refuses %s', (_label, target, read, markers, message) => {
    const plan = planUpload(SPEC, target, read, markers);
    expect(plan.ok ? [] : plan.problems.join(' ')).toContain(message);
  });

  it('reads the masks of a local mapping', () => {
    expect(mappingMarkers([{ records: [{ mask: 'A|B' }, { mask: 'C|D' }] }, {}])).toEqual([
      'A|B',
      'C|D',
    ]);
    expect(mappingMarkers(undefined)).toEqual([]);
  });
});

describe('parseUploadSpec', () => {
  it.each([
    ['a path leaving the folder', '../geheim.txt'],
    ['an absolute path', '/etc/passwd'],
    ['a quote', 'a"b'],
    ['a backslash', 'dist\\index.html'],
  ])('refuses %s', (_label, path) => {
    const parsed = parseUploadSpec({
      targets: { t: { description: 'x', files: [{ from: path, to: 'index.html' }] } },
      forbidden: [],
    });
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain('kein erlaubter relativer Pfad');
  });
});

describe('psftpBatch', () => {
  it('changes to the folder and puts every file', () => {
    expect(
      psftpBatch('C:/repo', '/fragebogen', [{ from: 'dist/index.html', to: 'index.html' }]),
    ).toBe(`cd "/fragebogen"\nput "${join('C:/repo', 'dist/index.html')}" "index.html"\n`);
    expect(psftpBatch('C:/repo', '', [])).toBe('\n');
  });

  it('refuses a folder name that would break the batch', () => {
    expect(() => psftpBatch('C:/repo', 'a"\nrm *', [])).toThrow();
  });
});

describe('deploy/upload.ps1', () => {
  const raw = readFileSync(join(ROOT, 'deploy/upload.ps1'));
  const script = raw.toString('utf8');

  // Windows PowerShell 5.1 reads a script without BOM as ANSI: the German texts would break.
  it('is UTF-8 with BOM', () => {
    expect([...raw.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  // Regression 2026-11-01: „…“ inside a double-quoted string ended it (PowerShell reads them as quotes).
  it.runIf(process.platform === 'win32')('parses without errors in Windows PowerShell', () => {
    const parse =
      '$e=$null;$t=$null;[void][System.Management.Automation.Language.Parser]::ParseFile(' +
      '$env:UPLOAD_PS1,[ref]$t,[ref]$e);$e|ForEach-Object{"$($_.Extent.StartLineNumber): $($_.Message)"}';
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', parse],
      {
        env: { ...process.env, UPLOAD_PS1: join(ROOT, 'deploy/upload.ps1') },
        encoding: 'utf8',
      },
    );
    expect(out.trim()).toBe('');
  });

  it('never puts the password on a command line and pins the host key', () => {
    expect(script).toContain('-pwfile');
    expect(script).not.toMatch(/['"\s]-pw['"\s]/);
    expect(script).toContain('-hostkey');
    expect(script).toContain('ConvertTo-SecureString');
  });
});
