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

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ und füllen beide Teile aus; danach die Kanzlei-Station.

**Voraussetzungen:** Personalfragebogen, beide Teile (Person und Arbeitgeber) ausgefüllt und
abgeschlossen; Station „Kanzlei“.

**Schritte:**

1. Person: „Was haben Sie mit Ihrem Arbeitgeber vereinbart?“ → „eine Ausbildung oder ein duales
   Studium“.
2. Arbeitgeber: „Wie wird die Person bezahlt?“ → „Ausbildungsvergütung“, 1. Ausbildungsjahr
   550,00 €; Art der Beschäftigung „Ausbildung“; „Findet die Ausbildung in einer außerbetrieblichen
   Einrichtung statt?“ → Nein.
3. Beide PDFs in der Kanzlei einlesen.

**Erwartet:**

- Unter „Vorschläge (die App entscheidet nicht – bitte prüfen)“ steht die Personengruppe **102**.
- Es erscheint **kein** Hinweis, dass es sich um einen Minijob handeln könnte.
- Gegenprobe mit 300,00 €: Vorschlag **121** (Geringverdienergrenze 325 €).

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

**Voraussetzungen:** Personalfragebogen oder Sofortmeldung 0.2.0 (Entwurf), Rolle „Person“.

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

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ und füllen beide Teile aus; danach die Kanzlei-Station.

**Voraussetzungen:** Personalfragebogen mit beiden Teilen, Station „Kanzlei“.

**Schritte:**

1. Person: gesetzlich versichert, Abitur, Bachelor.
2. Arbeitgeber: festes Monatsentgelt 1.500,00 €, „sozialversicherungspflichtig“, unbefristet,
   Teilzeit, keine Arbeitnehmerüberlassung, Berufskennziffer 71402.
3. Beide Teile in der Kanzlei einlesen; die Vorschläge ansehen.
4. Gegenprobe: die Berufskennziffer leer lassen.

**Erwartet:**

- Vorschläge: Personengruppe 101, Beitragsgruppen 1111, Kennzeichen Übergangsbereich 1,
  Tätigkeitsschlüssel 714024412.
- Zu jedem Vorschlag steht die Begründung, bei den Beitragsgruppen für KV, RV, AV und PV einzeln.
- Schritt 4: Tätigkeitsschlüssel „?????4412“ mit „bitte prüfen“.
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

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen, Rolle „Arbeitgeber“; Beschäftigungsbeginn 01.06.2026, festes
Monatsentgelt 1.500,00 €. Die Person füllt danach ihren Teil aus (Status „Arbeitnehmerin oder
Arbeitnehmer“, keine früheren Beschäftigungen im Kalenderjahr).

**Schritte:**

1. Als Art der Beschäftigung „kurzfristige Aushilfe (höchstens 3 Monate oder 70 Arbeitstage)“ wählen,
   „Ende der Aushilfe“ `31.08.2026` und „Arbeitstage der Aushilfe“ `78` eingeben, bis zur Kanzlei gehen
   und die Vorschläge ansehen.
2. „Ende der Aushilfe“ auf `01.09.2026` und die Arbeitstage auf `79` ändern.
3. Das Monatsentgelt auf 500,00 € ändern.

**Erwartet:**

- Schritt 1: Personengruppe 110, Beitragsgruppen 0000 – genau drei Monate sind noch kurzfristig.
- Schritt 2: Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111; die Begründung nennt die
  Zeitgrenze („Von vornherein länger als drei Monate … und mehr als 70 Arbeitstage“).
- Schritt 3: Personengruppe 109 mit „bitte prüfen“, Beitragsgruppen 6100 – die Beschäftigung ist dann
  ein Minijob.
- _Nicht offensichtlich:_ Über drei Monate mit höchstens 70 Arbeitstagen (z. B. 30.09. mit 70 Tagen)
  bleibt es eine kurzfristige Beschäftigung (110) – beide Grenzen sind gleichwertig.

---

## MT-97: Werkstudent – Wochenstunden in der Vorlesungszeit

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen, Rolle „Arbeitgeber“; Beschäftigungsbeginn 01.04.2026, festes
Monatsentgelt 1.200,00 €, Art der Beschäftigung „Werkstudent“. Die Person füllt danach als Studentin
ihren Teil aus.

**Schritte:**

1. Bei „Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?“ „Nein“ wählen.
2. Bei „Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?“ `20` eingeben, weiter bis
   zur Kanzlei gehen und die Vorschläge ansehen.
3. Die Stunden auf `25` ändern; bei der nun folgenden Frage „Liegen die Stunden über 20 hinaus am
   Wochenende, abends oder nachts?“ „Nein“ wählen.
4. Das Monatsentgelt auf 600,00 € und die Stunden auf `12` ändern.

**Erwartet:**

- Schritt 2: Personengruppe 106, Beitragsgruppen 0100, ohne „bitte prüfen“. _Nicht offensichtlich:_ Die
  Frage nach Wochenende, Abend oder Nacht erscheint bei 20 Stunden **nicht** – erst darüber.
- Schritt 3: Personengruppe 101, Beitragsgruppen 1111; die Begründung nennt „mehr als 20 Wochenstunden“.
- Schritt 4: Personengruppe 109, Beitragsgruppen 6100 – ein Minijob geht der Werkstudentenregel vor.
- _Nicht offensichtlich:_ Bei „nur in der vorlesungsfreien Zeit: Ja“ fragt der Bogen keine Stunden; dann
  bleibt es bei 106 unabhängig von der Stundenzahl.

## MT-98: Langzeitstudium und Versorgungswerk beim Werkstudenten

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen, Rolle „Arbeitgeber“; Beschäftigungsbeginn 01.04.2026, festes
Monatsentgelt 1.000,00 €, Art der Beschäftigung „Werkstudent“, nicht nur in den Semesterferien,
15 Wochenstunden in der Vorlesungszeit. Die Person füllt danach als Studentin ihren Teil aus
(Vollzeitstudium, gesetzlich versichert, kein Versorgungswerk).

**Schritte:**

1. Als Person bei „Fachsemester“ `4` eingeben, weiter bis zur Kanzlei gehen und die Vorschläge ansehen.
2. Das Fachsemester auf `27` ändern.
3. Zurück auf `4`; bei „Sind Sie Pflichtmitglied eines berufsständischen Versorgungswerks …?“
   „Ja, die Befreiung für diese Beschäftigung ist beantragt oder erteilt“ wählen.

**Erwartet:**

- Schritt 1: Personengruppe 106, Beitragsgruppen 0100.
- Schritt 2: Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111. Die Begründung nennt „mehr als
  25 Fachsemester“. _Nicht offensichtlich:_ Das ist nur eine Vermutung; weist die Person nach, dass das
  Studium im Vordergrund steht, gilt wieder 106.
- Schritt 3: Personengruppe 190, Beitragsgruppen 0000, Übergangsbereich 0 – die Person ist nur noch in
  der Unfallversicherung versichert.
