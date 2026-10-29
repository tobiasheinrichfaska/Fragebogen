import { MAX_FILE_NAME, fileNameFor, safeFileName } from './fileNames';

describe('safeFileName (Gemeinsame Grundsätze § 9a BVV)', () => {
  it('transliterates umlauts and ß and replaces everything else by "_"', () => {
    expect(safeFileName(['Größe & Maße', 'Übergabe.pdf', 'Café'])).toBe(
      'Groesse_Masse_Uebergabe_pdf_Cafe',
    );
  });

  it('never exceeds 64 characters and never ends with "_"', () => {
    const name = safeFileName(['a'.repeat(40), 'b'.repeat(40)]);
    expect(name.length).toBeLessThanOrEqual(MAX_FILE_NAME);
    expect(name).not.toMatch(/_$/);
  });

  it('falls back to a neutral name', () => {
    expect(safeFileName(['...', ''])).toBe('Fragebogen');
  });
});

describe('fileNameFor', () => {
  const id = '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c';

  it.each<[Parameters<typeof fileNameFor>[2], string]>([
    ['interim', 'Sofortmeldung_3f2b8c1e_Zwischenstand.json'],
    ['handover', 'Sofortmeldung_3f2b8c1e_Weitergabe.pdf'],
    ['complete', 'Sofortmeldung_3f2b8c1e_vollstaendig.pdf'],
  ])('%s → %s', (kind, name) => {
    expect(fileNameFor('sofortmeldung', id, kind)).toBe(name);
  });

  it('names multi-word forms in camel case and keeps the rules', () => {
    const name = fileNameFor('minijob-kurzfristig', id, 'handover');
    expect(name).toBe('MinijobKurzfristig_3f2b8c1e_Weitergabe.pdf');
    expect(name.replace(/\.pdf$/, '')).toMatch(/^[A-Za-z0-9_]{1,64}$/);
  });
});
