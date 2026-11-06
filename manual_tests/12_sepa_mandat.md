# 12 – SEPA-Basislastschriftmandat

Produktiv seit 05.11.2026, **Fassung 1.1.0 seit 06.11.2026** in der App der Kanzlei und im
Testbereich; die Fälle unten beschreiben sie. Neu in 1.1.0: Die Kanzlei belegt nur vor
– sie ist nie „offen“, ein Link mit ihrem Teil öffnet beim Mandanten gleich dessen Teil, und die
Angaben zum Konto kann der Mandant ändern. Die Mandatsreferenz wird aus der Mandantennummer
vorgeschlagen, Ort und Datum der Unterschrift auch; wer unterschreibt, wird genannt (auch bei zwei
Kontoinhabern). Nur erfundene Daten verwenden; `DE98ZZZ09999999999` ist die Test-Gläubiger-ID der
Deutschen Bundesbank.

---

## MT-119: Stammdaten-Link der Kanzlei für das Mandat

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) und klicken
**„Stammdaten-Link erstellen oder ändern …“**.

**Schritte:**

1. Bei **„Was soll der Link öffnen?“** „einen neuen Fragebogen „SEPA-Basislastschriftmandat““
   wählen.
   - **Danach:** _Nicht offensichtlich:_ Erst jetzt erscheinen Angaben – und nur die des
     SEPA-Mandats („Zahlungsempfänger“, „Vertrag und Mandatsreferenz“ mit der Zahlungsart), keine
     Firma oder Betriebsnummer. **Mandantennummer und Mandatsreferenz fehlen**: Sie gelten nur für
     einen Mandanten und gehören nicht in das Lesezeichen der Kanzlei.
2. Im Abschnitt **„Zahlungsempfänger“** eintragen: Name `Musterkanzlei Beispiel`, Straße
   `Beispielweg 1`, Postleitzahl und Ort `12345 Musterstadt`, Land `Deutschland`.
   - **Danach:** Unter „Ihr Link“ steht ein Link.
3. Bei der Gläubiger-ID `DE97ZZZ09999999999` eintragen.
   - **Danach:** Bei der Gläubiger-ID steht ein Fehler (Prüfziffer falsch); unter „Ihr Link“ steht
     „Bitte erst die markierten Angaben berichtigen.“ statt des Links.
4. Die Gläubiger-ID auf `de98 zzz 0999 9999 999` ändern.
   - **Danach:** Der Fehler verschwindet, der Link ist wieder da. _Nicht offensichtlich:_
     Kleinbuchstaben und Leerzeichen sind erlaubt; gespeichert wird `DE98ZZZ09999999999`.
5. **„Kopieren“** klicken.
   - **Danach:** „Link kopiert.“ Der Link enthält `formular=sepa-mandat`; es erscheint **keine**
     Meldung „Der Link enthält eine unbekannte oder ungültige Angabe.“
6. Den Link in einem neuen Tab öffnen.
   - **Danach:** Oben steht „Neuer Fragebogen „SEPA-Basislastschriftmandat“ aus Ihrem Lesezeichen
     …“. In der Übersicht steht die Kanzlei mit **„nichts vorbelegt (freiwillig)“**, nicht mit
     „noch offen“.
7. **„Ich bin: Kanzlei (Zahlungsempfänger)“** wählen.
   - **Danach:** Die erste Frage, der Name des Zahlungsempfängers, steht schon mit `Musterkanzlei
Beispiel` da, darunter „Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.“
8. Viermal **„Weiter“** klicken.
   - **Danach:** Anschrift, Land und Gläubiger-ID sind ebenso vorbelegt, jeweils mit „Vorbelegt aus
     Ihrem Stammdaten-Link – bitte prüfen.“; die Fragen werden trotzdem gezeigt. Danach kommt die
     Mandantennummer, leer.

---

## MT-120: Die Kanzlei bereitet das Mandat vor und schließt ohne Unterschrift ab

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – Name, Anschrift und
Gläubiger-ID der Kanzlei sind eingetragen; Sie stehen bei der Mandantennummer.

**Schritte:**

1. Mandantennummer `10001` eintragen, **„Weiter“**.
   - **Danach:** Gefragt wird „Wer hat zu zahlen?“.
2. `Erika Musterfrau` eintragen, **„Weiter“**.
   - **Danach:** Bei „Ist die Kontoinhaberin oder der Kontoinhaber identisch mit „Erika Musterfrau“
     oder abweichend?“ ist „identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder
     Kontoinhaber“ vorgewählt.
3. **„Weiter“** klicken.
   - **Danach:** Bei der Zahlungsart ist „wiederkehrende Zahlungen“ vorgewählt – die Banken verlangen
     die Angabe „einmalig oder wiederkehrend“ im Mandat.
4. **„Weiter“** klicken.
   - **Danach:** _Nicht offensichtlich:_ Bei „Mandatsreferenz“ steht im Feld schon `100010000001`
     (Mandantennummer und laufende Nummer `0000001`) mit „Vorschlag aus Ihren Angaben – Sie können
     ihn ändern.“
5. **„Wird separat mitgeteilt“** klicken.
   - **Danach:** Gefragt wird „Welche Angaben zum Konto tragen Sie schon ein?“, nichts ist
     angekreuzt.
6. Nichts ankreuzen, **„Weiter“**.
   - **Danach:** Die Zusammenfassung erscheint, ohne Fragen zum Konto; bei „Mandatsreferenz“ steht
     „–“.
7. Zweimal **„Zurück“** klicken.
   - **Danach:** Bei der Mandatsreferenz ist das Feld **leer** – eine bewusst leer gelassene Antwort
     schlägt die App nicht noch einmal vor.
8. Zweimal **„Weiter“** klicken und in der Zusammenfassung den Abschnitt **„Stammdaten für das
   nächste Mal“** lesen.
   - **Danach:** Der Text nennt die Angaben, die der Link beim nächsten Mal einträgt, und endet mit
     „Der Link enthält nur Angaben aus dem Teil „Kanzlei (Zahlungsempfänger)“.“ **Mandantennummer
     und Mandatsreferenz fehlen** in der Aufzählung und im Link.
9. **„Weiter zum Abschluss“** klicken.
   - **Danach:** Oben steht unter „Das schließen Sie ab:“ alles, was Sie abschließen. Die Seite bietet
     **keine** Unterschrift an, nur den Knopf „Abschließen“ – der Zahlungsempfänger unterschreibt ein
     Mandat nicht.
10. Häkchen setzen, **„Abschließen“**.
    - **Danach:** Darunter **„Als Link weitergeben“** mit einem Link und „Kopieren“.

---

## MT-121: Die Kontoinhaberin erteilt das Mandat

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen (mit Mandatsreferenz `100010000001`, ohne Angaben zum Konto); Sie stehen bei „Wer
füllt jetzt aus?“.

**Schritte:**

1. Die Übersicht ansehen.
   - **Danach:** Die Kanzlei steht mit **„vorbelegt (Fassung 1)“**, nicht mit „abgeschlossen“ oder
     „noch offen“; der Knopf heißt „Abschluss zurücknehmen“ (nicht „Unterschrift zurücknehmen“).
     Gleich unter den Rollen steht „Stand“ mit „PDF erstellen“, „Fragebogen schließen“ und „Als Link
     weitergeben“ und dem Satz „Kann an die nächste Station weitergegeben werden. Bis der Fragebogen
     vollständig ist, fehlt noch: …“ – **nicht** „Für die Lohnabrechnung“.
2. **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen.
   - **Danach:** Der erste Hinweis ist der Mandatstext („Ich/Wir ermächtige(n) …“, mit der
     Acht-Wochen-Frist).
3. Häkchen setzen, **„Weiter“**.
   - **Danach:** Der zweite Hinweis ist der Datenschutz.
4. Häkchen setzen, **„Weiter“**.
   - **Danach:** _Nicht offensichtlich:_ Zahlungsempfänger, Gläubiger-ID, wer zu zahlen hat und die
     Zahlungsart werden **nicht** gefragt. Die erste Frage ist die zum Kontoinhaber, mit
     „identisch“ und „Vorbelegt von Kanzlei (Zahlungsempfänger) – bitte prüfen.“
5. **„Weiter“** klicken.
   - **Danach:** „Gehört das Konto noch einer weiteren Person?“, mit „Nein“ vorgewählt.
6. **„Nein“** klicken.
   - **Danach:** „Liegt die Anschrift im Ausland?“
7. **„Nein“** klicken, Straße `Musterstraße 5`, **„Weiter“**.
   - **Danach:** Gefragt wird die Postleitzahl.
8. Postleitzahl `1234` (vier Ziffern) eintragen, **„Weiter“**.
   - **Danach:** Abgelehnt mit dem Hinweis auf 5 Ziffern, wie im Personalfragebogen.
9. Postleitzahl `12345` eintragen, **„Weiter“**.
   - **Danach:** Gefragt wird der Ort.
10. Ort `Musterstadt`, **„Weiter“**; Bank `Beispielbank`, **„Weiter“**; IBAN
    `DE89 3704 0044 0532 0130 00`, **„Weiter“**.
    - **Danach:** Eine BIC wird bei einer deutschen IBAN nicht gefragt. Bei „Wer unterschreibt das
      Mandat?“ steht schon `Erika Musterfrau` (wer zu zahlen hat) mit „Vorschlag aus Ihren Angaben –
      Sie können ihn ändern.“
11. **„Weiter“** klicken.
    - **Danach:** Bei „Wo unterschreiben Sie?“ steht schon `Musterstadt` (Ort der Anschrift) als
      Vorschlag.
12. **„Weiter“** klicken.
    - **Danach:** Beim Datum der Unterschrift steht schon das heutige Datum als Vorschlag.
13. **„Weiter“** klicken.
    - **Danach:** Die Zusammenfassung: Im Abschnitt „Mandat“ stehen „Musterkanzlei Beispiel“,
      `DE98ZZZ09999999999`, „Erika Musterfrau“ und „wiederkehrende Zahlungen“ mit „festgelegt von:
      Kanzlei (Zahlungsempfänger)“ und **ohne** „ändern“; „Kontoinhaber: identisch …“ hat „ändern
      (vorbelegt von: Kanzlei (Zahlungsempfänger))“. Darunter „Angaben: Kanzlei
      (Zahlungsempfänger) (abgeschlossen, nur lesen)“ mit der Mandatsreferenz `100010000001`.
14. **„Weiter zum Abschluss“** klicken.
    - **Danach:** _Nicht offensichtlich:_ Über dem Häkchen steht unter „Das schließen Sie ab:“
      alles, was Sie unterschreiben – Ihre Angaben und darunter „Angaben: Kanzlei
      (Zahlungsempfänger) (abgeschlossen, nur lesen)“. Deshalb stimmt der Satz am Häkchen „Ich
      erteile das SEPA-Basislastschriftmandat mit den Angaben oben.“
15. Häkchen setzen, **„Namen tippen“**, `Erika Musterfrau`, **„Unterschreiben und abschließen“**.
    - **Danach:** „Kontoinhaberin oder Kontoinhaber: abgeschlossen“ mit „Unterschrieben am …“.
16. **„PDF erstellen“** klicken und die PDF öffnen.
    - **Danach:** Die PDF zeigt beide Teile; an der Unterschrift der Kontoinhaberin steht ihr Name
      „Erika Musterfrau“.

---

## MT-122: Gemeinschaftskonto – die zweite Person unterschreibt mit

**Einstieg:** [Gemeinschaftskonto öffnen](start:sepa-gemeinschaftskonto) – Kanzlei und erste
Kontoinhaberin sind fertig; das Konto gehört auch Max Mustermann, beide dürfen nur gemeinsam
verfügen.

**Schritte:**

1. Die Übersicht „Wer füllt jetzt aus?“ ansehen.
   - **Danach:** Die zweite Kontoinhaberin oder der zweite Kontoinhaber wird als **nötig**
     angezeigt.
2. **„Ich bin: Zweite Kontoinhaberin oder zweiter Kontoinhaber“** wählen; bei beiden Hinweisen das
   Häkchen setzen und **„Weiter“**.
   - **Danach:** Gefragt wird **nur** „Wie heißen Sie?“; im Feld steht schon `Max Mustermann` mit
     „Vorbelegt von Kontoinhaberin oder Kontoinhaber – bitte prüfen.“ Zahlungsempfänger und
     Gläubiger-ID werden nicht gefragt.
3. **„Weiter“** klicken.
   - **Danach:** Die Zusammenfassung.
4. **„Weiter zum Abschluss“** klicken.
   - **Danach:** Über dem Häkchen stehen alle Angaben: Ihr Name, darunter die abgeschlossenen Teile
     der Kanzlei und der ersten Kontoinhaberin (mit Konto und IBAN) – „die Angaben oben“ sind also
     wirklich oben zu sehen (seit 06.11.2026).
5. Häkchen setzen, **„Namen tippen“**, `Max Mustermann`, **„Unterschreiben und abschließen“**.
   - **Danach:** Es fehlt keine Rolle mehr; an der zweiten Unterschrift steht „Max Mustermann“.

---

## MT-123: Ohne den Teil der Kanzlei

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“).

**Schritte:**

1. Auf der Startseite **„SEPA-Basislastschriftmandat“** wählen.
   - **Danach:** In der Übersicht steht die Kanzlei mit „nichts vorbelegt (freiwillig)“; unter
     „Stand“ fehlt sie **nicht** als Teil.
2. **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen; bei beiden Hinweisen das Häkchen setzen
   und **„Weiter“**.
   - **Danach:** _Nicht offensichtlich:_ Ohne den Teil der Kanzlei fragt das Mandat
     Zahlungsempfänger, Gläubiger-ID, Vertrag und Zahlungsart selbst; die erste Frage ist „An wen
     erteilen Sie das Mandat?“.
3. **„Vorerst überspringen“** klicken.
   - **Danach:** Gefragt wird die Gläubiger-Identifikationsnummer.
4. `DE97ZZZ09999999999` eintragen, **„Weiter“**.
   - **Danach:** Abgelehnt mit einem Hinweis auf die falsche Prüfziffer.
5. **„Zur Zusammenfassung – alle Angaben ansehen und ändern“** klicken.
   - **Danach:** Oben steht „Das fehlt noch, bevor Sie abschließen können:“ mit den fehlenden
     Angaben, darunter „Zahlungsempfänger“, je mit „beantworten“; „Weiter zum Abschluss“ ist
     gesperrt – ein Mandat ohne Zahlungsempfänger lässt sich nicht unterschreiben.

---

## MT-124: Den Teil der Kanzlei als Link statt als PDF weitergeben

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen; Sie stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. In der Übersicht unter „Stand“ bei **„Als Link weitergeben“** auf **„Kopieren“** klicken.
   - **Danach:** „Link kopiert.“ Der Link ist gut 1.000 Zeichen lang und enthält `#weitergabe=1`.
     _Nicht offensichtlich:_ Den Link gibt es in der Übersicht und auf der Abschluss-Seite (seit
     06.11.2026).
2. Ein **privates Fenster** öffnen (wie ein anderes Gerät) und den Link dort in die Adresszeile
   einfügen.
   - **Danach:** „Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.“ und
     „Aus einem Link zur Weitergabe geöffnet.“ _Nicht offensichtlich:_ Es kommt **keine** Übersicht
     „Wer füllt jetzt aus?“ – der Fragebogen öffnet gleich im Teil der Kontoinhaberin, beim
     Mandatstext. Die Adresszeile zeigt **nur noch die Adresse der App**, ohne den langen Teil hinter
     „#“.
3. Bei beiden Hinweisen das Häkchen setzen und **„Weiter“**.
   - **Danach:** Zahlungsempfänger und Gläubiger-ID werden nicht gefragt; die erste Frage ist die zum
     Kontoinhaber, mit „identisch“ vorbelegt.
4. **„Weiter“**; bei der weiteren Person **„Nein“**; bei „Liegt die Anschrift im Ausland?“
   **„Nein“**; Straße `Musterstraße 5`, **„Weiter“**; Postleitzahl `12345`, **„Weiter“**; Ort
   `Musterstadt`, **„Weiter“**; Bank `Beispielbank`, **„Weiter“**; IBAN
   `DE89 3704 0044 0532 0130 00`, **„Weiter“**.
   - **Danach:** Bei „Wer unterschreibt das Mandat?“ steht `Erika Musterfrau` als Vorschlag.
5. Dreimal **„Weiter“** (Name, Ort, Datum stehen als Vorschlag da).
   - **Danach:** Die Zusammenfassung mit allen Angaben und dem Teil der Kanzlei.
6. Im privaten Fenster den Link noch einmal einfügen, dabei aber die letzten 20 Zeichen löschen.
   - **Danach:** Rot: „Link zur Weitergabe: Der Link ist unvollständig oder beschädigt – vielleicht
     wurde er beim Kopieren abgeschnitten. …“ – nichts wird halb übernommen.

**Erwartet:**

- _Nicht offensichtlich:_ Ein Fragebogen mit vielen Angaben oder einer gezeichneten Unterschrift (z. B.
  die fertige Sofortmeldung) bietet keinen Link an; dort steht „Für einen Link sind es zu viele
  Angaben. Bitte die PDF weitergeben.“ Der Link enthält alle Angaben wie die PDF – nur an die Person
  schicken, die als Nächstes ausfüllt.

---

## MT-125: Die Kanzlei trägt die Angaben zum Konto ein

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – Name, Anschrift und
Gläubiger-ID der Kanzlei sind eingetragen; Sie stehen bei der Mandantennummer.

**Schritte:**

1. Mandantennummer `10001`, **„Weiter“**; `Erika Musterfrau`, **„Weiter“**; Kontoinhaber
   **„Weiter“**; Zahlungsart **„Weiter“**; Mandatsreferenz (Vorschlag) **„Weiter“**.
   - **Danach:** Gefragt wird „Welche Angaben zum Konto tragen Sie schon ein?“, nichts ist
     angekreuzt.
2. Nichts ankreuzen, **„Weiter“**.
   - **Danach:** Die Zusammenfassung erscheint – ohne Kreuz fragt die App nichts zum Konto.
3. **„Zurück“** klicken, nur **„Bankverbindung (Bank, IBAN, BIC)“** ankreuzen, **„Weiter“**.
   - **Danach:** Jetzt fragt die App nach dem Namen der Bank – nach der Anschrift nicht.
4. Bank `Beispielbank`, **„Weiter“**; IBAN `DE89 3704 0044 0532 0130 00`, **„Weiter“**.
   - **Danach:** Die Zusammenfassung, mit Bank und IBAN.
5. Bei „Von der Kanzlei eingetragen“ auf **„ändern“** klicken, zusätzlich **„Anschrift …“**
   ankreuzen, **„Weiter“**.
   - **Danach:** Jetzt fragt die App „Liegt die Anschrift … im Ausland?“. _Nicht offensichtlich:_
     Nach einem Namen wird die Kanzlei nicht gefragt – bei „identisch“ ist es der Name bei „Wer hat
     zu zahlen?“.
6. **„Nein“**; Straße `Musterstraße 5`, **„Weiter“**; Postleitzahl `12345`, **„Weiter“**; Ort
   `Musterstadt`, **„Weiter“**; weiter bis zur Zusammenfassung.
   - **Danach:** Die Zusammenfassung zeigt Anschrift, Bank und IBAN.
7. **„Weiter zum Abschluss“**, Häkchen, **„Abschließen“**.
   - **Danach:** „Kanzlei (Zahlungsempfänger): abgeschlossen“. Wie die Kontoinhaberin diese
     Vorbelegung sieht und ändert, prüft MT-129.

---

## MT-126: Anschrift im Ausland

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen, ohne Angaben zum Konto.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**; bei beiden Hinweisen Häkchen und **„Weiter“**;
   Kontoinhaber **„Weiter“**; bei der weiteren Person **„Nein“**.
   - **Danach:** „Liegt die Anschrift im Ausland?“
2. **„Nein“** klicken, Straße `Musterstraße 5`, **„Weiter“**; Postleitzahl `12345`, **„Weiter“**.
   - **Danach:** Gefragt wird der Ort.
3. So oft **„Zurück“** klicken, bis „Liegt die Anschrift im Ausland?“ erscheint, dann **„Ja“**.
   - **Danach:** Gefragt wird der Staat, nicht die deutsche Postleitzahl.
4. Beim Staat `Öster` tippen und **„Österreich“** wählen, **„Weiter“**; Straße **„Weiter“**.
   - **Danach:** Gefragt wird „Postleitzahl (Ausland)“ – **ohne** „(freiwillig)“ und **ohne** den
     Knopf „Keine Postleitzahl“: In Österreich gibt es Postleitzahlen, die Angabe ist Pflicht
     (seit 06.11.2026).
5. Ohne Eingabe auf **„Weiter“** schauen.
   - **Danach:** „Weiter“ ist ausgegraut.
6. Postleitzahl `123` eintragen, **„Weiter“**.
   - **Danach:** Die Postleitzahl wird angenommen; dazu erscheint der Hinweis „Die Postleitzahl hat
     nicht das übliche Format dieses Staats. Bitte prüfen.“ (Österreich: 4 Ziffern). _Nicht
     offensichtlich:_ Der Hinweis sperrt nichts – wie im Personalfragebogen.
7. So oft **„Zurück“** klicken, bis der Staat gefragt wird, `Hongkong` tippen und **„Hongkong“** wählen, **„Weiter“**;
   Straße **„Weiter“**.
   - **Danach:** Jetzt steht bei der Postleitzahl „(freiwillig)“, und es gibt den Knopf **„Keine
     Postleitzahl“**: Hongkong hat keine Postleitzahlen (Liste mit Quellen:
     `docs/quellen-staaten-ohne-postleitzahl.md`).
8. Das Feld leeren und **„Keine Postleitzahl“** klicken.
   - **Danach:** Gefragt wird der Ort.
9. Ort `Hongkong`, **„Weiter“**; Bank `Beispielbank`, **„Weiter“**; IBAN
   `DE89 3704 0044 0532 0130 00`, **„Weiter“**; bei „Wer unterschreibt das Mandat?“ **„Weiter“**.
   - **Danach:** Bei „Wo unterschreiben Sie?“ steht schon `Hongkong` als Vorschlag.
10. Zweimal **„Weiter“** bis zur Zusammenfassung.
    - **Danach:** _Nicht offensichtlich:_ Ein Kasten „Verworfene Angaben: Ihre Voraussetzung gilt
      nicht mehr, deshalb fallen sie beim Unterschreiben weg. Ändern Sie die Antwort zurück, sind sie
      wieder da:“ nennt die deutsche Postleitzahl aus Schritt 2.

---

## MT-127: Abweichender Kontoinhaber

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – Name, Anschrift und
Gläubiger-ID der Kanzlei sind eingetragen; Sie stehen bei der Mandantennummer.

**Schritte:**

1. Mandantennummer `10001`, **„Weiter“**; „Wer hat zu zahlen?“ `Beispiel GmbH`, **„Weiter“**.
   - **Danach:** Gefragt wird, ob der Kontoinhaber identisch oder abweichend ist.
2. **„abweichend – das Konto gehört einer anderen Person“** wählen; Zahlungsart **„Weiter“**;
   Mandatsreferenz **„Weiter“**.
   - **Danach:** Gefragt wird „Welche Angaben zum Konto tragen Sie schon ein?“.
3. Nichts ankreuzen, **„Weiter“**.
   - **Danach:** _Nicht offensichtlich:_ Die Zusammenfassung erscheint – die Kanzlei-Seite fragt
     **nicht** nach dem Namen des Kontoinhabers, solange nichts angekreuzt ist; den trägt der
     Kontoinhaber selbst ein (wie der Vordruck „vom Kontoinhaber abweichender Schuldner“).
4. **„Weiter zum Abschluss“**, Häkchen, **„Abschließen“**, dann **„Gerät weitergeben – zur
   Übersicht“**.
   - **Danach:** Die Übersicht „Wer füllt jetzt aus?“.
5. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**; bei beiden Hinweisen Häkchen und **„Weiter“**;
   Kontoinhaber („abweichend“, vorbelegt) **„Weiter“**.
   - **Danach:** Gefragt wird der **Name** der Kontoinhaberin.
6. Name `Erika Musterfrau`, **„Weiter“**.
   - **Danach:** Gefragt wird eine **E-Mail-Adresse für die Ankündigung der Abbuchungen** (oder
     „Lieber per Post“).
7. `erika@example.org`, **„Weiter“**; bei der weiteren Person **„Nein“**; Anschrift: **„Nein“**,
   Straße `Musterstraße 5`, Postleitzahl `12345`, Ort `Musterstadt`, Bank `Beispielbank`, IBAN
   `DE89 3704 0044 0532 0130 00`, jeweils **„Weiter“**.
   - **Danach:** Bei „Wer unterschreibt das Mandat?“ steht `Erika Musterfrau` (die
     Kontoinhaberin), nicht „Beispiel GmbH“.
8. Dreimal **„Weiter“**, **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“**
   `Erika Musterfrau`, **„Unterschreiben und abschließen“**.
   - **Danach:** „Kontoinhaberin oder Kontoinhaber: abgeschlossen“ mit „Unterschrieben am …“.
9. In der Übersicht unter „Stand“ **„PDF erstellen“**, dann **„Fragebogen schließen“**.
   - **Danach:** Die Startseite.
10. Weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken, **„Dateien
    hinzufügen …“** und die PDF aus Schritt 9 wählen.
    - **Danach:** In der Kanzlei steht unter „Prüfhinweise:“ „Abweichender Kontoinhaber: Die
      Vorabankündigung jeder Lastschrift geht an den Kontoinhaber …“; ohne Widerspruch.

---

## MT-128: Zwei Kontoinhaber, jede Person darf allein – eine Unterschrift mit Namen

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen, ohne Angaben zum Konto.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**; bei beiden Hinweisen Häkchen und **„Weiter“**;
   Kontoinhaber **„Weiter“**.
   - **Danach:** „Gehört das Konto noch einer weiteren Person?“
2. **„Ja“** klicken.
   - **Danach:** Gefragt wird der Name der weiteren Person.
3. `Max Mustermann`, **„Weiter“**.
   - **Danach:** Gefragt wird „Darf jede Person allein über das Konto verfügen oder nur beide
     gemeinsam?“.
4. **„jede Person allein – eine Unterschrift genügt“** wählen.
   - **Danach:** „Liegt die Anschrift im Ausland?“
5. **„Nein“**; Straße `Musterstraße 5`, Postleitzahl `12345`, Ort `Musterstadt`, Bank
   `Beispielbank`, IBAN `DE89 3704 0044 0532 0130 00`, jeweils **„Weiter“**.
   - **Danach:** Bei „Wer unterschreibt das Mandat?“ steht `Erika Musterfrau` (wer zu zahlen hat)
     als Vorschlag.
6. Den Namen auf `Max Mustermann` ändern (er füllt aus), **„Weiter“**; Ort und Datum **„Weiter“**.
   - **Danach:** Die Zusammenfassung, bei „Name der unterschreibenden Person“ „Max Mustermann“.
7. **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“** `Max Mustermann`, **„Unterschreiben und
   abschließen“**, dann **„Gerät weitergeben – zur Übersicht“**.
   - **Danach:** Der Teil ist unterschrieben; die zweite Kontoinhaberin oder der zweite
     Kontoinhaber ist **nicht** nötig (grau, „Nur nötig, wenn …“). An der Unterschrift steht „Max
     Mustermann“.
8. Beim Kontoinhaber **„Unterschrift zurücknehmen“**, bis zur Abschluss-Seite **„Weiter“**,
   Häkchen, **„Namen tippen“** `Erika Musterfrau`, **„Unterschreiben und abschließen“**.
   - **Danach:** _Nicht offensichtlich:_ Die Unterschrift gilt, danach erscheint aber „Der getippte
     Name weicht vom angegebenen Namen ab. Bitte prüfen.“ – getippter Name und „Wer unterschreibt
     das Mandat?“ passen nicht zusammen.

---

## MT-129: Die Kontoinhaberin ändert die IBAN, die die Kanzlei vorbelegt hat

**Einstieg:** [Mandat mit vorbelegtem Konto öffnen](start:sepa-kanzlei-konto-vorbelegt) – die Kanzlei
hat Anschrift, Bank und IBAN der Kontoinhaberin vorbelegt und abgeschlossen; Sie stehen bei „Wer
füllt jetzt aus?“.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**; bei beiden Hinweisen Häkchen und **„Weiter“**;
   Kontoinhaber **„Weiter“**; bei der weiteren Person **„Nein“**.
   - **Danach:** „Liegt die Anschrift im Ausland?“ steht mit „Nein“ und „Vorbelegt von Kanzlei
     (Zahlungsempfänger) – bitte prüfen.“ da.
2. **„Nein“** klicken.
   - **Danach:** _Nicht offensichtlich:_ Die Straße wird **gefragt**, mit `Musterstraße 5` im Feld
     und „Vorbelegt von Kanzlei (Zahlungsempfänger) – bitte prüfen.“ – die Kontoinhaberin kann jede
     Vorbelegung zum Konto ändern.
3. Bei Straße, Postleitzahl, Ort und Bank jeweils **„Weiter“**.
   - **Danach:** Die IBAN steht mit `DE89370400440532013000` und „Vorbelegt von Kanzlei
     (Zahlungsempfänger) – bitte prüfen.“ da.
4. Die IBAN auf `DE02 1203 0000 0000 2020 51` ändern, **„Weiter“**.
   - **Danach:** Gefragt wird „Wer unterschreibt das Mandat?“.
5. Dreimal **„Weiter“** (Name, Ort, Datum).
   - **Danach:** In der Zusammenfassung stehen Anschrift und Bank mit „ändern (vorbelegt von:
     Kanzlei (Zahlungsempfänger))“, die IBAN `DE02 1203 0000 0000 2020 51` nur mit „ändern“.
6. **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“** `Erika Musterfrau`, **„Unterschreiben und
   abschließen“**, dann **„Gerät weitergeben – zur Übersicht“**.
   - **Danach:** Die Übersicht; unter „Stand“ ist **„PDF erstellen“** bereit.
7. In der Übersicht unter „Stand“ **„PDF erstellen“**, dann **„Fragebogen schließen“**.
   - **Danach:** Die Startseite.
8. Weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken, **„Dateien
   hinzufügen …“** und die PDF aus Schritt 7 wählen.
   - **Danach:** Unter „Prüfhinweise:“ steht „„IBAN“ geändert: Kanzlei (Zahlungsempfänger) hatte
     „DE89 3704 0044 0532 0130 00“ vorbelegt, im Teil „Kontoinhaberin oder Kontoinhaber“ steht jetzt
     „DE02 1203 0000 0000 2020 51“.“ – **kein** Widerspruch. Das Mandat gilt mit der neuen IBAN.
