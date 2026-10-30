# Feldkatalog: Monatsmeldung: Lohn- und Gehaltsdaten

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | lohnmeldung, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | d540dfde3762baa61db49467a914760fe55000078f2f6514f8ed00b3f6bcbab3 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für die Monatsmeldung schreibt das Gesetz keine Form vor. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name mit dem Namen der meldenden Person (Art. 3 Nr. 10 eIDAS-Verordnung). Sie zeigt, wer die Daten gemeldet hat. |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Arbeitgeber (arbeitgeber) | Pflicht | immer | aus „Name der Person, die die Meldung abgibt“ | Ich bestätige, dass diese Meldung für den Abrechnungsmonat vollständig und richtig ist. |

## Felder

### 1. Meldung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Abrechnungsmonat (abrechnungsmonat)<br>Hilfe: Der Monat, für den abgerechnet werden soll, zum Beispiel 11.2026. | Arbeitgeber | Monat; wird übernommen als der folgende Monat | immer | Pflicht | Lohnzahlungszeitraum (§ 4 Abs. 2 Nr. 1 LStDV) |
| Stunden und Zuschläge gelten für (leistungszeitraum)<br>Hilfe: Viele Betriebe rechnen Stunden erst im Folgemonat ab. Bleiben Sie bei einer Variante und wechseln Sie nur nach Absprache. | Arbeitgeber | Auswahl: den Abrechnungsmonat, den Vormonat (Abrechnung einen Monat später) | immer | Pflicht | Zuordnung variabler Bezüge zum Abrechnungszeitraum |
| Firma des Arbeitgebers (agFirma) | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer) | Arbeitgeber | Betriebsnummer (8 Ziffern); Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Zuordnung |
| Mandantennummer (mandantennummer)<br>Hilfe: Steht auf Schreiben und Abrechnungen. Nicht zur Hand? Leer lassen. | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | optional | Zuordnung bei der lohnabrechnenden Stelle |
| Abgabe bis zum … des Monats (abgabetag)<br>Frage: Bis zu welchem Tag des Monats braucht Ihre lohnabrechnende Stelle die Meldung?<br>Hilfe: Den Tag nennt Ihnen Ihre lohnabrechnende Stelle. Steht er in Ihrem Lesezeichen-Link, ist er schon eingetragen. | Arbeitgeber | Zahl, ganzzahlig; Stammdatum, kann auf dem Gerät gemerkt werden | immer | optional | Termin der lohnabrechnenden Stelle für die Monatsmeldung |
| Ansprechperson für Rückfragen (ansprechpartner) | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Rückfragen |
| Telefon (ansprechpartnerTelefon) | Arbeitgeber | Text | immer<br>Warum: Für Rückfragen genügt ein Weg: Ohne E-Mail ist das Telefon Pflicht. | Pflicht, wenn „E-Mail“ leer ist | Rückfragen |
| E-Mail (ansprechpartnerEmail) | Arbeitgeber | Text | immer<br>Warum: Für Rückfragen genügt ein Weg: Ohne Telefon ist die E-Mail Pflicht. | Pflicht, wenn „Telefon“ leer ist | Rückfragen |
| Name der Person, die die Meldung abgibt (unterzeichnerName)<br>Hilfe: Ihr Vor- und Familienname. | Arbeitgeber | Text | immer | Pflicht | Unterschrift mit Namen |

### 2. Mitarbeitende

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mitarbeitende (mitarbeitende)<br>Frage: Wer war im Abrechnungsmonat beschäftigt?<br>Hilfe: Eine Zeile für jede Person, auch Neue und Ausscheidende. Die Zeilen werden in die nächste Meldung übernommen, außer bei Personen, die ausscheiden; Monatswerte bleiben dann leer. | Arbeitgeber | Tabelle; übernommen werden nur Zeilen, bei denen nicht zutrifft, dass „scheidet in diesem Monat aus“ mit „Ja“ beantwortet ist | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Personalnummer (maPersonalnummer)<br>Hilfe: Wie auf der letzten Abrechnung; bei neuen Beschäftigten leer. | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Familienname, Vorname (maName) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Vergütung (maVerguetungsart) | Arbeitgeber | Auswahl: Stundenlohn, festes Monatsentgelt | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Stundenlohn bzw. Monatsentgelt brutto (maVerguetung) | Arbeitgeber | Betrag in Euro | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Vereinbarte Wochenstunden (maWochenstunden) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std. | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Änderung bei Lohn oder Stunden gilt ab (maAenderungAb) | Arbeitgeber | Datum; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Gearbeitete Stunden (maArbeitsstunden)<br>Hilfe: Nur bei Stundenlohn: tatsächlich gearbeitete Stunden ohne Urlaub, Krankheit und Feiertage; 15 Minuten = 0,25. | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std.; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Wegen Feiertag ausgefallene Stunden (maFeiertagsstunden) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std.; wird nicht aus einer anderen Datei übernommen | immer | optional | Feiertagsvergütung (§ 2 EFZG) |
| – Auszuzahlende Überstunden (maUeberstunden) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std.; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Stand Arbeitszeitkonto am Monatsende (maZeitkonto) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std., auch negativ; wird nicht aus einer anderen Datei übernommen | immer | optional | Arbeitszeitkonto (§ 2 Abs. 2 MiLoG) |
| – scheidet in diesem Monat aus (maScheidetAus) | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (maBemerkung) | Arbeitgeber | Text; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |

### 3. Was in diesem Monat war

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Zuschläge in diesem Monat (fragZuschlaege)<br>Frage: Zahlen Sie in diesem Monat Zuschläge für Nacht-, Sonntags- oder Feiertagsarbeit oder für Überstunden? | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| Zuschläge (zuschlaege)<br>Hilfe: Eine Zeile je Person und Art. Stunden, die zugleich Nacht- und Sonntagsstunden sind, in beiden Zeilen angeben. | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | erst wenn „Zuschläge in diesem Monat“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | Steuerfreie Zuschläge (§ 3b EStG) |
| – Person (Personalnummer oder Name) (zuPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Art (zuschlagArt) | Arbeitgeber | Auswahl: Nachtarbeit 20 bis 6 Uhr, davon 0 bis 4 Uhr bei Beginn vor 0 Uhr, Sonntagsarbeit, Feiertagsarbeit (auch 31.12. ab 14 Uhr), 24.12. ab 14 Uhr, 25./26.12. und 1. Mai, Überstundenzuschlag, sonstiger Zuschlag | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Stunden (zuStunden) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std. | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (zuBemerkung) | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Fehlzeiten in diesem Monat (fragFehlzeiten)<br>Frage: Gab es in diesem Monat Urlaub, Krankheit oder andere Fehlzeiten?<br>Hilfe: Auch halbe Tage und Fehlzeiten, die schon im Vormonat begonnen haben. | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| Fehlzeiten (fehlzeiten)<br>Hilfe: Bitte keine Diagnose und keinen Grund angeben, nur die Art. Fehlzeiten, die über das Monatsende andauern, werden in die nächste Meldung übernommen; tragen Sie dort das Ende nach. | Arbeitgeber | Tabelle; übernommen werden nur Zeilen, bei denen „dauert über das Monatsende an“ mit „Ja“ beantwortet ist | erst wenn „Fehlzeiten in diesem Monat“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | Entgeltfortzahlung (§ 3 EFZG), Lohnkonto (§ 41 EStG), Versicherungspflicht (§ 7 Abs. 3 SGB IV) |
| – Person (Personalnummer oder Name) (fzPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Art (fzArt) | Arbeitgeber | Auswahl: Urlaub, arbeitsunfähig (Krankheit), arbeitsunfähig nach Arbeits- oder Wegeunfall, stationäre Reha oder Kur, Kind krank, unbezahlter Urlaub oder unbezahlte Freistellung, Mutterschutz, Beschäftigungsverbot, Elternzeit, Pflegezeit, Kurzarbeit, bezahlte Freistellung, unentschuldigtes Fehlen, Sonstiges | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – von (fzVon) | Arbeitgeber | Datum | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – bis (fzBis)<br>Hilfe: Leer lassen, wenn das Ende offen ist. | Arbeitgeber | Datum; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – dauert über das Monatsende an (fzDauertAn) | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – ausgefallene Arbeitstage in diesem Monat (fzArbeitstage) | Arbeitgeber | Zahl, 1 Nachkommastellen, in Tage; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – ausgefallene Stunden (fzStunden) | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std.; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Nachweis (fzNachweis) | Arbeitgeber | Auswahl: elektronische AU, wird bei der Krankenkasse abgerufen, Bescheinigung auf Papier liegt vor, Nachweis fehlt noch, nicht nötig | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (fzBemerkung) | Arbeitgeber | Text; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Einmalige Zahlungen in diesem Monat (fragZahlungen)<br>Frage: Gibt es einmalige Zahlungen, Vorschüsse, Sachzuwendungen oder Erstattungen?<br>Hilfe: Bitte früh melden: Für Einmalzahlungen darf nicht mit den Werten des Vormonats gerechnet werden (§ 23 Abs. 1 SGB IV). | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| Einmalige Zahlungen, Vorschüsse und Sachzuwendungen (zahlungen) | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | erst wenn „Einmalige Zahlungen in diesem Monat“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Person (Personalnummer oder Name) (zaPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Art (zaArt) | Arbeitgeber | Auswahl: Prämie, Bonus oder Provision, Urlaubsgeld, Weihnachtsgeld oder 13. Monatsgehalt, Abfindung, Vorschuss oder Abschlag (schon ausgezahlt), einmalige Sachzuwendung, Mahlzeiten, Reisekostenerstattung, Auslagenersatz, Sonstiges | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Betrag (brutto) (zaBetrag) | Arbeitgeber | Betrag in Euro | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Anzahl (nur Mahlzeiten) (zaAnzahl) | Arbeitgeber | Zahl, ganzzahlig | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – ausgezahlt am (zaDatum) | Arbeitgeber | Datum | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (zaBemerkung) | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Laufende Zusatzleistungen (laufendeLeistungen)<br>Frage: Welche laufenden Zusatzleistungen gibt es?<br>Hilfe: Wird in die nächste Meldung übernommen. Leer lassen, wenn es keine gibt. | Arbeitgeber | Tabelle | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Person (Personalnummer oder Name) (llPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Art (llArt) | Arbeitgeber | Auswahl: Jobticket oder Deutschlandticket, monatlicher Gutschein oder Guthabenkarte, Dienstwagen, auch privat nutzbar, Fahrtkostenzuschuss, vermögenswirksame Leistungen, betriebliche Altersversorgung oder Entgeltumwandlung, Zuschuss Kinderbetreuung, Sonstiges | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Betrag im Monat (llBetrag) | Arbeitgeber | Betrag in Euro | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – seit (llSeit) | Arbeitgeber | Datum | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – endet am (llBis) | Arbeitgeber | Datum | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (llBemerkung) | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Ein- und Austritte (fragEinAustritte)<br>Frage: Hat jemand angefangen oder aufgehört, oder steht ein Austritt fest?<br>Hilfe: Neue Beschäftigte brauchen zusätzlich den Personalfragebogen; in bestimmten Branchen muss die Sofortmeldung vor dem ersten Arbeitstag erstattet sein. | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| Ein- und Austritte (einAustritte) | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | erst wenn „Ein- und Austritte“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Person (Personalnummer oder Name) (eaPerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Eintritt oder Austritt (eaArt) | Arbeitgeber | Auswahl: Eintritt, Austritt | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Datum (eaDatum)<br>Hilfe: Eintritt: erster Arbeitstag. Austritt: letzter Tag des Arbeitsverhältnisses. | Arbeitgeber | Datum | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Grund des Austritts (eaGrund) | Arbeitgeber | Auswahl: Kündigung durch den Arbeitgeber, Kündigung durch die beschäftigte Person, Aufhebungsvertrag, Befristung endet, Rente, Tod, Sonstiges | immer | optional | Arbeitsbescheinigung (§ 312 SGB III) |
| – Resturlaub zum Auszahlen (eaResturlaub) | Arbeitgeber | Zahl, 1 Nachkommastellen, in Tage | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Unterlagen bei Eintritt (eaUnterlagen) | Arbeitgeber | Auswahl: Personalfragebogen liegt vor, Personalfragebogen folgt | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| – Bemerkung (eaBemerkung) | Arbeitgeber | Text | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Änderungen bei einer Person (fragAenderungen)<br>Frage: Hat sich bei einer Person etwas geändert (Anschrift, Krankenkasse, Name …)?<br>Hilfe: Lohn und Wochenstunden ändern Sie direkt bei den Mitarbeitenden. | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| Änderungen (aenderungen)<br>Hilfe: Steuerklasse, Kinder und Konfession bitte nicht melden – sie kommen elektronisch. Eine neue Bankverbindung nur nach schriftlicher Mitteilung der Person selbst: Anrufe oder E-Mails mit neuer Bankverbindung sind ein häufiger Betrugsversuch. | Arbeitgeber | Tabelle; wird nicht aus einer anderen Datei übernommen | erst wenn „Änderungen bei einer Person“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Person (Personalnummer oder Name) (aePerson) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Was hat sich geändert? (aeArt) | Arbeitgeber | Auswahl: Anschrift, Bankverbindung, Krankenkasse, Name, Tätigkeit, Befristung oder Vertragsende, neue Zusatzleistung, Sonstiges | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – Neue Angabe (aeNeu) | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – gilt ab (aeGiltAb) | Arbeitgeber | Datum | immer | Pflicht | Lohnabrechnung des Abrechnungsmonats |
| – schriftliche Mitteilung der Person liegt vor (aeSchriftlich) | Arbeitgeber | Ja/Nein | immer | optional | Lohnabrechnung des Abrechnungsmonats |
| Pfändung oder Abtretung eingegangen (fragPfaendung)<br>Frage: Ist eine Pfändung, eine Vorpfändung oder eine Abtretung eingegangen?<br>Hilfe: Bitte schicken Sie das Schreiben sofort, nicht erst mit der Monatsmeldung: Die Erklärung als Drittschuldner ist binnen zwei Wochen fällig. | Arbeitgeber | Ja/Nein; wird nicht aus einer anderen Datei übernommen | immer | Pflicht | Drittschuldnererklärung binnen zwei Wochen (§ 840 ZPO) |
| Angaben zur Pfändung (pfaendungAngaben)<br>Hilfe: Wer ist betroffen, welche Art von Schreiben, an welchem Tag zugestellt? | Arbeitgeber | Text, mehrzeilig; wird nicht aus einer anderen Datei übernommen | erst wenn „Pfändung oder Abtretung eingegangen“ mit „Ja“ beantwortet ist<br>Warum: Die Tabelle erscheint nur, wenn es in diesem Monat etwas zu melden gibt; die Ja/Nein-Frage davor hält die Meldung kurz. | Pflicht | § 840 ZPO |
| Weitere Hinweise (bemerkungen) | Arbeitgeber | Text, mehrzeilig; wird nicht aus einer anderen Datei übernommen | immer | optional | Lohnabrechnung des Abrechnungsmonats |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Zuschläge in diesem Monat (Arbeitgeber; unabhängig)
  - Zuschläge (Arbeitgeber; Ebene 1) – erst wenn „Zuschläge in diesem Monat“ mit „Ja“ beantwortet ist
- Fehlzeiten in diesem Monat (Arbeitgeber; unabhängig)
  - Fehlzeiten (Arbeitgeber; Ebene 1) – erst wenn „Fehlzeiten in diesem Monat“ mit „Ja“ beantwortet ist
- Einmalige Zahlungen in diesem Monat (Arbeitgeber; unabhängig)
  - Einmalige Zahlungen, Vorschüsse und Sachzuwendungen (Arbeitgeber; Ebene 1) – erst wenn „Einmalige Zahlungen in diesem Monat“ mit „Ja“ beantwortet ist
- Ein- und Austritte (Arbeitgeber; unabhängig)
  - Ein- und Austritte (Arbeitgeber; Ebene 1) – erst wenn „Ein- und Austritte“ mit „Ja“ beantwortet ist
- Änderungen bei einer Person (Arbeitgeber; unabhängig)
  - Änderungen (Arbeitgeber; Ebene 1) – erst wenn „Änderungen bei einer Person“ mit „Ja“ beantwortet ist
- Pfändung oder Abtretung eingegangen (Arbeitgeber; unabhängig)
  - Angaben zur Pfändung (Arbeitgeber; Ebene 1) – erst wenn „Pfändung oder Abtretung eingegangen“ mit „Ja“ beantwortet ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Bis wann die Meldung gebraucht wird

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Die Beiträge zur Sozialversicherung sind am drittletzten Bankarbeitstag des Monats fällig; der Beitragsnachweis muss zwei Arbeitstage vorher bei den Krankenkassen sein (§ 23 Abs. 1, § 28f Abs. 3 SGB IV). Bitte geben Sie die Meldung deshalb bis zu dem Tag ab, den Ihre lohnabrechnende Stelle Ihnen nennt (oben unter „Abgabe bis zum … des Monats“). Fehlt sie, wird mit den Werten des Vormonats gerechnet; Differenzen werden im Folgemonat ausgeglichen.

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

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung).
- Die Monatsmeldung ist keine Arbeitszeitaufzeichnung nach § 17 MiLoG oder § 16 ArbZG; die Aufzeichnungen bleiben beim Arbeitgeber.
- Steuerklasse, Kinderfreibeträge und Kirchensteuermerkmal ruft die lohnabrechnende Stelle elektronisch ab (§ 39e EStG); Arbeitsunfähigkeitszeiten gesetzlich Versicherter ruft sie bei der Krankenkasse ab (§ 109 SGB IV).
- Fehlzeiten werden nur mit Art und Zeitraum gemeldet, nie mit einer Diagnose (Art. 9 DSGVO).
- Eine neue Meldung wird aus der des Vormonats übernommen: Der Abrechnungsmonat zählt weiter, die Mitarbeitenden (außer Ausscheidenden) und laufenden Leistungen bleiben, Fehlzeiten über das Monatsende werden mit Beginn übernommen, alle Monatswerte sind leer.
