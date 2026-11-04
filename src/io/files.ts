// Files in and out. Downloads go through a short-lived blob URL that is revoked right after the
// click; imports are size-limited before anything is parsed.
import { deliveryFor, type Delivery } from '../logic/delivery';

export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

export function downloadFile(name: string, content: Uint8Array | string, mime: string): void {
  const blob = new Blob([typeof content === 'string' ? content : content.slice()], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL disappears.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A file the app hands out: downloaded, shared or saved on request (see logic/delivery.ts). */
export interface OutFile {
  name: string;
  content: Uint8Array | string;
  mime: string;
  delivery: Delivery;
}

const asFile = (out: Pick<OutFile, 'name' | 'content' | 'mime'>): File =>
  new File([typeof out.content === 'string' ? out.content : out.content.slice()], out.name, {
    type: out.mime,
  });

function canShareFile(file: File): boolean {
  try {
    return (
      typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] }) === true
    );
  } catch {
    return false;
  }
}

function touchFirst(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/** Decides how the file reaches the person and downloads it at once where that is the way. */
export function handOut(name: string, content: Uint8Array | string, mime: string): OutFile {
  const delivery = deliveryFor({
    canShare: canShareFile(asFile({ name, content, mime })),
    touchFirst: touchFirst(),
  });
  if (delivery.download) downloadFile(name, content, mime);
  return { name, content, mime, delivery };
}

/** The device's share sheet; a refused or failed share falls back to the download. */
export async function shareFile(out: OutFile): Promise<'shared' | 'cancelled' | 'downloaded'> {
  try {
    await navigator.share({ files: [asFile(out)], title: out.name });
    return 'shared';
  } catch (error) {
    // The person closed the share sheet: nothing to do. Anything else: download instead.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    downloadFile(out.name, out.content, out.mime);
    return 'downloaded';
  }
}

export type ReadResult = { ok: true; bytes: Uint8Array } | { ok: false; message: string };

export async function readFileBytes(file: File): Promise<ReadResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, message: 'Die Datei ist zu groß (höchstens 25 MB).' };
  }
  try {
    return { ok: true, bytes: new Uint8Array(await file.arrayBuffer()) };
  } catch {
    return { ok: false, message: 'Die Datei lässt sich nicht lesen.' };
  }
}
