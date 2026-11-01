// Upload plan for the SFTP upload (deploy/upload.ps1): which files go where, checked before anything
// leaves the PC. Pure functions plus a small CLI (`node deploy/uploadPlan.ts <target> [--remote dir]`,
// JSON on stdout); the PowerShell script only asks, decrypts the password and runs psftp.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export type Plan =
  | { ok: true; target: string; description: string; build?: string; files: PlannedFile[] }
  | { ok: false; problems: string[] };

type Parsed = { ok: true; spec: UploadSpec } | { ok: false; problems: string[] };

// Relative, forward slashes, no "..", no quotes — safe inside a psftp batch line.
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._\-/]+$/;

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
      !Array.isArray(target.files)
    ) {
      problems.push(`Ziel „${name}“ braucht "description" und "files".`);
      continue;
    }
    if (target.build !== undefined && typeof target.build !== 'string') {
      problems.push(`Ziel „${name}“: "build" ist kein Text.`);
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
      files,
    };
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, spec: { targets, forbidden } };
}

/** The masks a local payroll mapping names (config/export.local.json); none may be uploaded. */
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

export function planUpload(
  spec: UploadSpec,
  targetName: string,
  read: (path: string) => Uint8Array | undefined,
  markers: readonly string[],
): Plan {
  const target = spec.targets[targetName];
  if (!target) {
    const known = Object.keys(spec.targets).join(', ');
    return { ok: false, problems: [`Unbekanntes Ziel „${targetName}“ (vorhanden: ${known}).`] };
  }
  const problems: string[] = [];
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
    if (file.from.endsWith('.html')) {
      const text = new TextDecoder().decode(bytes);
      if (markers.some((marker) => text.includes(marker))) {
        problems.push(
          `„${file.from}“ enthält die Zuordnung zum Lohnprogramm (Kanzlei-Fassung) – nie öffentlich hochladen.`,
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
    files,
  };
}

/** psftp batch: change to the remote folder, then put every file (psftp stops at the first error). */
export function psftpBatch(root: string, remoteDir: string, files: readonly UploadFile[]): string {
  if (/["\r\n]/.test(remoteDir))
    throw new Error('Zielordner mit Anführungszeichen oder Zeilenumbruch');
  const lines = remoteDir === '' ? [] : [`cd "${remoteDir}"`];
  for (const file of files) lines.push(`put "${join(root, file.from)}" "${file.to}"`);
  return `${lines.join('\n')}\n`;
}

function cli(args: readonly string[]): unknown {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const targetName = args[0] ?? '';
  const at = args.indexOf('--remote');
  const remote = at >= 0 ? (args[at + 1] ?? '') : undefined;
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
  const plan = planUpload(parsed.spec, targetName, read, markers);
  if (!plan.ok || remote === undefined) return plan;
  return { ...plan, batch: psftpBatch(root, remote, plan.files) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(cli(process.argv.slice(2)))}\n`);
}
