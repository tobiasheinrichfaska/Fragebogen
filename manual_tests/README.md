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
3. Jeder Schritt ist eine Handlung; was sie bewirkt, steht direkt darunter unter **„Danach:“**. Eine
   falsche Eingabe ist ein eigener Schritt (danach: die Fehlermeldung), die richtige Eingabe der
   nächste. Was zu keinem einzelnen Schritt gehört, steht darunter unter „**Erwartet**“. Achten Sie
   besonders auf Punkte, die mit _Nicht offensichtlich_ markiert sind.
4. Werte zum Eintragen haben im Testbereich ein Kopiersymbol (⧉): anklicken, dann in der App
   einfügen. Werte, die wie eine Taste aussehen, tippen Sie bitte selbst – dort wird das Tippen
   geprüft (z. B. die Datumsmaske).
5. Notieren Sie Abweichungen mit Testfall-Nummer, Browser, Gerät und einem Bildschirmfoto. Das
   Bildschirmfoto darf keine echten Daten zeigen.

## Testfälle

| Datei                                                  | Bereich                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`01_start.md`](01_start.md)                           | Datei öffnen, Startseite, keine Netzverbindungen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [`02_ausfuellen.md`](02_ausfuellen.md)                 | Rollenwahl, Interview, „Vorerst überspringen“, Zusammenfassung, Zwischenstand, Übernahme, Verwerfen, angefangenen Fragebogen fortsetzen (MT-116), Datum im Kalender (MT-118)                                                                                                                                                                                                                                                                                                                                                         |
| [`03_abschluss.md`](03_abschluss.md)                   | Unterschrift, Abschluss ohne Unterschrift, Gerät weitergeben, Minderjährige, neue Fassung                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [`04_pdf.md`](04_pdf.md)                               | PDF erstellen und wieder öffnen, neu gespeicherte PDF, Scan und Fotos der QR-Codes, Link, PDF am Handy teilen (MT-37)                                                                                                                                                                                                                                                                                                                                                                                                                |
| [`05_kanzlei.md`](05_kanzlei.md)                       | Kanzlei: viele Dateien einlesen, zusammenführen, Konflikte entscheiden, PDF für die Personalakte, Übergabe an Lohn und Gehalt (MT-68–72)                                                                                                                                                                                                                                                                                                                                                                                             |
| [`06_aendern_und_ablauf.md`](06_aendern_und_ablauf.md) | Angaben ändern, Minijob-Steuer, Ablaufplan, Gültigkeit, Grenzen, Mehrfachbeschäftigung, Stammdaten-Link erstellen und spät füllen (MT-99–101) , Lesezeichen beginnt einen neuen Fragebogen (MT-109)                                                                                                                                                                                                                                                                                                                                  |
| [`07_sv_beurteilung.md`](07_sv_beurteilung.md)         | Verdienst zuerst, Azubi unter 600 €, Minijob mit Weihnachtsgeld, Sonderfälle, Befreiung, amtliche Listen, Aushilfe über drei Monate (MT-96), Werkstudent-Stunden (MT-97), Langzeitstudium und Versorgungswerk (MT-98), Studentin mit zwei Minijobs (MT-102), Hausfrau nach dem Ausscheiden (MT-103)                                                                                                                                                                                                                                  |
| [`08_auslieferung.md`](08_auslieferung.md)             | Auslieferung auf der Homepage: `.htaccess`, HTTPS, Header (MT-80); Hilfeseiten (MT-81); Hochladen, Ordner, Tester, Testseite (MT-82–85), erledigte Tests aus dem Bericht nehmen (MT-130)                                                                                                                                                                                                                                                                                                                                             |
| [`09_monatsmeldung.md`](09_monatsmeldung.md)           | Monatsmeldung (Entwurf): Kalender je Person, Stunden nur bei Stundenlohn, Lohnart-Vorschläge, Vormonat einlesen (MT-94, MT-95)                                                                                                                                                                                                                                                                                                                                                                                                       |
| [`10_eingabepruefung.md`](10_eingabepruefung.md)       | Längen im Eingabefeld, Zeichen nur als Hinweis, Geburtsdatum, Prüfhinweise zu Versicherungsnummer und Postleitzahl im Ausland, Stunden und Grad der Behinderung (MT-104 bis MT-108), Hinweis zur Versicherungsnummer beim Ausfüllen (MT-117)                                                                                                                                                                                                                                                                                         |
| [`11_eigenbeleg.md`](11_eigenbeleg.md)                 | Eigenbeleg (Entwurf): Spende gesperrt, Bewirtung gewarnt (MT-110), Bewirtung unterschreiben (MT-111), Prüfhinweise in der Kanzlei (MT-112), Privatentnahme bei einer GmbH (MT-113), Wechsel zum Geldtransit (MT-114), Einlage (MT-115)                                                                                                                                                                                                                                                                                               |
| [`12_sepa_mandat.md`](12_sepa_mandat.md)               | SEPA-Mandat: Stammdaten-Link der Kanzlei (MT-119), Kanzlei schließt ohne Unterschrift ab (MT-120), Kontoinhaberin erteilt das Mandat (MT-121), Gemeinschaftskonto (MT-122), ohne Teil der Kanzlei (MT-123), Teil der Kanzlei als Link weitergeben (MT-124), Kanzlei trägt die Angaben zum Konto ein (MT-125), Anschrift im Ausland (MT-126), abweichender Kontoinhaber (MT-127), zwei Kontoinhaber mit einer Unterschrift (MT-128), Kontoinhaberin ändert die vorbelegte IBAN (MT-129) – beschreibt die Fassung 1.1.0 im Testbereich |
| [`90_pdf_gegenproben.md`](90_pdf_gegenproben.md)       | Gegenproben mit Acrobat, DATEV und „Drucken als PDF“, bei Gelegenheit, blockieren nichts                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Im Testbereich

- **Einstieg:** Jeder Test sagt in der ersten Zeile, welchen Fragebogen Sie auf der **Startseite der
  App** neu starten. Dorthin
  kommen Sie jederzeit mit **„App neu starten (Startseite)“** oben im Testbereich – Ihre
  Testergebnisse bleiben, nur die Eingaben in der App sind dann weg.
- **Startlinks (▶):** Viele Tests beginnen mit einem Knopf wie **„▶ Zum Unterschreiben öffnen“**. Er
  startet die App rechts neu, mit einem vorbereiteten Fragebogen voller erfundener Angaben – zum
  Beispiel hat der Arbeitgeber schon abgeschlossen, und Sie beginnen genau bei der Frage, um die es
  im Test geht – oder die Kanzlei-Station mit schon eingelesenen Eingängen. Für eine Gegenprobe
  öffnen Sie den Startlink einfach noch einmal. Ihre
  Testergebnisse bleiben dabei erhalten, nur die Eingaben in der App sind weg.
- **Aufeinander aufbauende Tests:** Steht bei „Voraussetzungen“ ein anderer Test (z. B. „MT-10“),
  ist die Nummer anklickbar; machen Sie diesen Test zuerst oder direkt davor.
- **„Nicht im Testbereich“:** Manche Tests gehen nur mit der heruntergeladenen Datei oder nur am
  Kanzlei-PC (z. B. MT-01, MT-82–84). Sie stehen ausgegraut in der Liste, mit Begründung.
- **„Fassung mit Entwürfen“** ist im Testbereich schon geladen; der Hinweis auf
  `npm run build:preview` gilt nur für Entwickler.
- Am Ende **„Testbericht als PDF“** und per E-Mail an die Kanzlei.

## Für alle, die Tests schreiben (Format seit 06.11.2026)

Kleine Schritte, je eine Handlung; darunter, um 3 Leerzeichen eingerückt, was sie bewirkt. Die
Testseite zeigt es grün direkt unter dem Schritt. Eine falsche Eingabe ist ein eigener Schritt mit
der Fehlermeldung als Ergebnis, die richtige Eingabe der nächste (Tobias 2026-11-06: ein Hinweis
„Achten Sie gleich auf …“ vor dem Schritt half nicht):

```markdown
1. Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben.
   - **Danach:** Ein Fehler erscheint (Prüfziffer falsch).
2. Die Gläubiger-ID auf `DE98ZZZ09999999999` ändern.
   - **Danach:** Der Fehler verschwindet.
3. **„Kopieren“** klicken.
   - **Danach:** „Link kopiert.“
```

- Keine Verweise wie „ausfüllen wie in MT-121“ in den Schritten: die Schritte ausschreiben, mit den
  Werten.

- Werte zum Eintragen in Backticks (`` `…` ``) – im Schritt bekommen sie das Kopiersymbol; Werte, die
  absichtlich getippt werden sollen, als `<kbd>…</kbd>`. Kein Fett um Backticks.
- Unter „**Erwartet**“ steht nur, was zu keinem Schritt gehört; ein Eintrag „Schritt 3: …“ dort lässt
  einen automatischen Test scheitern (`tests/testbereich/manualTests.test.ts`), ebenso ein
  „Achten Sie gleich auf“.

## Bitte nicht als Fehler melden

- „Entwurf“ beim Formular im Testbereich: Das ist die Testfassung einer Änderung, gewollt. Die
  Sofortmeldung ist seit 03.11.2026 produktiv (Version 1.0.0, ohne Kennzeichnung); „Testfassung“ steht
  nur noch bei älteren Fassungen 0.x, mit denen Bögen unterwegs sein können.

## Pflege (für Entwickler)

Ändert sich ein Ablauf, den Nutzer sehen, wird der passende Testfall in derselben Sitzung
angepasst. Das gehört zur Definition of Done.

- Geht ein Test im Testbereich nicht, bekommt er direkt unter der Überschrift
  `**Testbereich:** nein – <Grund>`; jeder andere Text dort erscheint als Hinweis.
- Jeder Test beginnt direkt unter der Überschrift mit `**Einstieg:**` – welchen Fragebogen man auf
  der Startseite neu startet (im Testbereich stehen alle Fragebögen zur Wahl), oder auf welchem Test
  er aufbaut. Ein automatischer Test prüft das.
- **Startpunkte statt Vorlauf** (Tobias 2026-11-03: nicht jeden Bereich immer wieder befüllen): Ein
  Test, der nur einen kleinen Teil prüft, beginnt mit einem Startlink
  `[Text](start:<kennung>)`. Der Startpunkt liegt als Daten in `startpunkte/<kennung>.json`
  (Formular, Antworten je Rolle wie getippt, abgeschlossen oder offen, wo er öffnet; ein
  Kanzlei-Startpunkt nennt stattdessen Eingänge: `from` einen anderen Startpunkt, `change` geänderte
  Antworten, gleiche `questionnaire`-Kennung = derselbe Fragebogen). Die App baut
  ihn mit der neuesten Formularfassung; `tests/testbereich/startPoints.test.ts` prüft, dass jeder
  Startpunkt aufgeht und benutzt wird, `startPointsSv.test.ts` spielt die SV-Fälle ab ihrem
  Startpunkt durch. Nur erfundene Daten; Startpunkte gibt es nur im Testbereich.
- Eingegangene Testberichte liegen in `import/` (nicht im Repo). Nach der Bearbeitung kommen sie
  nach `import/archiv/<JJJJ-MM-TT>/` (Tag der Bearbeitung).
