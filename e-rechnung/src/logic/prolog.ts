// The prolog of an XML file: everything before the root element. E-invoices never carry a
// document type declaration; refusing one before the XML engine sees the file rules out entity
// expansion and external-entity tricks, whatever the engine's defaults are.

export type ByteEncoding = 'utf-8' | 'utf-16le' | 'utf-16be';

/** The encoding a byte-order mark announces; UTF-8 without one (the XML default). */
export function encodingByBom(bytes: Uint8Array): ByteEncoding {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  return 'utf-8';
}

/** Decodes as far as needed to read the prolog; undecodable bytes become U+FFFD. */
export function textOf(bytes: Uint8Array): string {
  return new TextDecoder(encodingByBom(bytes)).decode(bytes);
}

export type PrologScan =
  { kind: 'root'; at: number } | { kind: 'doctype'; at: number } | { kind: 'noRoot' };

/** XML name start: ASCII letter, underscore, colon or any character from U+00C0 on. */
function isNameStart(char: string): boolean {
  return /[A-Za-z_:]/.test(char) || (char.length > 0 && char.charCodeAt(0) >= 0xc0);
}

/**
 * Walks the prolog: XML declaration, processing instructions, comments and whitespace. Stops at
 * the root element, at a document type declaration, or at anything that cannot start XML.
 */
export function scanProlog(text: string): PrologScan {
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  for (;;) {
    while (i < text.length && /\s/.test(text.charAt(i))) i += 1;
    if (i >= text.length) return { kind: 'noRoot' };
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i + 2);
      if (end < 0) return { kind: 'noRoot' };
      i = end + 2;
    } else if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4);
      if (end < 0) return { kind: 'noRoot' };
      i = end + 3;
    } else if (text.startsWith('<!DOCTYPE', i)) {
      return { kind: 'doctype', at: i };
    } else if (text.charAt(i) === '<' && isNameStart(text.charAt(i + 1))) {
      return { kind: 'root', at: i };
    } else {
      return { kind: 'noRoot' };
    }
  }
}

/** Whether the bytes start like an XML document (used to find XML among PDF attachments). */
export function looksLikeXml(bytes: Uint8Array): boolean {
  return scanProlog(textOf(bytes.subarray(0, 64 * 1024))).kind !== 'noRoot';
}
