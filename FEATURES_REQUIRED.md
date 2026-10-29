# Critical User Paths — Fragebogen

**Purpose:** Core workflows that must not break. Audit validates these end-to-end.
Status 2026-10-29: project foundation only — every path below is still **open**.

## Offline & privacy (applies to every path)

- [ ] **Open the single HTML file by double-click (file://)** — app renders, no console errors
- [ ] **No network traffic** — no request other than file:/data:/blob: during any flow; CSP blocks the rest
- [ ] **Nothing persisted in the browser** — localStorage/IndexedDB empty after every flow
- [ ] **"Alle Daten auf diesem Gerät löschen"** — clears state, revokes blob URLs, reloads clean

## Station 1 — fill in & sign (e.g. Arbeitnehmer/in)

- [ ] **Choose a form and fill in own fields** — only own role's fields editable; validation messages in German
- [ ] **Acknowledge notices** — `read` notices confirmed in-app; `paperHandout` notices confirmed as handed out on paper
- [ ] **Sign (draw or typed name) after explicit confirmation** — part locks; system note shown under the signature
- [ ] **Download the PDF** — readable sections, signature with system note, Prüfblatt, data pages, footer "Seite x von y"
- [ ] **Save/load interim state as a file** — round-trips without loss

## Station 2 — import & complete (e.g. Arbeitgeber)

- [ ] **Import the PDF** — data recovered from the data pages; verdict "unverändert seit Unterschrift"
- [ ] **Tampered PDF** — verdict names the changed fields (or "Datensatz verändert, Feldvergleich nicht möglich")
- [ ] **Scanned PDF / PDF without data pages** — rejected with a clear German message
- [ ] **Complete own part, seal or sign** — receipt with the imported part's hash is part of the seal
- [ ] **Same-device flow (Gerätemodus)** — role locked, nothing stored, wiped at the end

## Station 3 — Kanzlei (merge)

- [ ] **Batch import many PDFs** — grouped by questionnaire id; duplicates collapsed
- [ ] **Parts arriving separately** — match proposals via matchKeys, human confirms
- [ ] **Contradictions and gaps shown** — consistency rules, missing required fields/signatures/parts
- [ ] **Merged output** — one PDF per form (no attachment, PDF/A-2u target) plus JSON; originals stay verifiable

| Path              | Impact                                  | Audit Check                                                                       |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| file:// start     | Users cannot open the app at all        | E2E loads `file://…/dist/index.html` in Chromium, Firefox, WebKit                 |
| No network        | Personal data could leak                | Playwright request guard + CSP violation listener over the full flow              |
| PDF round-trip    | Data cannot travel between stations     | Write PDF → extract data pages with pdf.js → JSON bit-identical                   |
| Seal verification | Tampering goes unnoticed                | Tamper matrix (field, payload, signature, swapped parts) yields expected verdicts |
| Merge             | Kanzlei retypes data / misses conflicts | Merge property tests + E2E with separately arriving parts                         |
