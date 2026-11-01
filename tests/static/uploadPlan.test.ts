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
  option,
  psftpBatch,
  remoteDirectoryOf,
  type UploadSpec,
} from '../../deploy/uploadPlan';
import { expandFolders, foldersOf } from '../../deploy/uploadPlan';

describe('folders in the upload list', () => {
  const list = (folder: string) =>
    folder === 'docs/hilfe/'
      ? ['versicherungsnummer/index.html', 'index.html', 'steuer-id/index.html']
      : undefined;

  it('stands for every file below it, sorted', () => {
    expect(expandFolders([{ from: 'docs/hilfe/', to: 'hilfe/' }], list)).toEqual([
      { from: 'docs/hilfe/index.html', to: 'hilfe/index.html' },
      { from: 'docs/hilfe/steuer-id/index.html', to: 'hilfe/steuer-id/index.html' },
      {
        from: 'docs/hilfe/versicherungsnummer/index.html',
        to: 'hilfe/versicherungsnummer/index.html',
      },
    ]);
  });

  it('keeps a missing folder, so the plan names it, and leaves files alone', () => {
    const files = [
      { from: 'docs/fehlt/', to: 'x/' },
      { from: 'dist/index.html', to: 'index.html' },
    ];
    expect(expandFolders(files, list)).toEqual(files);
  });
});

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

  it('puts the public app with its .htaccess and the help pages in the subdomain folder', () => {
    expect(committed.targets.oeffentlich).toMatchObject({ folder: '', access: 'public' });
    expect(committed.targets.oeffentlich?.files.map((f) => [f.from, f.to])).toEqual([
      ['dist/index.html', 'index.html'],
      ['deploy/.htaccess', '.htaccess'],
      ['docs/hilfe/', 'hilfe/'],
    ]);
  });

  it('gives the test folder its own help pages (Tobias 2026-11-01)', () => {
    expect(committed.targets.test?.files.map((f) => [f.from, f.to])).toContainEqual([
      'docs/hilfe/',
      'hilfe/',
    ]);
  });

  it('keeps the payroll mapping to the protected folders, never the public one', () => {
    const withMapping = Object.entries(committed.targets).filter(([, t]) => t.allowMapping);
    expect(withMapping.map(([name, t]) => [name, t.folder, t.access])).toEqual([
      ['test', 'test', 'ipOrLogin'],
      ['mehrfachbearbeitung', 'mehrfachbearbeitung', 'ip'],
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

  it('keeps the test folder IP-only without a server path or without testers, and says so', () => {
    const app = files({ 'dist-test/index.html': 'App' });
    for (const [login, note] of [
      [undefined, 'Ohne den Pfad auf dem Server keine Anmeldung'],
      [{ directory: '/home/www/test', htpasswd: '' }, 'Noch kein freigegebener Tester'],
    ] as const) {
      const plan = planUpload(SPEC, 'test', app, [], IPS, login);
      expect(plan).toMatchObject({ ok: true, folder: 'test', access: 'ipOrLogin' });
      expect(plan.ok && plan.generated).toEqual([
        { to: '.htaccess', content: accessRules('ipOrLogin', IPS) },
      ]);
      expect(plan.ok && plan.notes.join(' ')).toContain(note);
    }
  });

  it('lets testers in from other addresses, over HTTPS only, the password file first', () => {
    const login = { directory: '/home/www/public/test', htpasswd: 'anna:$6$x\n' };
    const plan = planUpload(SPEC, 'test', files({ 'dist-test/index.html': 'App' }), [], IPS, login);
    expect(plan.ok && plan.generated.map((file) => file.to)).toEqual(['.htpasswd', '.htaccess']);
    expect(plan.ok && plan.generated[0]?.content).toBe('anna:$6$x\n');
    expect(plan.ok && plan.notes).toEqual([]);
    const rules = plan.ok ? (plan.generated[1]?.content ?? '') : '';
    expect(rules).toContain('AuthType Basic\n');
    expect(rules).toContain('AuthUserFile "/home/www/public/test/.htpasswd"\n');
    expect(rules).toContain(
      "<RequireAll>\n  Require expr %{HTTPS} == 'on'\n  <RequireAny>\n" +
        '    Require ip 203.0.113.7 2001:db8::/48\n    Require valid-user\n  </RequireAny>\n</RequireAll>\n',
    );
  });

  it('never adds a login to the Kanzlei folder', () => {
    const login = { directory: '/home/www/public/kanzlei', htpasswd: 'anna:$6$x\n' };
    const plan = planUpload(
      SPEC,
      'kanzlei',
      files({ 'dist-kanzlei/index.html': 'x' }),
      [],
      IPS,
      login,
    );
    expect(plan.ok && plan.generated).toEqual([
      { to: '.htaccess', content: accessRules('ip', IPS) },
    ]);
  });

  it('refuses a server path that is not absolute', () => {
    const plan = planUpload(SPEC, 'test', files({ 'dist-test/index.html': 'App' }), [], IPS, {
      directory: 'test',
      htpasswd: 'anna:$6$x\n',
    });
    expect(plan.ok ? [] : plan.problems.join(' ')).toContain('kein absoluter Pfad');
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

  it('allows the payroll mapping in protected folders only', () => {
    const parsed = parseUploadSpec(target({ access: 'public', allowMapping: true }));
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain(
      'Die Zuordnung zum Lohnprogramm nie in einen öffentlichen Ordner',
    );
    expect(parseUploadSpec(target({ access: 'ipOrLogin', allowMapping: true })).ok).toBe(true);
  });

  it('refuses an unknown kind of access', () => {
    const parsed = parseUploadSpec(target({ access: 'alle' }));
    expect(parsed.ok ? [] : parsed.problems.join(' ')).toContain('"access" ist eins von');
  });
});

// Regression 2026-11-01: Windows PowerShell 5.1 drops an empty argument — with an empty target
// folder `--remote "" --ips …` arrived as `--remote --ips …` and psftp tried `cd "--ips"`.
describe('command-line options', () => {
  it('never takes the next option as a value', () => {
    const args = ['oeffentlich', '--remote', '--ips', '203.0.113.7'];
    expect(option(args, '--remote')).toBe('');
    expect(option(args, '--ips')).toBe('203.0.113.7');
    expect(option(['test', '--remote'], '--remote')).toBe('');
    expect(option(['test'], '--remote')).toBeUndefined();
  });

  it('reads "--name=value", also with an empty value', () => {
    const args = ['test', '--remote=', '--ips=203.0.113.7,2001:db8::1', '--pfad=/home/www/test'];
    expect(option(args, '--remote')).toBe('');
    expect(option(args, '--ips')).toBe('203.0.113.7,2001:db8::1');
    expect(option(args, '--pfad')).toBe('/home/www/test');
  });
});

describe('the upload script passes options as one argument each', () => {
  const script = readFileSync(join(ROOT, 'deploy/upload.ps1'), 'utf8');
  it('uses --remote=…, --ips=… and --pfad=…', () => {
    expect(script).toContain('"--remote=$($settings.ordner)"');
    expect(script).toContain('"--ips=$ips"');
    expect(script).not.toMatch(/--remote \$settings/);
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

  it('creates a subfolder first and asks for its path, nothing for the subdomain folder', () => {
    expect(prepareBatch('/fragebogen', 'test')).toBe(
      'cd "/fragebogen"\nmkdir "test"\ncd "test"\npwd\n',
    );
    expect(prepareBatch('/fragebogen', '')).toBeUndefined();
  });

  it('creates the subfolders of the files, parents first', () => {
    const files = [
      { to: 'index.html' },
      { to: 'hilfe/index.html' },
      { to: 'hilfe/steuer-id/index.html' },
      { to: 'hilfe/versicherungsnummer/index.html' },
    ];
    expect(foldersOf(files)).toEqual(['hilfe', 'hilfe/steuer-id', 'hilfe/versicherungsnummer']);
    expect(prepareBatch('', '', foldersOf(files))).toBe(
      'mkdir "hilfe"\nmkdir "hilfe/steuer-id"\nmkdir "hilfe/versicherungsnummer"\n',
    );
    expect(prepareBatch('', 'test', ['hilfe'])).toBe(
      'mkdir "test"\ncd "test"\nmkdir "hilfe"\npwd\n',
    );
  });

  it("reads the folder from psftp's pwd", () => {
    const output =
      'Remote working directory is /\nmkdir /test: failure\nRemote directory is /home/www/public/test\n';
    expect(remoteDirectoryOf(output)).toBe('/home/www/public/test');
    expect(remoteDirectoryOf('Verbindung abgelehnt')).toBeUndefined();
  });

  it('refuses a folder name that would break the batch', () => {
    expect(() => psftpBatch('a"\nrm *', '', [])).toThrow();
  });
});

describe.each(['deploy/upload.ps1', 'deploy/tester.ps1'])('%s', (path) => {
  const raw = readFileSync(join(ROOT, path));

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
        '$env:PS1_FILE,[ref]$t,[ref]$e);$e|ForEach-Object{"$($_.Extent.StartLineNumber): $($_.Message)"}';
      const out = execFileSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', parse],
        { env: { ...process.env, PS1_FILE: join(ROOT, path) }, encoding: 'utf8' },
      );
      expect(out.trim()).toBe('');
    },
  );
});

describe('deploy/upload.ps1', () => {
  const script = readFileSync(join(ROOT, 'deploy/upload.ps1'), 'utf8');

  it('never puts the password on a command line and pins the host key', () => {
    expect(script).toContain('-pwfile');
    expect(script).not.toMatch(/['"\s]-pw['"\s]/);
    expect(script).toContain('-hostkey');
    expect(script).toContain('ConvertTo-SecureString');
  });

  // Regression 2026-11-01: Windows' ssh-keyscan 9.5 got no key from IONOS (OpenSSH 10 picks the key
  // exchange sntrup761x25519, which that build offers but cannot do). PuTTY's plink reads it first.
  it('reads the host key with PuTTY first, ssh-keyscan only as the fallback', () => {
    const plink = script.indexOf("'plink.exe'");
    const keyscan = script.indexOf('ssh-keyscan.exe -p');
    expect(plink).toBeGreaterThan(0);
    expect(keyscan).toBeGreaterThan(plink);
  });
});
