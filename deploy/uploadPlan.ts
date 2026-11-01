// Upload plan for the SFTP upload (deploy/upload.ps1): which files go where, checked before anything
// leaves the PC. Pure functions plus a small CLI
// (`node deploy/uploadPlan.ts <target> [--remote dir] [--ips a,b]`, JSON on stdout); the PowerShell
// script only asks, decrypts the password and runs psftp.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// With the extension: Node runs this file directly (type stripping), without a bundler.
import { TESTERS_FILE, htpasswd, parseTesters } from './testers.ts';

/**
 * Who may open a target's folder (Tobias 2026-11-01): everyone; only the Kanzlei's IP addresses;
 * the Kanzlei's IPs or a tester login (the login follows with the tester management — until then
 * only the IPs).
 */
export const ACCESS = ['public', 'ip', 'ipOrLogin'] as const;
export type Access = (typeof ACCESS)[number];

export interface UploadFile {
  from: string;
  to: string;
  /** Compare the hosted file with the local one after the upload (needs the site address). */
  verify?: boolean;
}

export interface UploadTarget {
  description: string;
  /** npm script that builds the files first (e.g. "build"). */
  build?: string;
  /** Subfolder below the subdomain folder; "" = the subdomain folder itself. */
  folder: string;
  access: Access;
  /**
   * Only a protected target may carry the payroll mapping (DATEV's field names): the Kanzlei folder
   * (IPs only) and the test folder (IPs or a tester login, Tobias 2026-11-01) — never the public one.
   */
  allowMapping?: boolean;
  files: UploadFile[];
}

export interface UploadSpec {
  targets: Record<string, UploadTarget>;
  /** Path prefixes that must never leave the PC, whatever a target says. */
  forbidden: string[];
}

export interface PlannedFile extends UploadFile {
  bytes: number;
  sha256: string;
}

/** A file the plan writes itself (the folder's access rules), uploaded before the others. */
export interface GeneratedFile {
  to: string;
  content: string;
}

export type Plan =
  | {
      ok: true;
      target: string;
      description: string;
      build?: string;
      folder: string;
      access: Access;
      files: PlannedFile[];
      generated: GeneratedFile[];
      notes: string[];
    }
  | { ok: false; problems: string[] };

type Parsed = { ok: true; spec: UploadSpec } | { ok: false; problems: string[] };

// Relative, forward slashes, no "..", no quotes — safe inside a psftp batch line.
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._\-/]+$/;

const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4 = new RegExp(`^${OCTET}(?:\\.${OCTET}){3}(?:/(?:3[0-2]|[12]?\\d))?$`);
const IPV6 = /^(?=.*:.*:)[0-9a-fA-F:]{2,39}(?:\/(?:12[0-8]|1[01]\d|[1-9]?\d))?$/;

/** A full IPv4 or IPv6 address, optionally with a prefix length (as Apache's `Require ip`). */
export const isIpAddress = (text: string): boolean => IPV4.test(text) || IPV6.test(text);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseUploadSpec(raw: unknown): Parsed {
  const problems: string[] = [];
  if (!isObject(raw) || !isObject(raw.targets) || !Array.isArray(raw.forbidden)) {
    return { ok: false, problems: ['deploy/upload.json braucht "targets" und "forbidden".'] };
  }
  const forbidden = raw.forbidden.filter((p): p is string => typeof p === 'string');
  if (forbidden.length !== raw.forbidden.length) problems.push('"forbidden" enthält keinen Text.');
  const targets: Record<string, UploadTarget> = {};
  for (const [name, target] of Object.entries(raw.targets)) {
    if (
      !isObject(target) ||
      typeof target.description !== 'string' ||
      typeof target.folder !== 'string' ||
      !Array.isArray(target.files)
    ) {
      problems.push(`Ziel „${name}“ braucht "description", "folder" und "files".`);
      continue;
    }
    const access = ACCESS.find((a) => a === target.access);
    if (!access) problems.push(`Ziel „${name}“: "access" ist eins von ${ACCESS.join(', ')}.`);
    if (target.folder !== '' && !SAFE_PATH.test(target.folder)) {
      problems.push(`Ziel „${name}“: „${target.folder}“ ist kein erlaubter Ordner.`);
    }
    if (target.build !== undefined && typeof target.build !== 'string') {
      problems.push(`Ziel „${name}“: "build" ist kein Text.`);
    }
    if (target.allowMapping === true && (access === undefined || access === 'public')) {
      problems.push(
        `Ziel „${name}“: Die Zuordnung zum Lohnprogramm nie in einen öffentlichen Ordner.`,
      );
    }
    const files: UploadFile[] = [];
    for (const file of target.files) {
      if (!isObject(file) || typeof file.from !== 'string' || typeof file.to !== 'string') {
        problems.push(`Ziel „${name}“: Jede Datei braucht "from" und "to".`);
        continue;
      }
      for (const key of ['from', 'to'] as const) {
        if (!SAFE_PATH.test(file[key] as string)) {
          problems.push(
            `Ziel „${name}“: „${String(file[key])}“ ist kein erlaubter relativer Pfad.`,
          );
        }
      }
      files.push({
        from: file.from,
        to: file.to,
        ...(file.verify === true ? { verify: true } : {}),
      });
    }
    targets[name] = {
      description: target.description,
      ...(typeof target.build === 'string' ? { build: target.build } : {}),
      folder: target.folder,
      access: access ?? 'ip',
      ...(target.allowMapping === true ? { allowMapping: true } : {}),
      files,
    };
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, spec: { targets, forbidden } };
}

/**
 * A file entry ending in "/" stands for every file below that folder (e.g. "docs/hilfe/" →
 * "hilfe/"). `list` gives the relative paths of the files in a local folder, or undefined when it
 * does not exist — the entry then stays and the plan reports it as missing.
 */
export function expandFolders(
  files: readonly UploadFile[],
  list: (folder: string) => readonly string[] | undefined,
): UploadFile[] {
  return files.flatMap((file) => {
    if (!file.from.endsWith('/')) return [file];
    const inside = list(file.from);
    if (!inside) return [file];
    const to = file.to.endsWith('/') ? file.to : `${file.to}/`;
    return [...inside].sort().map((path) => ({ from: `${file.from}${path}`, to: `${to}${path}` }));
  });
}

/** Every folder the files need on the server, parents first ("hilfe", "hilfe/steuer-id"). */
export function foldersOf(files: readonly { to: string }[]): string[] {
  const folders = new Set<string>();
  for (const file of files) {
    const parts = file.to.split('/').slice(0, -1);
    parts.forEach((_part, i) => folders.add(parts.slice(0, i + 1).join('/')));
  }
  return [...folders].sort(
    (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b),
  );
}

/** The masks a local payroll mapping names (config/export.local.json). */
export function mappingMarkers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((mapping) =>
    isObject(mapping) && Array.isArray(mapping.records)
      ? mapping.records.flatMap((record) =>
          isObject(record) && typeof record.mask === 'string' ? [record.mask] : [],
        )
      : [],
  );
}

/** Tester login of an `ipOrLogin` folder: its absolute path on the server and the .htpasswd. */
export interface Login {
  directory: string;
  htpasswd: string;
}

const SERVER_DIRECTORY = /^\/[A-Za-z0-9._\-/]+$/;

/**
 * The `.htaccess` of a protected folder; the security headers come from the subdomain's one. With a
 * login, other addresses get Apache's password dialog — only over HTTPS, so a password never
 * travels unencrypted before the redirect.
 */
export function accessRules(access: Access, ips: readonly string[], login?: Login): string {
  const head = [
    '# Generated by deploy/upload.ps1 from the local list of the Kanzlei IP addresses',
    '# (and the testers). Do not edit on the server; the next upload replaces it.',
  ];
  if (access !== 'ipOrLogin' || !login) {
    return [...head, `Require ip ${ips.join(' ')}`, ''].join('\n');
  }
  return [
    ...head,
    'AuthType Basic',
    'AuthName "Fragebogen - Testbereich"',
    `AuthUserFile "${login.directory}/.htpasswd"`,
    '<RequireAll>',
    "  Require expr %{HTTPS} == 'on'",
    '  <RequireAny>',
    `    Require ip ${ips.join(' ')}`,
    '    Require valid-user',
    '  </RequireAny>',
    '</RequireAll>',
    '',
  ].join('\n');
}

export function planUpload(
  spec: UploadSpec,
  targetName: string,
  read: (path: string) => Uint8Array | undefined,
  markers: readonly string[],
  ips: readonly string[] = [],
  login?: Login,
): Plan {
  const target = spec.targets[targetName];
  if (!target) {
    const known = Object.keys(spec.targets).join(', ');
    return { ok: false, problems: [`Unbekanntes Ziel „${targetName}“ (vorhanden: ${known}).`] };
  }
  const problems: string[] = [];
  const protectedFolder = target.access !== 'public';
  if (protectedFolder && target.folder === '') {
    problems.push(`Ziel „${targetName}“: Ein geschützter Bereich braucht einen eigenen Ordner.`);
  }
  if (protectedFolder && ips.length === 0) {
    problems.push(
      `Für „${targetName}“ fehlen die IP-Adressen der Kanzlei (deploy\\upload.ps1 -Einrichten).`,
    );
  }
  for (const ip of ips.filter((candidate) => !isIpAddress(candidate))) {
    problems.push(`„${ip}“ ist keine IP-Adresse.`);
  }
  if (login && !SERVER_DIRECTORY.test(login.directory)) {
    problems.push(`„${login.directory}“ ist kein absoluter Pfad auf dem Server.`);
  }
  // Only a folder with testers asks for a password; without any, it stays IP-only.
  const withLogin =
    target.access === 'ipOrLogin' && login && login.htpasswd !== '' ? login : undefined;
  const files: PlannedFile[] = [];
  for (const file of target.files) {
    if (spec.forbidden.some((prefix) => file.from.startsWith(prefix))) {
      problems.push(`„${file.from}“ darf nie hochgeladen werden.`);
      continue;
    }
    const bytes = read(file.from);
    if (!bytes) {
      problems.push(
        `„${file.from}“ fehlt${target.build ? ` – erst bauen (npm run ${target.build})` : ''}.`,
      );
      continue;
    }
    if (file.from.endsWith('.html') && !target.allowMapping) {
      const text = new TextDecoder().decode(bytes);
      if (markers.some((marker) => text.includes(marker))) {
        problems.push(
          `„${file.from}“ enthält die Zuordnung zum Lohnprogramm – nur in einen geschützten Ordner (Kanzlei, Test).`,
        );
        continue;
      }
    }
    files.push({
      ...file,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  if (problems.length > 0) return { ok: false, problems };
  return {
    ok: true,
    target: targetName,
    description: target.description,
    ...(target.build ? { build: target.build } : {}),
    folder: target.folder,
    access: target.access,
    files,
    // The password file goes up before the rules that name it.
    generated: [
      ...(withLogin ? [{ to: '.htpasswd', content: withLogin.htpasswd }] : []),
      ...(protectedFolder
        ? [{ to: '.htaccess', content: accessRules(target.access, ips, withLogin) }]
        : []),
    ],
    notes:
      target.access === 'ipOrLogin' && !withLogin
        ? [
            login
              ? 'Noch kein freigegebener Tester (deploy\\tester.ps1) – bis dahin nur eure IPs.'
              : 'Ohne den Pfad auf dem Server keine Anmeldung – bis dahin nur eure IPs.',
          ]
        : [],
  };
}

function quoted(text: string): string {
  if (/["\r\n]/.test(text)) throw new Error('Pfad mit Anführungszeichen oder Zeilenumbruch');
  return `"${text}"`;
}

/** psftp batch: into the folder, then put every file (psftp stops at the first error). */
export function psftpBatch(
  remoteDir: string,
  folder: string,
  puts: readonly { local: string; to: string }[],
): string {
  const lines = [remoteDir, folder].filter((dir) => dir !== '').map((dir) => `cd ${quoted(dir)}`);
  for (const put of puts) lines.push(`put ${quoted(put.local)} ${quoted(put.to)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Creates the target's folder and the subfolders its files need, and prints the folder's absolute
 * path ("Remote directory is …", needed for the login); run with psftp -be, because mkdir fails
 * when a folder exists.
 */
export function prepareBatch(
  remoteDir: string,
  folder: string,
  subfolders: readonly string[] = [],
): string | undefined {
  if (folder === '' && subfolders.length === 0) return undefined;
  const lines = remoteDir === '' ? [] : [`cd ${quoted(remoteDir)}`];
  if (folder !== '') lines.push(`mkdir ${quoted(folder)}`, `cd ${quoted(folder)}`);
  for (const sub of subfolders) lines.push(`mkdir ${quoted(sub)}`);
  if (folder !== '') lines.push('pwd');
  return `${lines.join('\n')}\n`;
}

/** The folder psftp's `pwd` printed, if any. */
export function remoteDirectoryOf(output: string): string | undefined {
  const found = [...output.matchAll(/^Remote directory is (\/\S*)\s*$/gm)].at(-1);
  return found?.[1];
}

/**
 * A command-line option as `--name=value` or `--name value`. Regression 2026-11-01: Windows
 * PowerShell 5.1 drops an empty argument, so `--remote "" --ips …` arrived as `--remote --ips …`
 * and "--ips" became the folder — a following option is never taken as a value.
 */
export function option(args: readonly string[], name: string): string | undefined {
  const joined = args.find((arg) => arg.startsWith(`${name}=`));
  if (joined !== undefined) return joined.slice(name.length + 1);
  const at = args.indexOf(name);
  if (at < 0) return undefined;
  const next = args[at + 1];
  return next === undefined || next.startsWith('--') ? '' : next;
}

function cli(args: readonly string[]): unknown {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const targetName = args[0] ?? '';
  const remote = option(args, '--remote');
  const ips = (option(args, '--ips') ?? '').split(/[\s,;]+/).filter(Boolean);
  const parsed = parseUploadSpec(
    JSON.parse(readFileSync(join(root, 'deploy/upload.json'), 'utf8')),
  );
  if (!parsed.ok) return parsed;
  const local = join(root, 'config/export.local.json');
  const markers = existsSync(local) ? mappingMarkers(JSON.parse(readFileSync(local, 'utf8'))) : [];
  const read = (path: string) => {
    const full = join(root, path);
    return existsSync(full) && statSync(full).isFile() ? readFileSync(full) : undefined;
  };
  const list = (folder: string) => {
    const full = join(root, folder);
    if (!existsSync(full) || !statSync(full).isDirectory()) return undefined;
    return readdirSync(full, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(full, join(entry.parentPath, entry.name)).split(sep).join('/'));
  };
  const spec: UploadSpec = {
    ...parsed.spec,
    targets: Object.fromEntries(
      Object.entries(parsed.spec.targets).map(([name, target]) => [
        name,
        { ...target, files: expandFolders(target.files, list) },
      ]),
    ),
  };
  const directory = option(args, '--pfad');
  const testersFile = join(root, TESTERS_FILE);
  const login =
    directory === undefined
      ? undefined
      : {
          directory,
          htpasswd: htpasswd(
            existsSync(testersFile)
              ? parseTesters(JSON.parse(readFileSync(testersFile, 'utf8')))
              : [],
          ),
        };
  const plan = planUpload(spec, targetName, read, markers, ips, login);
  if (!plan.ok || remote === undefined) return plan;
  // Generated files go to deploy/.local/ (gitignored) and up first, so a protected folder is never
  // open, not even for a moment.
  const generatedDir = join(root, 'deploy/.local/erzeugt', targetName);
  mkdirSync(generatedDir, { recursive: true });
  const puts = plan.generated.map((file) => {
    const path = join(generatedDir, file.to);
    writeFileSync(path, file.content);
    return { local: path, to: file.to };
  });
  puts.push(...plan.files.map((file) => ({ local: join(root, file.from), to: file.to })));
  const prepare = prepareBatch(remote, plan.folder, foldersOf(plan.files));
  return {
    ...plan,
    batch: psftpBatch(remote, plan.folder, puts),
    ...(prepare ? { prepare } : {}),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(cli(process.argv.slice(2)))}\n`);
}
