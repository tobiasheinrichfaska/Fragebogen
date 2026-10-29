# CLAUDE.md — Fragebogen

> Workspace-wide conventions (language, git, build, architecture, testing, collaboration):
> [`c:\skripte\private\general stuff\CLAUDE.md`](../../private/general%20stuff/CLAUDE.md)

---

## Project overview

Questionnaires (first: German _Personalfragebogen_ for new employees) as **one self-contained HTML
file** that runs fully locally in the browser — no server, no network, no browser storage. A
questionnaire travels through stations (e.g. Arbeitnehmer → Arbeitgeber → Kanzlei). Each station
fills in its fields, signs (simple electronic signature with a system note) and downloads a **PDF
whose last pages carry the data as machine-readable text**. The next station reads that PDF back,
verifies the seals and hash chain, and the Kanzlei merges parts even when they arrive separately.

**Platform:** web (single HTML file; `file://` on desktop, hosted copy for iOS/Android)
**Language:** TypeScript + React
**Architecture:** Vite 8 + vite-plugin-singlefile. Strict layering: `src/logic/` (pure,
UI/IO-free, exhaustively unit-tested — enforced by ESLint `no-restricted-imports` /
`no-restricted-globals`), `src/io/` (PDF, files, environment probing; from step 1/8),
`src/ui/` (React rendering only). Forms are **data** (form definitions), never code.

- Approved plan with step status: [`docs/plan.md`](docs/plan.md) (German).
- Legal research (form requirements, Gemeinsame Grundsätze § 9a BVV): [`docs/rechtliches.md`](docs/rechtliches.md).

---

## Project Directory

| File/Folder                                           | Purpose                                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                           | This file — project conventions and status                                                                |
| `README.md`                                           | Public description (German), legal status, license                                                        |
| `FEATURES_REQUIRED.md`                                | Critical user paths the audit validates end-to-end                                                        |
| `LICENSE`, `LICENSE_COMMERCIAL.md`, `CONTRIBUTING.md` | AGPLv3 + commercial dual licensing, CLA                                                                   |
| `.gitattributes`                                      | LF line endings (workspace template)                                                                      |
| `.gitignore`                                          | Ignores `node_modules/`, `dist/`, `.tmp/`, test reports, editor/OS junk                                   |
| `package.json` / `package-lock.json`                  | Scripts and pinned dependencies                                                                           |
| `vite.config.ts`                                      | Vite + singlefile build (`base: './'`, no modulePreload polyfill) and Vitest config (`pool: 'vmThreads'`) |
| `tsconfig.json`                                       | Strict TS (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)                                |
| `eslint.config.js`                                    | Flat config: TS strict, React hooks/refresh for `src/ui`, layering rules for `src/logic`                  |
| `.prettierrc.json`, `.prettierignore`                 | Formatting                                                                                                |
| `index.html`                                          | Entry HTML (`lang="de"`, `data:` favicon, no external URLs)                                               |
| `src/main.tsx`                                        | Mounts the React app                                                                                      |
| `src/appInfo.ts`                                      | App name + version (version injected from `package.json` as `__APP_VERSION__`)                            |
| `src/vite-env.d.ts`                                   | Vite client types, `__APP_VERSION__` declaration                                                          |
| `src/logic/model.ts`                                  | Data model types (draft from step 0): form definition, questionnaire, part, seal, receipts                |
| `src/logic/dates.ts`                                  | Date-only arithmetic on `YYYY-MM-DD` strings; `ageOn` / `isMinorOn` (§§ 187, 188 BGB)                     |
| `src/logic/dates.test.ts`                             | Unit tests for `dates.ts` (leap years, 29 February rule, invalid input)                                   |
| `src/ui/App.tsx`                                      | Start screen (placeholder until step 6)                                                                   |
| `src/ui/styles.css`                                   | Base styles, light/dark                                                                                   |
| `tests/static/indexHtml.test.ts`                      | Guards `index.html` against external URLs/stylesheets                                                     |
| `docs/data-model.html`                                | Self-contained data-model reference (German) — regenerate when the model changes                          |
| `docs/plan.md`                                        | Approved plan, step table with status (German)                                                            |
| `docs/rechtliches.md`                                 | Legal background with sources (German, not legal advice)                                                  |
| `manual_tests/`                                       | Human-tester instructions (German): `README.md`, `01_start.md`                                            |
| `.tmp/`                                               | Gitignored scratch area (spikes, extracted files)                                                         |

---

## Data Model

Authoritative reference: [`docs/data-model.html`](docs/data-model.html). Source of truth is
`src/logic/model.ts`. **Regenerate the HTML in the same session whenever the model changes.**

Key design decisions (details in `docs/plan.md`):

- **Ownership per field** (`FieldDefinition.role`), sections shared; repeat-group columns may belong
  to another role and reference rows by stable row id.
- **Seal** = SHA-256 over JCS (RFC 8785) of `SealPayload`; `contentHash` lives outside the payload.
  Per-field hashes (128-bit) let verification name changed fields. Payload never travels without its
  data. Values are normalised once at input and hashed exactly as stored (`canon: 1`).
- **Notices:** `InfoBlock.acknowledgement` is `read` (confirmed in-app) or `paperHandout` (notice is
  handed out on paper; the form only confirms the handout). The hash of the exact text goes into
  the seal.
- **Legal guardian** role becomes mandatory when the person is under 18 on the signing day
  (`RoleCondition.kind = 'minorOnSigning'`, `isMinorOn`).
- **Receipts** carry `source: 'app' | 'datev'` — the DATEV filing date is the trusted time anchor.
- **No JSON numbers** in questionnaire data; dates are strings, never routed through `Date`.

---

## Key decisions & deviations from workspace conventions

| Decision                                                           | Why                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runs from `file://` (workspace rule says avoid)                    | Core requirement: send/open one file offline. Mitigated: `modulePreload.polyfill = false`; E2E will run against `file://` (step 10).                                                                     |
| `react`/`react-dom` `^19.2.6` (not the Expo pin 19.1.0)            | Browser SPA: react-dom is the renderer and must match react.                                                                                                                                             |
| TypeScript `^5.9.3` (7.x exists)                                   | `typescript-eslint` 8.72 supports TS `<6.1`.                                                                                                                                                             |
| No autosave of drafts (original brief asked for it)                | User decision 2026-10-29: Chromium shares storage across all `file://` pages and GitHub Pages origins are shared — drafts with Steuer-ID/IBAN would be readable. Interim state = explicit file download. |
| No PDF file attachment; data as visible text pages                 | Gemeinsame Grundsätze § 9a BVV Ziff. 2.1.2: PDFs presented as Entgeltunterlage must not embed files. One PDF serves transport and filing. Target PDF/A-2u.                                               |
| No own internet timestamp (for now)                                | Filing in the DATEV Personalakte provides the trusted time anchor; browsers cannot reach most TSAs (no CORS). RFC 3161 stays an option.                                                                  |
| Hosting on a dedicated subdomain of the Kanzlei homepage (step 12) | iOS cannot run local HTML; separate origin, static only, security headers, daily integrity watcher.                                                                                                      |
| Kanzlei branding is configuration, never committed                 | Public repo stays neutral.                                                                                                                                                                               |

---

## Known Limitations

- **Foundation only (v0.1.0):** no forms, no signature, no PDF yet — start screen placeholder.
- **No CSP yet:** the strict Content-Security-Policy and the built-file no-network test arrive in
  step 10. The source `index.html` is already guarded against external URLs.
- **Simple electronic signature only** (eIDAS Art. 3 Nr. 10) — not qualified; device time is not
  verifiable; hashes detect accidental/naive changes, not full regeneration. Never promised as
  "rechtsgültig".
- **Forms that need written form** (e.g. RV-Befreiungsantrag, § 6 Abs. 1b SGB VI) still need paper
  (or QES / scan + advanced employer signature); paper notices are handed out on paper.
- **iPhone/iPad cannot run the HTML file locally** — they need the hosted copy (step 12). Android:
  Chrome only, via the Files app.
- **Printing and re-scanning** a PDF destroys the machine-readable data pages (OCR of base64 is
  unreliable); a QR code for the paper path is a later option.
- **No autosave:** closing the tab loses unsaved input (a warning will be shown, step 6).
- **Device key (ECDSA) deliberately not built** — proves a browser profile, not a person, and
  conflicts with "store nothing".

---

## Testing

```bash
npm test            # Vitest (logic + static guards); pool vmThreads (Vitest 4.1.8 forks bug)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run format:check
npm run build       # dist/index.html (single file)
```

Report only results observed in the same session (workspace test-integrity rule). Manual tests:
[`manual_tests/`](manual_tests/). Playwright E2E (Chromium/Firefox/WebKit under `file://`) arrives
in step 10.

---

## Development Server Ports

| Server                    | Port |
| ------------------------- | ---- |
| Vite dev server / preview | 5178 |

---

## Versioning

Semantic versioning; the version lives in `package.json` (`version`) and is injected into the app
as `__APP_VERSION__`. Workflow: bump `package.json` → `chore: bump version to X.Y.Z` → `git tag vX.Y.Z`.

---

## Status / next step

Step 0 (foundation) done. **Next: step 1 — PDF spike** in `.tmp/` (write PDF/A-2u + data pages with
@cantoo/pdf-lib, read back with pdf.js, Acrobat "Speichern unter" + DATEV round-trip, AES-256,
page count, bundle size, CSP compatibility). Then stop and report.

_Last updated: 2026-10-29_
