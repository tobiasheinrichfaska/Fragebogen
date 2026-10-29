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

| File/Folder                                           | Purpose                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLAUDE.md`                                           | This file — project conventions and status                                                                                                                                                                         |
| `README.md`                                           | Public description (German), legal status, license                                                                                                                                                                 |
| `FEATURES_REQUIRED.md`                                | Critical user paths the audit validates end-to-end                                                                                                                                                                 |
| `LICENSE`, `LICENSE_COMMERCIAL.md`, `CONTRIBUTING.md` | AGPLv3 + commercial dual licensing, CLA                                                                                                                                                                            |
| `.gitattributes`                                      | LF line endings (workspace template)                                                                                                                                                                               |
| `.gitignore`                                          | Ignores `node_modules/`, `dist/`, `.tmp/`, test reports, editor/OS junk                                                                                                                                            |
| `package.json` / `package-lock.json`                  | Scripts and pinned dependencies                                                                                                                                                                                    |
| `vite.config.ts`                                      | Vite + singlefile build (`base: './'`, no modulePreload polyfill) and Vitest config (`pool: 'vmThreads'`)                                                                                                          |
| `tsconfig.json`                                       | Strict TS (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)                                                                                                                                         |
| `eslint.config.js`                                    | Flat config: TS strict, React hooks/refresh for `src/ui`, layering rules for `src/logic`                                                                                                                           |
| `.prettierrc.json`, `.prettierignore`                 | Formatting                                                                                                                                                                                                         |
| `index.html`                                          | Entry HTML (`lang="de"`, `data:` favicon, no external URLs)                                                                                                                                                        |
| `src/main.tsx`                                        | Mounts the React app                                                                                                                                                                                               |
| `src/appInfo.ts`                                      | App name + version (version injected from `package.json` as `__APP_VERSION__`)                                                                                                                                     |
| `src/vite-env.d.ts`                                   | Vite client types, `__APP_VERSION__` declaration                                                                                                                                                                   |
| `src/logic/model.ts`                                  | Data model types + enumeration constants (`FIELD_TYPES`, …): form definition, questionnaire, part, seal, receipts                                                                                                  |
| `src/logic/dates.ts`                                  | Date-only arithmetic on `YYYY-MM-DD` strings; `ageOn` / `isMinorOn` (§§ 187, 188 BGB)                                                                                                                              |
| `src/logic/jcs.ts`                                    | RFC 8785 canonical JSON (`canonicalize`), `isWellFormed` (no unpaired surrogates), realm-independent `isPlainObject`                                                                                               |
| `src/logic/hash.ts`                                   | SHA-256 via `@noble/hashes`: `sha256Hex`, `canonicalHash` (= SHA-256 of JCS), `isSha256Hex`                                                                                                                        |
| `src/logic/issues.ts`                                 | `Checked<T>` result type, user-facing issue codes and their German messages (`ISSUE_MESSAGES`)                                                                                                                     |
| `src/logic/normalize.ts`                              | Input normalisation `canon: 1` (text, date, money, IBAN, tax id, SV number, choices); `normalizeFieldValue` dispatch table per field type                                                                          |
| `src/logic/validators.ts`                             | Check digits: IBAN (MOD 97-10), Steuer-ID (digit pattern + MOD 11,10), Versicherungsnummer                                                                                                                         |
| `src/logic/data/ibanLengths.ts`                       | IBAN length per country (78 countries; others: warning, length unchecked)                                                                                                                                          |
| `src/logic/decode.ts`                                 | `Decoder`: strict decoding of untrusted JSON with issue paths, no coercion/defaults                                                                                                                                |
| `src/logic/formDefinition.ts`                         | `parseFormDefinition` = strict decode + reference checks (`checkFormDefinition`, rule list); id patterns; `findCycle`                                                                                              |
| `src/logic/formRegistry.ts`                           | Registry by (id, version) and `definitionHash`; published list check; `checkFieldIdStability`; `compareVersions`                                                                                                   |
| `src/logic/compute.ts`                                | Named pure functions for `computed` fields (empty until step 5)                                                                                                                                                    |
| `src/logic/conditions.ts`                             | Condition operators as data (`equals`, `in`, `contains`, `answered` + `all`/`any`/`not`): `evaluateCondition`, `leafProblem`, `describeCondition` (German)                                                         |
| `src/logic/form.ts`                                   | Evaluating a definition against data: `visibility` (chained `showIf`), `fieldStates` (visible/required/missing incl. `requiredIf`), `sealableData`, `missingRequired`, `describeFieldRules`, `noticeHash`, lookups |
| `src/logic/seal.ts`                                   | `SEAL_SCHEMA`, salted 64-bit `fieldHash`, `contentHashOf`, `strokesHashOf`, `diffFieldHashes`                                                                                                                      |
| `src/logic/strokes.ts`                                | Canonical delta text encoding of drawn signatures (`encodeStrokes` / strict `decodeStrokes`), limits                                                                                                               |
| `src/logic/time.ts`                                   | Strict ISO 8601 UTC/local-with-offset parsing, `sameInstant`, durations                                                                                                                                            |
| `src/logic/questionnaireFile.ts`                      | File format constants (`FORMAT`, `QUESTIONNAIRE_ID`) and the strict `decodeQuestionnaire` for untrusted files                                                                                                      |
| `src/logic/questionnaire.ts`                          | Pure state transitions: create, `startPart`, `setValue` (refuses input into unavailable fields), `discardDraft`, `reopenPart`, `sealPart`, `addReceipt`, `receivedPartFor`                                         |
| `src/logic/verify.ts`                                 | `verifyQuestionnaire`: graded verdicts, findings with severity + German messages, hash chain, receipts, time plausibility                                                                                          |
| `src/logic/requirements.ts`                           | Transmission gate `transmissionBlockers` (no transmission without signatures; minor → guardian with name, bound to the current part), `roleRequirement`, `completenessGaps`                                        |
| `tests/support/sample.ts`                             | Shared fictitious scenarios (person signs, employer seals + chains, Kanzlei/DATEV receipt; second version; minor + guardian on form 1.1.0)                                                                         |
| `tests/golden/`                                       | Golden questionnaires (`beispiel-<version>/*.json`, never edited; `README.md`) + `golden.test.ts` (decode, verdicts, byte-identical rebuild)                                                                       |
| `src/logic/*.test.ts`                                 | Unit tests next to each module (RFC 8785 vectors, FIPS vectors, check digits, idempotence property tests, definition mutation tables)                                                                              |
| `forms/`                                              | Form definitions `forms/<id>/<version>.json` (none yet), `published.json` (frozen hashes), `README.md` (freeze rules, German)                                                                                      |
| `tests/fixtures/forms/beispiel/1.0.0.json`            | Fictitious fixture form (3 roles, showIf, notice, rule, match key) for the definition/registry tests; frozen by golden files                                                                                       |
| `tests/fixtures/forms/beispiel/1.1.0.json`            | Same form with a required guardian name field (`signerNameField`); frozen by golden files                                                                                                                          |
| `tests/forms/publishedForms.test.ts`                  | Guards the real `forms/` folder: valid, published, unchanged hash, file naming, field-id stability                                                                                                                 |
| `tests/static/sourceCharacters.test.ts`               | Fails on literal invisible/combining/separator characters in sources and docs (must be `\u` escapes)                                                                                                               |
| `src/ui/App.tsx`                                      | Start screen (placeholder until step 6)                                                                                                                                                                            |
| `src/ui/styles.css`                                   | Base styles, light/dark                                                                                                                                                                                            |
| `tests/static/indexHtml.test.ts`                      | Guards `index.html` against external URLs/stylesheets                                                                                                                                                              |
| `docs/data-model.html`                                | Self-contained data-model reference (German) — regenerate when the model changes                                                                                                                                   |
| `docs/plan.md`                                        | Approved plan, step table with status (German)                                                                                                                                                                     |
| `docs/rechtliches.md`                                 | Legal background with sources (German, not legal advice)                                                                                                                                                           |
| `docs/spike-pdf.md`                                   | Step-1 PDF spike results + **data-page format v1** spec (German)                                                                                                                                                   |
| `assets/fonts/`                                       | Embedded PDF fonts: Noto Sans Regular/SemiBold + Noto Sans Mono, Latin subsets (OFL), `README.md` with source URLs, SHA-256 and the exact `pyftsubset` command                                                     |
| `manual_tests/`                                       | Human-tester instructions (German): `README.md`, `01_start.md`, `90_pdf_gegenproben.md` (Acrobat/DATEV/print counter-checks, non-blocking)                                                                         |
| `.tmp/`                                               | Gitignored scratch area (spikes, extracted files)                                                                                                                                                                  |

---

## Data Model

Authoritative reference: [`docs/data-model.html`](docs/data-model.html). Source of truth is
`src/logic/model.ts`. **Regenerate the HTML in the same session whenever the model changes.**

Key design decisions (details in `docs/plan.md`):

- **Ownership per field** (`FieldDefinition.role`), sections shared; repeat-group columns may belong
  to another role and reference rows by stable row id.
- **Seal** = SHA-256 over JCS (RFC 8785) of `SealPayload`; `contentHash` lives outside the payload.
  Per-field hashes are SHA-256(JCS({f, n: nonce, v})) truncated to **64 bit** and **salted with the
  part nonce** (low-entropy values stay unguessable; integrity rests on the 256-bit contentHash).
  Values are normalised once at input and hashed exactly as stored (`canon: 1`). Only visible fields
  of the role are sealed; unanswered ones as `null`, hidden values are dropped.
- **Signature image** = `Part.signatureStrokes`, canonical delta text (`strokes.ts`, integer box
  1000×400, no timing/pressure); the payload holds only its SHA-256. Typed signatures store the
  normalised name in the payload.
- **Versions:** re-sealing appends version n+1 with `supersedes` = previous contentHash; only the last
  entry of a role may be a draft; the last sealed one is current.
- **Verification grades** (`verify.ts`): `consistent` (level 1, recomputed) → `confirmed` (level 2:
  another role's seal lists the hash in `receivedParts`, or a receipt does). Errors make a part
  `invalid`; warnings (time plausibility with 15 min tolerance, >90 days at receipt, references to
  older/unknown versions, mismatch against the form) do not. A forger who re-seals consistently
  reaches level 1 again but loses all confirmations — stated honestly, never hidden.
- **All transitions are pure** (`questionnaire.ts`): time, nonce and device data are arguments from
  the io layer; refusals carry a code (`TRANSITION_MESSAGES`, German) and details.
- **Notices:** `InfoBlock.acknowledgement` is `read` (confirmed in-app) or `paperHandout` (notice is
  handed out on paper; the form only confirms the handout). The hash of the exact text goes into
  the seal.
- **No transmission without signature** (user requirement 2026-10-29, `requirements.ts`): the
  transmission PDF is only written when `transmissionBlockers` is empty — no open draft, every
  role with `signature: required` signed, no invalid part. The role whose birth date triggers the
  guardian must have `signature: required` (definition rule). Interim state can always be saved.
- **Legal guardian** (`requiredIf: minorOnSigning`): required when the person is under 18 on the
  **local date of their own signature** (device clock, §§ 187/188 BGB). The guardian must sign
  (definition rule: conditional roles have `signature: required`), state a name (`signerNameField`,
  or the typed signature on forms without that field) and bind exactly the person's current
  contentHash in `receivedParts`; after the person re-signs, the guardian must sign again.
- **Field logic** (`conditions.ts`, `form.ts`): `required` (always) or `requiredIf` (by condition,
  mutually exclusive); `showIf` = available for input — `setValue` refuses non-null values before
  the precondition holds, hidden values are dropped at sealing. Conditions reference fields of the
  same role; only `showIf` must be acyclic (mutual `requiredIf` such as phone/e-mail is fine).
  Every rule reads as German text (`describeFieldRules`) for hints and the catalogue review.
- **Re-signing:** before sending, `reopenPart` withdraws the seal — the old signature disappears,
  no chain (user decision 2026-10-29); refused once another part or a receipt references it. After
  that, a change is a new version (`startPart`, `supersedes`).
- **Merge rule (decided 2026-10-29, built in step 4c):** same hash → collapse with a note;
  different versions of a role only as a `supersedes` chain (person re-signs at the employer) →
  the newer wins, with a note and the changed fields; anything else is a conflict, never picked
  automatically. Fields covered by different signing dates must be visible (footnotes, one
  signature line per covering version — computed in 4c, printed in step 8).
- **Signature plausibility:** drawn ≥ 5 points and ≥ 40 units wide (box 1000), typed ≥ 2 letters;
  rejects accidental taps, says nothing about whose signature it is.
- **Receipts** carry `source: 'app' | 'datev'` — the DATEV filing date is the trusted time anchor.
- **No JSON numbers** in questionnaire data; dates are strings, never routed through `Date`.
- **Canon 1** (`normalize.ts`): text → remove soft hyphen/zero-width/BOM and controls, all line
  breaks → LF, tab → space, NFC, collapse whitespace (per line for `multiline`), trim; empty → `null`.
  Date `TT.MM.JJJJ`/ISO → `YYYY-MM-DD`. Money German input (`1.234,56`; `1.234` = thousands) →
  `"1234.56"`. IBAN/SV number compact upper-case, tax id digits only. Multi-choice sorted, unique.
  Every normaliser maps its own output to itself (property tests).
- **Form definitions** are decoded strictly (`decode.ts`): unknown keys, missing values, non-NFC
  strings are errors; nothing is defaulted, so `definitionHash` of raw JSON = of decoded object.

---

## Key decisions & deviations from workspace conventions

| Decision                                                           | Why                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runs from `file://` (workspace rule says avoid)                    | Core requirement: send/open one file offline. Mitigated: `modulePreload.polyfill = false`; E2E will run against `file://` (step 10).                                                                                                         |
| `react`/`react-dom` `^19.2.6` (not the Expo pin 19.1.0)            | Browser SPA: react-dom is the renderer and must match react.                                                                                                                                                                                 |
| TypeScript `^5.9.3` (7.x exists)                                   | `typescript-eslint` 8.72 supports TS `<6.1`.                                                                                                                                                                                                 |
| No autosave of drafts (original brief asked for it)                | User decision 2026-10-29: Chromium shares storage across all `file://` pages and GitHub Pages origins are shared — drafts with Steuer-ID/IBAN would be readable. Interim state = explicit file download.                                     |
| No PDF file attachment; data as visible text pages                 | Gemeinsame Grundsätze § 9a BVV Ziff. 2.1.2: PDFs presented as Entgeltunterlage must not embed files. One PDF serves transport and filing. Target PDF/A-2u.                                                                                   |
| No own internet timestamp (for now)                                | Filing in the DATEV Personalakte provides the trusted time anchor; browsers cannot reach most TSAs (no CORS). RFC 3161 stays an option.                                                                                                      |
| Hosting on a dedicated subdomain of the Kanzlei homepage (step 12) | iOS cannot run local HTML; separate origin, static only, security headers, daily integrity watcher.                                                                                                                                          |
| Kanzlei branding is configuration, never committed                 | Public repo stays neutral.                                                                                                                                                                                                                   |
| PDF write: `@cantoo/pdf-lib` + `@cantoo/fontkit` (no pdfkit)       | Spike: subset fonts with ToUnicode, `convertToPDFA('2U')` (bundled sRGB), AES-256 V5/R6 encrypt + password reload all work. See `docs/spike-pdf.md`.                                                                                         |
| PDF read: `pdfjs-dist` in the **main thread** ("fake worker")      | Chromium refuses `blob:` workers on `file://` (opaque origin) and pdf.js then hangs. One code path for file:// and https. `isEvalSupported: false` (CSP).                                                                                    |
| Fonts: Noto Sans / Noto Sans Mono subsets (not Source Sans/Code)   | Source fonts carry the OFL Reserved Font Name "Source" — a distributed subset would have to be renamed. Noto has no RFN. Subsets drop ligatures/kerning (1 glyph = 1 char → reliable extraction).                                            |
| Data-page lines must fit inside the page                           | pdf.js drops glyphs beyond the page edge (spike bug: a too-wide header line lost SHA-256 chars). Header is two lines; step 8 adds a width test.                                                                                              |
| Strict TS decoder instead of JSON Schema + Ajv (plan said Ajv)     | One source of truth: the TS types. tsc checks that the decoder builds exactly that type, no code generation, no `new Function` (CSP). A published JSON Schema can be generated later if others need it.                                      |
| Spike counter-checks deferred / automated (2026-10-29)             | Tobias works remotely: veraPDF + qpdf resave tests move into step 8 (CI); DATEV round-trip = identical SHA-256, Acrobat/print checks → `manual_tests/90_pdf_gegenproben.md`, non-blocking.                                                   |
| `isPlainObject` checks "prototype's prototype is null"             | Vitest `vmThreads` (and `structuredClone`) create objects in another realm, so `=== Object.prototype` fails for legitimate JSON. Class instances, Date, Map are still rejected.                                                              |
| Invisible characters only as `\u` escapes in sources               | An editing tool decoded `\uXXXX` into literal characters (2026-10-29): invisible soft hyphens/NBSP in regexes, broken `String.raw` RFC vectors. Guarded by `tests/static/sourceCharacters.test.ts`. JSON test texts use `~` for backslashes. |

---

## Known Limitations

- **Foundation only (v0.1.0):** logic for canonicalisation, normalisation, validation and the form
  registry exists; no forms, no signature, no PDF yet — start screen placeholder.
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
- **PDF parsing runs in the main thread** (pdf.js "fake worker", because `file://` forbids blob
  workers): a huge or hostile PDF can freeze the tab — mitigated by import size limits (step 8).
- **Bundle ≈ 2.7 MB** once PDF support is wired in (pdf.js ≈ 1.7 MB, pdf-lib ≈ 0.6 MB).
- **PDF/A-2u not yet externally validated** — the spike passes a structural self-check only;
  veraPDF in CI decides (pulled forward to step 8), Acrobat Preflight is optional (MT-90). Never
  advertise "PDF/A" before that.
- **Print-to-PDF is not a supported path** — the original file must be forwarded. Step 8 tests that
  a PDF without readable data pages is refused with a clear message; real print output: MT-93.
- **Acrobat resave and DATEV round-trip not yet checked by hand** (MT-91/92, non-blocking; DATEV is
  known to keep files unchanged).
- **IBAN:** lengths known for 78 countries; other countries only get shape + MOD 97 and a warning.
  The national BBAN structure (e.g. German bank code) is not checked.
- **Versicherungsnummer:** only shape and check digit; area number and the birth-date part are not
  checked (a cross-check with the birth date will be a form rule).
- **Money:** at most 2 decimals, no negative amounts, at most 12 integer digits.
- **Field types `repeatGroup` and `file`** are not normalised yet (`type.unsupported`) — row ids and
  cross-role columns are designed with the first form that needs them (step 5). No compute
  functions exist yet, so `computed` fields are rejected.
- **`forms/published.json` immutability** is only checked against the current files; removing or
  editing an entry _together with_ its file is caught once CI compares with the last release (step
  12). Golden files guard only the fixture form so far.
- **Age check relies on self-reported data:** the birth date is the person's own answer and the
  signing day comes from the device clock; a wrong birth date or a manipulated clock is not
  detectable (a signature dated after a receipt is flagged as implausible).
- **The transmission gate is logic only so far** — the PDF writer must enforce it (step 8).
- **Fields of type `repeatGroup`/`file` cannot be sealed yet** (their values are not normalised).
- **Conditions cover one role only** — a field cannot depend on another role's answer (e.g. an
  employer field required because of the person's answer); no date/age comparisons in conditions.
- **Verification proves consistency, not authorship:** anyone can produce a fresh, self-consistent
  seal; only confirmations (other roles' seals, receipts, later the DATEV filing) raise the level,
  and receipts are as trustworthy as the station that wrote them.
- **Device clocks are trusted only within limits:** plausibility uses a 15-minute tolerance; a
  wrong but consistent device clock is not detectable.

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

Steps 0 (foundation), 1 (PDF spike, `docs/spike-pdf.md`), 2 (canonicalisation, normalisation,
validators, form definition decoder, registry) and 3 (seal, transitions, strict file decoder,
graded verification, tamper matrix, golden files) 4a (transmission rules: no transmission without
signature, guardian with name for minors, signature plausibility, completeness gaps) and 4b (field
logic: `requiredIf`, input only when available, condition operators, rule texts; `reopenPart`) done. Spike code is throw-away in
`.tmp/spike-pdf/` (re-check any PDF with `node .tmp/spike-pdf/check.ts <pdf>`). The spike's manual
counter-checks are no longer blocking (see `manual_tests/90_pdf_gegenproben.md`).
**Next: step 4c — merge (logic)** with the merge rule above and per-field provenance: duplicates with the same hash, version conflicts (field
comparison, a human decides), forks, matching without a shared id via `matchKeys`,
contradictions (`consistencyRules`), gaps via `completenessGaps`, `mergeRecord` + `mergeHash`,
associativity as a property test.

_Last updated: 2026-10-29_
