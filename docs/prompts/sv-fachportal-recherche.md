# Prompt für Claude in Chrome: offene SV-Fragen und Beispielfälle aus dem AOK-Fachportal

**Wofür:** Die Testfälle der SV-Beurteilung (`tests/fixtures/sv-vorgaben/`) lassen einige Punkte offen,
weil die Quellen sich widersprechen oder schweigen. Claude Code kann viele Fachseiten nicht vollständig
lesen (JavaScript, Cookie-Abfrage). Claude in Chrome arbeitet in einem echten Browser und kann es. Es
klärt die offenen Punkte (Teil A) und sammelt die Beispiele des Portals mit ihren Ergebnissen (Teil B).
Claude Code prüft die Antwort danach, übernimmt die Fälle als Tests und berichtigt die Regeln, wenn ein
amtlicher Text es trägt.

**Portal:** AOK – Fachportal für Arbeitgeber (`https://www.aok.de/fk/`). Es ist frei zugänglich, ohne
Anmeldung, und enthält viele durchgerechnete Beispiele. Von dort stammen bisher nur zwei Fälle.

**So gehst du vor:**

1. Chrome öffnen und Claude in Chrome starten. Eine Anmeldung ist nicht nötig.
2. Den Text unter „Prompt“ vollständig einfügen. Teil A und Teil B dürfen in zwei getrennten Sitzungen
   laufen. Für Teil B dann die Folgenachricht „Bitte jetzt Teil B“ schicken.
3. Jede JSON-Antwort als eigene Datei in `c:\skripte\public\Fragebogen\import\` speichern, z. B.
   `sv-fachportal-teil1.json`, `sv-fachportal-teil2.json`. Der Ordner `import` wird nicht ins Repository
   übernommen.
4. Claude Code Bescheid geben.

---

## Prompt

Du recherchierst im **AOK-Fachportal für Arbeitgeber** (`https://www.aok.de/fk/`). Fragt das Portal
nach einer Region, wähle Baden-Württemberg. Thema ist die sozialversicherungsrechtliche Beurteilung
von Beschäftigten im Jahr **2026**: Personengruppenschlüssel, Beitragsgruppenschlüssel und das
Kennzeichen Übergangsbereich in den DEÜV-Meldungen. Das Ergebnis ist ein JSON nach dem Schema unten.
Es dient als Testmaterial für eine Software, die diese Schlüssel vorschlägt.

### Regeln (bitte strikt einhalten)

- **Nur lesen.** Melde dich nirgends an, fülle keine Formulare aus, abonniere nichts und lade keine
  Software herunter. Nutze keine Beitragsrechner. Bei der Cookie-Abfrage wähle „nur notwendige“
  bzw. „ablehnen“. Verlangt eine Seite eine Anmeldung oder Zahlung, notiere sie unter `offen` und
  mach mit der nächsten weiter.
- **Andere Seiten** sind nur für Teil A erlaubt, und nur, wenn das Portal eine Frage nicht beantwortet
  oder auf ein Dokument verweist. Erlaubt sind dann amtliche Stellen: GKV-Spitzenverband,
  gkv-datenaustausch.de, Deutsche Rentenversicherung, Bundesagentur für Arbeit, Minijob-Zentrale,
  gesetze-im-internet.de. Foren und Blogs zählen nicht als Beleg.
- **Keine Vermutungen.** Jede Angabe trägt ihre Quelle (Seite, Abschnitt, URL, Stand). Was nicht in der
  Quelle steht, bleibt `null`. Ergänze keine Annahmen; nenne fehlende Angaben in `hinweis`.
- **Schlüssel nie selbst ableiten.** Trage `pgr`, `bgr` und `uebergangsbereich` nur ein, wenn sie in der
  Quelle wörtlich stehen. Sonst bleiben sie `null`, und du beschreibst die Aussage der Quelle je
  Versicherungszweig in Worten (Liste unten).
- **Keine Volltexte kopieren.** Beschreibe jeden Sachverhalt in eigenen Worten, mit allen Zahlen und
  Daten. Wörtlich übernimmst du je Fall und Frage nur den entscheidenden Satz (höchstens zwei Sätze)
  in `zitat`.
- **Personen:** Echte Namen ersetzt du durch neutrale Bezeichnungen („Studentin“, „Arbeitgeber B“).
- **Ältere Beispiele:** Rechnet ein Beispiel mit alten Grenzen (z. B. 450, 520, 538 oder 556 € für
  Minijobs, 1.300 oder 1.600 € als Obergrenze des Übergangsbereichs), nimm es trotzdem auf. Trage dann
  in `rechtsstand` das Jahr bzw. die Grenze ein, mit der es rechnet. **Rechne die Zahlen nicht selbst
  um.**
- **Widersprüche** zwischen dem Portal und einer amtlichen Quelle nennst du beide, ohne zu
  entscheiden.

**Werte 2026 zur Orientierung** (nur zum Erkennen älterer Beispiele):

- Geringfügigkeitsgrenze 603 € im Monat (7.236 € im Jahr), Obergrenze des Übergangsbereichs 2.000 €.
- Geringverdienergrenze für Azubis 325 €, Mindestlohn 13,90 € je Stunde.
- Jahresarbeitsentgeltgrenze 77.400 € (besondere Grenze 69.750 €).
- Kurzfristig sind drei Monate oder 70 Arbeitstage im Kalenderjahr.

**Lesehilfe:**

- Der Beitragsgruppenschlüssel hat vier Ziffern in der Reihenfolge KV, RV, AV, PV, z. B. 1111 oder 6500.
- Der Personengruppenschlüssel hat drei Ziffern, z. B. 101, 106, 109, 110 oder 119.
- Das Kennzeichen Übergangsbereich steht in der Meldung. Trage es so ein, wie die Quelle es nennt.

Für die Zweige `kv`, `rv`, `av` und `pv` nimmst du, wenn möglich, eine dieser Formulierungen. Passt
keine, schreibst du die Aussage der Quelle in kurzen eigenen Worten.

- **kv:**
  - „pflichtig (allgemeiner Beitrag)“
  - „pflichtig (ermäßigter Beitrag, kein Krankengeld)“
  - „frei bzw. nicht pflichtig (kein Beitrag)“
  - „frei, Pauschalbeitrag des Arbeitgebers“
- **rv:**
  - „pflichtig (voller Beitrag)“
  - „frei bzw. befreit, Pauschalbeitrag des Arbeitgebers“
  - „frei bzw. befreit (kein Beitrag)“
  - „frei, Arbeitgeberanteil (halber Beitrag)“
  - „befreit zugunsten des Versorgungswerks (kein DRV-Beitrag)“
- **av:**
  - „pflichtig (voller Beitrag)“
  - „frei (kein Beitrag)“
  - „frei, Arbeitgeberanteil (halber Beitrag)“
- **pv:**
  - „pflichtig (voller Beitrag)“
  - „kein Beitrag (frei bzw. nicht pflichtig)“

### Teil A – offene Fragen

Beantworte jede Frage mit Beleg. Suche zuerst im Portal: in den Fachbeiträgen, im Lexikon, in den
Fachinformationen und in einer Sammlung von Rundschreiben oder Besprechungsergebnissen, falls es eine
gibt. Folge den Verweisen auf amtliche Dokumente. Jedes Beispiel, das du dabei findest, kommt
zusätzlich als Fall in `faelle`, mit `frage` = Fragenummer.

**F1 – Ermäßigter KV-Beitrag (Beitragsgruppe 3) bei kurz befristeten Beschäftigungen.** Angenommen,
eine versicherungspflichtige Beschäftigung ist von vornherein kurz befristet (etwa vier bis zehn
Wochen). Die Quellen sind sich nicht einig:

- Die Geringfügigkeits-Richtlinien 2026 (Teil J) nennen bei solchen Befristungen in Beispiel 4a
  (20 Tage) die KV-Ziffer 3.
- In den Beispielen 40, 45 und 48 (39 bis 59 Tage) nennen sie dagegen die KV-Ziffer 1.
- Andere Fachquellen begründen die 3 so: Ohne mindestens sechs Wochen Entgeltfortzahlung bestehe kein
  Krankengeldanspruch.

Gesucht:

1. die Regel und ihre Fundstelle (Gesetz, Rundschreiben, Besprechungsergebnis);
2. die genaue Grenze: Wie viele Wochen, „bis zu“ oder „weniger als“, und wird nach Kalenderwochen oder
   nach dem Vertragszeitraum gezählt?
3. ob „von vornherein befristet“ entscheidet, und ab wann sich die Ziffer ändert, wenn der Vertrag
   verlängert wird;
4. ob eine Entgeltfortzahlung ab dem ersten Tag (Tarif- oder Arbeitsvertrag) oder eine Wahlerklärung
   zum Krankengeld etwas ändert;
5. ob die Regel auch für Schüler, Studierende ohne Werkstudentenregelung, Schulabgänger und Aushilfen
   gilt;
6. jedes Beispiel des Portals mit Befristung und KV-Ziffer.

**F2 – Kennzeichen Übergangsbereich bei Werkstudenten (Personengruppe 106).**

1. Gilt der Übergangsbereich auch für Werkstudenten, bei denen nur die RV pflichtig ist?
2. Welches Kennzeichen gilt, wenn die Stunden in den Semesterferien ausgeweitet werden? Beispiel:
   Vorlesungszeit 20 Stunden und 1.500 €, Ferien 40 Stunden und 3.000 €. Wird das regelmäßige Entgelt
   über den Jahresdurchschnitt bestimmt, und was gilt in Monaten über 2.000 €?
3. Welche Werte kennt das Kennzeichen Übergangsbereich in den Meldungen, und wann wird welcher gesetzt?

**F3 – Kennzeichen Übergangsbereich, wenn die beschäftigte Person selbst keine Beiträge zahlt.**
Beispiel: Ein Pensionär nach der Regelaltersgrenze hat Beitragsgruppe 0320 und verdient 1.250 €; der
Arbeitgeber zahlt nur seine Anteile zur RV und AV. Wird das Kennzeichen gesetzt?

- Was gilt, wenn nur einzelne Zweige pflichtig sind, z. B. ein Altersvollrentner mit 3321?

**F4 – Arbeitslosenversicherung bei Schülern.** Ein Schüler einer allgemeinbildenden Schule hat eine
versicherungspflichtige, nicht kurzfristige Beschäftigung, z. B. einen Ferienjob über 603 € nach
überschrittener Zeitgrenze. Ist er in der AV frei? Eine Fachquelle nennt dagegen die Pflicht in allen
Zweigen. Gesucht:

1. die Regel;
2. ab wann ein Schulabgänger nicht mehr als Schüler gilt (Ende des Schulverhältnisses oder
   Prüfungstag?);
3. Beispiele.

**F5 – Kurzfristige Beschäftigung in der Landwirtschaft.**

1. Gelten ab 2026 als Zeitgrenze 15 Wochen oder 90 Arbeitstage, und für welche Betriebe?
2. Wird auch die Berufsmäßigkeit (Beschäftigungen im Kalenderjahr) an 15 Wochen bzw. 90 Arbeitstagen
   gemessen?
3. Gibt es Beispiele?

**F6 – Studierende mit zwei kleinen Beschäftigungen.** Eine Studentin hat zwei Beschäftigungen, die
der Arbeitgeber jeweils als Minijob meldet, z. B. 500 € und 400 € bei 7 und 5 Wochenstunden.
Zusammen liegen sie über der Grenze.

1. Gilt dann die Werkstudentenregelung (106, nur RV pflichtig)?
2. Werden für die 20-Stunden-Grenze die Stunden aller Beschäftigungen zusammengezählt?
3. Welches Kennzeichen Übergangsbereich gilt?
4. Welche Schlüssel gelten für jede der beiden Beschäftigungen?

### Teil B – Beispiele des Portals mit ihren Ergebnissen

Sammle **jedes Beispiel** im Portal, das zu einem Sachverhalt das Ergebnis der Beurteilung nennt:
Schlüssel, oder die Pflicht bzw. Freiheit je Zweig. Sieh die Fachbeiträge, das Lexikon und die
Fachinformationen durch, und zwar zu diesen Themen in dieser Reihenfolge:

1. kurzfristige Beschäftigung, Berufsmäßigkeit, Zeitgrenzen, Rahmenvereinbarung;
2. Werkstudenten, Praktikanten (Pflicht, freiwillig, Vor- und Nachpraktikum), duales Studium;
3. Schüler, Schulabgänger, Ferienjobs;
4. Minijobs: mehrere Minijobs, Minijob neben Hauptbeschäftigung, RV-Befreiung, schwankendes Entgelt,
   Einmalzahlungen;
5. Übergangsbereich (Midijob), mehrere Beschäftigungen im Übergangsbereich;
6. Rentner: Alters-, Teil- und Erwerbsminderungsrente, Regelaltersgrenze, Verzicht auf die
   RV-Freiheit; Pensionäre, Beamte;
7. Jahresarbeitsentgeltgrenze, privat Versicherte, mehrere Beschäftigungen;
8. Auszubildende (Geringverdiener), Freiwilligendienst, Vorruhestand, Bezieher von Arbeitslosengeld,
   Elternzeit;
9. alles andere mit Personen- oder Beitragsgruppe.

**Schon vorhanden, bitte überspringen:** die zwei Beispiele auf der Seite „Mehrfachbeschäftigungen bei
Minijobs“:

- „Überschreiten der Geringfügigkeitsgrenze“ (300 € und 330 €);
- „603-Euro-Job und kurzfristige Beschäftigung gleichzeitig“.

Ziel sind möglichst viele Fälle, mindestens 40. Beispiele, die das Portal aus einem amtlichen Text
übernimmt, nimmst du auf und vermerkst in `hinweis`, woher sie stammen. Beispiele ohne Ergebnis
oder reine Beitragsberechnungen kommen unter `nicht_aufgenommen`, mit Grund.

### Antwortformat

Antworte **nur** mit diesem JSON, ohne Text davor oder danach. Werte schreibst du auf Deutsch,
Datumsangaben wie in der Quelle, unbekannt = `null`. Ist die Antwort zu lang, teile sie auf mehrere
Nachrichten auf. Jede Nachricht ist dann ein vollständiges JSON derselben Form mit `"teil": n` und
`"teile": m`. Teil A gehört in den ersten Teil.

```json
{
  "erstellt": "JJJJ-MM-TT",
  "teil": 1,
  "teile": 1,
  "portal": { "name": "", "url": "", "region": "", "hinweise": "" },
  "fragen": [
    {
      "id": "F1",
      "antwort": "",
      "regel": "",
      "belege": [
        {
          "dokument": "",
          "fundstelle": "",
          "url": "",
          "stand": "",
          "abgerufen": "JJJJ-MM-TT",
          "zitat": "",
          "amtlich": true
        }
      ],
      "widersprueche": [""],
      "beispiele": ["AOK-FP-01"],
      "offen": ""
    }
  ],
  "faelle": [
    {
      "id": "AOK-FP-01",
      "frage": "F1",
      "titel": "",
      "quelle": {
        "dokument": "",
        "fundstelle": "",
        "url": "",
        "stand": "",
        "abgerufen": "JJJJ-MM-TT"
      },
      "rechtsstand": "2026",
      "sachverhalt": "",
      "fakten": {
        "person": {
          "alter_oder_geburtsdatum": null,
          "status": null,
          "schulart_oder_studium": null,
          "krankenversicherung": null,
          "rente": null,
          "regelaltersgrenze_erreicht": null,
          "rv_befreiung_oder_versorgungswerk": null,
          "weitere_beschaeftigungen": [
            {
              "art": "",
              "seit": null,
              "bis": null,
              "entgelt_monat": null,
              "stunden_woche": null
            }
          ],
          "vorbeschaeftigungen_im_kalenderjahr": [
            {
              "von": null,
              "bis": null,
              "arbeitstage": null,
              "art": "",
              "entgelt_monat": null
            }
          ]
        },
        "beschaeftigung": {
          "art_laut_quelle": null,
          "beginn": null,
          "ende": null,
          "befristet": null,
          "arbeitstage": null,
          "tage_pro_woche": null,
          "stunden_woche": null,
          "stunden_ferien": null,
          "lage_der_arbeitszeit": null,
          "entgelt_monat": null,
          "stundenlohn": null,
          "einmalzahlungen": null,
          "landwirtschaft": null,
          "entgeltumwandlung": null,
          "sonstiges": null
        }
      },
      "erwartet": {
        "pgr": null,
        "bgr": null,
        "kv": "",
        "rv": "",
        "av": "",
        "pv": "",
        "uebergangsbereich": null,
        "spaeter": [{ "ab": "", "aenderung": "" }]
      },
      "wortlaut": { "pgr": false, "bgr": false, "uebergangsbereich": false },
      "zitat": "",
      "hinweis": ""
    }
  ],
  "nicht_aufgenommen": [{ "titel": "", "url": "", "grund": "" }],
  "offen": [{ "frage": "", "grund": "" }]
}
```

`wortlaut` sagt, ob der Schlüssel genau so in der Quelle steht. `spaeter` nennt Wechsel im Lauf der
Beschäftigung, z. B. „ab 01.09. versicherungspflichtig“; ohne Wechsel ist es eine leere Liste.
