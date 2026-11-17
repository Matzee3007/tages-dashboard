---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-17
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-17. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Champions League und Aussehen|Lernjournal Phase 3 - Champions League und Aussehen]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #83, Journal und Übergabe)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Supabase:** gehostet, kein lokaler Container (so gewollt)
- **Container `zusammenfassen`:** läuft (`docker compose ps`: Up)
- **Phase 3, Schritt 2:** erledigt. Champions League live (PR #79), Aussehen G live (PR #81,
  [[projects/tages-dashboard/docs/plaene/2026-11-17-aussehen-g|Plan]])

## Vor dem Start

1. Claude Code im Projektordner starten:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Wartet auf dich

- [ ] **Dashboard auf jedem Gerät einmal neu laden** (blockiert: nichts). Die Tabelle schickt seit PR #81 `zonen` statt `linien`, eine
  vorher geöffnete Seite stürzt sonst beim nächsten Minutentakt ab.
  - Mac im Browser: `Cmd + R`. iPhone und iPad: die PWA im App-Umschalter schließen und neu öffnen.
  - Erwartet: Karten mit den Marken BL, PL, CL; auf dem Mac stehen die KI-News in 3 Spalten, oben links die große Karte.
- [ ] **Live-Test Bundesliga, Freitag 2026-11-20 ab 20:30** und **Premier League am Samstag** (blockiert: nichts)
  - Ort: Dashboard in Production, während eine Partie läuft.
  - Erwartet: Minute mit orangem Punkt im Feld, Spielstand und Torschützen unter dem richtigen Team innerhalb von rund 2 Minuten nach
    einem Tor. Bei der Premier League zieht die Tabelle von football-data.org verzögert nach. Ergebnis im
    [[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan der Bundesliga]] bei Aufgabe 5, Schritt 3 nachtragen.
- [ ] **Live-Test Champions League, Dienstag 2026-11-24 abends** (blockiert: nichts)
  - Ort: Dashboard in Production, ab 18:45.
  - Erwartet: alle Partien des Abends unter „Dienstag, 24. November“, live mit Minute; Ergebnis im
    [[projects/tages-dashboard/docs/plaene/2026-11-16-champions-league|Plan der Champions League]] bei Aufgabe 4, Schritt 3 nachtragen.
- [ ] **Mac-App neu bauen**, damit sie beim Start den neuen Grundton `#0F1318` zeigt (blockiert: nichts)
  - Befehl im eigenen Terminal: `npm run tauri -- build`
  - Erwartet: Beim Öffnen der App blitzt kein anderer Farbton mehr auf.

## Womit es weitergeht

**Phase 3, Schritt 2 ist fertig.** Bevor Schritt 3 (Formel 1) beginnt:

1. **Fälliger Parkplatz besprechen:** „Lokale KI für die Fußball-Kacheln“ (z. B. deutscher Spielbericht nach Abpfiff aus dem Liveticker
   von ESPN, Projektvision). Mit dem Entwickler klären: jetzt angehen, verschieben oder streichen.
2. **MIT-Lizenz** (aus dem Ecosystem, 2026-11-17): Das Repo ist seit 2026-11-16 öffentlich (siehe [[docs/GitHub-Profil|GitHub-Profil]]).
   `LICENSE` mit MIT-Lizenz im Wurzelordner, Rechteinhaber `Matzee3007` (kein Klarname), dazu in der README ein kurzer Abschnitt
   „Lizenz“. Eigener kleiner PR.
3. **Phase 3, Schritt 3: Formel 1** (Jolpica, OpenF1): Rennwochenende und WM-Wertung, im Kartensystem von Aussehen G. Erst Mock mit
   `mock-bauer`, dann Plan.

Bekannte offene Punkte, ohne Eile:

- Hausfarben und Zonenfarben sind nicht mit den offiziellen Farben abgeglichen (Plan Aussehen G, „Aufgetaucht“).
- Fund 6 aus dem Review von PR #81 (Tag je Partie beim Sortieren nur einmal berechnen) bewusst nicht behoben.

## Passende Skills

- `grill-with-docs`: um den Parkplatz „Lokale KI“ und den Umfang der Formel 1 zu klären
- `plan-schreiben`: für den Plan der Formel 1 nach dem Mock
- `tdd`: beim Bauen
