# Briefing für Claude Code auf dem Kanzlei-PC (Fragebogen)

Stand 14.11.2026 abends. Geschrieben von der Cloud-Sitzung „Fragebogen“ im Auftrag von Tobias. Die
Arbeitsteilung, die hier steht, gilt ab jetzt; sie steht auch in `CLAUDE.md` („Division of work:
cloud and Kanzlei PC“).

## Das Ziel

Bearbeitet wird nur noch in den Cloud-Sitzungen (claude.ai/code): Code, Formulare, Doku, Tests,
Fehlersuche. Der Kanzlei-PC macht nur noch, was die Cloud nicht kann: **hochladen** (SFTP über
Auslieferung) und **den Server einrichten** (`.htaccess`, Tester-Logins, freigegebene IPs).

## 1 · Repo auf den neuen `main` setzen

Die Historie wurde neu geschrieben, damit die Vornamen der Tester verschwinden, und per Force-Push
auf GitHub gebracht. Alle Commit-Kennungen vom 04.11. bis 14.11. sind neu; Inhalte, Autoren, Daten
und Nachrichten sind gleich. Kennungen in alten Upload-Protokollen von Auslieferung zeigen auf die
alten Commits; der Vergleich „online identisch“ läuft über die Datei-Hashes und ist davon nicht
betroffen.

Voraussetzung: PR #2 ist gemergt. Er bringt die GitHub-Prüfung, die UTF-8-Einstellung der
Testbrowser und dieses Briefing nach `main`.

1. Prüfen, dass lokal nichts Ungesichertes liegt: `git status`. Falls doch, Tobias fragen, bevor
   etwas verworfen wird.
2. Zurücksetzen:
   ```
   git fetch origin
   git checkout main
   git reset --hard origin/main
   ```
3. Falls ein lokaler Zweig `claude/inspiring-faraday-4jyldv` existiert: `git branch -D
claude/inspiring-faraday-4jyldv`.
4. Alte Objekte mit den Namen aus dem lokalen Repo entfernen:
   ```
   git reflog expire --expire=now --all
   git gc --prune=now
   ```
5. Prüfen: Keiner der Tester-Logins aus `deploy/.local/tester.json` kommt in `git log -p --all`
   noch vor (die Namen gehören nicht in dieses Briefing und nicht ins Repo).
6. `npm ci`.

## 2 · Einmal alles testen

Auf dem neuen Stand einmal vollständig, mit den lokalen Dateien:

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`
- `npm run test:e2e`

Erwartung: alles grün. In der Cloud lief derselbe Stand mit 5670 Unit-Tests und 206 E2E-Tests in
drei Browsern grün (ohne die lokalen Dateien). Schlägt MT-34 oder MT-35 fehl, liegen die PDF und die
Bilder des Fehllaufs unter `.tmp/e2e-fehlschlaege/`; dann nichts selbst suchen, sondern Tobias
Bescheid geben, damit die Cloud-Sitzung sie bekommt.

## 3 · Hochladen

- Testordner: `npm run hochladen -- -Ziel test`, wenn Schritt 2 grün war.
- Öffentliche App: **nur mit Tobias' ausdrücklicher Freigabe**. Seit dem letzten öffentlichen
  Upload kamen das Audit vom 14.11. und seine Entscheidungen dazu. Wichtig für die Freigabe:
  Zwischenstände der neuen App kennzeichnen Vorbelegungen; ältere heruntergeladene App-Kopien
  lehnen solche Zwischenstände ab (die gehostete App ist immer aktuell).

## 4 · Privates Repo `Fragebogen-lokal` anlegen (Tobias: ja, auch die SV-Fälle des Portals)

Zweck: Die Dateien, die nicht öffentlich sein dürfen, liegen bisher nur auf diesem PC. Mit einem
privaten Repo können die Cloud-Sitzungen alle Tests laufen lassen und alle Fassungen bauen.

1. Repo anlegen (privat, leer): `gh repo create tobiasheinrichfaska/Fragebogen-lokal --private`
   (oder auf github.com).
2. Gleiche Ordnerstruktur wie im Projekt; hinein kommen genau:
   - `config/kanzlei.local.json`
   - `config/export.local.json`
   - `config/tests.local.md`
   - `tests/fixtures/sv-vorgaben-lokal/` (ganzer Ordner)
   - `recherche/`: Kopien der lokalen Rechercheberichte, auf die `CLAUDE.md` verweist
     (`.tmp/research/`, `.tmp/hilfe/`, `.tmp/datev/`), damit die Cloud sie lesen kann.
   - `README.md`: was hier liegt, dass die Dateien unter `config/` und `tests/` eins zu eins über
     ein Fragebogen-Checkout kopiert werden, und dass hier **nie Zugangsdaten** liegen.
3. **Nicht** hinein: Zugangsdaten jeder Art, `deploy/.local/` (Tester-Liste, erzeugte `.htaccess`
   und `.htpasswd`), alles aus Auslieferung. Das bleibt auf dem PC.
4. Nur nach Tobias' Zustimmung: `import/` und `import-archiv/` (Testberichte, DATEV-Unterlagen).
   Vorschlag an Tobias: Testberichte künftig dort ablegen, damit die Cloud sie verarbeitet.
5. Vor dem Push mit `git ls-files` prüfen, dass nur das Genannte drin ist; dann pushen.
6. Tobias gibt der Claude-GitHub-App Zugriff auf das neue Repo, falls sie nur ausgewählte Repos
   sieht: https://github.com/apps/claude/installations/select_target
7. Danach ist `Fragebogen-lokal` die Quelle dieser Dateien. Änderungen macht die Cloud; der PC
   holt sie vor dem Bauen (`git pull` im Klon von `Fragebogen-lokal`) und kopiert sie in das
   Projekt. Schlag Tobias vor, das in Auslieferung als ersten Schritt eines Uploads einzubauen.

## 5 · Was Claude Code auf dem PC nicht mehr machen muss

| Bisher lokal                                                                                   | Ab jetzt                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code, Formulare, Doku und Tests ändern                                                         | Nur noch in der Cloud-Sitzung, über PRs auf GitHub                                                                                                                                                                                                       |
| Vor jedem Upload alle E2E-Tests in drei Browsern laufen lassen                                 | Die GitHub-Prüfung (`.github/workflows/tests.yml`) läuft bei jedem Push und PR in Chromium, Firefox und WebKit. Vor dem Upload nur prüfen, dass der Commit einen grünen Haken hat (GitHub, Reiter „Actions“, oder `gh run list --branch main --limit 3`) |
| Fehlschläge nachstellen und Ursachen suchen                                                    | Melden; die Cloud stellt nach und behebt. Bei MT-34/35 die Dateien aus `.tmp/e2e-fehlschlaege/` mitgeben                                                                                                                                                 |
| `npm run catalogue` (Kataloge, Ablaufplan, SV-Berichte, Hilfeseiten)                           | Erledigt die Cloud-Sitzung mit jeder Formularänderung                                                                                                                                                                                                    |
| Tests mit den lokalen Dateien (`exportLocal`, `svVorgabenLokal`, E2E mit `kanzlei.local.json`) | Sobald `Fragebogen-lokal` in den Cloud-Sitzungen angebunden ist, laufen sie dort. Bis dahin noch einmal hier, vor einem Upload                                                                                                                           |
| Testberichte auswerten                                                                         | In der Cloud, sobald sie im privaten Repo liegen (Entscheidung Tobias, siehe 4.4)                                                                                                                                                                        |

**Bleibt lokal:** Repo aktualisieren, die privaten Dateien holen, bauen und hochladen
(`npm run hochladen -- -Ziel …`, öffentlich nur mit Tobias' Freigabe), Serverkonfiguration
(`-Ziel regeln`, `npm run tester`, IP-Freigaben), und alles, was einen echten Browser oder ein
echtes Gerät am PC braucht (Claude in Chrome, Handtests in `manual_tests/` sind für Menschen).

**Bitte auch im Workspace dokumentieren:** Trag diese Arbeitsteilung in die Workspace-Datei
`c:\skripte\private\general stuff\CLAUDE.md` ein, damit alle lokalen Sitzungen sie kennen. Auch
für andere Projekte gilt: Bearbeiten in der Cloud, am PC nur Hochladen und Server.

## 6 · Noch offen bei Tobias

- Die sieben Tester-Logins in Auslieferung umbenennen: Die Vornamen waren öffentlich.
- Beim GitHub-Support beantragen, die alten Commits von PR #1 zu entfernen („Removing sensitive
  data“, `refs/pull/1/head` und `/merge`). Erst dann sind die Namen auch dort weg.
- Ob `import/` und `import-archiv/` in das private Repo dürfen.
