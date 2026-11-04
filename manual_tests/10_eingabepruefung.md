# 10 – Prüfung der Eingaben (Längen, Zeichen, Grenzen)

Diese Tests prüfen die Feldgrenzen vom 03.11.2026: **Unmögliches lehnt die App ab, Ungewöhnliches
merkt sie nur an.** Längen begrenzt schon das Eingabefeld. Alle Regeln sind zusätzlich automatisch
getestet (`src/logic/fieldLimits.test.ts`, `tests/forms/sofortmeldung030.test.ts`); hier geht es um
das, was man am Bildschirm sieht.

**Umgebung:** Sofortmeldung ab Fassung 0.4.0, im Testbereich die neueste (Startseite: „Personalfragebogen: Angaben für die
Sofortmeldung“, Fassung unten auf der Startseite bzw. in der Zusammenfassung). Für MT-108 die Fassung
mit den Entwürfen (im Testbereich schon geladen). Nur erfundene Daten.

---

## MT-104: Das Eingabefeld nimmt nicht mehr Zeichen an, als die Meldung erlaubt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen
Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ als „Beschäftigte Person“.

**Schritte:**

1. Bei „Familienname“ 35 Buchstaben tippen, zum Beispiel `Abcdefghij` dreimal und dann `Klmno`.
2. Dasselbe mit Einfügen (Strg+V bzw. Einsetzen am Handy) eines 35 Zeichen langen Texts versuchen.
3. **„Weiter“**.

**Erwartet:**

- Nach 30 Zeichen nimmt das Feld nichts mehr an; die letzten fünf Buchstaben erscheinen nicht.
- _Nicht offensichtlich:_ Beim Einfügen schneidet der Browser den Text nach 30 Zeichen ab, ohne
  Meldung. Bitte in der Zusammenfassung prüfen, dass genau die ersten 30 Zeichen stehen.
- Grenzen der anderen Felder: Vornamen 30, Titel 20, Geburtsname 30, Geburtsort 34, Straße 33,
  Hausnummer 9, Anschriftenzusatz 40, Wohnort 34, Postleitzahl im Ausland 10.

---

## MT-105: Ungewöhnliche Zeichen im Namen sind nur ein Hinweis

**Einstieg:** wie MT-104.

**Schritte:**

1. Bei „Familienname“ `Müller!` eingeben und **„Weiter“**.
2. Mit **„Zurück“** zurück, `Müller` eingeben und **„Weiter“**.
3. Bei „Hausnummer“ `-12` eingeben und **„Weiter“**.

**Erwartet:**

- Schritt 1: Die App geht zur nächsten Frage. Oben erscheint ein Hinweis, der mit „Hinweis: Die
  Meldung zur Sozialversicherung nimmt hier nur bestimmte Zeichen an …“ beginnt, dazu „So darf die
  Angabe für die Meldung zur Sozialversicherung nicht enden“.
- Schritt 2: kein Hinweis.
- Schritt 3: Hinweis „… muss die Angabe mit einem Buchstaben beginnen …“; die Hausnummer wird
  trotzdem übernommen.
- _Nicht offensichtlich:_ Namen wie `O'Brien`, `Nguyễn` oder `Müller-Lüdenscheidt` geben **keinen**
  Hinweis. Ein Name, wie er im Pass steht, wird nie abgelehnt.

---

## MT-106: Geburtsdatum außerhalb der Grenzen

**Einstieg:** wie MT-104, bis „Geburtsdatum“.

**Schritte:**

1. `31.12.1875` eingeben und **„Weiter“**.
2. Das Datum von morgen eingeben und **„Weiter“**; danach das Datum von heute.
3. `17.05.1990` eingeben und **„Weiter“**.

**Erwartet:**

- Schritt 1: Unter dem Feld steht rot **„Das Datum liegt zu weit zurück – frühestens 01.01.1876.“**;
  die Frage bleibt stehen.
- Schritt 2: Bei morgen **„Das Datum liegt zu spät – spätestens heute.“**; das Datum von heute wird
  angenommen. _Nicht offensichtlich:_ Die Grenze wandert mit dem Kalender – sie gilt ab Fassung 0.4.0
  der Sofortmeldung (in 0.3.0 war sie fest der 31.12.2026).
- Schritt 3: Angenommen, es geht weiter.

---

## MT-107: Prüfhinweise zu Versicherungsnummer und Postleitzahl im Ausland

**Einstieg:** [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) – der
Arbeitgeber hat abgeschlossen, die Person „Erika Musterfrau“ ist bis zum Geburtsort ausgefüllt; Sie
stehen beim Geburtsdatum.

**Schritte:**

1. Geburtsdatum `18.05.1990`, Geschlecht „weiblich“, Versicherungsnummer `65 170590 M 520`.
2. Bei „Liegt die Anschrift im Ausland?“ **„Ja“**, Staat „Niederlande“, Postleitzahl `1234AB`;
   Straße, Hausnummer und Wohnort beliebig. Unterschreiben, **„PDF erstellen“**.
3. Die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen.

**Erwartet:**

- Schritt 1: Die Versicherungsnummer wird angenommen, **ohne** Fehler – sie hat eine gültige
  Prüfziffer, auch wenn sie nicht ganz zum Geburtsdatum passt. _Ab Fassung 1.1.0 (Testordner):_
  Gleich nach „Weiter“ steht oben gelb „Die Versicherungsnummer passt nicht ganz … Geburtsdatum in
  der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.“; in der Zusammenfassung steht er oben
  unter **„Bitte prüfen:“** mit **„ändern“**. Abschließen bleibt möglich.
- Schritt 2: _Ab Fassung 1.1.0:_ Auch die Postleitzahl `1234AB` meldet sich gleich nach „Weiter“
  gelb und steht unter „Bitte prüfen:“.
- Schritt 3: In der Karte des Fragebogens steht „Prüfhinweise:“ mit
  - „Die Versicherungsnummer passt nicht ganz zu Geburtsdatum, Geburtsname oder Geschlecht. …
    Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.“ und der Fundstelle
    „§ 2 VKVV; Gemeinsames Rundschreiben Meldeverfahren Tz. 3.1.1“;
  - „Die Postleitzahl hat nicht das Format, das die Meldungen zur Sozialversicherung für diesen
    Staat verlangen. … Format in Niederlande: NNNN AA (N = Ziffer, A = Buchstabe), zum Beispiel
    1234 FG.“
- _Nicht offensichtlich:_ Mit Geburtsdatum `17.05.1990` und Postleitzahl `1234 AB` (mit Leerzeichen)
  verschwinden beide Hinweise. Hinweise blockieren nichts.

---

## MT-108: Stunden, Grad der Behinderung und Kennzeichen (Entwürfe)

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen
Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Bis „Wie ist die Arbeitszeit vereinbart?“ gehen, „feste Stunden an festen Wochentagen“ wählen,
   bei „An welchen Wochentagen arbeitet die Person?“ **Montag** und **Freitag** ankreuzen, und bei
   „Wie viele Stunden arbeitet die Person am Montag?“ `25` eingeben, **„Weiter“**; dann `11`,
   **„Weiter“**. Beim Freitag ohne Eingabe **„Weiter“** versuchen.
2. Bei „Hat die Person Ihnen eine Schwerbehinderung oder Gleichstellung mitgeteilt …?“ „einem
   schwerbehinderten Menschen gleichgestellt“ wählen. Beim Grad der Behinderung `25` eingeben,
   **„Weiter“**; dann `10`; dann `30`.
3. Im Entwurf „Dienstwagen“ als Arbeitgeber beim „Amtlichen Kennzeichen“ `ka ab 1234e` eingeben und
   bis zur Zusammenfassung gehen.

**Erwartet:**

- Schritt 1: Bei 25 steht rot **„Höchstens 24.“**; bei 11 geht es weiter, oben erscheint
  „Ungewöhnlich hoher Wert – bitte prüfen.“ Gefragt werden nur Montag und Freitag; beim Freitag
  geht es ohne Stunden **nicht** weiter (Pflicht, weil angekreuzt).
- Schritt 2: Bei 25 **„Nur in Schritten von 10 möglich.“**, bei 10 **„Mindestens 20.“**, 30 wird
  angenommen.
- Schritt 3: In der Zusammenfassung steht „KA-AB 1234E“.

---

## MT-117: Buchstabe der Versicherungsnummer passt nicht zum Geburtsnamen

**Einstieg:** [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) – die Person
„Erika Musterfrau“ ist bis zum Geburtsort ausgefüllt.

**Schritte:**

1. Gehen Sie mit **„Zurück“** zu „Ist Ihr Geburtsname derselbe wie Ihr Familienname?“, wählen Sie
   **„Nein“** und geben Sie als Geburtsnamen `Schmidt` ein.
2. Geburtsdatum `17.05.1990`, Geschlecht „weiblich“, Versicherungsnummer `65 170590 M 520`,
   **„Weiter“**.
3. Gehen Sie bis zur Zusammenfassung und klicken Sie dort unter „Bitte prüfen:“ auf **„ändern“**.

**Erwartet:**

- Schritt 2: Oben erscheint gelb „Die Versicherungsnummer passt nicht ganz zu Geburtsdatum,
  Geburtsname oder Geschlecht. … Buchstabe in der Versicherungsnummer: M; Anfangsbuchstabe des
  Geburtsnamens: S.“ Es geht trotzdem weiter.
- Schritt 3: Die Zusammenfassung zeigt den Hinweis **oben** (nicht erst nach dem Scrollen); „ändern“
  führt zur Versicherungsnummer.
- _Nicht offensichtlich:_ Das kann richtig sein (die Nummer bleibt nach einer Namensänderung gleich);
  deshalb sperrt der Hinweis nichts. Hinweise, die nur die Kanzlei betreffen (z. B. zur Rente),
  sieht die Person nicht.
