// The on-screen keyboard per field type (iPhone test report, Tobias 2026-11-01): the plain numeric
// keypad of iOS has no dot or comma, so a date typed as "17.05.1990" could not be entered.
import { INPUT_MODE } from '../../src/ui/fieldKinds';

describe('keyboards of typed fields', () => {
  it('opens a keypad with a separator for dates, months and amounts', () => {
    expect(INPUT_MODE.date).toBe('decimal');
    expect(INPUT_MODE.month).toBe('decimal');
    expect(INPUT_MODE.money).toBe('decimal');
  });

  it('keeps the plain numeric keypad only where digits are all there is', () => {
    expect(INPUT_MODE.taxId).toBe('numeric');
    expect(INPUT_MODE.betriebsnummer).toBe('numeric');
  });
});
