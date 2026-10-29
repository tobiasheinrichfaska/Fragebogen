// Strict decoding of untrusted JSON into typed values. Unknown keys, missing values, wrong types and
// invalid strings are reported with their path; nothing is coerced or defaulted. A successfully
// decoded value is therefore canonically identical to its raw input — hashing either gives the
// same digest.
import { isPlainObject, isWellFormed } from './jcs';

export interface DecodeIssue {
  path: string;
  message: string;
}

/**
 * Collects issues while decoding. Every helper returns `undefined` for a rejected value and reports
 * why; an absent (undefined) value counts as a missing required property. Optional properties are
 * therefore only passed in when present.
 */
export class Decoder {
  readonly issues: DecodeIssue[] = [];

  report(path: string, message: string): undefined {
    this.issues.push({ path, message });
    return undefined;
  }

  /** Plain object whose keys are all in `keys`. */
  object(
    value: unknown,
    path: string,
    keys: readonly string[],
  ): Record<string, unknown> | undefined {
    if (value === undefined) return this.missing(path);
    if (!isPlainObject(value)) return this.report(path, 'expected an object');
    for (const key of Object.keys(value)) {
      if (!keys.includes(key)) this.report(`${path}.${key}`, 'unknown property');
    }
    return value;
  }

  /** Non-empty, well-formed, NFC-normalised string, optionally matching `pattern`. */
  string(value: unknown, path: string, pattern?: RegExp): string | undefined {
    if (value === undefined) return this.missing(path);
    if (typeof value !== 'string') return this.report(path, 'expected a string');
    if (value === '') return this.report(path, 'must not be empty');
    if (!isWellFormed(value)) return this.report(path, 'contains an unpaired surrogate');
    if (value.normalize('NFC') !== value) return this.report(path, 'must be NFC-normalised');
    if (pattern && !pattern.test(value)) return this.report(path, `must match ${String(pattern)}`);
    return value;
  }

  integer(value: unknown, path: string, min = 0): number | undefined {
    if (value === undefined) return this.missing(path);
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min) {
      return this.report(path, `expected an integer ≥ ${min}`);
    }
    return value;
  }

  boolean(value: unknown, path: string): boolean | undefined {
    if (value === undefined) return this.missing(path);
    return typeof value === 'boolean' ? value : this.report(path, 'expected a boolean');
  }

  literal<T extends string>(value: unknown, path: string, allowed: readonly T[]): T | undefined {
    if (value === undefined) return this.missing(path);
    const match = allowed.find((candidate) => candidate === value);
    return match ?? this.report(path, `expected one of: ${allowed.join(', ')}`);
  }

  array<T>(
    value: unknown,
    path: string,
    item: (value: unknown, path: string) => T | undefined,
    minLength = 0,
  ): T[] | undefined {
    if (value === undefined) return this.missing(path);
    if (!Array.isArray(value)) return this.report(path, 'expected an array');
    if (value.length < minLength) return this.report(path, `needs at least ${minLength} item(s)`);
    const items: T[] = [];
    value.forEach((element: unknown, index) => {
      const decoded = item(element, `${path}[${index}]`);
      if (decoded !== undefined) items.push(decoded);
    });
    return items.length === value.length ? items : undefined;
  }

  /** Object used as a map; every key must match `keyPattern`. */
  record<T>(
    value: unknown,
    path: string,
    keyPattern: RegExp,
    item: (value: unknown, path: string) => T | undefined,
  ): Record<string, T> | undefined {
    if (value === undefined) return this.missing(path);
    if (!isPlainObject(value)) return this.report(path, 'expected an object');
    const entries: [string, T][] = [];
    let complete = true;
    for (const [key, element] of Object.entries(value)) {
      const decoded = keyPattern.test(key)
        ? item(element, `${path}.${key}`)
        : this.report(`${path}.${key}`, `key must match ${String(keyPattern)}`);
      if (decoded === undefined) complete = false;
      else entries.push([key, decoded]);
    }
    // fromEntries defines own properties, so even a "__proto__" key could never touch the prototype.
    return complete ? Object.fromEntries(entries) : undefined;
  }

  private missing(path: string): undefined {
    return this.report(path, 'missing required property');
  }
}
