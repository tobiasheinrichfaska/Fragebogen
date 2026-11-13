# Critical User Paths — Fragebogen

**Purpose:** Core workflows that must not break. Audit validates these end-to-end.
Status 2026-11-03: all stations exist — filling in, interview, signing, PDF and import (steps 6–8),
the Kanzlei station with merge, receipts and LuG hand-over (step 9) and the hardened build with E2E
in three engines (step 10). Sofortmeldung 1.0.0 is in production. A checked box means: covered by
the named automated test (the audit re-runs them); unchecked paths are guarded by unit tests and
`manual_tests/` but not yet pinned to one named check here.

## Offline & privacy (applies to every path)

- [x] **Open the single HTML file by double-click (file://)** — app renders, no console errors (`tests/e2e/flow.spec.ts`, console guard in three engines)
- [x] **No network traffic** — no request other than file:/data:/blob: during any flow; CSP blocks the rest (`tests/e2e/guards.ts` via `npm run test:e2e`, three engines)
- [x] **Nothing persisted in the browser** — localStorage/IndexedDB empty after every flow (`tests/e2e/guards.ts`, `expectClean`)
- [ ] **"Alle Daten auf diesem Gerät löschen"** — clears state, revokes blob URLs, reloads clean (e2e: `tests/e2e/handtests/02_ausfuellen.spec.ts`, former MT-17)

## Station 1 — fill in & sign (e.g. Arbeitnehmer/in)

- [ ] **Choose a form and fill in own fields** — only own role's fields editable; validation messages in German
- [ ] **Interview** (default for person and employer) — one question per screen in form order; a follow-up appears right after the answer that opens it; back and forward; progress; the summary lists missing, deferred and no longer applicable answers before signing
- [ ] **"Vorerst überspringen"** — a button next to "Weiter" puts a question back; it is asked again at the end and survives saving the interim state; in the summary each skipped question offers "beantworten" and, if voluntary, "leer lassen"; a required one must be answered before signing
- [ ] **"Fragebogen verwerfen"** — in the interview and on the overview; always asks first, then the questionnaire is gone from the app (downloaded files stay)
- [ ] **Change answers afterwards** — "Zur Zusammenfassung" from any question; "ändern" in the summary returns to the summary after the follow-ups the change opened (not through every later question); a voluntary yes/no or single choice can be taken back ("Auswahl aufheben"); while revising, "Weiter" or "Zur nächsten fehlenden Angabe"; after signing via "Unterschrift zurücknehmen" or "Neue Fassung beginnen"
- [ ] **Answers another station decides** (`fromRole`, e.g. the employer's kind of wage tax in a Minijob) — taken over from that station's sealed part, not asked and shown as "festgelegt von: …"; asked when that part is missing; a later contradiction becomes a check hint
- [ ] **Answers kept while their condition is off** — switching a precondition off and on again brings the answer back; only signing drops it (shown in the summary)
- [ ] **Field logic** — a field accepts input only once its precondition holds (`showIf`); required always or by condition (`requiredIf`, e.g. phone or e-mail); the reason is shown in German
- [ ] **Acknowledge notices** — `read` notices confirmed in-app; `paperHandout` notices confirmed as handed out on paper
- [ ] **Sign (draw or typed name) after explicit confirmation** — part locks; system note shown under the signature; an accidental tap or a single letter is refused
- [ ] **No transmission without the person's signature** — the PDF for passing on is refused while a draft is open, a required signature is missing or a part is altered (`transmissionBlockers`); the reason is shown in German. Saving the interim state stays possible.
- [ ] **Minor on the signing day (device date)** — the legal guardian must sign with name (name field or typed name) and confirm exactly the current version of the person's part; re-signing by the person requires the guardian again; otherwise no transmission
- [ ] **Re-sign before sending** — "Unterschrift zurücknehmen" turns the not-yet-sent version back into a draft; the old signature disappears (no version chain); refused once the version was received or confirmed
- [ ] **Download the PDF** — readable sections, signature with system note, Prüfblatt, data pages, footer "Seite x von y", visible and clickable address of the app
- [ ] **Save/load interim state as a file** — round-trips without loss
- [ ] **Tables** (e.g. children, further employments) — one card per row, add/remove rows; a row with an empty required cell must be completed or removed, the error points at the cell
- [ ] **Take answers over from another file** (Sofortmeldung → Personalfragebogen, last month → new month) — only into empty fields of open roles, a preselection is replaced, `carryOver: false` values stay empty, nothing is signed; every value not taken over is shown with its reason; the same questionnaire and altered files are refused

## Station 2 — import & complete (e.g. Arbeitgeber)

- [ ] **Import the PDF** — data recovered from the data pages; verdict "unverändert seit Unterschrift"
- [ ] **Tampered PDF** — verdict names the changed fields (or "Datensatz verändert, Feldvergleich nicht möglich")
- [ ] **Scanned PDF / PDF without data pages** — rejected with a clear German message, unless its QR codes can be read
- [ ] **Personalfragebogen 1.0.0** (production 2026-11-12) — the public app offers „Personalfragebogen: Angaben für die Lohnabrechnung“ without „Testfassung“/„Entwurf“; person, (Vertretung) and employer fill and sign, the Kanzlei gets the SV proposals and the payroll hand-over; the employer's part is refused for a Beschäftigungsbeginn outside 2026
- [ ] **SEPA-Mandat 1.0.0** (production 2026-11-05, registered for mandates under way) — the Kanzlei fills first (creditor data from its Stammdaten-Link, who pays, holder identical or deviating, payment type, Mandatsreferenz or later), closes without a signature and passes it on (PDF or link); the account holder sees creditor, Gläubiger-ID, payer and payment type fixed, gives the address (abroad switch) and bank details unless the Kanzlei entered them, and signs; a deviating holder also gives the name and a notice address; a joint account needs the second signature
- [ ] **SEPA-Mandat 1.1.0** (production 2026-11-06, new mandates) — the Kanzlei only prefills: it is never shown as „offen“, a link with its part opens straight in the account holder's part; the holder sees the Kanzlei's account data prefilled („Vorbelegt von …“) and may change them (the Kanzlei then sees „… geändert“), creditor, payer, payment type and Mandatsreferenz stay fixed; the Mandatsreferenz is proposed from the Mandantennummer, „Wer unterschreibt das Mandat?“, place and date are proposed; a second account holder is named, and only „nur beide gemeinsam“ needs the second signature
- [ ] **PDF first once all parts are done** (2026-11-12) — after closing the last needed part the done screen says „Alle nötigen Teile sind abgeschlossen. Erstellen Sie jetzt die PDF.“, „PDF erstellen“ is the highlighted button and „Zur Übersicht“ replaces „Gerät weitergeben – zur Übersicht“; while a part is still missing, handing the device on stays first (MT-20/MT-21)
- [ ] **Pass on as a link** (2026-11-05) — after closing a part with few values (e.g. the Kanzlei part of the SEPA-Mandat, the employer part of the Sofortmeldung) the done screen and the overview („Stand“, right under the roles, with „PDF erstellen“ — test report 2026-11-06) offer a link of at most 2,000 characters instead of the PDF; opening it on another device verifies the parts like a PDF, opens „Wer füllt jetzt aus?“ and clears the answers from the address bar; a cut-off link or an unknown form version is refused with a German message; a complete questionnaire with a drawn signature stays PDF only; „Mit Kennwort schützen“ (2026-11-06) gives a link (`#weitergabe=2`) and a proposed password that opens it on the page „Geschützter Link“ — a wrong password is refused, case, spaces and hyphens do not matter
- [ ] **PDF with a password** (2026-11-06) — the same „Mit Kennwort schützen (PDF und Link)“ makes „PDF erstellen“ write an AES-256 PDF (no PDF/A) that Chrome's and Edge's viewer open too (streams and strings encrypted alike, 2026-11-07); reading it in (start page, takeover, Kanzlei inbox) asks in „Geschützte PDF“, refuses a wrong password, opens with the right one in any case and without hyphens, and „Abbrechen“ names why the file stays unopened; the Kanzlei's Personalakte PDF is always PDF/A without a password
- [ ] **Paper path via QR codes** — a scan or a phone photo of the printed PDF is read back from the QR codes on the data pages and verified like the PDF; missing or unreadable codes are named
- [ ] **Explainer videos** — a field or notice with a configured video shows a link that opens outside the app (https only, never embedded)
- [ ] **Complete own part, seal or sign** — receipt with the imported part's hash is part of the seal
- [ ] **Same-device flow (Gerätemodus)** — "Wer füllt jetzt aus?" picks the role; role locked, nothing stored, wiped at the end
- [ ] **Either station first** — employer first (person sees the employer data read-only and signs over it) or person first (employer confirms the person part); the questionnaire is complete only when the parts are linked (`partsNotLinked` otherwise), and passing on to the next station is never blocked by a missing part
- [ ] **Employer master data via bookmark link** — "Link mit meinen Stammdaten" puts company name and Betriebsnummer into the link; opening the bookmark fills them in; a broken link or a value in the wrong format is shown with its reason
- [ ] **Create or change the master-data link** — "Stammdaten-Link erstellen oder ändern" (start page, Kanzlei station) asks first what the link opens and then shows only that form's keys (the start page: every key once; values of other forms are named and stay out of the link), reads a pasted link, rejects a wrong value at its entry, names what the firm data exclude, and gives the link; a conditional question (Lohnsteuer bei Minijobs) is filled from the link when it appears and follows the kind of employment until someone changes it; the summary's new link keeps the keys of other forms
- [ ] **Preselected answers** — e.g. "Geburtsname gleich Familienname?" starts with Ja and can be changed

- [ ] **Validity of a form version** — every draft states the period of its reference date (e.g. first working day); a date outside warns at input, blocks signing and passing on; start screen, role choice, PDF and docs show it
- [ ] **What a form does not cover** — `limits` shown on the role choice, in the Kanzlei form view, the PDF, the catalogue and the flow plan
- [ ] **Multiple jobs, also above the BBG** — other jobs with monthly pay; check hints sum them against the BBG (KV/PV) and the JAEG of the start year; a missing year is reported, never guessed
- [ ] **Proposals for the Kanzlei** — Personengruppe, Beitragsgruppen (KV RV AV PV), Kennzeichen Übergangsbereich and Tätigkeitsschlüssel shown with reasons per part, "bitte prüfen" where uncertain; never decided by the app, never sealed; a special case excluded by a pre-question gives none
- [ ] **Hand-over to DATEV Lohn und Gehalt** (Kanzlei build with a local mapping) — Erfassungsblatt in the order of the LuG masks; import file (Windows-1252) only with Mandanten- and Mitarbeiternummer and the choice "neu anlegen" / "vorhandenen ergänzen"; wage types and health insurer entered by the Kanzlei per questionnaire; everything not transferable is listed with its reason, values to check are listed as notes
- [ ] **Erfassungsblatt as PDF** — its own PDF/A file for the Personalakte, named by numbers only
- [ ] **Sofortmeldung first, Personalfragebogen later** — the Sofortmeldung 0.2.0 creates the employee in LuG; the Personalfragebogen completes the same employee number without creating a second one
- [ ] **Official lists** — foreign state of the address, name prefix and suffix chosen from the DEÜV tables via a search field; anything not listed is refused with a German message
- [ ] **Country of birth and nationality** — "In Deutschland geboren?" and "deutsche Staatsangehörigkeit?" first, preselected Ja; on Nein a search list where free text is allowed with a visible warning; the hand-over names a free entry instead of exporting a code
- [ ] **Health insurer from the list** — the person picks the statutory insurer from a search list (typing filters, "TK" finds Techniker Krankenkasse); free text is allowed with a visible warning about extra work; the Kanzlei gets the insurer's Betriebsnummer prefilled, a free entry leaves it to the Kanzlei
- [ ] **Employee number checked before the import file** — asked when the questionnaire has none, named when it does not fit, a safety question before every download

- [ ] **Help pages "Wo finde ich …?"** — per data item the documents to pick, a watermarked sample zooming to the spot with source, "Nichts davon" with how to get it; no script, nothing external; every `explainer` path leads to a page

- [ ] **Test page in the test folder** — the manual tests (and local `L-` tests) next to the app; an overview with one box per test by area (done ones coloured, "Erledigte ausblenden"), one test at a time with "Zurück zur Testübersicht"; opening a test asks whether to restart the app with its entry and shows the test from its heading; per test start, result ("Wie erwartet" / "Klappt nicht"), comment and correctable time; the run survives a reload; the header restarts the app, resets it fully (the results stay) and downloads the report; the report PDF lists results, times (with the date on another day) and comments, and a report leaves its tests out of the next one unless the tester takes them in again; tests that cannot run there are marked with the reason; references to other tests open them; a test rewritten after the tester's result says "geändert seit Ihrem Test" (overview, test, report); never in the public build; its browser memory is its own — it neither offers nor deletes the public app's interrupted questionnaire at the same address (`tests/e2e/resume.spec.ts`, 2026-11-13)

## Documentation

- [ ] **Flow plan of every form** (`docs/ablaufplan.html`, `npm run catalogue`) — stations and their order, questions in interview order, decision points, and why each condition applies; every condition in a draft is explained

## Station 3 — Kanzlei (merge)

- [ ] **Batch import many PDFs** — grouped by questionnaire id; identical parts (same hash) collapsed with a note
- [ ] **Different versions of a role** — accepted only as a chain (person re-signed at the employer): the newer wins with a note listing the changed fields; anything else is a conflict the Kanzlei resolves, the app never picks
- [ ] **Different signing dates visible** — fields covered by a later signature carry a footnote; one signature line per version that covers values
- [ ] **Parts arriving separately** — match proposals via matchKeys, human confirms
- [ ] **Contradictions and gaps shown** — consistency rules, missing required fields/signatures/parts
- [ ] **Form view** — the Kanzlei reads every answer by section with its owner, the signature lines and the receipts, read only
- [ ] **Receipt per file** — the merged output records for every file when it was read and which parts it brought; reading the merged file again adds none; every part is then confirmed (level 2)
- [ ] **Decisions can be withdrawn** — a version choice or a link is listed and can be taken back; the conflict returns
- [ ] **Merged output** — one PDF per form (no attachment, PDF/A-2u target) plus JSON; originals stay verifiable

| Path              | Impact                                                                    | Audit Check                                                                                            |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| file:// start     | Users cannot open the app at all                                          | E2E loads `file://…/dist/index.html` in Chromium, Firefox, WebKit                                      |
| No network        | Personal data could leak                                                  | Playwright request guard + CSP violation listener over the full flow                                   |
| PDF round-trip    | Data cannot travel between stations                                       | Write PDF → extract data pages with pdf.js → JSON bit-identical                                        |
| Seal verification | Tampering goes unnoticed                                                  | Tamper matrix (field, payload, signature, swapped parts) yields expected verdicts                      |
| Transmission gate | Unsigned data or a minor's data without guardian reaches employer/Kanzlei | Unit tests on `transmissionBlockers`; E2E: download refused with reason until signed / guardian signed |
| Merge             | Kanzlei retypes data / misses conflicts                                   | Merge property tests + E2E with separately arriving parts                                              |
