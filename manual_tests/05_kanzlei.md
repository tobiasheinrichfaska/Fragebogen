# Station Kanzlei: Eingänge zusammenführen

Die Abläufe in der App – Einlesen, Zusammenführen, Entscheidungen, PDF für die Personalakte,
Vorschläge und die Übergabe an Lohn und Gehalt bis zur Importdatei – laufen automatisch in
`tests/e2e/handtests/05_kanzlei.spec.ts`. Hier bleibt, was nur in DATEV Lohn und Gehalt geht. Nur
erfundene Daten und ein Testmandant.

## MT-68: Übergabe an Lohn und Gehalt – Importdatei einspielen (nur Kanzlei-Build mit Zuordnung)

**Einstieg:** [Kanzlei mit vollständigem Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig)
– die Kanzlei-Station mit einem eingelesenen Personalfragebogen (Erika Musterfrau, Beginn
02.11.2026, 2.500,00 €, Personalnummer 42).

**Testbereich:** Die Importdatei lässt sich auch dort erstellen; eingespielt wird sie nur in der
Kanzlei (Testmandant).

**Voraussetzungen:**

- Kanzlei-Build mit `config/export.local.json`: `npm run build:kanzlei` (für den Entwurf des
  Personalfragebogens die Vorschau: `npm run build:preview`).
- **Ein Testmandant** in Lohn und Gehalt, nie ein echter Mandant.

**Schritte:**

1. Unter „Übergabe an DATEV Lohn und Gehalt“ bei „Mandantennummer“ die Nummer des Testmandanten
   eintragen.
2. Bei „Mitarbeiternummer“ eine Nummer eintragen, die im Testmandanten frei ist.
3. „neu anlegen“ wählen.
4. Bei „Lohnart für das Monatsentgelt“ die Lohnart aus dem Testmandanten eintragen.
5. „Betriebsnummer der Krankenkasse“ mit der Krankenkasse im Testmandanten vergleichen.
   - **Danach:** _Nicht offensichtlich:_ Sie ist aus dem Fragebogen schon eingetragen (Techniker
     Krankenkasse, 15027365).
6. Bei „KK-Nr. der Krankenkasse beim Mandanten“ die Nummer aus dem Testmandanten eintragen.
7. **„Importdatei herunterladen“** klicken.
   - **Danach:** Die Sicherheitsfrage fragt, ob die Mitarbeiternummer beim Mandanten noch frei ist.
8. **„Ja, geprüft – Datei herunterladen“** klicken.
   - **Danach:** Die Importdatei wird heruntergeladen.
9. In Lohn und Gehalt auf Kanzleiebene Extras | Stammdatenimport die Datei wählen.
10. Auf Mandantenebene das Protokoll (Mandant | Ausgeben | Protokolle, „Stammdaten-Import-Prot.“)
    ansehen.
    - **Danach:** Der Mitarbeiter ist angelegt; das Protokoll zeigt die übernommenen Felder.
      Krankenkasse und Gehalt (mit der eingetragenen Lohnart) sind übernommen. _Nicht
      offensichtlich:_ Die Krankenkasse muss beim Testmandanten schon angelegt sein, sonst lehnt
      Lohn und Gehalt sie ab. Fehlerhafte Felder nennt nur das Protokoll von Lohn und Gehalt.

**Erwartet:**

- Variante Rentner (Altersvollrente vor der Regelaltersgrenze): Personengruppe 120 wird übertragen
  und steht unter „Übertragen, bitte im Importprotokoll prüfen“. **Bitte im Protokoll nachsehen, ob
  Lohn und Gehalt die 120 annimmt**; die Feldbeschreibung V16.1 führt sie nicht.
- Danach den Testmitarbeiter wieder löschen.

## MT-70: Sofortmeldung zuerst, Personalfragebogen später zum selben Mitarbeiter

**Einstieg:** [Kanzlei mit Sofortmeldung öffnen](start:kanzlei-sofortmeldung-personalnummer) – die
Kanzlei-Station mit einer eingelesenen Sofortmeldung (Erika Musterfrau, Personalnummer 42). In
Schritt 7 öffnet ein zweiter Startlink den Personalfragebogen derselben Person.

**Testbereich:** nur in der Kanzlei – braucht einen Testmandanten in Lohn und Gehalt.

**Voraussetzungen:** Fassung mit Entwürfen und Zuordnung (im Testbereich schon geladen; lokal
`npm run build:preview`), **ein Testmandant** in Lohn und Gehalt, nie ein echter Mandant.

**Schritte:**

1. Unter „Übergabe an DATEV Lohn und Gehalt“ bei „Mandantennummer“ die Nummer des Testmandanten
   eintragen.
2. Bei „Mitarbeiternummer“ eine Nummer eintragen, die im Testmandanten frei ist, und sie notieren.
3. „neu anlegen“ wählen.
4. **„Importdatei herunterladen“** klicken.
   - **Danach:** Die Sicherheitsfrage erscheint.
5. **„Ja, geprüft – Datei herunterladen“** klicken.
   - **Danach:** Die Importdatei wird heruntergeladen.
6. In Lohn und Gehalt auf Kanzleiebene Extras | Stammdatenimport die Datei einspielen.
   - **Danach:** Der Mitarbeiter ist mit Name, Anschrift und persönlichen Angaben angelegt.
7. [Kanzlei mit Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig) klicken
   und **„Öffnen“** wählen.
   - **Danach:** Die Kanzlei-Station zeigt den Personalfragebogen derselben Person.
8. Bei „Mandantennummer“ die Nummer des Testmandanten eintragen.
9. Bei „Mitarbeiternummer“ die Nummer aus Schritt 2 eintragen.
10. „vorhandenen Mitarbeiter ergänzen“ wählen.
    - **Danach:** Die Zeile „Bitte in DATEV Lohn und Gehalt vergleichen: Mitarbeiter … ist …“ nennt
      Name und Eintritt.
11. Den Mitarbeiter in Lohn und Gehalt aufrufen und mit dieser Zeile vergleichen.
    - **Danach:** Es ist dieselbe Person.
12. **„Importdatei herunterladen“** klicken.
    - **Danach:** Die Sicherheitsfrage fragt, ob die Nummer zu dieser Person gehört.
13. **„Ja, geprüft – Datei herunterladen“** klicken.
14. Die Datei in Lohn und Gehalt einspielen (Extras | Stammdatenimport).
    - **Danach:** Derselbe Mitarbeiter ist ergänzt; es gibt keinen zweiten.
15. Gegenprobe: Bei „Mitarbeiternummer“ eine Nummer eintragen, die es im Testmandanten nicht gibt.
16. **„Importdatei herunterladen“** klicken.
17. **„Ja, geprüft – Datei herunterladen“** klicken.
18. Die Datei in Lohn und Gehalt einspielen.
    - **Danach:** **Bitte festhalten, was das Protokoll meldet** – erwartet ist ein Fehler
      „Mitarbeiter nicht gefunden“ und kein neu angelegter Mitarbeiter (in der DATEV-Beschreibung
      nicht ausdrücklich beschrieben).

**Erwartet:**

- _Nicht offensichtlich:_ Den Personalfragebogen **nicht zweimal** zum selben Mitarbeiter
  einspielen: Lohn und Gehalt legt Bezüge/Abzüge dann ein zweites Mal an (Auswahl nach „Gültig ab“
  und Bezug/Abzug-Nr.).
