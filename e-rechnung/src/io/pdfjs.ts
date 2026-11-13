// pdf.js in the browser, loaded on first use. The worker code runs in the main thread ("fake
// worker"): file:// forbids blob: workers and the CSP forbids workers altogether.
import type { PdfJsLike } from './pdf';

let loading: Promise<PdfJsLike> | undefined;

export function loadPdfJs(): Promise<PdfJsLike> {
  loading ??= (async () => {
    const [library, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs'),
    ]);
    (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = worker;
    return library as unknown as PdfJsLike;
  })();
  return loading;
}
