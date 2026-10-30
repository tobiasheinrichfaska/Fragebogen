# KI-Anleitung: Fragebögen aufbauen und anpassen

Diese Anleitung ist ein **Prompt für jede KI** (und eine Referenz für Menschen), die eine
Formulardefinition für die App „Fragebogen“ neu entwirft oder ändert. Sie beschreibt das Format
vollständig; `tests/static/kiAnleitung.test.ts` prüft, dass jeder Schlüssel und jeder Wert, den die
App kennt, hier vorkommt und dass das Beispiel unten gültig ist.

**So benutzen:** Den Abschnitt „Auftrag“ und alles danach in die KI kopieren. Dazu eine vorhandene
Definition als Muster anhängen (z. B. `form-drafts/personalfragebogen/0.1.0.json`) und die Aufgabe
beschreiben, etwa „Entwirf einen Fragebogen für …“ oder „Ergänze im Personalfragebogen …“.

---

## Auftrag

Du entwirfst oder änderst eine **Formulardefinition als JSON** für eine Offline-App, in der
Beschäftigte, Arbeitgeber und eine lohnabrechnende Stelle (Kanzlei) Fragebögen ausfüllen,
unterschreiben und zusammenführen. Die App berechnet alles aus dieser Datei: Interview, Folgefragen,
Pflichten, PDF, Prüfhinweise und den Ablaufplan. Es gibt keinen Programmcode je Formular.

Gib zurück:

1. die **vollständige JSON-Datei** (keine Auszüge, keine Kommentare im JSON),
2. eine kurze Liste **offener Fragen** an den Fachmenschen, der freigibt,
3. eine Liste der **Fundstellen**, die du nicht am Gesetzestext prüfen konntest („nicht verifiziert“).

## Grundsätze

1. **Nur die Schlüssel unten.** Ein unbekannter Schlüssel, ein fehlender Pflichtwert oder ein
   falscher Typ lässt die Datei durchfallen; nichts wird ergänzt oder umgewandelt. Zahlen,
   Beträge und Daten stehen im Fragebogen immer als Text, nie als JSON-Zahl.
2. **Eigene Worte.** Formulierungen fremder Formulare nie wörtlich übernehmen. Fragen in der
   Sie-Form, kurz, eine Sache je Frage. Die Hilfe sagt, wo man die Angabe findet und was davon
   abhängt.
3. **Wer es weiß, füllt es aus.** Die Zuständigkeit liegt je Feld (`role`), nicht je Abschnitt:
   Entgelt, Arbeitszeit und Unterlagen kennt der Arbeitgeber; Lebensumstände kennt die Person.
4. **Datensparsamkeit und Fragerecht.** Nur fragen, was für den Zweck nötig ist, und den Zweck je
   Feld in `purpose` nennen (er speist den Datenschutzhinweis). Nie fragen: Schwangerschaft,
   Gewerkschaft, Gesundheit, Religion oder Weltanschauung. Steuerklasse, Kinderfreibeträge und
   Kirchensteuermerkmal kommen aus den ELStAM und werden nicht gefragt. Schwerbehinderung nur
   freiwillig und beim Arbeitgeber.
5. **Jede Bedingung wird erklärt.** Wer `showIf`, `requiredIf` oder `fromRole` setzt, schreibt in
   `because`, warum die Frage davon abhängt, wenn möglich mit Fundstelle. Bedingte Rollen ebenso.
   Entwürfe ohne Begründung bestehen die Tests nicht.
6. **Fundstellen** im Format „§ 8 Abs. 1 Nr. 2 SGB IV“, Richtlinien mit Randziffer
   („Geringfügigkeits-Richtlinien B 2.2“). Was du nicht am Original prüfen konntest, markierst du
   als „nicht verifiziert“ und nennst es in der Antwort.
7. **Reihenfolge = Interview.** `showIf` darf nur auf **frühere** Felder **derselben Rolle**
   verweisen. Weichen stehen vorn: „Liegt die Anschrift im Ausland?“ eröffnet die Anschrift, weil
   davon das Format der Postleitzahl abhängt. Folgefragen stehen direkt hinter der Frage, die sie
   öffnet.
8. **Feldkennungen sind für immer.** `id` in camelCase, deutsch, Felder des Arbeitgebers mit
   `ag`-Präfix (`agBeschaeftigungsart`). Eine einmal veröffentlichte Kennung behält Typ, Rolle und
   Bedeutung in allen Versionen; ändert sich die Bedeutung, gibt es eine neue Kennung.
9. **Versionen.** Veröffentlichte Fassungen (`forms/`) sind eingefroren. Jede Änderung ist ein
   Entwurf mit neuer Version in `form-drafts/<id>/<version>.json`; 0.x sind Testfassungen.
10. **Schriftform.** Wo das Gesetz eigenhändige Unterschrift verlangt oder die Praxis sie erwartet
    (z. B. Befreiung von der Rentenversicherung im Minijob), bleibt die Erklärung auf Papier: Der
    Fragebogen fragt nur den Wunsch ab, der Arbeitgeber dokumentiert das Eingangsdatum. Hinweise,
    die nachweislich auf Papier ausgehändigt werden müssen, sind `paperHandout`.
11. **Keine Namen oder Logos von Kanzleien oder Firmen** in der Definition; das ist Konfiguration.
12. **Grenzen und Gültigkeit offen sagen.** Jede Fassung nennt in `limits`, was sie nicht kann, und
    in `validity`, für welchen Stichtag sie gilt. Lieber eine Grenze benennen als eine Lücke
    verschweigen.
13. **Nur erfundene Beispieldaten.**

## Aufbau der Datei

### Formular (oberste Ebene)

| Schlüssel          | Pflicht | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | ja      | Kennung des Formulars, klein mit Bindestrichen (`personalfragebogen`, `lohn-meldung`)                                                                                                                                                                                                                                                                                                                                                                       |
| `version`          | ja      | `MAJOR.MINOR.PATCH`, z. B. `0.1.0`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `title`            | ja      | Titel, z. B. „Personalfragebogen: Angaben für die Lohnabrechnung“                                                                                                                                                                                                                                                                                                                                                                                           |
| `signaturePolicy`  | ja      | `electronic` (einfache elektronische Unterschrift genügt), `paperRecommended`, `paperRequired`                                                                                                                                                                                                                                                                                                                                                              |
| `signatureBasis`   | nein    | Warum die Unterschrift in der App genügt, mit Fundstellen; die Unterschriftsseite zeigt es                                                                                                                                                                                                                                                                                                                                                                  |
| `roles`            | ja      | Stationen (mindestens eine), siehe unten                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `recipient`        | ja      | `{ "label": "Lohnabrechnende Stelle" }`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `sections`         | ja      | Abschnitte mit Feldern (mindestens einer)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `infoBlocks`       | ja      | Hinweise zur Kenntnisnahme (darf leer sein)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `consistencyRules` | ja      | Gleichheitsregeln zwischen zwei Feldern (darf leer sein)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `matchKeys`        | ja      | Merkmale, über die getrennt eingegangene Teile derselben Person zugeordnet werden (darf leer sein)                                                                                                                                                                                                                                                                                                                                                          |
| `legalNotes`       | ja      | Rechtliche Hinweise als Texte (darf leer sein)                                                                                                                                                                                                                                                                                                                                                                                                              |
| `partLinks`        | nein    | Rollenpaare, deren Teile sich gegenseitig bestätigen müssen, z. B. `[["person", "arbeitgeber"]]`                                                                                                                                                                                                                                                                                                                                                            |
| `validity`         | nein    | **In Entwürfen Pflicht.** Gültigkeit der Fassung: `{ "field": "agBeschaeftigungsbeginn", "from": "2026-01-01", "until": "2026-12-31" }`. `field` ist ein Pflicht-Datums- oder -Monatsfeld ohne Bedingung (der Stichtag); liegt sein Wert außerhalb, lässt sich der Teil nicht unterschreiben und der Fragebogen nicht weitergeben. `until` fehlt bei offenem Ende. Werte, die sich jährlich ändern (Minijob-Grenze, Rechengrößen), begrenzen die Gültigkeit |
| `limits`           | nein    | **In Entwürfen Pflicht.** Was der Fragebogen nicht abdeckt, als Liste kurzer Sätze; jede Station sieht es, die PDF und die Doku zeigen es                                                                                                                                                                                                                                                                                                                   |
| `exclusions`       | nein    | Sonderfälle, für die der Fragebogen nicht gedacht ist, gleiche Form wie `checkHints` (`id`, `when`, `test`, `message`, `source`). Gilt einer, sind Abschließen und Weitergeben gesperrt. Dazu gehören Vorfragen, die zu ihnen führen (z. B. „Heimarbeit?“), möglichst als Betriebsmerkmal im Stammdaten-Link                                                                                                                                                |
| `derivations`      | nein    | Vorschläge für die lohnabrechnende Stelle (z. B. Personengruppe): `{ "id", "label", "source"?, "rules": [{ "value", "reason", "when"?, "test"?, "check"? }] }`. Die erste Regel, deren Bedingung und Test gelten, liefert Wert und Begründung; eine Regel ohne beides ist der Rest. `check: true` heißt „bitte prüfen“. Nie mitunterschrieben, die App entscheidet nicht                                                                                    |
| `checkHints`       | nein    | Prüfhinweise für die lohnabrechnende Stelle, siehe unten                                                                                                                                                                                                                                                                                                                                                                                                    |

### Rolle (`roles[]`)

| Schlüssel          | Pflicht | Bedeutung                                                                                                                                                                             |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | ja      | z. B. `person`, `arbeitgeber`, `vertretung`                                                                                                                                           |
| `label`            | ja      | Anzeigename, z. B. „Beschäftigte Person“                                                                                                                                              |
| `stationHeading`   | ja      | Überschrift in der PDF, z. B. „Fassung der beschäftigten Person“                                                                                                                      |
| `confirmationText` | ja      | Was die Rolle vor dem Abschluss bestätigt                                                                                                                                             |
| `signature`        | ja      | `required`, `optional` oder `none`; bedingte Rollen immer `required`                                                                                                                  |
| `requiredIf`       | nein    | Rolle nur unter Bedingung nötig: `{ "kind": "minorOnSigning", "birthDateField": "geburtsdatum" }` oder `{ "kind": "answer", "when": <Bedingung> }` (Felder genau einer anderen Rolle) |
| `because`          | nein    | Nur mit `requiredIf`: warum die Rolle dann gebraucht wird                                                                                                                             |
| `signerNameField`  | nein    | Pflicht-Textfeld derselben Rolle mit dem Namen der unterschreibenden Person                                                                                                           |

Arten von `requiredIf` bei Rollen: `minorOnSigning` (die Person ist laut Geburtsdatum am Tag ihrer
Unterschrift unter 18 – gesetzliche Vertretung) und `answer` (Antworten einer anderen Rolle, z. B.
Ehegatte bei Zusammenveranlagung).

### Abschnitt (`sections[]`)

`{ "id": "anschrift", "title": "Anschrift", "fields": [ … ] }` – Abschnitte sind gemeinsam; jedes Feld
nennt seine Rolle.

### Feld (`sections[].fields[]`)

| Schlüssel      | Pflicht       | Bedeutung                                                                                                                                                                                                                                                                                                         |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | ja            | Kennung, formularweit eindeutig (siehe Grundsatz 8)                                                                                                                                                                                                                                                               |
| `role`         | ja            | Rolle, die das Feld ausfüllt                                                                                                                                                                                                                                                                                      |
| `type`         | ja            | Feldtyp, siehe unten                                                                                                                                                                                                                                                                                              |
| `label`        | ja            | Kurze Bezeichnung (Zusammenfassung, PDF)                                                                                                                                                                                                                                                                          |
| `question`     | nein          | Frage im Interview; sonst wird `label` gezeigt. `{feldId}` setzt die Antwort eines früheren Felds derselben Rolle ein                                                                                                                                                                                             |
| `help`         | nein          | Hilfe zur Frage (auch mit `{feldId}`)                                                                                                                                                                                                                                                                             |
| `explainer`    | nein          | Pfad eines Erklärvideos, z. B. `personalfragebogen/steuer-id`                                                                                                                                                                                                                                                     |
| `required`     | ja            | `true` = immer Pflicht, solange verfügbar; schließt `requiredIf` aus                                                                                                                                                                                                                                              |
| `requiredIf`   | nein          | Pflicht nur, solange die Bedingung gilt (darf vorausschauen, z. B. „Telefon oder E-Mail“)                                                                                                                                                                                                                         |
| `purpose`      | ja            | Wofür die Angabe gebraucht wird, mit Fundstelle                                                                                                                                                                                                                                                                   |
| `voluntary`    | nein          | `true` = ausdrücklich freiwillige Angabe                                                                                                                                                                                                                                                                          |
| `multiline`    | nein          | Nur `text`: Zeilenumbrüche bleiben                                                                                                                                                                                                                                                                                |
| `options`      | bei Auswahl   | `[{ "id": "minijob", "label": "einen Minijob" }]` für `choice` und `multiChoice`; die `id` wird gespeichert                                                                                                                                                                                                       |
| `showIf`       | nein          | Frage erscheint nur, solange die Bedingung gilt; sonst ist sie ausgeblendet                                                                                                                                                                                                                                       |
| `because`      | bei Bedingung | Warum `showIf`, `requiredIf` oder `fromRole` gilt                                                                                                                                                                                                                                                                 |
| `fromRole`     | nein          | `{ "role": "arbeitgeber", "field": "agBesteuerung" }`: Die Antwort legt eine andere Rolle fest; liegt ihr abgeschlossener Teil vor, wird sie übernommen und nicht gefragt. Gleicher Typ; eine Auswahl enthält alle Optionen des anderen Felds (eigene wie „Weiß ich nicht.“ dürfen dazukommen); keine Vorbelegung |
| `columns`      | bei Tabelle   | Spalten eines `repeatGroup` (Felder derselben Rolle, ohne Bedingungen)                                                                                                                                                                                                                                            |
| `rowLabel`     | nein          | Nur Tabellen: Name einer Zeile, z. B. „Kind“ → „Kind 1“                                                                                                                                                                                                                                                           |
| `carryOver`    | nein          | Übernahme aus einer anderen Datei: `false` = nie (z. B. Stunden des Vormonats), `"nextMonth"` = nur `month`, einen Monat später                                                                                                                                                                                   |
| `carryRowsIf`  | nein          | Nur Tabellen: bei der Übernahme nur Zeilen, für die die Bedingung gilt (Blätter nennen Spalten)                                                                                                                                                                                                                   |
| `quickAnswers` | nein          | Knöpfe, die antworten und weiterblättern: `[{ "label": "Deutschland", "value": "Deutschland" }]`; `"value": null` lässt ein freiwilliges Feld leer                                                                                                                                                                |
| `textFormat`   | nein          | Nur `text`: `postleitzahlDe` (5 Ziffern, nicht mit 00 beginnend)                                                                                                                                                                                                                                                  |
| `unit`         | nein          | Nur `number`: Einheit, z. B. „Std.“                                                                                                                                                                                                                                                                               |
| `decimals`     | nein          | Nur `number`: 0, 1 oder 2 Nachkommastellen                                                                                                                                                                                                                                                                        |
| `signed`       | nein          | Nur `number`: negative Werte erlaubt                                                                                                                                                                                                                                                                              |
| `computed`     | nein          | Berechnetes Feld: `{ "fn": "<Funktionsname>", "args": [ … ] }` – zurzeit gibt es keine Funktionen, also nicht verwenden                                                                                                                                                                                           |
| `initial`      | nein          | Vorbelegung eines immer verfügbaren `boolean` (`true`/`false`) oder `choice` (Options-`id`)                                                                                                                                                                                                                       |
| `masterData`   | nein          | Schlüssel eines Stammdatums der eigenen Station (z. B. `betriebsnummer`), das im Lesezeichen-Link mitreist; nie Daten der Person                                                                                                                                                                                  |

### Feldtypen (`type`)

| Typ              | Eingabe und Speicherung                                   |
| ---------------- | --------------------------------------------------------- |
| `text`           | Text, Leerraum zusammengefasst                            |
| `date`           | `TT.MM.JJJJ`, gespeichert `JJJJ-MM-TT`                    |
| `month`          | `MM.JJJJ`, gespeichert `JJJJ-MM`                          |
| `choice`         | eine Option (Knöpfe, sofort weiter)                       |
| `multiChoice`    | mehrere Optionen (Kästchen, dann „Weiter“)                |
| `boolean`        | Ja/Nein (sofort weiter)                                   |
| `money`          | Euro-Betrag `1.234,56`, gespeichert `1234.56`             |
| `number`         | Zahl mit `decimals` Nachkommastellen, z. B. Stunden       |
| `iban`           | IBAN mit Prüfziffer                                       |
| `taxId`          | Steuer-Identifikationsnummer mit Prüfziffer               |
| `svNumber`       | Versicherungsnummer der Rentenversicherung mit Prüfziffer |
| `betriebsnummer` | 8 Ziffern                                                 |
| `repeatGroup`    | Tabelle mit `columns`, höchstens 30 Zeilen                |
| `file`           | vorgesehen, noch nicht nutzbar – nicht verwenden          |

### Bedingungen (`showIf`, `requiredIf`, `requiredIf.when`, `carryRowsIf`, `checkHints[].when`)

| Form                                                                    | Gilt, wenn …                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `{ "field": "kinder", "equals": true }`                                 | Ja/Nein oder Auswahl genau diesen Wert hat (`equals`)                                     |
| `{ "field": "agBeschaeftigungsart", "in": ["minijob", "kurzfristig"] }` | die Auswahl einer davon ist (`in`)                                                        |
| `{ "field": "situation", "contains": "student" }`                       | die Mehrfachauswahl diese Option enthält (`contains`)                                     |
| `{ "field": "iban", "startsWith": "DE" }`                               | der Text mit diesem Anfang beginnt (`startsWith`, nur Textfelder, IBAN in Großbuchstaben) |
| `{ "field": "email", "answered": false }`                               | das Feld leer (`false`) oder beantwortet (`true`) ist (`answered`)                        |
| `{ "not": … }`, `{ "all": [ … ] }`, `{ "any": [ … ] }`                  | Verneinung, alle, mindestens eine                                                         |

Ein ausgeblendetes Feld zählt als unbeantwortet. Bedingungen in Feldern sehen nur Felder derselben
Rolle; über Rollen hinweg gibt es `fromRole` (Antwort übernehmen), Rollen mit
`requiredIf: { "kind": "answer" }` und Prüfhinweise.

### Hinweis zur Kenntnisnahme (`infoBlocks[]`)

`{ "id", "role", "title", "text", "asOf": "JJJJ-MM-TT", "acknowledgement", "explainer"? }` –
`acknowledgement` ist `read` (in der App gelesen und bestätigt) oder `paperHandout` (auf Papier
ausgehändigt, im Fragebogen bestätigt). Der Text geht mit Stand und Hash ins Siegel.

### Prüfregel, Zuordnung, Prüfhinweis

- `consistencyRules[]`: `{ "kind": "equal", "fields": ["familienname", "agFamilienname"], "message": "…" }`
  – meldet Widersprüche zwischen zwei Feldern (Text ohne Groß/klein).
- `matchKeys[]`: `{ "label": "Name", "fields": { "person": "familienname", "arbeitgeber": "agFamilienname" } }`.
- `checkHints[]`: `{ "id", "when"?, "test"?, "message", "source"? }` – Hinweis für die lohnabrechnende
  Stelle, darf Felder verschiedener Rollen verbinden, blockiert nie. `test` ist eine benannte Prüfung
  mit festen Feldtypen: `regelaltersgrenzeErreicht`, `regelaltersgrenzeNichtErreicht`,
  `regelaltersgrenzeInnerhalbEinesJahres` (Geburtsdatum, Stichtag); `spaeterAls` (Datum, Datum: das
  erste liegt nach dem zweiten); `kuerzerAlsEineWoche` (Datum, Datum: vom ersten bis zum zweiten
  weniger als sieben Tage); `hoechstensGeringfuegigkeitsgrenze` (Betrag, Datum: Monatsentgelt bis
  zur Minijob-Grenze des Jahres); `hoechstensGeringverdienergrenze` (Betrag: bis 325 €, bei einer
  Tabellenspalte die erste Zeile); `ueberBeitragsbemessungsgrenze` und
  `ueberJahresarbeitsentgeltgrenze` (Betrag, Betrag, Datum: eigenes Monatsentgelt, Entgelte
  weiterer Beschäftigungen – darf eine Tabellenspalte sein, sie wird summiert – und der Stichtag,
  dessen Jahr die Rechengrößen bestimmt).

## Regeln, die die App zusätzlich prüft

- Kennungen eindeutig (Felder formularweit, Spalten eingeschlossen); Optionen nur bei Auswahlfeldern.
- `showIf` nur auf frühere Felder derselben Rolle, ohne Kreise; `requiredIf` derselben Rolle, nicht auf sich selbst.
- Jede Rolle hat Felder oder eine Unterschrift; bedingte Rollen unterschreiben.
- `initial` nur auf immer verfügbaren Ja/Nein- oder Auswahlfeldern; nicht zusammen mit `fromRole`.
- `quickAnswers` nur auf Eingabefeldern, jeder Wert eine gültige Antwort, `null` nur bei freiwilligen.
- `{feldId}` in Fragen und Hilfen nur für frühere Felder derselben Rolle.
- `masterData` je Formular eindeutig, nur einzelne Werte.
- `because` nur bei Feldern mit Bedingung oder `fromRole` und bei bedingten Rollen.

## Beispiel

Eine kleine, gültige Definition (Adressänderung), die die wichtigsten Bausteine zeigt:

```json
{
  "id": "adressaenderung",
  "version": "0.1.0",
  "title": "Adressänderung",
  "signaturePolicy": "electronic",
  "signatureBasis": "Für die Mitteilung einer neuen Anschrift schreibt das Gesetz keine Form vor; eine einfache elektronische Signatur genügt (Art. 3 Nr. 10 eIDAS-Verordnung).",
  "roles": [
    {
      "id": "person",
      "label": "Beschäftigte Person",
      "stationHeading": "Fassung der beschäftigten Person",
      "confirmationText": "Ich versichere, dass meine Angaben richtig sind.",
      "signature": "required"
    },
    {
      "id": "arbeitgeber",
      "label": "Arbeitgeber",
      "stationHeading": "Fassung des Arbeitgebers",
      "confirmationText": "Ich bestätige die Angaben des Arbeitgebers.",
      "signature": "optional"
    }
  ],
  "recipient": { "label": "Lohnabrechnende Stelle" },
  "sections": [
    {
      "id": "anschrift",
      "title": "Neue Anschrift",
      "fields": [
        {
          "id": "anschriftAusland",
          "role": "person",
          "type": "boolean",
          "label": "Liegt die neue Anschrift im Ausland?",
          "required": true,
          "initial": false,
          "purpose": "Stammdaten für die Lohnabrechnung"
        },
        {
          "id": "wohnstaat",
          "role": "person",
          "type": "text",
          "label": "Staat",
          "required": true,
          "showIf": { "field": "anschriftAusland", "equals": true },
          "because": "Nur eine Anschrift im Ausland braucht den Staat.",
          "purpose": "Stammdaten für die Lohnabrechnung"
        },
        {
          "id": "strasse",
          "role": "person",
          "type": "text",
          "label": "Straße und Hausnummer",
          "required": true,
          "purpose": "Stammdaten für die Lohnabrechnung"
        },
        {
          "id": "postleitzahl",
          "role": "person",
          "type": "text",
          "textFormat": "postleitzahlDe",
          "label": "Postleitzahl",
          "required": true,
          "showIf": { "field": "anschriftAusland", "equals": false },
          "because": "Eine deutsche Postleitzahl hat 5 Ziffern und wird darauf geprüft.",
          "purpose": "Stammdaten für die Lohnabrechnung"
        },
        {
          "id": "wohnort",
          "role": "person",
          "type": "text",
          "label": "Wohnort",
          "required": true,
          "purpose": "Stammdaten für die Lohnabrechnung"
        },
        {
          "id": "gueltigAb",
          "role": "person",
          "type": "date",
          "label": "Gilt ab",
          "question": "Ab wann gilt die neue Anschrift?",
          "required": true,
          "purpose": "Stichtag der Änderung in der Lohnabrechnung"
        }
      ]
    },
    {
      "id": "arbeitgeber",
      "title": "Angaben des Arbeitgebers",
      "fields": [
        {
          "id": "agPersonalnummer",
          "role": "arbeitgeber",
          "type": "text",
          "label": "Personalnummer",
          "required": false,
          "purpose": "Zuordnung in der Lohnabrechnung"
        }
      ]
    }
  ],
  "infoBlocks": [],
  "consistencyRules": [],
  "matchKeys": [],
  "legalNotes": ["Die Angaben werden für die Lohnabrechnung verwendet."],
  "partLinks": [["person", "arbeitgeber"]],
  "validity": { "field": "gueltigAb", "from": "2026-01-01" },
  "limits": [
    "Der Fragebogen meldet die neue Anschrift nicht selbst an Behörden oder Versicherungen."
  ]
}
```

## Prüfen

- Im Repository: die Datei nach `form-drafts/<id>/<version>.json` legen, `npm test` (Format, Regeln,
  Begründungen, Feldkennungen) und `npm run catalogue` (Feldkatalog in `docs/formulare/`,
  Ablaufplan in `docs/ablaufplan.html`). Den Ablaufplan lesen: Stimmen Reihenfolge, Weichen und
  „Warum“?
- Später im Formular-Editor: Datei öffnen; er prüft mit denselben Regeln und zeigt die Vorschau.

## Checkliste vor der Abgabe

- [ ] Jede Frage hat einen `purpose`; jede Bedingung ein `because`.
- [ ] Keine unzulässige Frage (Grundsatz 4), nichts, was die ELStAM liefern.
- [ ] Weichen stehen vor den Fragen, die von ihnen abhängen; `showIf` schaut nur zurück.
- [ ] Felder des Arbeitgebers beim Arbeitgeber, Lebensumstände bei der Person.
- [ ] Bestehende Feldkennungen unverändert in Typ, Rolle und Bedeutung; neue Version gesetzt.
- [ ] Schriftform-Erklärungen auf Papier; Hinweise mit Stand (`asOf`).
- [ ] Unsichere Fundstellen als „nicht verifiziert“ gemeldet.
- [ ] `validity` und `limits` gesetzt und ehrlich.
