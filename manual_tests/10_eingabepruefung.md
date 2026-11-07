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

1. Bei „Familienname“ dreimal <kbd>Abcdefghij</kbd> tippen.
   - **Danach:** Im Feld stehen 30 Zeichen.
2. Weiter tippen: <kbd>Klmno</kbd>.
   - **Danach:** Das Feld nimmt nichts mehr an; die fünf Buchstaben erscheinen nicht.
3. Das Feld leeren und einen 35 Zeichen langen Text einfügen (Strg+V bzw. Einsetzen am Handy):
   `AbcdefghijAbcdefghijAbcdefghijKlmno`.
   - **Danach:** _Nicht offensichtlich:_ Beim Einfügen schneidet der Browser den Text nach 30
     Zeichen ab, ohne Meldung.
4. **„Weiter“** klicken, die übrigen Fragen beliebig beantworten und mit **„Weiter“** bis zur
   Zusammenfassung gehen.
   - **Danach:** In der Zusammenfassung steht beim Familiennamen genau „AbcdefghijAbcdefghijAbcdefghij“
     – die ersten 30 Zeichen.

**Erwartet:**

- Grenzen der anderen Felder: Vornamen 30, Titel 20, Geburtsname 30, Geburtsort 34, Straße 33,
  Hausnummer 9, Anschriftenzusatz 40, Wohnort 34, Postleitzahl im Ausland 10.

---

## MT-105: Ungewöhnliche Zeichen im Namen sind nur ein Hinweis

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen
Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ als „Beschäftigte Person“.

**Schritte:**

1. Bei „Familienname“ `Müller!` eingeben und **„Weiter“**.
   - **Danach:** Die App geht zur nächsten Frage. Oben erscheint ein Hinweis, der mit „Hinweis: Die
     Meldung zur Sozialversicherung nimmt hier nur bestimmte Zeichen an …“ beginnt, dazu „So darf
     die Angabe für die Meldung zur Sozialversicherung nicht enden“.
2. Mit **„Zurück“** zurück, `Müller` eingeben und **„Weiter“**.
   - **Danach:** kein Hinweis.
3. Mit **„Zurück“** zurück, `O'Brien` eingeben und **„Weiter“**.
   - **Danach:** _Nicht offensichtlich:_ **kein** Hinweis.
4. Mit **„Zurück“** zurück, `Nguyễn` eingeben und **„Weiter“**.
   - **Danach:** **kein** Hinweis.
5. Mit **„Zurück“** zurück, `Müller-Lüdenscheidt` eingeben und **„Weiter“**.
   - **Danach:** **kein** Hinweis.
6. Mit **„Weiter“** bis „Hausnummer“ gehen, die Fragen dazwischen beliebig beantworten.
7. Bei „Hausnummer“ `-12` eingeben und **„Weiter“**.
   - **Danach:** Hinweis „… muss die Angabe mit einem Buchstaben beginnen …“; die Hausnummer wird
     trotzdem übernommen.

**Erwartet:**

- _Nicht offensichtlich:_ Ein Name, wie er im Pass steht, wird nie abgelehnt.

---

## MT-106: Geburtsdatum außerhalb der Grenzen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen
Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ als „Beschäftigte Person“ und
beantworten die Fragen bis „Geburtsdatum“ beliebig.

**Schritte:**

1. `31.12.1875` eingeben und **„Weiter“**.
   - **Danach:** Unter dem Feld steht rot **„Das Datum liegt zu weit zurück – frühestens
     01.01.1876.“**; die Frage bleibt stehen.
2. Das Datum von morgen eingeben und **„Weiter“**.
   - **Danach:** **„Das Datum liegt zu spät – spätestens heute.“**
3. Das Datum von heute eingeben und **„Weiter“**.
   - **Danach:** Das Datum von heute wird angenommen. _Nicht offensichtlich:_ Die Grenze wandert
     mit dem Kalender – sie gilt ab Fassung 0.4.0 der Sofortmeldung (in 0.3.0 war sie fest der
     31.12.2026).
4. Mit **„Zurück“** zurück, `17.05.1990` eingeben und **„Weiter“**.
   - **Danach:** Angenommen, es geht weiter.

---

## MT-134: Geburtsdatum mit zweistelligem Jahr (TTMMJJ)

**Einstieg:** [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) – der
Arbeitgeber hat abgeschlossen, die Person „Erika Musterfrau“ ist bis zum Geburtsort ausgefüllt; Sie
stehen beim Geburtsdatum.

**Schritte:**

1. `170590` eingeben.
   - **Danach:** Im Feld steht „17.05.90“ – die Punkte kommen von selbst.
2. **„Weiter“** klicken.
   - **Danach:** Angenommen, es geht weiter.
3. **„Zurück“** klicken.
   - **Danach:** Im Feld steht **17.05.1990** – die App hat das Jahr ergänzt.
4. Das Feld leeren, `17.05.90` eingeben und **„Weiter“** klicken.
   - **Danach:** Angenommen, es geht weiter.
5. **„Zurück“** klicken, das Feld leeren und das Datum von morgen mit zweistelligem Jahr eingeben
   (am 07.11.2026 also `081126`), dann **„Weiter“**.
   - **Danach:** Angenommen, es geht weiter.
6. **„Zurück“** klicken.
   - **Danach:** Im Feld steht das Datum **100 Jahre früher** (am 07.11.2026: 08.11.1926). _Nicht
     offensichtlich:_ Ein Geburtsdatum kann nicht in der Zukunft liegen; die App nimmt deshalb das
     späteste passende Jahr bis heute – so reicht ein zweistelliges Jahr für ein Alter bis knapp 100
     Jahre.
7. Das Feld leeren, `17.05.1990` eingeben und **„Weiter“** klicken.
   - **Danach:** Angenommen, es geht weiter.

**Erwartet:**

- _Nicht offensichtlich:_ Ein zweistelliges Jahr gilt nur bei Datumsfeldern, die nicht nach heute
  liegen dürfen (Geburtsdatum, Datum der Unterschrift beim SEPA-Mandat, Daten beim Eigenbeleg).
  Andere Daten, etwa der Beginn der Beschäftigung, verlangen das Jahr vierstellig: „Bitte das Jahr
  vierstellig eingeben, z. B. 02.11.2026.“

---

## MT-107: Prüfhinweise zu Versicherungsnummer und Postleitzahl im Ausland

**Einstieg:** [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) – der
Arbeitgeber hat abgeschlossen, die Person „Erika Musterfrau“ ist bis zum Geburtsort ausgefüllt; Sie
stehen beim Geburtsdatum.

**Schritte:**

1. Geburtsdatum `18.05.1990` eingeben und **„Weiter“**.
2. Mit **„Weiter“** bis zum Geschlecht gehen (die Fragen dazwischen sind vorausgefüllt), „weiblich“
   wählen und **„Weiter“**.
3. Mit **„Weiter“** bis zur Versicherungsnummer gehen, `65 170590 M 520` eingeben und **„Weiter“**.
   - **Danach:** Die Versicherungsnummer wird angenommen, **ohne** Fehler – sie hat eine gültige
     Prüfziffer, auch wenn sie nicht ganz zum Geburtsdatum passt. _Ab Fassung 1.1.0 (Testordner):_
     Gleich nach „Weiter“ steht oben gelb „Die Versicherungsnummer passt nicht ganz … Geburtsdatum
     in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.“
4. Bei „Liegt die Anschrift im Ausland?“ **„Ja“** wählen, als Staat „Niederlande“; Straße und
   Hausnummer beliebig, den Anschriftenzusatz leer lassen.
5. Bei der Postleitzahl `1234AB` eingeben und **„Weiter“**.
   - **Danach:** _Ab Fassung 1.1.0:_ Auch die Postleitzahl meldet sich gleich nach „Weiter“ gelb.
6. Den Wohnort beliebig eintragen und bis zur Zusammenfassung gehen.
   - **Danach:** _Ab Fassung 1.1.0:_ In der Zusammenfassung steht der Hinweis zur
     Versicherungsnummer oben unter **„Bitte prüfen:“** mit **„ändern“**; auch die Postleitzahl
     steht unter „Bitte prüfen:“.
7. Unterschreiben und **„PDF erstellen“**.
   - **Danach:** Abschließen bleibt trotz der Hinweise möglich.
8. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
   schließen“**. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen
   …“** klicken und die PDF einlesen.
   - **Danach:** In der Karte des Fragebogens steht „Prüfhinweise:“ mit zwei Hinweisen: „Die
     Versicherungsnummer passt nicht ganz zu Geburtsdatum, Geburtsname oder Geschlecht. …
     Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.“ mit der Fundstelle
     „§ 2 VKVV; Gemeinsames Rundschreiben Meldeverfahren Tz. 3.1.1“; und „Die Postleitzahl hat
     nicht das Format, das die Meldungen zur Sozialversicherung für diesen Staat verlangen. …
     Format in Niederlande: NNNN AA (N = Ziffer, A = Buchstabe), zum Beispiel 1234 FG.“
9. Für die Gegenprobe noch einmal
   [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) klicken.
10. Geburtsdatum diesmal `17.05.1990` eingeben und **„Weiter“**.
11. Mit **„Weiter“** bis zum Geschlecht gehen, „weiblich“ wählen und **„Weiter“**.
12. Mit **„Weiter“** bis zur Versicherungsnummer gehen, `65 170590 M 520` eingeben und **„Weiter“**.
    - **Danach:** Kein Hinweis zur Versicherungsnummer.
13. Bei „Liegt die Anschrift im Ausland?“ **„Ja“** wählen, als Staat „Niederlande“; Straße und
    Hausnummer beliebig, den Anschriftenzusatz leer lassen.
14. Bei der Postleitzahl diesmal `1234 AB` (mit Leerzeichen) eingeben und **„Weiter“**.
    - **Danach:** Kein Hinweis zur Postleitzahl.
15. Den Wohnort beliebig eintragen, bis zur Zusammenfassung gehen, unterschreiben und **„PDF
    erstellen“**.
16. **„Gerät weitergeben – zur Übersicht“**, in der Übersicht unter „Stand“ **„Fragebogen
    schließen“**. Auf der Startseite im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken
    und die eben erstellte PDF einlesen.
    - **Danach:** Beide Prüfhinweise – zur Versicherungsnummer und zur Postleitzahl – sind
      verschwunden.

**Erwartet:**

- _Nicht offensichtlich:_ Hinweise blockieren nichts.

---

## MT-108: Stunden, Grad der Behinderung und Kennzeichen (Entwürfe)

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen
Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Bis „Wie ist die Arbeitszeit vereinbart?“ gehen, „feste Stunden an festen Wochentagen“ wählen,
   **„Weiter“**.
2. Bei „An welchen Wochentagen arbeitet die Person?“ „Montag“ und „Freitag“ ankreuzen,
   **„Weiter“**.
   - **Danach:** Gefragt werden nur Montag und Freitag.
3. Bei „Wie viele Stunden arbeitet die Person am Montag?“ `25` eingeben, **„Weiter“**.
   - **Danach:** Rot **„Höchstens 24.“**
4. `11` eingeben, **„Weiter“**.
   - **Danach:** Es geht weiter, oben erscheint „Ungewöhnlich hoher Wert – bitte prüfen.“
5. Beim Freitag ohne Eingabe **„Weiter“** versuchen.
   - **Danach:** Ohne Stunden geht es **nicht** weiter (Pflicht, weil angekreuzt).
6. Beim Freitag `4` eingeben, **„Weiter“**.
   - **Danach:** Es geht weiter.
7. Mit **„Weiter“** bis „Hat die Person Ihnen eine Schwerbehinderung oder Gleichstellung mitgeteilt
   …?“ gehen und dort „einem schwerbehinderten Menschen gleichgestellt“ wählen, **„Weiter“**.
8. Beim Grad der Behinderung `25` eingeben, **„Weiter“**.
   - **Danach:** **„Nur in Schritten von 10 möglich.“**
9. `10` eingeben, **„Weiter“**.
   - **Danach:** **„Mindestens 20.“**
10. `30` eingeben, **„Weiter“**.
    - **Danach:** 30 wird angenommen.
11. Auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen
    „Dienstwagen: Überlassung“ (Entwurf) als „Arbeitgeber“ starten.
12. Firma und Namen beliebig eintragen, beim „Amtlichen Kennzeichen“ `ka ab 1234e` eingeben und
    die übrigen Fragen beliebig beantworten, bis zur Zusammenfassung.
    - **Danach:** In der Zusammenfassung steht „KA-AB 1234E“.

---

## MT-117: Buchstabe der Versicherungsnummer passt nicht zum Geburtsnamen

**Einstieg:** [Ab dem Geburtsdatum öffnen](start:sofortmeldung-person-ab-geburtsdatum) – die Person
„Erika Musterfrau“ ist bis zum Geburtsort ausgefüllt.

**Schritte:**

1. Gehen Sie mit **„Zurück“** zu „Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen
   …?“, wählen Sie **„Nein“** und klicken Sie **„Weiter“**.
2. Geben Sie als Geburtsnamen `Schmidt` ein und klicken Sie **„Weiter“**.
3. Geben Sie als Geburtsdatum `17.05.1990` ein und klicken Sie **„Weiter“**.
4. Gehen Sie mit **„Weiter“** bis zum Geschlecht (die Fragen dazwischen sind vorausgefüllt), wählen
   Sie „weiblich“ und klicken Sie **„Weiter“**.
5. Gehen Sie mit **„Weiter“** bis zur Versicherungsnummer, geben Sie `65 170590 M 520` ein und
   klicken Sie **„Weiter“**.
   - **Danach:** Oben erscheint gelb „Die Versicherungsnummer passt nicht ganz zu Geburtsdatum,
     Geburtsname oder Geschlecht. … Buchstabe in der Versicherungsnummer: M; Anfangsbuchstabe des
     Geburtsnamens: S.“ Es geht trotzdem weiter.
6. Füllen Sie die Anschrift beliebig aus und gehen Sie bis zur Zusammenfassung.
   - **Danach:** Die Zusammenfassung zeigt den Hinweis **oben** unter „Bitte prüfen:“ (nicht erst
     nach dem Scrollen).
7. Klicken Sie dort unter „Bitte prüfen:“ auf **„ändern“**.
   - **Danach:** „ändern“ führt zur Versicherungsnummer.

**Erwartet:**

- _Nicht offensichtlich:_ Das kann richtig sein (die Nummer bleibt nach einer Namensänderung gleich);
  deshalb sperrt der Hinweis nichts. Hinweise, die nur die Kanzlei betreffen (z. B. zur Rente),
  sieht die Person nicht.
