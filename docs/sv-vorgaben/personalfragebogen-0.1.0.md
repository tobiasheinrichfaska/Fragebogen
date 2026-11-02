# SV-Beurteilung nach amtlichen Beispielen – Personalfragebogen: Angaben für die Lohnabrechnung 0.1.0

> Erzeugt aus `tests/fixtures/sv-vorgaben/` und der Formulardefinition (`npm run catalogue`), nicht von
> Hand bearbeiten. Keine Rechtsberatung. Je Zeile ein Beispiel aus einer amtlichen oder veröffentlichten
> Quelle, mit erfundener Person: erwartete Personengruppe · Beitragsgruppen (KV RV AV PV) · Kennzeichen
> Übergangsbereich (ÜB) und der Vorschlag der App für dieselben Antworten; „(p)“ = mit Prüfvermerk.
> Belegt: S = Sachverhalt; O = am Original geprüft, A = abgeleitet, N = nicht verifiziert.

80 Fälle aus 1 Datei(en): 76 abbildbar, 4 nicht abbildbar; 70 gleich, 6 abweichend. 103 abgeleitete Varianten, 33 Grenzfälle.

| ID | Quelle | Sachverhalt | Erwartet | Belegt | App | Ergebnis |
| --- | --- | --- | --- | --- | --- | --- |
| GFR-02a | GfR 2026, Bsp. 2 | Minijob 600 €, familienversichert, ohne RV-Befreiung | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| GFR-02b | GfR 2026, Bsp. 2 | Minijob 600 €, familienversichert, mit RV-Befreiung | 109 · 6500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| GFR-03b1 | GfR 2026, Bsp. 3b | Abiturientin mit Studienabsicht, 70 Arbeitstage | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| GFR-03b2 | GfR 2026, Bsp. 3b | Dieselbe Person im Dezember: wegen Vorbeschäftigung nicht kurzfristig | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 · ÜB 0 | gleich |
| GFR-04a | GfR 2026, Bsp. 4a | Bezieher von Arbeitslosengeld, Aushilfe 800 € unter 15 Std. | 101 · 3101 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 3101 (p) · ÜB 1 | gleich |
| GFR-04b | GfR 2026, Bsp. 4b | Aushilfe in der Elternzeit, Durchschnitt 765 € | 101 · 3111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| GFR-04c | GfR 2026, Bsp. 4c | Ausbildungsuchender Schulentlassener, zwei Aushilfen im selben Monat | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 · ÜB 0 | gleich |
| GFR-04dA | GfR 2026, Bsp. 4d | ALG-Bezieher, Aushilfe 600 € einmal wöchentlich | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| GFR-04dB | GfR 2026, Bsp. 4d | Zweite Aushilfe neben laufender Aushilfe: Entgelte zusammen über der Grenze | 101 · 1101; ab 16.10.2026: 110 · 0000 | S O, PGR O, BGR O | 101 (p) · 1101 (p) · ÜB 0 | gleich |
| GFR-06 | GfR 2026, Bsp. 6 | 600 € plus vertragliches Weihnachtsgeld | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| GFR-07a | GfR 2026, Bsp. 7a | Mindestlohn, schwankende Stunden, Jahresprognose bis zur Grenze | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| GFR-07c | GfR 2026, Bsp. 7c | Erheblich schwankendes Entgelt: zwei Zeiträume | 101 · 1111; ab 01.09.2026: 109 · 6100 | S O, PGR O, BGR O | 109 (p) · 6100 · ÜB 0 | nicht abbildbar |
| GFR-10 | GfR 2026, Bsp. 10 | 1.000 €, davon 400 € ins Wertguthaben | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| GFR-11 | GfR 2026, Bsp. 11 | Übungsleiterpauschale en bloc | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 | nicht abbildbar |
| GFR-14 | GfR 2026, Bsp. 14 | Entgeltumwandlung senkt 720 € auf 600 € | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| GFR-15a | GfR 2026, Bsp. 15a | Zwei Minijobs (280 € + 320 €), privat versichert | 109 · 0100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 0100 · ÜB 0 | gleich |
| GFR-16B | GfR 2026, Bsp. 16 | Minijob 600 € neben gleichzeitiger kurzfristiger Beschäftigung | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| GFR-19A | GfR 2026, Bsp. 19 | Hauptbeschäftigung 1.800 € neben einem Minijob | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| GFR-19B | GfR 2026, Bsp. 19 | Minijob 600 € neben Hauptbeschäftigung | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| GFR-20B | GfR 2026, Bsp. 20 | Erster Minijob neben Hauptbeschäftigung, befreit | 109 · 6500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6500 (p) · ÜB 0 | gleich |
| GFR-20C | GfR 2026, Bsp. 20 | Zweiter Minijob neben Hauptbeschäftigung | 101 · 1101 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1101 (p) · ÜB 1 (p) | gleich |
| GFR-21 | GfR 2026, Bsp. 21 | Beamter mit zwei Minijobs über der Grenze | 101 · 0110 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 0110 · ÜB 1 (p) | gleich |
| GFR-22 | GfR 2026, Bsp. 22 | Freiwillig GKV-versicherter Beamter, zwei Minijobs zusammen 600 €, befreit | 109 · 6500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6500 (p) · ÜB 0 | gleich |
| GFR-23B | GfR 2026, Bsp. 23 | Beamter, Nebenbeschäftigung 800 € | 101 · 0110 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 0110 · ÜB 1 (p) | gleich |
| GFR-23C | GfR 2026, Bsp. 23 | Beamter, erster Minijob neben versicherungspflichtiger Nebenbeschäftigung | 109 · 0100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 0100 · ÜB 0 | gleich |
| GFR-24C | GfR 2026, Bsp. 24 | wie GFR-23C, mit RV-Befreiung | 109 · 0500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 0500 · ÜB 0 | gleich |
| GFR-25A | GfR 2026, Bsp. 25 | Über der JAEG, freiwillig GKV, Firmenzahler | 101 · 9111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 9111 · ÜB 0 | gleich |
| GFR-25C | GfR 2026, Bsp. 25 | Zweiter Minijob neben JAEG-freier Hauptbeschäftigung | 101 · 0100 · ÜB 0; Minijob-Zentrale: 101 · 6000 | S O, PGR O, BGR O, ÜB A | 101 (p) · 0100 (p) · ÜB 0 | gleich |
| GFR-26A | GfR 2026, Bsp. 26 | Über der JAEG, freiwillig GKV, Selbstzahler | 101 · 0111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 0111 · ÜB 0 | gleich |
| GFR-26C | GfR 2026, Bsp. 26 | Zweiter Minijob neben JAEG-freier Hauptbeschäftigung, Minijobs über der Grenze | 101 · 0101 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 (p) · 0101 (p) · ÜB 0 | gleich |
| GFR-27 | GfR 2026, Bsp. 27 | JAEG-Überschreitung durch Zusammenrechnung zum Jahreswechsel | 101 · 0101 | S O, PGR O, BGR O | 109 (p) · 0500 (p) · ÜB 0 (p) | nicht abbildbar |
| GFR-28 | GfR 2026, Bsp. 28 | Minijob 600 €, privat versichert, ohne Befreiung | 109 · 0100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 0100 · ÜB 0 | gleich |
| GFR-29 | GfR 2026, Bsp. 29 | Haushaltshilfe im Privathaushalt (Haushaltsscheck) | 209 · 0100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | – · – · ÜB – | nicht abbildbar |
| GFR-31A | GfR 2026, Bsp. 31 | Apotheker, Versorgungswerk-befreit | 101 · 1011 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 1011 · ÜB 0 | gleich |
| GFR-31B | GfR 2026, Bsp. 31 | Apotheker-Minijob, befreit zugunsten des Versorgungswerks | 109 · 6000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6000 (p) · ÜB 0 | gleich |
| GFR-32B | GfR 2026, Bsp. 32 | Architekt, berufsfremder Minijob | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| GFR-33 | GfR 2026, Bsp. 33 | Rechtsanwalt im Kanzlei-Minijob, Versorgungswerk-befreit | 109 · 6000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6000 · ÜB 0 | gleich |
| GFR-34 | GfR 2026, Bsp. 34 | Rechtsanwalt im Kanzlei-Minijob, Befreiung nach § 6 Abs. 1b | 109 · 6500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| GFR-36b | GfR 2026, Bsp. 36b | Befreiungsantrag geht im Folgemonat ein | 109 · 6100 · ÜB 0; ab 01.06.2026: 109 · 6500 | S O, PGR O, BGR O, ÜB A | 109 · 6100 (p) · ÜB 0 | gleich |
| GFR-37 | GfR 2026, Bsp. 37 | „Aushilfe“ über vier Monate (88 Arbeitstage) | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| GFR-39B | GfR 2026, Bsp. 39 | Aushilfe neben Dauerbeschäftigung | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| GFR-40B | GfR 2026, Bsp. 40 | Aushilfe, mit früheren Aushilfen über drei Monate | 101 · 1111 · ÜB 0; KV unsicher | S O, PGR O, BGR O, ÜB A | 101 (p) · 3111 (p) · ÜB 0 | gleich |
| GFR-41 | GfR 2026, Bsp. 41 | Rentner springt gelegentlich ein | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| GFR-42 | GfR 2026, Bsp. 42 | Regelmäßige Einsätze an fünf Tagen im Monat | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| GFR-45B | GfR 2026, Bsp. 45 | Zweite Aushilfe im Jahr über drei Monate, über der Grenze | 101 · 1111 · ÜB 1; KV unsicher | S O, PGR O, BGR O, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| GFR-48 | GfR 2026, Bsp. 48 | Aushilfe nach mehr als geringfügiger Vorbeschäftigung: berufsmäßig | 101 · 1111 · ÜB 1; KV unsicher | S O, PGR O, BGR O, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| ST-01 | RS Studenten, Bsp. 1 | Student 25 Std./Woche unbefristet | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 106 (p) · 0100 · ÜB 1 | abweichend (C) |
| ST-02A | RS Studenten, Bsp. 2 | Werkstudentenjob 18 Std. neben Minijob 7 Std.: zusammen über 20 Std. | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 106 (p) · 0100 · ÜB 1 (p) | abweichend (C) |
| ST-02B | RS Studenten, Bsp. 2 | Student, Minijob 300 € neben (versicherungspflichtig gewordener) Beschäftigung | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| ST-04 | RS Studenten, Bsp. 4 | Student 25 Std. befristet, mit Vorbeschäftigungen | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 106 (p) · 0100 · ÜB 1 | abweichend (C) |
| ST-SF | RS Studenten, A 1.2.4 b | Student, Einsätze nur in der vorlesungsfreien Zeit | 106 · 0100 | S O, PGR A, BGR A | 106 · 0100 · ÜB 1 | gleich |
| ST-KF | RS Studenten, C 1 | Student, Ferienjob zwei Monate Vollzeit: kurzfristig | 110 · 0000 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 106 · 0100 · ÜB 0 | abweichend (C) |
| ST-WS | RS Studenten, A 1.2.4 a | Werkstudent 15 Std./Woche | 106 · 0100 | S O, PGR O, BGR A | 106 (p) · 0100 · ÜB 1 | gleich |
| ST-WSMJ | RS Studenten, C 1 | Werkstudent mit Minijob-Verdienst | 109 · 6100 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 106 (p) · 0100 · ÜB 0 | abweichend (C) |
| ST-ZP | RS Studenten, C 3 | Vorgeschriebenes Zwischenpraktikum | 190 · 0000 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| ST-VP | RS Studenten, C 3 | Vorgeschriebenes Vorpraktikum mit Entgelt | 105 · 1111 · ÜB 0 | S O, PGR O, BGR A, ÜB O | 105 · 1111 · ÜB 0 | gleich |
| ST-VP0 | RS Studenten, C 3 | Vorgeschriebenes Vorpraktikum ohne Entgelt | 105 · 0110 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 105 · 0110 · ÜB 0 | gleich |
| ST-FZPMJ | RS Studenten, A 3.5 / GfR C 3.3.2 | Freiwilliges Praktikum im Studium mit Minijob-Verdienst | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 106 (p) · 0100 · ÜB 0 | abweichend (C) |
| ST-SCH | RS Studenten, A 4.1 | Schülerin einer allgemeinbildenden Schule, 800 € | 101 · 1101 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 · 1101 · ÜB 1 | gleich |
| UEB-02 | RS Übergangsbereich, Bsp. 2 | Zwei Beschäftigungen zusammen über 2.000 € | 101 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 0 | gleich |
| UEB-03 | RS Übergangsbereich, Bsp. 3 | Hauptbeschäftigung 1.700 € neben erstem Minijob | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 1 (p) | gleich |
| UEB-15 | RS Übergangsbereich, Bsp. 15 | Zwei Minijobs zusammen 720 € | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB O | 101 (p) · 1111 · ÜB 1 (p) | gleich |
| UEB-AZNEBEN | RS Übergangsbereich, 4.3.6.1 | Versicherungspflichtiger Nebenjob neben einer Ausbildung | 101 · 1111 · ÜB 0 | S A, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 0 | gleich |
| UEB-KF | RS Übergangsbereich, 4.2.2 | Hauptbeschäftigung 1.500 € neben kurzfristiger Beschäftigung | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| UEB-VR | RS Übergangsbereich, 4.3.6.3 | Vorruhestandsgeld 1.500 € | 108 · 3101 · ÜB 1 | S A, PGR O, BGR A, ÜB O | 108 · 3101 (p) · ÜB 1 | gleich |
| UEB-FSJ | RS Übergangsbereich, 4.3.6.1 | FSJ mit Taschengeld und Sachbezügen 650 € | 123 · 1111 · ÜB 0 | S A, PGR O, BGR A, ÜB O | 123 · 1111 · ÜB 0 | gleich |
| UEB-2000 | § 20 Abs. 2 SGB IV | Grenzfall: genau 2.000,00 € | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| D-121EZ | DEÜV Anlage 2 (121) | Auszubildender 300 € mit Urlaubsgeld | 121 · 1111 · ÜB 0 | S A, PGR O, BGR A, ÜB O | 121 · 1111 · ÜB 0 | gleich |
| D-102-0 | DEÜV Anlage 2 / RS Studenten C 2 | Duales Studium ohne Arbeitsentgelt | 102 · 0110 · ÜB 0 | S A, PGR O, BGR A, ÜB O | 102 · 0110 · ÜB 0 | gleich |
| D-119 | DEÜV Anlage 2 (119) | Altersvollrentner nach der Regelaltersgrenze, 1.500 €, kein Verzicht | 119 · 3321 · ÜB 1 | S A, PGR O, BGR A, ÜB A | 119 · 3321 (p) · ÜB 1 | gleich |
| D-120V | DEÜV Anlage 2 (120) | Altersvollrentner nach der Regelaltersgrenze mit Verzicht | 120 · 3121 · ÜB 1 | S A, PGR O, BGR A, ÜB A | 120 · 3121 (p) · ÜB 1 | gleich |
| D-120VOR | DEÜV Anlage 2 (120) | Altersvollrente vor der Regelaltersgrenze | 120 · 3111 · ÜB 1 | S A, PGR O, BGR A, ÜB A | 120 · 3111 · ÜB 1 | gleich |
| D-119P | DEÜV Anlage 2 (119) | Pensionär wegen Altersgrenze, jünger als die Regelaltersgrenze | 119 · 0310 · ÜB 1 | S A, PGR O, BGR A, ÜB A | 119 · 0310 · ÜB 1 | gleich |
| D-EMV | SGB V / SGB III | Rente wegen voller Erwerbsminderung, Teilzeit 900 € | 101 · 3101 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 · 3101 (p) · ÜB 1 | gleich |
| D-RAGNV | SGB VI / Anlage 2 | Regelaltersgrenze erreicht, nie rentenversichert | 101 · 1321 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 · 1321 (p) · ÜB 1 | gleich |
| D-JAEG02 | SGB V § 6 Abs. 7 | Seit vor 2003 privat versichert, 72.000 € im Jahr | 101 · 0110 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 101 · 0110 · ÜB 0 | gleich |
| D-JAEGMJ | GfR 2026, B 2.2.2.8 | Hauptbeschäftigung knapp unter der JAEG neben erstem Minijob | 101 · 1111 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| D-MJRAG | GfR 2026, B 2.2.4.2 | Altersvollrentner nach der Regelaltersgrenze im Minijob | 109 · 6500 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| D-603 | SGB IV § 8 | Grenzfall: „Minijob“ mit 603,01 € | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| D-KFAZ | GfR 2026, B 2.3.3.2 | Aushilfe zwischen Schule und Ausbildung, über der Grenze | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |

## Abweichungen

- **C – Werkstudenten und freiwillige Praktika: 20-Stunden-Grenze und Vorrang von 109/110 fehlen:** ST-01, ST-02A, ST-04, ST-KF, ST-WSMJ, ST-FZPMJ

## Nicht abbildbar

- **GFR-07c** (GfR 2026, Bsp. 7c): Der Fragebogen beurteilt eine Beschäftigung mit einem Monats- bzw. Durchschnittsentgelt zum Beginn; zwei Zeiträume mit verschiedenem Status (erheblich schwankendes Entgelt, GfR B 2.2.1.2) kann er nicht ausdrücken. Mit dem Durchschnitt (rund 450 €) schlägt er 109/6100 (prüfen) vor.
- **GFR-11** (GfR 2026, Bsp. 11): Steuerfreie Aufwandsentschädigungen (§ 3 Nr. 26/26a EStG) und ihre Verteilung (en bloc / pro rata) fragt der Fragebogen nicht ab; mit 920 € ergibt sich 101/1111 (Übergangsbereich 1).
- **GFR-27** (GfR 2026, Bsp. 27): Beginn 2025 liegt außerhalb der Gültigkeit des Fragebogens (Beschäftigungsbeginn 2026); der Statuswechsel zum Jahreswechsel (JAEG des Folgejahres) wird nicht beurteilt. Erwartet ist hier die Lage ab 01.01.2026 für C.
- **GFR-29** (GfR 2026, Bsp. 29): Minijobs im Privathaushalt laufen über das Haushaltsscheckverfahren (Personengruppe 209); der Fragebogen schließt sie bewusst aus (Ausschluss „haushaltsscheck“). Test: Ausschluss greift, kein Vorschlag.

## Grenzfälle 2026

| Fall | Grundlage | Erwartet | App |
| --- | --- | --- | --- |
| Minijob 720 € brutto, davon 120 € Entgeltumwandlung (GfR Bsp. 14) | § 14 Abs. 1 S. 2 SGB IV; § 1 Abs. 1 S. 1 Nr. 9 SvEV; GfR 2026 Bsp. 14 | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| Minijob 720 €, Beitrag 140 € davon 20 € Zuschuss des Arbeitgebers (120 € umgewandelt) | § 14 Abs. 1 S. 2 SGB IV; GfR 2026 Bsp. 14 | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| „Minijob“ 720 €, die 120 € zahlt der Arbeitgeber zusätzlich (keine Umwandlung) | § 8 Abs. 1 Nr. 1 SGB IV (die Zuwendung mindert das Entgelt nicht) | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| 950 € mit 400 € Umwandlung: beitragsfrei nur 338 € (4 % der BBG RV) – 612 € bleiben | § 14 Abs. 1 S. 2 SGB IV, § 1 Abs. 1 S. 1 Nr. 9 SvEV (BBG RV 2026: 8.450 € im Monat) | 101 · 1111 · ÜB 1 | 101 · 1111 · ÜB 1 (p) |
| 940 € mit 338 € Umwandlung: genau 602 € – ein Minijob | § 14 Abs. 1 S. 2 SGB IV; § 8 Abs. 1 Nr. 1 SGB IV | 109 · 6100 · ÜB 0 | 109 (p) · 6100 · ÜB 0 |
| Aushilfe 01.06.–31.08. (genau drei Monate), 78 Arbeitstage, 1.500 € | § 8 Abs. 1 Nr. 2 SGB IV; GfR 2026 B 2.3, 2.3.1 | 110 · 0000 · ÜB 0 | 110 · 0000 · ÜB 0 |
| Aushilfe 01.06.–01.09. (drei Monate und ein Tag), 79 Arbeitstage, 1.500 € | § 8 Abs. 1 Nr. 2 SGB IV; GfR 2026 B 2.3, Bsp. 37 | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| Aushilfe 01.06.–30.09., genau 70 Arbeitstage, 1.500 € | GfR 2026 B 2.3.1 (gleichwertige Alternativen), Bsp. 3b | 110 · 0000 · ÜB 0 | 110 · 0000 · ÜB 0 |
| Aushilfe 01.06.–30.09., 71 Arbeitstage, 1.500 € | GfR 2026 B 2.3.1 | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| Aushilfe 01.06.–30.09., 71 Arbeitstage, 500 € (dann ein Minijob) | GfR 2026 B 2.3 („zu prüfen, ob eine geringfügig entlohnte Beschäftigung vorliegt“) | 109 · 6100 · ÜB 0 | 109 (p) · 6100 · ÜB 0 |
| Minijob ab 03.05., Befreiungsantrag am 05.05. eingegangen | § 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1, Bsp. 36a | 109 · 6500 · ÜB 0 | 109 · 6500 · ÜB 0 |
| Minijob ab 03.05., Befreiungsantrag am 31.05. eingegangen | § 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1 | 109 · 6500 · ÜB 0 | 109 · 6500 · ÜB 0 |
| Minijob ab 03.05., Befreiungsantrag am 01.06. eingegangen (erst ab Juni befreit) | § 6 Abs. 4 S. 2 SGB VI; GfR 2026 B 2.2.4.1, Bsp. 36b | 109 · 6100 · ÜB 0 | 109 · 6100 (p) · ÜB 0 |
| Minijob ab 03.05., Befreiungsantrag schon vor Beginn (20.04.) eingegangen | § 6 Abs. 4 S. 2 SGB VI („frühestens ab Beschäftigungsbeginn“) | 109 · 6500 · ÜB 0 | 109 · 6500 · ÜB 0 |
| Minijob mit genau 603,00 € | § 8 Abs. 1 Nr. 1, Abs. 1a SGB IV | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| „Minijob“ mit 603,01 € | § 8 Abs. 1 Nr. 1 SGB IV, § 20 Abs. 2 SGB IV | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| versicherungspflichtig mit 603,01 € | § 20 Abs. 2 SGB IV | 101 · 1111 · ÜB 1 | 101 · 1111 · ÜB 1 |
| versicherungspflichtig mit genau 2.000,00 € | § 20 Abs. 2 SGB IV | 101 · 1111 · ÜB 1 | 101 · 1111 · ÜB 1 |
| versicherungspflichtig mit 2.000,01 € | § 20 Abs. 2 SGB IV | 101 · 1111 · ÜB 0 | 101 · 1111 · ÜB 0 |
| Minijob mit Stundenlohn, erwartet genau 603,00 € | § 8 Abs. 1 Nr. 1 SGB IV; GfR 2026 Bsp. 7a | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| „Minijob“ mit Stundenlohn, erwartet 603,01 € | § 8 Abs. 1 Nr. 1, § 20 Abs. 2 SGB IV | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| Minijob 600 € und Weihnachtsgeld 36 € mit Rechtsanspruch (Jahr genau 7.236 €) | § 8 Abs. 1a SGB IV; GfR 2026 Bsp. 6 | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| Minijob 600 € und Weihnachtsgeld 37 € mit Rechtsanspruch (Jahr 7.237 €) | § 8 Abs. 1a SGB IV; GfR 2026 Bsp. 6 | 101 · 1111 · ÜB 1 | 101 (p) · 1111 · ÜB 1 |
| Minijob 600 € und eine freiwillige Prämie von 100 € ohne Rechtsanspruch | § 8 Abs. 1a SGB IV: regelmäßiges Arbeitsentgelt; abgeleitet aus GfR 2026 Bsp. 6, das ein vertraglich zugesagtes Weihnachtsgeld einrechnet | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| Auszubildende mit genau 325,00 € | § 20 Abs. 3 S. 1 Nr. 1 SGB IV; DEÜV Anlage 2 (121) | 121 · 1111 · ÜB 0 | 121 · 1111 · ÜB 0 |
| Auszubildende mit 325,01 € | § 20 Abs. 3 S. 1 Nr. 1, Abs. 2a SGB IV; DEÜV Anlage 2 (102) | 102 · 1111 · ÜB 0 | 102 · 1111 · ÜB 0 |
| Auszubildende mit 0,01 € | § 20 Abs. 3 S. 1 Nr. 1 SGB IV; DEÜV Anlage 2 (121) | 121 · 1111 · ÜB 0 | 121 · 1111 · ÜB 0 |
| Auszubildende ohne Vergütung (0,00 €) | DEÜV Anlage 2 (121: „gilt nicht für Auszubildende ohne Arbeitsentgelt“, 102); § 5 Abs. 1 Nr. 10 SGB V | 102 · 0110 · ÜB 0 | 102 · 0110 · ÜB 0 |
| vorgeschriebenes Vorpraktikum mit 0,01 € | DEÜV Anlage 2 (105, 121); RS Studenten und Praktikanten 2016, Teil C | 121 · 1111 · ÜB 0 | 121 · 1111 · ÜB 0 |
| vorgeschriebenes Vorpraktikum mit 325,01 € | DEÜV Anlage 2 (105); § 20 Abs. 2a SGB IV (kein Übergangsbereich) | 105 · 1111 · ÜB 0 | 105 · 1111 · ÜB 0 |
| versicherungspflichtig mit genau 6.450,00 € (Jahr = JAEG 77.400 €) | § 6 Abs. 1 Nr. 1, Abs. 6 SGB V („übersteigt“) | 101 · 1111 · ÜB 0 | 101 · 1111 · ÜB 0 |
| 6.450,01 € (über der JAEG), freiwillig gesetzlich, Firmenzahler | § 6 Abs. 1 Nr. 1 SGB V; GfR 2026 Bsp. 25 | 101 · 9111 · ÜB 0 | 101 · 9111 · ÜB 0 |
| 6.450,01 € (über der JAEG), freiwillig gesetzlich, Selbstzahler | § 6 Abs. 1 Nr. 1 SGB V; GfR 2026 Bsp. 26 | 101 · 0111 · ÜB 0 | 101 · 0111 · ÜB 0 |

## Quellen

- Geringfügigkeits-Richtlinien 2026 (GKV-Spitzenverband, DRV Bund, DRV Knappschaft-Bahn-See, BA), Stand 05.01.2026
- Gemeinsames Rundschreiben „Versicherungsrechtliche Beurteilung von beschäftigten Studenten, Praktikanten und ähnlichen Personen“ (GKV-Spitzenverband, DRV Bund, BA), Stand 23.11.2016
- Gemeinsames Rundschreiben „Beschäftigungen im Übergangsbereich nach § 20 Abs. 2 SGB IV ab dem 01.01.2023“ (GKV-Spitzenverband, DRV Bund, BA), Stand 20.12.2022
- Gesetzestexte (gesetze-im-internet.de, Fassung vom 29.10.2026) mit DEÜV Anlagen 1, 2, 16
- DEÜV Anlage 2 – Schlüsselzahlen für Personengruppen, Stand 17.06.2026
