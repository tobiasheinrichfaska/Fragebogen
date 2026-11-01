// SFTP upload (Tobias 2026-11-01): the plan decides which files leave the PC, before any connection.
// Folders: the public app for everyone, the test folder from the Kanzlei's IPs (a tester login
// follows), the Kanzlei app from the Kanzlei's IPs only — the only place for the payroll mapping.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  accessRules,
  isIpAddress,
  mappingMarkers,
  parseUploadSpec,
  planUpload,
  prepareBatch,
  psftpBatch,
  type UploadSpec,
} from '../../deploy/uploadPlan';

const ROOT = join(__dirname, '..', '..');
const text = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const IPS = ['203.0.113.7', '2001:db8::/48'];

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
      folder: '',
      access: 'public',
      files: [
        { from: 'dist/index.html', to: 'index.html', verify: true },
        { from: 'deploy/.htaccess', to: '.htaccess' },
      ],
    },
    kanzlei: {
      description: 'Kanzlei',
      folder: 'kanzlei',
      access: 'ip',
      allowMapping: true,
      files: [{ from: 'dist-kanzlei/index.html', to: 'index.html' }],
    },
    test: {
      description: 'Test',
      folder: 'test',
      access: 'ipOrLogin',
      files: [{ from: 'dist-test/index.html', to: 'index.html' }],
    },
    falsch: {
      description: 'Vorschau',
      folder: 'x',
      access: 'ip',
      files: [{ from: 'dist-preview/index.html', to: 'index.html' }],
    },
  },
  forbidden: ['dist-preview/', 'config/'],
});

describe('deploy/upload.json', () => {
  const committed = spec(JSON.parse(text('deploy/upload.json')));

  it('puts the public app with its .htaccess in the subdomain folder, for everyone', () => {
    expect(committed.targets.oeffentlich).toMatchObject({ folder: '', access: 'public' });
    expect(committed.targets.oeffentlich?.files.map((f) => [f.from, f.to])).toEqual([
      ['dist/index.html', 'index.html'],
      ['deploy/.htaccess', '.htaccess'],
    ]);
  });

  it('keeps the payroll mapping to the Kanzlei folder, reachable from the Kanzlei IPs only', () => {
    const withMapping = Object.entries(committed.targets).filter(([, t]) => t.allowMapping);
    expect(withMapping.map(([name, t]) => [name, t.folder, t.access])).toEqual([
      ['kanzlei', 'kanzlei', 'ip'],
    ]);
    expect(committed.targets.test).toMatchObject({ folder: 'test', access: 'ipOrLogin' });
    expect(committed.targets.test?.files[0]?.from).toBe('dist-test/index.html');
    expect(committed.forbidden).toEqual(
      expect.arrayContaining(['dist-preview/', 'config/', 'deploy/.local/']),
    );
  });

  it('keeps the local credentials and generated files out of git', () => {
    expect(text('.gitignore')).toMatch(/^deploy\/\.local\/$/m);
    expect(text('.gitignore')).toMatch(/^dist-test\/$/m);
  });
});

describe('planUpload', () => {
  const both = files({ 'dist/index.html': '<html>App</html>', 'deploy/.htaccess': 'Header' });

  it('lists every file with its size and SHA-256; the public folder gets no access rules', () => {
    const plan = planUpload(SPEC, 'oeffentlich', both, []);
    expect(plan).toMatchObject({ ok: true, build: 'build', folder: '', generated: [] });
    expect(plan.ok && plan.files[0]).toEqual({
      from: 'dist/index.html',
      to: 'index.html',
      verify: true,
      bytes: 16,
      sha256: createHash('sha256').update('<html>App</html>').digest('hex'),
    });
  });

  it('lets the Kanzlei app with the mapping into its IP-protected folder, with the rules', () => {
    const plan = planUpload(
      SPEC,
      'kanzlei',
      files({ 'dist-kanzlei/index.html': 'x Personal|Name y' }),
      ['Personal|Name'],
      IPS,
    );
    expect(plan.ok && plan.generated).toEqual([
      { to: '.htaccess', content: accessRules('ip', IPS) },
    ]);
    expect(accessRules('ip', IPS)).toContain('Require ip 203.0.113.7 2001:db8::/48\n');
  });

  it('protects the test folder by IP until the tester login exists, and says so', () => {
    const plan = planUpload(SPEC, 'test', files({ 'dist-test/index.html': 'App' }), [], IPS);
    expect(plan).toMatchObject({ ok: true, folder: 'test', access: 'ipOrLogin' });
    expect(plan.ok && plan.generated[0]?.content).toContain('Require ip 203.0.113.7');
    expect(plan.ok && plan.notes.join(' ')).toContain('bis dahin nur eure IPs');
  });

  it.each<[string, string, (path: string) => Uint8Array | undefined, string[], string[], string]>([
    ['an unknown target', 'gibtEsNicht', both, [], [], 'Unbekanntes Ziel „gibtEsNicht“'],
    [
      'a forbidden source',
      'falsch',
      files({ 'dist-preview/index.html': 'x' }),
      [],
      IPS,
      '„dist-preview/index.html“ darf nie hochgeladen werden',
    ],
    [
      'a file not built yet',
      'oeffentlich',
      files({ 'deploy/.htaccess': 'x' }),
      [],
      [],
      '„dist/index.html“ fehlt – erst bauen (npm run build)',
    ],
    [
      'the mapping in the public folder',
      'oeffentlich',
      files({ 'dist/index.html': 'x Personal|Name y', 'deploy/.htaccess': 'x' }),
      ['Personal|Name'],
      [],
      'enthält die Zuordnung zum Lohnprogramm',
    ],
    [
      'the mapping in the test folder',
      'test',
      files({ 'dist-test/index.html': 'x Personal|Name y' }),
      ['Personal|Name'],
      IPS,
      'enthält die Zuordnung zum Lohnprogramm',
    ],
    [
      'a protected folder without the Kanzlei IPs',
      'kanzlei',
      files({ 'dist-kanzlei/index.html': 'x' }),
      [],
      [],
      'fehlen die IP-Adressen der Kanzlei',
    ],
    [
      'a wrong IP address',
      'kanzlei',
      files({ 'dist-kanzlei/index.html': 'x' }),
      [],
      ['203.0.113'],
      '„203.0.113“ ist keine IP-Adresse',
    ],
  ])('refuses %s', (_label, target, read, markers, ips, message) => {
    const plan = planUpload(SPEC, target, read, markers, ips);
    expect(plan.ok ? [] : plan.problems.join(' ')).toContain(message);
  });

  it('reads the masks of a local mapping', () => {
    expect(mappingMarkers([{ records: [{ mask: 'A|B' }, { mask: 'C|D' }] }, {}])).toEqual([
      'A|B',
      'C|D',
    ]);
    expect(mappingMarkers(undefined)).toEqual([]);
  });

  it.each([
    ['203.0.113.7', true],
    ['10.0.0.0/8', true],
    ['2001:db8::1', true],
    ['2001:db8::/48', true],
    ['256.1.1.1', false],
    ['203.0.113', false],
    ['10.0.0.0/33', false],
    ['localhost', false],
    ['1.2.3.4 Require all granted', false],
  ])('knows an IP address: %s → %s', (candidate, valid) => {
    expect(isIpAddress(candidate)).toBe(valid);
  });
});

describe('parseUploadSpec', () => {
  const target = (extra: Record<string, unknown>) => ({
    targets: {
      t: {
        description: 'x',
        folder: 'x',
        access: 'ip',
        files: [{ from: 'dist/index.html', to: 'index.html' }],
        ...extra,
      },
    },
    forbidden: [],
  });

  it.each([
    ['a path leaving the folder', '../geheim.txt'],
    ['an absolute path', '/etc/passwd'],
    ['a quote', 'a"b'],
    ['a backslash', 'dist\\index.html'],
  ])('refuses %s', (_label, path) => {
    const parsed = parseUploadSpec(target({ files: [{ from: path, to: 'index.html' }] }));
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain('kein erlaubter relativer Pfad');
  });

  it('allows the payroll mapping only behind the Kanzlei IPs', () => {
    const parsed = parseUploadSpec(target({ access: 'ipOrLogin', allowMapping: true }));
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain(
      'Die Zuordnung zum Lohnprogramm nur mit "access": "ip"',
    );
  });

  it('refuses an unknown kind of access', () => {
    const parsed = parseUploadSpec(target({ access: 'alle' }));
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain('"access" ist eins von');
  });
});

describe('psftp batches', () => {
  it('changes into the folder and puts the access rules before the files', () => {
    expect(
      psftpBatch('/fragebogen', 'kanzlei', [
        { local: 'C:\\r\\.local\\.htaccess', to: '.htaccess' },
        { local: 'C:\\r\\dist-kanzlei\\index.html', to: 'index.html' },
      ]),
    ).toBe(
      'cd "/fragebogen"\ncd "kanzlei"\n' +
        'put "C:\\r\\.local\\.htaccess" ".htaccess"\nput "C:\\r\\dist-kanzlei\\index.html" "index.html"\n',
    );
    expect(psftpBatch('', '', [])).toBe('\n');
  });

  it('creates a subfolder first, and nothing for the subdomain folder itself', () => {
    expect(prepareBatch('/fragebogen', 'test')).toBe('cd "/fragebogen"\nmkdir "test"\n');
    expect(prepareBatch('/fragebogen', '')).toBeUndefined();
  });

  it('refuses a folder name that would break the batch', () => {
    expect(() => psftpBatch('a"\nrm *', '', [])).toThrow();
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
  // Starting Windows PowerShell can take seconds while the whole suite runs in parallel.
  it.runIf(process.platform === 'win32')(
    'parses without errors in Windows PowerShell',
    { timeout: 60_000 },
    () => {
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
    },
  );

  it('never puts the password on a command line and pins the host key', () => {
    expect(script).toContain('-pwfile');
    expect(script).not.toMatch(/['"\s]-pw['"\s]/);
    expect(script).toContain('-hostkey');
    expect(script).toContain('ConvertTo-SecureString');
  });
});
