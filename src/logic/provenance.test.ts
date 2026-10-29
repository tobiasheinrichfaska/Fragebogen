import {
  beispielForm,
  guardianForm,
  minorWithGuardian,
  newVersion,
  twoRoles,
} from '../../tests/support/sample';
import { signatureLayout } from './provenance';

describe('signatureLayout', () => {
  it('gives every role one line when nobody re-signed — no footnotes', () => {
    const { lines, fields } = signatureLayout(twoRoles(), beispielForm().definition);
    expect(
      lines.map((l) => [l.number, l.role, l.version, l.status, l.method ?? '-', l.current]),
    ).toEqual([
      [1, 'person', 1, 'signed', 'drawn', true],
      [2, 'arbeitgeber', 1, 'sealed', '-', true],
    ]);
    expect(fields.filter((f) => f.footnote !== undefined)).toEqual([]);
    expect(fields.find((f) => f.fieldId === 'agNachname')).toMatchObject({
      role: 'arbeitgeber',
      line: 2,
      coveredBy: [2],
    });
  });

  it('shows one line per version and marks fields changed in the newer version', () => {
    const { lines, fields } = signatureLayout(newVersion(), beispielForm().definition);
    expect(lines.map((l) => [l.number, l.role, l.version, l.current, l.signerName ?? '-'])).toEqual(
      [
        [1, 'person', 1, false, 'Erika Musterfrau'],
        [2, 'person', 2, true, '-'],
        [3, 'arbeitgeber', 1, true, '-'],
      ],
    );
    const field = (id: string) => fields.find((f) => f.fieldId === id);
    expect(field('nachname')).toMatchObject({ line: 2, coveredBy: [1, 2] });
    expect(field('nachname')).not.toHaveProperty('footnote');
    expect(field('bemerkungen')).toMatchObject({
      value: 'Korrigierte Bemerkung',
      line: 2,
      coveredBy: [2],
      footnote: 2,
    });
    expect(lines[0]?.signedAtLocal).toBe('2026-10-29T10:15:00.000+01:00');
    expect(lines[1]?.signedAtLocal).toBe('2026-10-31T11:00:00.000+01:00');
  });

  it("names the guardian on the guardian's line", () => {
    const { lines } = signatureLayout(minorWithGuardian(), guardianForm().definition);
    expect(lines.find((l) => l.role === 'vertretung')).toMatchObject({
      signerName: 'Max Musterfrau',
      method: 'drawn',
    });
  });
});
