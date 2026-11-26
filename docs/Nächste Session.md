---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-27
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-27. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Reiter, NFL und Formel 1|Lernjournal Phase 3 - Reiter, NFL und Formel 1]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #102, Journal und Übergabe)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Supabase:** gehostet, kein lokaler Container (so gewollt)
- **Docker Desktop:** beendet (so gewollt). Damit läuft auch der Container `zusammenfassen` nicht: keine neuen Zusammenfassungen und
  Spielberichte, bis Docker wieder läuft.
- **Phase 3 – Sport:** abgeschlossen am 2026-11-27 (Bundesliga, Premier League, Champions League, Spielberichte, NFL, Formel 1, dazu
  Reiter mit Übersicht „Heute“, ADR 0014)

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Sollen Zusammenfassungen und Spielberichte laufen: Docker Desktop öffnen, dann

   ```bash
   docker compose up -d
   ```

   startet den Container `zusammenfassen` wieder, der alle 15 Minuten KI-News und Spielberichte erzeugt (ADR 0010, ADR 0013).

## Wartet auf dich

- [ ] **Live-Abnahme Formel 1 in Katar** (blockiert: nichts, Plan ist abgeschlossen)
  - Ort: Dashboard in Production, Reiter „Sport“ und „Heute“. Qualifying Sa 28.11. 19:00, Rennen So 29.11. 17:00.
  - Erwartet: Während der Session an ihr „läuft“ mit orangem Punkt, in „Heute“ unter „Jetzt live“ die Zeile „Qualifying läuft · Großer
    Preis von Katar“ und am Reiter Sport ein Punkt. Nach dem Qualifying die Tabelle „Qualifying“, nach dem Rennen (Jolpica braucht etwas)
    das „Rennergebnis“. Ergebnis im [[projects/tages-dashboard/docs/plaene/2026-11-27-formel-1|Plan Formel 1]] bei Aufgabe 6 nachtragen.
- [ ] **Live-Abnahme NFL** (blockiert: nichts)
  - Ort: Dashboard in Production, So 29.11. ab 19:00 (Woche 12).
  - Erwartet: laufende Partie mit „Q2 3:41“ o. Ä., Scoring-Plays bei laufenden Partien und den Seahawks unter dem richtigen Team, in „Heute“
    unter „Jetzt live“. Ergebnis im [[projects/tages-dashboard/docs/plaene/2026-11-25-nfl|Plan NFL]] bei Aufgabe 7 nachtragen.
- [ ] **Mac-App neu bauen**, damit sie beim Start den Grundton `#0F1318` zeigt (blockiert: nichts)
  - Befehl im eigenen Terminal: `npm run tauri -- build`
  - Erwartet: Beim Öffnen der App blitzt kein anderer Farbton mehr auf.

## Womit es weitergeht

**Phase 4 – Schritte** beginnt (Roadmap in der [[projects/tages-dashboard/docs/Projektvision|Projektvision]]): iPhone-Kurzbefehl schickt
die Schritte aus Apple Health an die App, Kachel mit Tageswert, Tagesziel und Verlauf.

1. **Zuerst fragen, ob vorher etwas anderes ansteht.** Vorschläge:
   - **MIT-Lizenz** (aus dem Ecosystem, 2026-11-17): `LICENSE` im Wurzelordner, Rechteinhaber `Matzee3007` (kein Klarname), in der README
     ein Abschnitt „Lizenz“. Eigener kleiner PR.
   - **Software-Factory-Pilot** (aus dem Ecosystem, ADR 0027 dort): Plan `~/claude-ecosystem/docs/plaene/2026-11-23-software-factory.md`,
     mit dem Versuch im Kopf beginnen. Koordinator ist eine Session in diesem Ordner, höchstens 2 Orca-Worker, Merge nur durch dich.
   - Kleine offene Funde: `@types/jsdom` noch auf 30 (es gibt keine 31), jsdom unter `devDependencies`, obwohl der Container es zur Laufzeit
     braucht; aus dem Review von PR #95 Reiternamen können kollidieren, „Alles im Reiter …“ führt nur zu einem Reiter, Abzeichen live und neu
     im selben Reiter.
   - Grenzen und Nutzungsbedingungen von Jolpica nachlesen (Annahme 4/s, 500/Std.), z. B. mit dem Agent `quellen-leser`.
2. **`docs/Tools für später.md` prüfen:** Dort ist für den Start von Phase 4 die **lokale Supabase über Docker** vorgemerkt, sobald die
   Schritte eigene Tabellen brauchen. Daran erinnern.
3. Phase 4 mit `/grill-with-docs` klären (Kurzbefehl, eigener geheimer Schlüssel für den Eingang laut Prinzip 2, Tabelle, Tagesziel), dann
   Mock und Plan.

Anstehende Entscheidungen: keine offenen „ungefragt“. Parkplätze mit Termin:

- **NFL-Playoffs** (Projektvision, Offene Fragen): Anfang Januar 2027 aufgreifen, vor dem Ende der Regular Season.

Bekannte offene Punkte, ohne Eile:

- Wackelige Tests: Beim ersten Lauf von `checks.sh` am 2026-11-19 waren 2 Tests rot (einer zu `leseArtikel`), danach grün. Mit
  `fehler-diagnose` eingrenzen.
- Beobachten, ob die KI-News-Kachel mit 14 Absendern unter 8 Sekunden bleibt.
- Hausfarben und Zonenfarben sind nicht mit den offiziellen Farben abgeglichen.
- Fund 6 aus dem Review von PR #81 (Tag je Partie beim Sortieren nur einmal berechnen) bewusst nicht behoben.
- Fehlversuche bei Spielberichten begrenzen: geparkt (Journal vom 2026-11-27).

## Passende Skills

- `grill-with-docs`: Phase 4 klären, bevor ein Plan entsteht
- `plan-schreiben`: Plan der Schritte nach Mock und Befragung
- `assistent-bauen`: geheimen Schlüssel für den Eingang des Kurzbefehls in `.env` und bei Vercel eintragen
