---
titel: "ADR 0013: Spielberichte vom Mac mit lokalem Modell"
status: akzeptiert
erstellt: 2026-11-17
tags: [adr, architektur, sport, sprachmodell, docker, supabase]
---

# ADR (Architecture Decision Record) 0013: Spielberichte vom Mac mit lokalem Modell

## Kontext

Wunsch des Entwicklers vom 2026-11-15: Jede beendete Partie der Fußball-Kacheln bekommt einen deutschen Spielbericht. ESPN liefert keinen
Bericht, aber unter `summary?event=…` den englischen Liveticker (`commentary`) und die wichtigen Ereignisse (`keyEvents`). Gemessen am
2026-11-17 an Köln gegen Leverkusen (1:2): 108 Einträge im Liveticker mit zusammen rund 8.700 Zeichen, nach Schätzung rund 2.500 Token,
also deutlich unter dem Kontextfenster von 8.192 Token.

Für die Zusammenfassungen der KI-News steht schon ein Weg: Ein Container auf dem Mac ruft ein lokales Modell über Docker Model Runner auf
und legt das Ergebnis in Supabase ab, Vercel liest nur
([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]).

## Entscheidung

- **Der Mac erzeugt die Spielberichte**, im selben Container `zusammenfassen` und mit demselben Modell wie die Zusammenfassungen. Vercel ruft
  nie ein Modell auf. „Erst gratis“ bleibt.
- **Form:** ein Absatz mit 4 bis 6 Sätzen, sachlich und auf Deutsch. Er beschreibt den Verlauf, die Tore mit Schütze und Minute,
  Wendepunkte wie Platzverweis oder Elfmeter und das Ergebnis. Keine Wertungen, nichts, was nicht im Liveticker steht.
- **Welche Partien:** alle beendeten Partien, die die Fußball-Kacheln gerade zeigen (aktueller Spieltag). Ein Mac, der aus war, holt nach,
  solange der Spieltag aktuell ist, ältere Spieltage nicht.
- **Takt:** ein Durchlauf alle 15 Minuten für KI-News und Spielberichte zusammen (vorher stündlich, ADR 0010). Bearbeitet wird nur, was
  noch fehlt.
- **Prüfung jedes Berichts:** Länge (4 bis 6 Sätze), Sprache (Deutsch), der Endstand stimmt im Text, jeder genannte Spieler kommt im
  Liveticker vor. Fällt ein Bericht durch, wird er verworfen.
- **Evaluation vor dem Betrieb:** Testsatz aus 10 echten Partien, auch schwierigen (0:0, Elfmeter, Eigentor, Platzverweis, viele Tore,
  Champions League), mit dem Modell im Betrieb (`ai/qwen3:4b-instruct-2507`). Ob der Verlauf stimmt, urteilt der Entwickler. Ein zweites
  Modell kommt nur dazu, wenn dieses durchfällt.
- **Speicher:** eine neue Tabelle in Supabase, eine Zeile pro Partie mit ESPN-Nummer der Partie, Wettbewerb, Bericht, Modellname und
  Zeitpunkt, ohne Liveticker. RLS wie bei den Zusammenfassungen (Lesen und Schreiben nur für Angemeldete). Alte Berichte bleiben stehen.
- **In der Kachel** ist der Bericht als KI-generiert gekennzeichnet. **Fehlt er** (Mac aus, durchgefallen, kein Liveticker), erscheint
  die Partie wie bisher, ohne Hinweis.

## Alternativen

- **Gehostetes Modell (Anthropic) auf dem Server bei Vercel, kurz nach Abpfiff:** Der Bericht wäre immer und Minuten nach Abpfiff da,
  auch unterwegs auf dem iPhone, und das stärkere Modell irrt sich seltener bei Fakten und Deutsch. Abgelehnt, weil es nach Verbrauch
  kostet („Erst gratis“), einen API-Schlüssel und einen Zeitplan auf dem Server bräuchte und es dann zwei Wege für KI-Texte gäbe. Der
  Bericht ist zum Nachlesen gedacht, Eile ist nicht nötig.
- **Nur Partien von Mein Team:** 2 bis 4 Berichte pro Woche statt rund 37. Abgelehnt, weil die Kachel alle Partien zeigt. Bleibt der
  Ausweg, falls das Modell zu langsam ist (Einstellung im Code).
- **Stündlicher Takt wie bisher:** Ein Bericht käme bis zu 60 Minuten nach Abpfiff.

## Konsequenzen

- **Ist der Mac aus,** fehlen die Berichte, bis er wieder läuft, und für vergangene Spieltage ganz.
- **Kleines Modell, fremde Sprache:** Aus englischem Liveticker entsteht deutscher Text, das Modell kann Namen oder Minuten verdrehen. Die
  automatische Prüfung fängt falsche Endstände und erfundene Spieler ab, einen falschen Verlauf nur die Evaluation.
- **Ein Abruf mehr bei ESPN** pro beendeter Partie, vom Mac aus. Die Schnittstelle ist inoffiziell
  ([[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]).
- **Fremde Inhalte:** Auch der Liveticker ist fremder Text. Die Antwort wird wie bei den Zusammenfassungen gegen ein festes Format
  geprüft und nie als HTML angezeigt.
- **Takt von 15 Minuten** gilt auch für die KI-News. Die Feeds werden vom Mac aus viermal so oft abgerufen wie vorher.
