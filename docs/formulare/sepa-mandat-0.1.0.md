# Feldkatalog: SEPA-Basislastschriftmandat

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | sepa-mandat, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Datum“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 05.11.2026 um 10:30 |
| Definition (SHA-256) | 4239c956558f14ee39cff954ca022199586e1efdd3e426ae0c59aad6aa96c627 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für ein SEPA-Lastschriftmandat schreibt das Gesetz keine besondere Form vor. Deshalb unterschreiben Sie hier mit einer einfachen elektronischen Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Das Mandat gilt nur für die Angaben, die Sie vor dem Unterschreiben in der Zusammenfassung sehen. |
| Empfänger | Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Kanzlei (Zahlungsempfänger) (kanzlei) | keine | immer | – | Wir legen das Lastschriftmandat mit diesen Angaben zum Zahlungsempfänger und zum Vertrag vor. |
| Kontoinhaberin oder Kontoinhaber (kontoinhaber) | Pflicht | immer | – | Ich erteile das SEPA-Basislastschriftmandat mit den Angaben oben. |
| Zweite Kontoinhaberin oder zweiter Kontoinhaber (mitinhaber) | Pflicht | nur wenn „Zweite Unterschrift nötig“ mit „Ja“ beantwortet ist (nach dem abgeschlossenen Teil, der das angibt)<br>Warum: Dürfen über das Konto nur beide Inhaber gemeinsam verfügen, braucht auch das Mandat beide Unterschriften. | aus „Ihr Vor- und Familienname“ | Ich erteile das SEPA-Basislastschriftmandat mit den Angaben oben. |

## Felder

### 1. Zahlungsempfänger

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Name des Zahlungsempfängers (glaeubigerName)<br>Hilfe: So, wie er im Mandat stehen soll. Am einfachsten aus Ihrem Stammdaten-Link. | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen; Stammdatum „glaeubigerName“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Zahlungsempfänger im Mandat (SEPA-Regelwerk) |
| Straße und Hausnummer des Zahlungsempfängers (glaeubigerStrasse) | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen; Stammdatum „glaeubigerStrasse“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Anschrift des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| Postleitzahl und Ort des Zahlungsempfängers (glaeubigerPlzOrt) | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen; Stammdatum „glaeubigerPlzOrt“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Anschrift des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| Land des Zahlungsempfängers (glaeubigerLand)<br>Knöpfe: „Deutschland“ | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen; Stammdatum „glaeubigerLand“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Anschrift des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| Gläubiger-Identifikationsnummer (glaeubigerId)<br>Hilfe: Sie steht in der Mitteilung der Deutschen Bundesbank über die Vergabe, zum Beispiel DE98ZZZ09999999999. | Kanzlei (Zahlungsempfänger) | Text, Gläubiger-Identifikationsnummer (mit Prüfziffer); Stammdatum „glaeubigerId“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Kennung des Zahlungsempfängers im Mandat und in jeder Lastschrift (SEPA-Regelwerk) |

### 2. Vertrag und Mandatsreferenz

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandantennummer (mandantennummer) | Kanzlei (Zahlungsempfänger) | Text, nur Ziffern; Stammdatum „mandantennummer“, kann im Stammdaten-Link gemerkt werden | immer | optional | Zuordnung in der Kanzlei |
| Vertrag mit (mandantName)<br>Frage: Für den Vertrag mit wem gilt das Mandat?<br>Hilfe: Vor- und Familienname oder Firma der Mandantin oder des Mandanten. Das Konto darf einer anderen Person gehören. | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | immer | Pflicht | Vertrag, dessen Rechnungen eingezogen werden; Zuordnung des Mandats |
| Mandatsreferenz (mandatsreferenz)<br>Hilfe: Je Mandat eine eigene, höchstens 35 Zeichen. Steht sie noch nicht fest, lassen Sie das Feld leer: Dann teilen Sie sie vor der ersten Abbuchung mit.<br>Knöpfe: „Wird separat mitgeteilt“ (leer lassen) | Kanzlei (Zahlungsempfänger) | Text, Mandatsreferenz (höchstens 35 Zeichen); Stammdatum „mandatsreferenz“, kann im Stammdaten-Link gemerkt werden | immer | optional | Kennung des Mandats in jeder Lastschrift (SEPA-Regelwerk) |

### 3. Mandat

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Zahlungsempfänger (zahlungsempfaenger)<br>Frage: An wen erteilen Sie das Mandat?<br>Hilfe: Den Namen nennt Ihnen die Kanzlei, zum Beispiel in ihrem Anschreiben. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Name des Zahlungsempfängers“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Zahlungsempfänger nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Zahlungsempfänger im Mandat (SEPA-Regelwerk) |
| Gläubiger-Identifikationsnummer (zahlungsempfaengerGlaeubigerId)<br>Frage: Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers?<br>Hilfe: Sie steht im Anschreiben der Kanzlei, zum Beispiel DE98ZZZ09999999999. | Kontoinhaberin oder Kontoinhaber | Text, Gläubiger-Identifikationsnummer (mit Prüfziffer) | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Gläubiger-Identifikationsnummer“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Die Gläubiger-Identifikationsnummer nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Kennung des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| Vertrag mit (vertragMit)<br>Frage: Für den Vertrag mit wem gilt das Mandat?<br>Hilfe: Vor- und Familienname oder Firma der Mandantin oder des Mandanten bei „‹Zahlungsempfänger›“ – auch dann, wenn das Konto jemand anderem gehört. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Vertrag mit“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Für welchen Vertrag das Mandat gilt, nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Vertrag, dessen Rechnungen eingezogen werden |

### 4. Kontoinhaberin oder Kontoinhaber

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Vor- und Familienname (Kontoinhaber) (kontoinhaberName)<br>Frage: Wie heißt die Kontoinhaberin oder der Kontoinhaber?<br>Hilfe: So, wie die Bank das Konto führt; bei einem Konto einer Firma oder eines Vereins dessen Name. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Zahler im Mandat (SEPA-Regelwerk) |
| Straße und Hausnummer (kontoinhaberStrasse) | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Postleitzahl und Ort (kontoinhaberPlzOrt) | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Land (kontoinhaberLand)<br>Knöpfe: „Deutschland“ | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |

### 5. Bankverbindung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Name des Kreditinstituts (kreditinstitut)<br>Frage: Bei welcher Bank ist das Konto? | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | optional | Zuordnung des Kontos; für den Einzug genügt die IBAN |
| IBAN (iban)<br>Frage: Von welchem Konto soll abgebucht werden?<br>Hilfe: Die IBAN steht zum Beispiel auf der Bankkarte, im Online-Banking oder auf einem Kontoauszug. | Kontoinhaberin oder Kontoinhaber | IBAN | immer | Pflicht | Konto, von dem die Lastschriften eingezogen werden |
| BIC (bic)<br>Frage: Wie lautet die BIC der Bank?<br>Hilfe: Nur für ein Konto außerhalb Deutschlands. Im SEPA-Raum genügt meist die IBAN; nennen Sie die BIC, wenn Ihre Bank sie angibt.<br>Knöpfe: „Nicht nötig“ (leer lassen) | Kontoinhaberin oder Kontoinhaber | Text, BIC (8 oder 11 Stellen) | erst wenn „IBAN“ ausgefüllt ist und nicht zutrifft, dass „IBAN“ mit „DE“ beginnt<br>Warum: Für ein deutsches Konto genügt die IBAN. Für ein Konto im Ausland, vor allem außerhalb des Europäischen Wirtschaftsraums, kann die Lastschrift die BIC brauchen. | optional | Einzug von einem Konto im Ausland |
| Zweite Unterschrift nötig (zweiteUnterschrift)<br>Frage: Dürfen über das Konto nur zwei Personen gemeinsam verfügen?<br>Hilfe: Zum Beispiel ein Gemeinschaftskonto, für das die Bank beide Unterschriften verlangt. Dann unterschreibt die zweite Person das Mandat auch. Darf jede allein verfügen, antworten Sie „Nein“. | Kontoinhaberin oder Kontoinhaber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Entscheidet, ob eine zweite Kontoinhaberin oder ein zweiter Kontoinhaber unterschreibt |

### 6. Ort und Datum

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ort (unterschriftOrt)<br>Frage: Wo unterschreiben Sie? | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Ort der Unterschrift im Mandat |
| Datum (unterschriftDatum)<br>Frage: Datum der Unterschrift | Kontoinhaberin oder Kontoinhaber | Datum, spätestens heute | immer | Pflicht | Datum der Unterschrift im Mandat; Stichtag dieser Fassung |

### 7. Zweite Kontoinhaberin oder zweiter Kontoinhaber

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (mitinhaberName) | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Unterschrift mit Namen |
| Zahlungsempfänger (mitinhaberZahlungsempfaenger)<br>Frage: An wen erteilen Sie das Mandat? | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Name des Zahlungsempfängers“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Zahlungsempfänger nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Zahlungsempfänger im Mandat (SEPA-Regelwerk) |
| Gläubiger-Identifikationsnummer (mitinhaberGlaeubigerId)<br>Frage: Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers? | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, Gläubiger-Identifikationsnummer (mit Prüfziffer) | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Gläubiger-Identifikationsnummer“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Die Gläubiger-Identifikationsnummer nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Kennung des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| IBAN (mitinhaberIban)<br>Frage: Von welchem Konto soll abgebucht werden? | Zweite Kontoinhaberin oder zweiter Kontoinhaber | IBAN | immer<br>Legt Kontoinhaberin oder Kontoinhaber fest („IBAN“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Das Konto nennt die erste Kontoinhaberin oder der erste Kontoinhaber; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Konto, von dem die Lastschriften eingezogen werden |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- IBAN (Kontoinhaberin oder Kontoinhaber; unabhängig)
  - BIC (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „IBAN“ ausgefüllt ist und nicht zutrifft, dass „IBAN“ mit „DE“ beginnt

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### SEPA-Basislastschriftmandat

- Kenntnisnahme durch: Kontoinhaberin oder Kontoinhaber
- Art: wird in der App gelesen und bestätigt
- Stand: 05.11.2026

> Ich/Wir ermächtige(n) den in diesem Mandat genannten Zahlungsempfänger, Zahlungen von meinem/unserem Konto mittels Lastschrift einzuziehen. Zugleich weise(n) ich/wir mein/unser Kreditinstitut an, die von dem Zahlungsempfänger auf mein/unser Konto gezogenen Lastschriften einzulösen.
>
> Hinweis: Ich kann/Wir können innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem/unserem Kreditinstitut vereinbarten Bedingungen.
>
> Zahlungsempfänger, Gläubiger-Identifikationsnummer und Mandatsreferenz stehen in den Angaben der Kanzlei; Sie sehen sie vor dem Unterschreiben in der Zusammenfassung. Fehlt dort die Mandatsreferenz, teilt die Kanzlei sie Ihnen vor der ersten Abbuchung mit.

### Datenschutz

- Kenntnisnahme durch: Kontoinhaberin oder Kontoinhaber
- Art: wird in der App gelesen und bestätigt
- Stand: 05.11.2026

> Verantwortlich ist die Kanzlei, die Ihnen dieses Mandat vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Sie verwendet Ihre Angaben, um ihre Rechnungen per Lastschrift einzuziehen (Art. 6 Abs. 1 Buchst. b DSGVO), und gibt sie dafür an ihre Bank weiter. Sie bewahrt das Mandat auf, solange es gilt, und danach, solange sie es zum Nachweis braucht. Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

### SEPA-Basislastschriftmandat

- Kenntnisnahme durch: Zweite Kontoinhaberin oder zweiter Kontoinhaber
- Art: wird in der App gelesen und bestätigt
- Stand: 05.11.2026

> Ich/Wir ermächtige(n) den in diesem Mandat genannten Zahlungsempfänger, Zahlungen von meinem/unserem Konto mittels Lastschrift einzuziehen. Zugleich weise(n) ich/wir mein/unser Kreditinstitut an, die von dem Zahlungsempfänger auf mein/unser Konto gezogenen Lastschriften einzulösen.
>
> Hinweis: Ich kann/Wir können innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem/unserem Kreditinstitut vereinbarten Bedingungen.
>
> Zahlungsempfänger, Gläubiger-Identifikationsnummer und Mandatsreferenz stehen in den Angaben der Kanzlei, das Konto in den Angaben der ersten Kontoinhaberin oder des ersten Kontoinhabers; Sie sehen beides vor dem Unterschreiben in der Zusammenfassung.

### Datenschutz

- Kenntnisnahme durch: Zweite Kontoinhaberin oder zweiter Kontoinhaber
- Art: wird in der App gelesen und bestätigt
- Stand: 05.11.2026

> Verantwortlich ist die Kanzlei, die Ihnen dieses Mandat vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Sie verwendet Ihre Angaben, um ihre Rechnungen per Lastschrift einzuziehen (Art. 6 Abs. 1 Buchst. b DSGVO), und gibt sie dafür an ihre Bank weiter. Sie bewahrt das Mandat auf, solange es gilt, und danach, solange sie es zum Nachweis braucht. Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

## Verknüpfung der Teile

- Kanzlei (Zahlungsempfänger) und Kontoinhaberin oder Kontoinhaber: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Name des Zahlungsempfängers“ (Kanzlei (Zahlungsempfänger)) und „Zahlungsempfänger“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Der Zahlungsempfänger im Mandat weicht von den Angaben der Kanzlei ab.“
- „Gläubiger-Identifikationsnummer“ (Kanzlei (Zahlungsempfänger)) und „Gläubiger-Identifikationsnummer“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Die Gläubiger-Identifikationsnummer im Mandat weicht von den Angaben der Kanzlei ab.“
- „Vertrag mit“ (Kanzlei (Zahlungsempfänger)) und „Vertrag mit“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Der Vertrag, für den das Mandat gilt, weicht von den Angaben der Kanzlei ab.“
- „Name des Zahlungsempfängers“ (Kanzlei (Zahlungsempfänger)) und „Zahlungsempfänger“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber) sollen übereinstimmen. Sonst: „Der Zahlungsempfänger im Mandat der zweiten Kontoinhaberin oder des zweiten Kontoinhabers weicht von den Angaben der Kanzlei ab.“
- „Gläubiger-Identifikationsnummer“ (Kanzlei (Zahlungsempfänger)) und „Gläubiger-Identifikationsnummer“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber) sollen übereinstimmen. Sonst: „Die Gläubiger-Identifikationsnummer im Mandat der zweiten Kontoinhaberin oder des zweiten Kontoinhabers weicht von den Angaben der Kanzlei ab.“
- „IBAN“ (Kontoinhaberin oder Kontoinhaber) und „IBAN“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber) sollen übereinstimmen. Sonst: „Die IBAN weicht zwischen den beiden Kontoinhabern ab.“

## Zuordnung getrennt eingegangener Teile

- Vertrag mit: „Vertrag mit“ (Kanzlei (Zahlungsempfänger)) = „Vertrag mit“ (Kontoinhaberin oder Kontoinhaber)
- IBAN: „IBAN“ (Kontoinhaberin oder Kontoinhaber) = „IBAN“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Prüfhinweise für den Empfänger (Kanzlei)

Nur Hinweise: Sie blockieren nichts und werden nicht unterschrieben. Sie erscheinen bei der Zusammenführung, sobald alle genannten Teile vorliegen.

- „Das Land im BIC passt nicht zum Land der IBAN. Bitte BIC und IBAN vergleichen.“ – wenn das Land von „BIC“ nicht zu „IBAN“ passt (ISO 9362; ISO 13616) – wird auch der ausfüllenden Person angezeigt

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen zieht kein Geld ein und gibt nichts an eine Bank weiter; er dokumentiert das Mandat.
- Nur SEPA-Basislastschrift. Für die SEPA-Firmenlastschrift gilt ein eigenes Mandat, das auch die Bank des Zahlers bestätigt.
- Die Kanzlei füllt zuerst aus. Wer als Kontoinhaber ohne ihren Teil beginnt, trägt Zahlungsempfänger und Gläubiger-Identifikationsnummer selbst ein; weichen sie später von den Angaben der Kanzlei ab, zeigt die App einen Widerspruch.
- Für ein Mandat, das nicht auf Papier unterschrieben ist, gelten die Bedingungen, die der Zahlungsempfänger mit seiner Bank vereinbart hat.
- Höchstens zwei Kontoinhaber unterschreiben; verlangt ein Konto mehr Unterschriften, bleibt das Papier.
- Die Mandatsreferenz prüft die App nur auf Länge und Zeichen; ob sie eindeutig ist, weiß nur der Zahlungsempfänger.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung).
- Die Erstattung einer Lastschrift kann innerhalb von acht Wochen ab der Belastung verlangt werden (§ 675x Abs. 2 und 4 BGB).
- Der Zahlungsempfänger kündigt jede Lastschrift vorher mit Betrag und Fälligkeit an; ohne andere Vereinbarung mindestens 14 Kalendertage vorher (SEPA-Regelwerk).
- Ein Mandat, auf das 36 Monate lang keine Lastschrift eingezogen wurde, gilt nicht mehr (SEPA-Regelwerk).
- Dieses Mandat gilt für die SEPA-Basislastschrift, nicht für die SEPA-Firmenlastschrift.
