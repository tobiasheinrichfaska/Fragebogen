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

| File/Folder                                           | Purpose                                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                           | This file — project conventions and status                                                                                                                                                                                                              |
| `README.md`                                           | Public description (German), legal status, license                                                                                                                                                                                                      |
| `FEATURES_REQUIRED.md`                                | Critical user paths the audit validates end-to-end                                                                                                                                                                                                      |
| `LICENSE`, `LICENSE_COMMERCIAL.md`, `CONTRIBUTING.md` | AGPLv3 + commercial dual licensing, CLA                                                                                                                                                                                                                 |
| `.gitattributes`                                      | LF line endings (workspace template)                                                                                                                                                                                                                    |
| `.gitignore`                                          | Ignores `node_modules/`, `dist/`, `.tmp/`, test reports, editor/OS junk                                                                                                                                                                                 |
| `package.json` / `package-lock.json`                  | Scripts and pinned dependencies                                                                                                                                                                                                                         |
| `vite.config.ts`                                      | Vite + singlefile build (`base: './'`, no modulePreload polyfill) and Vitest config (`pool: 'vmThreads'`)                                                                                                                                               |
| `tsconfig.json`                                       | Strict TS (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)                                                                                                                                                                              |
| `eslint.config.js`                                    | Flat config: TS strict, React hooks/refresh for `src/ui`, layering rules for `src/logic`                                                                                                                                                                |
| `.prettierrc.json`, `.prettierignore`                 | Formatting                                                                                                                                                                                                                                              |
| `index.html`                                          | Entry HTML (`lang="de"`, `data:` favicon, no external URLs)                                                                                                                                                                                             |
| `src/main.tsx`                                        | Mounts the React app                                                                                                                                                                                                                                    |
| `src/appInfo.ts`                                      | App name + version (version injected from `package.json` as `__APP_VERSION__`)                                                                                                                                                                          |
| `src/vite-env.d.ts`                                   | Vite client types, `__APP_VERSION__` declaration                                                                                                                                                                                                        |
| `src/logic/model.ts`                                  | Data model types + enumeration constants (`FIELD_TYPES`, …): form definition, questionnaire, part, seal, receipts                                                                                                                                       |
| `src/logic/dates.ts`                                  | Date-only arithmetic on `YYYY-MM-DD` strings; `ageOn` / `isMinorOn` (§§ 187, 188 BGB)                                                                                                                                                                   |
| `src/logic/jcs.ts`                                    | RFC 8785 canonical JSON (`canonicalize`), `isWellFormed` (no unpaired surrogates), realm-independent `isPlainObject`                                                                                                                                    |
| `src/logic/hash.ts`                                   | SHA-256 via `@noble/hashes`: `sha256Hex`, `canonicalHash` (= SHA-256 of JCS), `isSha256Hex`                                                                                                                                                             |
| `src/logic/issues.ts`                                 | `Checked<T>` result type, user-facing issue codes and their German messages (`ISSUE_MESSAGES`)                                                                                                                                                          |
| `src/logic/normalize.ts`                              | Input normalisation `canon: 1` (text, date, money, IBAN, tax id, SV number, choices); `normalizeFieldValue` dispatch table per field type                                                                                                               |
| `src/logic/validators.ts`                             | Check digits: IBAN (MOD 97-10), Steuer-ID (digit pattern + MOD 11,10), Versicherungsnummer                                                                                                                                                              |
| `src/logic/data/ibanLengths.ts`                       | IBAN length per country (78 countries; others: warning, length unchecked)                                                                                                                                                                               |
| `src/logic/decode.ts`                                 | `Decoder`: strict decoding of untrusted JSON with issue paths, no coercion/defaults                                                                                                                                                                     |
| `src/logic/formDefinition.ts`                         | `parseFormDefinition` = strict decode + reference checks (`checkFormDefinition`, rule list); id patterns; `findCycle`                                                                                                                                   |
| `src/logic/formRegistry.ts`                           | Registry by (id, version) and `definitionHash`; published list check; `checkFieldIdStability`; `compareVersions`                                                                                                                                        |
| `src/logic/compute.ts`                                | Named pure functions for `computed` fields (empty until step 5)                                                                                                                                                                                         |
| `src/logic/conditions.ts`                             | Condition operators as data (`equals`, `in`, `contains`, `answered` + `all`/`any`/`not`): `evaluateCondition`, `leafProblem`, `describeCondition` (German)                                                                                              |
| `src/logic/form.ts`                                   | Evaluating a definition against data: `visibility` (chained `showIf`), `fieldStates` (visible/required/missing incl. `requiredIf`), `sealableData`, `missingRequired`, `describeFieldRules`, `noticeHash`, lookups                                      |
| `src/logic/seal.ts`                                   | `SEAL_SCHEMA`, salted 64-bit `fieldHash`, `contentHashOf`, `strokesHashOf`, `diffFieldHashes`                                                                                                                                                           |
| `src/logic/strokes.ts`                                | Canonical delta text encoding of drawn signatures (`encodeStrokes` / strict `decodeStrokes`), limits                                                                                                                                                    |
| `src/logic/time.ts`                                   | Strict ISO 8601 UTC/local-with-offset parsing, `sameInstant`, durations                                                                                                                                                                                 |
| `src/logic/questionnaireFile.ts`                      | File format constants (`FORMAT`, `QUESTIONNAIRE_ID`) and the strict `decodeQuestionnaire` for untrusted files                                                                                                                                           |
| `src/logic/questionnaire.ts`                          | Pure state transitions: create, `startPart`, `setValue` (refuses input into unavailable fields), `discardDraft`, `reopenPart`, `sealPart`, `addReceipt`, `receivedPartFor`                                                                              |
| `src/logic/verify.ts`                                 | `verifyQuestionnaire`: graded verdicts, findings with severity + German messages, hash chain, receipts, time plausibility                                                                                                                               |
| `src/logic/merge.ts`                                  | `mergeSources`: verify sources, collapse identical versions, chain resolution (newer wins with note), conflicts for humans (`chooseVersion`), `link` decisions + matchKey proposals, merge record + hash, contradictions and gaps per group             |
| `src/logic/mergeRecord.ts`                            | `mergeHashOf` (record + receipts + all part hashes), `linkedQuestionnaireIds`                                                                                                                                                                           |
| `src/logic/consistency.ts`                            | `contradictions` from the form's `consistencyRules` (text compared case-insensitively)                                                                                                                                                                  |
| `src/logic/provenance.ts`                             | `signatureLayout`: one numbered signature line per sealed version, per field the covering lines and a footnote when changed in a later version                                                                                                          |
| `src/logic/catalogue.ts`                              | `formCatalogue`: readable German field catalogue (Markdown) of a definition for the expert review — roles, fields with owner/kind/availability/requirement/purpose, notices, rules, legal notes, `definitionHash`                                       |
| `src/logic/requirements.ts`                           | Transmission gate `transmissionBlockers` (no transmission without signatures; minor → guardian with name, bound to the current part), `roleRequirement`, `completenessGaps`                                                                             |
| `tests/support/sample.ts`                             | Shared fictitious scenarios (person signs, employer seals + chains, Kanzlei/DATEV receipt; second version; minor + guardian on form 1.1.0)                                                                                                              |
| `tests/golden/`                                       | Golden questionnaires (`beispiel-<version>/*.json`, never edited; `README.md`) + `golden.test.ts` (decode, verdicts, byte-identical rebuild)                                                                                                            |
| `src/logic/*.test.ts`                                 | Unit tests next to each module (RFC 8785 vectors, FIPS vectors, check digits, idempotence property tests, definition mutation tables)                                                                                                                   |
| `forms/`                                              | Form definitions `forms/<id>/<version>.json` (`sofortmeldung/0.1.0.json`, test version), `published.json` (frozen hashes), `README.md` (freeze rules, German)                                                                                           |
| `form-drafts/`                                        | Drafts under expert review, same layout (currently none); never bundled; publishing = move to `forms/` + add the hash; `README.md` (German)                                                                                                             |
| `docs/formulare/`                                     | Generated field catalogues `<id>-<version>.md` for every form and draft (`npm run catalogue`; never edit by hand), `README.md`                                                                                                                          |
| `tests/support/formFiles.ts`                          | Reads `forms/` and `form-drafts/` (lazy, so misnamed files are reported)                                                                                                                                                                                |
| `tests/forms/formDrafts.test.ts`                      | Guards `form-drafts/`: valid, filed by id/version, not yet published, newer than published versions, field ids stable                                                                                                                                   |
| `tests/forms/catalogue.test.ts`                       | `docs/formulare/` matches the definitions (file snapshots), no stale catalogues                                                                                                                                                                         |
| `tests/forms/sofortmeldung.test.ts`                   | The Sofortmeldung 0.1.0 through the engine: what is asked, preselections, notices, both station orders, part link, minor + guardian, name cross-check, master data                                                                                      |
| `src/logic/interview.ts`                              | Interview logic: `interviewSteps` (notices, available questions in form order with level and state, summary), `stepAfter`/`stepBefore`/`resumeStep`, `interviewProgress`, `interviewSummary` (missing, deferred, inactive answers with reason, notices) |
| `src/logic/dependencies.ts`                           | `fieldDependencies`: which answers rest on others (showIf level 0…n, requiredIf separately, what a field enables)                                                                                                                                       |
| `src/logic/dataPackage.ts`                            | Data package = questionnaire + its form definition (`fragebogen-paket` 1): `buildPackage`, `packageText` (JCS), strict `decodePackage` (definition must hash to the sealed one; origin `published` / `embedded`)                                        |
| `src/logic/dataPages.ts`                              | Data-page codec v1: deflate + base64url in numbered, checksummed lines; `encodeDataLines` / `decodeDataLines` (any order, names bad/missing lines), `inflatePackage`                                                                                    |
| `src/logic/qrParts.ts`                                | QR payloads `FBQ1 <id> <i>/<n> <sha16>\n` + binary chunk (700 bytes); `assembleQrPayloads` (any order, duplicates, names missing parts, refuses mixed/conflicting codes)                                                                                |
| `src/io/qr.ts`                                        | `qrMatrix` (qrcode-generator, MIT) and `readQrCodes` (jsQR, Apache-2.0): cuts the image along white rows/columns into cells, decodes each; `rasterize` for tests                                                                                        |
| `src/logic/masterDataLink.ts`                         | `masterDataFragment` / `parseMasterDataFragment`: master data in the bookmark link (`#stammdaten=1&…`), strict all-or-nothing parsing with German messages                                                                                              |
| `src/logic/masterData.ts`                             | `masterDataOf` / `applyMasterData`: a station's own master data (`FieldDefinition.masterData` keys) to remember on its device and fill in again; refused values reported                                                                                |
| `tests/fixtures/forms/beispiel/1.0.0.json`            | Fictitious fixture form (3 roles, showIf, notice, rule, match key) for the definition/registry tests; frozen by golden files                                                                                                                            |
| `tests/fixtures/forms/beispiel/1.1.0.json`            | Same form with a required guardian name field (`signerNameField`); frozen by golden files                                                                                                                                                               |
| `tests/forms/publishedForms.test.ts`                  | Guards the real `forms/` folder: valid, published, unchanged hash, file naming, field-id stability                                                                                                                                                      |
| `tests/static/sourceCharacters.test.ts`               | Fails on literal invisible/combining/separator characters in sources and docs (must be `\u` escapes)                                                                                                                                                    |
| `src/ui/App.tsx`                                      | App frame: screens start → "Wer füllt jetzt aus?" → interview → signature → done; banners, beforeunload warning, master-data link, file open/save                                                                                                       |
| `src/ui/StartScreen.tsx`                              | New questionnaire (latest published version per form, test versions marked), open file, delete all data                                                                                                                                                 |
| `src/ui/RolesScreen.tsx`                              | Role choice with state per role (guardian requirement), blockers and gaps, reopen / new version, save, PDF                                                                                                                                              |
| `src/ui/InterviewScreen.tsx`                          | Interview steps: notice (confirm), question (help, explainer, "Weiß ich gerade nicht"), summary (missing, deferred, inactive, other roles read-only, master-data link)                                                                                  |
| `src/ui/FieldInput.tsx`                               | Input per field type (text-like kept locally until "Weiter", choices/yes-no as buttons)                                                                                                                                                                 |
| `src/ui/fieldKinds.ts`                                | `isTextLike`                                                                                                                                                                                                                                            |
| `src/ui/SignatureScreen.tsx`                          | Step 7: confirmation text, draw / type / complete without signature (per role), seal with device time + system note                                                                                                                                     |
| `src/ui/SignaturePad.tsx`                             | Canvas drawing in the 1000×400 box (pointer events, no timing/pressure)                                                                                                                                                                                 |
| `src/ui/DoneScreen.tsx`                               | After sealing: time, system note, content hash, hand the device on                                                                                                                                                                                      |
| `src/ui/common.tsx`                                   | Banner, explainer link (configured host + frozen path), notice text, card                                                                                                                                                                               |
| `src/ui/pdfActions.ts`                                | PDF out/in glue (step 8)                                                                                                                                                                                                                                |
| `src/io/environment.ts`                               | UUID v4 + nonce via crypto.getRandomValues, device time (local with offset + UTC + IANA zone), system note (UA-CH or UA string), `InputTracker`                                                                                                         |
| `src/io/files.ts`                                     | Download via short-lived blob URL, size-limited file reading (25 MB)                                                                                                                                                                                    |
| `src/io/bundledForms.ts`                              | Published forms compiled in (import.meta.glob of forms/_/_.json + published.json), checked at start                                                                                                                                                     |
| `src/config.ts`                                       | Kanzlei configuration of this build (`__KANZLEI_CONFIG__`)                                                                                                                                                                                              |
| `config/`                                             | `kanzlei.example.json` (neutral, committed), `kanzlei.local.json` (gitignored, real name/addresses), `README.md`                                                                                                                                        |
| `src/logic/session.ts`                                | Device session as pure functions: start/from file, `roleStates`, `enterRole`/`startNewVersion`/`reopen`, interview navigation, `answer`/`defer`/`acknowledge`, `seal` (receipt notes from arrivals), master data                                        |
| `src/logic/display.ts`                                | `displayValue` / `editValue`: stored values as people read and type them (screen and PDF)                                                                                                                                                               |
| `src/logic/userAgent.ts`                              | OS/browser from UA Client Hints or the UA string (major version only)                                                                                                                                                                                   |
| `src/logic/appConfig.ts`                              | Strict decoder of the Kanzlei configuration (https only), `explainerUrl`                                                                                                                                                                                |
| `src/logic/fileNames.ts`                              | File names after § 9a BVV (≤ 64 chars, A–Z a–z 0–9 _), never a person's name                                                                                                                                                                            |
| `src/ui/styles.css`                                   | Base styles, light/dark                                                                                                                                                                                                                                 |
| `tests/static/indexHtml.test.ts`                      | Guards `index.html` against external URLs/stylesheets                                                                                                                                                                                                   |
| `docs/data-model.html`                                | Self-contained data-model reference (German) — regenerate when the model changes                                                                                                                                                                        |
| `docs/plan.md`                                        | Approved plan, step table with status (German)                                                                                                                                                                                                          |
| `docs/rechtliches.md`                                 | Legal background with sources (German, not legal advice)                                                                                                                                                                                                |
| `docs/spike-pdf.md`                                   | Step-1 PDF spike results + **data-page format v1** spec (German)                                                                                                                                                                                        |
| `assets/fonts/`                                       | Embedded PDF fonts: Noto Sans Regular/SemiBold + Noto Sans Mono, Latin subsets (OFL), `README.md` with source URLs, SHA-256 and the exact `pyftsubset` command                                                                                          |
| `manual_tests/`                                       | Human-tester instructions (German): `README.md`, `01_start.md`, `90_pdf_gegenproben.md` (Acrobat/DATEV/print counter-checks, non-blocking)                                                                                                              |
| `.tmp/`                                               | Gitignored scratch area (spikes, extracted files)                                                                                                                                                                                                       |

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
  This gate governs every hand-over to the next station; "complete for the recipient" is the
  stricter `completenessGaps` (all required roles present, all `partLinks` linked).
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
- **Merge rule (decided 2026-10-29, `merge.ts`):** same hash → collapse with a note;
  different versions of a role only as a `supersedes` chain (person re-signs at the employer) →
  the newer wins, with a note and the changed fields; anything else is a conflict, never picked
  automatically. Fields covered by different signing dates must be visible (footnotes, one
  signature line per covering version — `signatureLayout`, printed in step 8). Sources are verified
  first (altered versions, drafts and files with an altered merge record are left out, with a note);
  separate questionnaires are joined only by a human `link` decision (proposed via `matchKeys`) and
  then verify as `linkedByDecision` (no cryptographic link). The merged id is the smallest joined
  id; the merge record lists the original files and the human decisions; `mergeHash` covers record,
  receipts and all part hashes (`mergeAltered` otherwise). Merging is associative, order-independent
  and idempotent (property tests).
- **Signature plausibility:** drawn ≥ 5 points and ≥ 40 units wide (box 1000), typed ≥ 2 letters;
  rejects accidental taps, says nothing about whose signature it is.
- **Receipts** carry `source: 'app' | 'datev'` — the DATEV filing date is the trusted time anchor.
- **No JSON numbers** in questionnaire data; dates are strings, never routed through `Date`.
- **Canon 1** (`normalize.ts`): text → remove soft hyphen/zero-width/BOM and controls, all line
  breaks → LF, tab → space, NFC, collapse whitespace (per line for `multiline`), trim; empty → `null`.
  Date `TT.MM.JJJJ`/ISO → `YYYY-MM-DD`. Money German input (`1.234,56`; `1.234` = thousands) →
  `"1234.56"`. IBAN/SV number compact upper-case, tax id and Betriebsnummer digits only. Multi-choice
  sorted, unique.
  Every normaliser maps its own output to itself (property tests).
- **Form definitions** are decoded strictly (`decode.ts`): unknown keys, missing values, non-NFC
  strings are errors; nothing is defaulted, so `definitionHash` of raw JSON = of decoded object.
- **Form review workflow (2026-10-29):** a form starts as a draft in `form-drafts/`; its catalogue in
  `docs/formulare/` is generated from the JSON (so the approved text is exactly what gets frozen)
  and names the `definitionHash`. After Tobias's approval the file moves to `forms/` and its hash
  goes into `published.json`.
- **Sofortmeldung 0.1.0 (frozen test version, 2026-10-29; review applied):** birth and address details are
  always asked (Tobias: needed later anyway, all easily at hand); the Versicherungsnummer stays
  "falls bekannt". Birth name via a preselected yes/no ("gleich Familienname?" = Ja), address abroad
  via a preselected yes/no (= Nein) that opens "Staat". Tag der Beschäftigungsaufnahme exists
  **once**, as an employer field — so person and employer can never state different dates. The
  ID-carrying notice (§ 2a SchwarzArbG) is a `paperHandout` with the sector list as amended by
  SchwarzArbMoDiG (template 10/2024 outdated). The privacy notice stays with a confirmation click
  for now (Tobias: review in detail later).
- **Station order is free** (Tobias 2026-10-29): employer first (the person then signs over the
  employer part) or person first (the employer confirms the person part), on one device (role
  choice "Wer füllt jetzt aus?") or by passing the PDF. `partLinks` makes the link mandatory for
  completeness: whoever seals last confirms the other's current version; an employer change after
  the person signed breaks it (`partsNotLinked`) until one side re-seals. Passing on is never
  blocked by a missing part (`transmissionBlockers` only looks at existing parts).
- **Employer master data** (Tobias: the employer should be able to store Stammdaten on its device):
  fields carry a cross-form key (`masterData`, e.g. `firma`, `betriebsnummer`); `masterDataOf` /
  `applyMasterData` are pure, a loaded record is untrusted and every refused value is reported.
  **Storage = bookmark link (Tobias 2026-10-29, option C):** `masterDataLink.ts` writes the keys
  into the URL fragment (`#stammdaten=1&betriebsnummer=…&firma=…`), the employer bookmarks it
  (or the Kanzlei sends one per Mandant). The browser stores nothing, so "store nothing" holds
  without exception. Master data are single text values only (definition rule).
- **Interview** (Tobias 2026-10-29): the default input for person **and** employer; the Kanzlei
  uses the form view (step 9). One step per screen from the definition (no AI, no network):
  notices first, then the available questions in form order (a follow-up right after the answer
  that opens it), then the summary. `question` / `help` texts per field are part of the
  definition (hence before freezing). **"Weiß ich gerade nicht"** = `deferQuestion`: the mark
  lives in the draft (`Part.deferred`, survives the interim file, never sealed); a deferred
  required question still blocks signing. **Answers whose condition no longer holds stay in the
  draft** and return when it holds again; they are dropped only at signing, and the summary lists
  them with the reason first. Dependencies are explicit per level (`fieldDependencies`, catalogue
  tree). Definition rule: `showIf` only looks back in form order (`requiredIf` may look ahead).
- **Form versions 0.x are test versions** (Tobias 2026-10-29, `isTestVersion`): frozen like any
  other, but deletable before the first release as long as no real questionnaire used them;
  from 1.0.0 on a version stays forever. The app itself is 0.1.0 as well.
- **QR codes for the paper path** (decided 2026-10-29): the data pages additionally carry the
  compressed package as numbered QR codes (byte mode, error correction M, 700 bytes each), so a
  scan or a phone photo of the printed PDF can be read back and verified like the PDF. The
  electronic file stays the original. Libraries (pinned, no install scripts, no dependencies):
  qrcode-generator 2.0.4 (MIT) and jsQR 1.4.0 (Apache-2.0). **Probed 2026-10-30: jsQR finds no
  code at all when several are visible** — the layout keeps 12-module white gaps and the reader
  cuts the image along white rows and columns into cells first.
- **The form definition travels in the PDF** (Tobias 2026-10-29): data pages, QR codes and the
  interim file carry one package `{ questionnaire, definition }`. The seal pins the definition
  by hash, so a changed definition is refused; the published list still decides whether the app
  vouches for the form (`origin: published`) or only the file describes it (`embedded`, shown
  as such). Bundled forms can therefore be retired later without old PDFs becoming unreadable.
- **Explainer videos on the Kanzlei homepage** (Tobias 2026-10-29): the form freezes a **path**
  per field or notice (`explainer`, e.g. `sofortmeldung/versicherungsnummer`); the host comes
  from the Kanzlei configuration, so the public repo stays neutral. Links open outside the app
  (never embedded: offline, CSP, no tracking inside the app). The frozen link does not freeze the
  video itself.
- **Preselection** (`initial`): yes/no or choice answers set when the role's first version opens;
  only on always available fields.

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

- **UI checked by a throw-away headless smoke run only** (Edge via CDP on `file://`, screenshots,
  2026-10-30: employer first → person signs with the mouse → "Vollständig"); automated E2E in three
  engines comes with step 10. Touch/pen on real devices: manual tests MT-21.
- **No form view for the Kanzlei yet** (step 9); the Kanzlei can open files and see the overview.
- **Interview progress counts preselected answers** as answered ("2 von etwa 14" at the start).
- **Notice confirmations are not saved in the interim file** — they must be given again in the
  session that signs (deliberate: they belong to the signing).
- **No CSP yet:** the strict Content-Security-Policy and the built-file no-network test arrive in
  step 10. The source `index.html` is already guarded against external URLs.
- **Simple electronic signature only** (eIDAS Art. 3 Nr. 10) — not qualified; device time is not
  verifiable; hashes detect accidental/naive changes, not full regeneration. Never promised as
  "rechtsgültig".
- **Forms that need written form** (e.g. RV-Befreiungsantrag, § 6 Abs. 1b SGB VI) still need paper
  (or QES / scan + advanced employer signature); paper notices are handed out on paper.
- **iPhone/iPad cannot run the HTML file locally** — they need the hosted copy (step 12). Android:
  Chrome only, via the Files app.
- **Printing and re-scanning** a PDF destroys the machine-readable text lines of the data pages
  (OCR of base64 is unreliable). QR codes on the data pages are decided (Tobias 2026-10-29) and
  arrive with step 8; until then paper is a readable copy only.
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
- **Betriebsnummer:** only "exactly 8 digits"; the check digit is not checked (algorithm not
  publicly documented).
- **Master-data link without UI yet:** creating and reading the bookmark link comes with step 6.
  The fragment never reaches the server but stays in bookmarks and the browser history — fine
  for the employer's own data, never for the person's.
- **Privacy notice of the Sofortmeldung** is a first version (confirmation click); a detailed
  review is pending (Tobias, 2026-10-29).
- **Only a test version is published:** Sofortmeldung 0.1.0 may still be deleted before the first
  release (no real questionnaires yet); no golden files for it until a permanent 1.0.0. Drafts are
  never bundled into the app.
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
- **Merge needs the form in the registry** for labels, contradictions and gaps; unknown forms are
  merged without them. A receipt is added by the Kanzlei station (step 9), not by the merge.
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
logic: `requiredIf`, input only when available, condition operators, rule texts; `reopenPart`) and
4c (merge with the agreed rules, link proposals, contradictions, gaps, signature layout) done. Spike code is throw-away in
`.tmp/spike-pdf/` (re-check any PDF with `node .tmp/spike-pdf/check.ts <pdf>`). The spike's manual
counter-checks are no longer blocking (see `manual_tests/90_pdf_gegenproben.md`).
**Steps 6 (UI: start, role choice, interview, summary, interim file, master-data link) and 7
(signature: draw / type / without, system note) done** with the Sofortmeldung; smoke-tested headless.
**Next: step 8 — PDF** (write with data pages + QR codes + signature lines, read back, scans).
**Step 5 in progress — forms:** 5a (draft, catalogue generator, `betriebsnummer`, German condition
word order) and 5b (review applied: all birth/address data, preselected yes/no questions, `initial`,
`masterData`, `partLinks` + `partsNotLinked`), master data as bookmark link (decision C) and 5c
(interview logic: `interview.ts`, `dependencies.ts`, `deferQuestion`, `question`/`help` texts,
interview-order rule; Sofortmeldung question and help texts drafted) done. The Sofortmeldung is frozen as
test version **0.1.0** (`forms/sofortmeldung/0.1.0.json`, catalogue
`docs/formulare/sofortmeldung-0.1.0.md`). **Next:** draft the general Personalfragebogen the
same way (draft → catalogue → approval → 0.x freeze). Decided for step 8: QR codes on the data
pages (paper path) and a visible address of the app plus a clickable URI link (address from
configuration, never data in the link). Planned for step 6: links to explainer videos from the
configuration.

_Last updated: 2026-10-29_
