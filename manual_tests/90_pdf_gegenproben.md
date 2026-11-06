# 90 – Gegenproben mit fremden Programmen (PDF)

Diese Tests prüfen, ob eine PDF aus der App den Weg durch fremde Programme übersteht. Sie
**blockieren keine Entwicklungsschritte**. Erledigen Sie sie bei Gelegenheit an einem PC mit Acrobat
Pro und DATEV.

**Testdatei:** Eine PDF, die die App erzeugt hat (erfundene Testdaten), z. B. aus MT-30.

**Prüfsumme einer Datei ermitteln** (wird in mehreren Tests gebraucht): Windows-Taste drücken,
„PowerShell“ eingeben, öffnen, dann eintippen:

```powershell
Get-FileHash "C:\Pfad\zur\datei.pdf"
```

Die lange Zeichenfolge unter „Hash“ ist die SHA-256-Prüfsumme. Notieren Sie die ersten und die
letzten acht Zeichen.

---

## MT-90: PDF/A-Prüfung mit Acrobat Pro (optional)

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus der App, z. B. aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) und **„PDF
erstellen“**.

**Voraussetzungen:** Adobe Acrobat Pro (nicht der kostenlose Reader). Eine PDF aus der App.

**Schritte:**

1. PDF in Acrobat Pro öffnen.
2. **Werkzeuge** → **Druckproduktion** (je nach Version: **Standards**) → **Preflight**.
3. Im Profil-Menü **PDF/A-2u** wählen, Eintrag **„Konformität mit PDF/A-2u prüfen“** →
   **Analysieren**.
   - **Danach:** „Keine Probleme gefunden“.

**Erwartet:**

_Nicht offensichtlich:_ Eine automatische PDF/A-Prüfung mit veraPDF ist geplant, läuft aber noch
nicht – bis dahin ist diese Gegenprobe die Prüfung.
Meldet Acrobat trotzdem Probleme, bitte die Meldungen als Bildschirmfoto festhalten. Die
Bildschirmfotos dürfen nur erfundene Daten zeigen.

## MT-91: DATEV-Ablage hin und zurück

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus der App, z. B. aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) und **„PDF
erstellen“**.

**Voraussetzungen:** Zugang zu einer DATEV-Testablage, also kein echter Mandant und keine echte
Personalakte. Eine PDF aus der App.

**Schritte:**

1. Prüfsumme der PDF ermitteln (siehe oben) und notieren.
2. PDF in die DATEV-Dokumentenablage bzw. Personalakte hochladen.
   - **Danach:** Bitte notieren, wo DATEV das Ablagedatum anzeigt und ob es sich nachträglich
     ändern lässt. Das Ablagedatum soll später als vertrauenswürdige Eingangszeit dienen.
3. Dieselbe PDF wieder herunterladen bzw. auschecken und unter neuem Namen speichern.
4. Prüfsumme der heruntergeladenen Datei ermitteln.
   - **Danach:** Beide Prüfsummen sind **identisch**. _Nicht offensichtlich:_ Unterscheiden sich die
     Prüfsummen, hat DATEV die Datei verändert.
5. Die heruntergeladene Datei in der App einlesen (auf der Startseite **„Datei öffnen …“**).
   - **Danach:** Die App liest die Datei ohne Warnung ein. Haben sich die Prüfsummen unterschieden,
     bitte notieren, ob die App die Datei trotzdem einliest und was die Prüfanzeige meldet.

## MT-92: Acrobat „Speichern unter“

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus der App, z. B. aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) und **„PDF
erstellen“**.

**Voraussetzungen:** Adobe Acrobat (Pro oder Reader). Eine PDF aus der App.

**Schritte:**

1. PDF in Acrobat öffnen.
2. **Datei** → **Speichern unter** → als neue Datei speichern.
3. Die neue Datei in der App einlesen (auf der Startseite **„Datei öffnen …“**).
   - **Danach:** Die App liest die Daten ein. Die Prüfanzeige meldet, dass die Datei nach dem
     Erzeugen von einem anderen Programm gespeichert wurde. _Nicht offensichtlich:_ Das ist ein
     **Hinweis, kein Fehler**. Die geprüften Daten auf den Datenseiten bleiben unverändert.

## MT-93: Drucken als PDF („Microsoft Print to PDF“)

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus der App, z. B. aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) und **„PDF
erstellen“**.

**Voraussetzungen:** Windows. Eine PDF aus der App.

**Schritte:**

1. PDF in Edge oder Acrobat öffnen.
2. **Drucken** → Drucker **„Microsoft Print to PDF“** → als neue Datei speichern.
3. Die neue Datei in der App einlesen (auf der Startseite **„Datei öffnen …“**).
   - **Danach:** Eines von beiden: Die App liest die Daten vollständig ein, **oder** sie lehnt die
     Datei mit einer verständlichen Meldung ab, etwa „keine lesbaren Datenseiten“.
   - **Danach:** _Nicht offensichtlich:_ Drucken als PDF ist **kein vorgesehener Weg**; weitergegeben
     wird immer die Originaldatei. Ein Fehler wäre es nur, wenn die App **falsche oder
     unvollständige Daten** ohne Meldung übernimmt.
