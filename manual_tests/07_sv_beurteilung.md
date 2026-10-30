# 07 – Sozialversicherungs-Beurteilung (Personalfragebogen)

Diese Tests prüfen, dass der Personalfragebogen die Angaben für die SV-Beurteilung in sinnvoller
Reihenfolge erfragt und die Vorschläge und Prüfhinweise passen. Alle Fälle sind zusätzlich als
automatische Tests abgesichert (`tests/forms/svSzenarien.test.ts`). Die Handtests prüfen, was nur am
Bildschirm sichtbar ist.

**Umgebung:** Vorschau-Build mit den Entwürfen (`npm run build:preview`,
`dist-preview/index.html`), fiktive Daten, Beschäftigungsbeginn im Jahr 2026.

---

## MT-60: Verdienst vor der Art der Beschäftigung

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

**Voraussetzungen:** Personalfragebogen oder Sofortmeldung 0.2.0 (Entwurf), Rolle „Person“.

**Schritte:**

1. Bei der Staatsangehörigkeit „deu“ tippen.
2. Aus den Vorschlägen „deutsch“ wählen, „Weiter“.
3. Bei „Titel, Vorsatzwort oder Namenszusatz“ „Ja“ wählen; als Vorsatzwort „zum Kuckuck“ eingeben
   und „Weiter“ drücken.
4. Stattdessen „van der“ eingeben.
5. Die Anschrift ansehen.

**Erwartet:**

- Schritt 1: Unter dem Feld erscheinen Vorschläge aus der Liste.
- Schritt 2: In der Zusammenfassung steht „deutsch“. _Nicht offensichtlich:_ Gespeichert wird der
  amtliche Schlüssel 000; auf dem PDF steht trotzdem „deutsch“.
- Schritt 3: Die Meldung „Diese Angabe steht nicht in der amtlichen Liste …“ erscheint; die Hilfe
  sagt, dass ein nicht aufgeführtes Vorsatzwort zum Familiennamen gehört.
- Schritt 4 wird angenommen.
- Schritt 5: Straße und Hausnummer sind zwei Fragen; „Keine Hausnummer“ ist möglich.
