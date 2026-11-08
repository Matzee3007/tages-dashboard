---
titel: "ADR 0009: Bundesliga von ESPN statt OpenLigaDB"
status: akzeptiert
erstellt: 2026-11-08
tags: [adr, architektur, sport, bundesliga, espn]
---

# ADR (Architecture Decision Record) 0009: Bundesliga von ESPN statt OpenLigaDB

## Kontext

Laut [[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]] und Projektvision sollte die Bundesliga von OpenLigaDB kommen. Der Entwickler
schaut auch während eines Spiels drauf, die Spieldaten sollen deshalb möglichst live sein (Befragung vom 2026-11-08).

Messung am 2026-11-08: Köln gegen Leverkusen (Anstoß 15:30 Uhr) hatte bei OpenLigaDB um 18:44 Uhr noch kein Ergebnis und keine Tore, letzte
Änderung 11:52 Uhr. Die Ergebnisse tragen dort Freiwillige ein. ESPN zeigte zur selben Zeit 1:2 mit Torschützen und das laufende Spiel
Freiburg gegen Union mit Minute 56.

## Entscheidung

- **Spieltag, Torschützen, Logos und Tabelle der Bundesliga kommen von ESPN** (`site.api.espn.com`, Liga `ger.1`, inoffiziell, ohne
  Schlüssel), mit den Kurznamen von ESPN.
- **Ein Spieltag wird aus Tagen zusammengesetzt:** Die Anzeigetafel (`scoreboard`) liefert nur einzelne Tage, ein Datumsbereich ergibt
  Fehler 400. Ihr Kalender nennt alle Tage mit Spielen.
- **OpenLigaDB bleibt der Ausweg,** falls ESPN wegbricht.

## Alternativen

- **OpenLigaDB:** offiziell gratis, deutsche Namen, Spieltag als eigene Runde, aber Ergebnisse oft Stunden später.
- **OpenLigaDB und ESPN zusammen:** Spieltag und Tabelle von OpenLigaDB, Live-Stand von ESPN. Zwei Quellen mit verschiedenen Namen und ids,
  doppelt so viele Fehlerfälle.
- **football-data.org:** im Gratis-Tarif verzögert, mit Schlüssel und 10 Abrufen pro Minute.
- **API-Football:** live und offiziell, laut eigener Kenntnis im Gratis-Tarif aber nur 100 Abrufe am Tag (nicht nachgeprüft). Das reicht bei
  einem Abruf pro Minute nicht für ein Spiel.

## Konsequenzen

- ESPN dokumentiert die Schnittstelle nicht. Sie kann sich ohne Ankündigung ändern, dann fällt die Kachel aus.
- Ob ESPN vom Server bei Vercel aus antwortet, ist noch offen (vom Mac aus am 2026-11-08: Status 200). Das prüft Schritt 1 als Erstes.
- In Schritt 2 wird geprüft, ob ESPN auch Premier League und Champions League live liefert. Dann könnte football-data.org entfallen.
- ESPN kennt keine Nummer des Spieltags. Die Kachel nennt deshalb die Tage statt „9. Spieltag“ (Befragung, Runde 3).
