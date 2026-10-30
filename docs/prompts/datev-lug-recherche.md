# Prompt für Claude in Chrome: DATEV Lohn und Gehalt – Importformat und Feldreihenfolge

**Wofür:** Claude Code kann das DATEV Hilfe-Center nicht lesen (Anmeldung, JavaScript). Claude in
Chrome arbeitet in deinem angemeldeten Browser und kann es. Das Ergebnis ist eine JSON-Datei, die
Claude Code danach prüft und auswertet (Erfassungsblatt in LuG-Reihenfolge, Importdatei).

**So gehst du vor:**

1. In Chrome bei DATEV anmelden (SmartLogin/SmartCard), dann Claude in Chrome öffnen.
2. Den Text unter „Prompt“ vollständig einfügen.
3. Die JSON-Antwort als `datev-lug.json` speichern. Zusammen mit den heruntergeladenen Dateien
   (Excel-Personalfragebogen, PDFs) legst du sie in `c:\skripte\public\Fragebogen\.tmp\datev\` ab.
   Der Ordner `.tmp` wird nicht ins Repository übernommen, DATEV-Unterlagen bleiben also lokal.
4. Claude Code Bescheid geben.

**Läuft die Recherche schon?** Dann den Abschnitt „Zusatzfrage A6 – LODAS“ als Folgenachricht
schicken. Die Kanzlei arbeitet mit Lohn und Gehalt; LODAS wird nur mit vorgesehen.

---

## Prompt

Du recherchierst im DATEV Hilfe-Center (Wissensplattform), im DATEV Developer-Portal und auf
datev.de. Ich bin dort angemeldet. Ziel: belegte Fakten zu zwei Fragen über **DATEV Lohn und
Gehalt (LuG)**, als JSON nach dem Schema unten. Wir arbeiten mit LuG; LODAS ist nur Zusatz
(Frage A6).

### Regeln (bitte strikt einhalten)

- **Nur lesen.** Öffne ausschließlich Hilfe-Dokumente, Schnittstellenbeschreibungen, Shop- und
  Produktseiten. Öffne **keine** Mandanten-, Mitarbeiter- oder Kanzleidaten und keine
  Online-Anwendungen mit Daten (z. B. DATEV Unternehmen online, DATEV Personal, Arbeitsplatz,
  Rechteverwaltung). Ändere keine Einstellungen, bestelle nichts, aktiviere keine Dienste,
  bestätige keine Nutzungsbedingungen und gib keine Zugangsdaten ein. Wenn eine Anmeldung fehlt,
  halte an und sag mir Bescheid.
- **Keine Vermutungen.** Jede Angabe trägt ihre Quelle (Dok.-Nr., Abschnitt, Stand). Kennzeichne,
  wie sie belegt ist: `gelesen` (Text), `bild` (aus einem Screenshot im Dokument), `vermutet`
  (nur wenn ausdrücklich als Vermutung markiert). Was nicht auffindbar ist, kommt unter `offen`,
  mit Grund.
- **Keine Volltexte kopieren.** Übernimm Feldlisten, Reihenfolgen, Formate und höchstens kurze
  Zitate (bis zwei Sätze). Das Ergebnis dient der internen Auswertung.
- **Downloads:** Excel-Vorlagen oder PDFs, die zu den Fragen gehören, darfst du herunterladen.
  Öffne heruntergeladene Excel-Dateien nicht und führe keine Makros aus. Nenne die Dateinamen.

### Frage A – Importformat für Mitarbeiter-Stammdaten

1. **Dok. 1080789** „Schnittstellen in den DATEV-Programmen“, Abschnitt Personalwirtschaft
   (laut Forum Punkt 6.1). Gibt es einen **Stammdatenimport für LuG** (ASCII, Kopf
   `[Allgemein]` / `Ziel=LuG`)? Ermittle:
   - Dateiaufbau, Abschnitte, Kopfzeilen und Versionskennung;
   - Zeichensatz, Trennzeichen, Dezimal- und Datumsformat;
   - jedes importierbare Feld der Mitarbeiter-Stammdaten in Dateireihenfolge, mit Feldname,
     Bedeutung, Pflicht, Format oder Länge und zulässigen Werten bzw. Schlüsseln;
   - ob der Import **lokal in LuG** möglich ist (Menüpfad) oder nur über das Rechenzentrum.

   Gibt es dazu Musterdateien oder ein Schnittstellenhandbuch, nenne Titel und Fundort.

2. **Dok. 1035006** „Personalfragebögen (Microsoft Excel) zur Vorerfassung von Personaldaten“:
   - Lade die Excel-Vorlage(n) herunter.
   - Beschreibe laut Dokument, was die Vorlage erzeugt (Importdatei? welches Format? für LuG oder
     LODAS?) und wie der Import in LuG abläuft.
   - Beschreibe, ob Makros nötig sind.
3. **Lohnimportdatenservice:** Dok. 0904372 (Leistungsbeschreibung API), 1002326 (Freischaltung),
   1018641 und die Shopseite Art.-Nr. 93006.
   - Können damit **Stammdaten-Neuanlagen** in LuG eingespielt werden, und in welchem Format?
   - Was sind die Voraussetzungen (Partner-Software oder Upload durch die Kanzlei selbst?) und
     die Kosten?
4. **Lohnaustauschdatenservice** (Dok. 1026710) und **DATEV Personal**, insbesondere die
   angekündigte „Mitarbeiterneuanlage inklusive Personalfragebogen“ (Q4/2026):
   - Was ist der aktuelle Stand?
   - Können externe Daten angeliefert werden, und in welchem Format?
5. **Developer-Portal** (developer.datev.de), Bereich Lohn/Personal: Gibt es eine öffentlich
   dokumentierte Feldliste für Mitarbeiter-Stammdaten (z. B. hr:exchange, Lohnimportdatenservice)?
   Nenne den Link und die Felder.

### Zusatzfrage A6 – LODAS

Die Kanzlei arbeitet mit Lohn und Gehalt; LODAS soll nur mit vorgesehen werden. Suche das
**LODAS-Schnittstellenhandbuch** für den ASCII-Import (laut Forum `LODAS_SSH.pdf` und die
Musterdatei `LS_Muster_BWG.txt`, Dok. 1080789 Punkt 6.1):

- Nenne Fundort, Titel und Stand.
- Nenne die Satzbeschreibung für **Mitarbeiter-Stammdaten** (laut Forum `[Satzbeschreibung]`,
  `[Stammdaten]`, Tabelle `u_lod_psd_mitarbeiter`): Tabellen- und Feldnamen, Pflicht, Format.
- Ist das zu aufwendig, genügen Fundort und Inhaltsverzeichnis.

Trage die Ergebnisse im JSON unter `importformat.lodas` ein:
`{ "handbuch": { "titel", "stand", "fundort" }, "tabellen": [ { "name", "felder": [ { "feldname",
"bedeutung", "pflicht", "format", "quelle", "beleg" } ] } ], "offen": [] }`.

### Frage B – Reihenfolge der Stammdatenfelder in LuG

Ziel: die Felder der **Mitarbeiter-Stammdaten in der Reihenfolge der LuG-Bildschirme**. Gesucht
ist der Übersichtsbaum, darin die Fenster, darin die Registerkarten und darin die Felder.

1. **Dok. 0903050** „Erste Schritte DATEV Lohn und Gehalt“, Kapitel zum Erfassen der
   Mitarbeiter-Stammdaten.
2. **Dok. 1007836** „Mandanten-, Mitarbeiter-Stammdaten, Bewegungsdaten in Lohn und Gehalt
   ausgeben und drucken“: Aufbau des Mitarbeiter-Stammdatenblatts.
3. **Dok. 9221219** „Beschäftigungszeiträume“ und weitere Hilfe-Dokumente zu den einzelnen
   Bereichen. Suche im Hilfe-Center nach „Lohn und Gehalt Mitarbeiter Stammdaten“ und nach den
   Bereichen Persönliche Daten, Anschrift, Bankverbindung, Beschäftigung, Tätigkeit,
   Sozialversicherung, Steuer, Arbeitszeit, Urlaub, Entlohnung, vermögenswirksame Leistungen,
   Kinder, Vorarbeitgeber, Unfallversicherung.
4. **Schnellerfassung** neuer Mitarbeiter (`Erfassen | Schnellerfassung`): Felder in Reihenfolge.

Wo Dokumente Screenshots zeigen, lies die Feldbeschriftungen in Bildschirmreihenfolge ab, von oben
nach unten und von links nach rechts, und markiere sie mit `bild`.

### Antwortformat

Antworte **nur** mit diesem JSON, ohne Text davor oder danach. Werte auf Deutsch, Datumsangaben
als `JJJJ-MM-TT`, unbekannt = `null`.

```json
{
  "erstellt": "JJJJ-MM-TT",
  "zugang": { "angemeldet": true, "hinweise": "" },
  "dokumente": [
    {
      "nr": "1080789",
      "titel": "",
      "stand": "",
      "url": "",
      "lesbar": true,
      "grund_wenn_nicht": null,
      "download": null
    }
  ],
  "importformat": {
    "wege": [
      {
        "name": "",
        "ziel": "LuG | LODAS | beide",
        "ablauf": "lokal | Rechenzentrum | API",
        "voraussetzungen": "",
        "kosten": "",
        "stammdaten_neuanlage": true,
        "quelle": "",
        "beleg": "gelesen"
      }
    ],
    "lug_stammdaten_datei": {
      "verfuegbar": true,
      "menuepfad": "",
      "zeichensatz": "",
      "trennzeichen": "",
      "datumsformat": "",
      "dezimalformat": "",
      "kopf": [""],
      "abschnitte": [
        {
          "name": "",
          "felder": [
            {
              "position": 1,
              "feldname": "",
              "bedeutung": "",
              "pflicht": true,
              "format": "",
              "laenge": null,
              "werte": "",
              "quelle": "",
              "beleg": "gelesen"
            }
          ]
        }
      ],
      "musterdateien": [{ "titel": "", "fundort": "" }]
    },
    "excel_personalfragebogen": {
      "download": [""],
      "erzeugt": "",
      "ziel": "",
      "makros": null,
      "importablauf": "",
      "quelle": ""
    },
    "offen": [{ "frage": "", "grund": "" }]
  },
  "lug_feldreihenfolge": {
    "stammdaten": [
      {
        "bereich": "",
        "fenster": "",
        "registerkarte": "",
        "felder": [{ "position": 1, "bezeichnung": "", "hinweis": "", "beleg": "gelesen" }],
        "quelle": ""
      }
    ],
    "schnellerfassung": [
      { "position": 1, "bezeichnung": "", "registerkarte": "", "quelle": "", "beleg": "gelesen" }
    ],
    "stammdatenblatt_druck": [{ "abschnitt": "", "felder": [""], "quelle": "" }],
    "offen": [{ "frage": "", "grund": "" }]
  }
}
```
