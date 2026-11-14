// The PDF/A check of the CI (veraPDF, Tobias 2026-11-14 „A ja“): with PDFA_OUT set, the PDF tests
// keep the PDFs they wrote there, so the workflow validates exactly what the app writes. Without it
// nothing is written. Fictitious data only — the CI logs are public.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Writes `bytes` as `name` into the folder PDFA_OUT names; does nothing without it. */
export function keepForPdfa(name: string, bytes: Uint8Array): void {
  const folder = process.env.PDFA_OUT;
  if (folder === undefined || folder === '') return;
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, name), bytes);
}
