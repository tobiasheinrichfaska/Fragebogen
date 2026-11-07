// Upload targets (Tobias 2026-11-01): the public app for everyone, the test folder from the Kanzlei's
// IPs or with a tester login, the Kanzlei app from the Kanzlei's IPs only. Since 2026-11-06 the
// private tool Auslieferung uploads them from deploy/upload.json; the payroll mapping is a marker
// source there — any file containing it is refused outside the folders that allow it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Target {
  folder: string;
  access: string;
  files: { from: string; to: string }[];
  allowMarkers?: string[];
  testers?: string;
  authName?: string;
}

interface Spec {
  zugang: string;
  targets: Record<string, Target>;
  forbidden: string[];
  markers: { id: string; file: string; extract: string }[];
}

const ROOT = join(__dirname, '..', '..');
const text = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const spec = JSON.parse(text('deploy/upload.json')) as Spec;

describe('deploy/upload.json', () => {
  it('uses the access "fragebogen" of the upload tool', () => {
    expect(spec.zugang).toBe('fragebogen');
  });

  it('puts the public app with its .htaccess and the help pages in the subdomain folder', () => {
    expect(spec.targets.oeffentlich).toMatchObject({ folder: '', access: 'public' });
    expect(spec.targets.oeffentlich?.files.map((f) => [f.from, f.to])).toEqual([
      ['dist/index.html', 'index.html'],
      ['deploy/.htaccess', '.htaccess'],
      ['docs/hilfe/', 'hilfe/'],
    ]);
  });

  it('changes the rules of the subdomain folder with "regeln" alone, never the app (2026-11-07)', () => {
    expect(spec.targets.regeln).toMatchObject({ folder: '', access: 'public' });
    expect(spec.targets.regeln?.files.map((f) => [f.from, f.to])).toEqual([
      ['deploy/.htaccess', '.htaccess'],
    ]);
    expect(spec.targets.regeln).not.toHaveProperty('build');
  });

  it('gives the test folder its own help pages (Tobias 2026-11-01)', () => {
    expect(spec.targets.test?.files.map((f) => [f.from, f.to])).toContainEqual([
      'docs/hilfe/',
      'hilfe/',
    ]);
  });

  it('checks every upload for the payroll mapping and allows it in the protected folders only', () => {
    expect(spec.markers).toContainEqual(
      expect.objectContaining({
        id: 'mapping',
        file: 'config/export.local.json',
        extract: 'exportMasks',
      }),
    );
    const withMapping = Object.entries(spec.targets).filter(([, t]) =>
      t.allowMarkers?.includes('mapping'),
    );
    expect(withMapping.map(([name, t]) => [name, t.folder, t.access])).toEqual([
      ['test', 'test', 'ipOrLogin'],
      ['mehrfachbearbeitung', 'mehrfachbearbeitung', 'ip'],
    ]);
    expect(spec.targets.test?.files[0]?.from).toBe('dist-test/index.html');
    expect(spec.forbidden).toEqual(
      expect.arrayContaining(['dist-preview/', 'config/', 'deploy/.local/']),
    );
  });

  it("keeps the test folder's tester list and password dialog, so saved logins still fit", () => {
    expect(spec.targets.test).toMatchObject({
      testers: 'deploy/.local/tester.json',
      authName: 'Fragebogen - Testbereich',
    });
  });

  it('keeps the local tester list and generated files out of git', () => {
    expect(text('.gitignore')).toMatch(/^deploy\/\.local\/$/m);
    expect(text('.gitignore')).toMatch(/^dist-test\/$/m);
  });
});

describe('npm scripts of the upload', () => {
  const scripts = (JSON.parse(text('package.json')) as { scripts: Record<string, string> }).scripts;

  it('name this project and no target, so the public app is never uploaded by default', () => {
    expect(scripts.hochladen).toMatch(/\/Auslieferung\/upload\.ps1 -Projekt \.$/);
    expect(scripts.tester).toMatch(/\/Auslieferung\/tester\.ps1 -Projekt \. -Ziel test$/);
  });
});
