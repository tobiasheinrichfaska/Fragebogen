// Reading the embedded files of a PDF with pdf.js (passed in: the browser build with a main-thread
// "fake worker" in the app, the legacy build in Node tests). Only the attachments are read; the
// page content is never interpreted — for an e-invoice the XML is what counts.
// pdf.js 6 lists attachments as a Map without content (name, description) and hands the bytes
// out per name with getAttachmentContent — earlier versions returned a plain object with `content`.

export const MAX_PDF_BYTES = 30 * 1024 * 1024;
export const MAX_ATTACHMENTS = 50;

interface AttachmentInfo {
  filename?: string;
  rawFilename?: string;
  description?: string;
}

interface DocumentLike {
  numPages: number;
  getAttachments(): Promise<
    ReadonlyMap<string, AttachmentInfo> | Record<string, AttachmentInfo> | null
  >;
  getAttachmentContent(id: string): Promise<Uint8Array | null | undefined>;
}

interface LoadingTaskLike {
  promise: Promise<DocumentLike>;
  destroy(): Promise<void>;
}

export interface PdfJsLike {
  getDocument(options: Record<string, unknown>): LoadingTaskLike;
}

export interface PdfAttachment {
  name: string;
  bytes: Uint8Array;
  description?: string;
}

export type PdfRead =
  | {
      ok: true;
      pages: number;
      attachments: PdfAttachment[];
      /** Listed attachments whose content could not be read */
      unreadable: string[];
      truncated: boolean;
    }
  | { ok: false; issue: 'tooLarge' | 'password' | 'damaged'; detail?: string };

/** pdf.js rejects a protected file with a PasswordException (code 1 or 2). */
function isPasswordError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'PasswordException'
  );
}

export async function readPdfAttachments(pdfjs: PdfJsLike, bytes: Uint8Array): Promise<PdfRead> {
  if (bytes.byteLength > MAX_PDF_BYTES) return { ok: false, issue: 'tooLarge' };
  const task = pdfjs.getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: false,
    verbosity: 0,
  });
  try {
    let doc: DocumentLike;
    try {
      doc = await task.promise;
    } catch (error) {
      if (isPasswordError(error)) return { ok: false, issue: 'password' };
      return {
        ok: false,
        issue: 'damaged',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    const list = (await doc.getAttachments()) ?? {};
    const listed: [string, AttachmentInfo][] =
      list instanceof Map ? [...list.entries()] : Object.entries(list);
    const attachments: PdfAttachment[] = [];
    const unreadable: string[] = [];
    for (const [id, info] of listed.slice(0, MAX_ATTACHMENTS)) {
      const name = info.filename ?? info.rawFilename ?? id;
      const content = await doc.getAttachmentContent(id).catch(() => undefined);
      if (!content) {
        unreadable.push(name);
        continue;
      }
      attachments.push({
        name,
        bytes: content,
        ...(info.description ? { description: info.description } : {}),
      });
    }
    return {
      ok: true,
      pages: doc.numPages,
      attachments,
      unreadable,
      truncated: listed.length > MAX_ATTACHMENTS,
    };
  } finally {
    await task.destroy().catch(() => undefined);
  }
}
