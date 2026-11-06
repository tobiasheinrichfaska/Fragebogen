# 09 – Monatsmeldung (Entwurf)

Voraussetzung für alle Fälle: die **Fassung mit den Formular-Entwürfen** – im Testbereich schon geladen;
lokal `npm run build:preview`, Datei `dist-preview/index.html`. Nur erfundene Daten verwenden.

---

## MT-94: Monatsmeldung ausfüllen – Kalender je Person, Lohnart-Zeilen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Monatsmeldung: Lohn- und Gehaltsdaten“.

**Schritte:**

1. Beide Hinweise bestätigen. Abrechnungsmonat `11.2026`, Firma, Betriebsnummer `12345671`,
   Mandantennummer `99999`, Ihren Namen, eine E-Mail und bei „Lohnarten Ihres Betriebs“ zwei Zeilen
   `1000 Stundenlohn` und `2000 Nachtzuschlag 25 %` eingeben.
2. Bei „Wer war im Abrechnungsmonat beschäftigt?“ zwei Personen anlegen: `Musterfrau, Erika` mit
   **Stundenlohn** `14,50` und `Beispiel, Max` mit **festem Monatsentgelt** `2.400`. **„Weiter“**.
   - **Achten Sie gleich auf:** Jede Person hat einen eigenen Block („Mitarbeiter/in 1:
     Musterfrau, Erika“). „Im Vormonat: –“ steht da, ohne Eingabefeld – es füllt sich erst mit der
     Meldung des Vormonats.
3. Auf „Urlaub und Krankheit in diesem Monat“ bei Erika den 03.11. einmal, den 04.11. zweimal und den
   17.11. dreimal antippen; bei Max den 10.11. einmal.
   - **Achten Sie gleich auf:** Je Person erscheint ein Monatskalender November 2026, eine Zeile je
     Woche, Montag zuerst.
   - **Danach:** Der 03.11. ist grün mit **U**, der 04.11. hellblau mit **H**, der 17.11. rot mit
     **K**; ein viertes Tippen macht einen Tag wieder leer. Unter dem Kalender steht „Urlaub
     (1 Tag): 03.11.2026; halber Urlaubstag (1 Tag): 04.11.2026; krank (1 Tag): 17.11.2026“.
     _Nicht offensichtlich:_ Die Felder „Ausgefallene Stunden Urlaub/Krankheit“ gibt es **nur bei
     Erika** (Stundenlohn), bei Max nicht.
4. **„Weiter“**. Bei den Werten eine Zeile anlegen und bei „Person“ `Mus` tippen; dann bei „Lohnart“
   `10` tippen.
   - **Achten Sie gleich auf:** Unter „Person“ wird „Musterfrau, Erika“ vorgeschlagen, unter
     „Lohnart“ „1000 Stundenlohn“. Ein anderer Text bleibt möglich.
5. Bis zur Zusammenfassung weitergehen (Nachträge für den Vormonat: „Nein“).
   - **Danach:** Die Zusammenfassung zeigt je Person die Fehltage als Zeiträume und die
     Lohnart-Zeile.

---

## MT-95: Meldung des Vormonats einlesen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Monatsmeldung: Lohn- und Gehaltsdaten“.

**Voraussetzungen:** Eine abgeschlossene Monatsmeldung für 11.2026 als PDF (aus MT-94, unterschrieben),
in der „Beispiel, Max“ „scheidet in diesem Monat aus: Ja“ hat.

**Schritte:**

1. Neue Monatsmeldung beginnen und über **„Angaben aus einer anderen Datei übernehmen“** die PDF des
   Vormonats einlesen.
   - **Danach:** Die Meldung nennt die Zahl der übernommenen Angaben und „2 Hinweise schon
     bestätigt“. Die beiden Hinweise müssen nicht noch einmal bestätigt werden.
     _Nicht offensichtlich:_ Ändert sich der Text eines Hinweises in einer neuen Formularfassung,
     muss nur dieser neu bestätigt werden.
2. Durch die Fragen bis „Wer war im Abrechnungsmonat beschäftigt?“ gehen.
   - **Achten Sie gleich auf:** Abrechnungsmonat ist **12.2026**; Firma, Mandantennummer,
     Ansprechperson und Lohnarten sind eingetragen.
   - **Danach:** Nur Erika ist in der Liste (Max ist ausgeschieden). Bei Erika steht „Im Vormonat:
     14,50 €“.
3. Erikas Stundenlohn auf `15,00` ändern und „Neue Vergütung gilt ab“ `01.12.2026` eintragen.
4. Bis zur Zusammenfassung weitergehen.
   - **Achten Sie gleich auf:** Erikas Kalender ist leer.
   - **Danach:** In der Zusammenfassung steht bei Erika „Im Vormonat: 14,50 € (geändert)“.
