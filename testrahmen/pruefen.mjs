// Checks that this copy of the shared test page is unchanged (Testumgebung, testrahmen/). Plain
// Node, no dependency: `node pruefen.mjs`, or in a test of the app:
//   import { pruefeKopie } from '<folder>/pruefen.mjs'; expect(pruefeKopie()).toEqual([]);
// Change the test page in Testumgebung and copy it again (`npm run rahmen -- <folder of the app>`).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = dirname(fileURLToPath(import.meta.url));

/** The deviations from testrahmen.json, in German; empty when the copy is unchanged. */
export function pruefeKopie(ordner = hier) {
  let stempel;
  try {
    stempel = JSON.parse(readFileSync(join(ordner, 'testrahmen.json'), 'utf8'));
  } catch {
    return ['testrahmen.json fehlt oder ist kein JSON.'];
  }
  const dateien = stempel && typeof stempel.dateien === 'object' ? stempel.dateien : {};
  const fehler = [];
  for (const [name, soll] of Object.entries(dateien)) {
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
  if (Object.keys(dateien).length === 0) fehler.push('testrahmen.json nennt keine Dateien.');
  return fehler;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const fehler = pruefeKopie();
  if (fehler.length > 0) {
    for (const zeile of fehler) console.error(zeile);
    process.exit(1);
  }
  console.log('Testrahmen: Kopie unverändert.');
}
