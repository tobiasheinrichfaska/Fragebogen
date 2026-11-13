# Prompt für Claude in Chrome: alle Fragebögen durchspielen und bewerten

**Wofür:** Die automatischen Tests prüfen, ob die App tut, was die Tests erwarten. Sie prüfen nicht,
ob ein Laie die Fragen versteht. Sie finden auch keinen Ablauf, an den niemand einen Test geschrieben
hat; so blieb am 12.11.2026 eine Hinweisseite der Zustimmung ungezeigt. Claude in Chrome spielt jeden
Fragebogen, der öffentlich oder im Testordner steht, einmal wie ein Nutzer durch, mit erfundenen
Daten. Es meldet:

- wo der Ablauf hakt;
- welche Texte unklar sind;
- was falsch dargestellt wird.

Claude Code prüft jede Meldung danach am Code. Eine echte Meldung wird ein automatischer Test und eine
Korrektur. Die heruntergeladenen PDFs prüft Claude Code mit der Prüfung der App.

Ein Lauf ist kein Testnachweis: Er ersetzt weder die automatischen Tests noch die Handtests in
`manual_tests/`.

**Was geprüft wird:**

| Teil | Ort        | Formular (Knopf auf der Startseite)                                        | Version |
| ---- | ---------- | -------------------------------------------------------------------------- | ------- |
| 1    | öffentlich | Personalfragebogen: Angaben für die Lohnabrechnung                         | 1.0.0   |
| 1    | öffentlich | Personalfragebogen: Angaben für die Sofortmeldung                          | 1.0.0   |
| 1    | öffentlich | SEPA-Basislastschriftmandat                                                | 1.1.0   |
| 2    | Testordner | Zustimmung zur elektronischen Übermittlung der Steuererklärungen           | 0.1.0   |
| 2    | Testordner | Personalfragebogen: Angaben für die Sofortmeldung (Entwurf)                | 1.1.0   |
| 3    | Testordner | Austritt: Angaben zum Ende der Beschäftigung                               | 0.1.0   |
| 3    | Testordner | Dienstwagen: Überlassung                                                   | 0.1.0   |
| 3    | Testordner | Eigenbeleg: Ausgabe ohne Originalbeleg, Entnahme, Einlage oder Geldtransit | 0.1.0   |
| 3    | Testordner | Monatsmeldung: Lohn- und Gehaltsdaten                                      | 0.1.0   |

Lohnabrechnung und SEPA-Mandat sind im Testordner gleich wie öffentlich und laufen deshalb nur einmal.
Kommt ein Formular oder eine Version dazu, wird diese Tabelle und der passende Teil unten ergänzt.

**So gehst du vor:**

1. Am **Kanzlei-PC** arbeiten: Dort öffnet sich der Testordner ohne Anmeldung.
2. In Chrome unter Einstellungen → Downloads die Option **„Vor dem Download von Dateien nach dem
   Speicherort fragen“ ausschalten**. Sonst öffnet jede PDF ein Fenster von Windows, und Claude in
   Chrome bleibt dort stehen.
3. Unten im Prompt bei `ADRESSE` die Adresse der öffentlichen App eintragen.
4. Claude in Chrome in einem **neuen Chat** starten und den Text unter „Prompt“ vollständig einfügen.
   Die Adresse beim ersten Zugriff freigeben.
5. Die drei Teile dürfen in getrennten Sitzungen laufen: Für den nächsten Teil die Nachricht
   „Bitte jetzt Teil 2“ bzw. „Bitte jetzt Teil 3“ schicken.
6. Jede JSON-Antwort als eigene Datei speichern: `c:\skripte\public\Fragebogen\import\chrome-evaluierung-teil1.json`
   und entsprechend `…-teil2.json` und `…-teil3.json`. Die PDFs, die das JSON nennt, aus dem
   Download-Ordner nach `import\chrome-evaluierung-pdf\` verschieben. Der Ordner `import` wird nicht
   ins Repository übernommen.
7. Claude Code Bescheid geben.

---

## Prompt

Du testest eine Web-App für Fragebögen: Personalfragebogen, SEPA-Mandat, Zustimmung zu
Steuererklärungen und andere. Die App läuft ganz im Browser, sendet keine Daten ins Internet und
erzeugt am Ende eine PDF. Spiele jeden Fragebogen dieses Teils einmal so durch, wie es ein Laie täte:
Arbeitnehmer, Arbeitgeber, Mandanten. Bewerte dabei, was einen Nutzer stoppen, verwirren oder in die
Irre führen würde. Das Ergebnis ist ein JSON nach dem Schema unten.

- **Öffentliche App:** `ADRESSE`
- **Testordner:** dieselbe Adresse mit `/test/` am Ende. Die Startseite der öffentlichen App verlinkt
  ihn unten als „Testbereich (für Tester)“.

### Regeln (bitte strikt einhalten)

- **Nur diese Adressen.** Die Hilfeseiten „Wo finde ich …?“ unter derselben Adresse darfst du öffnen.
  Andere Seiten öffnest du nicht, und die anderen Tabs des Browsers liest du nicht. Arbeite in einem
  neuen Tab und schließe ihn am Ende.
- **Nur die erfundenen Testdaten unten.** Trage nie echte Namen, Nummern oder Anschriften ein.
- **Schritte ankündigen.** Nenne vor dem Start, wie viele Schritte du für diesen Teil etwa brauchst.
- **Diese Knöpfe nie drücken.** Sie öffnen ein Bestätigungsfenster des Browsers oder ein Fenster von
  Windows, an dem du stehen bleibst, oder sie löschen Daten:
  - „Alle Daten auf diesem Gerät löschen“
  - „Fragebogen verwerfen“
  - „Löschen“ im Kasten „Angefangener Fragebogen gefunden“
  - „Teilen“
  - „Datei öffnen …“ und jede andere Dateiauswahl
  - „Eingänge zusammenführen …“ (die Kanzlei-Station braucht Dateien)
  - „Mit Kennwort schützen“: Erstelle keine PDF und keinen Link mit Kennwort.
- **„Fragebogen schließen“ erst, wenn die PDF erstellt ist.** Vorher fragt der Browser nach, und du
  bleibst stehen.
- **Die Seite nie neu laden oder verlassen, solange ein Fragebogen offen ist und die PDF noch fehlt.**
  Der Browser fragt sonst „Seite verlassen?“.
- **Erscheint trotzdem ein Fenster** des Browsers oder von Windows (Bestätigen, Speichern unter,
  Anmeldung, Seite verlassen), hörst du auf. Bitte dann Tobias, es zu schließen, und notiere es in
  `nicht_geschafft`.
- **„Angefangener Fragebogen gefunden“:** Stammt er erkennbar aus deinem eigenen Lauf (gleicher Titel,
  wenige Minuten alt), drückst du „Fortsetzen“. Sonst hörst du auf und fragst Tobias: Es kann ein
  echter Fragebogen sein.
- **Im Testordner** benutzt du nur die App auf der rechten Seite. Kreuze keine Testergebnisse an und
  öffne keinen Startlink (▶). Lade keinen Testbericht herunter. „App vollständig zurücksetzen“ drückst
  du nicht. „App neu starten“ ist erlaubt.
- **Keine Recherche, kein Rechtsurteil.** Zweifelst du an einer fachlichen Aussage, meldest du den
  Zweifel mit Begründung als `fachlicher_zweifel`. Entscheiden tust du ihn nicht.
- **Nur melden, was du gesehen hast.** Zitiere den betroffenen Text wörtlich, höchstens zwei Sätze. Was
  du nicht prüfen konntest, gehört in `nicht_geschafft`, nicht in die Befunde.
- **Konsole:** Lies nach jedem Formular die Konsole der Seite mit dem Muster
  `error|Error|Uncaught|Content Security|CSP|warn` und notiere die Meldungen im Lauf.

### Testdaten (alle erfunden)

| Wofür                            | Wert                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Person                           | Erika Musterfrau, geboren am 17.05.1990 in Musterstadt, weiblich, deutsch                                    |
| Anschrift                        | Musterweg 1, 12345 Musterstadt                                                                               |
| Versicherungsnummer              | `65 170590 M 520`                                                                                            |
| Steuer-ID                        | `86095742719`                                                                                                |
| IBAN                             | `DE89 3704 0044 0532 0130 00`                                                                                |
| IBAN mit Fehler (absichtlich)    | `DE89 3704 0044 0532 0130 01`                                                                                |
| Zweite Person / Ehegatte         | Max Musterfrau, geboren am 03.02.1988                                                                        |
| Minderjährige Person             | Mia Musterfrau, geboren am 10.03.2010, gesetzlich vertreten durch Erika Musterfrau                           |
| Betrieb                          | Beispiel Bau GmbH, Betriebsnummer `12345671`, Beispielstraße 9, 12345 Musterstadt                            |
| Beschäftigung                    | Beginn 01.12.2026, Bürokauffrau, 40 Stunden je Woche, 3.200 € brutto im Monat                                |
| Kanzlei                          | Beispiel Steuerberatung, Beispielstraße 1, 12345 Musterstadt, Deutschland; Gläubiger-ID `DE98ZZZ09999999999` |
| Mandantennummer, Mandatsreferenz | `10001`, `BSP-2026-001`                                                                                      |
| Bank                             | Beispielbank; BIC leer lassen, wenn erlaubt, sonst `COBADEFFXXX`                                             |
| Telefon, E-Mail                  | leer lassen oder „Vorerst überspringen“                                                                      |

Fehlt eine Angabe, wähle eine schlichte, plausible Antwort und notiere sie in `eingabe`. Erwartet die
App eine Unterlage, die du nicht hast, nimm „Vorerst überspringen“, wenn es angeboten wird. Passt die
Versicherungsnummer nicht zum Geburtsdatum (etwa bei Mia), darf die App einen Hinweis zeigen; das ist
erwartet.

### So spielst du einen Fragebogen durch

1. Startseite: Unter „Neuer Fragebogen“ den Knopf mit dem Titel drücken. Notiere Version und
   Kennzeichnung, z. B. „Entwurf (nur Vorschau)“.
2. „Wer füllt jetzt aus?“: Nimm die Rollen von oben nach unten mit „Ich bin: …“. Eine Rolle, die
   (noch) nicht nötig ist, lässt du aus und notierst, wie die App das sagt.
3. **Hauptweg nur mit „Weiter“.** Nutze nicht den Link „Zur Zusammenfassung – alle Angaben ansehen und
   ändern“, bis die Zusammenfassung von selbst kommt. Notiere jede Seite in `seiten`, mit den ersten
   etwa 100 Zeichen der Frage oder Überschrift. Auf einer Hinweisseite setzt du den Haken „Ich habe den
   Hinweis gelesen.“ und drückst „Weiter“.
4. **Einmal je Formular eine falsche Eingabe**, zum Beispiel die IBAN mit Fehler oder ein Datum
   `31.02.2026`. Notiere die Meldung und ob sie verständlich ist und an der richtigen Stelle steht.
   Danach gibst du den richtigen Wert ein.
5. **Einmal je Formular zurückgehen:** zwei Seiten mit „Zurück“, eine Antwort ändern, wieder mit
   „Weiter“ vor. Passen die Folgefragen zur neuen Antwort?
6. **Zusammenfassung:** Notiere, was unter „Das fehlt noch …“, „Bitte prüfen“ und „Übersprungen“ steht.
   **Steht dort etwas als fehlend, das dir unterwegs nie gezeigt wurde, ist das ein Befund der
   Schwere „hoch“.**
7. **Abschließen:** Bei der Unterschrift „Namen tippen“ wählen (nicht zeichnen), sonst „Ohne
   Unterschrift abschließen“, wenn nur das angeboten wird. Dann „Unterschreiben und abschließen“ bzw.
   „Abschließen“.
8. **Abschlussseite:** Notiere, welcher Knopf hervorgehoben ist (blau gefüllt). Dann mit „Gerät
   weitergeben – zur Übersicht“ oder „Zur Übersicht“ zur nächsten Rolle.
9. Sind alle nötigen Rollen fertig, drückst du „PDF erstellen“, ohne Kennwort. Notiere Dateiname und
   Meldung. Dann „Fragebogen schließen“.
10. Lies die Konsole (siehe Regeln).

Kannst du die Fenstergröße ändern, spiele **einen** Fragebogen je Teil ganz in Handybreite (etwa
400 Pixel) durch und notiere es in `umgebung`.

### Was du bewertest

| `art`                | Beispiele                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ablauf`             | Seite fehlt oder kommt doppelt; Folgefrage fehlt oder passt nicht; man kommt nicht weiter; Rolle falsch nötig |
| `eingabe`            | richtige Eingabe abgelehnt; falsche angenommen; Fehlermeldung unklar oder an der falschen Stelle              |
| `verstaendlichkeit`  | Fachwort ohne Erklärung; Frage mehrdeutig; doppelte Verneinung; Text zu lang für die Aussage                  |
| `einheitlichkeit`    | dieselbe Sache verschieden benannt; Sie und du gemischt; Knopf heißt anders als im Text                       |
| `darstellung`        | Text abgeschnitten oder überlappend; Knopf nicht sichtbar; Fokus springt; Tastatur geht nicht                 |
| `fachlicher_zweifel` | Aussage zu Recht, Steuer oder Sozialversicherung wirkt falsch oder unvollständig (nur Zweifel, mit Grund)     |
| `konsole`            | Fehler oder Warnungen in der Konsole                                                                          |
| `sonstiges`          | alles andere                                                                                                  |

`schwere`:

- **`hoch`**: Daten gehen verloren oder werden falsch übernommen. Der Ablauf blockiert. Eine Seite
  wird nicht gezeigt, aber später als fehlend gemeldet. Oder eine Aussage ist sachlich falsch.
- **`mittel`**: Ein Laie bleibt hängen oder versteht eine Frage wahrscheinlich falsch.
- **`niedrig`**: Kosmetik, Wortwahl.

### Bekannt – bitte nicht neu melden

- „Entwurf (nur Vorschau)“ oder „Testfassung“ beim Formular im Testordner ist gewollt.
- Der Fortschritt („2 von etwa 14“) zählt vorbelegte Antworten mit.
- Der Personalfragebogen für die Lohnabrechnung gilt nur für einen Beschäftigungsbeginn im Jahr 2026.
- Die Zustimmung hängt keine AGB an. Sie verweist auf die AGB, die die Kanzlei mit den Erklärungen
  geschickt hat.
- **Nur öffentliche App:** Sind alle Rollen fertig, ist dort noch „Gerät weitergeben – zur Übersicht“
  hervorgehoben statt „PDF erstellen“. Außerdem kann eine Hinweisseite übersprungen werden und erst in
  der Zusammenfassung als fehlend erscheinen, wenn sie von Angaben einer anderen Rolle abhängt. Beides
  ist im Testordner behoben. Siehst du es öffentlich, meldest du es mit `"bekannt": true`.

### Teil 1 – öffentliche App

1. **Personalfragebogen: Angaben für die Lohnabrechnung** – Erika Musterfrau, feste Stelle in
   Vollzeit, gesetzlich krankenversichert, Steuerklasse 1, keine Kinder, keine weitere Beschäftigung.
   Rollen: Beschäftigte Person, dann Arbeitgeber (Beispiel Bau GmbH, Beschäftigung wie oben).
2. **Personalfragebogen: Angaben für die Sofortmeldung** (1.0.0) – dieselbe Person und derselbe
   Arbeitgeber.
3. **SEPA-Basislastschriftmandat** – Rolle Kanzlei: Zahlungsempfänger wie oben, zahlungspflichtig
   Erika Musterfrau, wiederkehrende Zahlungen. Danach Erika Musterfrau als Kontoinhaberin. Sie gibt
   Max Musterfrau als weiteren Kontoinhaber an und bei „Verfügung über das Konto“ „nur beide gemeinsam“.
   Dann muss die zweite Rolle nötig werden; spiele sie als Max durch.

### Teil 2 – Testordner

1. **Zustimmung …, Lauf A (Betrieb):** Kanzlei: Mandant „Beispiel Bau GmbH“, Datum der Vorlage
   12.11.2026. Angekreuzt sind Körperschaftsteuer, Gewerbesteuer, Offenlegung beim Unternehmensregister
   und die Zerlegung. Keine Einschränkung. Danach der Mandant; die zweite Person darf nicht nötig sein.
   Achte besonders darauf, ob jede Hinweisseite zu den angekreuzten Erklärungen erscheint.
2. **Zustimmung …, Lauf B (Ehepaar):** Kanzlei: Mandant „Erika Musterfrau“. Angekreuzt sind
   Einkommensteuer (Zusammenveranlagung mit Max Musterfrau), Umsatzsteuer und Digitaler Finanzbericht.
   Danach Erika als Mandantin mit der Einschränkung „Bitte erst nach dem 20.11.2026 übermitteln.“,
   dann Max als Ehegatte. Sieht Max die Einschränkungen der anderen?
3. **Personalfragebogen: Angaben für die Sofortmeldung (Entwurf 1.1.0)** – Mia Musterfrau,
   minderjährig, Aushilfe bei der Beispiel Bau GmbH ab 01.12.2026. Die gesetzliche Vertretung (Erika)
   muss nötig werden.

### Teil 3 – Testordner

Je ein schlichter, plausibler Lauf mit den Testdaten. Wähle, wo die App eine Art abfragt, die
einfachste:

1. **Austritt** – Ende der Beschäftigung von Erika Musterfrau am 31.12.2026.
2. **Dienstwagen** – überlassen ab 01.12.2026 an Erika Musterfrau.
3. **Eigenbeleg** – eine Barausgabe von 23,80 € am 10.11.2026 ohne Originalbeleg.
4. **Monatsmeldung** – Abrechnungsmonat November 2026 für die Beispiel Bau GmbH.

### Antwortformat

Antworte **nur** mit diesem JSON, ohne Text davor oder danach. Werte schreibst du auf Deutsch,
unbekannt = `null`. Ist die Antwort zu lang, teile sie auf mehrere Nachrichten auf. Jede Nachricht ist
dann ein vollständiges JSON derselben Form mit `"nachricht": n` und `"nachrichten": m`.

```json
{
  "erstellt": "JJJJ-MM-TT",
  "teil": 1,
  "nachricht": 1,
  "nachrichten": 1,
  "umgebung": {
    "browser": "",
    "fensterbreiten": [1280],
    "beginn": "HH:MM",
    "ende": "HH:MM",
    "schritte": 0
  },
  "laeufe": [
    {
      "id": "L1",
      "ort": "oeffentlich",
      "formular": "",
      "version": "",
      "kennzeichnung": null,
      "variante": "",
      "rollen": [
        {
          "rolle": "",
          "noetig_laut_app": true,
          "seiten": [{ "nr": 1, "art": "frage", "text": "", "eingabe": null, "befunde": [] }],
          "zusammenfassung": { "fehlt_noch": [], "bitte_pruefen": [], "uebersprungen": [] },
          "abschluss": {
            "art": "Namen tippen",
            "geschafft": true,
            "hervorgehobener_knopf": ""
          }
        }
      ],
      "pdf": { "erstellt": false, "dateiname": null, "meldung": null },
      "konsole": [{ "stufe": "error", "text": "", "anzahl": 1 }],
      "abgebrochen": null
    }
  ],
  "befunde": [
    {
      "id": "B1",
      "lauf": "L1",
      "rolle": "",
      "seite": 1,
      "art": "ablauf",
      "schwere": "hoch",
      "bekannt": false,
      "beschreibung": "",
      "zitat": "",
      "erwartet": "",
      "vorschlag": null,
      "nachstellen": [""]
    }
  ],
  "gesamteindruck": [{ "formular": "", "eindruck": "" }],
  "nicht_geschafft": [{ "was": "", "warum": "" }],
  "offen": [{ "frage": "", "grund": "" }]
}
```

- `seiten[].art` ist `frage`, `hinweis`, `tabelle`, `zusammenfassung`, `unterschrift` oder
  `abschluss`. `befunde` dort nennt die ids der Befunde zu dieser Seite.
- `noetig_laut_app` gibt wieder, was die Übersicht „Wer füllt jetzt aus?“ zur Rolle sagt.
- `nachstellen` sind die Schritte, mit denen jemand den Befund von der Startseite aus wiederfindet.
- `gesamteindruck` sind zwei bis vier Sätze je Formular: Wie leicht kommt ein Laie durch?
