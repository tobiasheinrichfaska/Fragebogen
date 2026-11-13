# Critical User Paths — E-Rechnung prüfen

**Purpose:** Core workflows that must not break. Audit validates these end-to-end.

## Einlesen und Erkennen (Phase 1)

- [x] **Hybrid-PDF (ZUGFeRD/Factur-X) hineinziehen** — „E-Rechnung erkannt (Profil …)“, Syntax CII
- [x] **XRechnung als XML (UBL oder CII) hineinziehen** — „E-Rechnung erkannt“ mit Spezifikation
- [x] **Einfaches PDF ohne Rechnungsdaten** — „Keine E-Rechnung: einfaches PDF“
- [x] **Profil MINIMUM oder BASIC WL** — „keine E-Rechnung im Sinne des UStG“
- [x] **Mehrere Rechnungs-XML im PDF** — alle gezeigt, Vergleich, nie eine Fassung selbst gewählt
- [x] **Kaputte, verschlüsselte oder zu große Datei** — klare Meldung mit Grund, kein Absturz

## Pflichtangaben (Phase 1)

- [ ] **Pflichtangaben in der Reihenfolge des § 14 Abs. 4** — je Zeile Werte und Status
- [ ] **Positionen aufklappbar** — Menge, Art, Betrag je Position
- [ ] **Gesamtsatz nie „ordnungsgemäß“** — „Alle Pflichtfelder belegt. Bitte prüfen Sie die Werte.“ bzw. „Es fehlt: …“

## Schema und Plausibilität (Phasen 2, 3)

- [ ] **Schemafehler** — „Formatfehler, gem. Rn. 6a ggf. keine E-Rechnung“ mit Fundstelle
- [ ] **Rechenfehler** — „mögliche Auffälligkeit: …“ mit Regel-ID und belegenden Werten

## Rahmen

- [ ] **Keine Netzwerkanfrage, kein Speicherzugriff** — E2E zählt beides: null
- [ ] **Keine Konsolenfehler beim Laden**

| Path                               | Impact                                   | Audit Check                   |
| ---------------------------------- | ---------------------------------------- | ----------------------------- |
| Hybrid-PDF wird erkannt            | Kernfrage der Mandanten                  | E2E mit offiziellem Beispiel  |
| Nichts verlässt den Rechner        | Vertraulichkeit der Rechnung             | CSP-Test + E2E-Zähler         |
| Pflichtangaben vollständig gezeigt | Grundlage der Rückfrage beim Lieferanten | Unit- und E2E-Tests je Angabe |
