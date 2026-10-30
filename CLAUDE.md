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

| File/Folder                                           | Purpose                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                           | This file — project conventions and status                                                                                                                                                                                                                                                                                                                     |
| `README.md`                                           | Public description (German), legal status, license                                                                                                                                                                                                                                                                                                             |
| `FEATURES_REQUIRED.md`                                | Critical user paths the audit validates end-to-end                                                                                                                                                                                                                                                                                                             |
| `LICENSE`, `LICENSE_COMMERCIAL.md`, `CONTRIBUTING.md` | AGPLv3 + commercial dual licensing, CLA                                                                                                                                                                                                                                                                                                                        |
| `.gitattributes`                                      | LF line endings (workspace template)                                                                                                                                                                                                                                                                                                                           |
| `.gitignore`                                          | Ignores `node_modules/`, `dist/`, `.tmp/`, test reports, editor/OS junk                                                                                                                                                                                                                                                                                        |
| `package.json` / `package-lock.json`                  | Scripts and pinned dependencies                                                                                                                                                                                                                                                                                                                                |
| `vite.config.ts`                                      | Vite + singlefile build (`base: './'`, no modulePreload polyfill) and Vitest config (`pool: 'vmThreads'`)                                                                                                                                                                                                                                                      |
| `tsconfig.json`                                       | Strict TS (incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)                                                                                                                                                                                                                                                                                     |
| `eslint.config.js`                                    | Flat config: TS strict, React hooks/refresh for `src/ui`, layering rules for `src/logic`                                                                                                                                                                                                                                                                       |
| `.prettierrc.json`, `.prettierignore`                 | Formatting                                                                                                                                                                                                                                                                                                                                                     |
| `index.html`                                          | Entry HTML (`lang="de"`, `data:` favicon, no external URLs)                                                                                                                                                                                                                                                                                                    |
| `src/main.tsx`                                        | Mounts the React app                                                                                                                                                                                                                                                                                                                                           |
| `src/appInfo.ts`                                      | App name + version (version injected from `package.json` as `__APP_VERSION__`)                                                                                                                                                                                                                                                                                 |
| `src/vite-env.d.ts`                                   | Vite client types, `__APP_VERSION__` declaration                                                                                                                                                                                                                                                                                                               |
| `src/logic/model.ts`                                  | Data model types + enumeration constants (`FIELD_TYPES`, …): form definition, questionnaire, part, seal, receipts                                                                                                                                                                                                                                              |
| `src/logic/dates.ts`                                  | Date-only arithmetic on `YYYY-MM-DD` strings; `ageOn` / `isMinorOn` (§§ 187, 188 BGB)                                                                                                                                                                                                                                                                          |
| `src/logic/jcs.ts`                                    | RFC 8785 canonical JSON (`canonicalize`), `isWellFormed` (no unpaired surrogates), realm-independent `isPlainObject`                                                                                                                                                                                                                                           |
| `src/logic/hash.ts`                                   | SHA-256 via `@noble/hashes`: `sha256Hex`, `canonicalHash` (= SHA-256 of JCS), `isSha256Hex`                                                                                                                                                                                                                                                                    |
| `src/logic/issues.ts`                                 | `Checked<T>` result type, user-facing issue codes and their German messages (`ISSUE_MESSAGES`)                                                                                                                                                                                                                                                                 |
| `src/logic/normalize.ts`                              | Input normalisation `canon: 1` (text, date, money, IBAN, tax id, SV number, choices); `normalizeFieldValue` dispatch table per field type                                                                                                                                                                                                                      |
| `src/logic/validators.ts`                             | Check digits: IBAN (MOD 97-10), Steuer-ID (digit pattern + MOD 11,10), Versicherungsnummer                                                                                                                                                                                                                                                                     |
| `src/logic/data/ibanLengths.ts`                       | IBAN length per country (78 countries; others: warning, length unchecked)                                                                                                                                                                                                                                                                                      |
| `src/logic/decode.ts`                                 | `Decoder`: strict decoding of untrusted JSON with issue paths, no coercion/defaults                                                                                                                                                                                                                                                                            |
| `src/logic/formDefinition.ts`                         | `parseFormDefinition` = strict decode + reference checks (`checkFormDefinition`, rule list); id patterns; `findCycle`                                                                                                                                                                                                                                          |
| `src/logic/formRegistry.ts`                           | Registry by (id, version) and `definitionHash`; published list check; `checkFieldIdStability`; `compareVersions`                                                                                                                                                                                                                                               |
| `src/logic/compute.ts`                                | Named pure functions for `computed` fields (empty until step 5)                                                                                                                                                                                                                                                                                                |
| `src/logic/conditions.ts`                             | Condition operators as data (`equals`, `in`, `contains`, `answered` + `all`/`any`/`not`): `evaluateCondition`, `leafProblem`, `describeCondition` (German)                                                                                                                                                                                                     |
| `src/logic/form.ts`                                   | Evaluating a definition against data: `visibility` (chained `showIf`), `fieldStates` (visible/required/missing incl. `requiredIf`), `sealableData`, `missingRequired`, `describeFieldRules`, `noticeHash`, lookups                                                                                                                                             |
| `src/logic/seal.ts`                                   | `SEAL_SCHEMA`, salted 64-bit `fieldHash`, `contentHashOf`, `strokesHashOf`, `diffFieldHashes`                                                                                                                                                                                                                                                                  |
| `src/logic/strokes.ts`                                | Canonical delta text encoding of drawn signatures (`encodeStrokes` / strict `decodeStrokes`), limits                                                                                                                                                                                                                                                           |
| `src/logic/time.ts`                                   | Strict ISO 8601 UTC/local-with-offset parsing, `sameInstant`, durations                                                                                                                                                                                                                                                                                        |
| `src/logic/questionnaireFile.ts`                      | File format constants (`FORMAT`, `QUESTIONNAIRE_ID`) and the strict `decodeQuestionnaire` for untrusted files                                                                                                                                                                                                                                                  |
| `src/logic/questionnaire.ts`                          | Pure state transitions: create, `startPart`, `setValue` (refuses input into unavailable fields), `discardDraft`, `reopenPart`, `sealPart`, `addReceipt`, `receivedPartFor`                                                                                                                                                                                     |
| `src/logic/verify.ts`                                 | `verifyQuestionnaire`: graded verdicts, findings with severity + German messages, hash chain, receipts, time plausibility                                                                                                                                                                                                                                      |
| `src/logic/merge.ts`                                  | `mergeSources`: verify sources, collapse identical versions, chain resolution (newer wins with note), conflicts for humans (`chooseVersion`), `link` decisions + matchKey proposals, merge record + hash, contradictions and gaps per group                                                                                                                    |
| `src/logic/mergeRecord.ts`                            | `mergeHashOf` (record + receipts + all part hashes), `linkedQuestionnaireIds`                                                                                                                                                                                                                                                                                  |
| `src/logic/kanzlei.ts`                                | Kanzlei station: inbox of decoded files (duplicates by SHA-256), human decisions (`decide`/`withdraw`, a new version choice replaces the old), `mergeInbox` with the forms the files describe, `withKanzleiReceipts` (one receipt per file with its parts, arrival time, never twice for a part; renews the merge hash; refused receipts returned with reason) |
| `src/logic/hints.ts`                                  | Check hints (Prüfhinweise): `checkHints` over the current parts of all roles (hidden fields count as unanswered; only once every named role has a part), named tests `HINT_TESTS` (Regelaltersgrenze from birth date and start of employment), `describeHint` for the catalogue; informational only, never sealed                                              |
| `src/logic/derivations.ts`                            | `derive`: proposals from the form's rule tables (Personengruppe; first match wins, status proposed/incomplete/excluded/none, check flag), `describeRule`                                                                                                                                                                                                       |
| `tests/forms/personengruppe.test.ts`                  | Personengruppe proposals per case (109 incl. other jobs and above the limit, 110, 102/121/122, 123, 190, 105, 106, 108, 103, 119/120, 101), year without Rechengrößen, special case, missing part, rule checks                                                                                                                                                 |
| `src/logic/validity.ts`                               | Validity of a form version: `withinValidity` (date or month, inclusive), `describeValidity` (German), `validityRole`, `outsideValidity` (reference date of a role's data outside the period)                                                                                                                                                                   |
| `src/logic/data/rechengroessen.ts`                    | `RECHENGROESSEN` per year (SVBezGrV): JAEG, BBG KV/PV and RV — fixed reference data for the check hints                                                                                                                                                                                                                                                        |
| `tests/forms/vorfragen.test.ts`                       | Pre-questions and exclusions: firm attributes in the link (yes/no, choice), per-person questions, each special case blocks signing and passing on, fixed term under a week, Vorruhestandsgeld without work questions, Werkstudent semester break                                                                                                               |
| `tests/forms/review1030b.test.ts`                     | Review of 2026-10-30: payment way and BIC (`startsWith`), preliminary tax data, hints (multiple jobs over BBG/JAEG, fixed term, status marker, Versorgungswerk, A1, missing year), Sozialkasse, validity (warning, refused seal, blocker, rules)                                                                                                               |
| `src/logic/regelaltersgrenze.ts`                      | Regelaltersgrenze by birth year (§ 235 Abs. 2 SGB VI), day it is reached (§§ 187, 188 BGB), `monthAfter`                                                                                                                                                                                                                                                       |
| `src/logic/consistency.ts`                            | `contradictions` from the form's `consistencyRules` (text compared case-insensitively)                                                                                                                                                                                                                                                                         |
| `src/logic/provenance.ts`                             | `signatureLayout`: one numbered signature line per sealed version, per field the covering lines and a footnote when changed in a later version                                                                                                                                                                                                                 |
| `src/logic/catalogue.ts`                              | `formCatalogue`: readable German field catalogue (Markdown) of a definition for the expert review — roles, fields with owner/kind/availability/requirement/purpose, notices, rules, legal notes, `definitionHash`                                                                                                                                              |
| `src/logic/flowPlan.ts`                               | `flowPlan`: the flow plan of a form (station order notes, per station the questions in interview order with level, condition, depending numbers, `because`, taken-over answers, decision points); `unexplainedConditions`                                                                                                                                      |
| `src/build/flowPlanPage.ts`                           | Renders all flow plans as one self-contained German HTML page (`docs/ablaufplan.html`, no script, no external resources)                                                                                                                                                                                                                                       |
| `docs/ablaufplan.html`                                | Generated flow plans of every form and draft (`npm run catalogue`; never edit by hand)                                                                                                                                                                                                                                                                         |
| `docs/ki-anleitung-formulare.md`                      | Prompt for any AI (and reference for people) to build or adapt a form definition: principles, every key and value, an example, checklist (German)                                                                                                                                                                                                              |
| `tests/static/kiAnleitung.test.ts`                    | The AI guide names every form/role/field key, type, operator and enum value, and its example is a valid definition                                                                                                                                                                                                                                             |
| `tests/forms/flowPlan.test.ts`                        | `docs/ablaufplan.html` matches the definitions, loads nothing external; every draft explains every condition; Personalfragebogen plan (numbers, decision on the kind of wage tax, "employer first", guardian)                                                                                                                                                  |
| `tests/forms/minijobSteuer.test.ts`                   | Minijob: the employer's kind of wage tax is taken over into the person part (`fromRole`), not asked, tax-class questions only without a flat rate; person first; lock; replaced answers; check hint on a later contradiction; the person part verifies alone                                                                                                   |
| `tests/forms/editAnswers.test.ts`                     | Changing answers from the summary (back there after the opened follow-ups), taking back a voluntary answer, definition rules for `fromRole` and `because`                                                                                                                                                                                                      |
| `src/logic/requirements.ts`                           | Transmission gate `transmissionBlockers` (no transmission without signatures; minor → guardian with name, bound to the current part), `roleRequirement`, `completenessGaps`                                                                                                                                                                                    |
| `tests/support/sample.ts`                             | Shared fictitious scenarios (person signs, employer seals + chains, Kanzlei/DATEV receipt; second version; minor + guardian on form 1.1.0)                                                                                                                                                                                                                     |
| `tests/golden/`                                       | Golden questionnaires (`beispiel-<version>/*.json`, never edited; `README.md`) + `golden.test.ts` (decode, verdicts, byte-identical rebuild)                                                                                                                                                                                                                   |
| `src/logic/*.test.ts`                                 | Unit tests next to each module (RFC 8785 vectors, FIPS vectors, check digits, idempotence property tests, definition mutation tables)                                                                                                                                                                                                                          |
| `forms/`                                              | Form definitions `forms/<id>/<version>.json` (`sofortmeldung/0.1.0.json`, test version), `published.json` (frozen hashes), `README.md` (freeze rules, German)                                                                                                                                                                                                  |
| `form-drafts/`                                        | Drafts under expert review, same layout (`personalfragebogen`, `steuerfreigabe`, `dienstwagen`, `lohnmeldung` 0.1.0; `sofortmeldung` 0.2.0 with the review of 2026-10-30); never bundled; publishing = move to `forms/` + add the hash; `README.md` (German)                                                                                                   |
| `docs/formulare/`                                     | Generated field catalogues `<id>-<version>.md` for every form and draft (`npm run catalogue`; never edit by hand), `README.md`                                                                                                                                                                                                                                 |
| `tests/support/formFiles.ts`                          | Reads `forms/` and `form-drafts/` (lazy, so misnamed files are reported)                                                                                                                                                                                                                                                                                       |
| `tests/forms/formDrafts.test.ts`                      | Guards `form-drafts/`: valid, filed by id/version, not yet published, newer than published versions, field ids stable                                                                                                                                                                                                                                          |
| `tests/forms/catalogue.test.ts`                       | `docs/formulare/` matches the definitions (file snapshots), no stale catalogues                                                                                                                                                                                                                                                                                |
| `tests/forms/sofortmeldung.test.ts`                   | The Sofortmeldung 0.1.0 through the engine: what is asked, preselections, notices, both station orders, part link, minor + guardian, name cross-check, master data                                                                                                                                                                                             |
| `tests/forms/prefill.test.ts`                         | Sofortmeldung → Personalfragebogen draft, last month → new questionnaire (`carryOver: false` stays empty, sealed parts untouched)                                                                                                                                                                                                                              |
| `tests/forms/kanzlei.test.ts`                         | Kanzlei inbox with the Sofortmeldung: duplicates, merge, receipts per file (all parts confirmed), merged file read again, conflicts + choice + withdrawal, proposals + link                                                                                                                                                                                    |
| `tests/forms/personalfragebogen.test.ts`              | The Personalfragebogen draft per employment variant (student/Minijob, unemployed helper, pensioner + Aktivrente, private KV, children, working-time models) and complete sealable parts                                                                                                                                                                        |
| `tests/forms/newForms.test.ts`                        | Drafts of 2026-10-30: Steuerfreigabe (spouse only at a joint assessment), Lohnmeldung (taken over from last month: month +1, monthly values empty), Dienstwagen (charging questions per drive, both parts sealable)                                                                                                                                            |
| `tests/forms/hints.test.ts`                           | Check hints of the Personalfragebogen draft (job seeker + short-term, kind of employment, Regelaltersgrenze computed) and their definition rules                                                                                                                                                                                                               |
| `tests/forms/sofortmeldung020.test.ts`                | Sofortmeldung 0.2.0 draft: "abroad?" before the postcode, German postcode checked, foreign postcode as text, quick answers, birth-name placeholder                                                                                                                                                                                                             |
| `src/logic/inputHelpers.test.ts`                      | German postcode format, placeholders in question texts, definition rules for placeholders, quick answers and text formats                                                                                                                                                                                                                                      |
| `src/logic/interview.ts`                              | Interview logic: `interviewSteps` (notices, available questions in form order with level and state, summary), `stepAfter`/`stepBefore`/`resumeStep`, `interviewProgress`, `interviewSummary` (missing, deferred, inactive answers with reason, notices)                                                                                                        |
| `src/logic/dependencies.ts`                           | `fieldDependencies`: which answers rest on others (showIf level 0…n, requiredIf separately, what a field enables)                                                                                                                                                                                                                                              |
| `src/logic/dataPackage.ts`                            | Data package = questionnaire + its form definition (`fragebogen-paket` 1): `buildPackage`, `packageText` (JCS), strict `decodePackage` (definition must hash to the sealed one; origin `published` / `embedded`)                                                                                                                                               |
| `src/logic/dataPages.ts`                              | Data-page codec v1: deflate + base64url in numbered, checksummed lines; `encodeDataLines` / `decodeDataLines` (any order, names bad/missing lines), `inflatePackage`                                                                                                                                                                                           |
| `src/logic/qrParts.ts`                                | QR payloads `FBQ1 <id> <i>/<n> <sha16>\n` + binary chunk (700 bytes); `assembleQrPayloads` (any order, duplicates, names missing parts, refuses mixed/conflicting codes)                                                                                                                                                                                       |
| `src/io/qr.ts`                                        | `qrMatrix` (qrcode-generator, MIT) and `readQrCodes` (jsQR, Apache-2.0): cuts the image along white rows/columns into cells, decodes each; `rasterize` for tests                                                                                                                                                                                               |
| `src/logic/masterDataLink.ts`                         | `masterDataFragment` / `parseMasterDataFragment`: master data in the bookmark link (`#stammdaten=1&…`), strict all-or-nothing parsing with German messages                                                                                                                                                                                                     |
| `src/logic/masterData.ts`                             | `masterDataOf` / `applyMasterData`: a station's own master data (`FieldDefinition.masterData` keys) to remember on its device and fill in again; refused values reported                                                                                                                                                                                       |
| `src/logic/prefill.ts`                                | `prefillFrom`: answers taken over from another questionnaire (Sofortmeldung → Personalfragebogen, last month → new month) by field id, role and type, only into empty fields, never `carryOver: false`; report per role                                                                                                                                        |
| `tests/fixtures/forms/beispiel/1.0.0.json`            | Fictitious fixture form (3 roles, showIf, notice, rule, match key) for the definition/registry tests; frozen by golden files                                                                                                                                                                                                                                   |
| `tests/fixtures/forms/beispiel/1.1.0.json`            | Same form with a required guardian name field (`signerNameField`); frozen by golden files                                                                                                                                                                                                                                                                      |
| `tests/forms/publishedForms.test.ts`                  | Guards the real `forms/` folder: valid, published, unchanged hash, file naming, field-id stability                                                                                                                                                                                                                                                             |
| `tests/static/sourceCharacters.test.ts`               | Fails on literal invisible/combining/separator characters in sources and docs (must be `\u` escapes)                                                                                                                                                                                                                                                           |
| `src/ui/App.tsx`                                      | App frame: screens start → "Wer füllt jetzt aus?" → interview → signature → done; banners, beforeunload warning, master-data link, file open/save                                                                                                                                                                                                              |
| `src/ui/StartScreen.tsx`                              | New questionnaire (latest published version per form, test versions marked), open file, delete all data                                                                                                                                                                                                                                                        |
| `src/ui/RolesScreen.tsx`                              | Role choice with state per role (guardian requirement), blockers and gaps, reopen / new version, save, PDF                                                                                                                                                                                                                                                     |
| `src/ui/KanzleiScreen.tsx`                            | Station Kanzlei: batch import, report per file, link proposals, conflicts with field comparison and "Diese Fassung gilt", decisions with withdrawal, notes/contradictions/gaps, PDF for the Personalakte and JSON                                                                                                                                              |
| `src/ui/FormView.tsx`                                 | Read-only form view: answers by section with owner, footnotes for later versions, signature lines, receipts                                                                                                                                                                                                                                                    |
| `src/ui/InterviewScreen.tsx`                          | Interview steps: notice (confirm), question (help, explainer, "Weiß ich gerade nicht"), summary (missing, deferred, inactive, other roles read-only, master-data link)                                                                                                                                                                                         |
| `src/ui/TableStep.tsx`                                | Interview step for a table: one card per row (`rowLabel`), add/remove rows, error at the offending cell                                                                                                                                                                                                                                                        |
| `src/ui/FieldInput.tsx`                               | Input per field type (text-like kept locally until "Weiter", choices/yes-no as buttons)                                                                                                                                                                                                                                                                        |
| `src/ui/fieldKinds.ts`                                | `isTextLike`                                                                                                                                                                                                                                                                                                                                                   |
| `src/ui/SignatureScreen.tsx`                          | Step 7: confirmation text, draw / type / complete without signature (per role), seal with device time + system note                                                                                                                                                                                                                                            |
| `src/ui/SignaturePad.tsx`                             | Canvas drawing in the 1000×400 box (pointer events, no timing/pressure)                                                                                                                                                                                                                                                                                        |
| `src/ui/DoneScreen.tsx`                               | After sealing: time, system note, content hash, hand the device on                                                                                                                                                                                                                                                                                             |
| `src/ui/common.tsx`                                   | Banner, explainer link (configured host + frozen path), notice text, card                                                                                                                                                                                                                                                                                      |
| `src/ui/pdfActions.ts`                                | PDF out (only without transmission blockers) and in (data pages, else QR codes of a scan; photos collected until all parts are there), verification report                                                                                                                                                                                                     |
| `src/io/pdfWriter.ts`                                 | One PDF: readable part (sections, employer fields shaded, footnotes), notices, signature lines with vector signature + system note, legal notes, Prüfblatt, data pages (text), QR pages, footer; app link annotation; PDF/A-2u; saved without object streams                                                                                                   |
| `src/io/pdfReader.ts`                                 | pdf.js text → visual lines (`readPdfText`, `groupLines`), `editClues` (appended update, foreign producer), `renderPdfPages` / `imageFileToRgba` for scans and photos (browser)                                                                                                                                                                                 |
| `tests/io/`                                           | PDF write/read round trip, PDF/A markers, no script/attachment/launch, data lines inside the page, re-save survival, import reports (`pdf.test.ts`, `import.test.ts`)                                                                                                                                                                                          |
| `tests/support/sofortmeldungSession.ts`               | A completed Sofortmeldung played through the session (employer first, person signs)                                                                                                                                                                                                                                                                            |
| `src/io/environment.ts`                               | UUID v4 + nonce via crypto.getRandomValues, device time (local with offset + UTC + IANA zone), system note (UA-CH or UA string), `InputTracker`                                                                                                                                                                                                                |
| `src/io/files.ts`                                     | Download via short-lived blob URL, size-limited file reading (25 MB)                                                                                                                                                                                                                                                                                           |
| `src/io/bundledForms.ts`                              | Published forms compiled in (import.meta.glob of forms/_/_.json + published.json), checked at start                                                                                                                                                                                                                                                            |
| `src/build/csp.ts`                                    | Build step: Content-Security-Policy meta with the SHA-256 of exactly the inlined script and style (`withCsp`, applied to the written `index.html`); refuses external scripts/stylesheets                                                                                                                                                                       |
| `playwright.config.ts`                                | Playwright 1.61.0: projects chromium, firefox, webkit; tests in `tests/e2e/`                                                                                                                                                                                                                                                                                   |
| `tests/e2e/flow.spec.ts`                              | E2E from `file://`: Sofortmeldung employer → person signs → PDF → reopen → Kanzlei → PDF for the personnel file; CSP refuses a fetch; the built file carries the policy                                                                                                                                                                                        |
| `tests/e2e/guards.ts`                                 | Guards for every E2E run: only file:/data:/blob: requests, no CSP violation, no console error, nothing in browser storage                                                                                                                                                                                                                                      |
| `src/build/replacementChar.ts`                        | Build step: writes U+FFFD in the bundle as its escape (tools refuse the literal character)                                                                                                                                                                                                                                                                     |
| `src/config.ts`                                       | Kanzlei configuration of this build (`__KANZLEI_CONFIG__`)                                                                                                                                                                                                                                                                                                     |
| `config/`                                             | `kanzlei.example.json` (neutral, committed), `kanzlei.local.json` (gitignored, real name/addresses), `README.md`                                                                                                                                                                                                                                               |
| `src/logic/session.ts`                                | Device session as pure functions: start/from file, `roleStates`, `enterRole`/`startNewVersion`/`reopen`, interview navigation, `answer`/`defer`/`acknowledge`, `seal` (receipt notes from arrivals), master data                                                                                                                                               |
| `src/logic/display.ts`                                | `displayValue` / `editValue`: stored values as people read and type them (screen and PDF)                                                                                                                                                                                                                                                                      |
| `src/logic/userAgent.ts`                              | OS/browser from UA Client Hints or the UA string (major version only)                                                                                                                                                                                                                                                                                          |
| `src/logic/appConfig.ts`                              | Strict decoder of the Kanzlei configuration (https only), `explainerUrl`                                                                                                                                                                                                                                                                                       |
| `src/logic/fileNames.ts`                              | File names after § 9a BVV (≤ 64 chars, A–Z a–z 0–9 _), never a person's name                                                                                                                                                                                                                                                                                   |
| `src/ui/styles.css`                                   | Base styles, light/dark                                                                                                                                                                                                                                                                                                                                        |
| `tests/static/indexHtml.test.ts`                      | Guards `index.html` against external URLs/stylesheets                                                                                                                                                                                                                                                                                                          |
| `docs/data-model.html`                                | Self-contained data-model reference (German) — regenerate when the model changes                                                                                                                                                                                                                                                                               |
| `docs/plan.md`                                        | Approved plan, step table with status (German)                                                                                                                                                                                                                                                                                                                 |
| `docs/rechtliches.md`                                 | Legal background with sources (German, not legal advice)                                                                                                                                                                                                                                                                                                       |
| `docs/spike-pdf.md`                                   | Step-1 PDF spike results + **data-page format v1** spec (German)                                                                                                                                                                                                                                                                                               |
| `assets/fonts/`                                       | Embedded PDF fonts: Noto Sans Regular/SemiBold + Noto Sans Mono, Latin subsets (OFL), `README.md` with source URLs, SHA-256 and the exact `pyftsubset` command                                                                                                                                                                                                 |
| `manual_tests/`                                       | Human-tester instructions (German): `README.md`, `01_start.md` … `05_kanzlei.md`, `06_aendern_und_ablauf.md` (changing answers, Minijob tax, flow plan), `90_pdf_gegenproben.md` (Acrobat/DATEV/print counter-checks, non-blocking)                                                                                                                            |
| `.tmp/`                                               | Gitignored scratch area (spikes, extracted files)                                                                                                                                                                                                                                                                                                              |

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
  sorted, unique. Number (hours, km …) German input → string with exactly `decimals` (0–2) places,
  minus only when `signed`; month `MM.JJJJ` → `YYYY-MM`. Tables: rows `{ rowId: "r1", … }`, each
  cell by its column type, all-empty rows dropped.
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
- **PDF layout** (step 8): saved without object streams so every dictionary stays searchable (no
  script, attachment or launch action — tested); QR modules 0.5 mm with 12-module white gaps; the
  data block includes the form definition; the app address (configuration) is printed and linked.
- **Explainer videos on the Kanzlei homepage** (Tobias 2026-10-29): the form freezes a **path**
  per field or notice (`explainer`, e.g. `sofortmeldung/versicherungsnummer`); the host comes
  from the Kanzlei configuration, so the public repo stays neutral. Links open outside the app
  (never embedded: offline, CSP, no tracking inside the app). The frozen link does not freeze the
  video itself.
- **Preselection** (`initial`): yes/no or choice answers set when the role's first version opens;
  only on always available fields.
- **Answers another role decides** (`fromRole`, Tobias 2026-10-30: in a Minijob the employer
  decides first whether the wage tax is flat-rate, the person's questions depend on it): the value
  of the other role's latest sealed part is **copied into the role's own data** (`adoptFromOtherRoles`
  on entering the role, new version, reopen), the field is locked (`fixedByOtherRole`) and not asked;
  without that part it is asked normally (own extra option "Weiß ich nicht."). Conditions stay
  single-role and a seal still covers only its own data; a later contradiction becomes an automatic
  check hint (`fromRole:<field>`). The flow plan recommends that station first.
- **Personengruppe as a proposal** (Tobias 2026-10-30): `derivations` are rule tables in the form
  (first match wins, order after DEÜV Anlage 2; `derive` in `derivations.ts`); shown in the Kanzlei
  station and on the PDF Prüfblatt, never sealed, "check" where a rule or an uncertain test asks
  for it; none for a special case, "incomplete" while a needed part is missing. Covered: 101, 102,
  103, 105, 106, 108, 109, 110, 119, 120, 121, 122, 123, 190. Beitragsgruppen follow the same way.
- **Special cases are excluded, not guessed** (Tobias 2026-10-30): `exclusions` (shape of check
  hints, evaluated over all roles as soon as answered) block signing and passing on
  (`outOfScope`) and show a banner on every interview step. Pre-questions lead there: firm
  attributes in the bookmark link (yes/no and choices allowed since then, preselection counts as
  empty), per-person employer questions (home work, workshop participant, farm family, on board)
  and person questions (Nebenerwerbslandwirt, FELEG); a fixed term under one week is computed
  (`kuerzerAlsEineWoche`). Covered as kinds of employment: Vorruhestandsgeld (108, no work
  questions) and Freiwilligendienst (123).
- **Validity and limits of every form version** (Tobias 2026-10-30): `validity` names a required,
  always available date or month field (reference date, e.g. the first working day) and the period
  it must lie in; outside → warning at input (`validity.outside`), seal refused (`outsideValidity`),
  summary not ready, transmission blocked. `limits` says what the questionnaire does not cover. Both
  mandatory in drafts (test), shown on the start screen (validity), role choice, Kanzlei form view,
  PDF, catalogue and flow plan. The flow plan shows only the newest version of each form.
- **Preliminary tax data** (Tobias 2026-10-30, replaces "no Konfession"): tax class, factor, child
  allowances and church tax for the first payroll while the ELStAM cannot be retrieved
  (§ 39c Abs. 1 S. 2 EStG); only without a flat-rate tax and, for class/allowances, only for the first
  employment.
- **Multiple jobs above the BBG** (Tobias 2026-10-30): the person states every other job with its
  monthly pay; named hint tests sum a table column with the employer's pay against the BBG KV/PV and
  the JAEG of the start year (`RECHENGROESSEN`); a missing year is reported, never guessed. The
  apportionment (§ 22 Abs. 2 SGB IV) stays with the payroll and is listed as a limit.
- **Every condition is explained** (Tobias 2026-10-30: "klarer Ablaufplan, weshalb welches Feld
  Bedingung für welches andere ist"): `because` on fields with `showIf`/`requiredIf`/`fromRole`
  and on conditional roles; mandatory in drafts (test), shown in the catalogue and in
  `docs/ablaufplan.html` (generated by `npm run catalogue`). The frozen Sofortmeldung 0.1.0 has none.
- **Changing answers afterwards** (check 2026-10-30): before signing via "Zur Zusammenfassung" and
  "ändern" — "Weiter" then returns to the summary after the follow-ups the change opened
  (`editFromSummary`, `stepAfterEdit`), instead of walking through every later question; a
  voluntary yes/no or choice can be taken back ("Auswahl aufheben"). While revising (the next step
  is an answered question) "Weiter" is joined by "Zur nächsten fehlenden Angabe" (next question
  without an answer — voluntary and deferred ones included, Tobias 2026-10-30; else "Zur
  Zusammenfassung"); after a summary edit the button says "Zurück zur Zusammenfassung"
  (`nextChoice`; wording agreed with Tobias 2026-10-30). After signing: "Unterschrift
  zurücknehmen" (not yet passed on) or a new version. Other stations and the Kanzlei can never change
  another role's answers.

---

## Key decisions & deviations from workspace conventions

| Decision                                                           | Why                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runs from `file://` (workspace rule says avoid)                    | Core requirement: send/open one file offline. Mitigated: `modulePreload.polyfill = false`; E2E runs against `file://` in three engines (step 10).                                                                                            |
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

- **E2E covers the release build only** (`npm run test:e2e`, Chromium, Firefox and WebKit under
  `file://`): Sofortmeldung employer → person signs with the mouse → PDF → reopened → Kanzlei →
  PDF for the personnel file, with the no-network / CSP / console / storage guards. The drafts
  (preview build), conflicts, QR scans and the interview helpers are checked by unit tests and
  throw-away headless smoke runs only. WebKit on Windows is not Safari on an iPhone; touch/pen on
  real devices: manual tests MT-21.
- **Kanzlei conflicts, QR scans and link proposals** are not in the E2E yet (unit tests + smoke
  runs 2026-10-30). Manual tests: `manual_tests/05_kanzlei.md`.
- **The Kanzlei cannot correct values** — it sees, decides between versions and files; a correction
  note with reason ("Korrekturvermerk") is planned later. A wrong value goes back to the station.
- **No DATEV filing date as receipt yet** (`source: 'datev'`, plan step 13): receipts record when a
  file was read into the app.
- **Joining questionnaires by decision does not link the parts** — `partsNotLinked` stays until one
  side re-seals its part on the basis of the other (deliberate: a decision is not a confirmation).
- **Decisions and the inbox live only in the open tab** — like everything else; the JSON output keeps
  the decisions in the merge record.
- **Interview progress counts preselected answers** as answered ("2 von etwa 14" at the start).
- **Changing an answer from the summary** asks only the follow-ups it opened that are still empty;
  an answer that only becomes required elsewhere (`requiredIf`) shows up in the summary's list of
  missing answers instead.
- **Church tax with flat-rate 20 %, 25 % or 5 %**: the declaration of non-membership (official
  form) is not part of the questionnaire; it stays on paper.
- **Beitragsgruppen are not derived yet** (next step); the Personengruppe proposal does not compute
  the weekly hours of a Werkstudent (asks for a check) and treats the employer's kind of employment
  as decisive (a mismatch with the person's answer is a check hint).
- **Rechengrößen only for 2026** (`RECHENGROESSEN`); later years must be added each year — until
  then the hints say the values are missing.
- **One version per form at a time:** the start screen offers the newest version; picking the
  version by reference date (several valid versions side by side) is not built yet.
- **Notice confirmations are not saved in the interim file** — they must be given again in the
  session that signs (deliberate: they belong to the signing).
- **CSP only as a meta tag** (step 10): `frame-ancestors` and other header-only directives need
  the hosting headers (step 12). The policy allows exactly the hashes of the inlined script and
  style; any change to the build that adds another inline script or style needs no manual hash
  but a rebuild.
- **Simple electronic signature only** (eIDAS Art. 3 Nr. 10) — not qualified; device time is not
  verifiable; hashes detect accidental/naive changes, not full regeneration. Never promised as
  "rechtsgültig".
- **RV exemption, its cancellation and the waiver** (§ 6 Abs. 1b/6, § 5 Abs. 4 SGB VI) stay on
  paper (Tobias 2026-10-30), although the law says "schriftlich oder elektronisch" (research
  2026-10-30) — the Gemeinsame Grundsätze of 2022 still assume written form. The Personalfragebogen
  only records the wish and the employer's day of receipt of the paper original. Other forms that
  need written form still need paper
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
- **Bundle ≈ 3.2 MB** as one file (pdf.js ≈ 1.7 MB, pdf-lib ≈ 0.6 MB, fonts, QR libraries).
- **PDF/A-2u not yet externally validated** — the PDF carries the PDF/A markers (tested) but no
  veraPDF run yet: no Java locally, veraPDF + qpdf move to the CI (step 12). Acrobat Preflight is
  optional (MT-90). Never advertise "PDF/A" before that.
- **QR paper path tested with synthetic images only** (rendered codes, image-only PDF, two
  "photos" — headless Edge 2026-10-30). Real prints, scanners and phone cameras: MT-34/MT-35.
  **Skewed scans/photos with several codes are probably not read** (the image is cut along white
  rows/columns; jsQR reads one code per cell) — photograph codes singly then.
- **Print-to-PDF is not a supported path** — the original file must be forwarded. A PDF without
  readable data pages is searched for QR codes and otherwise refused with a clear message (tested);
  real print output: MT-93.
- **Signature lines are numbered by role order**, not by time.
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
- **Field type `file`** is not normalised yet (`type.unsupported`). No compute functions exist yet,
  so `computed` fields are rejected.
- **Tables (`repeatGroup`) belong to one role** — columns of another role (e.g. employer days next
  to the person's previous jobs) are not supported; such data is a separate table of that role.
  At most 30 rows; conditions cannot look into table cells.
- **Taking answers over from another file** (`prefillFrom`) matches by field id, role and type
  only; a renamed field in another form is not recognised. A preselected answer (`initial`) counts as empty there,
  so the other file's answer replaces it; a chosen answer equal to the preselection is replaced too.
- **No bundled form has a table yet** — the table step is covered by unit tests only; its manual test
  follows with the Personalfragebogen test version.
- **`forms/published.json` immutability** is only checked against the current files; removing or
  editing an entry _together with_ its file is caught once CI compares with the last release (step
  12). Golden files guard only the fixture form so far.
- **Age check relies on self-reported data:** the birth date is the person's own answer and the
  signing day comes from the device clock; a wrong birth date or a manipulated clock is not
  detectable (a signature dated after a receipt is flagged as implausible).
- **Fields of type `file` cannot be sealed yet** (their values are not normalised).
- **Merge needs the form in the registry** for labels, contradictions and gaps; unknown forms are
  merged without them. A receipt is added by the Kanzlei station (step 9), not by the merge.
- **Field conditions cover one role only** — a field cannot depend on another role's answer (e.g. an
  employer field required because of the person's answer): verification recomputes a sealed
  part's visible fields from its own data. The way around is `fromRole`: the other role's answer is
  copied into the own part (only from a **sealed** part; an employer draft on the same device does not
  count), so it depends on the station order whether the person is asked. Whole **roles** can depend on another role's sealed
  answers (`requiredIf: { kind: 'answer' }`, e.g. the spouse at a joint assessment). No date/age
  comparisons in conditions.
- **Verification proves consistency, not authorship:** anyone can produce a fresh, self-consistent
  seal; only confirmations (other roles' seals, receipts, later the DATEV filing) raise the level,
  and receipts are as trustworthy as the station that wrote them.
- **Device clocks are trusted only within limits:** plausibility uses a 15-minute tolerance; a
  wrong but consistent device clock is not detectable.

---

## Testing

```bash
npm test            # Vitest; pool forks (works again since 4.1.12; pdf.js fails under vmThreads)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run format:check
npm run build       # dist/index.html (single file)
npm run build:preview  # dist-preview/index.html with the form drafts, for review only
npm run test:e2e    # build + Playwright 1.61.0 in Chromium, Firefox, WebKit under file://
```

Report only results observed in the same session (workspace test-integrity rule). Manual tests:
[`manual_tests/`](manual_tests/). E2E browsers: `npx playwright install chromium firefox webkit`
(shared cache in `%LOCALAPPDATA%\ms-playwright`).

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
**Step 8 (PDF) done:** one PDF with readable part, signature lines, Prüfblatt, data pages and QR
codes; reading back from the original, from a scan (QR) and from photos (collected); headless smoke
run through the whole cycle under file://. **Step 9 (Kanzlei station) done** 2026-10-30: batch import, merge UI with decisions, form view,
receipts per file, PDF/JSON output. **Step 10 done** (2026-10-30): CSP meta with the hashes of
the inlined script and style (`src/build/csp.ts`, applied to the written file), Playwright E2E in
three engines with no-network / CSP / console / storage guards. **Next:** Personengruppe and
Beitragsgruppen as a proposal with pre-questions that exclude uncovered special cases.
**Step 5 in progress — forms:** 5a (draft, catalogue generator, `betriebsnummer`, German condition
word order) and 5b (review applied: all birth/address data, preselected yes/no questions, `initial`,
`masterData`, `partLinks` + `partsNotLinked`), master data as bookmark link (decision C) and 5c
(interview logic: `interview.ts`, `dependencies.ts`, `deferQuestion`, `question`/`help` texts,
interview-order rule; Sofortmeldung question and help texts drafted) done. The Sofortmeldung is frozen as
test version **0.1.0** (`forms/sofortmeldung/0.1.0.json`, catalogue
`docs/formulare/sofortmeldung-0.1.0.md`).

**Drafts awaiting Tobias's review (2026-10-30):** Personalfragebogen (reworked for all employment
variants), Steuerfreigabe (§ 87d AO), Dienstwagen (Überlassung), Lohnmeldung (monthly); catalogues
in `docs/formulare/`. After approval: freeze as 0.x test versions (move to `forms/` + hash in
`published.json`). Open engine ideas from the research: references between tables, age conditions.
**2026-10-30 (later):** check "Angaben nachträglich ändern" (two weaknesses fixed: summary edit
returns to the summary, voluntary answers can be taken back; "Zur Zusammenfassung" link),
`fromRole` + Minijob kind of wage tax decided by the employer, `because` for every condition of
every draft and the generated flow plans `docs/ablaufplan.html`. **Form editor decided**
(Tobias 2026-10-30, after step 10; plan in `docs/plan.md`): long term for everyone, for now local
and offline for the Kanzlei as a separate HTML tool; forms reach the app via the repo and a build
for now, long term as Kanzlei-signed forms loaded at runtime (signature in the editor). The existing
forms are finished together first (good patterns); `docs/ki-anleitung-formulare.md` lets any AI
draft or adapt forms.

_Last updated: 2026-10-30_
