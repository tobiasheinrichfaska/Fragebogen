// Reading PDFs with pdf.js (passed in: the browser build in the app, the legacy build in Node
// tests). Text is grouped into visual lines by y position — the data pages are decoded from that.
// Clues of later editing (an appended update, a foreign producer) become warnings; for scans the
// pages are rendered to images and searched for QR codes.
import type { RgbaImage } from './qr';

export const MAX_PDF_PAGES = 80;
const APP_PRODUCER = /^Fragebogen \d+\.\d+\.\d+/;

interface TextItemLike {
  str: string;
  transform: number[];
  width: number;
}

interface PageLike {
  getTextContent(): Promise<{ items: unknown[] }>;
  getViewport(options: { scale: number }): { width: number; height: number };
  render(options: { canvasContext: unknown; viewport: unknown; canvas?: unknown }): {
    promise: Promise<void>;
  };
  cleanup(): void;
}

interface DocumentLike {
  numPages: number;
  getPage(n: number): Promise<PageLike>;
  getMetadata(): Promise<{ info?: Record<string, unknown> }>;
}

export interface PdfJsLike {
  getDocument(options: Record<string, unknown>): {
    promise: Promise<DocumentLike>;
    destroy(): Promise<void>;
  };
}

export interface PdfText {
  lines: string[];
  pages: number;
  producer?: string;
}

function open(pdfjs: PdfJsLike, bytes: Uint8Array, password?: string) {
  return pdfjs.getDocument({
    data: bytes.slice(),
    ...(password === undefined ? {} : { password }),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });
}

export async function readPdfText(pdfjs: PdfJsLike, bytes: Uint8Array): Promise<PdfText> {
  const task = open(pdfjs, bytes);
  try {
    const pdf = await task.promise;
    const lines: string[] = [];
    const count = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let n = 1; n <= count; n++) {
      const page = await pdf.getPage(n);
      lines.push(...groupLines((await page.getTextContent()).items));
      page.cleanup();
    }
    const info = (await pdf.getMetadata()).info;
    const producer = typeof info?.Producer === 'string' ? info.Producer : undefined;
    return { lines, pages: pdf.numPages, ...(producer === undefined ? {} : { producer }) };
  } finally {
    await task.destroy();
  }
}

/** Groups text pieces into visual lines (top to bottom, left to right). */
export function groupLines(items: readonly unknown[]): string[] {
  const pieces = items.filter(
    (item): item is TextItemLike =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as TextItemLike).str === 'string' &&
      (item as TextItemLike).str.length > 0,
  );
  const rows = new Map<number, TextItemLike[]>();
  for (const piece of pieces) {
    const y = Math.round((piece.transform[5] ?? 0) * 2) / 2;
    let key = y;
    for (const known of rows.keys()) if (Math.abs(known - y) < 1.5) key = known;
    rows.set(key, [...(rows.get(key) ?? []), piece]);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => {
      row.sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0));
      let text = '';
      let end = -Infinity;
      for (const piece of row) {
        const x = piece.transform[4] ?? 0;
        if (text && x - end > 1 && !/\s$/.test(text) && !/^\s/.test(piece.str)) text += ' ';
        text += piece.str;
        end = x + piece.width;
      }
      return text;
    });
}

export type EditClue = 'appendedUpdate' | 'foreignProducer';

export const EDIT_CLUE_MESSAGES: Readonly<Record<EditClue, string>> = {
  appendedUpdate:
    'Die PDF wurde nach dem Erstellen verändert oder ergänzt (zum Beispiel kommentiert oder signiert). Geprüft werden trotzdem die Datenseiten.',
  foreignProducer:
    'Die PDF wurde mit einem anderen Programm neu gespeichert. Geprüft werden trotzdem die Datenseiten.',
};

/** Hints that a PDF was changed after the app wrote it — never proof, only a warning. */
export function editClues(bytes: Uint8Array, producer: string | undefined): EditClue[] {
  const clues: EditClue[] = [];
  let eof = 0;
  for (let i = 0; i + 4 < bytes.length; i++) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x25 &&
      bytes[i + 2] === 0x45 &&
      bytes[i + 3] === 0x4f &&
      bytes[i + 4] === 0x46
    )
      eof++;
  }
  if (eof > 1) clues.push('appendedUpdate');
  if (producer !== undefined && !APP_PRODUCER.test(producer)) clues.push('foreignProducer');
  return clues;
}

/** Renders the pages to RGBA images for the QR search (browser only: needs a canvas). */
export async function renderPdfPages(
  pdfjs: PdfJsLike,
  bytes: Uint8Array,
  longestSide = 2400,
): Promise<RgbaImage[]> {
  const task = open(pdfjs, bytes);
  try {
    const pdf = await task.promise;
    const images: RgbaImage[] = [];
    for (let n = 1; n <= Math.min(pdf.numPages, MAX_PDF_PAGES); n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: longestSide / Math.max(base.width, base.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) continue;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const data = context.getImageData(0, 0, canvas.width, canvas.height);
      images.push({ data: data.data, width: data.width, height: data.height });
      page.cleanup();
    }
    return images;
  } finally {
    await task.destroy();
  }
}

/** A photo or scan image as RGBA, scaled down to `longestSide` (browser only). */
export async function imageFileToRgba(file: Blob, longestSide = 2400): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, longestSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas not available');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  return { data: data.data, width: data.width, height: data.height };
}
