# Manuelle Tests – Fragebogen

Diese Anleitungen richten sich an Testerinnen und Tester **ohne Entwicklerkenntnisse**. Sie prüfen,
was nur ein Mensch am Bildschirm beurteilen kann: Darstellung, Unterschrift mit Finger oder Stift,
heruntergeladene PDFs und das Verhalten auf echten Geräten. Die automatischen Tests ersetzen das
nicht, und diese Anleitungen ersetzen die automatischen Tests nicht.

## Was Sie brauchen

- Einen Windows-PC oder Mac mit einem aktuellen Browser (Edge, Chrome, Firefox oder Safari).
- Für spätere Tests: ein Tablet oder Smartphone (iPad/iPhone nur über die gehostete Fassung).
- **Am einfachsten: den Testbereich** auf der Homepage (Adresse von der Kanzlei; von außerhalb mit
  Anmeldung). Dort stehen diese Tests links, die App rechts – am Handy über die Reiter
  „Testanleitung“ und „App“.
- Oder die Datei `index.html` aus dem Ordner `dist/` (`npm run build`), z. B. zugeschickt.
- Erfundene Testdaten. **Bitte nie echte Personendaten verwenden.**

## So gehen Sie vor

1. Notieren Sie die **Versionsnummer**. Sie steht unten auf der Startseite („Version …“).
2. Arbeiten Sie die Testfälle der Reihe nach ab.
3. Vergleichen Sie das Ergebnis mit „**Erwartet**“. Achten Sie besonders auf Punkte, die mit
   _Nicht offensichtlich_ markiert sind.
4. Notieren Sie Abweichungen mit Testfall-Nummer, Browser, Gerät und einem Bildschirmfoto. Das
   Bildschirmfoto darf keine echten Daten zeigen.

## Testfälle

| Datei                                                  | Bereich                                                                                                                                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01_start.md`](01_start.md)                           | Datei öffnen, Startseite, keine Netzverbindungen                                                                                                                                                                      |
| [`02_ausfuellen.md`](02_ausfuellen.md)                 | Rollenwahl, Interview, „Vorerst überspringen“, Zusammenfassung, Zwischenstand, Übernahme, Verwerfen                                                                                                                   |
| [`03_abschluss.md`](03_abschluss.md)                   | Unterschrift, Abschluss ohne Unterschrift, Gerät weitergeben, Minderjährige, neue Fassung                                                                                                                             |
| [`04_pdf.md`](04_pdf.md)                               | PDF erstellen und wieder öffnen, neu gespeicherte PDF, Scan und Fotos der QR-Codes, Link                                                                                                                              |
| [`05_kanzlei.md`](05_kanzlei.md)                       | Kanzlei: viele Dateien einlesen, zusammenführen, Konflikte entscheiden, PDF für die Personalakte, Übergabe an Lohn und Gehalt (MT-68–72)                                                                              |
| [`06_aendern_und_ablauf.md`](06_aendern_und_ablauf.md) | Angaben ändern, Minijob-Steuer, Ablaufplan, Gültigkeit, Grenzen, Mehrfachbeschäftigung                                                                                                                                |
| [`07_sv_beurteilung.md`](07_sv_beurteilung.md)         | Verdienst zuerst, Azubi unter 600 €, Minijob mit Weihnachtsgeld, Sonderfälle, Befreiung, amtliche Listen, Aushilfe über drei Monate (MT-96), Werkstudent-Stunden (MT-97), Langzeitstudium und Versorgungswerk (MT-98) |
| [`08_auslieferung.md`](08_auslieferung.md)             | Auslieferung auf der Homepage: `.htaccess`, HTTPS, Header (MT-80); Hilfeseiten (MT-81); Hochladen, Ordner, Tester, Testseite (MT-82–85)                                                                               |
| [`09_monatsmeldung.md`](09_monatsmeldung.md)           | Monatsmeldung (Entwurf): Kalender je Person, Stunden nur bei Stundenlohn, Lohnart-Vorschläge, Vormonat einlesen (MT-94, MT-95)                                                                                        |
| [`90_pdf_gegenproben.md`](90_pdf_gegenproben.md)       | Gegenproben mit Acrobat, DATEV und „Drucken als PDF“, bei Gelegenheit, blockieren nichts                                                                                                                              |

## Im Testbereich

- **Einstieg:** Jeder Test sagt in der ersten Zeile, welchen Fragebogen Sie auf der **Startseite der
  App** neu starten. Dorthin
  kommen Sie jederzeit mit **„App neu starten (Startseite)“** oben im Testbereich – Ihre
  Testergebnisse bleiben, nur die Eingaben in der App sind dann weg.
- **Aufeinander aufbauende Tests:** Steht bei „Voraussetzungen“ ein anderer Test (z. B. „MT-10“),
  ist die Nummer anklickbar; machen Sie diesen Test zuerst oder direkt davor.
- **„Nicht im Testbereich“:** Manche Tests gehen nur mit der heruntergeladenen Datei oder nur am
  Kanzlei-PC (z. B. MT-01, MT-82–84). Sie stehen ausgegraut in der Liste, mit Begründung.
- **„Fassung mit Entwürfen“** ist im Testbereich schon geladen; der Hinweis auf
  `npm run build:preview` gilt nur für Entwickler.
- Am Ende **„Testbericht als PDF“** und per E-Mail an die Kanzlei.

## Bitte nicht als Fehler melden

- „Testfassung“ beim Formular: Version 0.x ist gewollt, solange die App vor ihrem ersten Release steht.

## Pflege (für Entwickler)

Ändert sich ein Ablauf, den Nutzer sehen, wird der passende Testfall in derselben Sitzung
angepasst. Das gehört zur Definition of Done.

- Geht ein Test im Testbereich nicht, bekommt er direkt unter der Überschrift
  `**Testbereich:** nein – <Grund>`; jeder andere Text dort erscheint als Hinweis.
- Jeder Test beginnt direkt unter der Überschrift mit `**Einstieg:**` – welchen Fragebogen man auf
  der Startseite neu startet (im Testbereich stehen alle Fragebögen zur Wahl), oder auf welchem Test
  er aufbaut. Ein automatischer Test prüft das.
- Eingegangene Testberichte liegen in `import/` (nicht im Repo). Nach der Bearbeitung kommen sie
  nach `import/archiv/<JJJJ-MM-TT>/` (Tag der Bearbeitung).
