# 03 – Abschluss und Unterschrift

Was ein Browser selbst prüfen kann, läuft automatisch in
`tests/e2e/handtests/03_abschluss.spec.ts`. Hier steht nur noch, was ein Mensch an einem echten
Gerät prüfen muss.

## MT-21: Person unterschreibt mit Finger oder Stift

**Einstieg:** Auf einem Tablet oder Handy im Testbereich
[Zum Unterschreiben öffnen](start:sofortmeldung-zum-unterschreiben) – der Arbeitgeber hat
abgeschlossen, alle Fragen der Person sind beantwortet und beide Hinweise bestätigt; Sie stehen in
der Zusammenfassung der Person.

**Voraussetzungen:** Ein Tablet oder Handy mit Touch-Bildschirm, wenn vorhanden mit Stift. Ohne
Testbereich: nach dem Abschluss des Arbeitgebers **„Gerät weitergeben – zur Übersicht“**,
**„Ich bin: Beschäftigte Person“**, alle Fragen beantwortet, beide Hinweise bestätigt.

**Schritte:**

1. Tippen Sie **„Weiter zum Abschluss“**.
   - **Danach:** Unten steht das gestrichelte Feld für die Unterschrift.
2. Setzen Sie das Häkchen **„Ich versichere, dass meine Angaben richtig und vollständig sind.“**
3. Unterschreiben Sie mit dem Finger im gestrichelten Feld, mit Strichen auch nach oben und unten.
   - **Danach:** Die Linie folgt dem Finger ohne Versatz.
   - **Danach:** _Nicht offensichtlich:_ Die Seite scrollt beim Unterschreiben **nicht** mit.
4. Tippen Sie **„Unterschrift löschen“** und unterschreiben Sie mit dem Stift (ohne Stift: noch
   einmal mit dem Finger).
   - **Danach:** Auch diese Linie folgt ohne Versatz, und die Seite bleibt stehen.
5. Tippen Sie **„Unterschreiben und abschließen“**.
   - **Danach:** „Beschäftigte Person: abgeschlossen“ mit „Unterschrieben am …“. Im Systemvermerk
     steht bei „Eingabe“ „touch“ (mit Stift „pen“).
