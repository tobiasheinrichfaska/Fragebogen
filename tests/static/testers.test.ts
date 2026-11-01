// Tester management for the hosted test folder (Tobias 2026-11-01): Apache .htpasswd built on the PC.
import {
  DEFAULT_ROUNDS,
  TESTER_NAME,
  changeTesters,
  passwordFromStdin,
  htpasswd,
  newPassword,
  parseTesters,
  sha512Crypt,
  type Tester,
} from '../../deploy/testers';

// Test vectors of Ulrich Drepper's specification, https://www.akkadia.org/drepper/SHA-crypt.txt
// (the same in glibc's sha512c-test.c).
const VECTORS: readonly [string, string, number | undefined, string][] = [
  [
    'Hello world!',
    'saltstring',
    undefined,
    '$6$saltstring$svn8UoSVapNtMuq1ukKS4tPQd8iKwSMHWjl/O817G3uBnIFNjnQJuesI68u4OTLiBFdcbYEdFCoEOfaS35inz1',
  ],
  [
    'Hello world!',
    'saltstringsaltstring',
    10000,
    '$6$rounds=10000$saltstringsaltst$OW1/O6BYHV6BcXZu8QVeXbDWra3Oeqh0sbHbbMCVNSnCM/UrjmM0Dp8vOuZeHBy/YTBmSK6H9qs/y3RnOaw5v.',
  ],
  [
    'This is just a test',
    'toolongsaltstring',
    5000,
    '$6$rounds=5000$toolongsaltstrin$lQ8jolhgVRVhY4b5pZKaysCLi0QBxGoNeKQzQ3glMhwllF7oGDZxUhx1yxdYcz/e1JSbq3y6JMxxl8audkUEm0',
  ],
  [
    'a very much longer text to encrypt.  This one even stretches over morethan one line.',
    'anotherlongsaltstring',
    1400,
    '$6$rounds=1400$anotherlongsalts$POfYwTEok97VWcjxIiSOjiykti.o/pQs.wPvMxQ6Fm7I6IoYN3CmLs66x9t0oSwbtEW7o7UmJEiDwGqd8p4ur1',
  ],
  [
    'we have a short salt string but not a short password',
    'short',
    77777,
    '$6$rounds=77777$short$WuQyW2YR.hBNpjjRhpYD/ifIw05xdfeEyQoMxIXbkvr0gge1a1x3yRULJ5CCaUeOxFmtlcGZelFl5CxtgfiAc0',
  ],
  [
    'a short string',
    'asaltof16chars..',
    123456,
    '$6$rounds=123456$asaltof16chars..$BtCwjqMJGx5hrJhZywWvt0RLE8uZ4oPwcelCjmw2kSYu.Ec6ycULevoBK25fs2xXgMNrCzIMVcgEJAstJeonj1',
  ],
  [
    'the minimum number is still observed',
    'roundstoolow',
    10,
    '$6$rounds=1000$roundstoolow$kUMsbe306n21p9R.FRkW3IGn.S9NPN0x50YhH1xhLsPuWGsUSklZt58jaTfF4ZEQpyUNGc0dqbpBYYBaHHrsX.',
  ],
];

describe('sha512Crypt', () => {
  it.each(VECTORS)('matches the specification for "%s"', (password, salt, rounds, expected) => {
    expect(sha512Crypt(password, salt, rounds)).toBe(expected);
  });
});

// A fixed "random" source: counts up, so passwords and salts are reproducible.
function counting(start = 0): (n: number) => Uint8Array {
  let next = start;
  return (n) => Uint8Array.from({ length: n }, () => next++ % 256);
}

describe('newPassword', () => {
  it('gives three groups of four from an alphabet without look-alikes', () => {
    const password = newPassword(counting());
    expect(password).toMatch(/^[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}$/);
    expect(password).not.toMatch(/[01ilo]/);
  });

  it('skips the bytes that would make some characters more likely', () => {
    const high = () => Uint8Array.from({ length: 16 }, (_v, i) => (i < 8 ? 250 : 31));
    expect(newPassword(high)).toBe('aaaa-aaaa-aaaa');
  });
});

describe('changeTesters', () => {
  const today = '2026-11-01';
  const add = (list: readonly Tester[], name: string) => {
    const result = changeTesters(list, 'neu', name, today, counting());
    if (!result.ok) throw new Error(result.message);
    return result;
  };

  // Regression 2026-11-01: PowerShell 5.1 pipes "\u{FEFF}…\r\n" even with UTF-8 "without BOM".
  it('reads a password from stdin without the BOM and line end PowerShell adds', () => {
    expect(passwordFromStdin('\u{FEFF}Abc-Prüf-2026\r\n')).toBe('Abc-Prüf-2026');
    expect(passwordFromStdin('Abc-Prüf-2026\n')).toBe('Abc-Prüf-2026');
    expect(passwordFromStdin(' mit Leerzeichen \r\n')).toBe(' mit Leerzeichen ');
  });

  // Tobias 2026-11-01: "Passwort gebe ich in einen Dialog ein".
  it('takes a password typed by hand, keeps only its hash and does not show it again', () => {
    const result = changeTesters([], 'neu', 'tanja', today, counting(), 'Sommer-Test-2026');
    if (!result.ok) throw new Error(result.message);
    expect(result).not.toHaveProperty('password');
    const hash = result.testers[0]?.hash ?? '';
    expect(sha512Crypt('Sommer-Test-2026', hash.split('$')[3] ?? '', DEFAULT_ROUNDS)).toBe(hash);
    const reset = changeTesters(
      result.testers,
      'passwort',
      'tanja',
      today,
      counting(50),
      'Winter-Test-2026',
    );
    expect(reset.ok && reset.testers[0]?.hash).not.toBe(hash);
  });

  it.each([
    ['too short', 'kurz123', 'mindestens 10 Zeichen'],
    ['with a space at the end', 'Sommer-Test-2026 ', 'Leerzeichen'],
    ['with a line break', 'Sommer\nTest-2026', 'Zeilenumbruch'],
  ])('refuses a typed password %s', (_label, password, message) => {
    const result = changeTesters([], 'neu', 'tanja', today, counting(), password);
    expect(result.ok ? '' : result.message).toContain(message);
  });

  it('adds a tester with a hash only and shows the password once', () => {
    const result = add([], 'erika.m');
    expect(result.testers).toEqual([
      { name: 'erika.m', hash: expect.stringMatching(/^\$6\$rounds=50000\$/), created: today },
    ]);
    const [tester] = result.testers;
    const salt = tester?.hash.split('$')[3] ?? '';
    expect(sha512Crypt(result.password ?? '', salt, DEFAULT_ROUNDS)).toBe(tester?.hash);
    expect(JSON.stringify(result.testers)).not.toContain(result.password);
  });

  it('locks a tester out of the .htpasswd and lets them in again', () => {
    const list = add(add([], 'anna').testers, 'ben').testers;
    const locked = changeTesters(list, 'sperren', 'ANNA', today);
    expect(locked.ok && htpasswd(locked.testers)).toBe(`ben:${list[1]?.hash}\n`);
    const back = locked.ok ? changeTesters(locked.testers, 'entsperren', 'anna', today) : locked;
    expect(back.ok && back.testers).toEqual(list);
  });

  it('gives a new password and a new hash', () => {
    const list = add([], 'anna').testers;
    const reset = changeTesters(list, 'passwort', 'anna', today, counting(100));
    expect(reset.ok && reset.testers[0]?.hash).not.toBe(list[0]?.hash);
    expect(reset.ok && reset.password).toMatch(/^.{4}-.{4}-.{4}$/);
  });

  it.each<[string, string, string]>([
    ['neu', 'a', '2 bis 32 Zeichen'],
    ['neu', 'erika:m', '2 bis 32 Zeichen'],
    ['neu', 'Anna', 'gibt es schon'],
    ['loeschen', 'zoe', 'gibt es nicht'],
    ['umbenennen', 'anna', 'Unbekannte Aktion'],
  ])('refuses %s „%s“', (action, name, message) => {
    const result = changeTesters(add([], 'anna').testers, action, name, today);
    expect(result.ok ? '' : result.message).toContain(message);
  });

  it('accepts sensible login names only', () => {
    expect(['anna', 'erika.m', 'tester_7', 'B-2'].every((n) => TESTER_NAME.test(n))).toBe(true);
    expect(['', 'x', 'mit leer', 'ä', 'a:b'].some((n) => TESTER_NAME.test(n))).toBe(false);
  });

  it('reads only well-formed entries of the local file', () => {
    expect(
      parseTesters([{ name: 'a', hash: 'h', created: 'd', locked: true }, { name: 1 }, null]),
    ).toEqual([{ name: 'a', hash: 'h', created: 'd', locked: true }]);
    expect(parseTesters({})).toEqual([]);
  });
});
