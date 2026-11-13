# CLAUDE.md — E-Rechnung prüfen (`e-rechnung/`)

> Workspace-wide conventions (language, git, build, architecture, testing, collaboration):
> [`c:\skripte\private\general stuff\CLAUDE.md`](../../../private/general%20stuff/CLAUDE.md)
>
> Parent repo: [`../CLAUDE.md`](../CLAUDE.md) (Fragebogen). This sub-project shares the repo, the
> licence and the hosting subdomain, **nothing else**: own `package.json`, build, tests and upload
> target. Never change the Fragebogen app from here; never import from `../src/`.

---

## Project overview

A browser tool for clients of the Kanzlei: a file (PDF or XML) is dropped in and the tool shows
whether it is an e-invoice (syntax UBL/CII, profile), whether the XML matches the official XSD,
which **Pflichtangaben** (§ 14 Abs. 4 UStG and related) it carries with their values, and whether a
selected set of amounts adds up. Results are **hints, never an approval**.

**Fixed frame (hand-over 2026-11-13):**

- Browser only, **one HTML file**; no network at run time, no CDN; all libraries bundled.
- **No storage at all** (no localStorage, IndexedDB, cookies): other apps live on the same origin
  and their data and "delete all data on this device" must stay untouched.
- Development phase: only in `NebenprojektERechnung/` (office IPs or tester login), not linked.
- UI German, Sie-form, simple sentences, style like the Fragebogen app.
- **Tax questions are never decided by Claude** — collect them in `docs/offene-fragen.md` for Tobias.

**Non-goals:** no full validator (no rebuild of all CEN/KoSIT/FeRD Schematron rules), no XRechnung
BR-DE rules as errors (B2B needs no XRechnung), no PDF/A check, no tax judgement of content, no
online VAT-ID lookup.

**Workflow (Tobias 2026-11-13):** commit without asking and report the commits; **push and upload
only after his explicit OK**. Another session may be working in the parent repo at the same time:
never switch branches, commit only own paths (`git commit -- e-rechnung/ …`), never `git add -A`.

- Plan and step status: [`docs/plan.md`](docs/plan.md) (German)
- Sources, versions, licences, SHA-256: [`docs/quellen.md`](docs/quellen.md)
- Open and decided tax questions: [`docs/offene-fragen.md`](docs/offene-fragen.md)

---

## Project Directory

| File/Folder                                                | Purpose                                                                                                                                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                | This file                                                                                                                                                                         |
| `README.md`                                                | Public description (German), licence pointer                                                                                                                                      |
| `FEATURES_REQUIRED.md`                                     | Critical user paths                                                                                                                                                               |
| `package.json` / `package-lock.json`                       | Scripts and exactly pinned dependencies (versions as in the Fragebogen app)                                                                                                       |
| `vite.config.ts`                                           | Vite + single-file build, CSP plugin, Vitest config (`pool: 'forks'` for pdf.js)                                                                                                  |
| `tsconfig.json`                                            | Strict TS like the Fragebogen app                                                                                                                                                 |
| `eslint.config.js`                                         | Layering (`src/logic` free of UI/IO/engines) and a ban on storage and network APIs in `src/`                                                                                      |
| `playwright.config.ts`                                     | E2E in Chromium, Firefox, WebKit on the built file                                                                                                                                |
| `.gitignore`, `.prettierignore`                            | Own ignores (`.tmp/`, `tests/fixtures/lokal/`, `deploy/.local/`)                                                                                                                  |
| `index.html`                                               | Entry HTML (`lang="de"`, no external URLs)                                                                                                                                        |
| `src/main.tsx`                                             | Mounts the React app                                                                                                                                                              |
| `src/appInfo.ts`                                           | App name + version (`__APP_VERSION__` from `package.json`)                                                                                                                        |
| `src/build/csp.ts`                                         | CSP meta tag with hashes, `connect-src 'none'`, `'wasm-unsafe-eval'`                                                                                                              |
| `src/ui/App.tsx`, `src/ui/app.css`                         | UI (placeholder until step 1a)                                                                                                                                                    |
| `src/logic/prolog.ts`                                      | XML prolog scan: BOM/encoding, root found, **DOCTYPE refused before parsing**, `looksLikeXml`                                                                                     |
| `src/io/xml.ts`                                            | libxml2-wasm adapter: `readXml` (size limit, no DOCTYPE, no XXE/net), `valuesAt` (XPath), XSD validators from bundled schemas served from memory (`/schemas/…`), `schemaProblems` |
| `src/io/schemas.ts`                                        | Bundled XSD text (`import.meta.glob` `?raw`) and the entry schemas                                                                                                                |
| `src/io/pdf.ts`                                            | pdf.js adapter: `readPdfAttachments` (pdf.js 6: Map without content + `getAttachmentContent`), password/damaged/too large                                                         |
| `schemas/`                                                 | Official XSD, unchanged: UBL 2.1 (OASIS), CII D16B (UN/CEFACT) — origin and licences in `schemas/README.md`                                                                       |
| `tests/build/csp.test.ts`                                  | CSP: no connections/workers, WASM allowed, refuses external scripts                                                                                                               |
| `tests/io/xml.test.ts`, `src/logic/prolog.test.ts`         | Reading official examples, XPath, DOCTYPE refusal, broken XML with line, XSD valid/invalid                                                                                        |
| `tests/io/pdf.test.ts`                                     | Plain PDF, PDF with two attachments (names, bytes), damaged PDF                                                                                                                   |
| `tests/support/minipdf.ts`                                 | Tiny PDF writer for own edge cases (text, embedded files with /AF relationship)                                                                                                   |
| `tests/static/hiddenChars.test.ts`                         | No invisible characters in src/tests/docs (the Write tool decodes `\u` escapes)                                                                                                   |
| `tests/fixtures/offiziell/`                                | Official test files, unchanged (CEN 1.3.17 examples, EUPL-1.2) — see its README                                                                                                   |
| `docs/plan.md`, `docs/quellen.md`, `docs/offene-fragen.md` | Plan, sources, tax questions (German)                                                                                                                                             |
| `deploy/upload.json`                                       | Upload target `test` → `NebenprojektERechnung/` (access `ipOrLogin`) for `private/Auslieferung`                                                                                   |
| `manual_tests/`                                            | Human-tester instructions (German) — see [`manual_tests/README.md`](manual_tests/README.md)                                                                                       |
| `.tmp/quellen/`                                            | Downloaded official artefacts (gitignored, see `docs/quellen.md`)                                                                                                                 |

---

## Data Model

The BT model (EN 16931 Business Terms) and the mapping tables arrive with step 1b; then
`docs/data-model.html` is generated from the source (workspace rule) and linked here.

---

## Testing

```bash
npm install --ignore-scripts
npm test             # Vitest (unit + Node integration with pdf.js and libxml2-wasm)
npm run typecheck
npm run lint
npm run format:check
npm run build        # dist/index.html
npm run test:e2e     # build + Playwright (Chromium, Firefox, WebKit; shared browser cache)
```

Report only results observed in the same session (workspace test-integrity rule).

## Development Server Ports

| Server                    | Port                                               |
| ------------------------- | -------------------------------------------------- |
| Vite dev server / preview | 5178 (same as Fragebogen — never run both at once) |

## Versioning

Semantic versioning in `package.json`, injected as `__APP_VERSION__`. Tags for this sub-project:
`e-rechnung-vX.Y.Z` (the repo's plain `vX.Y.Z` tags belong to the Fragebogen app).

---

## Known Limitations

- **In development** — steps 1a–3a not built yet (see `docs/plan.md`).
- **FeRD ZUGFeRD 2.5.2 package not yet available** (download needs a form with personal data —
  Tobias downloads). Its sample invoices may not be redistributed → they will stay local in
  `tests/fixtures/lokal/`; tests that need them are skipped where the folder is missing, and a
  skipped test is not a pass.
- **Mapping source:** KoSIT/FeRD recommendation, Stand 25.07.2025 — copyrighted, not in the repo;
  our data table cites it per row. Deviations from the hand-over's provisional table: F9.

---

## Status / next step

**2026-11-13 — phase 0 done:** plan approved; sources downloaded to `.tmp/quellen/` (KoSIT config +
testsuite, CEN 1.3.17, KoSIT/FeRD recommendation); scaffold; `npm install --ignore-scripts`; spike
passed in Chromium, Firefox, WebKit (throw-away code in `.tmp/spike/`, results in `docs/plan.md`).
XSDs (UBL 2.1, CII D16B) taken over early because the spike needed them. Next: step 1a (detect).
Waiting for Tobias: FeRD 2.5.2 package (form download) → `.tmp/quellen/ferd/`.
