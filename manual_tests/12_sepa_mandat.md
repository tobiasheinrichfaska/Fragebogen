# 12 – SEPA-Basislastschriftmandat

Produktiv seit 05.11.2026 (Fassung 1.0.0) in der App der Kanzlei. **Im Testbereich steht schon die
Fassung 1.1.0 (Entwurf)**; die Fälle unten beschreiben sie. Neu in 1.1.0: Die Kanzlei belegt nur vor
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
   `Beispielweg 1`, Postleitzahl und Ort `12345 Musterstadt`, Land `Deutschland`, Gläubiger-ID
   `DE97ZZZ09999999999`.
   - **Achten Sie gleich auf:** Bei der Gläubiger-ID erscheint sofort ein Fehler (Prüfziffer
     falsch); unter „Ihr Link“ steht „Bitte erst die markierten Angaben berichtigen.“
3. Die Gläubiger-ID auf `de98 zzz 0999 9999 999` ändern.
   - **Achten Sie gleich auf:** Der Fehler verschwindet. _Nicht offensichtlich:_ Kleinbuchstaben
     und Leerzeichen sind erlaubt; gespeichert wird `DE98ZZZ09999999999`.
4. **„Kopieren“** klicken.
   - **Danach:** Der Link enthält `formular=sepa-mandat`; es erscheint **keine** Meldung „Der Link
     enthält eine unbekannte oder ungültige Angabe.“
5. Den Link in einem neuen Tab öffnen und die Übersicht ansehen.
   - **Danach:** Oben steht „Neuer Fragebogen „SEPA-Basislastschriftmandat“ aus Ihrem Lesezeichen
     …“. In der Übersicht steht die Kanzlei mit **„nichts vorbelegt (freiwillig)“**, nicht mit
     „noch offen“.
6. **„Ich bin: Kanzlei (Zahlungsempfänger)“** wählen.
   - **Danach:** Name, Anschrift, Land und Gläubiger-ID sind vorbelegt, jeweils mit „Vorbelegt aus
     Ihrem Stammdaten-Link – bitte prüfen.“; die Fragen werden trotzdem gezeigt.

---

## MT-120: Die Kanzlei bereitet das Mandat vor und schließt ohne Unterschrift ab

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – Name, Anschrift und
Gläubiger-ID der Kanzlei sind eingetragen; Sie stehen bei der Mandantennummer.

**Schritte:**

1. Mandantennummer `10001`, **„Weiter“**. Bei „Wer hat zu zahlen?“ `Erika Musterfrau`, **„Weiter“**.
   - **Danach:** Bei „Ist die Kontoinhaberin oder der Kontoinhaber identisch … oder abweichend?“ ist
     „identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber“ vorgewählt.
2. Beim Kontoinhaber und bei der Zahlungsart jeweils **„Weiter“**.
   - **Achten Sie gleich auf:** Bei der Zahlungsart ist „wiederkehrende Zahlungen“ vorgewählt – die
     Banken verlangen die Angabe „einmalig oder wiederkehrend“ im Mandat.
   - **Danach:** _Nicht offensichtlich:_ Bei „Mandatsreferenz“ steht im Feld schon
     `100010000001` (Mandantennummer und laufende Nummer `0000001`) mit „Vorschlag aus Ihren
     Angaben – Sie können ihn ändern.“
3. **„Wird separat mitgeteilt“** klicken. Bei „Welche Angaben zum Konto tragen Sie schon ein?“ nichts
   ankreuzen, **„Weiter“**.
   - **Danach:** Es geht ohne Mandatsreferenz und ohne Angaben zum Konto weiter zur
     Zusammenfassung.
4. Mit **„Zurück“** noch einmal zur Mandatsreferenz, dann **„Weiter“** bis zur Zusammenfassung.
   - **Danach:** Das Feld war **leer** – eine bewusst leer gelassene Antwort schlägt die App nicht
     noch einmal vor. In der Zusammenfassung steht bei „Mandatsreferenz“ „–“.
5. In der Zusammenfassung den Abschnitt **„Stammdaten für das nächste Mal“** lesen.
   - **Danach:** Der Text nennt die Angaben, die der Link beim nächsten Mal einträgt, und endet mit
     „Der Link enthält nur Angaben aus dem Teil „Kanzlei (Zahlungsempfänger)“.“ **Mandantennummer
     und Mandatsreferenz fehlen** in der Aufzählung und im Link.
6. **„Weiter zum Abschluss“**, Häkchen setzen, **„Abschließen“**.
   - **Achten Sie gleich auf:** Die Abschluss-Seite bietet **keine** Unterschrift an, nur den Knopf
     „Abschließen“ – der Zahlungsempfänger unterschreibt ein Mandat nicht.
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
     _Nicht offensichtlich:_ Gleich unter den Rollen steht der Abschnitt „Stand“ mit „PDF
     erstellen“, „Fragebogen schließen“ und „Als Link weitergeben“ – ohne Scrollen.
2. **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen und die beiden Hinweise lesen.
   - **Danach:** Der erste Hinweis ist der Mandatstext („Ich/Wir ermächtige(n) …“, mit der
     Acht-Wochen-Frist), der zweite der Datenschutz.
3. Kontoinhaber **„Weiter“**, „Gehört das Konto noch einer weiteren Person?“ **„Nein“**
   (vorgewählt), „Liegt die Anschrift im Ausland?“ **„Nein“**, Straße `Musterstraße 5`.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Zahlungsempfänger, Gläubiger-ID, wer zu
     zahlen hat und die Zahlungsart werden **nicht** gefragt. Die Frage zum Kontoinhaber steht mit
     „identisch“ und „Vorbelegt von Kanzlei (Zahlungsempfänger) – bitte prüfen.“ da.
4. Postleitzahl `1234` (vier Ziffern) eintragen und **„Weiter“**, dann `12345`.
   - **Achten Sie gleich auf:** `1234` wird abgelehnt (5 Ziffern), wie im Personalfragebogen.
5. Ort `Musterstadt`, Bank `Beispielbank`, IBAN `DE89 3704 0044 0532 0130 00`.
   - **Danach:** Eine BIC wird bei einer deutschen IBAN nicht gefragt.
6. Bei „Wer unterschreibt das Mandat?“, „Wo unterschreiben Sie?“ und „Datum der Unterschrift“ die
   Felder ansehen und jeweils **„Weiter“**.
   - **Achten Sie gleich auf:** In den Feldern stehen schon `Erika Musterfrau` (wer zu zahlen hat),
     `Musterstadt` (Ort der Anschrift) und das heutige Datum, jeweils mit „Vorschlag aus Ihren
     Angaben – Sie können ihn ändern.“
7. Die Zusammenfassung durchsehen.
   - **Danach:** Im Abschnitt „Mandat“ stehen „Musterkanzlei Beispiel“, `DE98ZZZ09999999999`,
     „Erika Musterfrau“ und „wiederkehrende Zahlungen“ mit „festgelegt von: Kanzlei
     (Zahlungsempfänger)“ und **ohne** „ändern“; „Kontoinhaber: identisch …“ hat „ändern (vorbelegt
     von: Kanzlei (Zahlungsempfänger))“. Darunter „Angaben: Kanzlei (Zahlungsempfänger)
     (abgeschlossen, nur lesen)“ mit der Mandatsreferenz `100010000001`.
8. **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“** `Erika Musterfrau`, **„Unterschreiben und
   abschließen“**; dann **„PDF erstellen“** und die PDF öffnen.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Über dem Häkchen steht unter „Das schließen
     Sie ab:“ alles, was Sie unterschreiben – Ihre Angaben und darunter „Angaben: Kanzlei
     (Zahlungsempfänger) (abgeschlossen, nur lesen)“. Deshalb stimmt der Satz am Häkchen „Ich
     erteile das SEPA-Basislastschriftmandat mit den Angaben oben.“
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
2. **„Ich bin: Zweite Kontoinhaberin oder zweiter Kontoinhaber“** wählen und die beiden Hinweise
   lesen.
3. Bei „Wie heißen Sie?“ das Feld ansehen, **„Weiter“**.
   - **Achten Sie gleich auf:** Gefragt wird **nur** der Name; im Feld steht schon `Max Mustermann`
     mit „Vorbelegt von Kontoinhaberin oder Kontoinhaber – bitte prüfen.“ Zahlungsempfänger und
     Gläubiger-ID sind festgelegt.
4. Die Zusammenfassung ansehen, dann **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“**
   `Max Mustermann`, unterschreiben.
   - **Achten Sie gleich auf:** Über dem Häkchen stehen alle Angaben: Ihr Name, darunter die
     abgeschlossenen Teile der Kanzlei und der ersten Kontoinhaberin (mit Konto und IBAN) – „die
     Angaben oben“ sind also wirklich oben zu sehen (seit 06.11.2026).
   - **Danach:** Es fehlt keine Rolle mehr; an der zweiten Unterschrift steht „Max Mustermann“.

---

## MT-123: Ohne den Teil der Kanzlei

**Einstieg:** Auf der Startseite „SEPA-Basislastschriftmandat“ neu beginnen.

**Schritte:**

1. Die Übersicht ansehen.
   - **Danach:** Die Kanzlei steht mit „nichts vorbelegt (freiwillig)“; unter „Stand“ fehlt sie
     **nicht** als Teil.
2. **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen, die beiden Hinweise lesen, dann bei „An
   wen erteilen Sie das Mandat?“ **„Vorerst überspringen“**.
   - **Danach:** _Nicht offensichtlich:_ Ohne den Teil der Kanzlei fragt das Mandat
     Zahlungsempfänger, Gläubiger-ID, Vertrag und Zahlungsart selbst – ein Mandat ohne
     Zahlungsempfänger lässt sich nicht unterschreiben.
3. Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben und **„Weiter“**.
   - **Achten Sie gleich auf:** Die Eingabe wird mit einem Hinweis auf die falsche Prüfziffer
     abgelehnt.
4. Zur Zusammenfassung gehen.
   - **Danach:** Oben steht „Das fehlt noch, bevor Sie abschließen können:“ mit den fehlenden
     Angaben, darunter „Zahlungsempfänger“, je mit „beantworten“; „Weiter zum Abschluss“ ist
     gesperrt.

---

## MT-124: Den Teil der Kanzlei als Link statt als PDF weitergeben

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen; Sie stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. In der Übersicht unter „Stand“ bei **„Als Link weitergeben“** auf **„Kopieren“** klicken.
   - **Danach:** „Link kopiert.“ Der Link ist gut 1.000 Zeichen lang und enthält `#weitergabe=1`.
     _Nicht offensichtlich:_ Den Link gibt es in der Übersicht und auf der Abschluss-Seite (seit
     06.11.2026); man muss dafür nicht direkt nach dem Abschließen weitermachen.
2. Ein **privates Fenster** öffnen (wie ein anderes Gerät) und den Link dort in die Adresszeile
   einfügen.
   - **Danach:** „Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.“ und
     „Aus einem Link zur Weitergabe geöffnet.“ _Nicht offensichtlich:_ Es kommt **keine** Übersicht
     „Wer füllt jetzt aus?“ – der Fragebogen öffnet gleich im Teil der Kontoinhaberin, beim
     Mandatstext.
3. Auf die Adresszeile achten, dann bis zur Zusammenfassung ausfüllen wie in MT-121.
   - **Danach:** Die Adresszeile zeigt **nur noch die Adresse der App**, ohne den langen Teil hinter
     „#“. Zahlungsempfänger und Gläubiger-ID werden nicht gefragt (wie MT-121).
4. Im privaten Fenster den Link noch einmal einfügen, dabei aber die letzten 20 Zeichen löschen.
   - **Danach:** Rot: „Link zur Weitergabe: Der Link ist unvollständig oder beschädigt – vielleicht
     wurde er beim Kopieren abgeschnitten. …“ – nichts wird halb übernommen.

**Erwartet:**

- _Nicht offensichtlich:_ Ein Fragebogen mit vielen Angaben oder einer gezeichneten Unterschrift (z. B.
  die fertige Sofortmeldung) bietet keinen Link an; dort steht „Für einen Link sind es zu viele
  Angaben. Bitte die PDF weitergeben.“ Der Link enthält alle Angaben wie die PDF – nur an die Person
  schicken, die als Nächstes ausfüllt.

---

## MT-125: Die Kanzlei belegt das Konto vor, die Kontoinhaberin ändert die IBAN

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – wie MT-120.

**Schritte:**

1. Mandantennummer `10001`, Vertrag `Erika Musterfrau`, Zahlungsart **„Weiter“**, Mandatsreferenz
   (Vorschlag) **„Weiter“**.
2. Bei „Welche Angaben zum Konto tragen Sie schon ein?“ beide Kästchen ankreuzen, **„Weiter“**;
   „Liegt die Anschrift … im Ausland?“ **„Nein“**, Straße `Musterstraße 5`, Postleitzahl `12345`,
   Ort `Musterstadt`, Bank `Beispielbank`, IBAN `DE89 3704 0044 0532 0130 00`.
   - **Achten Sie gleich auf:** Erst nach dem Kreuz fragt die App nach Anschrift und Bank; ohne
     Kreuz fragt sie nichts zum Konto. Die Kanzlei wird nach keinem Namen gefragt – bei „identisch“
     ist es der Name bei „Wer hat zu zahlen?“.
3. Abschließen (**„Weiter zum Abschluss“**, Häkchen, **„Abschließen“**), **„Gerät weitergeben – zur
   Übersicht“**, **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen.
4. Alle Fragen mit **„Weiter“** durchgehen; nur bei der IBAN `DE02 1203 0000 0000 2020 51`
   eintragen.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Anschrift, Bank und IBAN werden
     **gefragt**, mit den Werten der Kanzlei im Feld und „Vorbelegt von Kanzlei
     (Zahlungsempfänger) – bitte prüfen.“ Nach der Änderung der IBAN verschwindet der Hinweis bei
     der IBAN.
   - **Danach:** In der Zusammenfassung stehen Anschrift und Bank mit „ändern (vorbelegt von:
     Kanzlei (Zahlungsempfänger))“, die IBAN nur mit „ändern“.
5. Bis zur Unterschrift weitermachen, mit getipptem Namen `Erika Musterfrau` unterschreiben; in der
   Übersicht unter „Stand“ **„PDF erstellen“**.
6. Unter „Stand“ **„Fragebogen schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“
   **„Eingänge zusammenführen …“** klicken und dort die PDF aus Schritt 5 einlesen.
   - **Danach:** In der Kanzlei steht der Prüfhinweis „„IBAN“ geändert: Kanzlei
     (Zahlungsempfänger) hatte „DE89 3704 0044 0532 0130 00“ vorbelegt, im Teil „Kontoinhaberin
     oder Kontoinhaber“ steht jetzt „DE02 1203 0000 0000 2020 51“.“ – **kein** Widerspruch. Das
     Mandat gilt mit der neuen IBAN.

---

## MT-126: Anschrift im Ausland

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – wie MT-121.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen, Kontoinhaber und weitere
   Person **„Weiter“**.
2. „Liegt die Anschrift im Ausland?“ **„Ja“**, beim Staat `Öster` tippen und **„Österreich“** wählen.
   - **Danach:** Nach dem Staat wird gefragt, nach der deutschen Postleitzahl nicht.
3. Straße `Beispielgasse 3`, Postleitzahl `123`, Ort `Wien`.
   - **Achten Sie gleich auf:** Die Postleitzahl `123` wird angenommen; gleich danach erscheint der
     Hinweis „Die Postleitzahl hat nicht das übliche Format dieses Staats. Bitte prüfen.“
     (Österreich: 4 Ziffern). _Nicht offensichtlich:_ Der Hinweis sperrt nichts – wie im
     Personalfragebogen.
4. Bis „Wo unterschreiben Sie?“ weitergehen.
   - **Danach:** Im Feld steht schon `Wien` als Vorschlag.

---

## MT-127: Abweichender Kontoinhaber

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – wie MT-120.

**Schritte:**

1. Mandantennummer `10001`, „Wer hat zu zahlen?“ `Beispiel GmbH`, beim Kontoinhaber **„abweichend –
   das Konto gehört einer anderen Person“**, Zahlungsart und Mandatsreferenz **„Weiter“**, bei den
   Angaben zum Konto nichts ankreuzen.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Bei „abweichend“ fragt die Kanzlei-Seite
     **nicht** nach dem Namen des Kontoinhabers, solange nichts angekreuzt ist – den trägt der
     Kontoinhaber selbst ein (wie der Vordruck „vom Kontoinhaber abweichender Schuldner“).
2. Abschließen, **„Gerät weitergeben – zur Übersicht“**, **„Ich bin: Kontoinhaberin oder
   Kontoinhaber“**, die Hinweise lesen, Kontoinhaber **„Weiter“**.
   - **Danach:** Die App fragt den **Namen** der Kontoinhaberin und eine **E-Mail-Adresse für die
     Ankündigung der Abbuchungen** (oder „Lieber per Post“).
3. Name `Erika Musterfrau`, E-Mail-Adresse `erika@example.org`, dann weiter wie in MT-121 bis „Wer
   unterschreibt das Mandat?“.
   - **Achten Sie gleich auf:** Vorgeschlagen ist `Erika Musterfrau` (die Kontoinhaberin), nicht
     „Beispiel GmbH“.
4. Unterschreiben, in der Übersicht unter „Stand“ **„PDF erstellen“**, dann **„Fragebogen
   schließen“**; auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** und diese
   PDF einlesen.
   - **Danach:** In der Kanzlei steht der Prüfhinweis „Abweichender Kontoinhaber: Die
     Vorabankündigung jeder Lastschrift geht an den Kontoinhaber …“; ohne Widerspruch.

---

## MT-128: Zwei Kontoinhaber, jede Person darf allein – eine Unterschrift mit Namen

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – wie MT-121.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen, Kontoinhaber **„Weiter“**.
2. „Gehört das Konto noch einer weiteren Person?“ **„Ja“**.
   - **Danach:** Es erscheinen genau die zwei Fragen nach dem Namen und nach der Verfügung.
3. Name `Max Mustermann`, bei „Darf jede Person allein über das Konto verfügen oder nur beide
   gemeinsam?“ **„jede Person allein – eine Unterschrift genügt“**.
4. Anschrift und Bank wie in MT-121; bei „Wer unterschreibt das Mandat?“ `Max Mustermann` eintragen
   (er füllt aus), Ort und Datum **„Weiter“**.
   - **Achten Sie gleich auf:** Vorgeschlagen ist `Erika Musterfrau` (wer zu zahlen hat); der
     eingetragene Name ersetzt den Vorschlag.
5. Mit getipptem Namen `Max Mustermann` unterschreiben und die Übersicht ansehen.
   - **Danach:** Der Teil ist unterschrieben; die zweite Kontoinhaberin oder der zweite
     Kontoinhaber ist **nicht** nötig (grau, „Nur nötig, wenn …“). An der Unterschrift steht „Max
     Mustermann“.
6. **„Unterschrift zurücknehmen“** beim Kontoinhaber, bis zur Unterschrift weiter und diesmal mit
   `Erika Musterfrau` unterschreiben.
   - **Danach:** _Nicht offensichtlich:_ Die Unterschrift gilt, danach erscheint aber „Der getippte
     Name weicht vom angegebenen Namen ab. Bitte prüfen.“ – getippter Name und „Wer unterschreibt
     das Mandat?“ passen nicht zusammen.
