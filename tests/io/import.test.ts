// What the import reports (ui/pdfActions.ts): verified package, altered part, form only in the
// file, QR codes from several photos. Fictitious data.
import { fromPackageText, fromQr } from '../../src/ui/pdfActions';
import { buildPackage, packageText } from '../../src/logic/dataPackage';
import { encodeDataLines } from '../../src/logic/dataPages';
import { registryOf } from '../../src/logic/formRegistry';
import { qrPayloads } from '../../src/logic/qrParts';
import type { Arrival } from '../../src/logic/session';
import { completeSofortmeldung, sofortmeldung } from '../support/sofortmeldungSession';

const ARRIVAL: Arrival = {
  local: '2026-10-30T12:00:00.000+01:00',
  utc: '2026-10-30T11:00:00.000Z',
  source: 'file',
  fileSha256: 'd'.repeat(64),
};
const published = registryOf([sofortmeldung]);

function text(): string {
  const s = completeSofortmeldung();
  return packageText(buildPackage(s.questionnaire, s.form));
}

describe('import report', () => {
  it('reports an unchanged questionnaire as checked, with the given notes', () => {
    const result = fromPackageText(text(), published, ARRIVAL, ['Geprüft wurden die Datenseiten.']);
    expect(result.kind).toBe('session');
    if (result.kind !== 'session') return;
    expect(result.message).toMatchObject({
      tone: 'success',
      text: 'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.',
      detail: ['Geprüft wurden die Datenseiten.'],
    });
    expect(result.session.dirty).toBe(false);
  });

  it('names a part changed after signing', () => {
    const raw = JSON.parse(text()) as {
      questionnaire: { parts: { person: { data: Record<string, unknown> }[] } };
    };
    const person = raw.questionnaire.parts.person[0];
    if (!person) throw new Error('no person part');
    person.data.vorname = 'Hans';
    const result = fromPackageText(JSON.stringify(raw), published, ARRIVAL, []);
    expect(result.kind).toBe('session');
    if (result.kind !== 'session') return;
    expect(result.message.tone).toBe('error');
    expect(result.message.text).toBe(
      'Geprüft: Mindestens ein Teil wurde nach dem Abschluss verändert.',
    );
    expect(result.message.detail?.join(' ')).toContain('Nach dem Abschluss geändert');
  });

  it('warns when only the file carries the form', () => {
    const result = fromPackageText(text(), registryOf([]), ARRIVAL, []);
    expect(result.kind === 'session' && result.message.tone).toBe('warning');
    if (result.kind === 'session')
      expect(result.message.detail?.[0]).toContain('nicht veröffentlicht');
  });

  it('refuses something that is not a package', () => {
    expect(fromPackageText('{"format":"anders"}', published, ARRIVAL, []).kind).toBe('error');
    expect(fromPackageText('kein JSON', published, ARRIVAL, []).kind).toBe('error');
  });

  it('collects QR codes over several photos until all parts are there', () => {
    const t = text();
    const block = encodeDataLines(t, '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c');
    const parts = qrPayloads(
      block.compressed,
      '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c',
      block.sha256,
    );
    expect(parts.length).toBeGreaterThan(1);
    const first = fromQr(parts.slice(0, 1), published, ARRIVAL, 'nicht gefunden');
    expect(first.kind).toBe('partial');
    if (first.kind !== 'partial') return;
    expect(first.message.text).toContain(`1 von ${parts.length} gelesen`);
    const all = fromQr(
      [...first.collected, ...parts.slice(1)],
      published,
      ARRIVAL,
      'nicht gefunden',
    );
    expect(all.kind).toBe('session');
    if (all.kind === 'session')
      expect(all.message.detail?.[0]).toContain('QR-Codes eines Ausdrucks');
  });

  it('says what was not found when a picture holds no code of this app', () => {
    expect(
      fromQr([new TextEncoder().encode('hallo')], published, ARRIVAL, 'nicht gefunden'),
    ).toMatchObject({
      kind: 'error',
      message: { text: 'nicht gefunden' },
    });
  });
});
