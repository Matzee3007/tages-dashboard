---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-07
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-07. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - Seiten auslesen|Lernjournal Phase 2 - Seiten auslesen]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #41)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app zeigt die KI-News mit allen Kanälen, auch den ausgelesenen Seiten (PR #40).

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Neue PRs und offene Warnungen von Dependabot ansehen. Er öffnet jede Woche PRs, Warnungen zeigt `gh pr list` nicht. Stand 2026-11-07: keine
   offenen PRs, keine offene Warnung.

   ```bash
   gh pr list --author 'app/dependabot'
   gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
   ```

   Ablauf: [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 2 – KI-News ist abgeschlossen** (2026-11-07). Die nächste Session beginnt mit **Phase 3 – Sport** (Fahrplan in der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]]).

**Zuerst fragt Claude, ob vorher etwas anderes ansteht:** neue Ideen, Skills oder Tools, oder einer der Restpunkte unten. Danach
`docs/Tools für später.md` prüfen (Stand 2026-11-07: nichts für Phase 3 vorgemerkt, Docker erst in Phase 4) und mit `/grill-with-docs` die
offenen Fragen von Phase 3 klären, dann den Plan für Schritt 1 (Bundesliga, OpenLigaDB) schreiben.

Nur der Entwickler, kurz:

- **Gerätetest Schritt 4** ([[projects/tages-dashboard/docs/plaene/2026-11-07-seiten-auslesen|Plan]], Aufgabe 5, Schritt 1): die App auf einem
  Gerät neu laden. Erwartet: Anthropic zeigt Meldungen von `anthropic.com` oder `claude.com` mit „heute“ oder „gestern“, ein Antippen öffnet den
  Beitrag. Claude trägt das Ergebnis im Plan ein.

Nur beobachten:

- **Punkt für frische Meldungen:** Feeds jünger als 24 Std., Seiten heute und gestern. Nach ein paar Tagen im Alltag fragen, ob das passt.
- **Seiten-Kanäle:** Baut eine Website um, fällt der Kanal still aus und steht nur im Log von Vercel (`Kanal … ließ sich nicht laden`), siehe
  [[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]].

Restpunkte als Vorschläge:

1. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob Logins als
   Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Cloudflare Security Audit:** am 2026-11-04 vom Entwickler verschoben. Spätestens vor Phase 4 einmal laufen lassen, vorher den Skill
   installieren und alle seine Dateien lesen (Hinweise in den Tools für später des Ecosystems). Dabei das Limit je IP-Adresse ansehen
   (Bekannte Grenzen in [[projects/tages-dashboard/docs/tools/Supabase|Supabase]]).
3. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** In den Vercel-Logs ist nicht geprüft, ob bei ausgeblendeter App wirklich keine
   Abfragen ankommen. Falls doch: Die Hülle meldet die Sichtbarkeit nicht.
4. **Offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Mit den KI-News betrifft das öffentliche Meldungen, private Daten erst ab Phase 4.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt dann der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
5. **Offene Funde aus dem `/code-review` von PR #34,** bewusst nicht behoben (Begründung im Journal „Links in der Mac-App“): fremde `iframe`s
   öffnen den Browser, der Abgleich der eigenen Adresse prüft `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt
   Suche nach dem Namen `main`.
6. **Wie oft Vercel die Feeds neu holt,** ist nur an einer Abfrage gemessen. Für weitere Messungen braucht es ein neues Vercel-Token, eingetragen
   über einen Assistenten (Skill `assistent-bauen`), nicht über den Chat. Weg: [[projects/tages-dashboard/docs/tools/Vercel|Vercel]],
   Abschnitt „Über die REST-API“.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`, von selbst erinnert niemand daran. ESLint 9 steht bei npm schon auf
  `maintenance`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein, nur wenn es stört: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster statt der Fehlerseite, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Und die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen.

Punkte fürs Ecosystem: siehe dessen Übergabe, dort steht auch der Punkt „`/goal` testen“.

## Passende Skills

- `grill-with-docs` (nur vom Entwickler aufrufbar: `/grill-with-docs Phase 3`): offene Fragen von Phase 3 klären (z. B. Mein Team, Spieltag und Tabelle, Zwischenspeicher je Anbieter)
- `plan-schreiben`: Plan für Schritt 1, Bundesliga
- `tdd`: Umsetzung der ersten Sport-Kachel
