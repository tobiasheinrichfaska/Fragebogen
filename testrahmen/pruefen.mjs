// Checks that this copy of the shared test page is unchanged (Testumgebung, testrahmen/). Plain
// Node, no dependency: `node pruefen.mjs`, or in a test of the app:
//   import { pruefeKopie } from '<folder>/pruefen.mjs'; expect(pruefeKopie()).toEqual([]);
// Change the test page in Testumgebung and copy it again (`npm run rahmen -- <folder of the app>`).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));

/** The files every copy has; a stamp without one of them is no complete copy. */
const PFLICHT = ['testrahmen.js', 'testrahmen.d.ts', 'testrahmen.css', 'pruefen.mjs', 'pruefen.d.mts', 'LIESMICH.md'];

/**
 * The stand testrahmen.js names in its second line (written by Testumgebung's bundler, covered by its
 * hash): the stamp must name the same, so an edited stamp does not turn a trial copy into a clean one.
 */
function standImBuendel(ordner) {
  let text;
  try {
    text = readFileSync(join(ordner, 'testrahmen.js'), 'utf8');
  } catch {
    return { fehlt: true };
  }
  const kopf = text.split(/\r?\n/, 3).join('\n');
  return { stand: /^\/\/ there and copy it again\. Stand (\S+)\. Checked by pruefen\.mjs/m.exec(kopf)?.[1] };
}

const entwurf = (stand) => typeof stand !== 'string' || stand.includes('+entwurf');

/** Files the system puts into any folder; they are no part of the copy and change nothing. */
const SYSTEMDATEIEN = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

/** The deviations from testrahmen.json, in German; empty when the copy is unchanged. */
export function pruefeKopie(ordner = hier) {
  let stempel;
  try {
    stempel = JSON.parse(readFileSync(join(ordner, 'testrahmen.json'), 'utf8'));
  } catch {
    return ['testrahmen.json fehlt oder ist kein JSON.'];
  }
  const dateien = stempel && typeof stempel.dateien === 'object' && stempel.dateien !== null ? stempel.dateien : {};
  const fehler = [];
  // A trial copy (`--entwurf`) holds code that is in no commit of Testumgebung: never in an app. The
  // bundle says so itself; a missing or unreadable header counts as a draft.
  const buendel = standImBuendel(ordner);
  if (entwurf(stempel?.stand) || (!buendel.fehlt && entwurf(buendel.stand))) {
    const stand = entwurf(stempel?.stand) ? stempel?.stand : buendel.stand;
    fehler.push(`Die Kopie ist ein Entwurf (Stand ${String(stand)}), nicht aus einem Commit von Testumgebung. Bitte aus einem committeten Stand neu kopieren.`);
  } else if (!buendel.fehlt && buendel.stand !== stempel.stand) {
    fehler.push(`testrahmen.json nennt den Stand ${stempel.stand}, testrahmen.js aber ${buendel.stand}. Bitte in Testumgebung neu kopieren.`);
  }
  for (const name of PFLICHT) if (!Object.prototype.hasOwnProperty.call(dateien, name)) fehler.push(`testrahmen.json nennt ${name} nicht.`);
  // Exactly the copy's files: a stamp that names another file vouches for something that is none of it.
  for (const name of Object.keys(dateien)) if (!PFLICHT.includes(name)) fehler.push(`testrahmen.json nennt ${name}; das gehört nicht zur Kopie.`);
  for (const [name, soll] of Object.entries(dateien).filter(([n]) => PFLICHT.includes(n))) {
    let text;
    try {
      text = readFileSync(join(ordner, name), 'utf8');
    } catch {
      fehler.push(`${name} fehlt.`);
      continue;
    }
    const ist = createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
    if (ist !== soll) fehler.push(`${name} wurde hier geändert. Bitte in Testumgebung ändern und neu kopieren.`);
  }
  // Nothing beside the copy: a file the stamp does not name (e.g. a patched module the app imports
  // instead) would escape every check here.
  let inhalt = [];
  try {
    inhalt = readdirSync(ordner);
  } catch {
    // A folder that cannot be listed: the missing files above say enough.
  }
  for (const name of inhalt) {
    if (name === 'testrahmen.json' || SYSTEMDATEIEN.has(name) || PFLICHT.includes(name)) continue;
    fehler.push(`${name} gehört nicht zur Kopie. Bitte entfernen; der Rahmen wird nur in Testumgebung geändert.`);
  }
  return fehler;
}

/** Run directly (`node pruefen.mjs`), also through a symlink or a junction: compare real paths. */
function direktAufgerufen() {
  try {
    return Boolean(process.argv[1]) && pathToFileURL(realpathSync(process.argv[1])).href === pathToFileURL(realpathSync(fileURLToPath(import.meta.url))).href;
  } catch {
    return false;
  }
}

if (direktAufgerufen()) {
  const fehler = pruefeKopie();
  if (fehler.length > 0) {
    for (const zeile of fehler) console.error(zeile);
    process.exit(1);
  }
  console.log('Testrahmen: Kopie unverändert.');
}
