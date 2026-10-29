# Spike PDF (Schritt 1) – Ergebnisse

Stand: 29.10.2026. Der Spike-Code liegt als Wegwerfcode in `.tmp/spike-pdf/` (nicht im Repo). Die
endgültige Umsetzung mit Tests folgt in Schritt 8. Hier stehen die Entscheidungen und das Format.

## Ergebnis in Kürze

| Frage                                                                                                                         | Ergebnis                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PDF mit eingebetteten Schriften, PDF/A-2u-Bausteinen und Datenseiten schreiben (`@cantoo/pdf-lib` 2.11.1 + `@cantoo/fontkit`) | **Ja.** Alle Schriften sind eingebettet, mit `ToUnicode` und `CIDToGIDMap`. XMP ist ungefiltert und meldet `pdfaid` 2/U. OutputIntent sRGB, Trailer-`/ID`, `/Lang de-DE`, kein `/Encrypt`. |
| Datenseiten mit **pdf.js** 6.4 zurücklesen                                                                                    | **Ja, bitgenau**: 78 Zeilen. Das gilt auch bei umgekehrter Zeilenfolge und zusätzlichen Leerzeichen. Eine gekippte Zeile meldet der Decoder mit Zeilennummer, ebenso eine fehlende.        |
| Übersteht die PDF erneutes Speichern?                                                                                         | **Ja**, simuliert mit pdf-lib: mit Objektströmen, mit klassischer xref und mit allen Seiten in ein neues Dokument kopiert.                                                                 |
| AES-256                                                                                                                       | **Ja**: V5/R6. pdf.js lehnt ein falsches Kennwort ab und liest mit dem richtigen. pdf-lib lädt die Datei mit Kennwort neu.                                                                 |
| Im Browser, **als eine Datei unter `file://`, mit strenger CSP** (Edge)                                                       | **Ja**: `ok: true`, **0 CSP-Verstöße**. Schreiben 0,27 s, Lesen 0,17 s. Die PDF ist byte-gleich groß wie aus Node.                                                                         |
| Bundle-Größe                                                                                                                  | **2,66 MB** als eine Datei. Davon entfallen etwa 1,7 MB auf pdf.js samt Worker-Code und etwa 0,6 MB auf pdf-lib.                                                                           |
| Umfang des Beispielbogens (Arbeitnehmer + Arbeitgeber, 70 Felder, gezeichnete Unterschrift)                                   | JSON 12,2 kB → deflate 5,6 kB → **78 Zeilen = 2 Datenseiten**; PDF gesamt 5 Seiten, 48 kB                                                                                                  |

## Entscheidungen

1. **Schreiben:** `@cantoo/pdf-lib` + `@cantoo/fontkit`. Für PDF/A dient `convertToPDFA({ conformance: '2U' })`
   mit dem mitgelieferten sRGB-Profil. Für den Kennwortschutz dient `encrypt()` (Standard AES-256).
   **pdfkit wird nicht gebraucht.**
2. **Lesen:** `pdfjs-dist` mit `isEvalSupported: false`. **Unter `file://` läuft pdf.js im Hauptthread**
   („Fake Worker“ über `globalThis.pdfjsWorker`). Chromium verweigert dort Worker aus `blob:`-URLs:
   „Refused to cross-origin redirects of the top-level worker script“. pdf.js wartet sonst endlos.
   Derselbe Weg gilt auch für die gehostete Fassung; so gibt es nur einen Codepfad.
3. **Schriften:** **Noto Sans** (Regular, SemiBold) und **Noto Sans Mono**, verkleinert auf etwa 23 kB
   je Datei, siehe [`assets/fonts/README.md`](../assets/fonts/README.md). Source Sans/Code Pro sind
   verworfen, weil sie den Reserved Font Name „Source“ tragen.
4. **Ohne Ligaturen und Kerning** (beim Verkleinern entfernt): Jede Glyphe entspricht genau einem
   Zeichen.

## Format der Datenseiten, Version 1 (umgesetzt in Schritt 8)

Seit Schritt 5f tragen die Datenseiten das **Datenpaket** `{ format: "fragebogen-paket", formatVersion: 1, questionnaire, definition }`
(Fragebogen **und** Formulardefinition, JCS). Zusätzlich steht derselbe komprimierte Block als **QR-Codes** auf eigenen
Seiten: Byte-Modus, Fehlerkorrektur M, je 700 Byte, Kopf `FBQ1 <id> <i>/<n> <16 hex SHA-256>` + Zeilenumbruch + Stück; Modul
0,5 mm, 12 Module weißer Abstand zwischen den Codes (jsQR findet keinen Code, wenn mehrere sichtbar sind; die App zerlegt das
Bild deshalb an weißen Zeilen und Spalten). Die Sofortmeldung ergibt 67 Datenzeilen (eine Seite) und 7 QR-Codes (eine Seite).

### Ursprüngliches Format (Spike)

```
Anlage: Daten in maschinenlesbarer Form                  (Noto Sans SemiBold 12 pt)
Nicht bearbeiten. Inhalt identisch mit den Angaben vorn; …  (Noto Sans 8 pt)
FRAGEBOGEN-DATEN 1 ID <questionnaireId> ZEILEN <n> BYTES <Länge JSON>   (Noto Sans Mono 7,5 pt)
SHA256 <SHA-256 des JSON, 64 hex>
0001 <bis 96 Zeichen base64url> <4 hex>
0002 …
```

- **Inhalt:** JCS-JSON des Fragebogens (UTF-8) → deflate (raw, fflate, Stufe 9) → base64url ohne Padding
  → Stücke zu 96 Zeichen.
- **Prüfsumme je Zeile:** die ersten 4 Hex-Zeichen von SHA-256(`"<Zeilennummer>:<Stück>"`). Sie
  findet Auslesefehler und benennt die Zeile.
- **Gesamtprüfung:** Länge und SHA-256 über das **unkomprimierte** JSON. So ist sie unabhängig vom
  Kompressor.
- **Satz:** Noto Sans Mono 7,5 pt, Zeilenabstand 9,4 pt, linker Rand 42 pt. Eine Zeile ist 106
  Zeichen ≈ 477 pt breit. Auf eine A4-Seite passen etwa 72 Zeilen ≈ 5,2 kB komprimierte Daten.
- **Lesen:** pdf.js liefert Textstücke. Sie werden nach y-Position zu Zeilen gruppiert und nach x
  sortiert. Leerraum wird zusammengefasst. Jede Zeile wird gegen
  `^(\d{4}) ([A-Za-z0-9_-]{1,96}) ([0-9a-f]{4})$` geprüft, die Reihenfolge ergibt sich aus den
  Zeilennummern.

**Regel aus einem Fehler im Spike:** **Jede Zeile muss vollständig innerhalb der Seite liegen.**
Ursprünglich stand der Kopf in einer einzigen, zu breiten Zeile. pdf.js lässt Glyphen jenseits des
Seitenrands weg, und der SHA-256 kam abgeschnitten an. Deshalb ist der Kopf jetzt zweizeilig. In
Schritt 8 bekommt das einen Test: Die Breite jeder Datenzeile muss kleiner als die Seitenbreite
abzüglich der Ränder sein.

## Empfehlungen für Schritt 3 (Siegel-Spezifikation)

Gut 70 % des komprimierten Blocks entfallen auf **Unterschriftsstriche (2,0 kB)** und **Feld-Hashes
(2,0 kB)**. Zwei Maßnahmen bringen den Beispielbogen voraussichtlich auf **eine** Datenseite:

- Striche delta-kodiert und kompakt speichern, statt als JSON-Zahlenarrays.
- Feld-Hashes auf 64 Bit kürzen. Die Integrität sichert der 256-Bit-`contentHash`; die Feld-Hashes
  dienen nur dazu, geänderte Felder zu benennen.

## Offene Gegenproben – verschoben und anders abgebildet (Stand 29.10.2026)

Die Gegenproben an Acrobat und DATEV **blockieren nichts mehr**. Tobias arbeitet derzeit aus der
Ferne. Was sich automatisieren lässt, wird automatisiert. Der Rest steht als Testfall in
[`manual_tests/90_pdf_gegenproben.md`](../manual_tests/90_pdf_gegenproben.md) und wird bei
Gelegenheit am Kanzlei-PC erledigt.

| Ursprüngliche Gegenprobe    | Neue Abbildung                                                                                                                                                                                                                                                                                                                            | Wann                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Acrobat Preflight PDF/A-2u  | **veraPDF**, der Referenz-Validator der PDF Association, prüft automatisch jede erzeugte Golden-PDF in der CI. Das kommt **vorgezogen in Schritt 8** statt erst in Schritt 12. Acrobat bleibt eine optionale Zweitmeinung (MT-90).                                                                                                        | Schritt 8                   |
| Acrobat „Speichern unter“   | Automatische Neuspeicher-Tests in Schritt 8: mit pdf-lib, wie im Spike, und zusätzlich mit **qpdf** als unabhängiger zweiter Implementierung (CI). Acrobat selbst: MT-92.                                                                                                                                                                 | Schritt 8                   |
| DATEV-Ablage hin und zurück | DATEV legt Dateien unverändert ab und gibt sie unverändert wieder heraus. Aus früheren Projekten ist belegt, dass Dateityp und eingebettete Struktur erhalten bleiben. Die Prüfung schrumpft damit auf „SHA-256 vorher = nachher“ (MT-91). Das ist ohne Entwicklerwerkzeuge machbar und erst sinnvoll, sobald die App echte PDFs erzeugt. | bei Gelegenheit             |
| „Microsoft Print to PDF“    | **Kein unterstützter Weg:** Die App verlangt die Originaldatei. Automatisch geprüft wird in Schritt 8, dass eine PDF **ohne lesbare Datenseiten mit klarer Meldung abgelehnt** wird, statt still falsche Daten zu liefern. Das Verhalten echter Druck-PDFs prüft MT-93.                                                                   | Schritt 8 / bei Gelegenheit |
| Firefox und Safari (WebKit) | Playwright unter `file://`                                                                                                                                                                                                                                                                                                                | Schritt 10                  |

Die Spike-Beispiele liegen weiterhin auf dem Entwicklungsrechner und sind nicht im Repo; sie
enthalten nur erfundene Daten:

- `.tmp/spike-pdf/out/sample-pdfa-2u.pdf`
- `.tmp/spike-pdf/out/sample-aes256.pdf` (Kennwort `Test-1234`)

Mit `node .tmp/spike-pdf/check.ts <datei.pdf>` lassen sie sich nach einer Gegenprobe erneut prüfen
(Ergebnis PASS oder FAIL). Ab Schritt 8 übernimmt das die App selbst beim Einlesen.
