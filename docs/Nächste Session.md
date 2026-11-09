---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-09
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-09. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Bundesliga-Kachel|Lernjournal Phase 3 - Bundesliga-Kachel]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #51)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app zeigt die Bundesliga-Kachel (PR #49) und die KI-News mit Knopf ↻ (PR #44).

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Neue PRs und offene Warnungen von Dependabot ansehen. Er öffnet jede Woche PRs, Warnungen zeigt `gh pr list` nicht.

   ```bash
   gh pr list --author 'app/dependabot'
   gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
   ```

   Ablauf: [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 3 – Sport läuft.** Schritt 1 (Bundesliga) ist fertig und abgenommen
([[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan]]). Als Nächstes **Schritt 2: Premier League und Champions League**
(Fahrplan in der [[projects/tages-dashboard/docs/Projektvision|Projektvision]]):

1. Zuerst fragt Claude, ob vorher etwas anderes ansteht (Restpunkte unten, neue Ideen).
2. Vor der Befragung prüfen (Fakten, nicht fragen): Liefert ESPN auch `eng.1` und `uefa.champions` live, mit Torschützen und Tabelle, und
   vom Server aus? Dann könnte football-data.org entfallen ([[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]).
3. `/grill-with-docs Phase 3 Schritt 2`: unter anderem Quelle, Mein Team je Wettbewerb (Arsenal; Champions League Bayern und Arsenal),
   Tabelle der Champions League (Ligaphase mit 36 Teams), was die Sport-Kacheln gemeinsam haben. Dabei den Skill `codebase-design` aus den
   Tools für später des Ecosystems ansehen (in der Befragung vom 2026-11-08 so vereinbart).

**Termin:** **Live-Test am Freitag, 2026-11-20, ab 20:30 Uhr** (erstes Spiel des 10. Spieltags): Minute mit orangem Punkt, Spielstand und
Torschützen sollten innerhalb von rund 2 Minuten nach einem Tor stimmen. Ergebnis im Plan der Bundesliga bei Aufgabe 5, Schritt 3 nachtragen.

Nur beobachten:

- **Verlegte Partien:** Ob ESPN sie wirklich mit `STATUS_POSTPONED` oder `STATUS_CANCELED` meldet, ist an keiner echten Antwort gesehen.
- **Fund 6 aus dem `/code-review` von PR #49,** bewusst offen: Die Abrufe der Bundesliga laufen nacheinander und könnten das Zeitlimit der
  Kachel von 8 Sekunden reißen. ESPN antwortete gemessen in rund 70 ms.
- **Punkt für frische Meldungen** bei den KI-News: Feeds jünger als 24 Std., Seiten heute und gestern. Fragen, ob das im Alltag passt.
- **Seiten-Kanäle:** Baut eine Website um, fällt der Kanal still aus und steht nur im Log von Vercel, siehe
  [[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]].

Restpunkte als Vorschläge:

1. **Supabase-Pause prüfen** (seit 2026-11-08 fällig): Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht,
   ob Logins als Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Cloudflare Security Audit:** am 2026-11-04 verschoben. Spätestens vor Phase 4, vorher den Skill installieren und alle seine Dateien lesen
   (Hinweise in den Tools für später des Ecosystems). Dabei das Limit je IP-Adresse ansehen
   ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Bekannte Grenzen).
3. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** In den Vercel-Logs ist nicht geprüft, ob bei ausgeblendeter App wirklich keine
   Abfragen ankommen.
4. **Offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Private Daten kommen erst mit Phase 4.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
5. **Offene Funde aus dem `/code-review` von PR #34** (Begründung im Journal „Links in der Mac-App“): fremde `iframe`s öffnen den Browser,
   der Abgleich der eigenen Adresse prüft `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt Suche nach `main`.
6. **Aus [[Engineering for Vibe Coders - Auswertung]] (2026-11-08):** Der Endpunkt für den iPhone-Kurzbefehl (Phase 4) braucht ein Token im
   Header, das sich tauschen lässt, nicht nur eine unbekannte Adresse. „Zeigt jede Kachel, wenn ihre Daten veraltet sind?“: Die Bundesliga
   lehnt seit PR #49 gespeicherte Antworten ab, die zu alt sind, die KI-News seit ADR 0005. Für die Schritte in Phase 4 neu prüfen.
7. **Wie oft Vercel die Feeds neu holt,** ist nur an einer Abfrage gemessen. Für weitere Messungen braucht es ein neues Vercel-Token, eingetragen
   über einen Assistenten (Skill `assistent-bauen`). Weg: [[projects/tages-dashboard/docs/tools/Vercel|Vercel]], Abschnitt „Über die REST-API“.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y`
  ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen.

Punkte fürs Ecosystem: siehe dessen Übergabe, dort steht auch der Punkt „`/goal` testen“.

## Passende Skills

- `grill-with-docs` (nur vom Entwickler aufrufbar: `/grill-with-docs Phase 3 Schritt 2`): Quelle und Gemeinsames der Sport-Kacheln klären
- `plan-schreiben`: Plan für Schritt 2
- `tdd`: Umsetzung der Kacheln Premier League und Champions League
