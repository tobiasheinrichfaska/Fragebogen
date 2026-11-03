# SV-Beurteilung nach amtlichen Beispielen – Personalfragebogen: Angaben für die Lohnabrechnung 0.1.0

> Erzeugt aus `tests/fixtures/sv-vorgaben/` und der Formulardefinition (`npm run catalogue`), nicht von
> Hand bearbeiten. Keine Rechtsberatung. Je Zeile ein Beispiel aus einer amtlichen oder veröffentlichten
> Quelle, mit erfundener Person: erwartete Personengruppe · Beitragsgruppen (KV RV AV PV) · Kennzeichen
> Übergangsbereich (ÜB) und der Vorschlag der App für dieselben Antworten; „(p)“ = mit Prüfvermerk.
> Belegt: S = Sachverhalt; O = am Original geprüft, A = abgeleitet, N = nicht verifiziert.

235 Fälle aus 3 Datei(en): 227 abbildbar, 8 nicht abbildbar; 226 gleich, 1 abweichend. 297 abgeleitete Varianten, 39 Grenzfälle.

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
| ST-01 | RS Studenten, Bsp. 1 | Student 25 Std./Woche unbefristet | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| ST-02A | RS Studenten, Bsp. 2 | Werkstudentenjob 18 Std. neben Minijob 7 Std.: zusammen über 20 Std. | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| ST-02B | RS Studenten, Bsp. 2 | Student, Minijob 300 € neben (versicherungspflichtig gewordener) Beschäftigung | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| ST-04 | RS Studenten, Bsp. 4 | Student 25 Std. befristet, mit Vorbeschäftigungen | 101 · 1111 · ÜB 1; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 · 3111 (p) · ÜB 1 | gleich |
| ST-SF | RS Studenten, A 1.2.4 b | Student, Einsätze nur in der vorlesungsfreien Zeit | 106 · 0100 | S O, PGR A, BGR A | 106 · 0100 · ÜB 1 | gleich |
| ST-KF | RS Studenten, C 1 | Student, Ferienjob zwei Monate Vollzeit: kurzfristig | 110 · 0000 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| ST-WS | RS Studenten, A 1.2.4 a | Werkstudent 15 Std./Woche | 106 · 0100 | S O, PGR O, BGR A | 106 · 0100 · ÜB 1 | gleich |
| ST-WSMJ | RS Studenten, C 1 | Werkstudent mit Minijob-Verdienst | 109 · 6100 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 109 · 6100 (p) · ÜB 0 | gleich |
| ST-ZP | RS Studenten, C 3 | Vorgeschriebenes Zwischenpraktikum | 190 · 0000 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| ST-VP | RS Studenten, C 3 | Vorgeschriebenes Vorpraktikum mit Entgelt | 105 · 1111 · ÜB 0 | S O, PGR O, BGR A, ÜB O | 105 · 1111 · ÜB 0 | gleich |
| ST-VP0 | RS Studenten, C 3 | Vorgeschriebenes Vorpraktikum ohne Entgelt | 105 · 0110 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 105 · 0110 · ÜB 0 | gleich |
| ST-FZPMJ | RS Studenten, A 3.5 / GfR C 3.3.2 | Freiwilliges Praktikum im Studium mit Minijob-Verdienst | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
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
| KK-TK-01 | TK FI Studierende 2026, Bsp. 3 | Werkstudent 19 Std./Woche, 1.500 €, unbefristet | 106 · 0100 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| KK-TK-02 | TK FI Studierende 2026, Bsp. 4 | Studierender 28 Std./Woche mit regelmäßiger Nachtarbeit, 2.350 € | 101 · 1111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| KK-TK-03 | TK FI Studierende 2026, Bsp. 5 | Zweite Studentenbeschäftigung: zusammen 22 Std./Woche | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| KK-TK-04 | TK FI Studierende 2026, Bsp. 6 | Zwei kleine Studentenjobs über der Minijob-Grenze, zusammen 12 Std./Woche | 106 · 0100 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1111 · ÜB 1 (p) | abweichend (K) |
| KK-TK-05 | TK FI Studierende 2026, Bsp. 7 | Studierender 24 Std./Woche mit Nacht- und Wochenendeinsätzen, 1.800 € | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| KK-TK-06 | TK FI Studierende 2026, Zusatzbeispiel | Werkstudent genau 20 Std./Woche, in den Semesterferien 40 Std. | 106 · 0100; UEBERGANGSBEREICH unsicher | S O, PGR A, BGR A, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| KK-TK-07 | TK FI Studierende 2026, Bsp. 8 | Studentin, befristet 05.07.–15.10., 40 Std., nur 3 Tage in der Vorlesungszeit | 106 · 0100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 106 · 0100 · ÜB 0 | gleich |
| KK-TK-08 | TK FI Studierende 2026, Bsp. 10 | Vorgeschriebenes Vorpraktikum ohne Entgelt, 37 Std./Woche | 105 · 0110 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 105 · 0110 · ÜB 0 | gleich |
| KK-TK-09 | TK FI Studierende 2026, Bsp. 11 | Freiwilliges Praktikum im Studium, 3 Monate, 500 €: kurzfristig | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-TK-10 | TK FI Studierende 2026, Bsp. 12 | Praxisintegriertes duales Studium, 500 € | 102 · 1111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 102 · 1111 · ÜB 0 | gleich |
| KK-TK-11 | TK FI Studierende 2026, Bsp. 2 | Student, dritte kurzfristige Beschäftigung: 126 Kalendertage, aber genau 70 Arbeitstage | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 (p) · 0000 (p) · ÜB 0 (p) | gleich |
| KK-TK-12 | TK FI Minijobs 2026, Bsp. 1 | Befreiungsantrag im Beginnmonat: Befreiung ab Beschäftigungsbeginn | 109 · 6500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| KK-TK-13 | TK FI Minijobs 2026, Bsp. 2 | Einmalige Aufhebung der RV-Befreiung ab 01.07.2026 (§ 6 Abs. 6 SGB VI) | 109 · 6500 · ÜB 0; ab 01.09.2026: 109 · 6100 | S O, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| KK-TK-14 | TK FI Minijobs 2026, Zusatzbeispiel 603 € | Minijob genau 603 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-15 | TK FI Minijobs 2026, Bsp. 5 | Befristeter Minijob Mai–September mit schwankendem Entgelt, Durchschnitt 600 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-16 | TK FI Minijobs 2026, Bsp. 6 | Minijob mit Gleitzeitkonto, 15 €/Std., fest 600 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-17 | TK FI Minijobs 2026, Bsp. 7 | 680 € mit 80 € Entgeltumwandlung (Direktversicherung) | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-18 | TK FI Minijobs 2026, Zusatzbeispiel Nachtzuschlag | 600 € Grundlohn plus 50 € steuerfreier Nachtzuschlag | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-19 | TK FI Minijobs 2026, Bsp. 11 | Zwei Minijobs je 300 €, gesetzlich versichert | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| KK-TK-20 | TK FI Minijobs 2026, Bsp. 13 | Zweiter Minijob 280 € neben Hauptbeschäftigung 800 € und erstem Minijob 320 € | 101 · 1101 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1101 (p) · ÜB 1 (p) | gleich |
| KK-TK-21 | TK FI Minijobs 2026, Bsp. 15/16 | Hausfrau, Aushilfe 01.07.–30.09. für 1.500 €, später unvorhergesehen verlängert | 110 · 0000 · ÜB 0; ab 01.10.2026: 101 · 1111 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-TK-22 | TK FI Minijobs 2026, Bsp. 17 | Schüler, dritte befristete Aushilfe: 103 Kalendertage bzw. 72 Arbeitstage im Jahr | 101 · 3101 · ÜB 1; KV, AV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3101 (p) · ÜB 1 | gleich |
| KK-TK-23 | TK FI Minijobs 2026, Bsp. 18 | Aushilfe nach mehr als drei Monaten versicherungspflichtiger Vorbeschäftigung: berufsmäßig | 101 · 3111 · ÜB 1; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| KK-TK-24 | TK FI Minijobs 2026, Bsp. 19 | Altersrentnerin, kurzfristige Aushilfe nach dem Renteneintritt | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-TK-25 | TK FI Minijobs 2026, Zusatzbeispiel BFD | Abiturient vor dem Bundesfreiwilligendienst: berufsmäßig | 101 · 3111 · ÜB 1; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| KK-TK-26 | TK FI Minijobs 2026, Zusatzbeispiel 1.900 € | 1.900 € plus Weihnachtsgeld 1.900 €: über 2.000 € im Durchschnitt | 101 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| KK-TK-27 | TK FI Minijobs 2026, Zusatzbeispiel 700/800 | Zwei versicherungspflichtige Teilzeitjobs 700 € und 800 € | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| KK-TK-28 | TK Beratungsblatt Minijobs, Bsp. 2 | 580 € plus Weihnachtsgeld 350 €: 609,17 € im Durchschnitt | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| KK-TK-29 | TK Beratungsblatt Minijobs, Bsp. 3 | Drei Minijobs 200 €, 220 € und 180 €: zusammen 600 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| KK-TK-30 | TK Beratungsblatt Minijobs, Bsp. 4 | Drei Minijobs 260 €, 300 € und 560 €: zusammen 1.120 € | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 (p) | gleich |
| KK-TK-31 | TK Beratungsblatt Minijobs, Bsp. 5 | Minijob 160 € neben einer Hauptbeschäftigung mit nur 610 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| KK-TK-32 | TK Beratungsblatt Minijobs, Bsp. 6 | Zweiter Minijob 140 € neben Hauptbeschäftigung 610 € und Minijob 160 € | 101 · 1101 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1101 (p) · ÜB 1 (p) | gleich |
| KK-TK-33 | TK Beratungsblatt Minijobs, Bsp. 7 | Zweiter Minijob lässt Hauptbeschäftigung und Minijob über die JAEG steigen | 101 · 1101 · ÜB 0; ab 01.01.2027: 101 · 0101 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1101 (p) · ÜB 0 | gleich |
| KK-TK-34 | TK Beratungsblatt Minijobs, Bsp. 8 | Zweiter Minijob neben Hauptbeschäftigung schon über der JAEG, privat versichert | 101 · 0100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 101 (p) · 0100 (p) · ÜB 0 | gleich |
| KK-TK-35 | TK Beratungsblatt Minijobs, Bsp. 9 | Minijob 570 €, ab 01.09. Gehaltserhöhung auf 610 € | 109 · 6100 · ÜB 0; ab 01.09.2026: 101 · 1111 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-36 | TK Beratungsblatt Minijobs, Bsp. 11 | Schülerin, Ferienjob 01.07.–15.08. für 600 € | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-TK-37 | TK Beratungsblatt Minijobs, Bsp. 12 | Unbefristet eingestellte Aushilfe, nach einem Monat beendet | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| KK-TK-38 | TK Beratungsblatt Minijobs, Bsp. 19 | Abiturient vor dem Studium, Aushilfe 01.08.–25.09. für 750 € | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-TK-39 | TK Beratungsblatt Minijobs, Bsp. 20 | Abiturient vor der Berufsausbildung, Aushilfe 01.08.–25.09. für 750 € | 101 · 3111 · ÜB 1; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| KK-TK-40 | TK Beratungsblatt Übergangsbereich, Bsp. 2 | Zwei versicherungspflichtige Jobs 1.100 € und 1.000 €: zusammen über 2.000 € | 101 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 0 | gleich |
| KK-TK-41 | TK Beratungsblatt Übergangsbereich, Bsp. 3 | Midijob 650 € neben Minijob 350 €: Minijob bleibt außen vor | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 1 (p) | gleich |
| KK-TK-42 | TK Beratungsblatt Übergangsbereich, Bsp. 6 | 510 € plus Weihnachtsgeld 600 €: 2026 ein Minijob (Quelle rechnet mit alter Grenze) | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-43 | TK FI Rentner 2026, Folie 32 | Altersteilrente nach Erreichen der Regelaltersgrenze | 101 · 1121 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1121 (p) · ÜB 1 | gleich |
| KK-TK-44 | TK FI Rentner 2026, Folie 33 | Vorgezogene Altersvollrente, Minijob ab 01.05.2026, Regelaltersgrenze im Oktober 2026 | 109 · 6100 · ÜB 0; ab 01.11.2026: 109 · 6500 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-TK-45 | TK FI Rentner 2026, Folie 34 | Regelaltersgrenze im April 2026 erreicht, ohne Rente in Vollzeit weiter | 101 · 1111 · ÜB 0; ab 01.05.2026: 101 · 1121 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| KK-TK-46 | TK FI Rentner 2026, Folie 26 | Pensionär nach der Regelaltersgrenze als Lehrkraft, 1.250 € | 119 · 0320; UEBERGANGSBEREICH unsicher | S O, PGR A, BGR A, ÜB A | 119 · 0320 (p) · ÜB 1 | gleich |
| KK-TK-47 | TK Webinar-FAQ Rentner 2026 | Privat versicherter Altersvollrentner nach der Regelaltersgrenze | 119 · 0320 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 119 · 0320 (p) · ÜB 0 | gleich |
| KK-TK-48 | TK FI Rentner 2026, Folie 17/18 | Rente wegen teilweiser Erwerbsminderung, 5 Std. täglich | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| KK-TK-49 | TK FI Rentner 2026, Bsp. 1 | Rentnerin (64) mit vorgezogener Vollrente im Minijob mit 603 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-BARMER-01 | BARMER Altersrentner 2026 | Neueinstellung neben vorgezogener Vollrente, Regelaltersgrenze am 10.09.2026 | 120 · 3111 · ÜB 0; ab 01.10.2026: 119 · 3321 | S O, PGR O, BGR A, ÜB A | 120 · 3111 · ÜB 0 | gleich |
| KK-BARMER-02 | BARMER Altersrentner 2026 | Minijob neben vorgezogener Rente mit RV-Befreiung, Regelaltersgrenze im August | 109 · 6500 · ÜB 0; ab 01.09.2026: 109 · 6500 | S O, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| KK-BARMER-03 | BARMER Altersrentner 2026 | Minijob nach der Regelaltersgrenze mit Verzicht auf die RV-Freiheit | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-BARMER-04 | BARMER Altersrentner 2026 | Regelaltersgrenze im Juli 2026, Vollrente ab 01.08.2026 und Beschäftigung | 119 · 3321 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 119 · 3321 (p) · ÜB 0 | gleich |
| KK-BARMER-05 | BARMER Schüler/Studierende 2026 | Abiturientin vor der Ausbildung, 12.07.–20.08. Vollzeit, 2.410 € | 101 · 3111 · ÜB 0; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3111 (p) · ÜB 0 | gleich |
| KK-BARMER-06 | BARMER Schüler/Studierende 2026 | Abiturient vor dem Studium, 14.06.–30.07. Vollzeit | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-BARMER-07 | BARMER Schüler/Studierende 2026 | Student 18 Std./Woche als Kellner, 1.100 € | 106 · 0100 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| KK-BARMER-08 | BARMER Schüler/Studierende 2026 | Student 22 Std./Woche unbefristet, 1.350 € | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| KK-BARMER-09 | BARMER Schüler/Studierende 2026 | Studentin 19 Std./Woche, in den Semesterferien 38 Std. | 106 · 0100; UEBERGANGSBEREICH unsicher | S O, PGR A, BGR A, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| KK-BARMER-10 | BARMER Schüler/Studierende 2026 | Minijob 245 € (4 Std.) neben Studentenjob 17 Std.: zusammen über 20 Std. | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| KK-BARMER-11 | BARMER Schüler/Studierende 2026 | Befristete Studentenbeschäftigung 25 Std., Vorbeschäftigungen zusammen 180 Kalendertage über 20 Std. | 106 · 0100 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 106 (p) · 0100 (p) · ÜB 1 | gleich |
| KK-BARMER-12 | BARMER Schüler/Studierende 2026 | Vorgeschriebenes Zwischenpraktikum 25 Std., 1.550 € | 190 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| KK-BARMER-13 | BARMER Schüler/Studierende 2026 | Vorgeschriebenes Vorpraktikum mit 300 €: Geringverdiener | 121 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 121 · 1111 · ÜB 0 | gleich |
| KK-BARMER-14 | BARMER Schüler/Studierende 2026 | Vorgeschriebenes Nachpraktikum ohne Vergütung, 30 Std. | 105 · 0110 · ÜB 0 | S O, PGR A, BGR O, ÜB A | 105 · 0110 · ÜB 0 | gleich |
| KK-BARMER-15 | BARMER Schüler/Studierende 2026 | Freiwilliges Zwischenpraktikum 4 Monate, 7,5 Std., 500 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| KK-MKK-01 | mkk Rentner 2025 | Altersvollrente vor der Regelaltersgrenze, 14 Std., 1.300 €; Regelaltersgrenze im September | 120 · 3111 · ÜB 1; ab 01.10.2026: 119 · 3321 | S O, PGR O, BGR O, ÜB A | 120 · 3111 · ÜB 1 | gleich |
| KK-AOK-01 | AOK Mehrfachbeschäftigung 2026 | Zwei Minijobs 300 € und 330 €: zusammen 630 € | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 (p) | gleich |
| KK-AOK-02 | AOK Mehrfachbeschäftigung 2026 | Kurzfristige Erntehilfe 650 € neben Minijob mit 603 € | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| MJZ-01 | MJZ-Magazin Berufsmäßigkeit 2026 | Vollzeitangestellter als Ordner an fünf Festival-Wochenenden, 600 € je Wochenende | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| MJZ-02 | MJZ-Magazin Hauptjob und Minijob 2026 | Zweiter Minijob 200 € neben Hauptjob und Minijob 300 € | 101 · 1101 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1101 (p) · ÜB 0 | gleich |
| MJZ-03 | MJZ Mehrere Minijobs 2026 | Reinigungskraft: Minijob 250 € ab Januar und 350 € ab Juni | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| KK-IP-01 | Informationsportal Steckbrief Berufsmäßigkeit 2026 | Kurzfristige Nebenbeschäftigung neben dem Bundesfreiwilligendienst | 110 · 0000 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KK-IP-02 | Informationsportal Steckbrief Berufsmäßigkeit 2026 | Asylbewerber als kurzfristige Aushilfe über der Grenze: berufsmäßig | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | nicht abbildbar |
| BE-01 | BE 21.05.2026 TOP 3 | Erntehelferin im landwirtschaftlichen Betrieb, 15 Wochen und 80 Arbeitstage | 110 · 0000 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| BE-02 | BE 21.05.2026 TOP 3 | Dieselbe Erntehilfe in einem Mischbetrieb mit überwiegend nicht landwirtschaftlichen Beschäftigten | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| BE-03 | BE 23.11.2016 TOP 3 | Pensionär mit Versorgung nach einer besonderen Altersgrenze verzichtet auf die RV-Freiheit | 120 · 0110 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 120 · 0110 · ÜB 1 | gleich |
| BA-01 | BA FW § 27 SGB III (07/2026) | Visagistin am Theater, auf fünf Tage befristet: unständige Beschäftigung | 118 · 1101; KV, UEBERGANGSBEREICH unsicher | S O, PGR A, BGR A, ÜB A | – · – · ÜB – | nicht abbildbar |
| BA-02 | BA FW § 27 SGB III (07/2026) | Zwei Saisonjobs in landwirtschaftlichen Betrieben: zusammen genau 105 Kalendertage | 110 · 0000 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KU-01 | lohn-info Lehrgang, Aufgabe 8, Bsp. 1 | Arbeiter mit Stundenlohn 15 € × 170 Stunden | 101 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| KU-02 | lohn-info Lehrgang, Aufgabe 8, Bsp. 3 | Auszubildender (18) mit 500 € Ausbildungsvergütung | 102 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 102 · 1111 · ÜB 0 | gleich |
| KU-03 | lohn-info Lehrgang, Aufgabe 8, Bsp. 4 | Auszubildender (18) mit 310 € Ausbildungsvergütung | 121 · 1111 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 121 · 1111 · ÜB 0 | gleich |
| KU-04 | lohn-info Lehrgang, Aufgabe 8, Bsp. 5 | Minijob 350 €, familienversichert, von der RV-Pflicht befreit | 109 · 6500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| KU-05 | lohn-info Lehrgang, Aufgabe 8a, Bsp. 7 | Altersvollrentner nach der Regelaltersgrenze, genau 2.000 € | 119 · 3321 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 119 · 3321 (p) · ÜB 1 | gleich |
| KU-06 | lohn-info Lehrgang, Aufgabe 8a, Bsp. 8 | Angestellter, privat versichert, Verdienst über der JAEG | 101 · 0110 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 101 · 0110 · ÜB 0 | gleich |
| KU-07 | lohn-info Lehrgang, Aufgabe 8a, Bsp. 9 | Kurzfristige Aushilfe einen Monat, 1.000 € | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| KU-08 | lohn-info Lehrgang, Aufgabe 8a, Bsp. 11 | Minijob 350 €, privat versichert, von der RV-Pflicht befreit | 109 · 0500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 0500 · ÜB 0 | gleich |
| VL-01 | lohn-info PGR 101, Bsp. 1 (A) | Hauptbeschäftigung 1.000 € neben zwei Minijobs (200 € befreit, 250 €) | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 (p) | gleich |
| VL-02 | lohn-info PGR 101, Bsp. 1 (C) | Zweiter Minijob 250 € neben Hauptbeschäftigung 1.000 € und erstem Minijob | 101 · 1101 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1101 (p) · ÜB 1 (p) | gleich |
| VL-03 | lohn-info PGR 101, Bsp. 2 (B) | Erster Minijob 200 € neben JAEG-freier Hauptbeschäftigung (Firmenzahler) | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 (p) · 6100 (p) · ÜB 0 | gleich |
| VL-04 | lohn-info PGR 101, Bsp. 2 (C) | Zweiter Minijob 180 € neben JAEG-freier Hauptbeschäftigung: zwei Meldungen | 101 · 0100 · ÜB 0; Minijob-Zentrale: 101 · 6000 | S O, PGR O, BGR O, ÜB A | 101 (p) · 0100 (p) · ÜB 0 | gleich |
| VL-05 | lohn-info PGR 101, Tabelle | Versorgungswerk-Mitglied, privat versichert, über der JAEG | 101 · 0010 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 101 · 0010 · ÜB 0 | gleich |
| VL-06 | lohn-info Rentner, Übersicht | Altersteilrente nach der Regelaltersgrenze | 101 · 1121 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 101 · 1121 (p) · ÜB 0 | gleich |
| VL-07 | lohn-info Rentner, Übersicht | Rente wegen teilweiser Erwerbsminderung, Teilzeit 1.200 € | 101 · 1111 · ÜB 1; AV unsicher | S A, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| VL-08 | lohn-info PGR 190/106 | Werkstudent im Zweitstudium, Mitglied eines Versorgungswerks | 190 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| VL-09 | lohn-info PGR 190 | Apothekerin im Minijob, privat versichert, Versorgungswerk | 190 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| VL-10 | lohn-info PGR 190 | Beurlaubter Beamter als Lehrer an einer Privatschule | 190 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | – · – · ÜB – | nicht abbildbar |
| VL-11 | lohn-info PGR 119 | Altersvollrentner nach der Regelaltersgrenze, privat versichert | 119 · 0320 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 119 · 0320 (p) · ÜB 0 | gleich |
| VL-12 | lohn-info PGR 120 | Altersvollrente vor der Regelaltersgrenze, privat versichert | 120 · 0110 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 120 · 0110 (p) · ÜB 0 | gleich |
| VL-13 | lohn-info PGR 120 | Altersvollrente nach der Regelaltersgrenze, privat versichert, mit Verzicht | 120 · 0120 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 120 · 0120 (p) · ÜB 0 | gleich |
| VL-14 | lohn-info PGR 121/102 | Außerbetriebliche Ausbildung mit 800 € | 122 · 1111 · ÜB 0 | S A, PGR O, BGR A, ÜB A | 122 · 1111 · ÜB 0 | gleich |
| VL-15 | Haufe Dualer Student, Abschn. 3 | Praxisintegriertes duales Studium mit 300 € | 121 · 1111 · ÜB 0 | S A, PGR O, BGR A, ÜB A | 121 · 1111 · ÜB 0 | gleich |
| VL-16 | lohn-info Werkstudenten | Langzeitstudent im 27. Fachsemester, 15 Stunden | 101 · 1111 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| VL-17 | Haufe Praktikant, Kap. 2 | Vorgeschriebenes Zwischenpraktikum 300 €, freiwillig versichert | 190 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 190 · 0000 · ÜB 0 | gleich |
| VL-18 | Haufe Praktikant, Kap. 4 | Freiwilliges Zwischenpraktikum in den Semesterferien, 530 € | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-19 | Haufe Praktikant, Kap. 5 | Freiwilliges Zwischenpraktikum sechs Monate, 530 € | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-20 | Haufe Praktikant, Kap. 6 | Freiwilliges Zwischenpraktikum 22 Stunden, 1.580 € | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB O | 101 · 1111 · ÜB 1 | gleich |
| VL-21 | Haufe Praktikant, Kap. 7 | Vorgeschriebenes Vorpraktikum 300 € (Geringverdiener) | 121 · 1111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 121 · 1111 · ÜB 0 | gleich |
| VL-22 | Haufe Praktikant, Kap. 8 | Vorgeschriebenes Vorpraktikum 800 €, vorher privat versichert | 105 · 1111 · ÜB 0 | S O, PGR O, BGR O, ÜB O | 105 · 1111 (p) · ÜB 0 | gleich |
| VL-23 | Haufe Praktikant, Kap. 9 | Vorgeschriebenes Nachpraktikum ohne Entgelt | 105 · 0110 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 105 · 0110 · ÜB 0 | gleich |
| VL-24 | Haufe Praktikant, Kap. 10 | Freiwilliges Vorpraktikum vier Monate, 510 € | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-25 | Haufe Studentenjobs, Kap. 1 | Student im Minijob 590 €, gesetzlich versichert | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-26 | Haufe Studentenjobs, Kap. 1 | Student im Minijob 590 €, privat versichert, befreit | 109 · 0500 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 0500 · ÜB 0 | gleich |
| VL-27 | Haufe Studentenjobs, Kap. 2 | Student, befristet zwei Monate Vollzeit, 2.400 € | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-28 | Haufe Studentenjobs, Kap. 3 | Werkstudent 17 Stunden, 1.000 €: Übergangsbereich | 106 · 0100 · ÜB 1 | S O, PGR O, BGR O, ÜB O | 106 · 0100 · ÜB 1 | gleich |
| VL-29 | Haufe Studentenjobs, Kap. 4 | Student befristet fünf Monate, 24 Stunden mit Wochenendarbeit | 106 · 0100 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| VL-30 | Haufe Studentenjobs, Kap. 5 | Student unbefristet, 24 Stunden mit Wochenendarbeit | 101 · 1111 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 1 | gleich |
| VL-31 | Haufe Studentenjobs, Kap. 6 | Werkstudent 20 Stunden, später befristet Wochenendstunden dazu | 106 · 0100 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| VL-32 | Haufe Studentenjobs, Kap. 7 | Werkstudent 20 Stunden, in den Semesterferien 40 Stunden | 106 · 0100 | S O, PGR A, BGR O | 106 · 0100 · ÜB 1 | gleich |
| VL-33 | Haufe Studentenjobs, Kap. 8 | Zweite Ferienbeschäftigung nach einer kurzfristigen, 40 Stunden | 106 · 0100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 106 · 0100 · ÜB 0 | gleich |
| VL-34 | Haufe Kurzfristige Beschäftigung, Kap. 1 | Urlaubsvertretung nach zwei Vorbeschäftigungen: Zeitgrenze überschritten | 101 · 1111 · ÜB 1; KV unsicher | S O, PGR A, BGR A, ÜB A | 101 (p) · 3111 (p) · ÜB 1 | gleich |
| VL-35 | Haufe Kurzfristige Beschäftigung, Kap. 5 | Arbeitsuchender, Wochenendaushilfe 100 € | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-36 | Haufe Mehrfachbeschäftigung, Kap. 1 | Kurzfristige Aushilfe im Einzelhandel, 2.000 € (Sechs-Tage-Woche) | 110 · 0000 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-37 | Haufe Mehrfachbeschäftigung, Kap. 1 | Befristeter Minijob 500 € nach einer kurzfristigen Beschäftigung | 109 · 6100 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-38 | Haufe Mehrfachbeschäftigung, Kap. 2 | Zweiter Minijob 100 € neben Hauptbeschäftigung 4.000 € | 101 · 1101 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 (p) · 1101 (p) · ÜB 0 | gleich |
| VL-39 | Haufe Mehrfachbeschäftigung, Kap. 4 | Teilzeit 900 € neben Minijob und kurzfristiger Beschäftigung: Übergangsbereich | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB O | 101 · 1111 · ÜB 1 (p) | gleich |
| VL-40 | Haufe Mehrfachbeschäftigung, Kap. 4 | Wochenendaushilfe neben Teilzeit und Minijob: kurzfristig | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-41 | Haufe Mehrfachbeschäftigung, Kap. 5 | Zwei Minijobs je 250 €, beide befreit | 109 · 6500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6500 (p) · ÜB 0 | gleich |
| VL-42 | Haufe Mehrfachbeschäftigung, Kap. 6 | Zwei Minijobs je 400 €: beide versicherungspflichtig | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB O | 101 (p) · 1111 · ÜB 1 (p) | gleich |
| VL-43 | Haufe Geringfügig entlohnte Beschäftigung, 1.3 | Studentin, befristet ein Jahr, ca. 300 € plus Weihnachtsgeld, privat versichert | 109 · 0100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 0100 · ÜB 0 | gleich |
| VL-44 | Haufe Geringfügig entlohnte Beschäftigung, 1.4 | Trainer im Sportverein 750 € mit Übungsleiterfreibetrag | 109 · 6100 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 101 (p) · 1111 · ÜB 0 | nicht abbildbar |
| VL-45 | Haufe Geringfügig entlohnte Beschäftigung, 1.5 | Beamter mit zweitem Nebenjob 250 €: beide Nebenjobs pflichtig | 101 · 0110 · ÜB 1 | S O, PGR O, BGR O, ÜB O | 101 (p) · 0110 · ÜB 1 (p) | gleich |
| VL-46 | Haufe Geringfügig entlohnte Beschäftigung, 2.1 | Aushilfe 500 € mit Urlaubs- und Weihnachtsgeld: über der Jahresgrenze | 101 · 1111 · ÜB 1 | S O, PGR A, BGR A, ÜB A | 101 (p) · 1111 · ÜB 1 | gleich |
| VL-47 | Haufe Nebenbeschäftigung, Kap. 3 | Minijob 483,72 € neben Hauptbeschäftigung, einmal unvorhersehbar darüber | 109 · 6500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 (p) · 6500 (p) · ÜB 0 | gleich |
| VL-48 | Haufe Nebenbeschäftigung, Kap. 5 | Bezieher von Arbeitslosengeld im Minijob, befreit | 109 · 6500 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6500 · ÜB 0 | gleich |
| VL-49 | Haufe Rentnerbeschäftigung, Kap. 1 | Altersvollrente nach der Regelaltersgrenze, Beginn 1.7.2026 | 119 · 3321 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 119 · 3321 (p) · ÜB 0 | gleich |
| VL-50 | Haufe Rentnerbeschäftigung, Kap. 1 | Altersvollrente nach der Regelaltersgrenze mit Verzicht, 1.800 € | 120 · 3121 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 120 · 3121 (p) · ÜB 1 | gleich |
| VL-51 | Haufe Rentnerbeschäftigung, Kap. 2 | Altersvollrente vor der Regelaltersgrenze, Beginn 1.8.2026 | 120 · 3111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 120 · 3111 · ÜB 0 | gleich |
| VL-52 | Haufe Rentnerbeschäftigung, Kap. 3 | Altersvollrente vor der Regelaltersgrenze, Wechsel bei Erreichen der Grenze | 120 · 3111 · ÜB 1; ab 01.08.2027: 119 · 3321 | S O, PGR O, BGR O, ÜB A | 120 · 3111 · ÜB 1 | gleich |
| VL-53 | Haufe Rentnerbeschäftigung, Kap. 4 | Altersteilrente vor der Regelaltersgrenze | 101 · 1111 · ÜB 0 | S O, PGR O, BGR O, ÜB A | 101 · 1111 · ÜB 0 | gleich |
| VL-54 | Haufe Rentnerbeschäftigung, Kap. 6 | Volle Erwerbsminderungsrente, Teilzeit | 101 · 3101 · ÜB 1 | S O, PGR O, BGR O, ÜB A | 101 · 3101 (p) · ÜB 1 | gleich |
| VL-55 | Haufe News 28.09.2026 | Altersvollrentner als Aushilfe nach einer Vollzeitstelle vor Rentenbeginn | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-56 | Haufe News 28.09.2026 | Altersteilrentner als befristete Aushilfe über der Grenze, ohne Vorbeschäftigungen | 110 · 0000 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-57 | Haufe Schüler, Kap. 2 | Schüler, Rahmenvereinbarung für Samstage, höchstens 70 Arbeitstage | 110 · 0000 · ÜB 0 | S O, PGR O, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-58 | Haufe Schüler, Kap. 1 | Schüler im Minijob 450 € | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-59 | Lexware FAQ Rentner | Regelaltersgrenze erreicht, Rente noch nicht beantragt | 101 · 1121 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 101 · 1121 (p) · ÜB 0 | gleich |
| VL-60 | Lexware FAQ Rentner | Altersvollrentner nach der RAG über der JAEG, Firmenzahler | 119 · 9321 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 119 · 9321 (p) · ÜB 0 | gleich |
| VL-61 | Lexware FAQ Rentner | Altersvollrentner nach der RAG über der JAEG, Firmenzahler, mit Verzicht | 120 · 9121 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 120 · 9121 (p) · ÜB 0 | gleich |
| VL-62 | Lexware FAQ Rentner | Altersvollrente vor der RAG über der JAEG, Firmenzahler | 120 · 9111 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 120 · 9111 · ÜB 0 | gleich |
| VL-63 | Lexware FAQ Rentner | Altersvollrentner nach der RAG über der JAEG, Selbstzahler | 119 · 0321 · ÜB 0 | S A, PGR A, BGR A, ÜB A | 119 · 0321 (p) · ÜB 0 | gleich |
| VL-64 | Lexware FAQ Rentner | Altersrente eines Versorgungswerks nach der RAG | 119 · 3321 · ÜB 0 | S A, PGR O, BGR O, ÜB A | 119 · 3321 (p) · ÜB 0 | gleich |
| VL-65 | Lexware FAQ Rentner | Pensionär wegen Alters nach der RAG, Beihilfe, privat versichert | 119 · 0320 · ÜB 1 | S A, PGR O, BGR O, ÜB A | 119 · 0320 (p) · ÜB 1 | gleich |
| VL-66 | personalwissen Übersicht Studenten | Student in den Semesterferien Vollzeit 2.000 €, ohne Vorbeschäftigung | 110 · 0000 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 110 · 0000 · ÜB 0 | gleich |
| VL-67 | personalwissen Übersicht Studenten | Student in den Semesterferien Vollzeit 2.000 €, nach einer Aushilfe im Frühjahr | 106 · 0100 · ÜB 1 | S A, PGR A, BGR A, ÜB A | 106 · 0100 · ÜB 1 | gleich |
| VL-68 | personalwissen Übersicht Studenten | Student im unbefristeten Minijob genau an der Grenze | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| VL-69 | lohn-info Geringfügige Beschäftigungen | Minijob durch Entgeltumwandlung: 600 € minus 200 € bAV | 109 · 6100 · ÜB 0 | S O, PGR A, BGR A, ÜB A | 109 · 6100 · ÜB 0 | gleich |
| BL-01 | lohndialog Aktivrente 2026 | Altersvollrentner erreicht die Regelaltersgrenze während der Beschäftigung | 120 · 3111 · ÜB 0; ab 01.08.2026: 119 · 3321 | S A, PGR O, BGR O, ÜB A | 120 · 3111 · ÜB 0 | gleich |

## Abweichungen

- **K – Studierende in einer als Minijob oder versicherungspflichtig gewählten Beschäftigung: Werkstudentenprivileg nicht geprüft (Wochenstunden nur bei „Werkstudent“ gefragt):** KK-TK-04

## Nicht abbildbar

- **GFR-07c** (GfR 2026, Bsp. 7c): Der Fragebogen beurteilt eine Beschäftigung mit einem Monats- bzw. Durchschnittsentgelt zum Beginn; zwei Zeiträume mit verschiedenem Status (erheblich schwankendes Entgelt, GfR B 2.2.1.2) kann er nicht ausdrücken. Mit dem Durchschnitt (rund 450 €) schlägt er 109/6100 (prüfen) vor.
- **GFR-11** (GfR 2026, Bsp. 11): Steuerfreie Aufwandsentschädigungen (§ 3 Nr. 26/26a EStG) und ihre Verteilung (en bloc / pro rata) fragt der Fragebogen nicht ab; mit 920 € ergibt sich 101/1111 (Übergangsbereich 1).
- **GFR-27** (GfR 2026, Bsp. 27): Beginn 2025 liegt außerhalb der Gültigkeit des Fragebogens (Beschäftigungsbeginn 2026); der Statuswechsel zum Jahreswechsel (JAEG des Folgejahres) wird nicht beurteilt. Erwartet ist hier die Lage ab 01.01.2026 für C.
- **GFR-29** (GfR 2026, Bsp. 29): Minijobs im Privathaushalt laufen über das Haushaltsscheckverfahren (Personengruppe 209); der Fragebogen schließt sie bewusst aus (Ausschluss „haushaltsscheck“). Test: Ausschluss greift, kein Vorschlag.
- **KK-IP-02** (Informationsportal Steckbrief Berufsmäßigkeit 2026): Der Fragebogen kennt den Status „Asylbewerber/Geduldet“ nicht als Antwort; er steht nur als Freitext unter „sonstiges“, den die Regeln nicht lesen. Erwartet ist 101/1111; ein Vorschlag 110 wäre falsch.
- **BA-01** (BA FW § 27 SGB III (07/2026)): Unständig Beschäftigte (Personengruppe 118) schließt der Fragebogen über den Ausschluss „unstaendig“ aus (versicherungspflichtige Beschäftigung auf weniger als eine Woche befristet). Test: Ausschluss greift, kein Vorschlag. Personengruppe 118 steht nicht in tests/support/anlage16.ts; die Beitragsgruppe ist nicht geprüft.
- **VL-10** (lohn-info PGR 190): Der Arbeitgeber gibt „Fortzahlung der Bezüge und Beihilfe nach beamtenrechtlichen Grundsätzen“ an (agSonderstatus „beamtenrechtlich“); der Fragebogen schließt diesen Fall bewusst aus (Ausschluss „beamtenrechtlich“). Test: Ausschluss greift, kein Vorschlag.
- **VL-44** (Haufe Geringfügig entlohnte Beschäftigung, 1.4): Den steuer- und beitragsfreien Übungsleiterfreibetrag (§ 3 Nr. 26 EStG, 2026: 3.300 € im Jahr) fragt der Fragebogen nicht ab; mit 750 € Monatsentgelt liegt der Minijob für die Regeln über der Grenze. Wie GFR-11.

## Grenzfälle 2026

| Fall | Grundlage | Erwartet | App |
| --- | --- | --- | --- |
| Werkstudent(in) 1.200 €, genau 20 Wochenstunden | RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a; DEÜV Anlage 2 (106) | 106 · 0100 · ÜB 1 | 106 · 0100 · ÜB 1 |
| Werkstudent(in) 1.200 €, 20,5 Wochenstunden, nicht am Wochenende oder abends | RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a, Beispiel 4 | 101 · 1111 · ÜB 1 | 101 · 1111 · ÜB 1 |
| Werkstudent(in) 1.200 €, 25 Wochenstunden abends, 26 Wochen befristet | RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a | 106 · 0100 · ÜB 1 | 106 · 0100 · ÜB 1 |
| Werkstudent(in) 1.200 €, 25 Wochenstunden abends, 26 Wochen und ein Tag | RS Studenten und Praktikanten 2016, Tz. A 1.2.4 a, Beispiel 1 | 101 · 1111 · ÜB 1 | 101 · 1111 · ÜB 1 |
| Werkstudent(in) 12 Wochenstunden für 600 € (Minijob geht vor) | RS Studenten und Praktikanten 2016, Tz. C 1; GfR 2026 C 2.2 | 109 · 6100 · ÜB 0 | 109 · 6100 · ÜB 0 |
| Werkstudent(in) in den Semesterferien, 01.08.–31.10. befristet (kurzfristig geht vor) | RS Studenten und Praktikanten 2016, Tz. A 1.2.4 c, C 1 | 110 · 0000 · ÜB 0 | 110 · 0000 · ÜB 0 |
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
- Techniker Krankenkasse: Beschäftigung von Studierenden und Praktikanten – Fachinformation für Firmenkunden 2026, Stand April 2026 – https://www.tk.de/resource/blob/2087696/af370920fdbb62a196d174837e9dfa8c/beschaeftigung-studierende-praktikanten---fachinformation-data.pdf
- Techniker Krankenkasse: Geringfügige Beschäftigungen und Midijobs – Fachinformation für Firmenkunden 2026, Stand April 2026 – https://www.tk.de/resource/blob/2087478/c537774be28e37d1acbe18913f833271/geringfuegige-beschaeftigungen-und-midijobs-i-fachinformation-data.pdf
- Techniker Krankenkasse: Beratungsblatt Geringfügige Beschäftigungen (Firmenkunden), Stand 09/2026 – https://www.tk.de/resource/blob/2031418/145cfb44038c3eb4b612a44254b07f42/beratungsblatt-geringfuegige-beschaeftigung-data.pdf
- Techniker Krankenkasse: Beratungsblatt Beschäftigungen im Übergangs-/Midijobbereich (Firmenkunden), Stand 03/2026 – https://www.tk.de/resource/blob/2031420/c5924456e673ed942a4be369a4ad070f/beratungsblatt-beschaeftigung-im-uebergangs-midijobbereich-data.pdf
- Techniker Krankenkasse: Beschäftigung von Rentnern – Fachinformation für Firmenkunden 2026, Stand April 2026 – https://www.tk.de/resource/blob/2122462/c633926ba9e73f6be198b01e2900c902/beschaeftigung-von-rentnern-i-fachinformation-data.pdf
- Techniker Krankenkasse: Ihre Webinar-FAQs – TK-Fachwebinar „Rentner beschäftigen und richtig abrechnen“ (Webinar vom 09.04.2026) – https://webinare.tk.de/fileadmin/user_upload/20260409_FAQ_-_Rentner_beschaeftigen_und_richtig_abrechnen_V1.pdf
- BARMER: Online-Seminar „Beschäftigung von Altersrentnerinnen und Altersrentnern 2026“, Seminarunterlagen vom 23.06.2026 – https://www.barmer.de/resource/blob/1240988/c540493d62551775403049318fbd7aef/seminarunterlagen-altersrentner-data.pdf
- BARMER: Handout „Beschäftigung von Schülern, Studierenden und Praktikanten“ (Online-Seminar 2026, Folien datiert 31.07.2026) – https://www.barmer.de/resource/blob/1259320/f98d8f30cbe8515d6151c83befcbf3a0/handout-schueler-studierende-praktikanten-data.pdf
- mkk – meine krankenkasse (BKK), Arbeitgeberservice: Vortragsfolien „Beschäftigung von Rentnern“, 28.10.2025 – https://arbeitgeber.meine-krankenkasse.de/fileadmin/Dokumente/Infothek/Arbeitgeber/Rentner.pdf
- AOK Fachportal für Arbeitgeber (AOK Baden-Württemberg): „Mehrfachbeschäftigungen bei Minijobs“, zuletzt aktualisiert 01.01.2026 – https://www.aok.de/fk/bw/sozialversicherung/minijobs/mehrfachbeschaeftigungen-bei-minijobs/
- Minijob-Zentrale, Magazin: „Kurzfristiger Minijob: So prüfen Arbeitgeber Berufsmäßigkeit“, veröffentlicht 09.04.2025, aktualisiert 12.02.2026 – https://magazin.minijob-zentrale.de/kurzfristiger-minijob-berufsmaessigkeit-pruefen/
- Minijob-Zentrale, Magazin: „Hauptjob und Minijob kombinieren – so geht es richtig!“, veröffentlicht 21.08.2024, aktualisiert 13.02.2026 – https://magazin.minijob-zentrale.de/hauptjob-minijob-kombinieren/
- Minijob-Zentrale: „Mehrere Minijobs gleichzeitig – geht das?“ (ohne Datum, Grenze 603 € ab 01.01.2026 genannt) – https://www.minijob-zentrale.de/DE/die-minijobs/mehrere-jobs/detailseite.html
- Informationsportal für Arbeitgeber (Arbeitgeberportal mehrerer Krankenkassen): Steckbrief „Berufsmäßigkeit“, Stand 01.01.2026 – https://www.informationsportal.de/wp-content/uploads/Steckbrief-Berufsmaessigkeit.pdf
- Besprechung des GKV-Spitzenverbandes, der DRV Bund und der BA über Fragen des gemeinsamen Beitragseinzugs am 21.05.2026 – https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Fachliteratur_Kommentare_Gesetzestexte/summa_summarum/besprechungsergebnisse/beitragseinzug/2026/2026_05_21_download.zip?__blob=publicationFile&v=2
- Besprechung des GKV-Spitzenverbandes, der DRV Bund und der BA über Fragen des gemeinsamen Beitragseinzugs am 23.11.2016 – https://www.deutsche-rentenversicherung.de/SharedDocs/Downloads/DE/Fachliteratur_Kommentare_Gesetzestexte/summa_summarum/besprechungsergebnisse/beitragseinzug/2016/2016_11_23_download.zip?__blob=publicationFile
- Bundesagentur für Arbeit: Fachliche Weisungen Arbeitslosenversicherung, § 27 SGB III Versicherungsfreie Beschäftigte, gültig ab 01.07.2026 (Stand 07/2026) – https://www.arbeitsagentur.de/datei/fw-sgb-iii-27_ba015174.pdf
- lohn-info.de, Lehrgang der Lohnabrechnung, Abschnitt Sozialversicherung: „Übungsaufgaben zur Beitragsberechnung“ (Beitragsjahr 2017, Privatwirtschaft; Arbeitsblatt ohne Lösungen) – https://www.lohn-info.de/lehrgang_sozialversicherung_aufgabe8a.html
- lohn-info.de, Lohnlexikon: „Personengruppenschlüssel 101 – Sozialversicherungspflichtig Beschäftigte ohne besondere Merkmale“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/personengruppenschluessel_101.html
- lohn-info.de, Lohnlexikon: „Rentner – Übersicht zur Beschäftigung von Rentnern“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/rentner.html
- lohn-info.de, Lohnlexikon: „Personengruppenschlüssel 190 – Beschäftigte, die ausschließlich in der gesetzlichen Unfallversicherung versichert sind“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/personengruppenschluessel_190.html
- lohn-info.de, Lohnlexikon: „Personengruppenschlüssel 119 – Versicherungsfreie Altersvollrentner und Versorgungsbezieher wegen Alters“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/personengruppenschluessel_119.html
- lohn-info.de, Lohnlexikon: „Personengruppenschlüssel 120 – Versicherungspflichtige Altersvollrentner und Versorgungsbezieher wegen Alters“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/personengruppenschluessel_120.html
- lohn-info.de, Lohnlexikon: „Personengruppenschlüssel 121 – Auszubildende, deren Arbeitsentgelt die Geringverdienergrenze nicht übersteigt“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/personengruppenschluessel_121.html
- Haufe Personal Office (Haufe-Lexware), Lexikonbeitrag „Dualer Student / 3 Meldungen“ (ohne Standdatum) – https://www.haufe.de/id/beitrag/dualer-student-3-meldungen-HI14926669.html
- lohn-info.de, Lohnlexikon: „Ordentliche Studierende – Werkstudenten“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/studenten_werkstudenten_ordentlichen_studierenden.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 2 Vorgeschriebenes Zwischenpraktikum bis 603 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-2-vorgeschriebenes-zwischenpraktikum-bis-603eur-monatlich-HI11296876.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 4 Nicht vorgeschriebenes Zwischenpraktikum während der Semesterferien“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-4-nicht-vorgeschriebenes-zwischenpraktikum-waehrend-der-semesterferien-HI1856642.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 5 Nicht vorgeschriebenes Zwischenpraktikum bis 603 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-5-nicht-vorgeschriebenes-zwischenpraktikum-bis-603eur-monatlich-HI1856643.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 6 Nicht vorgeschriebenes Zwischenpraktikum zwischen 603,01 EUR und 2.000 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI1856644.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 7 Vorgeschriebenes Vorpraktikum bis 603 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-7-vorgeschriebenes-vorpraktikum-bis-603eur-monatlich-HI11296877.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 8 Vorgeschriebenes Vorpraktikum über 603 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-8-vorgeschriebenes-vorpraktikum-ueber-603eur-monatlich-HI1856645.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 9 Vorgeschriebenes Nachpraktikum, kein Arbeitsentgelt“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-9-vorgeschriebenes-nachpraktikum-kein-arbeitsentgelt-HI1856647.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Praktikant / 10 Nicht vorgeschriebenes Vorpraktikum bis 603 EUR monatlich“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-praktikant-10-nicht-vorgeschriebenes-vorpraktikum-bis-603eur-monatlich-HI11296878.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 1 Minijob“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-studentenjobs-1-minijob-HI10158284.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 2 Kurzfristige Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-studentenjobs-2-kurzfristige-beschaeftigung-HI10158285.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 3 Beschäftigung mit wöchentlicher Arbeitszeit von nicht mehr als 20 Stunden“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI10158286.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 4 Überschreitung der 20-Wochenstunden-Grenze, Arbeit in den Abend- und Nachtstunden und am Wochenende, befristete Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI10158287.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 5 Überschreitung der 20-Wochenstunden-Grenze, Arbeit in den Abend- und Nachtstunden und am Wochenende, unbefristete Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI10158288.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 6 Befristete Überschreitung der 20-Wochenstunden-Grenze, Arbeit in den Abend- und Nachtstunden“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-studentenjobs-6-befristete-ueberschreitung-der-20-wochenstunden-grenze-arbeit-in-den-abend-und-nachtstunden-HI10672394.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 7 Überschreitung der 20-Wochenstunden-Grenze in den Semesterferien“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-studentenjobs-7-ueberschreitung-der-20-wochenstunden-grenze-in-den-semesterferien-HI10158289.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Studentenjobs / 8 Befristete Beschäftigungen ausschließlich in den Semesterferien“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-studentenjobs-8-befristete-beschaeftigungen-ausschliesslich-in-den-semesterferien-HI10158290.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Kurzfristige Beschäftigung / 1 Zeitgrenzen überschritten“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI13778423.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Kurzfristige Beschäftigung / 5 Arbeitsuchende“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-kurzfristige-beschaeftigung-5-arbeitsuchende-HI13778425.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Mehrfachbeschäftigung / 1 Kurzfristige neben geringfügiger Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-mehrfachbeschaeftigung-1-kurzfristige-neben-geringfuegiger-beschaeftigung-HI7484835.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Mehrfachbeschäftigung / 2 Hauptbeschäftigung und 2 geringfügig entlohnte Beschäftigungen“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI7489814.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Mehrfachbeschäftigung / 4 Hauptbeschäftigung, geringfügig entlohnte und kurzfristige Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-mehrfachbeschaeftigung-4-hauptbeschaeftigung-geringfuegig-entlohnte-und-kurzfristige-beschaeftigung-HI7484837.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Mehrfachbeschäftigung / 5 Mehrere geringfügige Beschäftigungen unter der Geringfügigkeitsgrenze“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI7484838.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Mehrfachbeschäftigung / 6 Mehrere geringfügige Beschäftigungen über der Geringfügigkeitsgrenze“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI7484839.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Geringfügig entlohnte Beschäftigung / 1.3 Studenten“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-geringfuegig-entlohnte-beschaeftigung-13-studenten-HI9478712.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Geringfügig entlohnte Beschäftigung / 1.4 Trainertätigkeit“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI9478713.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Geringfügig entlohnte Beschäftigung / 1.5 Beamte“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI9478714.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Geringfügig entlohnte Beschäftigung / 2.1 Weihnachtsgeld“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI9478716.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Nebenbeschäftigung / 3 Minijob, einmalig über der Geringfügigkeitsgrenze“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI1855589.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Nebenbeschäftigung / 5 Hinzuverdienst bei ALG“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-nebenbeschaeftigung-5-hinzuverdienst-bei-alg-HI1855592.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Rentnerbeschäftigung / 1 Altersvollrentenbezug nach Vollendung der Regelaltersgrenze, Beschäftigungsbeginn ab 2026“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-rentnerbeschaeftigung-1-altersvollrentenbezug-nach-vollendung-der-regelaltersgrenze-beschaeftigungsbeginn-ab-2026-HI10078268.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Rentnerbeschäftigung / 2 Altersvollrentenbezug vor Erreichen der Regelaltersgrenze, Beschäftigungsbeginn ab 2026“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-rentnerbeschaeftigung-2-altersvollrentenbezug-vor-erreichen-der-regelaltersgrenze-beschaeftigungsbeginn-ab-2026-HI10078271.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Rentnerbeschäftigung / 3 Altersvollrentenbezug vor Erreichen der Regelaltersgrenze“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-rentnerbeschaeftigung-3-altersvollrentenbezug-vor-erreichen-der-regelaltersgrenze-HI10078272.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Rentnerbeschäftigung / 4 Arbeitnehmer mit Teilrentenbezug wegen Alters vor Erreichen der Regelaltersgrenze“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/praxis-beispiele-rentnerbeschaeftigung-4-arbeitnehmer-mit-teilrentenbezug-wegen-alters-vor-erreichen-der-regelaltersgrenze-HI10078273.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Rentnerbeschäftigung / 6 Arbeitnehmer bezieht volle Erwerbsminderungsrente“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI10078274.html
- Haufe Online Redaktion, „Altersvollrentner in einer kurzfristigen Beschäftigung“, haufe.de Personal/Entgelt, 28.09.2026 – https://www.haufe.de/personal/entgelt/altersvollrentner-im-kurzfristigen-minijob_78_374746.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Schüler / 2 Kurzfristige Beschäftigung“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI1629375.html
- Haufe Personal Office (Haufe-Lexware), „Praxis-Beispiele: Schüler / 1 Minijob“ (ohne Standdatum, rechnet mit Werten 2026) – https://www.haufe.de/id/beitrag/x-HI1629374.html
- Lexware (Haufe-Lexware), Support-FAQ „(Altersvoll-) Rentner abrechnen“ (ohne Datum; Stand nach Inhalt 2024 oder später) – https://www.lexware.de/support/faq/faq-beitrag/000033545/
- personalwissen.de (VNR Verlag für die Deutsche Wirtschaft), Übersicht „Ihr Unternehmen kann einen Studenten wie folgt beschäftigen“ (Semesterferien 13.7.–15.10.2025) – https://static.personalwissen.de/wp-content/uploads/2025/05/Uebersicht_Beschaeftigungsmoeglichkeiten_Student.pdf
- lohn-info.de, Lohnlexikon: „Geringfügige Beschäftigungen (Minijob)“ (ohne Standdatum, © 2007–2026) – https://lohn-info.de/gering.html
- LohnDialog Abrechnungsgesellschaft mbH (Lohnbüro), Blog „Aktivrente 2026: Beitragsgruppenschlüssel und Abrechnung“, Stand September 2026 – https://www.lohndialog.de/aktivrente-2026-was-arbeitgeber-bei-der-lohnabrechnung-jetzt-beachten-muessen/
