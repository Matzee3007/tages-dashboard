---
titel: "ADR 0012: Spieltage ohne Pause nach der Nummer im Spielplan trennen"
status: akzeptiert
erstellt: 2026-11-16
tags: [adr, architektur, sport, spieltag]
---

# ADR (Architecture Decision Record) 0012: Spieltage ohne Pause nach der Nummer im Spielplan trennen

## Kontext

Die Regel „Wechsel des Spieltags“ in der [[projects/tages-dashboard/docs/Projektvision|Projektvision]] (Befragung vom 2026-11-08)
bildet einen Spieltag aus aufeinanderfolgenden Tagen mit Spielen. Er bleibt bis Mitternacht des Tages nach seinem letzten Spiel
stehen. In der Bundesliga reicht das, weil zwischen zwei Spieltagen immer ein Tag ohne Spiel liegt. Die Premier League spielt aber
auch Samstag bis Montag und gleich am Dienstag wieder. Dann wurden zwei Spieltage zu einem Block (Fund 2 aus PR #73).

Die Nummer des Spieltags steht im Spielplan (OpenLigaDB, football-data.org, ADR 0009 und 0011). Er gilt für die ganze Saison, wurde
bisher aber erst nach der Wahl der Tage geladen. Die Karte des Spielplans merkt sich je Tag nur die höchste Nummer.

## Entscheidung

- **Getrennt wird, wo die Nummer steigt:** Ein Tag beginnt einen neuen Spieltag, wenn seine Nummer höher ist als die höchste
  bekannte Nummer des laufenden Blocks. Ein Nachholspiel (kleinere Nummer) und ein Tag ohne Nummer bleiben im Block.
- **Der neue Spieltag gilt ab 0 Uhr seines ersten Tages:** Ein Spieltag bleibt bis Mitternacht nach seinem letzten Spiel stehen,
  höchstens bis der nächste beginnt.
- **Der Spielplan wird vor der Wahl geladen**, die Tabelle gleichzeitig dazu. Ohne Spielplan trennt nur eine Lücke, wie bisher.

## Alternativen

- **Nur bei einer Lücke trennen (bisher):** Ein Block mit vier Tagen und zwei Spieltagen, der Titel nennt nur den höheren.
- **Bei jedem Wechsel der Nummer trennen:** Auch ein Nachholspiel am Montag nach einem Spieltag würde ein eigener Block, die
  Ergebnisse vom Sonntag verschwänden schon am Montag um 0 Uhr.
- **Alter Spieltag bis Mitternacht des Folgetags, auch wenn der neue dann beginnt:** Am Dienstag sähe man den 12. Spieltag, während
  der 13. live läuft.
- **Je Tag alle Nummern statt nur der höchsten merken:** Würde Tage mit Partien aus zwei Spieltagen richtig zuordnen, ändert aber
  beide Leser des Spielplans und `spieltagTitel`. Zurückgestellt, bis der Fall wirklich auftritt.

## Konsequenzen

- Die Wahl des Spieltags hängt jetzt vom Spielplan ab. Fällt er aus (z. B. 429 von football-data.org), verschmelzen Spieltage ohne
  Pause, bis er wieder kommt. Grenzen in [[projects/tages-dashboard/docs/tools/football-data.org|football-data.org]].
- Ein vorgezogenes Spiel mit höherer Nummer direkt neben einem Spieltag beginnt einen eigenen Block. Selten.
- Bei leerem Zwischenspeicher warten die Tage auf den Spielplan, die Tabelle nicht.
