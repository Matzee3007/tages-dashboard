---
titel: Lernjournal Phase 3 - Reiter, NFL und Formel 1
status: abgeschlossen
phase: 3
erstellt: 2026-11-27
tags: [lernjournal, phase-3, espn, jolpica, nextjs, docker, supabase, dependabot, code-review, plan-pruefer]
---

# Lernjournal Phase 3: Reiter, NFL und Formel 1

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Neue KI-Quellen|Lernjournal Phase 3 - Neue KI-Quellen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Session vom 2026-11-23 bis 2026-11-27, mit ihr endet Phase 3 – Sport.

## Erledigt

- [x] Abnahme der Spielberichte (Schritt 3): Text passte gut zum Spiel, Plan abgeschlossen, Live-Test Bundesliga eingetragen (PR #92).
- [x] `JWT expired` im Container `zusammenfassen` eingegrenzt: Der Mac schlief, Durchläufe zogen sich über Stunden. Nachtrag in ADR 0013,
  Fehler in der Supabase-Notiz (PR #94).
- [x] Dependabot-PRs #87, #88, #89 (jsdom 31) und #97 geprüft und gemergt, Container danach neu gebaut (Durchlauf `neu 17, ohne 4`).
- [x] Reiter „Heute“, „Sport“, „KI-News“ mit Übersicht „Heute“ (ADR 0014, Mock Variante D, Plan, PR #95, Abnahme PR #96).
- [x] `checks.sh` baut jetzt die Produktionsfassung mit (`npm run build`), nach einem Build-Fehler, den nur die CI fand.
- [x] NFL-Kachel (Schritt 5): Versuch vom Server, Mock, Plan, ganze Woche, Viertel und Uhr, Scoring-Plays, NFC West und NFC (PR #98,
  Abnahme PR #99).
- [x] Formel-1-Kachel (Schritt 4): Versuch vom Server, Mock, Plan, Rennwochenende, Qualifying und Rennergebnis, WM-Wertung, Winterpause
  (PR #100, Abnahme PR #101).
- [x] Phase 3 – Sport abgeschlossen: alle fünf Schritte gebaut und in der Vorschau abgenommen.
- [x] Live-Test Champions League am 2026-11-24: lief gut (laut Entwickler).
- [ ] Live-Abnahmen: NFL mit laufender Partie, Formel 1 in Katar (Sa 28.11. 19:00, So 29.11. 17:00).

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Technik | `keyEvents` ohne Wechsel | Wechsel bringen nur Namen ohne Bedeutung für den Bericht | Entwickler (bestätigt) |
| Technik | Zeile `Tore:` nennt je Tor das Team | hilft beim Eigentor | Entwickler (bestätigt) |
| Prüfen | Test für die Reihenfolge in `zusammenfassen/lauf.ts` sollte mit dem JWT-Fix kommen, entfiel mit der Entscheidung unten | ohne Fix keine Änderung an `lauf.ts` | Entwickler |
| Betrieb | Fehlversuche bei Spielberichten nicht begrenzen, parken | im Log kein Bericht inhaltlich durchgefallen | Entwickler |
| Betrieb | Schläft der Mac, kommen Berichte später, `JWT expired` wird nicht abgefangen | [[projects/tages-dashboard/docs/adr/0013-spielberichte-vom-mac\|ADR 0013]], Nachtrag 2026-11-23 | Entwickler |
| Design | Reiter mit Übersicht „Heute“ (Variante D) | [[projects/tages-dashboard/docs/adr/0014-reiter-mit-uebersicht\|ADR 0014]] | Entwickler |
| Prüfen | `checks.sh` baut die Produktionsfassung | Build-Fehler sonst erst in der CI | Entwickler |
| Produkt | NFL: ganze Woche, Scoring-Plays nur live und bei den Seahawks, Tabelle NFC West + NFC, eine Spalte breit | Karte bleibt kurz | Entwickler |
| Produkt | NFL-Playoffs geparkt bis Anfang Januar 2027 | Regular Season zuerst | Entwickler |
| Technik | Abrufe der NFL und Formel 1 je 2 Sekunden Zeitlimit | bis zu vier Abrufe nacheinander bleiben unter 8 s je Kachel | Entwickler (bestätigt) |
| Produkt | Formel 1 nur Jolpica, ohne OpenF1; live nur „läuft“ | Prinzip „Erst gratis“ | Entwickler |
| Produkt | Formel 1: alle Sessions, Top 10, Fahrer und Teams Top 5, Petrol, nächste Session mit Randstreifen | Mock und Rückfragen | Entwickler |
| Produkt | Winterpause der Formel 1 bis 7 Tage vor der ersten Session der neuen Saison, solange Vorsaison zeigen | Review von PR #100 | Entwickler (bestätigt) |
| Technik | In der Projekt-`CLAUDE.md` „Jolpica und OpenF1“ → „Jolpica“ | folgt der Entscheidung „nur Jolpica“, Fund des `plan-pruefer` | Entwickler (bestätigt) |

## Befehle: Diagnose des Containers

```bash
docker compose logs -t --since 2026-11-21T12:00:00 --until 2026-11-22T10:00:00 zusammenfassen | grep -E 'Durchlauf|Spielberichte|JWT'
pmset -g log | grep -E 'Sleep|Wake|DarkWake'
docker compose exec -T zusammenfassen date -u +%FT%TZ
```

- `docker compose logs -t --since … --until …`: Log eines Zeitraums mit Zeitstempel, zeigte die Lücke von 13 Stunden zwischen zwei Durchläufen.
- `pmset -g log`: Energie-Protokoll von macOS, zeigte 288 kurze DarkWakes am Wochenende.
- `docker compose exec … date`: Uhr im Container mit der des Mac vergleichen, um eine falsche Uhr auszuschließen.

## Befehle: Prüfen und Ausprobieren

```bash
npm run build
gh pr checkout 87 && npm ci && bash checks.sh
/usr/bin/curl -s --compressed -A 'Tages-Dashboard' 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings?level=3'
/usr/bin/curl -s --compressed -A 'Tages-Dashboard' 'https://api.jolpi.ca/ergast/f1/2026/1/results.json'
```

- `npm run build`: baut die Produktionsfassung lokal, so ließ sich der Fehler der CI nachstellen.
- `gh pr checkout <nr> && npm ci && bash checks.sh`: einen Dependabot-PR lokal prüfen, danach `git checkout main && npm ci`.
- `curl … standings?level=3`: Tabelle der NFL je Division mit Playoff-Seed.
- `curl … results.json`: echtes Ergebnis, an dem sich zeigte, dass Überrundete als `Lapped` kommen.

## Neu gelernt

### Mac im Ruhezustand und Docker

Schläft der Mac, rechnet Docker nur in kurzen DarkWakes von rund 20 Sekunden. Ein Durchlauf von 15 Minuten zieht sich so über Stunden,
und Anfragen kommen mit abgelaufenem Ausweis bei Supabase an.

### Vorab-Rendern (Prerender)

Next.js baut beim Deploy eine fertige HTML-Fassung der Seite. Was sich bei jedem Besuch ändert, wie `new Date()`, darf dabei nicht gelesen
werden, sonst bricht der Build ab. Tests und Linter finden das nicht, nur `next build`.

### Wegwerf-Versuch vom Server

Ob ein Dienst vom Server bei Vercel antwortet, zeigt eine kleine Route auf einem eigenen Branch, deren Vorschau man öffnet. Danach wird der
Branch ohne PR gelöscht. So geschehen für ESPN (NFL) und Jolpica.

### Fixtures

Gekürzte echte Antworten eines Dienstes in `__tests__/fixtures/`. Die Tests prüfen damit den echten Aufbau, ohne bei jedem Lauf den Dienst
abzufragen. Gegenprobe: einen Wert im Code kurz ändern, der Test muss rot werden.

### Reiter als Zustand statt Route

Die Reiter sind ein Zustand derselben Seite. So bleiben Daten und Minutentakt beim Wechsel erhalten, ein Lesezeichen auf einen Reiter gibt es
dafür nicht.

## Fehler und Lösungen

### `JWT expired` (Code `PGRST303`)

- **Wo:** Log des Containers `zusammenfassen`, 2026-11-22 zwischen 03:25 und 08:25 UTC.
- **Ursache:** Der Mac schlief, ein Durchlauf dauerte bis zu 17 Stunden, Anfragen kamen mit abgelaufenem Ausweis an.
- **Lösung:** keine im Code (ADR 0013, Nachtrag). Der nächste Durchlauf bei wachem Mac holte 12 Berichte nach.
- **Prüfen:** `pmset -g log | grep DarkWake` zur Zeit des Fehlers.

### `Error: Route "/": Next.js encountered the unstable value \`new Date()\` in a Client Component.`

- **Wo:** CI und Vercel bei PR #95, Schritt „Produktionsfassung bauen“. `checks.sh` war lokal grün.
- **Ursache:** `app/dashboard.tsx` las beim Rendern die Uhrzeit, auch beim Vorab-Rendern im Build.
- **Lösung:** Die Uhr erst lesen, wenn die ersten Daten geladen sind. Dazu `npm run build` in `checks.sh`.
- **Prüfen:** `npm run build` ohne diese Meldung.

### `Identifier \`sport\` has already been declared`

- **Wo:** `__tests__/page.test.tsx` beim Umstellen der alten Tests auf Reiter.
- **Ursache:** Ein neuer `const sport` im selben Test wie die bestehende Funktion `sport`.
- **Lösung:** Variable in `bereich` umbenannt.
- **Prüfen:** `npm test -- __tests__/page.test.tsx`.

### Überrundete erscheinen als „Ausfall“ (Review von PR #100)

- **Wo:** Rennergebnis der Formel 1.
- **Ursache:** Jolpica meldet Überrundete seit 2026 als `Lapped`, teils ohne Zeit, teils mit irreführender Zeit.
- **Lösung:** „+n Rd.“ aus der Rundenzahl zum Sieger.
- **Prüfen:** Test `leseErgebnis: Überrundete nach Runden …` in `__tests__/f1-jolpica.test.ts`.

## Aus dem Chat

-

## Offene Fragen

- Grenzen und Nutzungsbedingungen von Jolpica sind nicht nachgelesen (Annahme 4/s, 500/Std.).
- Offene kleine Funde aus Reviews: Typen `@types/jsdom` noch auf 30, jsdom unter `devDependencies` obwohl der Container es braucht; aus dem
  Review von PR #95 Reiternamen können kollidieren, „Alles im Reiter …“ führt nur zu einem Reiter, Abzeichen live und neu im selben Reiter.

## Nächste Schritte

1. Live-Abnahmen: Formel 1 in Katar (Sa 28.11. 19:00 Qualifying, So 29.11. 17:00 Rennen), NFL mit laufender Partie (So 29.11. ab 19:00).
2. Phase 4 – Schritte beginnen (vorher fragen, ob etwas anderes ansteht, `docs/Tools für später.md` prüfen).
3. Anfang Januar 2027: Parkplatz NFL-Playoffs aufgreifen.
