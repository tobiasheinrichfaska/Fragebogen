// Stands in for `testbereich.tsx` in every build but the test folder (vite.config.ts): Vite collects
// the styles of every imported module before it drops dead code, so without this the live build
// would carry the shared test page's styles. It is never called there.
export function startTestArea(): void {
  throw new Error('Der Testbereich gehört nur zur Testfassung.');
}
