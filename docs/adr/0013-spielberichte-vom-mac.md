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

## Nachtrag 2026-11-17: Evaluation mit qwen3:4b durchgefallen

Erster Lauf mit dem ganzen Liveticker (`commentary`, rund 8.700 Zeichen) und einem Feld `spieler`: 0 von 10 Berichten bestanden die
Prüfung, zwei Anfragen brauchten über 120 Sekunden. `qwen3:4b` füllte `spieler` mit allen Namen der Partie, schrieb 2 bis 11 Sätze statt 4
bis 6, reihte meist nur Tore aneinander und verdrehte Fakten (Spieler beim falschen Team, „Ausgleichstor“ zum 1:2).

Entscheidung des Entwicklers (Option A von vier: A größeres lokales Modell und weniger Eingabe, B nur weniger Eingabe, C gehostetes Modell,
D parken):

- **Eingabe:** nur die wichtigen Einträge des Livetickers (`keyEvents`: Tore, Karten, Halbzeit, Ende), ohne Wechsel, rund 1.900 statt 8.700
  Zeichen.
- **Prüfung:** Das Feld `spieler` und die Prüfung „jeder genannte Spieler steht im Liveticker“ entfallen. Geprüft werden Länge, Sprache,
  Endstand und dass jeder Torschütze genannt wird. Erfundene Spieler zeigt nur die Evaluation.
- **Modell:** Evaluation mit `ai/gemma4:e4b` (schon geladen, 6 GB). Offen, falls es besteht: Auf 16 GB passt nur ein Modell gleichzeitig.
  Ob dann beide Texte mit `gemma4:e4b` entstehen oder die Modelle wechseln, wird nach dem Lauf entschieden.
- **Fällt auch dieser Lauf durch,** entscheidet der Entwickler zwischen C (neues ADR gegen „Erst gratis“) und D (parken).

**Ergebnis 2026-11-17:** Mit `ai/gemma4:e4b` und `keyEvents` bestanden 9 von 10 Berichten die Prüfung, alle 10 beurteilte der Entwickler mit
„ja“ (Median 56 s, höchstens 61 s je Bericht). Zwei kleinere Fehler im Verlauf (Zeitpunkt einer Roten Karte, Reihenfolge zweier Ereignisse)
fing die Prüfung nicht ab.

**Entscheidung:** `ai/gemma4:e4b` erzeugt im Container Spielberichte **und** Zusammenfassungen. Alternative: zwei Modelle im Wechsel (qwen3 für
die KI-News, schneller), abgelehnt wegen mehr Code und des bekannten Speicherfehlers bei zwei geladenen Modellen. Folge: Zusammenfassungen
dauern etwa dreimal so lang (Evaluation vom 2026-11-15: Median 46 statt 17 s), bei Qualität wie bisher.
