// Files in and out. Downloads go through a short-lived blob URL that is revoked right after the
// click; imports are size-limited before anything is parsed.
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
