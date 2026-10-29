# Rechtliche Hintergründe

> **Keine Rechtsberatung.** Dies ist der Stand einer Recherche vom 29.10.2026. Er dient als
> Grundlage für Designentscheidungen der App. Vor dem produktiven Einsatz bitte fachlich prüfen.
> Punkte, die ich nicht am Original prüfen konnte, sind als _nicht verifiziert_ markiert.

## 1. Formerfordernisse je Formular

| Formular                                | Genügt eine einfache elektronische Signatur?                                                                                                                                                                                                                               | Grundlage                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Personalfragebogen (allgemein)          | **Ja.** Es gibt keine Formvorschrift; der Arbeitnehmer muss die Angaben nur „mitteilen“ bzw. „machen“.                                                                                                                                                                     | § 39e Abs. 4 EStG, § 28o Abs. 1 SGB IV                       |
| Personalfragebogen Auszubildende        | **Ja**, wie oben. Der Ausbildungsvertrag ist ein eigenes Dokument (Textform).                                                                                                                                                                                              | § 11 BBiG                                                    |
| Minijob / kurzfristige Beschäftigung    | **Ja.** Die Erklärungen zu weiteren Beschäftigungen und zum Krankenversicherungsschutz haben keine Schriftform.                                                                                                                                                            | § 8 Abs. 2 Nr. 7, 7a BVV; § 28a Abs. 9a SGB IV               |
| Antrag auf Befreiung von der RV-Pflicht | **Nein.** Laut den SV-Trägern gilt Schriftform: QES, Papieroriginal oder Scan mit fortgeschrittener Signatur des Arbeitgebers (siehe 2.2). Das Gesetz spricht von „schriftlich oder elektronisch“; diese Fassung ist laut buzer.de neu seit 12/2025 (_nicht verifiziert_). | § 6 Abs. 1b SGB VI; Gemeinsame Grundsätze Ziff. 2.1.3        |
| Nachweis der Elterneigenschaft          | **Die Unterschrift beweist nichts.** Seit 01.07.2025 ist der digitale Abruf beim BZSt (DaBPV) Pflicht. Kinder ohne steuerliche Erfassung sind per Urkundenkopie zu belegen; ein Vermerk „hat vorgelegen“ genügt nicht.                                                     | § 55a SGB XI; GKV-SV, Grundsätzliche Hinweise vom 31.03.2025 |
| Sofortmeldung (Angaben)                 | Für die Angaben des Arbeitnehmers **ja**. Den Hinweis auf die Mitführungspflicht von Ausweispapieren muss der Arbeitgeber aber „nachweislich und schriftlich“ geben. Dieser Hinweis erfolgt daher auf Papier; im Fragebogen wird nur die Aushändigung bestätigt.           | § 28a Abs. 4 SGB IV; § 2a Abs. 2 SchwarzArbG                 |

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

### 2.3 Elektronische Führung ab 2027

Eine Befreiung von der elektronischen Führung war nur bis 31.12.2026 möglich (§ 8 Abs. 3 S. 2
BVV). Ab 01.01.2027 sind die Unterlagen ausnahmslos elektronisch zu führen.

## 3. Inhalt der Fragebögen (Datenschutz, Fragerecht)

- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b und c DSGVO. Die Generalklausel des § 26 Abs. 1 BDSG
  ist nach EuGH C-34/21 (30.03.2023) praktisch nicht mehr anwendbar.
- **Information:** Die Pflichtangaben nach Art. 13 DSGVO stehen im Formular.
- **Konfession:** Die Frage entfällt, weil das Kirchensteuermerkmal aus ELStAM kommt. Ausnahme:
  Bei Pauschalierung (§ 40a EStG) gibt es die Erklärung über die Nichtzugehörigkeit nach den gleich
  lautenden Ländererlassen vom 08.08.2016.
- **Schwerbehinderung:** Die Frage ist im bestehenden Arbeitsverhältnis nach sechs Monaten zulässig
  (BAG 6 AZR 553/10), vorher nur als freiwillige Angabe.
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

## 5. Signatur und Zeit

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
