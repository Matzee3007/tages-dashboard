---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-16
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-16. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Premier League|Lernjournal Phase 3 - Premier League]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #76, Journal und Übergabe)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Supabase:** gehostet, kein lokaler Container (`supabase status` findet keinen, das ist so gewollt)
- **Container `zusammenfassen`:** läuft (`docker compose ps`: Up)
- **Premier League:** live in Production, Abnahme bestanden ([[projects/tages-dashboard/docs/plaene/2026-11-16-premier-league|Plan]], PR #73)

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. **Live-Test vom Freitag, 2026-11-20, nachtragen**, falls er schon war: Minute mit orangem Punkt, Spielstand und Torschützen
   innerhalb von rund 2 Minuten nach einem Tor? Ergebnis im
   [[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan der Bundesliga]] bei Aufgabe 5, Schritt 3 nachtragen. Am Samstag
   lief auch die Premier League live mit: dieselbe Beobachtung dort, dazu ob die Tabelle von football-data.org nachgezogen hat.

## Womit es weitergeht

**Phase 3, Schritt 2 (Premier League und Champions League).** PR 1 Premier League ist fertig, offen sind die Punkte in der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]] unter Schritt 2.

1. **Verschmolzene Spieltage** (Fund 2 aus PR #73, eigener kleiner PR mit `tdd`): Spielt die Premier League Samstag bis Montag und gleich
   Dienstag wieder, macht `waehleSpieltag` daraus einen Block. Vorschlag: Blöcke dort trennen, wo die Nummer im Spielplan wechselt. Das
   ändert die Regel „Wechsel des Spieltags“ in der Projektvision, also erst mit dem Entwickler klären, dann Nachtrag und Test.
2. **PR 2 Champions League** (`plan-schreiben`): Ligaphase mit 36 Teams, alle 18 Partien, Mein Team FC Bayern und Arsenal, Linien
   nach 8 und 24 (kommen mit PR 3). Mitnehmen: Fund 9 aus PR #73 (Typ erzwingt `footballData`-ids, wenn die Tabelle von football-data.org
   kommt) und die Tagesgrenze von ESPN erneut prüfen (Fund 3, späte Anstöße). Bekannte Grenzen: `docs/tools/football-data.org.md`.
3. **PR 3 neues Aussehen** mit Gruppe Sport und Linien, vorher Mock mit Varianten (`mock-bauer`).

**Parkplatz** „Lokale KI für die Fußball-Kacheln“ wird fällig, wenn Schritt 2 fertig ist (Projektvision).

**Aus dem Ecosystem (2026-11-17): MIT-Lizenz.** Das Repo ist seit 2026-11-16 öffentlich (siehe [[docs/GitHub-Profil|GitHub-Profil]]).
Eine `LICENSE` mit MIT-Lizenz im Wurzelordner anlegen, als Rechteinhaber `Matzee3007` (kein Klarname, Entscheidung im
GitHub-Profil), dazu in der README einen kurzen Abschnitt „Lizenz“. Eigener kleiner PR.

## Passende Skills

- `tdd`: für den kleinen PR zu den verschmolzenen Spieltagen
- `plan-schreiben`: für PR 2 Champions League
- `module-entwerfen`: falls die Champions League am Modul `lib/kacheln/fussball/` etwas braucht, das Bundesliga und Premier League nicht
  haben
