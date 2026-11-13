# Feldkatalog: SEPA-Basislastschriftmandat

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | sepa-mandat, Version 1.2.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Datum“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 13.11.2026 um 12:28 |
| Definition (SHA-256) | a35dba73d28b9e2edfa1b937f589883da6fb1d934af3910722b2d46ede1100d6 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für ein SEPA-Lastschriftmandat schreibt das Gesetz keine besondere Form vor. Deshalb unterschreiben Sie hier mit einer einfachen elektronischen Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Das Mandat gilt nur für die Angaben, die Sie vor dem Unterschreiben in der Zusammenfassung sehen. |
| Empfänger | Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Kanzlei (Zahlungsempfänger) (kanzlei) | keine | freiwillig – belegt nur Angaben der anderen vor | – | Wir legen das Lastschriftmandat mit diesen Angaben zum Zahlungsempfänger und zum Vertrag vor. |
| Kontoinhaberin oder Kontoinhaber (kontoinhaber) | Pflicht | immer | aus „Name der unterschreibenden Person“ | Ich erteile das SEPA-Basislastschriftmandat mit den Angaben oben. |
| Zweite Kontoinhaberin oder zweiter Kontoinhaber (mitinhaber) | Pflicht | nur wenn bei „Verfügung über das Konto“ „nur beide gemeinsam – beide unterschreiben“ gewählt ist (nach dem abgeschlossenen Teil, der das angibt)<br>Warum: Dürfen über das Konto nur beide Kontoinhaber gemeinsam verfügen, braucht auch das Mandat beide Unterschriften. | aus „Ihr Vor- und Familienname“ | Ich erteile das SEPA-Basislastschriftmandat mit den Angaben oben. |

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
| Mandantennummer (mandantennummer) | Kanzlei (Zahlungsempfänger) | Text, nur Ziffern | immer | optional | Zuordnung in der Kanzlei |
| Zahlungspflichtig (Vertrag mit) (mandantName)<br>Frage: Wer hat zu zahlen?<br>Hilfe: Vor- und Familienname oder Firma der Mandantin oder des Mandanten, deren Rechnungen eingezogen werden. | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | immer | Pflicht | Vertrag, dessen Rechnungen eingezogen werden; Zuordnung des Mandats |
| Kontoinhaber (kontoinhaberArt)<br>Frage: Ist die Kontoinhaberin oder der Kontoinhaber identisch mit „‹Zahlungspflichtig (Vertrag mit)›“ oder abweichend?<br>Hilfe: Abweichend zum Beispiel beim Konto des Ehegatten, der Eltern oder einer Firma: Dann erteilt die Kontoinhaberin oder der Kontoinhaber das Mandat für den Vertrag mit „‹Zahlungspflichtig (Vertrag mit)›“ und nennt den eigenen Namen. | Kanzlei (Zahlungsempfänger) | Auswahl: identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber, abweichend – das Konto gehört einer anderen Person; vorbelegt: identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber | immer | Pflicht | Kennzeichnet einen vom Zahlungspflichtigen abweichenden Kontoinhaber (Vordruck „vom Kontoinhaber abweichender Schuldner“) |
| Zahlungsart (zahlungsart)<br>Frage: Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige?<br>Hilfe: Für laufende Rechnungen wiederkehrend. Die Banken verlangen diese Angabe im Mandat. | Kanzlei (Zahlungsempfänger) | Auswahl: wiederkehrende Zahlungen, eine einmalige Zahlung; vorbelegt: wiederkehrende Zahlungen; Stammdatum „lastschriftZahlungsart“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Pflichtangabe des Mandats: Kennzeichnung als einmalige oder wiederkehrende Zahlung (Bedingungen der Banken für die SEPA-Basislastschrift, Nr. 2.2.1) |
| Mandatsreferenz (mandatsreferenz)<br>Hilfe: Je Mandat eine eigene, höchstens 35 Zeichen. Ist eine Mandantennummer angegeben, schlägt die App sie mit der laufenden Nummer 0000001 vor; für ein weiteres Mandat derselben Person zählen Sie weiter (0000002). Steht sie noch nicht fest, lassen Sie das Feld leer: Dann teilen Sie sie vor der ersten Abbuchung mit.<br>Knöpfe: „Wird separat mitgeteilt“ (leer lassen)<br>Vorschlag im Eingabefeld: „‹Mandantennummer›“0000001 | Kanzlei (Zahlungsempfänger) | Text, Mandatsreferenz (höchstens 35 Zeichen) | immer | optional | Kennung des Mandats in jeder Lastschrift (SEPA-Regelwerk) |

### 3. Angaben zum Konto, die die Kanzlei einträgt

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Von der Kanzlei eingetragen (kontoVorab)<br>Frage: Welche Angaben zum Konto tragen Sie schon ein?<br>Hilfe: Zum Beispiel aus den Stammdaten des Mandanten. Was Sie eintragen, sieht die Kontoinhaberin oder der Kontoinhaber vorbelegt und kann es vor dem Unterschreiben ändern; eine Änderung zeigt Ihnen die App beim Eingang als Hinweis. Was Sie nicht ankreuzen, trägt sie oder er selbst ein. | Kanzlei (Zahlungsempfänger) | Mehrfachauswahl: Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name), Bankverbindung (Bank, IBAN, BIC) | immer | optional | Entscheidet, welche Angaben zum Konto die Kanzlei vorbelegt |
| Name der Kontoinhaberin oder des Kontoinhabers (khName)<br>Hilfe: So, wie die Bank das Konto führt; bei einem Konto einer Firma oder eines Vereins dessen Name. | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist und bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist<br>Warum: Nur bei einem abweichenden Kontoinhaber, wenn die Kanzlei Name und Anschrift einträgt; sonst ist es der Name bei „Wer hat zu zahlen?“. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |

### 4. Anschrift der Kontoinhaberin oder des Kontoinhabers (von der Kanzlei)

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland? (khAnschriftAusland)<br>Hilfe: Davon hängt ab, wie nach Staat und Postleitzahl gefragt wird: Eine deutsche Postleitzahl hat 5 Ziffern und wird geprüft, eine ausländische nur für einige Staaten und nur als Hinweis. | Kanzlei (Zahlungsempfänger) | Ja/Nein | erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist<br>Warum: Nur wenn die Kanzlei Name und Anschrift einträgt. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| Staat (khAnschriftStaat)<br>Frage: In welchem Staat liegt die Anschrift?<br>Hilfe: Tippen Sie die ersten Buchstaben und wählen Sie aus der Liste. | Kanzlei (Zahlungsempfänger) | Auswahl: aus der Liste „Staaten und Gebiete außer Deutschland“ (258 Einträge; DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)) | erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Ja“ beantwortet ist<br>Warum: Bei einer Anschrift in Deutschland steht der Staat fest; nur eine Anschrift im Ausland braucht ihn. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| Straße und Hausnummer (khStrasse) | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist<br>Warum: Nur wenn die Kanzlei Name und Anschrift einträgt. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| Postleitzahl (khPostleitzahl)<br>Hilfe: 5 Ziffern. | Kanzlei (Zahlungsempfänger) | Text, deutsche Postleitzahl (5 Ziffern) | erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Nein“ beantwortet ist<br>Warum: Eine deutsche Postleitzahl hat immer 5 Ziffern und wird darauf geprüft. Deshalb wird sie nur bei einer Anschrift in Deutschland so gefragt. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| Postleitzahl (Ausland) (khPostleitzahlAusland)<br>Hilfe: So, wie sie in dem Staat geschrieben wird. Gibt es in dem Staat keine Postleitzahlen, klicken Sie „Keine Postleitzahl“.<br>Knöpfe: „Keine Postleitzahl“ (leer lassen) | Kanzlei (Zahlungsempfänger) | Text, höchstens 10 Zeichen | erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Ja“ beantwortet ist<br>Warum: Postleitzahlen im Ausland haben andere Formate; für einige Staaten prüft die App das Format als Hinweis. Pflicht ist sie, außer in Staaten ohne Postleitzahlen. | Pflicht, wenn nicht zutrifft, dass bei „Staat“ ein Eintrag gewählt ist, der zu „Staaten ohne Postleitzahlen“ gehört | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| Ort (khOrt) | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist<br>Warum: Nur wenn die Kanzlei Name und Anschrift einträgt. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |

### 5. Bankverbindung (von der Kanzlei)

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Name des Kreditinstituts (khKreditinstitut) | Kanzlei (Zahlungsempfänger) | Text, höchstens 70 Zeichen | erst wenn bei „Von der Kanzlei eingetragen“ „Bankverbindung (Bank, IBAN, BIC)“ angekreuzt ist<br>Warum: Nur wenn die Kanzlei die Bankverbindung einträgt. | optional | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| IBAN (khIban) | Kanzlei (Zahlungsempfänger) | IBAN | erst wenn bei „Von der Kanzlei eingetragen“ „Bankverbindung (Bank, IBAN, BIC)“ angekreuzt ist<br>Warum: Nur wenn die Kanzlei die Bankverbindung einträgt. | Pflicht | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |
| BIC (khBic)<br>Hilfe: Nur für ein Konto außerhalb Deutschlands, wenn die Bank sie angibt.<br>Knöpfe: „Nicht nötig“ (leer lassen) | Kanzlei (Zahlungsempfänger) | Text, BIC (8 oder 11 Stellen) | erst wenn „IBAN“ ausgefüllt ist und nicht zutrifft, dass „IBAN“ mit „DE“ beginnt<br>Warum: Für ein deutsches Konto genügt die IBAN; für ein Konto im Ausland kann die Lastschrift die BIC brauchen. | optional | Vorbelegung des Mandats aus den Unterlagen der Kanzlei |

### 6. Mandat

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Zahlungsempfänger (zahlungsempfaenger)<br>Frage: An wen erteilen Sie das Mandat?<br>Hilfe: Den Namen nennt Ihnen die Kanzlei, zum Beispiel in ihrem Anschreiben. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Name des Zahlungsempfängers“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Zahlungsempfänger nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Zahlungsempfänger im Mandat (SEPA-Regelwerk) |
| Gläubiger-Identifikationsnummer (zahlungsempfaengerGlaeubigerId)<br>Frage: Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers?<br>Hilfe: Sie steht im Anschreiben der Kanzlei, zum Beispiel DE98ZZZ09999999999. | Kontoinhaberin oder Kontoinhaber | Text, Gläubiger-Identifikationsnummer (mit Prüfziffer) | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Gläubiger-Identifikationsnummer“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Die Gläubiger-Identifikationsnummer nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Kennung des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |
| Zahlungspflichtig (Vertrag mit) (vertragMit)<br>Frage: Wer hat zu zahlen?<br>Hilfe: Vor- und Familienname oder Firma der Mandantin oder des Mandanten bei „‹Zahlungsempfänger›“, deren Rechnungen eingezogen werden – auch dann, wenn das Konto jemand anderem gehört. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Zahlungspflichtig (Vertrag mit)“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Für welchen Vertrag das Mandat gilt, nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Vertrag, dessen Rechnungen eingezogen werden |
| Kontoinhaber (mandatKontoinhaberArt)<br>Frage: Ist die Kontoinhaberin oder der Kontoinhaber identisch mit „‹Zahlungspflichtig (Vertrag mit)›“ oder abweichend? | Kontoinhaberin oder Kontoinhaber | Auswahl: identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber, abweichend – das Konto gehört einer anderen Person | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („Kontoinhaber“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Ob der Kontoinhaber abweicht, belegt die Kanzlei vor; liegt ihr Teil vor, steht es schon da und kann geändert werden. | Pflicht | Kennzeichnet einen vom Zahlungspflichtigen abweichenden Kontoinhaber |
| Zahlungsart (mandatZahlungsart)<br>Frage: Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige? | Kontoinhaberin oder Kontoinhaber | Auswahl: wiederkehrende Zahlungen, eine einmalige Zahlung | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Zahlungsart“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Die Zahlungsart legt die Kanzlei fest; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Pflichtangabe des Mandats: einmalige oder wiederkehrende Zahlung (Bedingungen der Banken für die SEPA-Basislastschrift, Nr. 2.2.1) |

### 7. Kontoinhaberin oder Kontoinhaber

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Vor- und Familienname (Kontoinhaber) (kontoinhaberName)<br>Frage: Wie heißt die Kontoinhaberin oder der Kontoinhaber?<br>Hilfe: So, wie die Bank das Konto führt; bei einem Konto einer Firma oder eines Vereins dessen Name. | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | erst wenn bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist<br>Belegt Kanzlei (Zahlungsempfänger) vor („Name der Kontoinhaberin oder des Kontoinhabers“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Ist die Kontoinhaberin oder der Kontoinhaber identisch, ist es der Name bei „Wer hat zu zahlen?“; nur ein abweichender Kontoinhaber nennt den eigenen Namen. Hat die Kanzlei ihn eingetragen, steht er schon da und kann geändert werden. | Pflicht | Zahler im Mandat (SEPA-Regelwerk) |
| E-Mail für die Ankündigung der Abbuchungen (kontoinhaberEmail)<br>Frage: An welche E-Mail-Adresse soll die Kanzlei die Abbuchungen vorher ankündigen?<br>Hilfe: Die Kanzlei kündigt jede Abbuchung mit Betrag und Tag vorher an – bei einem abweichenden Kontoinhaber Ihnen, nicht nur der Mandantin oder dem Mandanten. Ohne E-Mail-Adresse kommt die Ankündigung per Post.<br>Knöpfe: „Lieber per Post“ (leer lassen) | Kontoinhaberin oder Kontoinhaber | Text, E-Mail-Adresse | erst wenn bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist<br>Warum: Die Vorabankündigung geht an den Kontoinhaber; ist er nicht der Zahlungspflichtige, erhält er die Rechnungen nicht und braucht sie gesondert. | optional | Vorabankündigung jeder Lastschrift an den Kontoinhaber (SEPA-Regelwerk für die Basislastschrift, Abschnitte 4.1 und 4.3) |
| Weitere Kontoinhaberin oder weiterer Kontoinhaber (weitereKontoinhaber)<br>Frage: Gehört das Konto noch einer weiteren Person?<br>Hilfe: Zum Beispiel ein Gemeinschaftskonto von Eheleuten. | Kontoinhaberin oder Kontoinhaber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Kontoinhaber im Mandat; entscheidet, ob eine zweite Unterschrift nötig sein kann |
| Vor- und Familienname (weitere Kontoinhaberin oder weiterer Kontoinhaber) (weitererKontoinhaberName)<br>Frage: Wie heißt die weitere Person, der das Konto gehört? | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | erst wenn „Weitere Kontoinhaberin oder weiterer Kontoinhaber“ mit „Ja“ beantwortet ist<br>Warum: Nur ein Konto, das mehreren gehört, hat eine weitere Kontoinhaberin oder einen weiteren Kontoinhaber. | Pflicht | Kontoinhaber im Mandat |
| Verfügung über das Konto (verfuegung)<br>Frage: Darf jede Person allein über das Konto verfügen oder nur beide gemeinsam?<br>Hilfe: So, wie es mit der Bank vereinbart ist. Bei „nur beide gemeinsam“ unterschreibt die weitere Person das Mandat auch. | Kontoinhaberin oder Kontoinhaber | Auswahl: jede Person allein – eine Unterschrift genügt, nur beide gemeinsam – beide unterschreiben | erst wenn „Weitere Kontoinhaberin oder weiterer Kontoinhaber“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einem Konto, das mehreren gehört, kann die Bank beide Unterschriften verlangen. | Pflicht | Entscheidet, ob die weitere Kontoinhaberin oder der weitere Kontoinhaber mit unterschreibt |

### 8. Anschrift

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Liegt die Anschrift im Ausland? (anschriftAusland)<br>Hilfe: Diese Frage steht am Anfang der Anschrift, weil davon abhängt, wie nach Staat und Postleitzahl gefragt wird: Eine deutsche Postleitzahl hat 5 Ziffern und wird geprüft, eine ausländische nur für einige Staaten und nur als Hinweis. | Kontoinhaberin oder Kontoinhaber | Ja/Nein | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Hat die Kanzlei die Anschrift eingetragen, steht sie schon da und kann geändert werden. | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Staat (anschriftStaat)<br>Frage: In welchem Staat liegt die Anschrift?<br>Hilfe: Tippen Sie die ersten Buchstaben und wählen Sie aus der Liste. | Kontoinhaberin oder Kontoinhaber | Auswahl: aus der Liste „Staaten und Gebiete außer Deutschland“ (258 Einträge; DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)) | erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist<br>Belegt Kanzlei (Zahlungsempfänger) vor („Staat“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Bei einer Anschrift in Deutschland steht der Staat fest; nur eine Anschrift im Ausland braucht ihn. Hat die Kanzlei ihn eingetragen, steht er schon da und kann geändert werden. | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Straße und Hausnummer (kontoinhaberStrasse) | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („Straße und Hausnummer“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Hat die Kanzlei die Anschrift eingetragen, steht sie schon da und kann geändert werden. | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Postleitzahl (postleitzahl)<br>Hilfe: 5 Ziffern. | Kontoinhaberin oder Kontoinhaber | Text, deutsche Postleitzahl (5 Ziffern) | erst wenn „Liegt die Anschrift im Ausland?“ mit „Nein“ beantwortet ist<br>Belegt Kanzlei (Zahlungsempfänger) vor („Postleitzahl“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Eine deutsche Postleitzahl hat immer 5 Ziffern und wird darauf geprüft. Deshalb wird sie nur bei einer Anschrift in Deutschland so gefragt. Hat die Kanzlei sie eingetragen, steht sie schon da und kann geändert werden. | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Postleitzahl (Ausland) (postleitzahlAusland)<br>Hilfe: So, wie sie in dem Staat geschrieben wird. Gibt es in dem Staat keine Postleitzahlen, klicken Sie „Keine Postleitzahl“.<br>Knöpfe: „Keine Postleitzahl“ (leer lassen) | Kontoinhaberin oder Kontoinhaber | Text, höchstens 10 Zeichen | erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist<br>Belegt Kanzlei (Zahlungsempfänger) vor („Postleitzahl (Ausland)“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Postleitzahlen im Ausland haben andere Formate; für einige Staaten prüft die App das Format als Hinweis. Hat die Kanzlei sie eingetragen, steht sie schon da und kann geändert werden. Pflicht ist sie, außer in Staaten ohne Postleitzahlen. | Pflicht, wenn nicht zutrifft, dass bei „Staat“ ein Eintrag gewählt ist, der zu „Staaten ohne Postleitzahlen“ gehört | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |
| Ort (kontoinhaberOrt) | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („Ort“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Hat die Kanzlei die Anschrift eingetragen, steht sie schon da und kann geändert werden. | Pflicht | Anschrift des Zahlers im Mandat (SEPA-Regelwerk) |

### 9. Bankverbindung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Name des Kreditinstituts (kreditinstitut)<br>Frage: Bei welcher Bank ist das Konto? | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („Name des Kreditinstituts“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Hat die Kanzlei die Bank eingetragen, steht sie schon da und kann geändert werden. | optional | Zuordnung des Kontos; für den Einzug genügt die IBAN |
| IBAN (iban)<br>Frage: Von welchem Konto soll abgebucht werden?<br>Hilfe: Die IBAN steht zum Beispiel auf der Bankkarte, im Online-Banking oder auf einem Kontoauszug. | Kontoinhaberin oder Kontoinhaber | IBAN | immer<br>Belegt Kanzlei (Zahlungsempfänger) vor („IBAN“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Hat die Kanzlei die IBAN eingetragen, steht sie schon da und kann geändert werden. | Pflicht | Konto, von dem die Lastschriften eingezogen werden |
| BIC (bic)<br>Frage: Wie lautet die BIC der Bank?<br>Hilfe: Nur für ein Konto außerhalb Deutschlands. Im SEPA-Raum genügt meist die IBAN; nennen Sie die BIC, wenn Ihre Bank sie angibt.<br>Knöpfe: „Nicht nötig“ (leer lassen) | Kontoinhaberin oder Kontoinhaber | Text, BIC (8 oder 11 Stellen) | erst wenn „IBAN“ ausgefüllt ist und nicht zutrifft, dass „IBAN“ mit „DE“ beginnt<br>Belegt Kanzlei (Zahlungsempfänger) vor („BIC“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Für ein deutsches Konto genügt die IBAN. Für ein Konto im Ausland, vor allem außerhalb des Europäischen Wirtschaftsraums, kann die Lastschrift die BIC brauchen. Hat die Kanzlei sie eingetragen, steht sie schon da und kann geändert werden. | optional | Einzug von einem Konto im Ausland |

### 10. Unterschrift

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Name der unterschreibenden Person (unterzeichnerName)<br>Frage: Wer unterschreibt das Mandat?<br>Hilfe: Vor- und Familienname. Gehört das Konto zwei Personen, die Person, die jetzt unterschreibt; bei einem Konto einer Firma oder eines Vereins die Person, die für sie unterschreibt. Dieser Name steht an der Unterschrift.<br>Vorschlag im Eingabefeld: „‹Vor- und Familienname (Kontoinhaber)›“, sonst „‹Zahlungspflichtig (Vertrag mit)›“ | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Wer das Mandat unterschreibt (Name an der Unterschrift) |
| Ort (unterschriftOrt)<br>Frage: Wo unterschreiben Sie?<br>Vorschlag im Eingabefeld: „‹Ort›“ | Kontoinhaberin oder Kontoinhaber | Text, höchstens 70 Zeichen | immer | Pflicht | Ort der Unterschrift im Mandat |
| Datum (unterschriftDatum)<br>Frage: Datum der Unterschrift<br>Vorschlag im Eingabefeld: das heutige Datum | Kontoinhaberin oder Kontoinhaber | Datum, spätestens heute | immer | Pflicht | Datum der Unterschrift (Ausstellungsdatum des Mandats, das jede Lastschrift nennt); Stichtag dieser Fassung |

### 11. Zweite Kontoinhaberin oder zweiter Kontoinhaber

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (mitinhaberName)<br>Frage: Wie heißen Sie?<br>Hilfe: Vor- und Familienname. Dieser Name steht an Ihrer Unterschrift. | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Belegt Kontoinhaberin oder Kontoinhaber vor („Vor- und Familienname (weitere Kontoinhaberin oder weiterer Kontoinhaber)“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Den Namen hat die erste unterschreibende Person schon als weitere Kontoinhaberin oder weiteren Kontoinhaber genannt; er steht da und kann geändert werden. | Pflicht | Unterschrift mit Namen |
| Zahlungsempfänger (mitinhaberZahlungsempfaenger)<br>Frage: An wen erteilen Sie das Mandat? | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Name des Zahlungsempfängers“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Zahlungsempfänger nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Zahlungsempfänger im Mandat (SEPA-Regelwerk) |
| Gläubiger-Identifikationsnummer (mitinhaberGlaeubigerId)<br>Frage: Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers? | Zweite Kontoinhaberin oder zweiter Kontoinhaber | Text, Gläubiger-Identifikationsnummer (mit Prüfziffer) | immer<br>Legt Kanzlei (Zahlungsempfänger) fest („Gläubiger-Identifikationsnummer“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Die Gläubiger-Identifikationsnummer nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Kennung des Zahlungsempfängers im Mandat (SEPA-Regelwerk) |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Kontoinhaber (Kanzlei (Zahlungsempfänger); unabhängig)
- Von der Kanzlei eingetragen (Kanzlei (Zahlungsempfänger); unabhängig)
  - Name der Kontoinhaberin oder des Kontoinhabers (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist und bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist
  - Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland? (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist
    - Staat (Kanzlei (Zahlungsempfänger); Ebene 2) – erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Ja“ beantwortet ist
    - Postleitzahl (Kanzlei (Zahlungsempfänger); Ebene 2) – erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Nein“ beantwortet ist
    - Postleitzahl (Ausland) (Kanzlei (Zahlungsempfänger); Ebene 2) – erst wenn „Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?“ mit „Ja“ beantwortet ist
  - Straße und Hausnummer (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist
  - Ort (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Anschrift der Kontoinhaberin oder des Kontoinhabers (bei einem abweichenden Kontoinhaber auch der Name)“ angekreuzt ist
  - Name des Kreditinstituts (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Bankverbindung (Bank, IBAN, BIC)“ angekreuzt ist
  - IBAN (Kanzlei (Zahlungsempfänger); Ebene 1) – erst wenn bei „Von der Kanzlei eingetragen“ „Bankverbindung (Bank, IBAN, BIC)“ angekreuzt ist
    - BIC (Kanzlei (Zahlungsempfänger); Ebene 2) – erst wenn „IBAN“ ausgefüllt ist und nicht zutrifft, dass „IBAN“ mit „DE“ beginnt
- Kontoinhaber (Kontoinhaberin oder Kontoinhaber; unabhängig)
  - Vor- und Familienname (Kontoinhaber) (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist
  - E-Mail für die Ankündigung der Abbuchungen (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist
- Weitere Kontoinhaberin oder weiterer Kontoinhaber (Kontoinhaberin oder Kontoinhaber; unabhängig)
  - Vor- und Familienname (weitere Kontoinhaberin oder weiterer Kontoinhaber) (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „Weitere Kontoinhaberin oder weiterer Kontoinhaber“ mit „Ja“ beantwortet ist
  - Verfügung über das Konto (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „Weitere Kontoinhaberin oder weiterer Kontoinhaber“ mit „Ja“ beantwortet ist
- Liegt die Anschrift im Ausland? (Kontoinhaberin oder Kontoinhaber; unabhängig)
  - Staat (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist
  - Postleitzahl (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Nein“ beantwortet ist
  - Postleitzahl (Ausland) (Kontoinhaberin oder Kontoinhaber; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist
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
- Stand: 13.11.2026

> Verantwortlich ist die Kanzlei, die Ihnen dieses Mandat vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Sie verwendet Ihre Angaben, um mit Ihrem Mandat ihre Rechnungen per Lastschrift einzuziehen (Art. 6 Abs. 1 Buchst. b DSGVO), und gibt sie dafür an ihre Bank weiter. Zahlen Sie für den Vertrag einer anderen Person, verarbeitet die Kanzlei Ihre Angaben, um die Zahlungen aus diesem Vertrag einzuziehen; das ist ihr berechtigtes Interesse (Art. 6 Abs. 1 Buchst. f DSGVO). Sie bewahrt das Mandat auf, solange es gilt, und danach, solange sie es zum Nachweis braucht. Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App versendet nichts; Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben. Damit eine versehentliche Unterbrechung nichts kostet, merkt sich die Online-Fassung einen angefangenen Fragebogen im Browser dieses Geräts – bis die PDF erstellt oder der Fragebogen verworfen ist, höchstens 7 Tage. Beim Aufruf der Seite verarbeitet der Webserver wie bei jeder Website technische Zugriffsdaten (siehe Datenschutzerklärung der Website).

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
- Stand: 13.11.2026

> Verantwortlich ist die Kanzlei, die Ihnen dieses Mandat vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Sie verwendet Ihre Angaben, um mit Ihrem Mandat ihre Rechnungen per Lastschrift einzuziehen (Art. 6 Abs. 1 Buchst. b DSGVO), und gibt sie dafür an ihre Bank weiter. Zahlen Sie für den Vertrag einer anderen Person, verarbeitet die Kanzlei Ihre Angaben, um die Zahlungen aus diesem Vertrag einzuziehen; das ist ihr berechtigtes Interesse (Art. 6 Abs. 1 Buchst. f DSGVO). Sie bewahrt das Mandat auf, solange es gilt, und danach, solange sie es zum Nachweis braucht. Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App versendet nichts; Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben. Damit eine versehentliche Unterbrechung nichts kostet, merkt sich die Online-Fassung einen angefangenen Fragebogen im Browser dieses Geräts – bis die PDF erstellt oder der Fragebogen verworfen ist, höchstens 7 Tage. Beim Aufruf der Seite verarbeitet der Webserver wie bei jeder Website technische Zugriffsdaten (siehe Datenschutzerklärung der Website).

## Verknüpfung der Teile

- Kanzlei (Zahlungsempfänger) und Kontoinhaberin oder Kontoinhaber: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Name des Zahlungsempfängers“ (Kanzlei (Zahlungsempfänger)) und „Zahlungsempfänger“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Der Zahlungsempfänger im Mandat weicht von den Angaben der Kanzlei ab.“
- „Gläubiger-Identifikationsnummer“ (Kanzlei (Zahlungsempfänger)) und „Gläubiger-Identifikationsnummer“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Die Gläubiger-Identifikationsnummer im Mandat weicht von den Angaben der Kanzlei ab.“
- „Zahlungspflichtig (Vertrag mit)“ (Kanzlei (Zahlungsempfänger)) und „Zahlungspflichtig (Vertrag mit)“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Der Vertrag, für den das Mandat gilt, weicht von den Angaben der Kanzlei ab.“
- „Zahlungsart“ (Kanzlei (Zahlungsempfänger)) und „Zahlungsart“ (Kontoinhaberin oder Kontoinhaber) sollen übereinstimmen. Sonst: „Die Zahlungsart im Mandat weicht von den Angaben der Kanzlei ab.“
- „Name des Zahlungsempfängers“ (Kanzlei (Zahlungsempfänger)) und „Zahlungsempfänger“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber) sollen übereinstimmen. Sonst: „Der Zahlungsempfänger im Mandat der zweiten Kontoinhaberin oder des zweiten Kontoinhabers weicht von den Angaben der Kanzlei ab.“
- „Gläubiger-Identifikationsnummer“ (Kanzlei (Zahlungsempfänger)) und „Gläubiger-Identifikationsnummer“ (Zweite Kontoinhaberin oder zweiter Kontoinhaber) sollen übereinstimmen. Sonst: „Die Gläubiger-Identifikationsnummer im Mandat der zweiten Kontoinhaberin oder des zweiten Kontoinhabers weicht von den Angaben der Kanzlei ab.“

## Zuordnung getrennt eingegangener Teile

- Vertrag mit: „Zahlungspflichtig (Vertrag mit)“ (Kanzlei (Zahlungsempfänger)) = „Zahlungspflichtig (Vertrag mit)“ (Kontoinhaberin oder Kontoinhaber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Prüfhinweise für den Empfänger (Kanzlei)

Nur Hinweise: Sie blockieren nichts und werden nicht unterschrieben. Sie erscheinen bei der Zusammenführung, sobald alle genannten Teile vorliegen.

- „Das Land im BIC passt nicht zum Land der IBAN. Bitte BIC und IBAN vergleichen.“ – wenn das Land von „BIC“ nicht zu „IBAN“ passt (ISO 9362; ISO 13616) – wird auch der ausfüllenden Person angezeigt
- „Die Postleitzahl hat nicht das übliche Format dieses Staats. Bitte prüfen.“ – wenn „Postleitzahl (Ausland)“ nicht dem Format der Postleitzahlen von „Staat“ entspricht (Gemeinsames Rundschreiben Meldeverfahren, Anlage 18) – wird auch der ausfüllenden Person angezeigt
- „Abweichender Kontoinhaber: Die Vorabankündigung jeder Lastschrift geht an den Kontoinhaber (Anschrift oder E-Mail im Mandat), nicht nur an den Zahlungspflichtigen. In der Lastschrift kann der Zahlungspflichtige als abweichender Zahlungspflichtiger (Ultimate Debtor) stehen.“ – wenn bei „Kontoinhaber“ „abweichend – das Konto gehört einer anderen Person“ gewählt ist (SEPA-Regelwerk für die Basislastschrift, Abschnitte 4.1, 4.3 und 4.8.21)

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen zieht kein Geld ein und gibt nichts an eine Bank weiter; er dokumentiert das Mandat.
- Nur SEPA-Basislastschrift. Für die SEPA-Firmenlastschrift gilt ein eigenes Mandat, das auch die Bank des Zahlers bestätigt.
- Die Kanzlei füllt zuerst aus. Wer als Kontoinhaber ohne ihren Teil beginnt, trägt Zahlungsempfänger und Gläubiger-Identifikationsnummer selbst ein; weichen sie später von den Angaben der Kanzlei ab, zeigt die App einen Widerspruch.
- Was die Kanzlei zum Konto einträgt, ist eine Vorbelegung: Die Kontoinhaberin oder der Kontoinhaber sieht sie, kann sie ändern und unterschreibt; eine Änderung zeigt die App der Kanzlei als Hinweis. Zahlungsempfänger, Gläubiger-Identifikationsnummer, Vertrag, Zahlungsart, Mandantennummer und Mandatsreferenz stehen dagegen fest.
- Die Bedingungen der Banken verlangen das Mandat „schriftlich oder in der mit der Bank vereinbarten Art und Weise“. Ob eine Bank die Unterschrift in dieser App als schriftlich ansieht, regelt diese App nicht; im Zweifel bleibt das Papier.
- Höchstens zwei Kontoinhaber unterschreiben; verlangt ein Konto mehr Unterschriften, bleibt das Papier.
- Die Mandatsreferenz prüft die App nur auf Länge und Zeichen; ob sie eindeutig ist, weiß nur der Zahlungsempfänger.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung).
- Die Erstattung einer Lastschrift kann innerhalb von acht Wochen ab der Belastung verlangt werden (§ 675x Abs. 2 und 4 BGB).
- Der Zahlungsempfänger kündigt jede Lastschrift vorher mit Betrag und Fälligkeit an; ohne andere Vereinbarung mindestens 14 Kalendertage vor der Fälligkeit (SEPA-Regelwerk für die Basislastschrift, Abschnitt 4.3).
- Reicht der Zahlungsempfänger 36 Monate lang keine Lastschrift auf dieses Mandat ein – gerechnet ab der letzten eingereichten, auch wenn sie zurückgegeben wurde –, muss er es löschen; für weitere Lastschriften braucht es dann ein neues Mandat (SEPA-Regelwerk für die Basislastschrift, Abschnitt 4.2).
- Dieses Mandat gilt für die SEPA-Basislastschrift, nicht für die SEPA-Firmenlastschrift.
