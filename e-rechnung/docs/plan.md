# Plan: E-Rechnungs-Prüfer (`e-rechnung`)

Freigegeben von Tobias am 13.11.2026 (E1 und E2 „ok“, Plan „soweit freigegeben“). Die Übergabe
(Ziel, Rahmen, Nicht-Ziele, fachliche Grundlagen) ist die Grundlage; hier steht, wie gebaut wird.

## Ziel

Eine Datei (PDF oder XML) wird in den Browser gezogen. Das Tool zeigt:

1. **Erkennen:** E-Rechnung ja/nein, Syntax (UBL/CII), Profil/Spezifikation.
2. **Schema:** Prüfung der XML mit den offiziellen XSD.
3. **Pflichtangaben** nach § 14 Abs. 4 UStG (und §§ 14 Abs. 5, 14a, 22c UStG, §§ 33, 34a UStDV) mit
   den Werten aus der XML; je Angabe vorhanden / fehlt / nur im Einzelfall nötig.
4. **Plausibilität:** eine steuerlich relevante Teilmenge rechnerischer Regeln.

Ergebnis sind **Hinweise, keine Freigabe**.

## Entscheidungen

| Nr. | Entscheidung                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Eigener Unterordner `e-rechnung/` im Fragebogen-Repo mit eigener `package.json`, eigenem Build und eigenen Tests. Im Hauptordner nur: `eslint.config.js` (Ordner ausgenommen) und `.prettierignore`. |
| E2  | Server: `NebenprojektERechnung/` auf der Fragebogen-Subdomain, Zugriff IP-Adressen der Kanzlei oder Tester-Anmeldung (`deploy/upload.json`, Ziel `test`), nicht verlinkt.                            |
| E3  | Commits ohne Rückfrage, nur gemeldet. Push (öffentliches GitHub) und Upload (Server) nur nach Tobias' Freigabe.                                                                                      |
| T1  | Ein XML-Werkzeug für alles: libxml2-wasm (Einlesen, XPath, XSD). XML mit DOCTYPE wird abgewiesen.                                                                                                    |
| T2  | Eine HTML-Datei (vite-plugin-singlefile), CSP mit `connect-src 'none'` und `'wasm-unsafe-eval'`.                                                                                                     |
| T3  | Keine Speicherung: ESLint verbietet Speicher- und Netz-APIs; ein E2E-Test zählt Speicherzugriffe und Netzwerkanfragen (beide null).                                                                  |
| T4  | Dezimalrechnung auf BigInt, keine Gleitkommazahlen.                                                                                                                                                  |
| T5  | Zuordnung Pflichtangabe → BT nach der KoSIT/FeRD-Empfehlung, Stand 25.07.2025 (siehe `quellen.md`).                                                                                                  |

## Aufbau

- `src/logic/` – rein, ohne Browser, WASM oder IO testbar: Profiltabelle (BT-24 → Syntax, Profil,
  Einordnung), Zuordnung BT → XPath (UBL, CII) als Daten, Normalisieren zum BT-Modell,
  Pflichtangaben-Tabelle mit Statusregeln, Plausibilitätsregeln als Daten, Dezimalrechnung,
  Ergebnistexte.
- `src/io/` – Datei einlesen, PDF-Anhänge (pdf.js), XML-Adapter (libxml2-wasm: einlesen, Zuordnung per
  XPath auswerten, XSD).
- `src/ui/` – Ablagefläche, Ergebnis, Pflichtangaben-Tabelle mit aufklappbaren Positionen,
  Plausibilität.
- `src/build/` – CSP für die eine Datei.

## Schritte

| Schritt | Inhalt                                                                                             | Stand                                         |
| ------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 0.1     | Offizielle Artefakte laden, Lizenzen prüfen, `quellen.md`                                          | erledigt bis auf das FeRD-Paket (lädt Tobias) |
| 0.2     | Gerüst `e-rechnung/`, dieser Plan, zwei Zeilen im Hauptordner                                      | erledigt                                      |
| 0.3     | `npm install --ignore-scripts`                                                                     | erledigt                                      |
| 0.4     | Spike: libxml2-wasm + pdf.js in der einen Datei unter der CSP; XSD-Imports aus dem Speicher        | bestanden (Chromium, Firefox, WebKit)         |
| 0.5     | Zuordnung gegen die KoSIT/FeRD-Empfehlung abgleichen → `offene-fragen.md` F9                       | erledigt                                      |
| 1a      | Einlesen + Erkennen (PDF/XML, Anhänge am Inhalt, Syntax, Profil, Ergebnisarten, mehrere XML)       | offen                                         |
| 1b      | Normalisieren (Zuordnung als Daten, BT-Modell, Positionen)                                         | offen                                         |
| 1c      | Pflichtangaben-Ansicht (§ 14 Abs. 4 in Reihenfolge, Status, Gesamtsatz, fester Hinweis)            | offen                                         |
| 2a      | XSDs übernehmen (nur weitergebbare), Profil → XSD                                                  | UBL 2.1 + CII D16B übernommen; FeRD offen     |
| 2b      | Schema-Prüfung + Anzeige                                                                           | offen                                         |
| 3a      | Plausibilitätsregeln (BR-CO-10, -13, -14, -15, -16, -17, Aufschlüsselung je Satz, Befreiungsgrund) | offen                                         |

Nach jeder Phase: kurzer Stand mit beobachtetem Testergebnis, Push und Upload nur nach Freigabe.

## Ergebnis des Spikes (13.11.2026)

- libxml2-wasm bringt sein WebAssembly in der JS-Datei mit und lädt es mit `WebAssembly.instantiate`
  aus dem Speicher – kein `fetch`. Unter der CSP genügt `'wasm-unsafe-eval'`.
- Einlesen, XPath und XSD-Prüfung (UBL 2.1 Invoice/CreditNote, CII D16B; Imports aus dem Speicher)
  laufen in Node und in Chromium, Firefox und WebKit; erste Prüfung samt Übersetzen der XSD
  0,1–0,65 s.
- pdf.js 6 liefert die Anhänge als `Map` ohne Inhalt; den Inhalt holt `getAttachmentContent(name)`.
- Eine Datei mit pdf.js, libxml2, XSDs und zwei Beispielrechnungen: 3,6 MB (gzip 1,0 MB). Keine
  Konsolenfehler, keine Netzwerkanfrage.
