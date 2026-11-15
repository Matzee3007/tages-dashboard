---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-15
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-15 (Abend). Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - KI-Zusammenfassungen|Lernjournal Phase 3 - KI-Zusammenfassungen]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #67, Journal und Übergabe)
- **Offene PRs:** #56 „Bump the npm-klein group across 1 directory with 6 updates“ (Dependabot, wartet auf den Login-Test, siehe unten)
- **Nicht committet:** nichts
- **Supabase:** gehostet, nur das Projekt bei Supabase, kein lokaler Container (`supabase status` findet keinen, das ist so gewollt)
- **Container `zusammenfassen`:** läuft mit `ai/qwen3:4b-instruct-2507`, nach der Evaluation festgelegt
  ([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]], Nachtrag). Letzter Durchlauf: `neu 2, ohne 4`.
- **Einschub KI-Feature:** abgeschlossen (Stufe 1 bis 3), in der Projektvision abgehakt.

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. **Zusammenfassungen in Production prüfen** (Aufgabe 8, Schritt 3 im
   [[projects/tages-dashboard/docs/plaene/2026-11-15-zusammenfassungen|Plan der Zusammenfassungen]], dann den Plan auf
   `status: abgeschlossen`): auf dem iPhone einloggen, bei den KI-News auf „KI“ tippen, Text mit „KI-GENERIERT“ und „Zum Artikel ↗“.

   ```bash
   docker compose logs --tail 20 zusammenfassen   # erwartet: "Durchlauf: neu N, ohne M" etwa stündlich
   ```

3. **PR #56 fertig machen** (Dependabot, unverändert seit der letzten Übergabe): Login-Test in der Vorschau fehlt, verlangt vom Update auf
   `@supabase/supabase-js` 2.119.0 ([[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]]). Hat
   Dependabot den PR neu gebaut, gilt das alte `/code-review` nicht mehr.

   ```bash
   gh pr list --author 'app/dependabot'   # ist #56 noch der aktuelle Sammel-PR?
   gh pr checks 56                        # CI grün?
   gh pr merge 56 --merge                 # erst nach dem Login-Test
   ```

## Womit es weitergeht

**Phase 3, Schritt 2 (Premier League und Champions League).** Die Befragung ist fertig: Entscheidungen unter Schritt 2 in der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]],
[[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data|ADR 0011]], Glossar „Gruppe“ und „Ligaphase“.
Aufteilung: PR 1 Premier League, PR 2 Champions League, PR 3 neues Aussehen.

Anstehende Entscheidungen, zuerst klären:

- **Zwei „ungefragt“-Zeilen im Journal** bestätigen oder umdrehen: Zusammensetzung des Testsatzes (ohne OpenAI, Karpathy aus dem Archiv)
  und Name `module-entwerfen` samt Anpassungen des Skills.

Dann:

1. **Plätze der Linien prüfen** (F13): Bundesliga nach 4, 5, 6, 15, 16, Premier League nach 4, 5, 6, 17, Champions League nach 8 und 24,
   Saison 2026/27. Quelle nennen.
2. **Schlüssel für football-data.org** über einen Assistenten (Skill `assistent-bauen`): Konto anlegen, Schlüssel in `.env.local` und bei
   Vercel. Steckbrief des Dienstes in einer neuen Tool-Notiz `docs/tools/football-data.org.md`.
3. **Plan für PR 1, Premier League** (`plan-schreiben`, dabei `module-entwerfen`): was die Fußball-Kacheln gemeinsam haben (ESPN als
   gemeinsames Modul, Spieltag und Tabelle mit zwei Adaptern: OpenLigaDB für die Bundesliga, football-data.org für PL und CL), Liste zum
   Zusammenführen der Teams, Grenze von 10 Abrufen pro Minute nachrechnen. Im selben PR: Zeile „Datenquellen“ in der Projekt-`CLAUDE.md`
   auf ADR 0011 bringen (mit `agent-texte-schreiben`).
4. **Fix fürs Abmelden** (eigener kleiner PR mit `tdd`), unverändert offen: `abmelden` in `app/login/actions.ts` prüft das Ergebnis von
   `signOut()` nicht, seit supabase-js 2.119 bleibt bei einem Fehler des Servers das Cookie. Zuerst ein Test für den Fehlerfall in
   `__tests__/login-actions.test.ts`. Im selben PR: die Grenze „Abmelden bei einem Ausfall“ und die Version in `docs/tools/Supabase.md`,
   9.0.6 in `docs/tools/node-html-parser.md` und als Nachtrag in ADR 0007, Test für Links mit `&amp;` in
   `__tests__/ki-news-seiten.test.ts`.

**Termin:** **Live-Test am Freitag, 2026-11-20, ab 20:30 Uhr** (erstes Spiel des 10. Spieltags): Minute mit orangem Punkt, Spielstand und
Torschützen sollten innerhalb von rund 2 Minuten nach einem Tor stimmen. Ergebnis im Plan der Bundesliga bei Aufgabe 5, Schritt 3
nachtragen.

Nur beobachten:

- **Container nach Neustart des Macs:** Läuft `zusammenfassen` von selbst wieder? Nicht ausprobiert.
- **OpenAI hinter Cloudflare:** Meldungen von OpenAI bleiben ohne Zusammenfassung, bewusst nicht umgangen.
- **Verlegte Partien:** Ob ESPN sie wirklich mit `STATUS_POSTPONED` oder `STATUS_CANCELED` meldet, ist an keiner echten Antwort gesehen.
- **Fund 6 aus dem `/code-review` von PR #49:** Abrufe der Bundesliga laufen nacheinander (Zeitlimit der Kachel 8 Sekunden, ESPN rund
  70 ms).
- **Punkt für frische Meldungen** bei den KI-News: Fragen, ob das im Alltag passt.
- **Seiten-Kanäle:** Baut eine Website um, fällt der Kanal still aus
  ([[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]]).

Restpunkte als Vorschläge:

1. **Cloudflare Security Audit:** spätestens vor Phase 4, vorher den Skill installieren und alle Dateien lesen lassen. Dabei das Limit je
   IP-Adresse ansehen ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Bekannte Grenzen).
2. **Offene Funde aus Reviews,** bewusst nicht behoben: PR #61 (Fehlschläge nicht gemerkt, 20.000 Zeichen gegen 8192 Token, Lese-Client
   verwirft neue Tokens), PR #64 (nicht ladbarer Artikel zählt als Modellfehler, Dateifilter dreifach), PR #27 (Abmelden ohne Netz,
   **vor Phase 4:** Stand der Kacheln bleibt nach dem Abmelden im Speicher), PR #34 (Mac-App: fremde `iframe`s, `devUrl`, `open`,
   `windows[0]`), PR #25 (Sichtbarkeit der Mac-App in den Vercel-Logs).
3. **Aus [[Engineering for Vibe Coders - Auswertung]]:** Der Endpunkt für den Kurzbefehl (Phase 4) braucht ein tauschbares Token im
   Header, jede Kachel soll zeigen, wenn ihre Daten veraltet sind.
4. **Wie oft Vercel die Feeds neu holt:** neues Vercel-Token über `assistent-bauen`
   ([[projects/tages-dashboard/docs/tools/Vercel|Vercel]], „Über die REST-API“).

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`. Aufheben, sobald die ESLint-Plugins ESLint 10 und `typescript-eslint`
  TypeScript 7 erlauben.
- Klein: Schlüsselbund bietet das Passwort in der Mac-App nicht an. Ohne Internet startet die Mac-App mit leerem Fenster (ADR 0006).
  `cargo fmt --check` meldet eine Abweichung in `src-tauri/build.rs` (in der Shell von Claude Code `~/.cargo/bin/cargo`).

Punkte fürs Ecosystem (auch der Hinweis für sport-fantasy): siehe dessen Übergabe.

## Passende Skills

- `assistent-bauen`: Schlüssel für football-data.org einrichten
- `plan-schreiben` mit `module-entwerfen`: Plan für PR 1, Premier League
- `tdd`: Fix fürs Abmelden und danach die Aufgaben des Plans
