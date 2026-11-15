# Wochenprüfung Fragebogen

Die geplante Aufgabe „Wochenprüfung“ arbeitet diese Liste jeden Sonntag um 3:42 Uhr ab (seit
15.11.2026; vorher war Montag geplant). Tobias, 14.11.2026: eine
wöchentliche Routine, „die prüft, ob irgendwelche der rechtlichen Basisdaten sich verändert haben
… oder Krankenkassen fusioniert haben“, und die wir „Stück für Stück erweitern“.

**Erweitern** heißt: hier einen Eintrag ergänzen. Die Aufgabe selbst bleibt gleich; sie liest diese
Datei bei jedem Lauf vom Hauptzweig. Prüfungen über alle Projekte (Sicherheit, täglicher
Integritätsauftrag, neue Projekte) stehen nicht hier, sondern in `aufgaben/wochenpruefung.md` im
privaten Repo `tobiasheinrichfaska/Pruefvorgaenge`. Der Auftrag der geplanten Aufgabe verweist nur
auf diese Dateien.

## Regeln für jeden Lauf

- Nur Primärquellen: BGBl., Bundesrat, Bundestag, BAS, GKV-Spitzenverband, gkv-datenaustausch.de,
  BMAS, BMF, UPU und die nationale Post eines Staats. Nicht raten. Was sich nicht klären lässt, wird
  als „offen“ gemeldet, mit der Quelle, die fehlt.
- Eine Änderung wird als PR umgesetzt, mit einem Test, der vorher fehlschlägt, und nach den Regeln
  von `CLAUDE.md`. Dazu gehört: eine geänderte Liste bekommt eine neue Id; eine veröffentlichte
  Fassung in `forms/` wird nie geändert, Formularänderungen gibt es nur in einem Entwurf.
- PRs dieser Liste werden **nicht** gemergt: Rechtsdaten entscheidet Tobias.
- Nie hochladen, nie eine Fassung veröffentlichen.
- Ist das „Ende“ eines Eintrags erreicht, wird der Eintrag im selben PR gestrichen (oder in einem
  eigenen, wenn sonst nichts zu ändern ist).
- Die Einträge S1 und S2 brauchen die privaten Dateien. Dafür `Fragebogen-privat` anhängen und die
  Dateien kopieren, wie es `CLAUDE.md` beschreibt („Every cloud session checks for the private files
  first“).

## Einträge

### R1 · Rechengrößen 2027 verkündet?

- **Prüfen:** Hat der Bundesrat der Sozialversicherungsrechengrößen-Verordnung 2027 zugestimmt, und
  ist sie im BGBl. verkündet? (Regierungsentwurf 07.10.2026, BR-Drs. 576/26)
- **Dann:**
  - Die Werte mit `src/logic/data/rechengroessen.ts` (`'2027'`) vergleichen und Abweichungen
    korrigieren. Die Tests in `tests/forms/personalfragebogen2027.test.ts` rechnen auf den Cent.
  - Den Kommentar „government draft“ dort und die Known Limitation in `CLAUDE.md` auf „verkündet“
    setzen, mit BGBl.-Fundstelle.
  - Tobias melden, dass der Entwurf 1.1.0 damit veröffentlicht werden kann (nur auf sein OK).
- **Ende:** verkündet und abgeglichen.

### R2 · Beitragsbemessungsgrenze Pflege 2027

- **Prüfen:** Ist das Pflegeneuordnungsgesetz (BT-Drs. 21/8869) verabschiedet und verkündet?
- **Dann:** `bbgPvMonat` 2027 auf den Wert des Gesetzes setzen (im Entwurf gleich der BBG KV). Die
  Tests anpassen, die die BBG PV unter der BBG KV prüfen.
- **Ende:** verkündet oder gescheitert. Spätestens am 31.12.2026 den Stand melden.

### R3 · Kassenfusionen zum 01.01.2027

- **Prüfen:** Hat das BAS die Fusionen genehmigt (Stand in `docs/quellen-krankenkassen.md`)?
  - BKK Rieker • RICOSTA • Weisser → BKK firmus
  - BKK Pfalz → mkk
- **Dann:** Die Gültigkeit in `src/logic/data/krankenkassen.ts` eintragen, nach den Regeln in
  `docs/quellen-krankenkassen.md`. Klären, ob eine neue Listen-Id nötig ist.
- **Ende:** beide entschieden und eingetragen.

### R4 · Krankenkassenliste des GKV-Spitzenverbands

- **Prüfen:** Ist die Liste der Krankenkassen neuer als unser Stand (Id und `docs/quellen-krankenkassen.md`)?
  Sind weitere Fusionen angekündigt?
- **Dann:** Abgleich mit `src/logic/data/krankenkassen.ts`. Eine neue Liste bekommt eine neue Id.
  Neue Kassen bekommen eine Betriebsnummer von ihrer eigenen Website, mit Quelle.
- **Ende:** dauerhaft.

### R5 · Werte des Folgejahres

- **Prüfen:** Gibt es schon Werte für das nächste Jahr?
  - Ab September: der Regierungsentwurf der Rechengrößen.
  - Eine Mindestlohnanpassungsverordnung: Die Geringfügigkeitsgrenze folgt dem Mindestlohn
    (§ 8 Abs. 1a SGB IV).
- **Dann:** Tobias melden, dass der Personalfragebogen für einen Beschäftigungsbeginn im
  Folgejahr eine neue Fassung braucht (Gültigkeit und `RECHENGROESSEN`). Die Werte erst nach seinem
  OK als Entwurf erfassen.
- **Ende:** dauerhaft.

### R6 · Minijob-Pauschsteuer

- **Prüfen:** Ist das Einkommensteuerreformgesetz 2027 verabschiedet, das die Pauschsteuer im
  Minijob anheben will (Entwurf: 2 % → 5 %)?
- **Dann:** Tobias melden. Die Beschriftungen „2 %“ stehen in den Formularen; ändern lassen sie
  sich nur in einem Entwurf.
- **Ende:** verkündet oder gescheitert.

### R7 · DEÜV-Anlagen

- **Prüfen:** Hat eine der folgenden Anlagen auf gkv-datenaustausch.de einen neuen Stand?
  - Anlagen 6, 7 und 8 (`src/logic/data/deuevListen.ts`). Anlage 6 laut Änderungsdokumentation mit
    neuer Prüfung ab 01.01.2027.
  - Anlage 2 (Personengruppen), Anlage 5 (Tätigkeitsschlüssel)
  - Anlage 16 (`tests/support/anlage16.ts`)
  - Anlage 18 (`src/logic/data/plzFormate.ts`)
- **Dann:** Die Unterschiede melden. Eine geänderte Liste kommt unter neuer Id, mit Tests.
- **Ende:** dauerhaft.

### R8 · Rundschreiben und Richtlinien

- **Prüfen:** Gibt es eine neue Fassung von einem dieser Texte?
  - Geringfügigkeits-Richtlinien
  - Rundschreiben Studenten und Praktikanten
  - Rundschreiben Übergangsbereich
  - Gemeinsame Grundsätze nach § 9a BVV
- **Dann:** Melden, welche Fälle in `tests/fixtures/sv-vorgaben/` und welche Regeln betroffen sind.
- **Ende:** dauerhaft.

### R9 · Staaten ohne Postleitzahl

- **Prüfen:** Hat einer der folgenden Staaten eine Postleitzahl eingeführt (UPU-Adressierungsblatt,
  nationale Post)?
  - Panama (angekündigt 05/2026)
  - Kamerun, Libyen, Jamaika (Pilot 2026)
  - Uganda, Timor-Leste
- **Dann:** Den Satz `staatenOhnePostleitzahl2026` nicht ändern, sondern einen neuen Satz mit
  neuer Id anlegen; eingefrorene Formulare behalten ihren. Dazu
  `docs/quellen-staaten-ohne-postleitzahl.md` fortschreiben.
- **Ende:** dauerhaft.

### S1 · Keine Kanzlei-Kennzeichen im öffentlichen Repo

- **Prüfen:** `npx vitest run tests/static/noBranding.test.ts` mit den privaten Dateien. Ohne sie
  wird der Test übersprungen, auch in der GitHub-Prüfung.
- **Dann:** Treffer melden (die Datei, nie den gefundenen Text) und als PR entfernen.
- **Ende:** dauerhaft.

### S2 · Tests mit den privaten Dateien

- **Prüfen:** `npx vitest run tests/forms/svVorgabenLokal.test.ts tests/forms/exportLocal.test.ts`.
  Die GitHub-Prüfung überspringt beide.
- **Dann:** Einen Fehlschlag mit Ursache melden und beheben wie jeden anderen.
- **Ende:** dauerhaft.

### T1 · Gepinnte Prüfwerkzeuge

- **Prüfen:** Gibt es eine neuere Version des veraPDF-Images (`verapdf/cli` in
  `.github/workflows/tests.yml`)?
- **Dann:** Ein PR mit dem Update, wenn die Version mindestens zwei Wochen alt ist.
- **Ende:** dauerhaft.

### G1 · Alte Commits von PR #1

- **Prüfen:** `git ls-remote origin 'refs/pull/1/*'`: Zeigen die Refs noch auf die alte Historie,
  also auf Commits, die nicht in `main` enthalten sind? Den Namen eines Commits nicht ausschreiben.
- **Dann:** Sind sie entfernt: Tobias melden und den Eintrag streichen.
- **Ende:** von GitHub entfernt.
