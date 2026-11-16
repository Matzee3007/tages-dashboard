---
titel: "ADR 0011: Premier League und Champions League von ESPN und football-data.org"
status: akzeptiert
erstellt: 2026-11-15
tags: [adr, architektur, sport, premier-league, champions-league, espn, football-data]
---

# ADR (Architecture Decision Record) 0011: Premier League und Champions League von ESPN und football-data.org

## Kontext

Laut [[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]] und Projektvision sollten Premier League und Champions League von
football-data.org kommen. Seit [[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]] kommt die Bundesliga live von ESPN,
die Nummer des Spieltags aus dem Spielplan von OpenLigaDB.

Geprüft am 2026-11-15:

- ESPN liefert `eng.1` (5 Spiele am 8. November, Status `STATUS_FULL_TIME`) und `uefa.champions` (9 Spiele am 4. November). Ein Spieltag der
  Champions League verteilt sich auf zwei Abende mit zusammen 18 Partien, der Kalender von ESPN ist dort anders aufgebaut als in der Liga.
- football-data.org führt Premier League und Champions League im Gratis-Tarif (`TIER_ONE`) und nennt den aktuellen Spieltag direkt
  (`currentMatchday`). Spielstände sind im Gratis-Tarif verzögert, es gibt einen API-Schlüssel und 10 Abrufe pro Minute.
- OpenLigaDB hat den Spielplan beider Wettbewerbe (`pl` mit 380, `ucl` mit 144 Spielen der Saison 2026/27), eine Nummer des Spieltags
  käme also auch von dort wie in der Bundesliga.

## Entscheidung

- **Partien, Live-Stand, Minute und Torschützen kommen von ESPN** (`eng.1`, `uefa.champions`), wie in der Bundesliga.
- **Nummer des Spieltags und Tabelle kommen von football-data.org** (Wettbewerbe `PL` und `CL`), mit dem Schlüssel nur auf dem Server.
- **Teams werden über eine Liste im Code zusammengeführt:** je Wettbewerb id bei ESPN, id bei football-data.org und deutscher Kurzname.
  Fehlt ein Eintrag, steht der Name von ESPN da.
- **Fällt football-data.org aus,** zeigt die Kachel die Partien weiter, den Spieltag ohne Nummer und statt der Tabelle „Tabelle gerade nicht
  erreichbar“.
- **Die Bundesliga bleibt** bei ESPN mit OpenLigaDB (ADR 0009).

## Alternativen

- **A: ESPN mit Nummer des Spieltags von OpenLigaDB, wie die Bundesliga:** fast derselbe Code, ohne Schlüssel und Grenze, Tabelle von
  ESPN. Aber ESPN ist inoffiziell: Bricht es, fallen alle Fußball-Kacheln samt Tabelle gleichzeitig aus, und man lernt keine Schnittstelle
  mit Schlüssel und Grenzen.
- **B: Alles von football-data.org, wie ursprünglich geplant:** offiziell und dokumentiert, ein Ausfall von ESPN träfe nur die Bundesliga.
  Im Gratis-Tarif aber verzögert, und der Entwickler will die Spielstände live sehen (wie in ADR 0009 begründet).
- **C (gewählt): ESPN live, football-data.org für Spieltag und Tabelle.** Live wie die Bundesliga, dazu eine offizielle Tabelle und
  Spieltagsnummer, und eine zweite Art von Schnittstelle zum Lernen (Schlüssel, Grenzen).

## Konsequenzen

- **Zwei Quellen je Kachel:** ADR 0009 hat genau das für die Bundesliga verworfen (doppelt so viele Fehlerfälle, verschiedene Namen und
  ids). Hier wird es bewusst in Kauf genommen. Die Liste zum Zusammenführen muss zu jeder Saison gepflegt werden (Auf- und Absteiger,
  Teilnehmer der Champions League).
- **Tabelle verzögert:** Ein Tor steht live im Spielstand, in der Tabelle erst, wenn football-data.org nachzieht.
- **Neues Geheimnis:** Der API-Schlüssel von football-data.org gehört in `.env.local` und zu Vercel, nie in den Browser.
- **Grenze von 10 Abrufen pro Minute:** Tabelle und Spieltag ändern sich selten. Der Zwischenspeicher wird im Plan so gewählt, dass beide
  Kacheln zusammen weit darunter bleiben.
- **Ausfall von ESPN** trifft weiter alle Fußball-Kacheln. Dann bliebe nur die Tabelle von football-data.org.

## Nachtrag 2026-11-16: Name eines Teams ohne Eintrag in der Tabelle

Fehlt ein Team in der Liste, steht in den Partien der Name von ESPN. Die Tabelle von football-data.org kennt keinen Namen von ESPN, dort
steht der `shortName` von football-data.org, die Zeile bekommt die id `fd-<id>` und wird nicht als Mein Team erkannt. Der Fehler steht im
Server-Log (`Team <id> fehlt in der Liste`). Die Listen heißen `TEAMS_BUNDESLIGA`, `TEAMS_PREMIER_LEAGUE` und `TEAMS_CHAMPIONS_LEAGUE` (`lib/einstellungen.ts`).
Vom `plan-pruefer` gemeldet, vom Entwickler bestätigt.

## Nachtrag 2026-11-16: Tage der Champions League aus dem Spielplan

ESPN liefert für `uefa.champions` im Kalender nur Phasen („League Phase“ 2026-08-27 bis 2027-02-15) statt Tagen, Zeiträume
(`?dates=20261101-20261130`) beantwortet ESPN mit Status 400 (Versuch vom 2026-11-16). Die Tage der Champions League kommen deshalb aus dem
Spielplan von football-data.org (`CL/matches`, Einstellung `kalender: { art: "spielplan" }`), die Ligen behalten den Kalender von ESPN.
Fällt football-data.org aus oder ist sein Spielplan leer, nimmt die Kachel die Tage aus dem Standardabruf von ESPN ohne Datum und zeigt
sie ohne Nummer. Der liefert nur **einen Tag** (den aktuellen oder nächsten mit Spielen), bei einem Spieltag an zwei Abenden also 9 statt
18 Partien. Vom Entwickler am 2026-11-16 so akzeptiert. So gilt weiter: Partien laufen, auch wenn football-data.org ausfällt.

Verworfen: **nur Spielplan** (bei Ausfall zeigte die Kachel ihren Fehlerzustand, gegen diese ADR) und **ESPN Tag für Tag** um heute herum
(rund 14 Abrufe je Laden, die meisten leer). Im Gespräch vom 2026-11-16 vom Entwickler entschieden, Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-16-champions-league|Champions League]].
