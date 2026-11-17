---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-17
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-17 (abends). Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Champions League und Aussehen|Lernjournal Phase 3 - Champions League und Aussehen]]
(zweite Hälfte: Spielberichte).

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #86, Journal und Übergabe)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Supabase:** gehostet, kein lokaler Container (so gewollt). Neue Tabelle `spielberichte` mit RLS.
- **Container `zusammenfassen`:** läuft mit `ai/gemma4:e4b`, alle 15 Minuten KI-News und Spielberichte (ADR 0013)
- **Phase 3, Schritt 3 (Spielberichte):** gebaut und gemergt (PR #85), Abnahme offen, siehe unten

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Wartet auf dich

- [ ] **Abnahme Spielberichte, Freitag 2026-11-20** nach Abpfiff der ersten Bundesliga-Partie (Anstoß 20:30) (blockiert: Schritt 3 als
      erledigt markieren)
  - Ort: Dashboard in Production auf Mac und iPhone, etwa 20 Minuten nach Abpfiff. Vorher prüfen, ob der Mac wach ist und Docker läuft.
  - Erwartet: Unter der beendeten Partie steht mittig der Knopf „Bericht“, er klappt einen Kasten mit „KI-generiert“ und 4 bis 6
    deutschen Sätzen auf. Ergebnis und ob der Text zum Spiel passt, im
    [[projects/tages-dashboard/docs/plaene/2026-11-17-spielberichte|Plan der Spielberichte]] bei Aufgabe 8, Schritt 2 eintragen.
  - Im Log nachsehen: `docker compose logs --since 30m zusammenfassen`, erwartet `Spielberichte: neu 1, ohne 0`.
- [ ] **Live-Test Bundesliga, Freitag 2026-11-20 ab 20:30** und **Premier League am Samstag** (blockiert: nichts)
  - Ort: Dashboard in Production, während eine Partie läuft.
  - Erwartet: Minute mit orangem Punkt im Feld, Spielstand und Torschützen unter dem richtigen Team innerhalb von rund 2 Minuten nach
    einem Tor. Ergebnis im [[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan der Bundesliga]] bei Aufgabe 5, Schritt 3
    nachtragen.
- [ ] **Live-Test Champions League, Dienstag 2026-11-24 abends** (blockiert: nichts)
  - Ort: Dashboard in Production, ab 18:45.
  - Erwartet: alle Partien des Abends unter „Dienstag, 24. November“, live mit Minute; Ergebnis im
    [[projects/tages-dashboard/docs/plaene/2026-11-16-champions-league|Plan der Champions League]] bei Aufgabe 4, Schritt 3 nachtragen.
- [ ] **Dashboard auf jedem Gerät einmal neu laden** (blockiert: nichts). Seit PR #81 und PR #85 hat sich die Antwort der Kacheln
      geändert, eine vorher geöffnete Seite kann beim nächsten Minutentakt abstürzen.
  - Mac im Browser: `Cmd + R`. iPhone und iPad: die PWA im App-Umschalter schließen und neu öffnen.
  - Erwartet: Karten mit den Marken BL, PL, CL, KI-News in 3 Spalten auf dem Mac.
- [ ] **Mac-App neu bauen**, damit sie beim Start den Grundton `#0F1318` zeigt (blockiert: nichts)
  - Befehl im eigenen Terminal: `npm run tauri -- build`
  - Erwartet: Beim Öffnen der App blitzt kein anderer Farbton mehr auf.

## Womit es weitergeht

**Phase 3, Schritt 3 (Spielberichte)** ist gebaut, erledigt ist er erst nach der Abnahme am Freitag. Dann in der Projektvision als
erledigt markieren und den Plan auf `status: abgeschlossen` setzen.

Anstehende Entscheidungen, am Anfang der Session:

1. **Drei ungefragte Entscheidungen aus dem Journal bestätigen oder umdrehen:** Wechsel fehlen in den `keyEvents`, die Zeile `Tore:` nennt
   je Tor das Team, Fund 5 des `plan-pruefer` (Test für die Reihenfolge in `zusammenfassen/lauf.ts`) nicht umgesetzt.
2. **Fehlversuche begrenzen?** (Fund 3 aus dem Review von PR #85): Ein Bericht, der immer durchfällt, wird alle 15 Minuten neu versucht und
   kostet jedes Mal rund 1 Minute Rechenzeit, bis der Spieltag vorbei ist. Nach der Abnahme mit echten Zahlen aus dem Log entscheiden:
   jetzt bauen, parken oder streichen.

Danach:

1. **MIT-Lizenz** (aus dem Ecosystem, 2026-11-17): `LICENSE` mit MIT-Lizenz im Wurzelordner, Rechteinhaber `Matzee3007` (kein Klarname),
   in der README ein kurzer Abschnitt „Lizenz“. Eigener kleiner PR.
2. **Phase 3, Schritt 4: Formel 1** (Jolpica, OpenF1): Rennwochenende und WM-Wertung im Kartensystem von Aussehen G. Erst Mock mit
   `mock-bauer`, dann Plan.

Bekannte offene Punkte, ohne Eile:

- Hausfarben und Zonenfarben sind nicht mit den offiziellen Farben abgeglichen (Plan Aussehen G, „Aufgetaucht“).
- Fund 6 aus dem Review von PR #81 (Tag je Partie beim Sortieren nur einmal berechnen) bewusst nicht behoben.
- Zusammenfassungen dauern mit `gemma4:e4b` etwa dreimal so lang wie vorher (ADR 0013), im Log beobachten.

## Passende Skills

- `plan-schreiben`: für den Plan der Formel 1 nach dem Mock
- `tdd`: beim Bauen
- `fehler-diagnose`: falls am Freitag kein Bericht erscheint
