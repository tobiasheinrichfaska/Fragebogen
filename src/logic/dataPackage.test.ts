import { beispielRegistry, guardianForm, twoRoles, beispielForm } from '../../tests/support/sample';
import { ORIGIN_MESSAGES, buildPackage, decodePackage, packageText } from './dataPackage';
import { registryOf } from './formRegistry';
import { canonicalize } from './jcs';

const raw = (text: string): unknown => JSON.parse(text);

describe('data package', () => {
  it('round-trips questionnaire and definition, form from the published registry', () => {
    const q = twoRoles();
    const result = decodePackage(
      raw(packageText(buildPackage(q, beispielForm()))),
      beispielRegistry(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('published');
    expect(canonicalize(result.questionnaire)).toBe(canonicalize(q));
    expect(result.form.definitionHash).toBe(beispielForm().definitionHash);
  });

  it('accepts an unchanged definition the app does not publish, and says so', () => {
    const q = twoRoles();
    const result = decodePackage(
      raw(packageText(buildPackage(q, beispielForm()))),
      registryOf([guardianForm()]),
    );
    expect(result).toMatchObject({ ok: true, origin: 'embedded' });
    if (result.ok) expect(result.form.definitionHash).toBe(beispielForm().definitionHash);
    expect(ORIGIN_MESSAGES.embedded).toContain('nicht veröffentlicht');
  });

  it('refuses a definition changed after the questionnaire was started', () => {
    const pkg = buildPackage(twoRoles(), beispielForm());
    const changed = raw(packageText(pkg)) as { definition: { title: string } };
    changed.definition.title = 'Anderer Titel';
    const result = decodePackage(changed, beispielRegistry());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe('$.definition');
  });

  it.each<[string, (p: Record<string, unknown>) => void, string]>([
    [
      'another format',
      (p) => {
        p.format = 'fragebogen';
      },
      '$.format',
    ],
    [
      'another version',
      (p) => {
        p.formatVersion = 2;
      },
      '$.formatVersion',
    ],
    [
      'an unknown key',
      (p) => {
        p.extra = true;
      },
      '$.extra',
    ],
    [
      'a broken questionnaire',
      (p) => {
        (p.questionnaire as Record<string, unknown>).parts = 3;
      },
      '$.questionnaire.parts',
    ],
    [
      'a broken definition',
      (p) => {
        (p.definition as Record<string, unknown>).roles = [];
      },
      '$.definition.roles',
    ],
  ])('refuses %s', (_label, change, path) => {
    const pkg = raw(packageText(buildPackage(twoRoles(), beispielForm()))) as Record<
      string,
      unknown
    >;
    change(pkg);
    const result = decodePackage(pkg, beispielRegistry());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.path)).toContain(path);
  });

  it('refuses to pack a questionnaire with a form it does not belong to', () => {
    expect(() => buildPackage(twoRoles(), guardianForm())).toThrow(RangeError);
  });
});
