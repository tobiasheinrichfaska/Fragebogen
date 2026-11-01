// Upload plan for the SFTP upload (deploy/upload.ps1): which files go where, checked before anything
// leaves the PC. Pure functions plus a small CLI
// (`node deploy/uploadPlan.ts <target> [--remote dir] [--ips a,b]`, JSON on stdout); the PowerShell
// script only asks, decrypts the password and runs psftp.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  /** Only a target reachable from the Kanzlei's IPs alone may carry the payroll mapping. */
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
    if (target.allowMapping === true && access !== 'ip') {
      problems.push(`Ziel „${name}“: Die Zuordnung zum Lohnprogramm nur mit "access": "ip".`);
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

/** The `.htaccess` of a protected folder; the security headers come from the subdomain's one. */
export function accessRules(access: Access, ips: readonly string[]): string {
  return [
    '# Generated by deploy/upload.ps1 from the local list of the Kanzlei IP addresses.',
    '# Do not edit on the server; the next upload replaces it.',
    ...(access === 'ipOrLogin'
      ? ['# A tester login for other addresses follows with the tester management.']
      : []),
    `Require ip ${ips.join(' ')}`,
    '',
  ].join('\n');
}

export function planUpload(
  spec: UploadSpec,
  targetName: string,
  read: (path: string) => Uint8Array | undefined,
  markers: readonly string[],
  ips: readonly string[] = [],
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
          `„${file.from}“ enthält die Zuordnung zum Lohnprogramm – nur in den Kanzlei-Ordner (nur eure IPs).`,
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
    generated: protectedFolder
      ? [{ to: '.htaccess', content: accessRules(target.access, ips) }]
      : [],
    notes:
      target.access === 'ipOrLogin'
        ? [
            'Andere Adressen bekommen die Anmeldung erst mit der Testerverwaltung – bis dahin nur eure IPs.',
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

/** Creates the target's folder; run with psftp -be, because it fails when the folder exists. */
export function prepareBatch(remoteDir: string, folder: string): string | undefined {
  if (folder === '') return undefined;
  const cd = remoteDir === '' ? [] : [`cd ${quoted(remoteDir)}`];
  return `${[...cd, `mkdir ${quoted(folder)}`].join('\n')}\n`;
}

function option(args: readonly string[], name: string): string | undefined {
  const at = args.indexOf(name);
  return at >= 0 ? (args[at + 1] ?? '') : undefined;
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
    return existsSync(full) ? readFileSync(full) : undefined;
  };
  const plan = planUpload(parsed.spec, targetName, read, markers, ips);
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
  const prepare = prepareBatch(remote, plan.folder);
  return {
    ...plan,
    batch: psftpBatch(remote, plan.folder, puts),
    ...(prepare ? { prepare } : {}),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(cli(process.argv.slice(2)))}\n`);
}
