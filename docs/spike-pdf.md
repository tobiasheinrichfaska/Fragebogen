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

## Format der Datenseiten, Version 1

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

## Offen – braucht Tests am echten Gerät (Tobias)

Beispiel-PDFs, nur mit erfundenen Daten:

- `.tmp/spike-pdf/out/sample-pdfa-2u.pdf`
- `.tmp/spike-pdf/out/sample-aes256.pdf` (Kennwort `Test-1234`)

1. **Acrobat Pro → Werkzeuge → Druckproduktion bzw. Standards → Preflight → „Konformität mit PDF/A-2u
   prüfen“.** Das ist die eigentliche PDF/A-Prüfung; mein Strukturcheck ist kein Validator.
2. **Acrobat „Speichern unter“** als neue Datei, danach
   `node .tmp/spike-pdf/check.ts <datei.pdf>` (zeigt PASS oder FAIL).
3. **DATEV-Ablage:** die PDF in die Personalakte bzw. Dokumentenablage hochladen, wieder
   herunterladen und genauso prüfen.
4. **„Microsoft Print to PDF“** (Drucken als PDF) und prüfen. Erwartung: Der Text bleibt meist
   erhalten, Garantie gibt es keine. Mein Headless-Test war hier **nicht aussagekräftig**, weil
   ohne PDF-Viewer eine leere Datei entstand.
5. **Firefox und Safari** sind noch nicht getestet; das kommt mit Playwright in Schritt 10.
