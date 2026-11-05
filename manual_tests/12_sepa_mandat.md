# 12 – SEPA-Basislastschriftmandat

Produktiv seit 05.11.2026 (Fassung 1.0.0) – im Testbereich und in der App der Kanzlei. Nur erfundene Daten verwenden;
`DE98ZZZ09999999999` ist die Test-Gläubiger-ID der Deutschen Bundesbank. Der Ablauf: Die Kanzlei füllt
zuerst aus (ihre Standardangaben aus ihrem Stammdaten-Link), dann die Kontoinhaberin oder der
Kontoinhaber.

---

## MT-119: Stammdaten-Link der Kanzlei für das Mandat

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) und klicken
**„Stammdaten-Link erstellen oder ändern …“**.

**Schritte:**

1. Im Abschnitt **„Zahlungsempfänger“** eintragen: Name `Musterkanzlei Beispiel`, Straße
   `Beispielweg 1`, Postleitzahl und Ort `12345 Musterstadt`, Land `Deutschland`, Gläubiger-ID
   `DE97ZZZ09999999999`.
2. Die Gläubiger-ID auf `de98 zzz 0999 9999 999` ändern.
3. Unter **„Ihr Link“** bei **„Was soll der Link öffnen?“** „einen neuen Fragebogen
   „SEPA-Basislastschriftmandat““ wählen und **„Kopieren“**.
4. Den Link in einem neuen Tab öffnen und **„Ich bin: Kanzlei (Zahlungsempfänger)“** wählen.

**Erwartet:**

- Schritt 1: Bei der Gläubiger-ID erscheint ein Fehler (Prüfziffer falsch); unter „Ihr Link“ steht
  „Bitte erst die markierten Angaben berichtigen.“
- Schritt 2: Der Fehler verschwindet. _Nicht offensichtlich:_ Kleinbuchstaben und Leerzeichen sind
  erlaubt; gespeichert wird `DE98ZZZ09999999999`.
- Schritt 3: Der Link enthält `formular=sepa-mandat`. Es erscheint **keine** Meldung „Der Link
  enthält eine unbekannte oder ungültige Angabe.“ (Fehler bis 05.11.2026).
- Schritt 4: Oben steht „Neuer Fragebogen „SEPA-Basislastschriftmandat“ aus Ihrem Lesezeichen. Die
  Angaben aus dem Link stehen schon im Teil „Kanzlei (Zahlungsempfänger)““. Name, Anschrift, Land und
  Gläubiger-ID sind vorbelegt, jeweils mit „Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.“;
  die Fragen werden trotzdem gezeigt.

---

## MT-120: Die Kanzlei bereitet das Mandat vor und schließt ohne Unterschrift ab

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – Name, Anschrift und
Gläubiger-ID der Kanzlei sind eingetragen; Sie stehen bei der Mandantennummer.

**Schritte:**

1. Mandantennummer `10001`, **„Weiter“**. Bei „Wer hat zu zahlen?“ `Erika Musterfrau`, **„Weiter“**.
   Bei „Ist die Kontoinhaberin oder der Kontoinhaber identisch … oder abweichend?“ und bei der
   Zahlungsart jeweils **„Weiter“**.
2. Bei „Mandatsreferenz“ **„Wird separat mitgeteilt“** klicken. Bei „Welche Angaben zum Konto tragen
   Sie schon ein?“ nichts ankreuzen, **„Weiter“**.
3. In der Zusammenfassung den Abschnitt **„Stammdaten für das nächste Mal“** lesen.
4. **„Weiter zum Abschluss“**, Häkchen setzen, **„Abschließen“**.

**Erwartet:**

- Schritt 1: Vorgewählt sind „identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder
  Kontoinhaber“ und „wiederkehrende Zahlungen“ – die Banken verlangen die Angabe „einmalig oder
  wiederkehrend“ im Mandat.
- Schritt 2: Es geht ohne Mandatsreferenz und ohne Angaben zum Konto weiter zur Zusammenfassung; dort
  steht bei „Mandatsreferenz“ „–“.
- Schritt 3: Der Text nennt die Angaben, die der Link beim nächsten Mal einträgt, und endet mit „Der
  Link enthält nur Angaben aus dem Teil „Kanzlei (Zahlungsempfänger)“.“ – nicht mehr mit
  „beschäftigten Person“. _Nicht offensichtlich:_ **Mandantennummer und Mandatsreferenz fehlen** in
  der Aufzählung und im Link – sie gelten nur für diesen Mandanten. Der Link taugt deshalb als
  Lesezeichen für alle Mandanten (seit 05.11.2026).
- Schritt 4: Die Abschluss-Seite bietet **keine** Unterschrift an, nur den Knopf „Abschließen“ – der
  Zahlungsempfänger unterschreibt ein Mandat nicht. Danach: „Kanzlei (Zahlungsempfänger):
  abgeschlossen“ mit „Gerät weitergeben – zur Übersicht“ und „PDF erstellen“, darunter **„Als Link
  weitergeben“** mit einem Link und „Kopieren“ (weiter in MT-124).

---

## MT-121: Die Kontoinhaberin erteilt das Mandat

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – die Kanzlei hat ihren
Teil abgeschlossen (mit Mandatsreferenz `100010000001`); Sie stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen und die beiden Hinweise lesen.
2. Ausfüllen: „Liegt die Anschrift im Ausland?“ **„Nein“**, Straße
   `Musterstraße 5`, Postleitzahl `1234` (vier Ziffern) und dann `12345`, Ort `Musterstadt`, Bank
   `Beispielbank`, IBAN `DE89 3704 0044 0532 0130 00`, „Dürfen über das Konto
   nur zwei Personen gemeinsam verfügen?“ **„Nein“** (vorgewählt), Ort `Musterstadt`, Datum: die
   Ziffern von heute.
3. Die Zusammenfassung durchsehen.
4. **„Weiter zum Abschluss“**, Häkchen, **„Namen tippen“** `Erika Musterfrau`, **„Unterschreiben und
   abschließen“**; dann **„PDF erstellen“** und die PDF öffnen.

**Erwartet:**

- Schritt 1: Der erste Hinweis ist der Mandatstext („Ich/Wir ermächtige(n) den in diesem Mandat
  genannten Zahlungsempfänger …“, mit der Acht-Wochen-Frist); der zweite der Datenschutz.
- Schritt 2: _Nicht offensichtlich:_ Nach Zahlungsempfänger, Gläubiger-ID, wer zu zahlen hat,
  Kontoinhaber und Zahlungsart wird **nicht** gefragt; auch nicht nach dem Namen – bei „identisch“ ist
  es der Name bei „Wer hat zu zahlen?“. Die erste Frage ist die Anschrift. Die Postleitzahl mit vier Ziffern wird
  abgelehnt (5 Ziffern), wie im Personalfragebogen. Eine BIC wird bei einer deutschen IBAN nicht
  gefragt.
- Schritt 3: Oben im Abschnitt „Mandat“ stehen „Musterkanzlei Beispiel“, `DE98ZZZ09999999999`,
  „Erika Musterfrau“, „identisch …“ und „wiederkehrende Zahlungen“, jeweils mit „festgelegt von: Kanzlei (Zahlungsempfänger)“ und **ohne**
  „ändern“. Darunter folgt „Angaben: Kanzlei (Zahlungsempfänger) (abgeschlossen, nur lesen)“ mit
  Anschrift und Mandatsreferenz `100010000001`.
- Schritt 4: Die PDF zeigt beide Teile; im Teil der Kontoinhaberin stehen Zahlungsempfänger,
  Gläubiger-ID, Name, Anschrift, IBAN, Ort, Datum und die getippte Unterschrift.

---

## MT-122: Gemeinschaftskonto – die zweite Person unterschreibt mit

**Einstieg:** [Gemeinschaftskonto öffnen](start:sepa-gemeinschaftskonto) – Kanzlei und erste
Kontoinhaberin sind fertig; die erste hat „Ja“ bei „nur zwei Personen gemeinsam“ geantwortet.

**Schritte:**

1. Die Übersicht „Wer füllt jetzt aus?“ ansehen.
2. **„Ich bin: Zweite Kontoinhaberin oder zweiter Kontoinhaber“** wählen, die beiden Hinweise lesen,
   Name `Max Mustermann`.
3. Die Zusammenfassung ansehen, dann mit getipptem Namen `Max Mustermann` unterschreiben.

**Erwartet:**

- Schritt 1: Die zweite Kontoinhaberin oder der zweite Kontoinhaber wird als **nötig** angezeigt.
- Schritt 2: Gefragt wird **nur** der Name. Zahlungsempfänger, Gläubiger-ID und IBAN sind schon
  festgelegt.
- Schritt 3: In der Zusammenfassung steht die IBAN `DE89 3704 0044 0532 0130 00` mit „festgelegt von:
  Kontoinhaberin oder Kontoinhaber“. Nach der Unterschrift fehlt keine Rolle mehr.

---

## MT-123: Ohne den Teil der Kanzlei

**Einstieg:** Auf der Startseite „SEPA-Basislastschriftmandat“ neu beginnen und **„Ich bin:
Kontoinhaberin oder Kontoinhaber“** wählen.

**Schritte:**

1. Die beiden Hinweise lesen, dann bei „An wen erteilen Sie das Mandat?“ **„Vorerst überspringen“**.
2. Bei der Gläubiger-ID `DE97ZZZ09999999999` eingeben und **„Weiter“**.
3. Zur Zusammenfassung gehen.

**Erwartet:**

- Schritt 1: _Nicht offensichtlich:_ Ohne den Teil der Kanzlei fragt das Mandat Zahlungsempfänger,
  Gläubiger-ID, Vertrag und Zahlungsart selbst – ein Mandat ohne Zahlungsempfänger lässt sich nicht unterschreiben.
- Schritt 2: Die Eingabe wird mit einem Hinweis auf die falsche Prüfziffer abgelehnt.
- Schritt 3: Oben stehen die fehlenden Pflichtangaben mit Link, darunter „Zahlungsempfänger“;
  „Weiter zum Abschluss“ ist gesperrt.

---

## MT-124: Den Teil der Kanzlei als Link statt als PDF weitergeben

**Einstieg:** Sie machen direkt nach MT-120 weiter (Abschluss-Seite der Kanzlei).

**Voraussetzungen:** MT-120.

**Schritte:**

1. Unter **„Als Link weitergeben“** auf **„Kopieren“** klicken.
2. Ein **privates Fenster** öffnen (wie ein anderes Gerät) und den Link dort in die Adresszeile
   einfügen.
3. Auf die Adresszeile achten, dann **„Ich bin: Kontoinhaberin oder Kontoinhaber“** wählen und bis
   zur Zusammenfassung ausfüllen wie in MT-121.
4. Im privaten Fenster den Link noch einmal einfügen, dabei aber die letzten 20 Zeichen löschen.

**Erwartet:**

- Schritt 1: „Link kopiert.“ Der Link ist gut 1.000 Zeichen lang und enthält `#weitergabe=1`.
- Schritt 2: Der Fragebogen öffnet sich mit „Geprüft: Alle abgeschlossenen Teile sind unverändert seit
  ihrem Abschluss.“ und „Aus einem Link zur Weitergabe geöffnet.“, bei „Wer füllt jetzt aus?“; die
  Kanzlei ist abgeschlossen.
- Schritt 3: _Nicht offensichtlich:_ Die Adresszeile zeigt **nur noch die Adresse der App**, ohne den
  langen Teil hinter „#“ – die Angaben bleiben nicht in der Adresszeile stehen. Zahlungsempfänger und
  Gläubiger-ID werden nicht gefragt (wie MT-121).
- Schritt 4: Rot: „Link zur Weitergabe: Der Link ist unvollständig oder beschädigt – vielleicht wurde
  er beim Kopieren abgeschnitten. …“ – nichts wird halb übernommen.
- _Nicht offensichtlich:_ Ein Fragebogen mit vielen Angaben oder einer gezeichneten Unterschrift (z. B.
  die fertige Sofortmeldung) bietet keinen Link an; dort steht „Für einen Link sind es zu viele
  Angaben. Bitte die PDF weitergeben.“ Der Link enthält alle Angaben wie die PDF – nur an die Person
  schicken, die als Nächstes ausfüllt.

---

## MT-125: Die Kanzlei trägt die Angaben zum Konto selbst ein

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – wie MT-120.

**Schritte:**

1. Mandantennummer `10001`, Vertrag `Erika Musterfrau`, Zahlungsart **„Weiter“**, Mandatsreferenz
   `100010000001`.
2. Bei „Welche Angaben zum Konto tragen Sie schon ein?“ **nur „Bankverbindung (Bank, IBAN, BIC)“**
   ankreuzen, **„Weiter“**; Bank `Beispielbank`, IBAN `DE89 3704 0044 0532 0130 00`.
3. Abschließen (**„Weiter zum Abschluss“**, Häkchen, **„Abschließen“**), **„Gerät weitergeben – zur
   Übersicht“**, **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen.
4. Bis zur Zusammenfassung ausfüllen (Anschrift in Deutschland, Ort, Datum).
5. Die Gegenprobe: MT-120 noch einmal öffnen und beide Kästchen ankreuzen; zusätzlich „Liegt die
   Anschrift … im Ausland?“ **„Nein“**, `Musterstraße 5`, `12345`, `Musterstadt` eintragen;
   abschließen und als Kontoinhaberin weitermachen.

**Erwartet:**

- Schritt 2: Erst nach dem Kreuz fragt die App nach Bank und IBAN; ohne Kreuz fragt sie nichts zum
  Konto.
- Schritt 4: _Nicht offensichtlich:_ Bank und IBAN werden **nicht** gefragt; in der Zusammenfassung
  stehen sie mit „festgelegt von: Kanzlei (Zahlungsempfänger)“ und ohne „ändern“. Die Anschrift fragt
  die App wie in MT-121.
- Schritt 5: Die Kanzlei wird nach keinem Namen gefragt – bei „identisch“ ist es der Name bei „Wer hat
  zu zahlen?“.
- Schritt 5 (Kontoinhaberin): Gefragt werden nur noch „Dürfen über das Konto nur zwei Personen gemeinsam verfügen?“,
  Ort und Datum. Stimmt eine Angabe der Kanzlei nicht, kann die Kontoinhaberin sie nicht ändern – die
  Kanzlei beginnt dann eine neue Fassung ihres Teils.

---

## MT-126: Anschrift im Ausland

**Einstieg:** [Mandat zum Ausfüllen öffnen](start:sepa-kanzlei-abgeschlossen) – wie MT-121.

**Schritte:**

1. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen.
2. „Liegt die Anschrift im Ausland?“ **„Ja“**, beim Staat `Öster` tippen und **„Österreich“** wählen,
   Straße `Beispielgasse 3`, Postleitzahl `123`, Ort `Wien`.

**Erwartet:**

- Schritt 2: Nach dem Staat wird gefragt, nach der deutschen Postleitzahl nicht. Die Postleitzahl
  `123` wird angenommen; gleich danach erscheint der Hinweis „Die Postleitzahl hat nicht das übliche
  Format dieses Staats. Bitte prüfen.“ (Österreich: 4 Ziffern). _Nicht offensichtlich:_ Der Hinweis
  sperrt nichts – wie im Personalfragebogen.

---

## MT-127: Abweichender Kontoinhaber

**Einstieg:** [Kanzlei beim Vertrag öffnen](start:sepa-kanzlei-vertrag-offen) – wie MT-120.

**Schritte:**

1. Mandantennummer `10001`, „Wer hat zu zahlen?“ `Beispiel GmbH`, beim Kontoinhaber **„abweichend – das
   Konto gehört einer anderen Person“**, Zahlungsart und Mandatsreferenz **„Weiter“**, bei den Angaben
   zum Konto nichts ankreuzen; abschließen, **„Gerät weitergeben – zur Übersicht“**.
2. **„Ich bin: Kontoinhaberin oder Kontoinhaber“**, die Hinweise lesen, Name `Erika Musterfrau`, bei der
   E-Mail-Adresse `erika@example.org`, dann weiter wie in MT-121 bis zur Unterschrift.
3. **„PDF erstellen“**, dann **„Fragebogen schließen“**, **„Eingänge zusammenführen“** und diese PDF
   einlesen.

**Erwartet:**

- Schritt 1: _Nicht offensichtlich:_ Bei „abweichend“ fragt die Kanzlei-Seite **nicht** nach dem Namen
  des Kontoinhabers, solange nichts angekreuzt ist – den trägt der Kontoinhaber selbst ein (wie euer
  Vordruck „vom Kontoinhaber abweichender Schuldner“).
- Schritt 2: Die App fragt den **Namen** der Kontoinhaberin und eine **E-Mail-Adresse für die Ankündigung
  der Abbuchungen** (oder „Lieber per Post“): Die Vorabankündigung geht an den Kontoinhaber, nicht nur
  an die Firma, die zahlen muss. Im Abschnitt „Mandat“ steht „Beispiel GmbH“ als zahlungspflichtig.
- Schritt 3: In der Kanzlei steht der Prüfhinweis „Abweichender Kontoinhaber: Die Vorabankündigung
  jeder Lastschrift geht an den Kontoinhaber …“; ohne Widerspruch.
