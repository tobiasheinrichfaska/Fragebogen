# Feldkatalog: Freigabe zur elektronischen Übermittlung einer Steuererklärung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | steuerfreigabe, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | 5292a0d1510cb78bc3f49dcd30f77ab9e8948cac1f1283e556f5e9eab411e1c5 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für die Zustimmung zur Übermittlung schreibt das Gesetz keine Form vor (§ 87d Abs. 3 AO); nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Sie gilt nur für die oben bezeichnete Fassung. |
| Empfänger | Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Kanzlei (kanzlei) | Pflicht | immer | – | Wir haben die oben bezeichnete Fassung der Steuererklärung zur Prüfung vorgelegt. |
| Mandantin oder Mandant (mandant) | Pflicht | immer | – | Ich bestätige meine Angaben und meine Entscheidung oben. |
| Ehegatte oder Lebenspartner (ehegatte) | Pflicht | nur wenn bei „Veranlagungsart“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist (nach dem abgeschlossenen Teil, der das angibt) | aus „Ihr Vor- und Familienname“ | Ich bestätige meine Angaben und meine Entscheidung oben. |

## Felder

### 1. Vorlage der Kanzlei

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandantennummer (mandantennummer)<br>Frage: Mandantennummer | Kanzlei | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | optional | Zuordnung in der Kanzlei |
| Vor- und Familienname der Mandantin oder des Mandanten (mandantNameKanzlei) | Kanzlei | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe der Mandantin oder des Mandanten |
| Steuerjahr (steuerjahr)<br>Hilfe: Zum Beispiel 2025. | Kanzlei | Text | immer | Pflicht | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Erklärungen (erklaerungen)<br>Frage: Welche Erklärungen werden freigegeben?<br>Hilfe: Je Steuerjahr eine Freigabe; mehrere Erklärungen desselben Jahres sind möglich. | Kanzlei | Mehrfachauswahl: Einkommensteuer, Umsatzsteuer, Gewerbesteuer, Feststellungserklärung, sonstige Erklärung | immer | Pflicht | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Art der Erklärung (erklaerungArt) | Kanzlei | Auswahl: erstmalige Erklärung, berichtigte Erklärung | immer | Pflicht | Berichtigung nach § 153 AO erkennbar |
| Veranlagungsart (veranlagung) | Kanzlei | Auswahl: Einzelveranlagung, Zusammenveranlagung (§ 26b EStG), Einzelveranlagung von Ehegatten (§ 26a EStG) | erst wenn bei „Erklärungen“ „Einkommensteuer“ angekreuzt ist | Pflicht | Entscheidet, ob auch der Ehegatte oder Lebenspartner freigeben muss (§ 25 Abs. 3 Satz 2 EStG) |
| Vor- und Familienname des Ehegatten oder Lebenspartners (ehegatteNameKanzlei) | Kanzlei | Text | erst wenn bei „Veranlagungsart“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist | Pflicht | Zuordnung; Abgleich mit der Angabe des Ehegatten |
| Steuernummer (steuernummer) | Kanzlei | Text | immer | optional | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Voraussichtliches Ergebnis laut Steuerberechnung (ergebnis)<br>Hilfe: Vorausberechnung; maßgeblich ist der Bescheid. | Kanzlei | Auswahl: Erstattung, Nachzahlung, ausgeglichen, keine Berechnung | immer | Pflicht | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Betrag laut Steuerberechnung (betrag)<br>Hilfe: Summe aus Einkommensteuer, Solidaritätszuschlag und Kirchensteuer. | Kanzlei | Betrag in Euro | erst wenn bei „Voraussichtliches Ergebnis laut Steuerberechnung“ „Erstattung“ oder „Nachzahlung“ gewählt ist | Pflicht | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Vorgelegte Unterlagen (vorgelegt) | Kanzlei | Mehrfachauswahl: Formularansicht aller Anlagen, Steuerberechnung, Liste der übernommenen Daten Dritter (eDaten), Erläuterungsschreiben, Sonstiges | immer | Pflicht | Nachweis der „leicht nachprüfbaren Form“ (§ 87d Abs. 3 AO) |
| Bezeichnung der Vorlage (vorlageBezeichnung)<br>Hilfe: Zum Beispiel „ESt 2025, Stand 28.10.2026, 34 Seiten“. | Kanzlei | Text | immer | Pflicht | Bezeichnung der vorgelegten Fassung, an die die Freigabe gebunden ist (§ 87d Abs. 3 AO) |
| Datum der Vorlage (vorlageDatum) | Kanzlei | Datum | immer | Pflicht | Unverzügliche Prüfung nachvollziehbar |
| Vorgelegt über (vorgelegtUeber) | Kanzlei | Auswahl: Portal, E-Mail, persönlich in der Kanzlei, Post | immer | optional | Dokumentation |
| Angaben im Freitextfeld für das Finanzamt (freitextFinanzamt)<br>Frage: Enthält die Erklärung Angaben im Freitextfeld für das Finanzamt? | Kanzlei | Ja/Nein | immer | optional | Transparenz für die Mandantin oder den Mandanten (§ 150 Abs. 7 AO) |
| Hinweise der Kanzlei zu dieser Fassung (hinweiseKanzlei)<br>Hilfe: Zum Beispiel offene Punkte, strittige Positionen oder Abweichungen von Ihren Unterlagen. | Kanzlei | Text, mehrzeilig | immer | optional | Information vor der Freigabe |

### 2. Freigabe

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (mandantName) | Mandantin oder Mandant | Text | immer | Pflicht | Abgleich mit der Angabe der Kanzlei |
| Prüfung der vorgelegten Daten (mandantGeprueft)<br>Frage: Haben Sie die vorgelegten Daten auf Vollständigkeit und Richtigkeit geprüft?<br>Hilfe: Prüfen Sie auch die übernommenen Daten Dritter, zum Beispiel die Lohnsteuerbescheinigung: Sie gelten als Ihre Angaben, wenn Sie nichts anderes sagen. | Mandantin oder Mandant | Ja/Nein | immer | Pflicht | Zustimmung zur elektronischen Übermittlung (§ 87d Abs. 3 AO) |
| Alle Unterlagen gegeben (mandantVollstaendig)<br>Frage: Haben Sie der Kanzlei alle Unterlagen und Angaben gegeben, die für diese Erklärung wichtig sind? | Mandantin oder Mandant | Ja/Nein | immer | Pflicht | Vollständigkeit (§ 150 Abs. 2 AO) |
| Ihre Entscheidung (mandantEntscheidung)<br>Hilfe: Ihre Zustimmung gilt nur für die oben bezeichnete Fassung. | Mandantin oder Mandant | Auswahl: Ich stimme der elektronischen Übermittlung zu., Ich stimme noch nicht zu – bitte zuerst ändern. | immer | Pflicht | Zustimmung zur elektronischen Übermittlung (§ 87d Abs. 3 AO) |
| Was soll geändert werden? (mandantAenderung) | Mandantin oder Mandant | Text, mehrzeilig | erst wenn bei „Ihre Entscheidung“ „Ich stimme noch nicht zu – bitte zuerst ändern.“ gewählt ist | Pflicht | Rückmeldung an die Kanzlei |

### 3. Freigabe des Ehegatten oder Lebenspartners

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (ehegatteName) | Ehegatte oder Lebenspartner | Text | immer | Pflicht | Unterschrift mit Namen; Abgleich mit der Angabe der Kanzlei |
| Prüfung der vorgelegten Daten (ehegatteGeprueft)<br>Frage: Haben Sie die vorgelegten Daten auf Vollständigkeit und Richtigkeit geprüft? | Ehegatte oder Lebenspartner | Ja/Nein | immer | Pflicht | Zustimmung zur elektronischen Übermittlung (§ 87d Abs. 3 AO) |
| Ihre Entscheidung (ehegatteEntscheidung)<br>Hilfe: Ihre Zustimmung gilt nur für die oben bezeichnete Fassung. | Ehegatte oder Lebenspartner | Auswahl: Ich stimme der elektronischen Übermittlung zu., Ich stimme noch nicht zu – bitte zuerst ändern. | immer | Pflicht | Zustimmung zur elektronischen Übermittlung (§ 87d Abs. 3 AO) |
| Was soll geändert werden? (ehegatteAenderung) | Ehegatte oder Lebenspartner | Text, mehrzeilig | erst wenn bei „Ihre Entscheidung“ „Ich stimme noch nicht zu – bitte zuerst ändern.“ gewählt ist | Pflicht | Rückmeldung an die Kanzlei |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Erklärungen (Kanzlei; unabhängig)
  - Veranlagungsart (Kanzlei; Ebene 1) – erst wenn bei „Erklärungen“ „Einkommensteuer“ angekreuzt ist
    - Vor- und Familienname des Ehegatten oder Lebenspartners (Kanzlei; Ebene 2) – erst wenn bei „Veranlagungsart“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist
- Voraussichtliches Ergebnis laut Steuerberechnung (Kanzlei; unabhängig)
  - Betrag laut Steuerberechnung (Kanzlei; Ebene 1) – erst wenn bei „Voraussichtliches Ergebnis laut Steuerberechnung“ „Erstattung“ oder „Nachzahlung“ gewählt ist
- Ihre Entscheidung (Mandantin oder Mandant; unabhängig)
  - Was soll geändert werden? (Mandantin oder Mandant; Ebene 1) – erst wenn bei „Ihre Entscheidung“ „Ich stimme noch nicht zu – bitte zuerst ändern.“ gewählt ist
- Ihre Entscheidung (Ehegatte oder Lebenspartner; unabhängig)
  - Was soll geändert werden? (Ehegatte oder Lebenspartner; Ebene 1) – erst wenn bei „Ihre Entscheidung“ „Ich stimme noch nicht zu – bitte zuerst ändern.“ gewählt ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Was Sie mit der Freigabe erklären

- Kenntnisnahme durch: Mandantin oder Mandant
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Die Kanzlei übermittelt Ihre Steuererklärung in Ihrem Auftrag elektronisch an das Finanzamt (§ 87d AO). Vorher legt sie Ihnen die Daten so vor, dass Sie sie leicht prüfen können; Sie müssen sie unverzüglich auf Vollständigkeit und Richtigkeit prüfen (§ 87d Abs. 3 AO).
>
> Es bleibt Ihre Erklärung: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Der Betrag laut Steuerberechnung ist eine Vorausberechnung; maßgeblich ist der Bescheid. Ihre Freigabe gilt nur für die oben bezeichnete Fassung. Nach der Übermittlung erhalten Sie das Übertragungsprotokoll.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Freigabe wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

### Was Sie mit der Freigabe erklären

- Kenntnisnahme durch: Ehegatte oder Lebenspartner
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Die Kanzlei übermittelt Ihre Steuererklärung in Ihrem Auftrag elektronisch an das Finanzamt (§ 87d AO). Vorher legt sie Ihnen die Daten so vor, dass Sie sie leicht prüfen können; Sie müssen sie unverzüglich auf Vollständigkeit und Richtigkeit prüfen (§ 87d Abs. 3 AO).
>
> Es bleibt Ihre Erklärung: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Der Betrag laut Steuerberechnung ist eine Vorausberechnung; maßgeblich ist der Bescheid. Ihre Freigabe gilt nur für die oben bezeichnete Fassung. Nach der Übermittlung erhalten Sie das Übertragungsprotokoll.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Freigabe wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

## Verknüpfung der Teile

- Kanzlei und Mandantin oder Mandant: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Vor- und Familienname der Mandantin oder des Mandanten“ (Kanzlei) und „Ihr Vor- und Familienname“ (Mandantin oder Mandant) sollen übereinstimmen. Sonst: „Der Name weicht zwischen der Vorlage der Kanzlei und der Freigabe ab.“
- „Vor- und Familienname des Ehegatten oder Lebenspartners“ (Kanzlei) und „Ihr Vor- und Familienname“ (Ehegatte oder Lebenspartner) sollen übereinstimmen. Sonst: „Der Name des Ehegatten weicht zwischen der Vorlage der Kanzlei und der Freigabe ab.“

## Zuordnung getrennt eingegangener Teile

- Name: „Vor- und Familienname der Mandantin oder des Mandanten“ (Kanzlei) = „Ihr Vor- und Familienname“ (Mandantin oder Mandant)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). § 87d Abs. 3 AO schreibt für die Zustimmung keine Form vor; nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe.
- Bei Zusammenveranlagung geben beide Ehegatten oder Lebenspartner frei, weil die gemeinsame Erklärung eine Erklärung beider ist (§ 25 Abs. 3 Satz 2 EStG).
- Die Freigabe bindet genau die bezeichnete Fassung: Ändert die Kanzlei danach die Vorlage, ist eine neue Freigabe nötig.
- Dieser Fragebogen ist weder die Steuererklärung noch eine Vollmacht (§ 80 AO).
- Die Kanzlei bewahrt die Freigabe in der Handakte auf (§ 66 StBerG).
