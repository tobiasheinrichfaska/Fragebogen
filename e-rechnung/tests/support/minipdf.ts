// A minimal PDF writer for test files: one A4 page with an optional line of text and any number
// of embedded files (EmbeddedFiles name tree + /AF, as Factur-X/ZUGFeRD place the invoice XML).
// Own edge cases (plain PDF, foreign attachment, several XML) without third-party samples.

export interface Attachment {
  name: string;
  bytes: Uint8Array;
  /** e.g. text/xml, written as /Subtype */
  mime?: string;
  /** Factur-X uses Alternative (or Data / Source) */
  relationship?: 'Alternative' | 'Data' | 'Source' | 'Supplement' | 'Unspecified';
  description?: string;
}

export interface MiniPdfOptions {
  text?: string;
  attachments?: Attachment[];
  /**
   * Adds a standard security handler (RC4, revision 2) whose user password is not empty, so a
   * reader needs a password to open the file. The content itself stays unencrypted — enough
   * for a reader to ask for the password, which is all the tests need.
   */
  passwordProtected?: boolean;
}

const HEX_32 = 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90';

const latin1 = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xff);
const literal = (text: string) => `(${text.replace(/[\\()]/g, (c) => `\\${c}`)})`;
const pdfName = (text: string) =>
  `/${text.replace(/[^A-Za-z0-9.-]/g, (c) => `#${c.charCodeAt(0).toString(16).padStart(2, '0')}`)}`;

export function miniPdf(options: MiniPdfOptions = {}): Uint8Array {
  const attachments = [...(options.attachments ?? [])].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  const objects: Uint8Array[][] = [];
  const add = (parts: (string | Uint8Array)[]) => {
    objects.push(parts.map((p) => (typeof p === 'string' ? latin1(p) : p)));
    return objects.length;
  };

  // Reserve 1 catalog, 2 pages, 3 page, 4 content, 5 font; attachments follow.
  const content = options.text ? `BT /F1 12 Tf 72 770 Td ${literal(options.text)} Tj ET` : '';
  const specIds: number[] = [];
  objects.length = 5;
  for (const file of attachments) {
    const streamId = add([
      `<< /Type /EmbeddedFile${file.mime ? ` /Subtype ${pdfName(file.mime)}` : ''} /Length ${file.bytes.byteLength} >>\nstream\n`,
      file.bytes,
      '\nendstream',
    ]);
    const specId = add([
      `<< /Type /Filespec /F ${literal(file.name)} /UF ${literal(file.name)} /EF << /F ${streamId} 0 R >>`,
      file.relationship ? ` /AFRelationship /${file.relationship}` : '',
      file.description ? ` /Desc ${literal(file.description)}` : '',
      ' >>',
    ]);
    specIds.push(specId);
  }

  const names = attachments.map((file, i) => `${literal(file.name)} ${specIds[i]} 0 R`).join(' ');
  const catalogExtra = attachments.length
    ? ` /Names << /EmbeddedFiles << /Names [${names}] >> >> /AF [${specIds.map((id) => `${id} 0 R`).join(' ')}]`
    : '';
  objects[0] = [latin1(`<< /Type /Catalog /Pages 2 0 R${catalogExtra} >>`)];
  objects[1] = [latin1('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')];
  objects[2] = [
    latin1(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    ),
  ];
  objects[3] = [latin1(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)];
  objects[4] = [latin1('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')];
  const encryptId = options.passwordProtected
    ? add([`<< /Filter /Standard /V 1 /R 2 /O <${HEX_32}> /U <${HEX_32}> /P -44 >>`])
    : undefined;
  const trailerExtra = encryptId
    ? ` /Encrypt ${encryptId} 0 R /ID [<00112233445566778899AABBCCDDEEFF> <00112233445566778899AABBCCDDEEFF>]`
    : '';

  const header = latin1('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n');
  const chunks: Uint8Array[] = [header];
  let offset = header.byteLength;
  const offsets: number[] = [];
  objects.forEach((parts, index) => {
    offsets.push(offset);
    const head = latin1(`${index + 1} 0 obj\n`);
    const tail = latin1('\nendobj\n');
    for (const part of [head, ...parts, tail]) {
      chunks.push(part);
      offset += part.byteLength;
    }
  });
  const xref = [
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`,
    ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${trailerExtra} >>\nstartxref\n${offset}\n%%EOF\n`,
  ].join('');
  chunks.push(latin1(xref));

  const out = new Uint8Array(chunks.reduce((sum, c) => sum + c.byteLength, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}
