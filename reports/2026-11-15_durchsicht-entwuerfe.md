# Durchsicht der Formularentwürfe – 15.11.2026

Tobias, 15.11.2026: „Durchsicht: sieh durch“. Ein unabhängiger Prüf-Agent hat die Entwürfe gelesen
(nur lesend). Darunter steht sein Bericht unverändert. Hier oben steht, was daraus geworden ist.

## Stand

**Am 15.11.2026 umgesetzt** (Entwürfe, Kataloge neu erzeugt, Tests angepasst):

- X-2, SEPA-2: Der Datenschutzsatz nennt auch den Link. Die Erinnerung endet auch mit dem
  Zwischenstand, mit dem Schließen und mit „Alle Daten löschen“. Betrifft Dienstwagen,
  Personalfragebogen 1.1.0, SEPA-Mandat 1.2.0, Sofortmeldung 1.1.0 und Zustimmung 1.1.0.
- X-4: Der Katalog nennt bei Bedingungen auch die Spalte derselben Tabelle (`describeFieldRules`).
  Ein Test schließt „(unbekanntes Feld)“ in allen Katalogen aus.
- SEPA-1: Das Widerspruchsrecht nach Art. 21 DSGVO steht als eigener Absatz.
- Austritt:
  - AUS-2: Ende einer Ausbildung, § 21 Abs. 2, § 24 BBiG.
  - AUS-3: Die qualifizierte elektronische Signatur genügt für die Befristung. Die Textform bei
    der Regelaltersgrenze ist noch offen (später geklärt, siehe unten).
  - AUS-6: Frist ohne den Kündigungsausschluss.
  - AUS-8: Zwölftelung des Urlaubs, § 5 Abs. 1 BUrlG.
  - AUS-14: Übertragung des Wertguthabens, § 7f SGB IV; Quelle § 23b Abs. 2 SGB IV.
  - AUS-15: Erklärung als Drittschuldner nur bei Pfändung.
- Dienstwagen:
  - DW-1: Die Frage nach der Meldewohnung kommt nur bei Fahrten zur Arbeit, ohne Vorbelegung.
  - DW-5: Den Anschaffungstag fragt der Fragebogen nur bei Elektro- und Hybridantrieb.
- Eigenbeleg:
  - EB-1: Bei Spenden bis 300 € gilt der vereinfachte Nachweis.
  - EB-2: Die Rechnung der Gaststätte darf auch digital sein.
  - EB-6: Fahrausweis und Parkbeleg werden getrennt behandelt.
- Monatsmeldung:
  - LM-2: Erfassung der gesamten Arbeitszeit, BAG 1 ABR 22/21.
  - LM-3: Neue Beschäftigte vorher mit dem Personalfragebogen oder der Sofortmeldung melden.
  - LM-4: Krankheitstage sind Gesundheitsdaten.
- Sofortmeldung:
  - SM-1: geprüft, keine Änderung. § 28a Abs. 4 SGB IV in Kraft nennt elf Bereiche ohne
    Forstwirtschaft, wie der Entwurf.
  - SM-2: „im Gebiet der heutigen neuen Bundesländer“ statt „in den neuen Bundesländern“.

**Am 15.11.2026 abends nach Tobias' Antworten umgesetzt** (PR tobiasheinrichfaska/Fragebogen#16):

- Monatsmeldung:
  - LM-1: Eine Tabelle darf bis 100 Zeilen nennen (`maxRows`); die drei Tabellen nehmen 100.
  - LM-5 („nein“): Der Satz über die Werte des Vormonats ist gestrichen.
- Dienstwagen:
  - DW-2 („ja“): Der Arbeitgeber nennt die erste Tätigkeitsstätte.
  - DW-4, geprüft mit BMF vom 03.03.2022 Rz. 19 und 20: Das Verbot braucht kein Papier, nur der
    Verzicht der Person bleibt auf Papier. Das Verbot gilt auch für Fahrten zur ersten
    Tätigkeitsstätte.
  - Nach BMF vom 05.11.2021 Rz. 22 entscheidet bei Beschäftigten die erste Überlassung.
  - Grenze: Die Batterieminderung (DW-6) ist nicht abgedeckt.
- Eigenbeleg:
  - EB-5 („ja“): Bewirtungsbeleg zur vorhandenen Rechnung der Gaststätte, mit deren Nummer.
  - EB-2 und EB-9: Wortlaut nach BMF vom 19.11.2025 Rn. 13, 19, 20 und 22 (TSE, Verknüpfung mit
    der Rechnung), gelesen in einer Wiedergabe der NWB-Datenbank.
- Austritt, geprüft mit dem BEA-Datensatz 4.6, dem Vordruck BA II 2 – 08/2023 und § 312 SGB III:
  - AUS-21: Sozialauswahl, ursprüngliches Ende der Befristung und Agentur verlangt die
    Arbeitsbescheinigung. Die Agentur ist die, die die Sozialauswahl geprüft hat. Die Zustellung
    verlangt sie nur bei einer Kündigung durch den Arbeitgeber, mit zwei Werten.
  - Ergänzt:
    - Abschluss, Verlängerung und Aussicht auf Weiterbeschäftigung bei einer Befristung;
    - Sozialauswahl und weitere Vereinbarungen auch beim Aufhebungsvertrag;
    - Abmahnung auch bei einer hypothetischen Kündigung;
    - „steht noch nicht fest“ beim Arbeitsentgelt über das Ende;
    - Vorruhestandsleistung;
    - Höhe der Abfindung als Prüfhinweis.
  - AUS-10: Insolvenz, Arbeitskampf, Heimarbeit, Transfergesellschaft und eine vorzeitig endende
    Altersteilzeit sind ausgeschlossen. Endet eine Altersteilzeit wie vereinbart, gibt es nur einen
    Prüfhinweis.
  - AUS-22: Die Entgeltfortzahlung über das Ende hinaus (§ 8 EFZG) steht in der Hilfe, ohne Grund.
  - AUS-20: Nr. 9 ist richtig, im Gesetzestext gelesen; die Sperrzeit von einer Woche ist ergänzt.
  - AUS-3: Bei einem Ende mit der Regelaltersgrenze genügt Textform (§ 41 Abs. 3 SGB VI, gelesen).
- Zustimmung: ZST-1 („nein“) bleibt, wie es ist.

**Am 15.11.2026 spät abends nach Tobias' Antworten umgesetzt** (PR
tobiasheinrichfaska/Fragebogen#17):

- PFB-1 und SM-4 („ja“, Commit 0d325f5): Personalfragebogen 1.1.0 und Sofortmeldung 1.1.0 fragen
  „Wie unterschreiben Sie für die minderjährige Person?“: allein (alleiniges Sorgerecht, Vormund,
  Pfleger), allein mit Zustimmung des anderen Elternteils oder gemeinsam. Nur „gemeinsam“ verlangt
  die zweite Unterschrift (§ 1629 Abs. 1 Satz 2 BGB; BGH, Beschluss vom 29.04.2020 – XII ZB 112/19).
  Die Sofortmeldung behält die Unterschrift der Eltern, wegen der Hinweise auf die Pflichten der
  Person.
- X-1 für das SEPA-Mandat („ja“, Commit b60b611): SEPA-Mandat 1.2.0 ist veröffentlicht; es
  unterscheidet sich von 1.1.0 nur in den beiden Datenschutzhinweisen. 1.1.0 bleibt für laufende
  Mandate registriert.

**In der Nacht zum 16.11.2026 nach dem ersten Qualitätsaudit umgesetzt** (jeder Befund vorher von
einem zweiten Agenten zu widerlegen versucht):

- Austritt: Die Hinweise zu Schriftform, Zugang, Fristen, besonderem Kündigungsschutz und
  Betriebsrat kommen nur noch bei einer Kündigung oder einem Aufhebungsvertrag; der Hinweis auf die
  Arbeitsuchendmeldung nicht beim Tod und nicht nach einer Ausbildung. Die Hilfe zum letzten Tag
  nennt alle drei Enden einer Ausbildung (§ 21 Abs. 1 bis 3 BBiG). Ein Prüfhinweis nennt eine nur
  in Textform vereinbarte Altersgrenze in einem Vertrag von vor 2025. Eine Verlängerung kann nicht
  vor dem Tag enden, an dem sie vereinbart wurde.
- Dienstwagen: Prüfhinweise, wenn die Person Fahrten zur ersten Tätigkeitsstätte angibt, obwohl
  der Arbeitgeber sie nicht erlaubt oder keine erste Tätigkeitsstätte nennt (DW-3 zur Hälfte). Die
  Hilfe zum Nutzungsverbot sagt, dass nur der Verzicht auf Papier erklärt wird.
- Eigenbeleg: Die TSE-Pflicht gilt nur, wenn die Gaststätte eine elektronische Kasse nutzt; die
  Ausnahmen (Ausfall der TSE, spätere unbare Abrechnung mit Zahlungsbeleg, Ausland) sind genannt.
- Monatsmeldung: Die Wertetabellen sagen, wohin Werte über 100 Zeilen gehen.

**Offen** (Umbau oder Entscheidung von Tobias, siehe den Bericht unten und „Questions only Tobias
can decide“):

- Austritt: AUS-1 (formlose Kündigung), AUS-4 (Zweckbefristung), AUS-5 (Kleinbetrieb), AUS-9,
  AUS-13, AUS-16 bis AUS-19, AUS-23 (umgesetzt ist nur der Prüfhinweis bei einer Altersteilzeit,
  der die Meldung für den Rentenantrag nennt; die Frage „Geht die Person in Altersrente?“ fehlt).
- Dienstwagen: DW-3 (nur noch: Arbeitgeber erlaubt die Fahrten, die Person sagt „Nein“), DW-6 (bleibt eine Grenze: Der Entwurf enthält keine Beträge, die Grenzen
  stehen in der Hilfe zur Anschaffung), DW-7 bis DW-10.
- Eigenbeleg: EB-3, EB-4, EB-7, EB-8.
- Monatsmeldung: LM-6.
- Weitere: PFB-2 bis PFB-5, SM-3, ZST-2, X-1 (nur noch Sofortmeldung 1.0.0), X-3.
- Am 15.11.2026 abends geprüft (siehe oben): AUS-20, die Textform bei AUS-3 und EB-9.

---

# Durchsicht der Formularentwürfe (Stand 15.11.2026)

Read-only review. Nothing in the repository was changed. Basis: catalogues in `docs/formulare/`,
the JSON in `form-drafts/` and, for the deltas, a field-by-field diff against `forms/`.

Severity: **blocker** / **should fix** / **nice to have** / **question for Tobias**.
Confidence: high / medium / low. "unverified" means I could not check the norm or fact against a
source I am sure of. Where the project's own research (`docs/rechtliches.md`) says it checked a
text I could not check myself, I follow the project and say so.

---

## 0. Cross-cutting (several drafts and published forms)

**X-1 – should fix (production), high.** Published forms still say the app stores nothing, and
that is untrue for the hosted app since 04.11.2026 (it keeps an interrupted questionnaire for up
to 7 days):

- `forms/sofortmeldung/1.0.0.json` (production) and 0.2.0–0.4.0: „Diese App speichert und
  versendet Ihre Angaben nicht; …“.
- `forms/sepa-mandat/1.1.0.json` (production) and 1.0.0: „Diese App speichert und versendet
  nichts.“
- The drafts Sofortmeldung 1.1.0 and SEPA-Mandat 1.2.0 correct this. That is a reason to publish
  them soon, or to decide how to deal with the frozen texts.

**X-2 – should fix, high.** New privacy sentence in all drafts (Dienstwagen, Personalfragebogen
1.1.0, SEPA-Mandat 1.2.0, Sofortmeldung 1.1.0, Zustimmung 1.1.0): „Diese App versendet nichts;
Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben.“

- The app also offers „Als Link weitergeben“ (done screen and overview, for every questionnaire
  that fits: SEPA Kanzlei part about 1,200 characters, Sofortmeldung employer part, Eigenbeleg).
  The data then leave the device in a link, not only as a file.
- The memory is also removed when the person saves an interim file, closes the questionnaire or
  uses „Alle Daten löschen“, not only by a PDF or discarding it.
- Proposed wording: „Diese App versendet nichts; Ihre Angaben verlassen das Gerät nur als Datei
  oder als Link, die Sie selbst weitergeben. Damit eine versehentliche Unterbrechung nichts
  kostet, merkt sich die Online-Fassung einen angefangenen Fragebogen im Browser dieses Geräts –
  bis Sie eine PDF oder einen Zwischenstand speichern oder den Fragebogen schließen oder
  verwerfen, höchstens 7 Tage.“

**X-3 – question for Tobias, medium.** Every privacy notice refers to „Datenschutzerklärung der
Website“.

- Known Limitations says that policy covers only the homepage. It does not name the app
  subdomain, the hoster (now bunny.net), the browser memory or the remembered access notice.
- The notices thus point to a document that does not describe what they refer to.

**X-4 – should fix, medium (tooling).** The catalogue cannot describe conditions on table columns.

- For the Lohnmeldung it prints „erst wenn „maVerguetungsart“ (unbekanntes Feld)“.
- Cause: `describeCondition` in `src/logic/conditions.ts:233` only looks up top-level fields.
- The text the expert approves is therefore incomplete. The real condition is `maVerguetungsart`
  = „stundenlohn“ within the row.

---

## 1. Austritt 0.1.0 (full review)

Overall: careful and mostly correct. The norms I could check are cited correctly: §§ 622, 623,
626 Abs. 2 BGB; §§ 1, 1a, 4, 17 KSchG; § 102 BetrVG; § 22 BBiG; § 7 Abs. 3 SGB IV; § 8 Abs. 1
DEÜV; § 2 Abs. 2 MiLoG; § 7 Abs. 4 and § 6 Abs. 2 BUrlG; § 17 Abs. 3 BEEG; § 840 ZPO; § 38 SGB III;
§ 158 SGB III. The main gaps are flow problems around a formless Kündigung, the end of an
Ausbildung and of a Zweckbefristung, and some data whose BA purpose I cannot confirm.

### Flow and wording

**AUS-1 – should fix, high – `agKuendigungDatum`, `agKuendigungZustellung` (and `agKuendigungZugang`).**

- If „Form der Kündigung“ = „Anders, z. B. per E-Mail, Fax, Messenger, als Scan, elektronisch
  signiert oder mündlich“, the form still asks „Welches Datum trägt das Kündigungsschreiben?“.
- It also offers only „Persönlich übergeben / Per Post / Durch einen Boten“ for the delivery. For
  an oral or e-mail notice neither fits, and the employer will invent answers.
- Fix:
  - `showIf` `agKuendigungForm` = Papier for `agKuendigungDatum` and `agKuendigungZustellung`.
  - For „Anders“ ask a single date instead: „Wann wurde die Kündigung erklärt?“ (help: „Den Tag,
    an dem die E-Mail, Nachricht oder mündliche Erklärung bei der anderen Seite ankam.“).
  - The existing check hint (§ 623 BGB) stays.

**AUS-2 – should fix, high – `agEndeArbeitsverhaeltnis` (help), option „Ende der Ausbildung ohne Weiterbeschäftigung“.**

- The help names Kündigung, Befristung, Aufhebungsvertrag and Tod, but not the Ausbildung.
- A Berufsausbildung ends with the announcement of the passed final exam, even before the agreed
  end (§ 21 Abs. 2 BBiG). If the exam is failed, it is extended on request up to the next repeat
  exam, at most one year (§ 21 Abs. 3 BBiG).
- If the Azubi keeps working without an explicit agreement, an unbefristetes Arbeitsverhältnis
  arises (§ 24 BBiG). That is no Austritt at all.
- Proposed addition to the help: „Bei einer Ausbildung: der Tag, an dem das Ergebnis der
  bestandenen Abschlussprüfung bekannt gegeben wurde – auch vor dem vereinbarten Ende (§ 21
  Abs. 2 BBiG). Arbeitet die Person danach weiter, ist das kein Austritt (§ 24 BBiG).“

**AUS-3 – should fix, high (QES) / medium (Textform) – `agBefristungSchriftlich` (help) and its check hint.**

- The help says „Schriftlich heißt: auf Papier, von beiden Seiten eigenhändig unterschrieben …“.
  Unlike § 623 BGB, § 14 Abs. 4 TzBfG does not exclude the electronic form. A Befristung signed
  by both sides with a qualified electronic signature is valid (§ 126 Abs. 3, § 126a BGB).
- Unverified, from memory: since 01.01.2025 (Bürokratieentlastungsgesetz IV), a Befristung to the
  Regelaltersgrenze needs only Textform. Please check the provision.
- Today an employer who answers „Nein“ for a QES-signed contract triggers the hint „gilt … in der
  Regel als unbefristet“, which is wrong.
- Proposed help: „Schriftlich heißt: vor dem ersten Arbeitstag von beiden Seiten eigenhändig
  unterschrieben oder mit qualifizierter elektronischer Signatur. Ohne diese Form gilt das
  Arbeitsverhältnis in der Regel als unbefristet.“

**AUS-4 – should fix, medium – Zweckbefristung (`agBefristungsart` = zweckbefristet, end by „Ende einer Befristung“).**

- A zweckbefristeter Vertrag ends at the earliest two weeks after the employee receives the
  employer's written notice of when the purpose is reached (§ 15 Abs. 2 TzBfG). The form asks
  nothing about this notice.
- Proposed:
  - Add a question „Haben Sie die Person schriftlich darüber unterrichtet, wann der Zweck erreicht
    ist? Wann ist die Unterrichtung zugegangen?“.
  - Add a check hint if the end lies less than two weeks after that day.
- Optionally note in the help that continuing to work after the end with the employer's knowledge
  makes the contract unbefristet (§ 15 TzBfG; I believe Abs. 6 since 2022, unverified).

**AUS-5 – should fix, medium – `agKuendigungsgrund`, option „Ohne solchen Grund – das Kündigungsschutzgesetz gilt nicht (Kleinbetrieb oder weniger als sechs Monate beschäftigt)“.**

- The option mixes two questions: what the reason was, and whether the KSchG applies.
- In a small business an employer who dismisses for a breach of duty will pick this option. The
  Abmahnung question then disappears, and the Arbeitsbescheinigung loses whether the person gave
  cause by contractual misconduct. That fact drives the Sperrzeit (§ 159 Abs. 1 S. 2 Nr. 1 SGB III)
  whether or not the KSchG applies.
- Proposed option: „Aus keinem dieser Gründe“, with help: „Auch im Kleinbetrieb oder in den ersten
  sechs Monaten: Gab das Verhalten der Person den Anlass, wählen Sie bitte diesen Grund.“

**AUS-6 – should fix, medium – `agKuendigungsfrist` (help).**

- „Welche Frist hätte für eine ordentliche Kündigung durch Sie gegolten?“ has no answer for a
  person who cannot be dismissed („unkündbar“). That case is only asked later.
- § 158 Abs. 1 S. 3 Nr. 2 SGB III uses the period „die ohne den Ausschluss der ordentlichen
  Kündigung maßgebend gewesen wäre“. For a permanent exclusion the law fixes 18 months (Nr. 1).
- Proposed addition: „War die ordentliche Kündigung ausgeschlossen, tragen Sie die Frist ein, die
  ohne den Ausschluss gegolten hätte.“

**AUS-7 – should fix, medium – `agKuendigungsfristZum` (help).**

- The help asks the employer to work out the earlier of „15. oder Monatsende“ from the day of
  receipt. Laypersons will get that wrong.
- Proposed: an own option „zum 15. oder zum Monatsende (gesetzliche Grundfrist)“, if the BA key
  list has such a value (unverified). Otherwise keep the calculation with the payroll office.

**AUS-8 – should fix, medium – `agResturlaubTage` (help).**

- Leaving in the first half of the year, or before the six-month waiting period, gives only one
  twelfth per full month (§ 5 Abs. 1 BUrlG). Leaving in the second half after the waiting period
  gives the full statutory leave.
- This is the most frequent error in end-of-employment payroll, and the help says nothing about it.
- Proposed sentence: „Scheidet die Person in der ersten Jahreshälfte aus, steht ihr für dieses Jahr
  in der Regel nur ein Zwölftel des Jahresurlaubs je vollen Monat zu (§ 5 Abs. 1 BUrlG); im
  Zweifel rechnet die lohnabrechnende Stelle nach.“

**AUS-9 – should fix, medium – Freistellung with Urlaub.**

- The help of `agFreistellung` tells the employer to agree explicitly that open leave falls into
  the Freistellung. The form never asks whether that happened.
- That decides the number of open days, the Urlaubsabgeltung and the Ruhen (§ 157 Abs. 2 SGB III).
- Proposed: when the Freistellung is unwiderruflich, ask „Wird offener Urlaub auf die Freistellung
  angerechnet? (Ja, ausdrücklich festgelegt / Nein)“.

**AUS-10 – should fix, medium – exclusions for the cases in `limits`.**

- „Nicht abgedeckt: Insolvenz, Altersteilzeit, Vorruhestandsleistungen, Heimarbeit,
  Arbeitskampf …“ is only a text. Unlike the Personalfragebogen, no pre-question leads to an
  exclusion.
- An employer whose Altersteilzeit employee retires (a frequent case) will fill the form without
  noticing that it does not fit.
- Proposed: a pre-question „Trifft einer dieser Fälle zu?“ (multiChoice) with an exclusion per
  case.

**AUS-11 – nice to have, medium – `agKuendigungDatum` vs `agKuendigungZugang`.**

- Both claim to be the „Tag der Kündigung“: the purpose of the date of the letter says
  „Arbeitsbescheinigung: Tag der Kündigung“, while the help of the receipt date says „Diesen Tag
  meldet die lohnabrechnende Stelle als Tag der Kündigung“.
- Align them. Then the date of the letter only serves plausibility (Abmahnung before Kündigung),
  and that can be its purpose.

**AUS-12 – nice to have, high – dead check hints.**

- These hints can never fire, because `notBefore`/`notAfter` already refuse the input and block
  sealing:
  - „Das Kündigungsschreiben ist später datiert als sein Zugang“
  - „Die Kündigung ist erst nach dem angegebenen Ende … zugegangen“
  - „Die Freistellung beginnt nach dem angegebenen Ende“
- Remove them, or keep them knowingly for files sealed under an older version.

**AUS-13 – nice to have, medium – `agHaetteGekuendigtZum`.** With „Ja, zum selben Zeitpunkt“, the
date equals `agEndeArbeitsverhaeltnis`. Propose it (`suggestedText`), or add a check hint when it
differs.

**AUS-14 – nice to have, high – Wertguthaben hint.**

- „Mit dem Ende ist es aufzulösen (Störfall)“ is not the only way. The person may ask to transfer
  the Wertguthaben to a new employer or to the Deutsche Rentenversicherung Bund (§ 7f SGB IV).
- The Störfall itself is regulated in § 23b Abs. 2 SGB IV, not § 7b.
- Proposed: „… aufzulösen (Störfall, § 23b Abs. 2 SGB IV), sofern es nicht auf Wunsch der Person
  übertragen wird (§ 7f SGB IV); …“

**AUS-15 – nice to have, high – `agPfaendungNeu` (help).** The duty to make the Drittschuldner
declaration within two weeks (§ 840 ZPO) exists only for a Pfändung, not for an Abtretung.

- Proposed: „Bei einer Pfändung ist die Erklärung als Drittschuldner binnen zwei Wochen fällig
  (§ 840 ZPO).“

**AUS-16 – nice to have, medium – `agMassenentlassung`.**

- The „Warum“ text says only the employer who dismisses files the notification. Under § 17 Abs. 1
  S. 2 KSchG, other endings the employer prompts (e.g. Aufhebungsverträge) count as dismissals.
- The purpose „Prüfung der Sozialauswahl durch die Agentur für Arbeit“ looks wrong (unverified).
- Consider asking the question for Aufhebungsverträge too.

**AUS-17 – nice to have, medium – option „Ende kraft Gesetzes oder Tarifvertrags, z. B. durch eine tarifliche Altersgrenze“.**

- The BAG treats tariff and contractual age limits as Befristungen (TzBfG, § 41 SGB VI).
- Add a help sentence: „Eine Altersgrenze im Arbeitsvertrag ist eine Befristung; wählen Sie dann
  „Ende einer Befristung“.“
- Check whether the BA key proposed then (6 or „entfällt“) still fits (unverified).

**AUS-18 – nice to have, medium – notice „Besonderer Kündigungsschutz“.** „vor allem“ is honest.
Worth adding: Wehrdienst (§ 2 ArbPlSchG), Datenschutzbeauftragte (§ 6 Abs. 4, § 38 Abs. 2 BDSG),
Familienpflegezeit (§ 2 Abs. 3 FPfZG with § 5 PflegeZG).

**AUS-19 – nice to have, low – the end of a Befristung can also be challenged in court.** The
Entfristungsklage has to be filed within three weeks after the agreed end (§ 17 TzBfG). The form
offers „Steht noch nicht fest“ only for the Kündigungsschutzklage. Consider the same for the end
of a Befristung.

### Norms and facts

**AUS-20 – should fix, medium (verify) – notice „Hinweis an die beschäftigte Person“.**

- The Sperrzeit for a late registration as job-seeker is, as far as I know, § 159 Abs. 1 S. 2
  **Nr. 7** SGB III („Sperrzeit bei verspäteter Arbeitsuchendmeldung“, one week under § 159 Abs. 6).
  The notice cites Nr. 9.
- Please check against the current text. I know of no amendment that added numbers 8 and 9.

**AUS-21 – question for Tobias, unverified – data that may not be needed (DSGVO Art. 5 Abs. 1 lit. c).**

- I cannot confirm from a source that the electronic Arbeitsbescheinigung (eAB) asks for:
  - the Sozialauswahl (`agSozialauswahl`),
  - the way of delivery (`agKuendigungZustellung`),
  - the first agreed end of a renewed Befristung (`agBefristungUrspruenglichBis`),
  - the Agentur of a Massenentlassung (`agMassenentlassungAgentur`).
- If the BA's process description (Verfahrensbeschreibung eAB) does not ask for them, drop them.
  Their purposes all say only „Arbeitsbescheinigung (§ 312 SGB III)“.
- Please also check the BA keys of „Beendigung durch“ (1–6, „entfällt“) against the
  Schlüsselverzeichnis (unverified). The eAB may have its own value for „gerichtlicher Vergleich“,
  which the form only covers as an „additional agreement“.

**AUS-22 – question for Tobias – Entgeltfortzahlung after the end.**

- If the employer gave notice because of incapacity for work, Entgeltfortzahlung continues beyond
  the end (§ 8 Abs. 1 EFZG).
- `agEntgeltUeberEnde` („Selten, etwa wenn ein Vergleich …“) does not cover that.
- Naming it would touch health data, which the form deliberately avoids. Decide whether the help
  should say „auch Entgeltfortzahlung über das Ende hinaus“ without a reason.

**AUS-23 – nice to have, unverified – retirement.** When someone leaves to draw an old-age
pension, the payroll may have to make a separate report for the pension application (§ 194
SGB VI, Abgabegrund 57). The form does not ask. Consider an optional question „Geht die Person in
Altersrente?“.

Points I checked and found correct (no change):

- the Kündigungsfristen notice (§ 622 BGB);
- the two weeks for a fristlose Kündigung (§ 626 Abs. 2 BGB);
- § 1a KSchG;
- § 102 BetrVG;
- § 22 Abs. 2, 3 BBiG;
- the job-seeker registration (§ 38 Abs. 1 SGB III, including „auch wenn sie klagt“ and the
  exemption for betriebliche Auszubildende);
- Abgabegründe 30, 34, 40, 49 and 55;
- the Fünftelregelung only in the tax assessment from 2025;
- Dienstwagen per started month (R 8.1 Abs. 9 LStR);
- § 2 Abs. 2 MiLoG.

---

## 2. Dienstwagen 0.1.0

**DW-1 – should fix, high – `wohnungMeldeanschrift`.**

- „Fahren Sie von Ihrer Meldeanschrift aus?“ is asked always, even when the person answered
  „Nein“ to `fahrtenWohnung`. The question is then pointless.
- Fix: `showIf` `fahrtenWohnung` = Ja, and order it after that question.
- Note: `initial: true` is only allowed on always available fields. Drop the preselection, or turn
  it into a choice „von meiner Meldeanschrift / von einer anderen Wohnung“.
- „Meldeanschrift“ is jargon. Use „von der Wohnung, unter der Sie gemeldet sind“.

**DW-2 – should fix, high – `fahrtenWohnung` / `entfernungKm`.**

- The help addresses the person in the third person: „an dem die Person dauerhaft arbeitet“.
- More important: under § 9 Abs. 4 EStG the employer decides the erste Tätigkeitsstätte by
  permanently assigning one. The person may not know which site counts, but is asked for the
  distance to it.
- Proposed:
  - Add an employer field „Erste Tätigkeitsstätte der Person (Anschrift)“ with „keine (z. B.
    Außendienst)“.
  - Show it in the person's distance question as a placeholder.
  - Help: „Die Tätigkeitsstätte, die Ihnen Ihr Arbeitgeber dauerhaft zugeordnet hat: ‹…›“.

**DW-3 – should fix, medium – nothing compares the employer's and the person's answers on commuting.**

- AG „Nein“ (not allowed) and person „Ja“ (I drive) needs a check hint.
- AG „Ja“ and person „Nein“: the distance is then not asked. By its wording, § 8 Abs. 2 S. 3 EStG
  applies when the car „genutzt werden kann“.
- Whether administrative practice (BMF of 04.04.2018) makes actual use decisive is unverified.
  Depending on that, ask the distance whenever the employer allows commuting.

**DW-4 – should fix / question for Tobias, medium – Nutzungsverbot and „auf Papier“.**

- The basis of the signature and the option „schriftlicher Verzicht der Person (auf Papier)“
  require paper. I know of no legal paper requirement.
- Administrative practice requires a Nutzungsverbot of the employer that is documented and kept
  with the Lohnkonto (BMF, unverified Rz.). Electronic documents for the Lohnkonto are allowed.
- A waiver by the employee alone is not a prohibition by the employer.
- Proposed option: „Verzicht der Person, vom Arbeitgeber als Nutzungsverbot bestätigt“. Remove „auf
  Papier“, unless Tobias wants paper deliberately.

**DW-5 – should fix, medium – `agAnschaffung`.**

- The date of purchase or start of leasing is asked for every drive. Its help says it only matters
  for electric and hybrid vehicles.
- Data minimisation and flow: use the same `showIf` as `agErstUeberlassung`.

**DW-6 – nice to have, medium – proposal for the rate of the list price.**

- Under § 6 Abs. 1 Nr. 4 S. 2 EStG:
  - 0,25 % for emission-free vehicles up to a gross list price limit: 60.000 € until 2023,
    70.000 € from 2024, 100.000 € for acquisitions from 01.07.2025 (that last step per the
    Investitionssofortprogramm 2025, unverified);
  - 0,5 % for plug-in hybrids with CO2 ≤ 50 g/km or an electric range ≥ 80 km (acquired 2025 to
    2030);
  - otherwise 1 %.
- A derivation (rule table like the Personengruppe), or at least a check hint „Plug-in-Hybrid
  erfüllt keine der Bedingungen“, would help the Kanzlei.

**DW-7 – question for Tobias – validity.**

- „gilt für Überlassen ab ab 01.01.2026“ rules out cars handed over before 2026: a new client, a
  changed condition („neue Fassung“), or a late documentation.
- Should the validity rather refer to the date from which the facts apply?

**DW-8 – nice to have – `agSonderfaelle`.**

- No check hint flags a chosen special case for the Kanzlei; the form has no check hints at all.
- „keiner davon“ can be ticked together with other cases.
- Add a hint per case, or one collective hint, and a rule that „keiner davon“ stands alone.

**DW-9 – nice to have, unverified – `agReichweite` help „CoC Ziffer 49.5.2, elektrische Reichweite
innerorts“.** Check against the BMF letter of 05.11.2021 which value counts (EAER city). The same
for CO2 „Ziffer 49.4“.

**DW-10 – nice to have.**

- Notice „Was Ihre Angaben bewirken“: add that the Vorteil is also subject to social insurance
  contributions.
- The purpose of `agFahrzeug` (make and model) says „Bemessungsgrundlage“. It only identifies the
  car.

---

## 3. Eigenbeleg 0.1.0

**EB-1 – should fix, high – exclusion „Spende“.**

- „Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers; ein Eigenbeleg genügt
  nicht.“ is incomplete. Up to 300 € the bank's booking confirmation or the bank statement is
  enough (vereinfachter Zuwendungsnachweis, § 50 Abs. 4 S. 1 Nr. 2 EStDV; 300 € since 2021).
- Proposed: „Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers – bis 300 €
  genügt auch der Kontoauszug (§ 50 Abs. 4 EStDV). Ein Eigenbeleg genügt nicht.“

**EB-2 – should fix, medium – `bewirtungHinweis` „Sie muss von der Kasse gedruckt sein.“**

- The restaurant bill must be created by machine and registered. According to the BMF letter of
  30.06.2021 it may also be digital; the cited letter of 19.11.2025 I cannot verify.
- „gedruckt“ is too narrow. Proposed: „Sie muss von der elektronischen Kasse erstellt sein – auf
  Papier oder digital.“

**EB-3 – should fix, medium – the notices `hinweisKapitalgesellschaft` and `bewirtungHinweis`.**

- They are built as required questions with the single answer „Verstanden“. Since 12.11.2026 the
  engine has conditional notices (`InfoBlock.showIf` with `because`). Their text then goes into
  the seal by hash.
- In the PDF a notice phrased as a question („Frage: Bitte beachten Sie: …“) with the answer
  „Verstanden“ reads oddly.
- Proposed: two conditional infoBlocks instead of the pseudo-fields.

**EB-4 – should fix, high – `fahrtenbuch`, `rechtsform`.**

- Both help texts say „Wenn Sie es nicht wissen / unsicher sind: Ihre Kanzlei weiß es“, but both
  are required and offer no „Weiß ich nicht“. Whoever does not know must guess.
- Proposed: add the option „Weiß ich nicht“; for `fahrtenbuch` that means choice instead of yes/no.
  The Kanzlei hints then say „klären“.

**EB-5 – question for Tobias, medium – Bewirtungsbeleg to an existing restaurant bill.**

- `limits` excludes this case: „Nicht gedacht als Bewirtungsbeleg zu einer vorhandenen Rechnung
  der Gaststätte.“ In practice it is the most frequent self-made record. The owner has the bill
  and must add the occasion and participants in writing (§ 4 Abs. 5 S. 1 Nr. 2 EStG). The
  financial administration allows this digitally.
- The form already asks for exactly these data. A fifth kind „Bewirtung mit Rechnung der
  Gaststätte (Angaben zu Anlass und Teilnehmenden)“ would be worth a lot.

**EB-6 – nice to have, high – Kanzlei hint „Fahrschein oder Parkbeleg verloren … ein Fahrausweis gilt als Rechnung (§ 34 Abs. 1 UStDV)“.** That holds only for tickets, not for parking or taxi
receipts, which are at most small-amount invoices (§ 33 UStDV). Split the wording.

**EB-7 – nice to have.**

- Propose today for `ausstellungsdatum` (`suggestedText` today); the help already says „In der
  Regel heute“.
- `zahlungsnachweis` with a private card or account: add „Andere private Buchungen auf dem
  Kontoauszug dürfen Sie schwärzen.“ (data minimisation).

**EB-8 – nice to have – Geschenk hint.** Over 50 € (and also below), the flat-rate tax of § 37b
EStG for gifts to business partners may apply. One sentence for the Kanzlei.

**EB-9 – unverified – BMF letter of 19.11.2025 on Bewirtungen.** It is cited three times (Rn. 13,
19, 22), but I do not know it. Please make sure the marginal numbers are right before publishing.

Correct (checked):

- 50 € Freigrenze for gifts since 2024 (gross without input VAT);
- 8 years for Buchungsbelege since 2025 (§ 147 Abs. 3 AO, BEG IV);
- no input VAT from an Eigenbeleg;
- § 379 Abs. 1 S. 1 Nr. 1 AO;
- the evidence of all costs for the Fahrtenbuch method (§ 6 Abs. 1 Nr. 4 S. 3 EStG);
- Kapitalgesellschaft / vGA (§ 8 Abs. 3 KStG).

---

## 4. Monatsmeldung (lohnmeldung) 0.1.0

**LM-1 – should fix (for real use; blocker for firms with more than about 10 employees), high – tables limited to 30 rows.**

- `MAX_ROWS = 30` (`src/logic/normalize.ts:427`) applies to `mitarbeitende` and to `monatWerte`.
  `monatWerte` is „eine Zeile je Person und Lohnart“, so 10 hourly workers with 3 Lohnarten already
  reach the limit. More is refused (`rows.tooMany`).
- `limits` does not mention it.
- Raise the limit for this form, e.g. a per-field `maxRows`, or at least name it in `limits` and on
  the start screen.

**LM-2 – should fix, high – notice „Arbeitszeit aufzeichnen“.**

- „Arbeitszeit über acht Stunden je Werktag ist immer aufzuzeichnen (§ 16 Abs. 2 ArbZG)“ makes it
  sound as if only overtime had to be recorded.
- Since the BAG decision of 13.09.2022 – 1 ABR 22/21, employers must record the whole working time
  (§ 3 Abs. 2 Nr. 1 ArbSchG). Whether the ArbZG was amended by November 2026 is unverified.
- Proposed sentence: „Nach der Rechtsprechung des Bundesarbeitsgerichts ist die gesamte
  Arbeitszeit aller Beschäftigten zu erfassen (Beschluss vom 13.09.2022 – 1 ABR 22/21).“

**LM-3 – should fix, high – starts of employment through the monthly report.**

- The help of „Besonderheiten“ invites „Ein- oder Austritte“ as free text.
- In the sectors of § 28a Abs. 4 SGB IV the Sofortmeldung is due on the first working day at the
  latest; the Anmeldung follows with the next payroll.
- Proposed addition: „Neue Beschäftigte melden Sie bitte vor dem ersten Arbeitstag mit dem
  Personalfragebogen (in Branchen mit Sofortmeldepflicht mit der Sofortmeldung), Austritte mit dem
  Fragebogen „Austritt“ – nicht erst mit dieser Meldung.“

**LM-4 – should fix, medium – „Fehlzeiten werden nur mit Art und Zeitraum gemeldet, nie mit einer Diagnose (Art. 9 DSGVO)“.**

- This reads as if the bare kind of absence were not health data. But „krank“ (and „Kind krank“,
  „Mutterschutz“) is health data under Art. 9 even without a diagnosis.
- Proposed: „Krankheitstage sind Gesundheitsdaten (Art. 9 DSGVO); gemeldet werden nur Art und
  Zeitraum, nie eine Diagnose.“

**LM-5 – question for Tobias – notice „Bis wann die Meldung gebraucht wird“.**

- „Fehlt sie, wird mit den Werten des Vormonats gerechnet; Differenzen werden im Folgemonat
  ausgeglichen.“ mixes the rule for contributions (§ 23 Abs. 1 S. 3 SGB IV: pay contributions in
  the amount of the previous month) with the payroll itself.
- Paying wages on last month's values is a Kanzlei policy, not a legal consequence. Is that
  really how it works? If so, say it as the Kanzlei's practice.

**LM-6 – nice to have.**

- Check hint for an hourly wage below the minimum wage: 13,90 € in 2026, 14,60 € in 2027 (§ 1
  MiLoG); for trainees, the minimum training allowance (§ 17 BBiG).
- `vormonatWert` should allow negative values (`signed`), since corrections of the previous month
  can be reductions.
- `maScheidetAus`: a pointer to the Austritt questionnaire.

---

## 5. Personalfragebogen 1.1.0 (delta to 1.0.0)

What changed:

- validity 2026 → 2026–2027, with the 2027 values in help texts and labels;
- a second legal representative (`vertretungAlleinSorge`, role `vertretung2`);
- date order (`notBefore`) on five end dates;
- conditional options in `agUnterlagen`;
- `agFamilienname` and `agVorname` taken over from the person part and changeable;
- help texts.

Arithmetic checked:

- Minijob 2027: 14,60 € × 130 ÷ 3 = 632,67 → 633 €; 7.596 € a year;
- JAEG 84.150 € ÷ 12 = 7.012,50 €;
- RAG 1961 = 66 years 6 months (§ 235 Abs. 2 SGB VI).
  The 2027 values themselves rest on the government draft; that is already listed as open.

**PFB-1 – question for Tobias, medium – second signature of the parents (`vertretung2`, also in Sofortmeldung 1.1.0).**

- § 1629 Abs. 1 S. 2 BGB (joint representation) is cited correctly. Before requiring a second
  signature, consider:
  - The person's answers are mostly statements of fact for duties to cooperate (§ 28o SGB IV, tax
    data), not Willenserklärungen that need a representative.
  - A minor whom the parents allowed to take up employment has full legal capacity for that
    employment (§ 113 BGB; not for a Berufsausbildung).
  - One parent may authorise the other.
- The question „Haben Sie das Sorgerecht allein?“ forces a second signature even when the other
  parent agreed.
- Alternative wording: „Vertreten Sie die Person allein – weil Sie das Sorgerecht allein haben oder
  der andere Elternteil einverstanden ist?“ Also add to the help that a Vormund answers „Ja“.
- The binding is implemented correctly: `vertretung2` must confirm the current part of
  `vertretung`, and that part confirms the person's part.

**PFB-2 – question for Tobias, medium – `agSchwerbehinderung` (help).**

- „In den ersten sechs Monaten der Beschäftigung dürfen Sie danach nur fragen, wenn Sie dazusagen,
  dass die Antwort freiwillig ist.“ I know of no basis for this rule.
- The BAG allows the question after six months (16.02.2012 – 6 AZR 553/10). Before that, the usual
  view is that the question is inadmissible (§ 164 Abs. 2 SGB IX, AGG).
- Safer: „In den ersten sechs Monaten fragen Sie bitte nicht danach; teilt die Person es von sich
  aus mit, tragen Sie es ein.“

**PFB-3 – nice to have – `agUnterlagen` options.**

- „Aufenthaltstitel oder Arbeitserlaubnis“ is offered for every non-German. Citizens of the EU,
  the EEA and Switzerland need none. Add „(nicht bei Staatsangehörigen der EU, des EWR und der
  Schweiz)“, or narrow the condition.
- „Immatrikulationsbescheinigung“ is also offered for `studienbewerber`, who have none yet.

**PFB-4 – question for Tobias – `agSachbezuege` (help).** „Dafür schickt Ihnen die lohnabrechnende
Stelle einen eigenen Fragebogen“ promises the Dienstwagen form, which is still a draft. Publish
both together, or word it neutrally.

**PFB-5 – nice to have – `agBerufsbezeichnung` (help).** The example „Bürokauffrau“ has been
„Kauffrau für Büromanagement“ since 2014. Harmless as an example of a contract title.

---

## 6. SEPA-Mandat 1.2.0 (delta to 1.1.0: only the two privacy notices)

**SEPA-1 – should fix, high – `datenschutz` and `datenschutzMitinhaber`.**

- The new text rests the processing for a payer who pays another person's contract on legitimate
  interest (Art. 6 Abs. 1 lit. f DSGVO). The legitimate interest itself is now named, as
  Art. 13 Abs. 1 lit. d requires.
- With lit. f the right to object applies. It must be mentioned (Art. 13 Abs. 2 lit. b), and under
  Art. 21 Abs. 4 explicitly and apart from other information. The text lists only „Art. 15 bis 18
  und 77“.
- Proposed separate sentence: „Soweit die Kanzlei Ihre Angaben aufgrund ihres berechtigten
  Interesses verarbeitet, können Sie dem aus Gründen, die sich aus Ihrer besonderen Situation
  ergeben, jederzeit widersprechen (Art. 21 DSGVO).“

**SEPA-2 – should fix, high – „verlassen das Gerät nur als Datei“.** The SEPA-Mandat is the
form most often passed on as a link (Kanzlei part about 1,200 characters), so X-2 applies here in
particular.

Otherwise the delta corrects the untrue „speichert … nichts“ of the production version (X-1).

---

## 7. Sofortmeldung 1.1.0 (delta to 1.0.0)

What changed:

- `agBranche` with the exclusion „keiner“, also in the master-data link;
- short ID-papers notice (`mitfuehrungspflicht`, still a paper handout);
- birth-place help;
- foreign postcode required unless the state has none;
- second representative;
- names taken over from the person part.

**SM-1 – should fix (blocker if wrong), unverified – sector list of `agBranche`.**

- The list has eleven sectors without „Unternehmen der Forstwirtschaft“. From memory, Forstwirtschaft
  stood in § 28a Abs. 4 SGB IV and § 2a Abs. 1 SchwarzArbG.
- `docs/rechtliches.md` says the SchwarzArbMoDiG (BGBl. of 29.12.2025) removed it, checked against
  the text on 29.10.2026. That law is beyond what I can verify.
- Because „keiner“ blocks the whole form, recheck against the text in force before publishing. A
  forestry business would otherwise be excluded wrongly.

**SM-2 – nice to have – `geborenInDeutschland` (help).** „Wer zum Beispiel vor 1990 in den neuen
Bundesländern geboren ist“: the neue Bundesländer did not exist before 1990.

- Proposed: „Wer zum Beispiel in der DDR geboren ist, antwortet mit Ja.“, which 1.0.0 already said,
  or „im Gebiet der heutigen ostdeutschen Länder“.

**SM-3 – nice to have – exclusion `keinSofortmeldeBereich`.** The message could say what to do
instead: „Melden Sie die Beschäftigung mit dem Personalfragebogen an; eine Sofortmeldung ist nicht
nötig.“

**SM-4** = PFB-1 (second representative).

---

## 8. Zustimmung (steuerfreigabe) 1.1.0 (delta to 1.0.0)

What changed: number and names when there are several Anlagen EÜR, Gewerbe- or
Umsatzsteuererklärungen, and which of them have a Zerlegungserklärung. Kanzlei fields are taken
over into the client part (`fromRole`), with consistency rules. The logic is consistent: the
Zerlegung is only asked with the GewSt, `zerlegungBei` only with several GewSt.

**ZST-1 – question for Tobias – why only these three?** Several returns of the same kind also
occur for other types:

- Feststellungserklärungen for several companies or years;
- an Einkommensteuer catch-up for several years;
- several E-Bilanzen;
- Zusammenfassende Meldungen for several quarters.
  A general „Anzahl/Bezeichnungen“ per ticked kind would avoid the next version.

**ZST-2 – nice to have.**

- With „Mehrere“ the names field accepts a single line. Add a check hint „mindestens zwei Zeilen“.
- Each line of `zerlegungBei` should match a line of `gewstBezeichnungen` (check hint). The limit
  states that nothing is checked; both checks would be cheap.

---

## Questions only Tobias can decide

1. **Austritt:** Which fields does the BA's electronic Arbeitsbescheinigung really ask for?
   Sozialauswahl, way of delivery, first end of a Befristung, Agentur of the Massenentlassung. Drop
   what it does not ask for (AUS-21).
2. **Austritt:** Should the special cases in `limits` (Altersteilzeit, Insolvenz, Vorruhestand …)
   become pre-questions with exclusions (AUS-10)? And the Entgeltfortzahlung after the end
   (AUS-22)?
3. **Dienstwagen:** Paper for the waiver or prohibition of private use (DW-4)? Validity only from
   „Überlassen ab 2026“ (DW-7)? Should the employer name the erste Tätigkeitsstätte (DW-2)?
4. **Eigenbeleg:** Also offer a Bewirtungsbeleg to an existing restaurant bill (EB-5)?
5. **Monatsmeldung:** Is „Fehlt sie, wird mit den Werten des Vormonats gerechnet“ Kanzlei practice
   (LM-5)? How many employees and value rows must it carry (LM-1)?
6. **Personalfragebogen / Sofortmeldung:** Always a second parent's signature under joint custody,
   or „allein vertretungsberechtigt“ including consent (PFB-1)? The help on asking about a severe
   disability (PFB-2)?
7. **Zustimmung:** Several returns for further kinds as well (ZST-1)?
8. **Production:** The published Sofortmeldung 1.0.0 and SEPA-Mandat 1.1.0 say the app stores
   nothing (X-1). Publish the drafts soon? Which privacy policy should the notices point to (X-3)?
9. **To verify before publishing (I could not):**
   - the sector list without Forstwirtschaft (SM-1);
   - § 159 Abs. 1 S. 2 Nr. 7 vs Nr. 9 SGB III (AUS-20);
   - the Textform for a Befristung to the Regelaltersgrenze (AUS-3);
   - the BMF letter of 19.11.2025 (EB-2, EB-9);
   - the 100.000 € limit for electric company cars (DW-6).
