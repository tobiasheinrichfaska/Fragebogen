// The lines the Kanzlei reads: one text on its screen and on the check sheet of the PDF (2026-11-14,
// before they were built in both places).
import { proposalLine, type DerivationResult } from './derivations';
import { hintLine, type HintResult } from './hints';

const proposal = (over: Partial<DerivationResult>): DerivationResult => ({
  id: 'personengruppe',
  label: 'Personengruppe',
  status: 'proposed',
  value: '109',
  reason: 'Minijob.',
  check: false,
  detail: [],
  ...over,
});

describe('proposalLine', () => {
  it('names label, value, reason and facts', () => {
    expect(proposalLine(proposal({ detail: ['12 × 520,00 € = 6.240,00 € im Jahr.'] }))).toBe(
      'Personengruppe: 109 – Minijob. 12 × 520,00 € = 6.240,00 € im Jahr.',
    );
  });

  it('asks for a check only of a proposal', () => {
    expect(proposalLine(proposal({ check: true }))).toBe(
      'Personengruppe: 109 – Minijob. Bitte prüfen.',
    );
    const incomplete = proposal({ check: true, status: 'incomplete' });
    delete incomplete.value;
    expect(proposalLine(incomplete)).toBe('Personengruppe: – – Minijob.');
  });
});

describe('hintLine', () => {
  const hint = (over: Partial<HintResult>): HintResult => ({
    id: 'h',
    message: 'Bescheid anfordern.',
    detail: [],
    ...over,
  });

  it('adds the facts and names the source in brackets', () => {
    expect(hintLine(hint({ detail: ['Stand 2026.'], source: '§ 8 SGB IV' }))).toBe(
      'Bescheid anfordern. Stand 2026. (§ 8 SGB IV)',
    );
    expect(hintLine(hint({}))).toBe('Bescheid anfordern.');
  });
});
