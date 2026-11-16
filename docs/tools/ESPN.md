---
titel: ESPN
status: aktiv
erstellt: 2026-11-09
tags: [tools, api, sport, bundesliga, espn]
---

# ESPN

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan: Bundesliga-Kachel]], Entscheidung:
[[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]].

## Was ist das?

Die Schnittstelle hinter den Seiten von ESPN, einem US-Sportsender. Sie liefert Spielstände, Torschützen, Logos und Tabellen als JSON, ohne
Schlüssel. **Inoffiziell:** ESPN dokumentiert sie nicht, sie kann sich ohne Ankündigung ändern.

## Wofür nutzen wir es?

Für die Fußball-Kacheln (`lib/kacheln/fussball/`): Spieltag live, Torschützen und Logos, bei der Bundesliga auch die Tabelle. Gewählt
am 2026-11-08, weil OpenLigaDB Ergebnisse oft erst Stunden später hat. Seit 2026-11-16 auch für die Premier League (`eng.1`), deren
Tabelle von [[projects/tages-dashboard/docs/tools/football-data.org|football-data.org]] kommt (ADR 0011). Später auch für die Champions
League und die NFL (Phase 3, Schritte 2 und 4).

## Wichtige Begriffe

- **Liga-Kürzel:** `ger.1` ist die Bundesliga, `eng.1` die Premier League, `uefa.champions` die Champions League.
- **`state`:** Zustand einer Partie: `pre` (noch nicht angepfiffen), `in` (läuft), `post` (vorbei). Den Anpfiff meldet ESPN manchmal
  verspätet, deshalb zählt `pre` nach dem Anstoß bei uns schon als laufend. Verlegte oder abgesagte Partien erkennt die Kachel am
  Statusnamen (`status.type.name`): `STATUS_POSTPONED`, `STATUS_CANCELED`.
- **Team-id:** feste Nummer eines Teams, z. B. `132` für den FC Bayern. Damit erkennen wir Mein Team und die deutschen Kurznamen
  (`TEAMS_BUNDESLIGA` und `TEAMS_PREMIER_LEAGUE` in `lib/einstellungen.ts`).

## Abrufe

| Abruf | Adresse | Speicher |
|---|---|---|
| Kalender (alle Tage mit Spielen) | `https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard`, Feld `leagues[0].calendar` | 24 Std. |
| Partien eines Tages | `…/ger.1/scoreboard?dates=20261108` | 15 Min., bei laufender Partie frisch (`cache: "no-store"`) |
| Tabelle (nur Bundesliga) | `https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings` | 15 Min., bei laufender Partie frisch (`cache: "no-store"`) |

Für die Premier League dieselben Adressen mit `eng.1`. Alle mit `User-Agent: Tages-Dashboard`, 5 Sekunden Zeitlimit und der id der
Kachel als Etikett für den Knopf ↻ (`bundesliga`, `premier-league`, ADR 0008). Eine gespeicherte
Antwort darf höchstens doppelt so alt sein wie ihre Speicherzeit, mindestens 1 Stunde, sonst gilt sie als Ausfall (wie ADR 0005).

Zum Ausprobieren im Terminal:

```bash
/usr/bin/curl -s --compressed 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard?dates=20261108' | head -c 500
```

## Fehler

- **`{"code":400,"message":"Failed to get events endpoint."}`:** Ursache: ein Datumsbereich wie `dates=20261106-20261108`. Bei Fußball geht
  nur ein einzelner Tag. Lösung: ein Abruf pro Tag des Spieltags.
- **`'utf-8' codec can't decode byte 0x8b`** beim Lesen mit Python: Ursache: ESPN schickt die Antwort mit gzip gepackt. Lösung: `curl`
  mit `--compressed`.

## Stand

- 2026-11-08: Vom Mac aus Status 200. Am 2026-10-24 kam bei der NFL noch 403.
- 2026-11-09: Vom Server bei Vercel aus Status 200 in rund 60–70 ms (Versuch im Plan).
