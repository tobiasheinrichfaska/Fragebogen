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

| File/Folder                                                | Purpose                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                | This file                                                                                                                                                                                                                     |
| `README.md`                                                | Public description (German), licence pointer                                                                                                                                                                                  |
| `FEATURES_REQUIRED.md`                                     | Critical user paths                                                                                                                                                                                                           |
| `package.json` / `package-lock.json`                       | Scripts and exactly pinned dependencies (versions as in the Fragebogen app)                                                                                                                                                   |
| `vite.config.ts`                                           | Vite + single-file build, CSP plugin, Vitest config (`pool: 'forks'` for pdf.js)                                                                                                                                              |
| `tsconfig.json`                                            | Strict TS like the Fragebogen app                                                                                                                                                                                             |
| `eslint.config.js`                                         | Layering (`src/logic` free of UI/IO/engines) and a ban on storage and network APIs in `src/`                                                                                                                                  |
| `playwright.config.ts`                                     | E2E in Chromium, Firefox, WebKit on the built file                                                                                                                                                                            |
| `.gitignore`, `.prettierignore`                            | Own ignores (`.tmp/`, `tests/fixtures/lokal/`, `deploy/.local/`)                                                                                                                                                              |
| `index.html`                                               | Entry HTML (`lang="de"`, no external URLs)                                                                                                                                                                                    |
| `src/main.tsx`                                             | Mounts the React app                                                                                                                                                                                                          |
| `src/appInfo.ts`                                           | App name + version (`__APP_VERSION__` from `package.json`)                                                                                                                                                                    |
| `src/build/csp.ts`                                         | CSP meta tag with hashes, `connect-src 'none'`, `'wasm-unsafe-eval'`                                                                                                                                                          |
| `src/ui/App.tsx`, `src/ui/app.css`                         | Page: drop zone, "wird geprüft …", result, unexpected errors shown with their message, fixed notice                                                                                                                           |
| `src/ui/DropZone.tsx`                                      | Drop a file or "Datei auswählen" (first file of a drop counts)                                                                                                                                                                |
| `src/ui/ResultView.tsx`                                    | Verdict box (tone ok/warn/bad), detail table per invoice XML, other attachments of a PDF                                                                                                                                      |
| `src/logic/analysis.ts`                                    | What IO found, as plain data: `Analysis`, `InvoicePart` (origin, syntax, header values), `OtherPart`, file problems                                                                                                           |
| `src/logic/syntax.ts`                                      | `SYNTAXES` as data: UBL Invoice/CreditNote, CII, ZUGFeRD 1.0 — recognised by root element + namespace, never by file name                                                                                                     |
| `src/logic/mapping.ts`                                     | BT → XPath per syntax as data (`HEADER_FIELDS`: BT-1, -2, -3, -5, -24, -27, -112; step 1b adds the groups), `first`                                                                                                           |
| `src/logic/profiles.ts`                                    | `PROFILES`: BT-24 identifiers → label, profile, einordnung (eRechnung / keineERechnung / nichtBeurteilt), source, `checked`; `profileOf` (exact before longest prefix)                                                        |
| `src/logic/verdict.ts`                                     | `verdictOf`: headline, tone, explanation; several invoice XML compared (`differingTerms`: number, date across formats, currency, supplier, amount by value) — never picks one                                                 |
| `src/logic/texts.ts`                                       | Every German sentence (`TEXTS`, `fill`), `TYPE_CODES` (BT-3 labels); test-guarded: never "ordnungsgemäß"/"gültig"                                                                                                             |
| `src/logic/details.ts`                                     | Detail rows of one invoice (German date and amount, type code label, raw BT-24)                                                                                                                                               |
| `src/logic/decimal.ts`, `src/logic/dates.ts`               | Exact decimals on BigInt (parse, normalize, equals, German format); dates UBL xs:date / CII format 102 → ISO                                                                                                                  |
| `src/io/analyze.ts`                                        | `analyzeFile`: file kind by content (`%PDF-` / XML prolog), PDF attachments recognised as XML by content, header values read via the mapping, documents disposed                                                              |
| `src/io/pdfjs.ts`                                          | Loads pdf.js on first use with the main-thread fake worker                                                                                                                                                                    |
| `src/logic/prolog.ts`                                      | XML prolog scan: BOM/encoding, root found, **DOCTYPE refused before parsing**, `looksLikeXml`                                                                                                                                 |
| `src/io/xml.ts`                                            | libxml2-wasm adapter: `readXml` (size limit, no DOCTYPE, no XXE/net), `valuesAt` (XPath), XSD validators from bundled schemas served from memory (`/schemas/…`), `schemaProblems`                                             |
| `src/io/schemas.ts`                                        | Bundled XSD text (`import.meta.glob` `?raw`) and the entry schemas                                                                                                                                                            |
| `src/io/pdf.ts`                                            | pdf.js adapter: `readPdfAttachments` (pdf.js 6: Map without content + `getAttachmentContent`), password/damaged/too large                                                                                                     |
| `schemas/`                                                 | Official XSD, unchanged: UBL 2.1 (OASIS), CII D16B (UN/CEFACT) — origin and licences in `schemas/README.md`                                                                                                                   |
| `tests/build/csp.test.ts`                                  | CSP: no connections/workers, WASM allowed, refuses external scripts                                                                                                                                                           |
| `tests/io/xml.test.ts`, `src/logic/prolog.test.ts`         | Reading official examples, XPath, DOCTYPE refusal, broken XML with line, XSD valid/invalid                                                                                                                                    |
| `tests/io/pdf.test.ts`                                     | Plain PDF, PDF with two attachments (names, bytes), damaged PDF                                                                                                                                                               |
| `tests/support/minipdf.ts`                                 | Tiny PDF writer for own edge cases (text, embedded files with /AF relationship, password-protected)                                                                                                                           |
| `tests/support/fixtures.ts`                                | Reads official fixtures; `withSpecId`, `withInvoiceNumber` derive variants (MINIMUM, unknown id, different invoice)                                                                                                           |
| `tests/io/analyze.test.ts`                                 | Every verdict path with official files and own PDFs: XRechnung UBL/CII/Extension/CVD, MINIMUM/BASIC WL, ZUGFeRD 1.0, unknown/missing id, same invoice in UBL+CII, contradicting XML, password, damaged, too large, empty, PNG |
| `src/logic/*.test.ts`                                      | Profiles, decimals, dates, verdict texts and comparison, detail rows                                                                                                                                                          |
| `tests/e2e/erkennen.spec.ts`                               | Playwright on `dist/index.html` (file://): recognition paths, drop, CSP; a spy counts storage/cookie access, CSP violations, requests and console errors — all must be none (spy self-checked)                                |
| `tests/static/hiddenChars.test.ts`                         | No invisible characters in src/tests/docs (the Write tool decodes `\u` escapes)                                                                                                                                               |
| `tests/fixtures/offiziell/`                                | Official test files, byte-identical (`-text`): CEN 1.3.17 examples (EUPL-1.2), six KoSIT testsuite instances (Apache-2.0) — see its README                                                                                    |
| `docs/plan.md`, `docs/quellen.md`, `docs/offene-fragen.md` | Plan, sources, tax questions (German)                                                                                                                                                                                         |
| `deploy/upload.json`                                       | Upload target `test` → `NebenprojektERechnung/` (access `ipOrLogin`) for `private/Auslieferung`                                                                                                                               |
| `manual_tests/`                                            | Human-tester instructions (German) — see [`manual_tests/README.md`](manual_tests/README.md)                                                                                                                                   |
| `.tmp/quellen/`                                            | Downloaded official artefacts (gitignored, see `docs/quellen.md`)                                                                                                                                                             |

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

- **In development** — steps 1b–3a not built yet (see `docs/plan.md`).
- **Profile identifiers of FeRD not yet checked** against the ZUGFeRD 2.5.2 specification
  (`checked: false` in `profiles.ts`: MINIMUM, BASIC WL, BASIC, EXTENDED, old XRechnung ids,
  ZUGFeRD 1.0). The ZUGFeRD 1.0 namespaces in `syntax.ts` are from memory, not from a sample file.
- **ZUGFeRD 1.0 and unknown identifiers:** decided provisionally (F5, confirmation open) — also an
  official CEN example in CII D16B carrying the ZUGFeRD 1.0 id is called "keine E-Rechnung".
- **Attachments only from the EmbeddedFiles name tree** (where Factur-X/ZUGFeRD put the XML).
  Files attached only as page annotations are not seen. At most 50 attachments are read.
- **Password-protected PDF** is tested with a synthetic encryption dictionary (the reader asks for
  a password); a real protected supplier PDF is not in the tests.
- **Tested on file://** only so far; the hosted copy (same file) follows with the first upload.
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
XSDs (UBL 2.1, CII D16B) taken over early because the spike needed them.

**2026-11-13 — step 1a done (detect):** file kind by content, PDF attachments, syntax and profile
tables as data, verdicts with the hand-over's headlines, several XML compared, UI with drop zone.
Next: step 1b (normalise: full BT mapping for UBL and CII, lines). Waiting for Tobias: FeRD 2.5.2
package (form download) → `.tmp/quellen/ferd/`; confirmation of F5.
