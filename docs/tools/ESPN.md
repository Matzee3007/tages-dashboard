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

Für die Bundesliga-Kachel (`lib/kacheln/bundesliga/`): Spieltag live, Torschützen, Logos und Tabelle. Gewählt am 2026-11-08, weil
OpenLigaDB Ergebnisse oft erst Stunden später hat. Später vielleicht auch für NFL, Premier League und Champions League (Phase 3,
Schritte 2 und 4).

## Wichtige Begriffe

- **Liga-Kürzel:** `ger.1` ist die Bundesliga, `eng.1` die Premier League, `uefa.champions` die Champions League.
- **`state`:** Zustand einer Partie: `pre` (noch nicht angepfiffen), `in` (läuft), `post` (vorbei). Den Anpfiff meldet ESPN manchmal
  verspätet, deshalb zählt `pre` nach dem Anstoß bei uns schon als laufend.
- **Team-id:** feste Nummer eines Teams, z. B. `132` für den FC Bayern. Damit erkennen wir Mein Team und die deutschen Kurznamen
  (`TEAMNAMEN` in `lib/einstellungen.ts`).

## Abrufe

| Abruf | Adresse | Speicher |
|---|---|---|
| Kalender (alle Tage mit Spielen) | `https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard`, Feld `leagues[0].calendar` | 24 Std. |
| Partien eines Tages | `…/ger.1/scoreboard?dates=20261108` | 15 Min., bei laufender Partie 1 Min. |
| Tabelle | `https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings` | 15 Min., bei laufender Partie 1 Min. |

Alle mit `User-Agent: Tages-Dashboard`, 5 Sekunden Zeitlimit und dem Etikett `bundesliga` für den Knopf ↻ (ADR 0008).

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
