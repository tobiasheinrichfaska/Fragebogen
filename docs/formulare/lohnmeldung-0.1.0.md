# Feldkatalog: Monatsmeldung: Lohn- und Gehaltsdaten

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | lohnmeldung, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Abrechnungsmonat“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 04.11.2026 um 18:13 |
| Definition (SHA-256) | 18370932c49fb1769e0b3d44af013692b6e0ee6d73d6531814b6d9dee56424d2 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für die Monatsmeldung schreibt das Gesetz keine Form vor. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name mit dem Namen der meldenden Person (Art. 3 Nr. 10 eIDAS-Verordnung). Sie zeigt, wer die Daten gemeldet hat. |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Arbeitgeber (arbeitgeber) | Pflicht | immer | aus „Meldende Person“ | Ich bestätige, dass diese Meldung für den Abrechnungsmonat vollständig und richtig ist. |

## Felder

### 1. Meldung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Abrechnungsmonat (abrechnungsmonat)<br>Hilfe: Der Monat, für den abgerechnet werden soll, zum Beispiel 11.2026. Haben Sie die Meldung des Vormonats eingelesen, ist er schon eingetragen. | Arbeitgeber | Monat; wird übernommen als der folgende Monat | immer | Pflicht | Lohnzahlungszeitraum (§ 4 Abs. 2 Nr. 1 LStDV) |
| Firma des Arbeitgebers (agFirma) | Arbeitgeber | Text; Stammdatum „firma“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer) | Arbeitgeber | Betriebsnummer (8 Ziffern); Stammdatum „betriebsnummer“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Zuordnung |
| Mandantennummer (mandantennummer)<br>Hilfe: Steht auf Schreiben und Abrechnungen Ihrer lohnabrechnenden Stelle und im Lesezeichen-Link. | Arbeitgeber | Text, nur Ziffern; Stammdatum „mandantennummer“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Zuordnung bei der lohnabrechnenden Stelle |
| Abgabe bis zum … des Monats (abgabetag)<br>Frage: Bis zu welchem Tag des Monats braucht Ihre lohnabrechnende Stelle die Meldung?<br>Hilfe: Den Tag nennt Ihnen Ihre lohnabrechnende Stelle. Steht er in Ihrem Lesezeichen-Link, ist er schon eingetragen. | Arbeitgeber | Zahl, ganzzahlig, mindestens 1, höchstens 31; Stammdatum „abgabetag“, kann im Stammdaten-Link gemerkt werden | immer | optional | Termin der lohnabrechnenden Stelle für die Monatsmeldung |
| Meldende Person (ansprechpartner)<br>Frage: Wer gibt die Meldung ab und ist Ansprechperson für Rückfragen?<br>Hilfe: Ihr Vor- und Familienname. | Arbeitgeber | Text; Stammdatum „ansprechpartner“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Rückfragen; Unterschrift mit Namen |
| Telefon (ansprechpartnerTelefon) | Arbeitgeber | Text, Telefonnummer mit Vorwahl; Stammdatum „ansprechpartnerTelefon“, kann im Stammdaten-Link gemerkt werden | immer<br>Warum: Für Rückfragen genügt ein Weg: Ohne E-Mail ist das Telefon Pflicht. | Pflicht, wenn „E-Mail“ leer ist | Rückfragen |
| E-Mail (ansprechpartnerEmail) | Arbeitgeber | Text, E-Mail-Adresse; Stammdatum „ansprechpartnerEmail“, kann im Stammdaten-Link gemerkt werden | immer<br>Warum: Für Rückfragen genügt ein Weg: Ohne Telefon ist die E-Mail Pflicht. | Pflicht, wenn „Telefon“ leer ist | Rückfragen |
| Lohnarten Ihres Betriebs (lohnarten)<br>Hilfe: Gibt Ihre lohnabrechnende Stelle vor, eine je Zeile, zum Beispiel „1000 Stundenlohn“; steht im Lesezeichen-Link. Sie erscheinen als Vorschläge bei den Monatswerten. | Arbeitgeber | Text, mehrzeilig; Stammdatum „lohnarten“, kann im Stammdaten-Link gemerkt werden | immer | optional | Vorschläge für die Monatswerte |

### 2. Mitarbeitende

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mitarbeitende (mitarbeitende)<br>Frage: Wer war im Abrechnungsmonat beschäftigt?<br>Hilfe: Eine Zeile je Person, auch Neue und Ausscheidende. Mit der Meldung des Vormonats sind alle schon da; prüfen Sie die Vergütung. Personen, die ausscheiden, fehlen in der nächsten Meldung. | Arbeitgeber | Tabelle; übernommen werden nur Zeilen, bei denen nicht zutrifft, dass „scheidet in diesem Monat aus“ mit „Ja“ beantwortet ist | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Familienname, Vorname (maName) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Personalnummer (maPersonalnummer) | Arbeitgeber | Text | immer | optional | Zuordnung bei der lohnabrechnenden Stelle |
| – Art der Vergütung (maVerguetungsart) | Arbeitgeber | Auswahl: Stundenlohn, festes Monatsentgelt, Ausbildungsvergütung | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Stundenlohn bzw. Monatsentgelt (brutto) (maVerguetung) | Arbeitgeber | Betrag in Euro | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Im Vormonat (maVerguetungVormonat) | Arbeitgeber | Betrag in Euro | immer | optional | Änderung der Vergütung gegenüber dem Vormonat erkennen |
| – Neue Vergütung gilt ab (maAenderungAb)<br>Hilfe: Nur wenn sich die Vergütung gegenüber dem Vormonat ändert. | Arbeitgeber | Datum; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – scheidet in diesem Monat aus (maScheidetAus) | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | optional | Abmeldung und Endabrechnung |
| – Urlaub und Krankheit (maFehltage) | Arbeitgeber | Kalender: Urlaub, halber Urlaubstag, krank; wird nicht aus einer anderen Datei übernommen | immer | optional | Urlaubskonto und Entgeltfortzahlung (§ 11 BUrlG, § 3 EFZG); nur die Art der Fehlzeit, keine Diagnose |
| – Ausgefallene Stunden Urlaub (maUrlaubStunden)<br>Hilfe: Laut Dienstplan; nur bei Stundenlohn. | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std., höchstens 744; wird nicht aus einer anderen Datei übernommen | erst wenn „maVerguetungsart“ (unbekanntes Feld)<br>Warum: Bei Stundenlohn rechnet die Lohnabrechnung mit den ausgefallenen Stunden; bei festem Entgelt genügen die Tage. | optional | Urlaubsentgelt bei Stundenlohn (§ 11 BUrlG) |
| – Ausgefallene Stunden Krankheit (maKrankStunden)<br>Hilfe: Die Stunden, die laut Plan gearbeitet worden wären; nur bei Stundenlohn. | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std., höchstens 744; wird nicht aus einer anderen Datei übernommen | erst wenn „maVerguetungsart“ (unbekanntes Feld)<br>Warum: Bei Stundenlohn wird die Entgeltfortzahlung nach den ausgefallenen Stunden berechnet; bei festem Entgelt genügen die Tage. | optional | Entgeltfortzahlung bei Stundenlohn nach dem Lohnausfallprinzip (§ 4 Abs. 1 EFZG) |

### 3. Werte des Abrechnungsmonats

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Werte für den Abrechnungsmonat (monatWerte)<br>Frage: Welche Werte sollen für den Abrechnungsmonat abgerechnet werden?<br>Hilfe: Eine Zeile je Person und Lohnart, zum Beispiel „1000 Stundenlohn“ mit 100 Stunden. Zuschläge (Nacht, Sonntag, Feiertag) ebenso; Überstunden bitte als eigene Zeile, nicht in den gearbeiteten Stunden. | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Person (monatPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Lohnart (monatLohnart)<br>Hilfe: Aus der Liste wählen oder eintippen, zum Beispiel „1000 Stundenlohn“. | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Wert (monatWert)<br>Hilfe: Stunden, Tage oder Betrag – die Einheit ergibt sich aus der Lohnart. | Arbeitgeber | Zahl, 2 Nachkommastellen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| – Bemerkung (monatBemerkung) | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |

### 4. Nachträge für den Vormonat

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Nachträge für den Vormonat (fragVormonat)<br>Frage: Gibt es Werte, die noch für den Vormonat abgerechnet werden sollen, zum Beispiel Zuschläge? | Arbeitgeber | Ja/Nein; vorbelegt: Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |
| Werte für den Vormonat (vormonatWerte)<br>Frage: Welche Werte sollen noch für den Vormonat abgerechnet werden?<br>Hilfe: Eine Zeile je Person und Lohnart, wie bei den Werten des Abrechnungsmonats. | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | erst wenn „Nachträge für den Vormonat“ mit „Ja“ beantwortet ist<br>Warum: Nur wenn es Nachträge für den Vormonat gibt, kommt diese Seite. | Pflicht | Nachträgliche Abrechnung des Vormonats (§ 41 EStG, § 28f SGB IV) |
| – Person (vormonatPerson) | Arbeitgeber | Text | immer | Pflicht | Nachträgliche Abrechnung des Vormonats (§ 41 EStG, § 28f SGB IV) |
| – Lohnart (vormonatLohnart)<br>Hilfe: Aus der Liste wählen oder eintippen, zum Beispiel „1000 Stundenlohn“. | Arbeitgeber | Text | immer | Pflicht | Nachträgliche Abrechnung des Vormonats (§ 41 EStG, § 28f SGB IV) |
| – Wert (vormonatWert)<br>Hilfe: Stunden, Tage oder Betrag – die Einheit ergibt sich aus der Lohnart. | Arbeitgeber | Zahl, 2 Nachkommastellen | immer | Pflicht | Nachträgliche Abrechnung des Vormonats (§ 41 EStG, § 28f SGB IV) |
| – Bemerkung (vormonatBemerkung) | Arbeitgeber | Text | immer | optional | Nachträgliche Abrechnung des Vormonats (§ 41 EStG, § 28f SGB IV) |

### 5. Besonderheiten

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Besonderheiten (besonderheiten)<br>Frage: Gibt es Besonderheiten in diesem Monat?<br>Hilfe: Zum Beispiel Ein- oder Austritte, eine neue Anschrift oder Bankverbindung, weitere Fehlzeiten (Kind krank, unbezahlter Urlaub, Mutterschutz, Elternzeit), Pfändungen, ein Arbeitsunfall, eine von Dritten verursachte Krankheit oder am ersten Krankheitstag noch gearbeitet. Bitte keine Diagnosen. | Arbeitgeber | Text, mehrzeilig; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats (§ 41 EStG, § 28f SGB IV) |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Nachträge für den Vormonat (Arbeitgeber; unabhängig)
  - Werte für den Vormonat (Arbeitgeber; Ebene 1) – erst wenn „Nachträge für den Vormonat“ mit „Ja“ beantwortet ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Bis wann die Meldung gebraucht wird

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 01.11.2026

> Die Beiträge zur Sozialversicherung sind am drittletzten Bankarbeitstag des Monats fällig; der Beitragsnachweis muss zwei Arbeitstage vorher bei den Krankenkassen sein (§ 23 Abs. 1, § 28f Abs. 3 SGB IV). Bitte geben Sie die Meldung deshalb bis zu dem Tag ab, den Ihre lohnabrechnende Stelle Ihnen nennt. Fehlt sie, wird mit den Werten des Vormonats gerechnet; Differenzen werden im Folgemonat ausgeglichen.

### Arbeitszeit aufzeichnen

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Für Minijobs (nicht im Privathaushalt) und in den Branchen nach § 2a SchwarzArbG müssen Beginn, Ende und Dauer der täglichen Arbeitszeit spätestens bis zum siebten Tag nach dem Arbeitstag aufgezeichnet und zwei Jahre aufbewahrt werden (§ 17 MiLoG). Arbeitszeit über die werktägliche Höchstarbeitszeit hinaus ist immer aufzuzeichnen (§ 16 Abs. 2 ArbZG). Diese Meldung ersetzt die Aufzeichnungen nicht.

## Verknüpfung der Teile

Keine.

## Prüfregeln

Keine.

## Zuordnung getrennt eingegangener Teile

Keine.

## Was dieser Fragebogen nicht abdeckt

- Die Meldung ersetzt keine Arbeitszeitaufzeichnung (z. B. § 17 MiLoG); sie fasst nur zusammen, was abgerechnet werden soll.
- Ein- und Austritte, Änderungen und Pfändungen nennt sie nur als Besonderheiten; die Fragebögen für neue Beschäftigte und die Bescheinigungen beim Austritt kommen gesondert.
- Bei Urlaub und Krankheit meldet sie die Tage, bei Stundenlohn auch die ausgefallenen Stunden; Durchschnitte und Lohnfortzahlung berechnet die Lohnabrechnung.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung).
- Die Monatsmeldung ist keine Arbeitszeitaufzeichnung nach § 17 MiLoG oder § 16 ArbZG; die Aufzeichnungen bleiben beim Arbeitgeber.
- Steuerklasse, Kinderfreibeträge und Kirchensteuermerkmal ruft die lohnabrechnende Stelle elektronisch ab (§ 39e EStG); Arbeitsunfähigkeitszeiten gesetzlich Versicherter ruft sie bei der Krankenkasse ab (§ 109 SGB IV).
- Fehlzeiten werden nur mit Art und Zeitraum gemeldet, nie mit einer Diagnose (Art. 9 DSGVO).
- Eine neue Meldung entsteht aus der des Vormonats: Der Abrechnungsmonat zählt weiter, Firma, Ansprechperson, Lohnarten und die Mitarbeitenden (außer Ausscheidenden) mit ihrer Vergütung bleiben, die Vergütung des Vormonats steht zum Vergleich daneben; Fehltage, Monatswerte und Besonderheiten sind leer. Hinweise, die schon bestätigt sind und deren Text gleich blieb, gelten als bestätigt.
