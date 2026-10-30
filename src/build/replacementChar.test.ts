import { escapeReplacementChar, REPLACEMENT_CHAR } from './replacementChar';

describe('escapeReplacementChar', () => {
  it('writes the character as an escape that evaluates to the same string', () => {
    const code = `var a=\`${REPLACEMENT_CHAR}\`,b="x${REPLACEMENT_CHAR}y";`;
    const escaped = escapeReplacementChar(code);
    expect(escaped).not.toContain(REPLACEMENT_CHAR);
    const run = (source: string) => new Function(`${source} return [a, b];`)() as string[];
    expect(run(escaped)).toEqual(run(code));
  });

  it('leaves code without the character unchanged', () => {
    expect(escapeReplacementChar('var a = "ok";')).toBe('var a = "ok";');
  });
});
