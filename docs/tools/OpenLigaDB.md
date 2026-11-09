---
titel: OpenLigaDB
status: aktiv
erstellt: 2026-11-09
tags: [tools, api, sport, bundesliga]
---

# OpenLigaDB

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Entscheidung:
[[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]].

## Was ist das?

Eine freie Datenbank für Fußball-Ergebnisse, die Freiwillige pflegen. Die Schnittstelle ist offiziell, gratis und ohne Schlüssel.

## Wofür nutzen wir es?

Nur für die **Nummer des Spieltags** der Bundesliga (`lib/kacheln/bundesliga/spielplan.ts`). Partien, Tore und Tabelle kommen von ESPN, weil
OpenLigaDB Ergebnisse oft erst Stunden später einträgt (2026-11-08: Köln–Leverkusen um 18:44 Uhr noch ohne Ergebnis).

## Abruf

| Abruf | Adresse | Speicher |
|---|---|---|
| Spielplan der Saison | `https://api.openligadb.de/getmatchdata/bl1/2026` (Saison 2026/27) | 24 Std., ohne Etikett: ↻ lädt ihn nicht neu |

Gelesen werden `matchDateTime` (deutsche Zeit, ohne Zone) und `group.groupOrderID` (Nummer des Spieltags). Ein verlegtes Spiel behält die
Nummer seines alten Spieltags, daran erkennt die Kachel ein Nachholspiel.

Fällt OpenLigaDB aus, zeigt die Kachel nur die Tage, ohne Nummer. Der Fehler steht im Server-Log
(`Spielplan von OpenLigaDB ließ sich nicht laden`).

## Stand

- 2026-11-09: Vom Server bei Vercel aus Status 200 in 621 ms, 356 KB.
