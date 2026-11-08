# 02 – Ausfüllen (Interview)

Alle Tests verwenden die **Sofortmeldung** und erfundene Daten.

Die übrigen Tests dieses Bereichs – Rollenwahl, Interview, ungültige Eingaben, „Vorerst
überspringen“, Zusammenfassung, Zwischenstand, Warnung beim Schließen, alle Daten löschen, Angaben
übernehmen, Verwerfen und der angefangene Fragebogen im Browser – laufen automatisch in
`tests/e2e/handtests/02_ausfuellen.spec.ts`. Hier bleibt, was nur ein echtes Handy zeigt.

## MT-118: Tastatur und Kalender des Handys beim Datum

**Einstieg:** Auf einem **iPhone** (Safari) und, wenn vorhanden, einem **Android-Handy** (Chrome)
den Testordner öffnen,
[Zusammenfassung des Arbeitgebers öffnen](start:sofortmeldung-arbeitgeber-zusammenfassung) – der
Arbeitgeber hat alles ausgefüllt, aber noch nicht abgeschlossen.

**Voraussetzungen:** Ein iPhone und, wenn vorhanden, ein Android-Handy.

**Schritte:**

1. Tippen Sie beim „Tag der Beschäftigungsaufnahme“ auf **„ändern“**.
   - **Danach:** Die Frage „An welchem Tag beginnt die Beschäftigung?“ erscheint; im Feld steht
     „02.11.2026“.
2. Tippen Sie in das Datumsfeld.
   - **Danach:** _Nicht offensichtlich:_ Die Tastatur zeigt nur Ziffern und ein Komma (das iPhone
     bietet Webseiten keine Zifferntastatur mit Punkt).
3. Löschen Sie das Datum im Feld.
4. Tippen Sie mit dieser Tastatur <kbd>2,11,2026</kbd>.
   - **Danach:** _Nicht offensichtlich:_ Jedes Komma erscheint sofort als Punkt: Im Feld steht
     „2.11.2026“ (iPhone-Testberichte vom 01.11. und 04.11.2026).
5. Tippen Sie auf den **Kalender-Knopf** rechts neben dem Feld.
   - **Danach:** Der Datumswähler des Geräts öffnet sich, und zwar auf dem 02.11.2026 – dem Tag,
     der im Feld steht. Die Seite zoomt dabei **nicht** heran.
6. Wählen Sie einen anderen Tag, z. B. den 9. November.
   - **Danach:** Der gewählte Tag steht als „TT.MM.JJJJ“ im Feld, z. B. „09.11.2026“.
7. [Geburtsdatum der Person öffnen](start:sofortmeldung-person-ab-geburtsdatum) tippen und
   **„Öffnen“** wählen.
   - **Danach:** Die Frage „Wann sind Sie geboren?“ erscheint, das Feld ist leer.
8. Tippen Sie auf den Kalender-Knopf.
   - **Danach:** _Nicht offensichtlich:_ Tage nach heute sind beim Geburtsdatum grau und nicht
     wählbar.
9. Stellen Sie als Jahr „1965“ ein.
   - **Danach:** _Nicht offensichtlich:_ Auf dem iPhone kommt man zum Jahr über einen Tipp auf
     **„Monat Jahr ›“** oben im Kalender – dann erscheinen Drehräder für Monat und Jahr; 1965 ist
     mit wenigen Wischern erreicht. Auf Android tippt man im Kalender oben auf die **Jahreszahl**
     und bekommt eine Jahresliste.

**Erwartet:**

- Dass der Kalender dem Feld folgt und beim Geburtsdatum keinen Tag nach heute zulässt, prüft ein
  automatischer Test. Hier zählt, wie Tastatur und Datumswähler des echten Geräts aussehen und sich
  bedienen lassen.
