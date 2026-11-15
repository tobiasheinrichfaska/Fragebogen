# Testrahmen (Kopie)

Die gemeinsame Testseite der Testbereiche. Sie stammt aus dem privaten Repo **Testumgebung**
(`testrahmen/`) und wird hier **nicht** geändert: Änderungen dort machen, dann mit
`npm run rahmen -- <Ordner dieser App>` neu kopieren. `node pruefen.mjs` (oder ein Test der App,
der `pruefeKopie()` aufruft) meldet jede Abweichung von `testrahmen.json`.

Nur die Testfassung der App bindet diese Dateien ein, nie die Live-Fassung.
