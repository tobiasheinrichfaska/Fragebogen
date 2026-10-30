# Rechtliche Hintergründe

> **Keine Rechtsberatung.** Dies ist der Stand einer Recherche vom 29.10.2026. Er dient als
> Grundlage für Designentscheidungen der App. Vor dem produktiven Einsatz bitte fachlich prüfen.
> Punkte, die ich nicht am Original prüfen konnte, sind als _nicht verifiziert_ markiert.

## 1. Formerfordernisse je Formular

| Formular                                | Genügt eine einfache elektronische Signatur?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Grundlage                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Personalfragebogen (allgemein)          | **Ja.** Es gibt keine Formvorschrift; der Arbeitnehmer muss die Angaben nur „mitteilen“ bzw. „machen“.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | § 39e Abs. 4 EStG, § 28o Abs. 1 SGB IV                       |
| Personalfragebogen Auszubildende        | **Ja**, wie oben. Der Ausbildungsvertrag ist ein eigenes Dokument (Textform).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | § 11 BBiG                                                    |
| Minijob / kurzfristige Beschäftigung    | **Ja.** Die Erklärungen zu weiteren Beschäftigungen und zum Krankenversicherungsschutz haben keine Schriftform.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | § 8 Abs. 2 Nr. 7, 7a BVV; § 28a Abs. 9a SGB IV               |
| Antrag auf Befreiung von der RV-Pflicht | **Wohl ja (Auslegung, Recherche 30.10.2026).** Das Gesetz verlangt seit 01.01.2023 „schriftlich oder elektronisch“ (8. SGB IV-ÄndG; BT-Drs. 20/3900, S. 98); „elektronisch“ verlangt keine QES, eine schriftlich festgehaltene Erklärung genügt (BT-Drs. 18/10183, S. 64; Petitionsausschuss 19.03.2026 mit Stellungnahme des BMAS). Die Gemeinsamen Grundsätze von 2022 gehen noch von Schriftform aus (siehe 2.2) und sind insoweit überholt; die Praxis ist uneinheitlich (TK 02.07.2026: QES nötig). Ebenso Aufhebung (§ 6 Abs. 6, seit 01.07.2026) und Verzicht (§ 5 Abs. 4 S. 2, „schriftlich oder elektronisch“ seit 24.12.2025). | § 6 Abs. 1b SGB VI; Gemeinsame Grundsätze Ziff. 2.1.3        |
| Nachweis der Elterneigenschaft          | **Die Unterschrift beweist nichts.** Seit 01.07.2025 ist der digitale Abruf beim BZSt (DaBPV) Pflicht. Zu belegen sind Kinder ohne lohnsteuerliche Eltern-Kind-Verknüpfung beim BZSt (z. B. Stiefkinder, auswärtige Kinder, Auslandskinder, vor 2011 volljährige Kinder), per Urkundenkopie; ein Vermerk „hat vorgelegen“ genügt nicht. Rückwirkend gilt ein Nachweis, der binnen **sechs** Monaten kommt (§ 55 Abs. 3a S. 4 SGB XI; die GH 2025 nennen noch drei).                                                                                                                                                                      | § 55a SGB XI; GKV-SV, Grundsätzliche Hinweise vom 31.03.2025 |
| Sofortmeldung (Angaben)                 | Für die Angaben des Arbeitnehmers **ja**. Den Hinweis auf die Mitführungspflicht von Ausweispapieren muss der Arbeitgeber aber „nachweislich und schriftlich“ geben. Dieser Hinweis erfolgt daher auf Papier; im Fragebogen wird nur die Aushändigung bestätigt.                                                                                                                                                                                                                                                                                                                                                                         | § 28a Abs. 4 SGB IV; § 2a Abs. 2 SchwarzArbG                 |

**Branchen seit 30.12.2025 (am Gesetzestext geprüft am 29.10.2026):** Das Gesetz zur
Modernisierung und Digitalisierung der Schwarzarbeitsbekämpfung (BGBl. vom 29.12.2025) hat die
Listen in § 28a Abs. 4 SGB IV und § 2a Abs. 1 SchwarzArbG geändert. Die Kanzlei-Vorlage „Stand
10/2024“ ist deshalb veraltet:

- **neu:** Friseur- und Kosmetikgewerbe; im Logistikgewerbe ausdrücklich auch plattformbasierte
  Lieferdienste;
- **entfallen:** Forstwirtschaft; in der Fleischwirtschaft ist das Fleischerhandwerk ausgenommen.

Ob die neue Liste ab 30.12.2025 oder ab 01.01.2026 gilt, nennen die Quellen unterschiedlich
(_nicht verifiziert_). Der Hinweistext im Formular (Stand 29.10.2026) nennt die aktuelle Liste.
Die Sofortmeldung enthält weiterhin nur Familien- und Vornamen, die Versicherungsnummer (sonst Tag
und Ort der Geburt und Anschrift), die Betriebsnummer des Arbeitgebers und den Tag der
Beschäftigungsaufnahme.

**Grundsatz der App:** Belehrungen, die auf Papier erfolgen müssen, werden auf Papier ausgehändigt.
Im Fragebogen wird bestätigt, dass die betreffende Belehrung zusätzlich auf Papier ausgehändigt
wurde (Art der Kenntnisnahme `paperHandout`).

## 2. Gemeinsame Grundsätze nach § 9a BVV (Fassung ab 01.04.2022, am Original geprüft)

Herausgeber: GKV-Spitzenverband, DRV Bund, DRV Knappschaft-Bahn-See, Bundesagentur für Arbeit und
DGUV, genehmigt vom BMAS am 31.03.2022. Eine neuere Fassung habe ich nicht gefunden.

### 2.1 Ziff. 2.1.2 – Voraussetzungen an die Unterlage bei Anforderung

- Jede Unterlage ist in einer **eigenen Datei** vorzulegen. „Unzulässig sind zwei oder mehr
  Unterlagen in einer Datei.“
- Erlaubt sind PDF, JPEG, BMP, PNG und TIFF.
- Für PDF-Dateien sind Inline-Signaturen, Transfervermerke und Formularfelder zulässig. Die Datei
  darf aber nachträglich nicht mehr veränderbar sein. Das heißt im Wortlaut:
  - „Kein Einsatz von Skripten“
  - „Kein Einsatz von Formularfeldern, die nachträglich die Inhalte und Darstellungen des Dokuments
    verändern“
  - „Kein Nachladen aus anderen Quellen“
  - „Keine Einbindung von weiteren Dateien in der PDF-Datei“
- Die Datei braucht einen **sprechenden Dateinamen** (Verfahrensbeschreibung Ziff. 3): höchstens
  64 Zeichen, ohne Punkt, Komma, Sonderzeichen, Umlaute, ß und Leerzeichen.

**Folge für die App:** Die PDF enthält **keinen Dateianhang**. Die maschinenlesbaren Daten stehen
als sichtbarer Text auf eigenen Seiten. Jedes Formular wird als eigene Datei erzeugt.

### 2.2 Ziff. 2.1.3 – Unterlagen mit Unterschriftserfordernis

Schriftform gilt u. a. für den Antrag auf Befreiung von der RV-Pflicht (§ 8 Abs. 2 Nr. 4a BVV) mit
dokumentiertem Eingangstag. Elektronisch geführt werden darf er:

1. mit einer **qualifizierten elektronischen Signatur** des Beschäftigten (§ 36a SGB I);
2. als elektronische Kopie, wenn zusätzlich das **Papieroriginal** aufbewahrt wird;
3. als Scan des Papieroriginals mit **fortgeschrittener elektronischer Signatur des Arbeitgebers**.
   Das Zertifikat aus dem SV-Meldeverfahren kann dafür verwendet werden; danach darf das Papier
   vernichtet werden.

Nicht zulässig sind nicht unterschriebene Erklärungen dieser Art als PDF. Ob die Signatur der
Kanzlei als lohnabrechnende Stelle statt der des Arbeitgebers genügt, ist _nicht verifiziert_.

**Überholt (Recherche 30.10.2026):** Ziff. 2.1.3 setzt Schriftform voraus. Für den
Befreiungsantrag gilt seit 01.01.2023 „schriftlich oder elektronisch“ (§ 6 Abs. 1b S. 2 SGB VI),
für den Verzicht auf die Versicherungsfreiheit seit 24.12.2025 (§ 5 Abs. 4 S. 2 SGB VI); die
Aufhebung der Befreiung (§ 6 Abs. 6, seit 01.07.2026; Eingangstag nach § 8 Abs. 2 Nr. 4b BVV)
fehlt in den Grundsätzen ganz. Eine neuere Fassung oder ein klärendes Rundschreiben wurde nicht
gefunden. Restrisiko: Eine Betriebsprüfung könnte die alten Grundsätze anwenden. Vor einer
Version 1.0.0 dieser Formulare die Minijob-Zentrale und den Prüfdienst der DRV schriftlich fragen,
ob eine PDF der App genügt. Bericht: `.tmp/research/rv-befreiung-form.md` (lokal).

### 2.3 Elektronische Führung ab 2027

Eine Befreiung von der elektronischen Führung war nur bis 31.12.2026 möglich (§ 8 Abs. 3 S. 2
BVV). Ab 01.01.2027 sind die Unterlagen ausnahmslos elektronisch zu führen.

## 3. Inhalt der Fragebögen (Datenschutz, Fragerecht)

- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b und c DSGVO. Die Generalklausel des § 26 Abs. 1 S. 1
  BDSG ist nach EuGH C-34/21 (30.03.2023) praktisch nicht mehr anwendbar. Das Urteil betrifft nur
  diese Generalklausel; § 26 Abs. 3 BDSG (besondere Kategorien, z. B. Schwerbehinderung) bleibt im
  Zusammenspiel mit einer konkreten Pflicht nutzbar (Handreichung der hessischen
  Datenschutzaufsicht vom 25.04.2023; Urteilstext am Original _nicht verifiziert_).
- **Information:** Die Pflichtangaben nach Art. 13 DSGVO stehen im Formular.
- **Konfession:** Die Frage entfällt, weil das Kirchensteuermerkmal aus ELStAM kommt. Ausnahme:
  Bei Pauschalierung (§ 40a EStG) gibt es die Erklärung über die Nichtzugehörigkeit nach den gleich
  lautenden Ländererlassen vom 08.08.2016.
- **Schwerbehinderung:** Laut BAG ist die Frage im bestehenden Arbeitsverhältnis „jedenfalls nach
  sechs Monaten“ zulässig (Urteil vom 16.02.2012 – 6 AZR 553/10, am Urteilstext geprüft). Für die
  Zeit davor hat das BAG nichts entschieden; dass die Angabe dann **freiwillig** ist, entscheidet
  die App aus Vorsicht (AGG, § 164 Abs. 2 SGB IX). Grundlage der Verarbeitung: Art. 9 Abs. 2
  Buchst. b DSGVO, § 26 Abs. 3 BDSG mit den konkreten Pflichten aus §§ 154, 160, 163 SGB IX
  (Beschäftigungspflicht, Ausgleichsabgabe, Verzeichnis und Anzeige) und § 208 SGB IX
  (Zusatzurlaub). **Gleichgestellte bekommen keinen Zusatzurlaub** (§ 151 Abs. 3 SGB IX). Der
  besondere Kündigungsschutz greift erst nach sechs Monaten (§ 173 Abs. 1 Nr. 1 SGB IX).
- **Unzulässig** sind etwa Fragen nach Schwangerschaft (BAG 2 AZR 621/01), Gewerkschaft, Partei
  oder Familienplanung.
- **Betriebsrat:** Personalfragebögen bedürfen seiner Zustimmung (§ 94 Abs. 1 BetrVG). Ob reine
  Pflichtangaben für Steuer und SV mitbestimmungsfrei sind, ist _nicht verifiziert_.

## 4. Abgrenzungen

- **Nachweisgesetz:** Seit 2025 ist Textform möglich, außer in den Branchen nach § 2a SchwarzArbG
  (§ 2 Abs. 1 S. 2 NachwG). Der Fragebogen ist nicht der Nachweis.
- **Befristung:** Sie bedarf der Schriftform (§ 14 Abs. 4 TzBfG). Das Feld „befristet bis“ im
  Fragebogen ist **nicht** die Befristungsabrede.
- **Aufbewahrung:**
  - Entgeltunterlagen bis zum Ablauf des Kalenderjahres nach der letzten Betriebsprüfung (§ 28f
    Abs. 1 SGB IV).
  - Lohnkonto bis zum Ablauf des sechsten Kalenderjahres nach der letzten Lohnzahlung (§ 41 Abs. 1
    S. 9 EStG).
  - Elterneigenschaft: Dauer des Versicherungsverhältnisses plus vier Kalenderjahre.

## 5. Angaben im Personalfragebogen (Recherche 30.10.2026, am Gesetzestext geprüft)

- **Lohnsteuer (§ 39e Abs. 4 S. 1 EStG):** Die Person teilt jedem Arbeitgeber Steuer-ID und
  Geburtstag mit, ob es das erste oder ein weiteres Dienstverhältnis ist, und ob und in welcher
  Höhe ein Freibetrag nach § 39a Abs. 1 S. 1 Nr. 7 EStG abgerufen werden soll.
  - **Freibetrag Nr. 7 in Laiensprache:** Wer in der Hauptbeschäftigung weniger verdient, als dort
    steuerfrei bleibt, kann den ungenutzten Teil auf eine Nebenbeschäftigung übertragen lassen; in
    der Hauptbeschäftigung wird derselbe Betrag hinzugerechnet. 2026 höchstens 13.614 € bei
    Steuerklasse I/IV (12.348 + 1.230 + 36 €). Gültig höchstens zwei Kalenderjahre (§ 39a Abs. 1
    S. 3). Die Person entscheidet, ob und in welcher Höhe der Arbeitgeber abruft (BMF ELStAM vom
    13.12.2024, Rn. 127).
  - **Ohne Angabe zum Dienstverhältnis** gilt Steuerklasse VI (BMF 13.12.2024, Rn. 49).
  - **Fehlende Steuer-ID:** höchstens drei Monate vorläufige Merkmale, danach rückwirkend
    Steuerklasse VI (§ 39c Abs. 1 EStG); ohne zugeteilte ID Bescheinigung des Finanzamts (§ 39e
    Abs. 8 EStG).
  - Die Steuer-ID dient zugleich der Anmeldung zum Kinderabruf (§ 55a Abs. 3 SGB XI).
- **Private Krankenversicherung seit 2026:** Die Beiträge kommen als ELStAM (§ 39 Abs. 4 Nr. 4,
  Abs. 4a EStG; § 52 Abs. 36 EStG). Der Arbeitgeber muss sie ansetzen und darf selbst angegebene
  Beträge nicht berücksichtigen (BMF vom 03.06.2025, Rn. 5, 31, 83, 98) — **ein Betragsfeld im
  Fragebogen ist nutzlos.** Weiter nötig: die Bescheinigung des Versicherers über die
  Zuschussfähigkeit alle drei Jahre (§ 257 Abs. 2a S. 2 SGB V, § 61 Abs. 6 SGB XI; am 30.10.2026
  unverändert in Kraft, eine Digitalisierung durch das JStG 2026 ist _nicht verifiziert_) und
  Belege nur in Ausnahmefällen (Versicherer im Ausland, Angehörige mit eigenem Vertrag). Nach einem
  Widerspruch gegen die Übermittlung darf der Arbeitgeber auch Papierbescheinigungen nicht
  berücksichtigen (Rn. 59); ob dann auch der Zuschuss entfällt, ist _nicht verifiziert_.
- **Letzte gesetzliche Krankenkasse** bei privat Versicherten: Einzugsstelle für Renten- und
  Arbeitslosenversicherungsbeiträge (§ 28i S. 2 SGB IV i. V. m. § 175 Abs. 3 S. 2 SGB V).
- **Weitere Beschäftigungen:** Mehrere Minijobs werden zusammengerechnet, ein Minijob neben einer
  Hauptbeschäftigung bleibt frei (§ 8 Abs. 2 SGB IV); über der Beitragsbemessungsgrenze werden
  mehrere Entgelte verhältnismäßig gekürzt (§ 22 Abs. 2 SGB IV).
- **Kinder (Pflegeversicherung):** Das BZSt liefert nur „Elterneigenschaft ab …“ und „Anzahl Kinder
  unter 25 ab …“ — keine Namen, keine Geburtsdaten (§ 55a SGB XI). Daraus folgt Datensparsamkeit:
  Einzeldaten nur für **nicht abrufbare** Kinder. Nicht abrufbar sind laut den Gemeinsamen
  Grundsätzen DaBPV (Version 1.0, ab 01.04.2025) u. a. Stiefkinder, Kinder, die beim anderen
  Elternteil in einer anderen Gemeinde gemeldet waren, Auslandskinder, vor 2011 volljährige Kinder,
  vom Finanzamt nicht erfasste Pflegekinder und alle Kinder, wenn die Kinderfreibeträge gestrichen
  wurden. Nur bei sozialer Pflegeversicherung relevant; Minijobs zahlen keine PV-Beiträge. Dass vor
  2011 verstorbene Kinder nicht abrufbar sind, ist eine eigene Ableitung (_nicht verifiziert_).

## 6. Zustimmung zur Übermittlung der Steuererklärung (§ 87d AO)

- **Wortlaut § 87d Abs. 3 AO** (am Gesetzestext geprüft): Der Auftragnehmer stellt die Daten „in
  leicht nachprüfbarer Form zur Zustimmung zur Verfügung“; der Auftraggeber prüft sie
  „unverzüglich auf Vollständigkeit und Richtigkeit“.
- **Keine Form vorgeschrieben** (auch nicht im AEAO zu § 87d, der nur die Identifizierung regelt).
  Die Bundessteuerberaterkammer (FAQ digitale Aufbewahrung, Stand 19.03.2026, Nr. 1.2.41): „Für
  Steuererklärungen u. ä. reicht eine Freigabe.“ Die einfache elektronische Signatur der App
  genügt also.
- **Zeitpunkt:** Der Wortlaut („zur Zustimmung“) spricht für eine Freigabe **vor** der
  Übermittlung, die Gesetzesbegründung (BT-Drs. 18/7457, S. 67) für eine Prüfung der übermittelten
  Daten. Empfehlung: Freigabe vorher, Übertragungsprotokoll danach (_Auslegung, nicht
  verifiziert_).
- **Ehegatten:** Die gemeinsame Erklärung unterschreiben auf Papier beide (§ 25 Abs. 3 S. 2 EStG);
  dass elektronisch beide freigeben müssen, ist abgeleitet, nicht ausdrücklich geregelt
  (_nicht verifiziert_). Lebenspartner gelten als Ehegatten (§ 2 Abs. 8 EStG).
- **Weitere Normen:** § 150 Abs. 2 AO (wahrheitsgemäß), § 150 Abs. 7 S. 2 AO (übernommene eDaten
  gelten als Angaben des Steuerpflichtigen), § 153 AO (Berichtigungspflicht).
- **Aufbewahrung:** Identifizierung fünf Jahre (§ 87d Abs. 2 AO), Handakte mit der Freigabe zehn
  Jahre (§ 66 Abs. 1 StBerG).

## 7. Dienstwagen (Kfz-Gestellung)

- **Keine gesetzliche Form** für die Überlassung; die einfache elektronische Signatur genügt. Das
  BMF verlangt aber für einzelne Erklärungen „schriftlich“ (Fahrtage der Einzelbewertung,
  Nutzungsverzicht, Kostenerklärung; BMF vom 03.03.2022). Ob die einfache elektronische Signatur
  das erfüllt, ist _nicht verifiziert_ — den Nutzungsverzicht vorerst auf Papier.
- **Listenpreis:** inländischer Bruttolistenpreis bei Erstzulassung plus werkseitige
  Sonderausstattung, abgerundet auf volle 100 € (R 8.1 Abs. 9 Nr. 1 S. 6 LStR).
- **Elektro 0,25 %:** keine CO2-Emission und Listenpreis höchstens 100.000 € bei Anschaffung nach
  dem 30.06.2025 (§ 52 Abs. 12 S. 6 EStG). Welches Datum bei Arbeitnehmern entscheidet
  (Anschaffung oder erstmalige Überlassung), ist _nicht verifiziert_ — der Entwurf fragt beide.
- **Einzelbewertung der Fahrten Wohnung – erste Tätigkeitsstätte:** 0,002 % je Fahrt, höchstens
  180 Fahrten im Jahr, monatliche Angabe der Fahrtage mit Datum (BMF vom 03.03.2022).
- **Ladestrom ab 2026:** keine Monatspauschalen mehr; Strompreispauschale 2026 34 Cent/kWh oder
  Vertragspreis, eigener Zähler (BMF vom 11.11.2025).

## 8. Monatliche Meldung der Lohndaten

- **Fristen der Kanzlei:** Beiträge fällig am drittletzten Bankarbeitstag (§ 23 Abs. 1 SGB IV),
  Beitragsnachweis zwei Arbeitstage vorher (§ 28f Abs. 3 S. 1 SGB IV), beides am Gesetzestext
  geprüft. Ohne Meldung darf die Kanzlei mit den Beiträgen des Vormonats rechnen, außer für
  Einmalzahlungen. Den Abgabetag für den Arbeitgeber legt die Kanzlei fest (Konfiguration, kein
  gesetzlicher Termin).
- **Die Meldung ersetzt keine Arbeitszeitaufzeichnung:** Minijobs und Branchen nach § 2a
  SchwarzArbG zeichnen Beginn, Ende und Dauer der täglichen Arbeitszeit bis zum 7. Tag danach auf
  und bewahren sie zwei Jahre auf (§ 17 MiLoG); dazu § 16 Abs. 2 ArbZG.
- **Fehlzeiten mit Datum:** Entgeltfortzahlung bis sechs Wochen, erst nach vier Wochen
  Beschäftigung (§ 3 EFZG); „U“ im Lohnkonto bei mindestens fünf Arbeitstagen ohne Lohn (§ 41 EStG,
  § 4 LStDV); unbezahlter Urlaub über einen Monat beendet die Versicherungspflicht (§ 7 Abs. 3
  SGB IV). **Keine Diagnosen** — Gesundheitsdaten; die AU kommt elektronisch (§ 109 SGB IV).
- **Pfändung:** Die Drittschuldnererklärung ist binnen zwei Wochen fällig (§ 840 ZPO) — sofort
  weitergeben, nicht mit der Monatsmeldung.
- **Zuschläge** nach § 3b EStG (Nacht, Sonntag, Feiertag; am Gesetzestext geprüft); beitragsfrei in
  der SV nur bis 25 €/h Grundlohn (§ 1 SvEV, Sekundärquellen).

## 9. Signatur und Zeit

- **Einfache elektronische Signatur:** Die Unterschrift in der App ist eine einfache elektronische
  Signatur (eIDAS Art. 3 Nr. 10). Sie ist weder fortgeschritten noch qualifiziert.
- **DATEV SmartCard:** Die Karte trägt eine fortgeschrittene Signatur. DATEV ist seit 2017 kein
  qualifizierter Vertrauensdiensteanbieter mehr. Aus dem Browser heraus lässt sich die Karte nicht
  nutzen.
- **Zeitanker:** Die Ablage der PDF in der DATEV-Personalakte liefert eine Zeit, die nicht vom Gerät
  des Unterzeichners stammt. Sie belegt „existierte spätestens zum Ablagezeitpunkt“, nicht aber den
  Zeitpunkt der Unterschrift.

## Quellen

- Gemeinsame Grundsätze nach § 9a BVV vom 18.03.2022 mit Verfahrensbeschreibung 1.0:
  https://berlin.de/politik-und-verwaltung/rundschreiben/download.php/4328001 und
  https://www.informationsportal.de/wp-content/uploads/document__17488__GG-elektronische-Entgeltunterlagen-vom-18.03.2022.pdf
- § 8 BVV: https://www.gesetze-im-internet.de/beitrvv/__8.html
- § 6 SGB VI: https://www.gesetze-im-internet.de/sgb_6/__6.html
- Minijob-Zentrale, Befreiung von der RV-Pflicht:
  https://www.minijob-zentrale.de/DE/die-minijobs/befreiung_rentenversicherungspflicht
- § 39e EStG: https://www.gesetze-im-internet.de/estg/__39e.html
- § 28o SGB IV: https://www.gesetze-im-internet.de/sgb_4/__28o.html
- § 28a SGB IV: https://www.gesetze-im-internet.de/sgb_4/__28a.html
- § 55a SGB XI: https://www.gesetze-im-internet.de/sgb_11/__55a.html
- GKV-Spitzenverband, Grundsätzliche Hinweise Beitragssatzdifferenzierung (31.03.2025):
  https://www.gkv-spitzenverband.de/media/dokumente/pflegeversicherung/grundprinzipien/2025-03-31_GH_Beitragssatzdifferenzierung_sPV.pdf
- § 2a SchwarzArbG: https://www.gesetze-im-internet.de/schwarzarbg_2004/__2a.html
- TK, Sofortmeldung: Änderungen in den Branchen ab 2026:
  https://www.tk.de/firmenkunden/versicherung/meldeverfahren-faq/haeufige-fragen-meldeverfahren/sofortmeldung-zu-beschaeftigungsbeginn-2035960
- Handwerkskammer Südthüringen, Pflichten für das Friseur- und Kosmetikgewerbe ab 01.01.2026:
  https://www.hwk-suedthueringen.de/wp-content/uploads/2026/01/Pflichten-fuer-das-Friseur-und-Kosmetikgewerbe-ab-01.01.2026.pdf
- § 94 BetrVG: https://www.gesetze-im-internet.de/betrvg/__94.html
- § 14 TzBfG: https://www.gesetze-im-internet.de/tzbfg/__14.html
- § 11 BBiG: https://www.gesetze-im-internet.de/bbig_2005/__11.html
- § 2 NachwG: https://www.gesetze-im-internet.de/nachwg/__2.html
- DATEV SmartCard / mIDentity:
  https://www.datev.de/web/de/mydatev/datev-cloud-sicherheit/anmeldeverfahren-bei-datev/datev-smartcard-datev-midentity/
- Bundesnetzagentur zur DATEV-Zertifizierungsstelle: https://davedata.bundesnetzagentur.de/TL-Links/DATEV.html
- § 26 BDSG: https://www.gesetze-im-internet.de/bdsg_2018/__26.html
- Hessische Datenschutzaufsicht, Handreichung zum EuGH-Urteil C-34/21:
  https://www.datenschutz.hessen.de/sites/datenschutz.hessen.de/files/2023-05/handreichung_beschaeftigtendatenschutz_eugh-urteil.pdf
- BAG, Urteil vom 16.02.2012 – 6 AZR 553/10:
  https://www.bundesarbeitsgericht.de/wp-content/uploads/2021/01/6-AZR-553-10.pdf
- SGB IX §§ 151, 154, 160, 163, 173, 208: https://www.gesetze-im-internet.de/sgb_9_2018/
- § 28i SGB IV: https://www.gesetze-im-internet.de/sgb_4/__28i.html; § 175 SGB V:
  https://www.gesetze-im-internet.de/sgb_5/__175.html
- § 8, § 22, § 23, § 28f SGB IV: https://www.gesetze-im-internet.de/sgb_4/
- § 55 SGB XI: https://www.gesetze-im-internet.de/sgb_11/__55.html
- Gemeinsame Grundsätze DaBPV (Version 1.0):
  https://www.gkv-datenaustausch.de/media/dokumente/abrufverfahren/elterneigenschaft/grundsaetze_8/Gemeinsame_Grundsaetze_DaBPV_V01.00.00.pdf
- § 257 SGB V: https://www.gesetze-im-internet.de/sgb_5/__257.html; § 61 SGB XI:
  https://www.gesetze-im-internet.de/sgb_11/__61.html
- § 39, § 52 EStG: https://www.gesetze-im-internet.de/estg/__39.html,
  https://www.gesetze-im-internet.de/estg/__52.html
- BMF vom 03.06.2025 (PKV-Datenaustausch ab 2026):
  https://www.elster.de/elsterweb/attachments/elstam_(arbeitgeber)/2025-06-03-dataustausch-priv-kv-pv-finw-arbeitg-1.pdf
- BMF vom 13.12.2024 (ELStAM):
  https://elster.de/elsterweb/attachments/elstam_(arbeitgeber)/2024-12-13-ELStAM-elektr-lohnsteuerabzugsmerkmale.pdf
- § 87d AO: https://www.gesetze-im-internet.de/ao_1977/__87d.html; § 150 AO:
  https://www.gesetze-im-internet.de/ao_1977/__150.html; § 25 EStG:
  https://www.gesetze-im-internet.de/estg/__25.html; § 66 StBerG:
  https://www.gesetze-im-internet.de/stberg/__66.html
- § 17 MiLoG: https://www.gesetze-im-internet.de/milog/__17.html; § 3 EFZG:
  https://www.gesetze-im-internet.de/entgfg/__3.html; § 840 ZPO:
  https://www.gesetze-im-internet.de/zpo/__840.html; § 3b EStG:
  https://www.gesetze-im-internet.de/estg/__3b.html
