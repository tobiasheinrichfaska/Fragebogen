# 07 – Sozialversicherungs-Beurteilung (Personalfragebogen)

Diese Tests prüfen, dass der Personalfragebogen die Angaben für die SV-Beurteilung in sinnvoller
Reihenfolge erfragt und die Vorschläge und Prüfhinweise passen. Alle Fälle sind zusätzlich als
automatische Tests abgesichert (`tests/forms/svSzenarien.test.ts`). Die Handtests prüfen, was nur am
Bildschirm sichtbar ist.

**Umgebung:** Fassung mit den Entwürfen (im Testbereich schon geladen; lokal `npm run build:preview`,
`dist-preview/index.html`), fiktive Daten, Beschäftigungsbeginn im Jahr 2026.

---

## MT-60: Verdienst vor der Art der Beschäftigung

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Neuer Personalfragebogen, Rolle „Arbeitgeber“.

**Schritte:**

1. Die Angaben zum Arbeitgeber und die Vorfragen („Heimarbeit“, „Besonderer Personenkreis“ …)
   beantworten.
2. Auf die nächsten Fragen achten.

**Erwartet:**

- Direkt nach den Vorfragen kommt „Wie wird die Person bezahlt?“, danach Betrag bzw. erwarteter
  Monatsverdienst und die Einmalzahlungen. Erst danach folgt „Wie ist die Beschäftigung
  vorgesehen?“.
- _Nicht offensichtlich:_ Die Hilfe zu „Wie ist die Beschäftigung vorgesehen?“ nennt die
  Minijob-Grenze (603 € im Monat, 7.236 € im Jahr einschließlich zugesagter Einmalzahlungen).
- Bei „Wie wird die Person bezahlt?“ gibt es die Antwort „kein Arbeitsentgelt (nur
  Vorruhestandsgeld)“.

---

## MT-61: Azubi mit 550 € ist kein Minijob

**Einstieg:** [Auszubildende vorbereitet öffnen](start:personalfragebogen-azubi-entgelt-offen) – die
Person (Ausbildung) hat abgeschlossen; der Arbeitgeber ist bis „Wie wird die Person bezahlt?“
ausgefüllt.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Wie wird die Person bezahlt?“ → „Ausbildungsvergütung“; 1. Ausbildungsjahr 550,00 €, gültig ab
   01.09.2026. „Wie ist die Beschäftigung vorgesehen?“ → „Ausbildung“; Beruf beliebig, Ende
   31.08.2029; „Findet die Ausbildung in einer außerbetrieblichen Einrichtung statt?“ → Nein.
2. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“
   einlesen; die Vorschläge ansehen.
3. Für die Gegenprobe den Startlink erneut öffnen und 300,00 € eingeben.

**Erwartet:**

- Unter „Vorschläge (die App entscheidet nicht – bitte prüfen)“ steht die Personengruppe **102**.
- Es erscheint **kein** Hinweis, dass es sich um einen Minijob handeln könnte.
- Schritt 3 (Gegenprobe mit 300,00 €): Vorschlag **121** (Geringverdienergrenze 325 €).

---

## MT-62: Minijob mit Weihnachtsgeld über der Jahresgrenze

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Arbeitgeber: festes Monatsentgelt 600,00 €; Einmalzahlung „Weihnachtsgeld“ 300,00 €, November,
   „Rechtsanspruch?“ Ja; Art der Beschäftigung „Minijob“.
2. Bis zur Zusammenfassung gehen; danach in der Kanzlei einlesen.

**Erwartet:**

- Prüfhinweis: „Als Minijob vorgesehen, aber der Verdienst übersteigt die Geringfügigkeitsgrenze im
  Jahr …“. Die Fakten nennen 12 × 600,00 € + 300,00 € = 7.500,00 € gegenüber 7.236,00 €.
- Vorschlag Personengruppe **101**, mit „bitte prüfen“.
- Gegenprobe mit „Rechtsanspruch?“ Nein: kein Hinweis, Vorschlag **109**.

---

## MT-63: Besonderer Personenkreis sperrt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Arbeitgeber: bei „Gehört die Person bei Ihnen zu einem dieser Personenkreise?“ „Mitglied des
   Vorstands einer Aktiengesellschaft“ wählen.
2. Weiter bis zur Zusammenfassung; „Weiter zum Abschluss“ versuchen.

**Erwartet:**

- Auf jedem Schritt steht der gelbe Hinweis „Für diesen Sonderfall ist der Fragebogen nicht
  gedacht …“ mit dem Vorstand der Aktiengesellschaft.
- Abschließen und Weitergeben sind gesperrt. Gleiches gilt für „Geistliche(r) …“, die
  beamtenrechtliche Absicherung und die Betriebsart „knappschaftlicher Betrieb (Bergbau)“.

---

## MT-64: Privat Versicherte – Befreiung und Stichtag 31.12.2002

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Voraussetzungen:** Rolle „Person“.

**Schritte:**

1. Bei „Wie sind Sie krankenversichert?“ „privat“ wählen.
2. Die folgenden Fragen ansehen; bei „Hat eine gesetzliche Krankenkasse Sie früher auf Antrag von
   der Versicherungspflicht befreit?“ „Ja“ wählen.

**Erwartet:**

- Es kommen die Fragen nach der Befreiung (mit Grund und Datum) und „Waren Sie am 31. Dezember 2002
  privat krankenversichert …?“. Die Hilfe nennt 69.750 € statt 77.400 €.
- Bei „gesetzlich“ erscheint keine dieser Fragen.
- _Nicht offensichtlich:_ Ohne angekreuzten „Befreiungsbescheid der Krankenkasse“ beim Arbeitgeber
  zeigt die Kanzlei den Hinweis, den Bescheid anzufordern.

---

## MT-65: Auswahl aus den amtlichen Listen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ (oder „Personalfragebogen: Angaben für die Sofortmeldung“) als „Beschäftigte Person“.

**Voraussetzungen:** Personalfragebogen oder Sofortmeldung ab 0.2.0, Rolle „Person“.

**Schritte:**

1. Bei der deutschen Staatsangehörigkeit „Nein“, dann bei der Staatsangehörigkeit „pol“ tippen.
2. Aus den Vorschlägen „polnisch“ wählen, „Weiter“.
3. Bei „Titel, Vorsatzwort oder Namenszusatz“ „Ja“ wählen; als Vorsatzwort „zum Kuckuck“ eingeben
   und „Weiter“ drücken.
4. Stattdessen „van der“ eingeben.
5. Die Anschrift ansehen.

**Erwartet:**

- Schritt 1: Unter dem Feld erscheinen Vorschläge aus der Liste.
- Schritt 2: In der Zusammenfassung steht „polnisch“. _Nicht offensichtlich:_ Der amtliche Schlüssel
  folgt aus der Liste; ein frei eingetippter Wert wird gespeichert, aber gelb markiert (MT-26).
- Schritt 3: Die Meldung „Diese Angabe steht nicht in der amtlichen Liste …“ erscheint; die Hilfe
  sagt, dass ein nicht aufgeführtes Vorsatzwort zum Familiennamen gehört.
- Schritt 4 wird angenommen.
- Schritt 5: Straße und Hausnummer sind zwei Fragen; „Keine Hausnummer“ ist möglich.

---

## MT-66: Beitragsgruppen, Übergangsbereich und Tätigkeitsschlüssel in der Kanzlei

**Einstieg:** [Teilzeitstelle vorbereitet öffnen](start:personalfragebogen-teilzeit-berufskennziffer-offen)
– die Person (gesetzlich versichert, Abitur, Bachelor) hat abgeschlossen; der Arbeitgeber hat festes
Monatsentgelt 1.500,00 €, „sozialversicherungspflichtig“, unbefristet, Teilzeit, keine
Arbeitnehmerüberlassung; Sie stehen bei der Berufskennziffer.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Kennen Sie die fünfstellige Berufskennziffer?“ → `71402`.
2. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“
   einlesen; die Vorschläge ansehen.
3. Für die Gegenprobe den Startlink erneut öffnen und die Berufskennziffer leer lassen.

**Erwartet:**

- Vorschläge: Personengruppe 101, Beitragsgruppen 1111, Kennzeichen Übergangsbereich 1,
  Tätigkeitsschlüssel 714024412.
- Zu jedem Vorschlag steht die Begründung, bei den Beitragsgruppen für KV, RV, AV und PV einzeln.
- Schritt 3: Tätigkeitsschlüssel „?????4412“ mit „bitte prüfen“.
- _Nicht offensichtlich:_ Die App entscheidet nichts. Die Vorschläge stehen auch auf dem Prüfblatt der PDF,
  werden aber nie mitunterschrieben.

---

## MT-67: Firmenzahler beim Arbeitgeber

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen, Rolle „Arbeitgeber“; die Person ist gesetzlich versichert.

**Schritte:**

1. Festes Monatsentgelt 7.000,00 € eingeben.
2. Bei „Liegt der Verdienst voraussichtlich über der Jahresarbeitsentgeltgrenze?“ zunächst „Nein“
   lassen und bis zur Kanzlei durchgehen.
3. Die Antwort auf „Ja“ ändern und bei der folgenden Frage „Nein, die Person zahlt selbst
   (Selbstzahler)“ wählen.

**Erwartet:**

- Schritt 2: Prüfhinweis, dass der Verdienst laut Angaben über der Grenze liegt;
  Beitragsgruppen 9111 mit „bitte prüfen“.
- Schritt 3: Die Frage nach Firmen- oder Selbstzahler erscheint erst nach dem „Ja“; danach
  Beitragsgruppen 0111 ohne „bitte prüfen“.
- _Nicht offensichtlich:_ Die Vorbelegung „Nein“ ist absichtlich. Ein vergessenes „Ja“ fällt
  über den Prüfhinweis auf.

---

## MT-96: Aushilfe über drei Monate und 70 Arbeitstage

**Einstieg:** [Aushilfe vorbereitet öffnen](start:personalfragebogen-aushilfe-art-offen) – die Person
(Arbeitnehmerin, keine früheren Beschäftigungen im Jahr) hat abgeschlossen; der Arbeitgeber hat Beginn
01.06.2026, festes Monatsentgelt 1.500,00 € und befristet bis 31.08.2026; Sie stehen bei der Art der
Beschäftigung.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Wie ist die Beschäftigung vorgesehen?“ → „kurzfristige Aushilfe (höchstens 3 Monate oder 70
   Arbeitstage)“; „Bis wann ist die Aushilfe befristet?“ `31.08.2026`; Arbeitstage `78`;
   Rahmenvereinbarung „Nein“; Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
2. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“
   einlesen; die Vorschläge ansehen.
3. Für die Gegenprobe den Startlink erneut öffnen und als Ende `01.09.2026` mit `79` Arbeitstagen eingeben.
4. Wie Schritt 3, zusätzlich mit **„Zurück“** zum Monatsentgelt und 500,00 € eingeben.

**Erwartet:**

- Schritt 2: Personengruppe 110, Beitragsgruppen 0000 – genau drei Monate sind noch kurzfristig.
- Schritt 3: Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111; die Begründung nennt die
  Zeitgrenze („Von vornherein länger als drei Monate … und mehr als 70 Arbeitstage“).
- Schritt 4: Personengruppe 109 mit „bitte prüfen“, Beitragsgruppen 6100 – die Beschäftigung ist dann
  ein Minijob.
- _Nicht offensichtlich:_ Über drei Monate mit höchstens 70 Arbeitstagen (z. B. 30.09. mit 70 Tagen)
  bleibt es eine kurzfristige Beschäftigung (110) – beide Grenzen sind gleichwertig.

---

## MT-97: Werkstudent – Wochenstunden in der Vorlesungszeit

**Einstieg:** [Werkstudentin vorbereitet öffnen](start:personalfragebogen-werkstudent-stunden-offen) – die
Studentin (Vollzeitstudium, 3. Fachsemester) hat abgeschlossen; der Arbeitgeber hat Beginn 01.04.2026,
festes Monatsentgelt 1.200,00 € und „Werkstudent“.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?“ → „Nein“.
2. „Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?“ → `20`. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“
   einlesen; die Vorschläge ansehen.
3. Für die Gegenprobe den Startlink erneut öffnen und `25` Stunden eingeben; bei der nun folgenden Frage „Liegen die Stunden über 20 hinaus am
   Wochenende, abends oder nachts?“ „Nein“ wählen.
4. Für die Gegenprobe den Startlink erneut öffnen und `12` Stunden eingeben, dann mit **„Zurück“** zum Monatsentgelt und 600,00 € eingeben.

**Erwartet:**

- Schritt 2: Personengruppe 106, Beitragsgruppen 0100, ohne „bitte prüfen“. _Nicht offensichtlich:_ Die
  Frage nach Wochenende, Abend oder Nacht erscheint bei 20 Stunden **nicht** – erst darüber.
- Schritt 3: Personengruppe 101, Beitragsgruppen 1111; die Begründung nennt „mehr als 20 Wochenstunden“.
- Schritt 4: Personengruppe 109, Beitragsgruppen 6100 – ein Minijob geht der Werkstudentenregel vor.
- _Nicht offensichtlich:_ Bei „nur in der vorlesungsfreien Zeit: Ja“ fragt der Bogen keine Stunden; dann
  bleibt es bei 106 unabhängig von der Stundenzahl.

## MT-98: Langzeitstudium und Versorgungswerk beim Werkstudenten

**Einstieg:** [Studentin ab dem Fachsemester öffnen](start:personalfragebogen-werkstudent-fachsemester-offen) –
der Arbeitgeber hat abgeschlossen (Beginn 01.04.2026, 1.000,00 €, „Werkstudent“, nicht nur in den
Semesterferien, 15 Wochenstunden); die Studentin (Vollzeitstudium, gesetzlich versichert, kein
Versorgungswerk) steht beim Fachsemester.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Im wievielten Fachsemester studieren Sie?“ → `4`. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, unterschreiben,
   **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen;
   die Vorschläge ansehen.
2. Für die Gegenprobe den Startlink erneut öffnen und das Fachsemester `27` eingeben.
3. Für die Gegenprobe den Startlink erneut öffnen und `4` eingeben; bei „Sind Sie Pflichtmitglied eines berufsständischen Versorgungswerks …?“
   „Ja, die Befreiung für diese Beschäftigung ist beantragt oder erteilt“ wählen und einen Namen
   eintragen.

**Erwartet:**

- Schritt 1: Personengruppe 106, Beitragsgruppen 0100.
- Schritt 2: Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111. Die Begründung nennt „mehr als
  25 Fachsemester“. _Nicht offensichtlich:_ Das ist nur eine Vermutung; weist die Person nach, dass das
  Studium im Vordergrund steht, gilt wieder 106.
- Schritt 3: Personengruppe 190, Beitragsgruppen 0000, Übergangsbereich 0 – die Person ist nur noch in
  der Unfallversicherung versichert.

## MT-102: Studentin mit zwei Minijobs, die zusammen über der Grenze liegen

**Einstieg:** [Zwei Minijobs vorbereitet öffnen](start:personalfragebogen-zwei-minijobs-arbeitszeit-offen)
– die Studentin (Vollzeitstudium, 3. Fachsemester, gesetzlich versichert, „einen Minijob“) hat
abgeschlossen und eine weitere Beschäftigung angegeben: Minijob seit 01.01.2024, 500,00 €, 7 Stunden
pro Woche. Der Arbeitgeber hat Beginn 01.09.2026, festes Monatsentgelt 400,00 €, „Minijob (bis 603 €
im Monat)“, nicht befristet; Sie stehen bei der Arbeitszeit.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Wie ist die Arbeitszeit vereinbart?“ → „feste Wochenstunden, die Tage wechseln (Dienstplan)“;
   „Wie viele Stunden arbeitet die Person pro Woche (Sollzeit)?“ `5`; Tage pro Woche `2`.
   Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“
   einlesen; die Vorschläge ansehen.
2. Für die Gegenprobe den Startlink erneut öffnen und `15` Wochenstunden eingeben.
3. Für die Gegenprobe den Startlink erneut öffnen, wie in Schritt 1 `5` Stunden eingeben und
   abschließen. Dann in der Übersicht bei der Person **„Neue Fassung beginnen“**, „Wie studieren
   Sie?“ → „Teilzeitstudium“, unterschreiben, PDF erstellen und in der Kanzlei einlesen.

**Erwartet:**

- Schritt 1: Personengruppe 106, Beitragsgruppen 0100 und Übergangsbereich 1, alle mit „bitte prüfen“.
  Die Erläuterung zum Vorschlag nennt 5 + 7 = 12 Wochenstunden. _Nicht offensichtlich:_ Beide Jobs liegen für sich unter
  603 €, zusammen aber bei 900 € – dann ist keiner ein Minijob mehr, und für Studierende gilt die
  Werkstudentenregel (nur RV-pflichtig), obwohl der Arbeitgeber „Minijob“ gewählt hat.
- Schritt 2: 15 + 7 = 22 Stunden – Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111.
- Schritt 3: Personengruppe 101 mit „bitte prüfen“ – beim Teilzeitstudium schlägt die App die
  Werkstudentenregel hier nicht vor.
- _Nicht offensichtlich:_ Ohne Angabe der Arbeitszeit (z. B. bei Schichtarbeit) bleibt es bei 101 mit
  „bitte prüfen“; die App rät dann nicht.

## MT-103: Hausfrau – frühere Vollzeitstelle zählt nicht für die Berufsmäßigkeit

**Einstieg:** [Hausfrau ab früheren Beschäftigungen öffnen](start:personalfragebogen-hausfrau-vorbeschaeftigung-offen)
– der Arbeitgeber hat abgeschlossen (Beginn 01.08.2026, 1.000,00 €, „kurzfristige Aushilfe“ bis
15.09.2026 an 33 Arbeitstagen, befristet bis 15.09.2026); die Person („Haushaltsführung oder
Familienarbeit“, gesetzlich versichert, „eine Aushilfe …“) steht bei den früheren Beschäftigungen.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Haben Sie in diesem Kalenderjahr schon anderswo gearbeitet …?“ → „Ja“ und eine Zeile eintragen:
   von 01.01.2026 bis 31.03.2026, Art „mehr als geringfügig“, Verdienst 3.000,00 €.
2. Die folgende Frage „Seit wann sind Sie nicht mehr berufstätig?“ leer lassen. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, unterschreiben,
   **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen;
   die Vorschläge ansehen.
3. Für die Gegenprobe den Startlink erneut öffnen und Schritt 1 wiederholen, die Frage dann mit `01.04.2026` beantworten.

**Erwartet:**

- Die Frage „Seit wann sind Sie nicht mehr berufstätig?“ erscheint erst nach Schritt 1 – nur bei
  „Haushaltsführung oder Familienarbeit“ und früheren Beschäftigungen im Jahr.
- Schritt 2: Personengruppe 101 und Beitragsgruppen 3111, beide mit „bitte prüfen“ – die Stelle bis 31.03. zählt für
  die Berufsmäßigkeit mit.
- Schritt 3: Personengruppe 110, Beitragsgruppen 0000. _Nicht offensichtlich:_ Die Begründung nennt, dass
  Beschäftigungen vor dem Ausscheiden aus dem Berufsleben am 01.04.2026 nicht zählen
  (Geringfügigkeits-Richtlinien B 2.3.3.3).
