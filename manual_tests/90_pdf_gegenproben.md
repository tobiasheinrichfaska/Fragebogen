# 90 – Gegenproben mit fremden Programmen (PDF)

Diese Tests prüfen, ob eine PDF aus der App den Weg durch fremde Programme übersteht. Sie
**blockieren keine Entwicklungsschritte**. Erledigen Sie sie bei Gelegenheit an einem PC mit Acrobat
Pro und DATEV.

**Testdatei:** Ab Schritt 8 erzeugt die App die PDF selbst (erfundene Testdaten). Bis dahin gibt es
nur die Spike-Beispiele auf dem Entwicklungsrechner: `.tmp/spike-pdf/out/sample-pdfa-2u.pdf`.

**Prüfsumme einer Datei ermitteln** (wird in mehreren Tests gebraucht): Windows-Taste drücken,
„PowerShell“ eingeben, öffnen, dann eintippen:

```powershell
Get-FileHash "C:\Pfad\zur\datei.pdf"
```

Die lange Zeichenfolge unter „Hash“ ist die SHA-256-Prüfsumme. Notieren Sie die ersten und die
letzten acht Zeichen.

---

## MT-90: PDF/A-Prüfung mit Acrobat Pro (optional)

**Voraussetzungen:** Adobe Acrobat Pro (nicht der kostenlose Reader). Eine PDF aus der App.

**Schritte:**

1. PDF in Acrobat Pro öffnen.
2. **Werkzeuge** → **Druckproduktion** (je nach Version: **Standards**) → **Preflight**.
3. Im Profil-Menü **PDF/A-2u** wählen, Eintrag **„Konformität mit PDF/A-2u prüfen“** →
   **Analysieren**.

**Erwartet:** „Keine Probleme gefunden“.
_Nicht offensichtlich:_ Die verbindliche PDF/A-Prüfung macht ab Schritt 8 automatisch veraPDF.
Meldet Acrobat trotzdem Probleme, bitte die Meldungen als Bildschirmfoto festhalten. Die
Bildschirmfotos dürfen nur erfundene Daten zeigen.

## MT-91: DATEV-Ablage hin und zurück

**Voraussetzungen:** Zugang zu einer DATEV-Testablage, also kein echter Mandant und keine echte
Personalakte. Eine PDF aus der App.

**Schritte:**

1. Prüfsumme der PDF ermitteln (siehe oben) und notieren.
2. PDF in die DATEV-Dokumentenablage bzw. Personalakte hochladen.
3. Dieselbe PDF wieder herunterladen bzw. auschecken und unter neuem Namen speichern.
4. Prüfsumme der heruntergeladenen Datei ermitteln.
5. Die heruntergeladene Datei in der App einlesen (ab Schritt 8: **Fragebogen einlesen**).

**Erwartet:** Beide Prüfsummen sind **identisch**. Die App liest die Datei ohne Warnung ein.
_Nicht offensichtlich:_ Unterscheiden sich die Prüfsummen, hat DATEV die Datei verändert. Bitte
dann notieren, ob die App die Datei trotzdem einliest und was die Prüfanzeige meldet. Bitte auch
notieren, wo DATEV das Ablagedatum anzeigt und ob es sich nachträglich ändern lässt. Das
Ablagedatum soll später als vertrauenswürdige Eingangszeit dienen.

## MT-92: Acrobat „Speichern unter“

**Voraussetzungen:** Adobe Acrobat (Pro oder Reader). Eine PDF aus der App.

**Schritte:**

1. PDF in Acrobat öffnen.
2. **Datei** → **Speichern unter** → als neue Datei speichern.
3. Die neue Datei in der App einlesen (ab Schritt 8).

**Erwartet:** Die App liest die Daten ein. Die Prüfanzeige meldet, dass die Datei nach dem
Erzeugen von einem anderen Programm gespeichert wurde.
_Nicht offensichtlich:_ Das ist ein **Hinweis, kein Fehler**. Die geprüften Daten auf den
Datenseiten bleiben unverändert.

## MT-93: Drucken als PDF („Microsoft Print to PDF“)

**Voraussetzungen:** Windows. Eine PDF aus der App.

**Schritte:**

1. PDF in Edge oder Acrobat öffnen.
2. **Drucken** → Drucker **„Microsoft Print to PDF“** → als neue Datei speichern.
3. Die neue Datei in der App einlesen (ab Schritt 8).

**Erwartet:** Eines von beiden:

- Die App liest die Daten vollständig ein, **oder**
- sie lehnt die Datei mit einer verständlichen Meldung ab, etwa „keine lesbaren Datenseiten“.

_Nicht offensichtlich:_ Drucken als PDF ist **kein vorgesehener Weg**; weitergegeben wird immer die
Originaldatei. Ein Fehler wäre es nur, wenn die App **falsche oder unvollständige Daten** ohne
Meldung übernimmt.
