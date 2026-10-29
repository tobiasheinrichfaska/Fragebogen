// JSON Canonicalization Scheme (RFC 8785): object keys sorted by UTF-16 code units, ECMAScript
// number and string formatting, no whitespace. Anything JSON cannot represent unambiguously
// (undefined, NaN, sparse arrays, class instances, unpaired surrogates) is rejected instead of
// being silently dropped or coerced the way JSON.stringify would.

export type JsonValue =
  null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/** Guards against stack exhaustion on hostile input; real documents stay far below. */
export const MAX_DEPTH = 64;

export class CanonicalizationError extends Error {
  readonly path: string;

  constructor(message: string, path: string) {
    super(`${message} (at ${path})`);
    this.name = 'CanonicalizationError';
    this.path = path;
  }
}

/** False when the string contains an unpaired UTF-16 surrogate, which has no UTF-8 encoding. */
export function isWellFormed(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      i++;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

/**
 * Object literal or JSON.parse result, also from another realm (structuredClone, test VMs): its
 * prototype is null or a realm's Object.prototype. Class instances, Date, Map etc. do not qualify.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

export function canonicalize(value: unknown): string {
  return serialize(value, '$', 0);
}

function serialize(value: unknown, path: string, depth: number): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) throw new CanonicalizationError('Number is not finite', path);
      // JSON.stringify applies ECMAScript Number::toString, exactly as RFC 8785 § 3.2.2.3 requires.
      return JSON.stringify(value);
    case 'string':
      return serializeString(value, path);
    case 'object':
      break;
    default:
      throw new CanonicalizationError(`Unsupported type ${typeof value}`, path);
  }
  if (depth >= MAX_DEPTH) throw new CanonicalizationError('Nesting too deep', path);

  if (Array.isArray(value)) {
    const items: string[] = [];
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${path}[${i}]`;
      if (!(i in value)) throw new CanonicalizationError('Sparse array', itemPath);
      items.push(serialize(value[i], itemPath, depth + 1));
    }
    return `[${items.join(',')}]`;
  }

  if (!isPlainObject(value)) throw new CanonicalizationError('Not a plain object', path);
  const record = value;
  const members = Object.keys(record)
    .sort()
    .map((key) => {
      const memberPath = memberPathOf(path, key);
      return `${serializeString(key, memberPath)}:${serialize(record[key], memberPath, depth + 1)}`;
    });
  return `{${members.join(',')}}`;
}

function serializeString(value: string, path: string): string {
  if (!isWellFormed(value)) throw new CanonicalizationError('Unpaired surrogate in string', path);
  // For well-formed strings JSON.stringify escapes exactly as RFC 8785 § 3.2.2.2 prescribes.
  return JSON.stringify(value);
}

function memberPathOf(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}
