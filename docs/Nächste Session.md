---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-06
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-06. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - Links in der Mac-App|Lernjournal Phase 2 - Links in der Mac-App]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #36)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app zeigt weiter die Testkachel. Die installierte Mac-App in `/Applications` hat die neue Link-Regel (PR #34).

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Neue PRs und offene Warnungen von Dependabot ansehen. Er öffnet jede Woche PRs, Warnungen zeigt `gh pr list` nicht. Stand 2026-11-06: keine offene Warnung.

   ```bash
   gh pr list --author 'app/dependabot'
   gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
   ```

   Ablauf: [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 2 – KI-News läuft, Schritte 1 und 2 von 4 sind fertig** (PR #30, #34). Der Fahrplan steht in der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]].

**Als Nächstes: Schritt 3, KI-News-Kachel.** Zuerst ein Mock mit dem Agent `mock-bauer` (neue Oberfläche), erst nach der Freigabe der Plan. Diese Punkte gehören dazu:

- Greift der Zwischenspeicher auf Vercel, antworten alle Anbieter den Servern, passt der OpenAI-Feed (825 KB) hinein? Siehe „In Schritt 3 prüfen“ im
  [[projects/tages-dashboard/docs/plaene/2026-11-04-feeds-lesen|Plan]] und [[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]].
- Offene Funde aus dem `/code-review` von PR #30: `stand` nennt die Abrufzeit statt des Alters der Daten, Rechenzeit für rund 2,4 MB XML je Minute messen, Rohtext wie `&ouml;` in Titeln prüfen.
- Auf iPhone und iPad prüfen, wie die installierte App fremde Links öffnet. Das kam aus Schritt 2, weil es erst mit der Kachel echte Links gibt.
- Echte Links auch in der fertigen Mac-App anklicken: Sie hat bisher nur Start und Login gesehen, die Klicks liefen in der Testfassung (Fund aus dem `/code-review` von PR #34).
- Eine lange offene App kennt die neue `art` nicht und zeigt nur den Titel: beim ersten Deploy einmal neu laden.
- Eine leere Kachelliste zeigt den Fehlerhinweis (Fund aus PR #27). Beim Entfernen der Testkachel darauf achten.

**Zuletzt Schritt 4, Seiten auslesen.** `claude.com/blog` ist anders gebaut als `anthropic.com`. Ist es nicht sauber auslesbar, den Entwickler fragen, statt es still wegzulassen.
Auch diese Links müssen durch `istWebLink` in `lib/kacheln/ki-news/feed.ts`, die Mac-App schützt vor `javascript:` nicht nachweislich
([[projects/tages-dashboard/docs/adr/0006-links-im-standardbrowser|ADR 0006]]).

`/goal` passte in Schritt 2 nicht, weil der Gerätetest nur vom Entwickler abgenommen werden kann. Schritt 3 hat mit dem Mock ebenfalls eine Freigabe, der Test bleibt also offen.

Restpunkte als Vorschläge:

1. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob Logins als
   Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Cloudflare Security Audit:** am 2026-11-04 vom Entwickler verschoben, weil hinter dem Login bisher nur die Server-Uhrzeit liegt.
   Spätestens vor Phase 4 einmal laufen lassen, vorher den Skill installieren und alle seine Dateien lesen (Hinweise in den Tools für
   später des Ecosystems). Dabei das Limit je IP-Adresse ansehen (Bekannte Grenzen in
   [[projects/tages-dashboard/docs/tools/Supabase|Supabase]]).
3. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** Die Abfragen ruhen im Code, sobald die Seite verborgen ist, und beim Einblenden kommt
   sofort eine neue. In den Vercel-Logs ist aber nicht geprüft, ob bei ausgeblendeter App wirklich keine Abfragen ankommen. Falls doch: Die
   Hülle meldet die Sichtbarkeit nicht.
4. **Weitere offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Mit den KI-News betrifft das öffentliche Meldungen, private Daten erst ab Phase 4.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt dann der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
5. **Offene Funde aus dem `/code-review` von PR #34,** bewusst nicht behoben (Begründung im Journal): fremde `iframe`s öffnen den Browser, der Abgleich der
   eigenen Adresse prüft `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt Suche nach dem Namen `main`.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`, von selbst erinnert niemand daran. ESLint 9 steht bei npm schon auf
  `maintenance`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein, nur wenn es stört: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster statt der Fehlerseite, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Und die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen (Journal, Abschnitt „Fehler“).

Punkte fürs Ecosystem: siehe dessen Übergabe, dort steht auch der Punkt „`/goal` testen“.

## Passende Skills

- `plan-schreiben`: Plan für Schritt 3, nach der Freigabe des Mocks
- `tdd`: Umsetzung der Kachel
- `fertig-pruefen`: vor dem Merge, dazu die Klicks in der fertigen Mac-App und auf dem iPhone
