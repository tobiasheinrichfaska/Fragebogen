# Manuelle Tests – Fragebogen

Diese Anleitungen richten sich an Testerinnen und Tester **ohne Entwicklerkenntnisse**. Seit
08.11.2026 stehen hier nur noch Tests, die ein Mensch oder ein echtes Gerät braucht: das Aussehen
in einem echten PDF-Programm, Finger und Stift, Kamera und Scanner, Teilen-Menü und Tastatur am
Handy, der Upload am Kanzlei-PC. Alles, was ein Browser selbst nachspielen kann, prüfen die
automatischen Tests (siehe **Automatisiert** unten) – auch in Chrome, Firefox und Safari (WebKit)
und mit einem nachgestellten Handy.

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

| Datei                                            | Bereich                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01_start.md`](01_start.md)                     | Datei per Doppelklick öffnen (MT-01), dunkle Darstellung am echten Bildschirm (MT-03)                                                                                                             |
| [`02_ausfuellen.md`](02_ausfuellen.md)           | Tastatur und Kalender des Handys beim Datum (MT-118)                                                                                                                                              |
| [`03_abschluss.md`](03_abschluss.md)             | Unterschrift mit Finger und Stift auf Tablet oder Handy (MT-21)                                                                                                                                   |
| [`04_pdf.md`](04_pdf.md)                         | PDF im echten PDF-Programm (MT-30), mit Acrobat geändert (MT-33), Druck und Scan (MT-34), Fotos (MT-35), Link (MT-36), Teilen am Handy (MT-37), Kennwort in Chrome, Acrobat und Vorschau (MT-132) |
| [`05_kanzlei.md`](05_kanzlei.md)                 | Übergabe an Lohn und Gehalt: Import in DATEV (MT-68, MT-70)                                                                                                                                       |
| [`08_auslieferung.md`](08_auslieferung.md)       | Subdomain mit `.htaccess` (MT-80), Hilfeseiten am echten Handy (MT-81), Hochladen, Ordner, Tester (MT-82–84), Testseite am echten Handy (MT-85)                                                   |
| [`90_pdf_gegenproben.md`](90_pdf_gegenproben.md) | Gegenproben mit Acrobat, DATEV und „Drucken als PDF“, bei Gelegenheit, blockieren nichts                                                                                                          |

## Automatisiert (seit 08.11.2026)

Diese früheren Handtests laufen als automatische Tests in `tests/e2e/handtests/`
(`npm run test:e2e`). Bei „teilweise“ ist der Rest oben als Handtest geblieben. Die Ergebnisse
der SV-Fälle (Vorschläge, Begründungen, Prüfhinweise, welche Fragen kommen) prüft seit 14.11.2026
der schnellere Unit-Test `tests/testbereich/startPointsSv.test.ts` mit denselben Startpunkten; im
Browser bleibt je ein Fall, der zeigt, dass sie auf Bildschirm, Prüfblatt und Personalakte-PDF
ankommen.

| Frühere Tests                                                                                           | Automatischer Test                                    |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| MT-01, MT-03 (teilweise), MT-02                                                                         | `01_start.spec.ts`                                    |
| MT-10 bis MT-19, MT-26, MT-27, MT-116, MT-118 (teilweise)                                               | `02_ausfuellen.spec.ts`                               |
| MT-20, MT-21 (teilweise), MT-22 bis MT-25                                                               | `03_abschluss.spec.ts`                                |
| MT-30 bis MT-37 und MT-132 (teilweise, MT-31, MT-32 ganz)                                               | `04_pdf.spec.ts`                                      |
| MT-40 bis MT-43, MT-45 (Anzeige), MT-68 und MT-70 (teilweise), MT-69, MT-71, MT-72                      | `05_kanzlei.spec.ts`                                  |
| MT-50 bis MT-58, MT-86, MT-87, MT-99 bis MT-101, MT-109                                                 | `06_aendern_und_ablauf.spec.ts`                       |
| MT-60, MT-62 und MT-66 (je ein Fall), MT-63 bis MT-65                                                   | `07_sv_beurteilung.spec.ts`                           |
| MT-44, MT-45, MT-61, MT-62, MT-64, MT-66, MT-67, MT-88, MT-96 bis MT-98, MT-102, MT-103 (SV-Ergebnisse) | `tests/testbereich/startPointsSv.test.ts` (Unit-Test) |
| MT-81 (teilweise)                                                                                       | `08_auslieferung.spec.ts`                             |
| MT-85 (teilweise), MT-130, MT-133                                                                       | `08_testbereich.spec.ts`                              |
| MT-94, MT-95                                                                                            | `09_monatsmeldung.spec.ts`                            |
| MT-104 bis MT-108, MT-117, MT-134                                                                       | `10_eingabepruefung.spec.ts`                          |
| MT-110 bis MT-115                                                                                       | `11_eigenbeleg.spec.ts`                               |
| MT-119 bis MT-129, MT-131                                                                               | `12_sepa_mandat.spec.ts`                              |

## Im Testbereich

- **Jeder Test für sich (seit 07.11.2026):** Kein Test setzt einen anderen voraus. Jeder sagt in
  der ersten Zeile, wo er beginnt: auf der **Startseite der App**, mit einem **Startlink** oder an
  einem anderen Ort (ein Handy, die öffentliche Adresse). Öffnen Sie einen Test, fragt die Seite, ob
  die App dafür neu starten soll – mit genau diesem Einstieg. Ihre Testergebnisse bleiben dabei, nur
  die Eingaben in der App sind dann weg.
- **Startlinks (▶):** Viele Tests beginnen mit einem Knopf wie **„▶ Zum Unterschreiben öffnen“**. Er
  startet die App rechts neu, mit einem vorbereiteten Fragebogen voller erfundener Angaben – zum
  Beispiel hat der Arbeitgeber schon abgeschlossen, und Sie beginnen genau bei der Frage, um die es
  im Test geht – oder die Kanzlei-Station mit schon eingelesenen Eingängen. Für eine Gegenprobe
  öffnen Sie den Startlink einfach noch einmal. Ihre
  Testergebnisse bleiben dabei erhalten, nur die Eingaben in der App sind weg.
- **Verweise auf andere Tests** (z. B. „siehe MT-37“) sind anklickbar und nur zum Nachlesen; nötig
  ist der andere Test nie.
- **Kopfzeile:** „App neu starten“, „App vollständig zurücksetzen“ (löscht alles, was die App im
  Browser gespeichert hat; die Testergebnisse bleiben) und „Testbericht herunterladen“.
- **„Nicht im Testbereich“:** Manche Tests gehen nur mit der heruntergeladenen Datei oder nur am
  Kanzlei-PC (z. B. MT-01, MT-82–84). Ihr Kästchen ist in der Testübersicht blasser, der Test nennt den Grund.
- **„Fassung mit Entwürfen“** ist im Testbereich schon geladen; der Hinweis auf
  `npm run build:preview` gilt nur für Entwickler.
- Am Ende **„Testbericht herunterladen“** und per E-Mail an die Kanzlei. Schon gemeldete Tests
  fehlen im nächsten Bericht, außer Sie nehmen sie beim Herunterladen mit.

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
  der Startseite neu startet (im Testbereich stehen alle Fragebögen zur Wahl), welcher Startlink ihn
  vorbereitet oder an welchem Ort (Gerät, öffentliche Adresse) er spielt. **Nie ein anderer Test**
  (Tobias 2026-11-07: „Jeder Test startet mit seiner eigenen Umgebung“): Braucht ein Test eine
  Datei, einen Ausdruck oder einen Link, erstellt er sie in seinen ersten Schritten selbst oder
  bekommt einen Startpunkt. Ein automatischer Test prüft, dass Einstieg und Voraussetzungen keinen
  anderen Test nennen und kein Text „nach MT-…“, „aus MT-…“ oder „wie MT-…“ verlangt.
- **Startpunkte statt Vorlauf** (Tobias 2026-11-03: nicht jeden Bereich immer wieder befüllen): Ein
  Test, der nur einen kleinen Teil prüft, beginnt mit einem Startlink
  `[Text](start:<kennung>)`. Der Startpunkt liegt als Daten in `startpunkte/<kennung>.json`
  (Formular, Antworten je Rolle wie getippt, abgeschlossen oder offen, wo er öffnet; ein
  Kanzlei-Startpunkt nennt stattdessen Eingänge: `from` einen anderen Startpunkt, `change` geänderte
  Antworten, gleiche `questionnaire`-Kennung = derselbe Fragebogen; nur Kanzlei-Eingänge haben
  diese Kennung, für Formular-Startpunkte ist sie seit 08.11.2026 entfallen). Seit 07.11.2026 auch:
  ein Link-Startpunkt (`"link": "stammdaten=1&…"`, `"open": "link"`) öffnet die App wie ein
  Stammdaten-Link der Kanzlei. Die App baut
  ihn mit der neuesten Formularfassung; `tests/testbereich/startPoints.test.ts` prüft, dass jeder
  Startpunkt aufgeht und benutzt wird, `startPointsSv.test.ts` spielt die SV-Fälle ab ihrem
  Startpunkt durch. Nur erfundene Daten; Startpunkte gibt es nur im Testbereich.
- **Neue Tests (seit 08.11.2026):** Was ein Browser nachspielen kann, wird ein automatischer Test
  in `tests/e2e/handtests/<datei>.spec.ts`, kein Handtest. Er öffnet seinen Startpunkt direkt mit
  `dist-test/index.html?startpunkt=<kennung>` (`openTestApp` in `tests/e2e/app.ts`); ein neuer
  Startpunkt wirkt erst nach `npm run build:test`. Ein Handtest bleibt nur für das, was ein Mensch
  oder ein echtes Gerät braucht, und sagt in der Einleitung, was davon schon automatisch läuft.
- Eingegangene Testberichte liegen in `import/` (nicht im Repo). Nach der Bearbeitung kommen sie
  nach `import/archiv/<JJJJ-MM-TT>/` (Tag der Bearbeitung).
