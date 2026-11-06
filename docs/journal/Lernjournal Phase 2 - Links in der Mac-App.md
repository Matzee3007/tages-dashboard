---
titel: Lernjournal Phase 2 - Links in der Mac-App
status: aktiv
phase: 2
erstellt: 2026-11-06
tags: [lernjournal, phase-2, tauri, rust, dependabot, code-review, plan-pruefer]
---

# Lernjournal Phase 2: Links in der Mac-App

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - Feeds lesen|Lernjournal Phase 2 - Feeds lesen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Die Session lief vom 2026-11-05 bis zum 2026-11-06.

## Erledigt

- [x] Dependabot-Warnung #3 (`minimatch`, dieselbe Lücke wie #1) als `tolerable_risk` geschlossen und dokumentiert. Die Übergabe fragt beim Start jetzt auch
      Warnungen ab, nicht nur PRs (PR #33)
- [x] Fahrplan-Schritt 2 „Links in der Mac-App“ nach [[projects/tages-dashboard/docs/plaene/2026-11-05-links-mac-app|Plan]] (PR #34): Regel in
      `src-tauri/src/links.rs` mit 5 Tests, Fenster mit `on_navigation` und `on_new_window`, kein Plugin
- [x] [[projects/tages-dashboard/docs/adr/0006-links-im-standardbrowser|ADR 0006]]: Browser über `/usr/bin/open` statt `tauri-plugin-opener`
- [x] Dependabot-Warnung #2 (`glib`) als `not_used` geschlossen: Das Paket gehört nur zum Linux-Teil von Tauri. Es ist keine Warnung mehr offen
- [x] Gerätetest mit Testfassung und fertiger App bestanden, auch der Start ohne Internet. Die neue App ist in `/Applications` installiert
- [x] Agent `plan-pruefer`: ERFÜLLT. `/code-review`: 10 Funde, 3 umgesetzt (fester Pfad für `open`, ADR-Text zu `javascript:`, Test ohne Internet), der Rest bewusst offen
- [ ] Phase 2: Schritte 3 und 4 stehen noch aus

## Befehle: Dependabot

```bash
gh pr list --author 'app/dependabot'
gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
gh api -X PATCH repos/Matzee3007/tages-dashboard/dependabot/alerts/2 -f state=dismissed -f dismissed_reason=not_used -f dismissed_comment='…'
npm audit --omit=dev
```

- `gh pr list --author …`: zeigt nur die PRs von Dependabot, keine Warnungen. Deshalb fiel Warnung #3 in der letzten Session nicht auf.
- `gh api …/alerts?state=open`: listet die offenen Warnungen (Alerts) mit Schwere und Paket.
- `gh api -X PATCH …`: schließt eine Warnung mit Grund. `tolerable_risk` heißt tragbares Risiko, `not_used` heißt, der Code nutzt das Paket nicht.
- `npm audit --omit=dev`: sucht Lücken nur in dem, was die App ausliefert. Ergebnis: 0.

## Befehle: Mac-App

```bash
~/.cargo/bin/cargo tree --manifest-path src-tauri/Cargo.toml -i glib --target aarch64-apple-darwin
~/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml
PATH="$HOME/.cargo/bin:$PATH" npm run tauri -- dev
PATH="$HOME/.cargo/bin:$PATH" npm run tauri -- build
codesign --verify --deep --strict /Applications/Heute.app
```

- `cargo tree -i glib --target …`: zeigt, wer ein Paket für ein bestimmtes System braucht. Für den Mac kam „nothing to print“, für Linux eine Kette über `gtk`.
- `cargo test`: Tests der Hülle, jetzt 8 (3 für den Klick, 5 für Links).
- `npm run tauri -- dev` und `-- build`: Testfassung mit Entwicklerwerkzeugen und fertige App. Das `PATH=…` davor war nötig, siehe Fehler.
- `codesign --verify …`: prüft nach dem Kopieren nach `/Applications`, ob die Signatur noch gilt.

## Neu gelernt

### PR und Warnung sind bei Dependabot zwei Dinge

Ein PR schlägt eine neue Version vor, eine Warnung meldet eine bekannte Lücke, auch ohne PR. Beim `git push` meldet GitHub offene Warnungen im Terminal
(„GitHub found 1 vulnerability …“), das geht leicht unter.

### Zwei Wege, auf denen ein Link das Fenster verlässt

Tauri ruft `on_navigation` bei normalen Links und `on_new_window` bei `target="_blank"`. Ohne den zweiten Handler tun solche Links gar nichts. Beide lassen sich
nur beim Bauen des Fensters setzen, deshalb steht im Fenster `"create": false`, und der Code baut es selbst mit `WebviewWindowBuilder::from_config`.

### Ursprung statt Textanfang

Verglichen wird der Ursprung (Origin): Schema, Host und Port zusammen. Ein Vergleich mit dem Textanfang hielte `https://tages-dashboard-iota.vercel.app.example.com`
für die eigene Seite.

### Fester Pfad für Programme

`Command::new("open")` sucht das Programm über den `PATH`, die Liste der Ordner für Programme. Steht dort vorn ein anderes `open`, bekäme es jede Adresse.
`/usr/bin/open` umgeht die Suche (Fund aus dem `/code-review`).

### Plan-Prüfung und Code-Review ergänzen sich

Der Plan war erfüllt, das Review fand trotzdem Lücken: den Pfad von `open`, ein ungeprüftes Verhalten ohne Internet und eine Behauptung im ADR, die nur für die
reine Funktion belegt war.

## Fehler und Lösungen

### `(eval):1: command not found: cargo`

- **Wo:** in der Shell von Claude Code bei `cargo tree` und `cargo test`.
- **Ursache:** `rustup` hat den Pfad zu `~/.cargo/bin` in `~/.zshenv` und `~/.profile` eingetragen, in dieser Shell kam er nicht an (nicht weiter untersucht).
- **Lösung:** `~/.cargo/bin/cargo` mit vollem Pfad, für `npm run tauri` `PATH="$HOME/.cargo/bin:$PATH"` davor.
- **Prüfen:** `~/.cargo/bin/cargo --version` zeigt `cargo 1.99.1`.

### Geschlossene Warnung #2 erschien weiter als offen

- **Wo:** direkt nach `gh api -X PATCH …/alerts/2`.
- **Ursache:** GitHub hat die Liste kurz verzögert aktualisiert, die Warnung selbst stand schon auf `dismissed`.
- **Lösung:** Warnung einzeln abfragen (`gh api …/alerts/2 --jq .state`), dann die Liste erneut.
- **Prüfen:** Die Liste der offenen Warnungen ist leer.

### Start ohne Internet: leeres Fenster statt Fehlerseite

- **Wo:** Gerätetest nach dem `/code-review`, App ohne WLAN gestartet.
- **Ursache:** nicht untersucht. Vermutlich lädt WebKit die Fehlerseite unter einer Adresse, die `link_ziel` blockiert.
- **Lösung:** keine nötig. Nach „Neu laden“ mit Internet ist das Dashboard da. Festgehalten in ADR 0006 und `docs/tools/Tauri.md`.
- **Prüfen:** WLAN aus, App starten, WLAN an, „Neu laden“.

## Aus dem Chat

-

## Offene Fragen

- Warum entstand Warnung #3, obwohl #1 mit derselben Lücke schon geschlossen war?
- Blockiert die Hülle `javascript:`-Links im echten Fenster, oder führt WebKit sie aus, ohne `on_navigation` zu fragen?
- Warum findet die Shell von Claude Code `cargo` nicht?

## Nächste Schritte

1. Fahrplan-Schritt 3, KI-News-Kachel, zuerst mit Mock. Dabei echte Links in der fertigen Mac-App und auf iPhone und iPad anklicken.
2. Fahrplan-Schritt 4, Seiten auslesen. Auch diese Links müssen durch `istWebLink`.
