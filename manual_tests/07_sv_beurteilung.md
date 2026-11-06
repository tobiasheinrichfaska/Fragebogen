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
   - **Danach:** Direkt nach den Vorfragen kommt „Wie wird die Person bezahlt?“. Dort gibt es die
     Antwort „kein Arbeitsentgelt (nur Vorruhestandsgeld)“.
2. Bei „Wie wird die Person bezahlt?“ „festes Monatsentgelt“ wählen und **„Weiter“** klicken.
   - **Danach:** Es kommt der Betrag („Wie hoch ist das Monatsentgelt brutto?“), noch nicht die Art
     der Beschäftigung. Bei „Stundenlohn“ käme nach dem Betrag der erwartete Monatsverdienst.
3. Als Monatsentgelt `1.500,00` € eingeben und **„Weiter“** klicken.
   - **Danach:** Es kommen die Einmalzahlungen („Welche Einmalzahlungen sind vereinbart?“).
4. Die Einmalzahlungen leer lassen und mit **„Weiter“** weitergehen, bis „Wie ist die Beschäftigung
   vorgesehen?“ erscheint.
   - **Danach:** Erst nach Betrag und Einmalzahlungen folgt „Wie ist die Beschäftigung vorgesehen?“.
5. Die Hilfe zu „Wie ist die Beschäftigung vorgesehen?“ ansehen.
   - **Danach:** _Nicht offensichtlich:_ Die Hilfe nennt die Minijob-Grenze (603 € im Monat,
     7.236 € im Jahr einschließlich zugesagter Einmalzahlungen).

---

## MT-61: Azubi mit 550 € ist kein Minijob

**Einstieg:** [Auszubildende vorbereitet öffnen](start:personalfragebogen-azubi-entgelt-offen) – die
Person (Ausbildung) hat abgeschlossen; der Arbeitgeber ist bis „Wie wird die Person bezahlt?“
ausgefüllt.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Wie wird die Person bezahlt?“ → „Ausbildungsvergütung“; eine Zeile: Ausbildungsjahr `1`,
   Vergütung `550,00` €, gültig ab `01.09.2026`.
2. „Wie ist die Beschäftigung vorgesehen?“ → „Ausbildung“; Beruf beliebig, Ende `31.08.2029`;
   „Findet die Ausbildung in einer außerbetrieblichen Einrichtung statt?“ → „Nein“.
3. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen und **„PDF erstellen“**.
4. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Unter „Vorschläge (die App entscheidet nicht – bitte prüfen)“ steht die
     Personengruppe **102**. Es erscheint **kein** Hinweis, dass es sich um einen Minijob handeln
     könnte.
5. Für die Gegenprobe noch einmal
   [Auszubildende vorbereitet öffnen](start:personalfragebogen-azubi-entgelt-offen) klicken.
6. „Wie wird die Person bezahlt?“ → „Ausbildungsvergütung“; eine Zeile: Ausbildungsjahr `1`,
   Vergütung diesmal `300,00` €, gültig ab `01.09.2026`.
7. „Wie ist die Beschäftigung vorgesehen?“ → „Ausbildung“; Beruf beliebig, Ende `31.08.2029`;
   „Findet die Ausbildung in einer außerbetrieblichen Einrichtung statt?“ → „Nein“.
8. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
9. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Vorschlag **121** (Geringverdienergrenze 325 €).

---

## MT-62: Minijob mit Weihnachtsgeld über der Jahresgrenze

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Arbeitgeber: bei „Wie wird die Person bezahlt?“ „festes Monatsentgelt“ wählen, Monatsentgelt
   `600,00` €.
2. Bei „Welche Einmalzahlungen sind vereinbart?“ eine Zeile: „Weihnachtsgeld“, `300,00` €,
   „November“, „Rechtsanspruch?“ „Ja“.
3. „Wie ist die Beschäftigung vorgesehen?“ → „Minijob (bis 603 € im Monat)“.
4. Bis zur Zusammenfassung gehen, abschließen und **„PDF erstellen“**.
5. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken und die PDF einlesen.
   - **Danach:** Prüfhinweis: „Als Minijob vorgesehen, aber der Verdienst übersteigt die
     Geringfügigkeitsgrenze im Jahr …“. Die Fakten nennen 12 × 600,00 € + 300,00 € = 7.500,00 €
     gegenüber 7.236,00 €. Vorschlag Personengruppe **101**, mit „bitte prüfen“.
6. Für die Gegenprobe auf der Startseite der App (im Testbereich: „App neu starten“) wieder einen
   neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“ starten.
7. Bei „Wie wird die Person bezahlt?“ „festes Monatsentgelt“ wählen, Monatsentgelt `600,00` €.
8. Bei „Welche Einmalzahlungen sind vereinbart?“ eine Zeile: „Weihnachtsgeld“, `300,00` €,
   „November“, „Rechtsanspruch?“ diesmal „Nein“.
9. „Wie ist die Beschäftigung vorgesehen?“ → „Minijob (bis 603 € im Monat)“.
10. Bis zur Zusammenfassung gehen, abschließen und **„PDF erstellen“**.
11. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken
    und die eben erstellte PDF einlesen.
    - **Danach:** kein Hinweis, Vorschlag **109**.

---

## MT-63: Besonderer Personenkreis sperrt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Arbeitgeber: bei „Gehört die Person bei Ihnen zu einem dieser Personenkreise?“ „Mitglied des
   Vorstands einer Aktiengesellschaft“ wählen und **„Weiter“** klicken.
   - **Danach:** Oben steht der gelbe Hinweis „Für diesen Sonderfall ist der Fragebogen nicht gedacht
     …“ mit dem Vorstand der Aktiengesellschaft.
2. Die übrigen Fragen beantworten und mit **„Weiter“** bis zur Zusammenfassung gehen.
   - **Danach:** Der gelbe Hinweis steht auf jedem Schritt, auch in der Zusammenfassung.
3. **„Weiter zum Abschluss“** versuchen.
   - **Danach:** Abschließen und Weitergeben sind gesperrt.

**Erwartet:**

- Gleiches gilt für „Geistliche(r) …“, die beamtenrechtliche Absicherung und die Betriebsart
  „knappschaftlicher Betrieb (Bergbau)“.

---

## MT-64: Privat Versicherte – Befreiung und Stichtag 31.12.2002

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Voraussetzungen:** Rolle „Person“.

**Schritte:**

1. Die Fragen bis „Wie sind Sie krankenversichert?“ beliebig beantworten, bei „Was haben Sie mit
   Ihrem Arbeitgeber vereinbart?“ „eine feste Stelle in Voll- oder Teilzeit“ wählen.
2. Bei „Wie sind Sie krankenversichert?“ „privat“ wählen und **„Weiter“** klicken.
3. Die folgenden Fragen ansehen und mit **„Weiter“** weitergehen, bis „Waren Sie am 31. Dezember
   2002 privat krankenversichert …?“ kommt.
4. Bei dieser Frage die Hilfe ansehen.
   - **Danach:** Die Hilfe nennt 69.750 € statt 77.400 €.
5. Mit **„Weiter“** weitergehen, bis „Hat eine gesetzliche Krankenkasse Sie früher auf Antrag von
   der Versicherungspflicht befreit?“ kommt; dort „Ja“ wählen und **„Weiter“** klicken.
   - **Danach:** Es kommen die Fragen nach der Befreiung mit Grund und Datum („Weshalb wurden Sie
     befreit?“, „Ab wann gilt die Befreiung?“).
6. Mit **„Zurück“** zu „Wie sind Sie krankenversichert?“ gehen, „gesetzlich (auch familien-,
   studenten- oder rentnerversichert)“ wählen und mit **„Weiter“** weitergehen.
   - **Danach:** Keine dieser Fragen erscheint – weder die Befreiung noch der 31. Dezember 2002.

**Erwartet:**

- _Nicht offensichtlich:_ Ohne angekreuzten „Befreiungsbescheid der Krankenkasse“ beim Arbeitgeber
  zeigt die Kanzlei den Hinweis, den Bescheid anzufordern.
- _Nicht offensichtlich:_ Bei „einen Minijob …“ oder „eine Aushilfe …“ als Vereinbarung fragt der
  Bogen weder nach der Befreiung noch nach dem 31. Dezember 2002.

---

## MT-65: Auswahl aus den amtlichen Listen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ (oder „Personalfragebogen: Angaben für die Sofortmeldung“) als „Beschäftigte Person“.

**Voraussetzungen:** Personalfragebogen oder Sofortmeldung ab 0.2.0, Rolle „Person“.

**Schritte:**

1. Familienname und Vornamen beliebig eintragen; bei „Gehört zu Ihrem Namen ein Titel, ein
   Vorsatzwort oder ein Namenszusatz?“ „Ja“ wählen und **„Weiter“** klicken.
2. Den Titel leer lassen; als Vorsatzwort `zum Kuckuck` eingeben und **„Weiter“** drücken.
   - **Danach:** Die Meldung „Diese Angabe steht nicht in der amtlichen Liste …“ erscheint; die
     Hilfe sagt, dass ein nicht aufgeführtes Vorsatzwort zum Familiennamen gehört.
3. Stattdessen `van der` eingeben und **„Weiter“**.
   - **Danach:** Die Angabe wird angenommen.
4. Mit **„Weiter“** bis „Haben Sie die deutsche Staatsangehörigkeit?“ gehen, die Fragen dazwischen
   beliebig beantworten.
5. Dort „Nein“ wählen und **„Weiter“** klicken.
6. Bei der Staatsangehörigkeit `pol` tippen.
   - **Danach:** Unter dem Feld erscheinen Vorschläge aus der Liste.
7. Aus den Vorschlägen „polnisch“ wählen, **„Weiter“**.
8. Mit **„Weiter“** bis zur Anschrift gehen und die Anschrift ansehen.
   - **Danach:** Straße und Hausnummer sind zwei Fragen; „Keine Hausnummer“ ist möglich.
9. Die Anschrift und die übrigen Fragen beliebig beantworten und mit **„Weiter“** bis zur
   Zusammenfassung gehen.
   - **Danach:** In der Zusammenfassung steht „polnisch“. _Nicht offensichtlich:_ Der amtliche
     Schlüssel folgt aus der Liste; ein frei eingetippter Wert wird gespeichert, aber gelb markiert
     (MT-26).

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
   abschließen und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Vorschläge: Personengruppe 101, Beitragsgruppen 1111, Kennzeichen
     Übergangsbereich 1, Tätigkeitsschlüssel 714024412. Zu jedem Vorschlag steht die Begründung,
     bei den Beitragsgruppen für KV, RV, AV und PV einzeln.
4. Für die Gegenprobe noch einmal
   [Teilzeitstelle vorbereitet öffnen](start:personalfragebogen-teilzeit-berufskennziffer-offen)
   klicken.
5. „Kennen Sie die fünfstellige Berufskennziffer?“ leer lassen.
6. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
7. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Tätigkeitsschlüssel „?????4412“ mit „bitte prüfen“.

**Erwartet:**

- _Nicht offensichtlich:_ Die App entscheidet nichts. Die Vorschläge stehen auch auf dem Prüfblatt der PDF,
  werden aber nie mitunterschrieben.

---

## MT-67: Firmenzahler beim Arbeitgeber

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen, Rolle „Arbeitgeber“; die Person ist gesetzlich versichert.

**Schritte:**

1. Bei „Wie wird die Person bezahlt?“ „festes Monatsentgelt“ wählen und als Monatsentgelt
   `7.000,00` € eingeben.
2. Bei „Liegt der Verdienst voraussichtlich über der Jahresarbeitsentgeltgrenze?“ zunächst „Nein“
   lassen und **„Weiter“** klicken.
   - **Danach:** Die Frage nach Firmen- oder Selbstzahler erscheint **nicht**.
3. Die übrigen Fragen beantworten, bis zur Zusammenfassung gehen, abschließen und **„PDF
   erstellen“**.
4. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken und die PDF einlesen.
   - **Danach:** Prüfhinweis, dass der Verdienst laut Angaben über der Grenze liegt;
     Beitragsgruppen 9111 mit „bitte prüfen“.
5. **„Zur Startseite“** klicken und unter „Weiterbearbeiten oder prüfen“ mit **„Datei öffnen …“**
   dieselbe PDF öffnen.
6. In der Übersicht beim Arbeitgeber **„Neue Fassung beginnen“** klicken.
   - **Danach:** Die Zusammenfassung des Arbeitgebers erscheint.
7. Bei „Verdienst über der Jahresarbeitsentgeltgrenze“ **„ändern“** klicken, „Ja“ wählen und
   **„Weiter“** klicken.
   - **Danach:** Erst jetzt erscheint die Frage nach Firmen- oder Selbstzahler („Ist die Person
     freiwillig gesetzlich krankenversichert – zahlen Sie dann die Beiträge …?“).
8. „Nein, die Person zahlt selbst (Selbstzahler)“ wählen und **„Zurück zur Zusammenfassung“**
   klicken.
9. In der Zusammenfassung abschließen und **„PDF erstellen“**.
10. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken
    und die eben erstellte PDF einlesen.
    - **Danach:** Beitragsgruppen 0111 ohne „bitte prüfen“.

**Erwartet:**

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
   abschließen und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 110, Beitragsgruppen 0000 – genau drei Monate sind noch
     kurzfristig.
4. Für die Gegenprobe noch einmal
   [Aushilfe vorbereitet öffnen](start:personalfragebogen-aushilfe-art-offen) klicken.
5. „Wie ist die Beschäftigung vorgesehen?“ → „kurzfristige Aushilfe (höchstens 3 Monate oder 70
   Arbeitstage)“; „Bis wann ist die Aushilfe befristet?“ diesmal `01.09.2026`; Arbeitstage `79`;
   Rahmenvereinbarung „Nein“; Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
6. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
7. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111; die Begründung nennt
     die Zeitgrenze („Von vornherein länger als drei Monate … und mehr als 70 Arbeitstage“).
8. Für die zweite Gegenprobe noch einmal
   [Aushilfe vorbereitet öffnen](start:personalfragebogen-aushilfe-art-offen) klicken.
9. Mit **„Zurück“** zum Monatsentgelt („Wie hoch ist das Monatsentgelt brutto?“) gehen und
   `500,00` € eingeben.
10. Mit **„Weiter“** wieder bis „Wie ist die Beschäftigung vorgesehen?“ gehen. Dort „kurzfristige
    Aushilfe (höchstens 3 Monate oder 70 Arbeitstage)“; „Bis wann ist die Aushilfe befristet?“
    `01.09.2026`; Arbeitstage `79`; Rahmenvereinbarung „Nein“; Lohnsteuer „nach den
    Lohnsteuermerkmalen (ELStAM)“.
11. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
12. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
    die eben erstellte PDF einlesen und die Vorschläge ansehen.
    - **Danach:** Personengruppe 109 mit „bitte prüfen“, Beitragsgruppen 6100 – die Beschäftigung
      ist dann ein Minijob.

**Erwartet:**

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
2. „Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?“ → `20` eingeben und
   **„Weiter“** klicken.
   - **Danach:** _Nicht offensichtlich:_ Die Frage nach Wochenende, Abend oder Nacht erscheint bei
     20 Stunden **nicht** – erst darüber.
3. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen und **„PDF erstellen“**.
4. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 106, Beitragsgruppen 0100, ohne „bitte prüfen“.
5. Für die Gegenprobe noch einmal
   [Werkstudentin vorbereitet öffnen](start:personalfragebogen-werkstudent-stunden-offen) klicken.
6. „Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?“ → „Nein“.
7. „Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?“ → `25` eingeben und
   **„Weiter“** klicken.
   - **Danach:** Jetzt folgt die Frage „Liegen die Stunden über 20 hinaus am Wochenende, abends oder
     nachts?“.
8. Dort „Nein“ wählen.
9. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
10. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
    die eben erstellte PDF einlesen und die Vorschläge ansehen.
    - **Danach:** Personengruppe 101, Beitragsgruppen 1111; die Begründung nennt „mehr als 20
      Wochenstunden“.
11. Für die zweite Gegenprobe noch einmal
    [Werkstudentin vorbereitet öffnen](start:personalfragebogen-werkstudent-stunden-offen) klicken.
12. „Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?“ → „Nein“.
13. „Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?“ → `12` eingeben und
    **„Weiter“** klicken.
14. Mit **„Zurück“** zum Monatsentgelt („Wie hoch ist das Monatsentgelt brutto?“) gehen und
    `600,00` € eingeben.
15. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
16. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
    die eben erstellte PDF einlesen und die Vorschläge ansehen.
    - **Danach:** Personengruppe 109, Beitragsgruppen 6100 – ein Minijob geht der
      Werkstudentenregel vor.

**Erwartet:**

- _Nicht offensichtlich:_ Bei „nur in der vorlesungsfreien Zeit: Ja“ fragt der Bogen keine Stunden; dann
  bleibt es bei 106 unabhängig von der Stundenzahl.

---

## MT-98: Langzeitstudium und Versorgungswerk beim Werkstudenten

**Einstieg:** [Studentin ab dem Fachsemester öffnen](start:personalfragebogen-werkstudent-fachsemester-offen) –
der Arbeitgeber hat abgeschlossen (Beginn 01.04.2026, 1.000,00 €, „Werkstudent“, nicht nur in den
Semesterferien, 15 Wochenstunden); die Studentin (Vollzeitstudium, gesetzlich versichert, kein
Versorgungswerk) steht beim Fachsemester.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Im wievielten Fachsemester studieren Sie?“ → `4`.
2. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, unterschreiben
   und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 106, Beitragsgruppen 0100.
4. Für die Gegenprobe noch einmal
   [Studentin ab dem Fachsemester öffnen](start:personalfragebogen-werkstudent-fachsemester-offen)
   klicken.
5. „Im wievielten Fachsemester studieren Sie?“ → diesmal `27`.
6. Mit **„Weiter“** bis zur Zusammenfassung, unterschreiben und **„PDF erstellen“**.
7. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111. Die Begründung nennt
     „mehr als 25 Fachsemester“. _Nicht offensichtlich:_ Das ist nur eine Vermutung; weist die
     Person nach, dass das Studium im Vordergrund steht, gilt wieder 106.
8. Für die zweite Gegenprobe noch einmal
   [Studentin ab dem Fachsemester öffnen](start:personalfragebogen-werkstudent-fachsemester-offen)
   klicken.
9. „Im wievielten Fachsemester studieren Sie?“ → `4`.
10. Mit **„Weiter“** bis „Sind Sie Pflichtmitglied eines berufsständischen Versorgungswerks …?“
    gehen, dort „Ja, die Befreiung für diese Beschäftigung ist beantragt oder erteilt“ wählen und
    **„Weiter“** klicken.
11. Bei „Welchem Versorgungswerk gehören Sie an?“ `Versorgungswerk der Musterkammer` eintragen.
12. Mit **„Weiter“** bis zur Zusammenfassung, unterschreiben und **„PDF erstellen“**.
13. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
    die eben erstellte PDF einlesen und die Vorschläge ansehen.
    - **Danach:** Personengruppe 190, Beitragsgruppen 0000, Übergangsbereich 0 – die Person ist nur
      noch in der Unfallversicherung versichert.

---

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
2. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift
   abschließen und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 106, Beitragsgruppen 0100 und Übergangsbereich 1, alle mit „bitte
     prüfen“. Die Erläuterung zum Vorschlag nennt 5 + 7 = 12 Wochenstunden. _Nicht offensichtlich:_
     Beide Jobs liegen für sich unter 603 €, zusammen aber bei 900 € – dann ist keiner ein Minijob
     mehr, und für Studierende gilt die Werkstudentenregel (nur RV-pflichtig), obwohl der
     Arbeitgeber „Minijob“ gewählt hat.
4. Für die Gegenprobe noch einmal
   [Zwei Minijobs vorbereitet öffnen](start:personalfragebogen-zwei-minijobs-arbeitszeit-offen)
   klicken.
5. „Wie ist die Arbeitszeit vereinbart?“ → „feste Wochenstunden, die Tage wechseln (Dienstplan)“;
   „Wie viele Stunden arbeitet die Person pro Woche (Sollzeit)?“ diesmal `15`; Tage pro Woche `2`.
6. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
7. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** 15 + 7 = 22 Stunden – Personengruppe 101 mit „bitte prüfen“, Beitragsgruppen 1111.
8. Für die zweite Gegenprobe noch einmal
   [Zwei Minijobs vorbereitet öffnen](start:personalfragebogen-zwei-minijobs-arbeitszeit-offen)
   klicken.
9. „Wie ist die Arbeitszeit vereinbart?“ → „feste Wochenstunden, die Tage wechseln (Dienstplan)“;
   „Wie viele Stunden arbeitet die Person pro Woche (Sollzeit)?“ `5`; Tage pro Woche `2`.
10. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF
    erstellen“**.
11. **„Gerät weitergeben – zur Übersicht“** klicken und in der Übersicht bei der Person **„Neue
    Fassung beginnen“**.
    - **Danach:** Die Zusammenfassung der Person erscheint.
12. Bei „Art des Studiums“ **„ändern“** klicken, bei „Wie studieren Sie?“ „Teilzeitstudium“ wählen
    und **„Zurück zur Zusammenfassung“** klicken.
13. Unterschreiben und **„PDF erstellen“**.
14. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
    die zuletzt erstellte PDF einlesen und die Vorschläge ansehen.
    - **Danach:** Personengruppe 101 mit „bitte prüfen“ – beim Teilzeitstudium schlägt die App die
      Werkstudentenregel hier nicht vor.

**Erwartet:**

- _Nicht offensichtlich:_ Ohne Angabe der Arbeitszeit (z. B. bei Schichtarbeit) bleibt es bei 101 mit
  „bitte prüfen“; die App rät dann nicht.

---

## MT-103: Hausfrau – frühere Vollzeitstelle zählt nicht für die Berufsmäßigkeit

**Einstieg:** [Hausfrau ab früheren Beschäftigungen öffnen](start:personalfragebogen-hausfrau-vorbeschaeftigung-offen)
– der Arbeitgeber hat abgeschlossen (Beginn 01.08.2026, 1.000,00 €, „kurzfristige Aushilfe“ bis
15.09.2026 an 33 Arbeitstagen, befristet bis 15.09.2026); die Person („Haushaltsführung oder
Familienarbeit“, gesetzlich versichert, „eine Aushilfe …“) steht bei den früheren Beschäftigungen.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Haben Sie in diesem Kalenderjahr schon anderswo gearbeitet …?“ → „Ja“ und eine Zeile eintragen:
   Arbeitgeber `Muster AG`, von `01.01.2026` bis `31.03.2026`, Art „mehr als geringfügig“,
   Verdienst `3.000,00` €; **„Weiter“**.
   - **Danach:** Erst jetzt erscheint die Frage „Seit wann sind Sie nicht mehr berufstätig?“ – nur
     bei „Haushaltsführung oder Familienarbeit“ und früheren Beschäftigungen im Jahr.
2. „Seit wann sind Sie nicht mehr berufstätig?“ leer lassen.
3. Die übrigen Fragen sind vorausgefüllt: mit **„Weiter“** bis zur Zusammenfassung, unterschreiben
   und **„PDF erstellen“**.
4. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken, die PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 101 und Beitragsgruppen 3111, beide mit „bitte prüfen“ – die Stelle
     bis 31.03. zählt für die Berufsmäßigkeit mit.
5. Für die Gegenprobe noch einmal
   [Hausfrau ab früheren Beschäftigungen öffnen](start:personalfragebogen-hausfrau-vorbeschaeftigung-offen)
   klicken.
6. „Haben Sie in diesem Kalenderjahr schon anderswo gearbeitet …?“ → „Ja“ und eine Zeile eintragen:
   Arbeitgeber `Muster AG`, von `01.01.2026` bis `31.03.2026`, Art „mehr als geringfügig“,
   Verdienst `3.000,00` €; **„Weiter“**.
7. „Seit wann sind Sie nicht mehr berufstätig?“ → diesmal `01.04.2026`.
8. Mit **„Weiter“** bis zur Zusammenfassung, unterschreiben und **„PDF erstellen“**.
9. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken,
   die eben erstellte PDF einlesen und die Vorschläge ansehen.
   - **Danach:** Personengruppe 110, Beitragsgruppen 0000. _Nicht offensichtlich:_ Die Begründung
     nennt, dass Beschäftigungen vor dem Ausscheiden aus dem Berufsleben am 01.04.2026 nicht zählen
     (Geringfügigkeits-Richtlinien B 2.3.3.3).
