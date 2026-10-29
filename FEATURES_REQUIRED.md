# Critical User Paths — Fragebogen

**Purpose:** Core workflows that must not break. Audit validates these end-to-end.
Status 2026-10-29: logic layer up to the merge exists, no UI yet — every path below is still **open** (end-to-end).

## Offline & privacy (applies to every path)

- [ ] **Open the single HTML file by double-click (file://)** — app renders, no console errors
- [ ] **No network traffic** — no request other than file:/data:/blob: during any flow; CSP blocks the rest
- [ ] **Nothing persisted in the browser** — localStorage/IndexedDB empty after every flow
- [ ] **"Alle Daten auf diesem Gerät löschen"** — clears state, revokes blob URLs, reloads clean

## Station 1 — fill in & sign (e.g. Arbeitnehmer/in)

- [ ] **Choose a form and fill in own fields** — only own role's fields editable; validation messages in German
- [ ] **Interview** (default for person and employer) — one question per screen in form order; a follow-up appears right after the answer that opens it; back and forward; progress; the summary lists missing, deferred and no longer applicable answers before signing
- [ ] **"Weiß ich gerade nicht"** — a question can be put back; it is asked again at the end and survives saving the interim state; a required one must be answered before signing
- [ ] **Answers kept while their condition is off** — switching a precondition off and on again brings the answer back; only signing drops it (shown in the summary)
- [ ] **Field logic** — a field accepts input only once its precondition holds (`showIf`); required always or by condition (`requiredIf`, e.g. phone or e-mail); the reason is shown in German
- [ ] **Acknowledge notices** — `read` notices confirmed in-app; `paperHandout` notices confirmed as handed out on paper
- [ ] **Sign (draw or typed name) after explicit confirmation** — part locks; system note shown under the signature; an accidental tap or a single letter is refused
- [ ] **No transmission without the person's signature** — the PDF for passing on is refused while a draft is open, a required signature is missing or a part is altered (`transmissionBlockers`); the reason is shown in German. Saving the interim state stays possible.
- [ ] **Minor on the signing day (device date)** — the legal guardian must sign with name (name field or typed name) and confirm exactly the current version of the person's part; re-signing by the person requires the guardian again; otherwise no transmission
- [ ] **Re-sign before sending** — "Unterschrift zurücknehmen" turns the not-yet-sent version back into a draft; the old signature disappears (no version chain); refused once the version was received or confirmed
- [ ] **Download the PDF** — readable sections, signature with system note, Prüfblatt, data pages, footer "Seite x von y", visible and clickable address of the app
- [ ] **Save/load interim state as a file** — round-trips without loss

## Station 2 — import & complete (e.g. Arbeitgeber)

- [ ] **Import the PDF** — data recovered from the data pages; verdict "unverändert seit Unterschrift"
- [ ] **Tampered PDF** — verdict names the changed fields (or "Datensatz verändert, Feldvergleich nicht möglich")
- [ ] **Scanned PDF / PDF without data pages** — rejected with a clear German message, unless its QR codes can be read
- [ ] **Paper path via QR codes** — a scan or a phone photo of the printed PDF is read back from the QR codes on the data pages and verified like the PDF; missing or unreadable codes are named
- [ ] **Explainer videos** — a field or notice with a configured video shows a link that opens outside the app (https only, never embedded)
- [ ] **Complete own part, seal or sign** — receipt with the imported part's hash is part of the seal
- [ ] **Same-device flow (Gerätemodus)** — "Wer füllt jetzt aus?" picks the role; role locked, nothing stored, wiped at the end
- [ ] **Either station first** — employer first (person sees the employer data read-only and signs over it) or person first (employer confirms the person part); the questionnaire is complete only when the parts are linked (`partsNotLinked` otherwise), and passing on to the next station is never blocked by a missing part
- [ ] **Employer master data via bookmark link** — "Link mit meinen Stammdaten" puts company name and Betriebsnummer into the link; opening the bookmark fills them in; a broken link or a value in the wrong format is shown with its reason
- [ ] **Preselected answers** — e.g. "Geburtsname gleich Familienname?" starts with Ja and can be changed

## Station 3 — Kanzlei (merge)

- [ ] **Batch import many PDFs** — grouped by questionnaire id; identical parts (same hash) collapsed with a note
- [ ] **Different versions of a role** — accepted only as a chain (person re-signed at the employer): the newer wins with a note listing the changed fields; anything else is a conflict the Kanzlei resolves, the app never picks
- [ ] **Different signing dates visible** — fields covered by a later signature carry a footnote; one signature line per version that covers values
- [ ] **Parts arriving separately** — match proposals via matchKeys, human confirms
- [ ] **Contradictions and gaps shown** — consistency rules, missing required fields/signatures/parts
- [ ] **Merged output** — one PDF per form (no attachment, PDF/A-2u target) plus JSON; originals stay verifiable

| Path              | Impact                                                                    | Audit Check                                                                                            |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| file:// start     | Users cannot open the app at all                                          | E2E loads `file://…/dist/index.html` in Chromium, Firefox, WebKit                                      |
| No network        | Personal data could leak                                                  | Playwright request guard + CSP violation listener over the full flow                                   |
| PDF round-trip    | Data cannot travel between stations                                       | Write PDF → extract data pages with pdf.js → JSON bit-identical                                        |
| Seal verification | Tampering goes unnoticed                                                  | Tamper matrix (field, payload, signature, swapped parts) yields expected verdicts                      |
| Transmission gate | Unsigned data or a minor's data without guardian reaches employer/Kanzlei | Unit tests on `transmissionBlockers`; E2E: download refused with reason until signed / guardian signed |
| Merge             | Kanzlei retypes data / misses conflicts                                   | Merge property tests + E2E with separately arriving parts                                              |
