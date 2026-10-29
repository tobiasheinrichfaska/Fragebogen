# Manuelle Tests – Fragebogen

Diese Anleitungen richten sich an Testerinnen und Tester **ohne Entwicklerkenntnisse**. Sie prüfen,
was nur ein Mensch am Bildschirm beurteilen kann: Darstellung, Unterschrift mit Finger oder Stift,
heruntergeladene PDFs und das Verhalten auf echten Geräten. Die automatischen Tests ersetzen das
nicht, und diese Anleitungen ersetzen die automatischen Tests nicht.

## Was Sie brauchen

- Einen Windows-PC oder Mac mit einem aktuellen Browser (Edge, Chrome, Firefox oder Safari).
- Für spätere Tests: ein Tablet oder Smartphone (iPad/iPhone nur über die gehostete Fassung).
- Die Datei `index.html` aus dem Ordner `dist/`. Sie entsteht mit `npm run build`; alternativ
  bekommen Sie sie zugeschickt.
- Erfundene Testdaten. **Bitte nie echte Personendaten verwenden.**

## So gehen Sie vor

1. Notieren Sie die **Versionsnummer**. Sie steht unten auf der Startseite („Version …“).
2. Arbeiten Sie die Testfälle der Reihe nach ab.
3. Vergleichen Sie das Ergebnis mit „**Erwartet**“. Achten Sie besonders auf Punkte, die mit
   _Nicht offensichtlich_ markiert sind.
4. Notieren Sie Abweichungen mit Testfall-Nummer, Browser, Gerät und einem Bildschirmfoto. Das
   Bildschirmfoto darf keine echten Daten zeigen.

## Testfälle

| Datei                                            | Bereich                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [`01_start.md`](01_start.md)                     | Datei öffnen, Startseite, keine Netzverbindungen                                          |
| [`02_ausfuellen.md`](02_ausfuellen.md)           | Rollenwahl, Interview, „Weiß ich gerade nicht“, Zusammenfassung, Zwischenstand            |
| [`03_abschluss.md`](03_abschluss.md)             | Unterschrift, Abschluss ohne Unterschrift, Gerät weitergeben, Minderjährige, neue Fassung |
| [`90_pdf_gegenproben.md`](90_pdf_gegenproben.md) | Gegenproben mit Acrobat, DATEV und „Drucken als PDF“, bei Gelegenheit, blockieren nichts  |

Weitere Bereiche kommen mit den nächsten Schritten hinzu: PDF, Einlesen, QR-Codes und
Zusammenführung.

## Bitte nicht als Fehler melden

- „Testfassung“ beim Formular: Version 0.x ist gewollt, solange die App vor ihrem ersten Release steht.
- „PDF erstellen“ meldet nur „folgt im nächsten Schritt“: Die PDF-Ausgabe kommt mit Schritt 8.

## Pflege (für Entwickler)

Ändert sich ein Ablauf, den Nutzer sehen, wird der passende Testfall in derselben Sitzung
angepasst. Das gehört zur Definition of Done.
