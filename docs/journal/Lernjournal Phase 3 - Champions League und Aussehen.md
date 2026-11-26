---
titel: Lernjournal Phase 3 - Champions League und Aussehen
status: abgeschlossen
phase: 3
erstellt: 2026-11-17
tags: [lernjournal, phase-3, champions-league, espn, football-data, aussehen, mock-bauer, frontend-design, tailwind, tdd, plan-pruefer, spielberichte, docker-model-runner, gemma4, supabase, grill-with-docs]
---

# Lernjournal Phase 3: Champions League und Aussehen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Premier League|Lernjournal Phase 3 - Premier League]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

Die Session lief vom 2026-11-16 bis in den 2026-11-17.

## Erledigt

- [x] Spieltage ohne Pause trennen, wo die Nummer im Spielplan steigt (Fund 2 aus PR #73), mit TDD, `/code-review`, ADR 0012 (PR #78)
- [x] Kachel Champions League (Ligaphase): Tage aus dem Spielplan von football-data.org, Ersatz über den Standardabruf von ESPN,
  36 Teams, `FdTeam` und getrennte Typen je Tabellenquelle (Fund 9). `/code-review`, Abnahme in der Vorschau (PR #79)
- [x] Neue Zeile in der `CLAUDE.md` des Projekts: vor dem ersten Abruf eines Dienstes seine Notiz in `docs/tools/` lesen (PR #79)
- [x] Drei Runden Mocks mit `mock-bauer`: A–C, dann D–F mit dem Design-Skill `frontend-design`, dann G und H nach den Vorbildern
  FotMob und Apple News
- [x] Aussehen F „Instrument“ gebaut: Linien in den Tabellen, Gruppe Sport, Hausfarben je Kachel und Absender, Schrift Commissioner.
  `plan-pruefer` ERFÜLLT, `/code-review` mit 10 Funden, 8 behoben (PR #80)
- [x] Aussehen G „Spielfeld + Zeitung“ gebaut: Karten, Partien nach Tag symmetrisch um ein Ergebnisfeld, Torschützen unter ihrem Team,
  Zonen mit Legende, KI-News als Karten mit großer Schlagzeile. `plan-pruefer` mit 3 Funden (behoben), `/code-review` mit 8 Funden,
  6 behoben, Abnahme „sieht gut aus“ (PR #81)
- [x] Phase 3, Schritt 2 (Premier League und Champions League) in der Projektvision als erledigt eingetragen
- [ ] Live-Tests: Bundesliga am 2026-11-20, Premier League am Samstag, Champions League am 2026-11-24
- [ ] KI-News in 3 Spalten auf dem Mac noch nicht gesehen (Fund 1 aus dem Review von PR #81 kam nach der Abnahme)

Zweite Session am 2026-11-17 (Nachmittag): Spielberichte.

- [x] Parkplatz „Lokale KI für die Fußball-Kacheln“ mit `/grill-with-docs` geklärt (2 Runden, F1–F10): wird Phase 3, Schritt 3
  „Spielberichte“, Formel 1 rückt auf 4, NFL auf 5. Glossar: Partie, Liveticker, Spielbericht. ADR 0013
- [x] Mock mit 4 Varianten (`assets/mocks/2026-11-17-spielbericht.html`), gewählt Variante A (Knopf „Bericht“)
- [x] `checks.sh` mit allen Prüfungen samt `cargo test`, `CLAUDE.md` umgestellt, `/code-review low` ohne Funde (PR #84)
- [x] Plan `docs/plaene/2026-11-17-spielberichte.md` mit 8 Aufgaben, umgesetzt mit TDD: Liveticker, Prüfung, Modellaufruf, Evaluation,
  Tabelle `spielberichte` mit RLS (per Supabase-CLI angelegt, als Fremder geprüft), Durchlauf alle 15 Minuten, Knopf in der Kachel
- [x] Evaluation: `qwen3:4b` mit ganzem Liveticker 0 von 10, `gemma4:e4b` mit `keyEvents` 9 von 10 automatisch und 10 von 10 im Urteil
- [x] Container auf `gemma4:e4b` umgestellt und neu gebaut, erster Durchlauf ohne Fehler
- [x] Fehler in `zaehleSaetze` behoben (`\b` kannte nur ASCII), gefunden durch einen neuen Test
- [x] `plan-pruefer` (NICHT ERFÜLLT wegen veralteter Doku, behoben), `/code-review medium` mit 10 Funden: 1, 2, 6, 7, 8, 9 behoben,
  5 falsch, 4 und 10 bewusst so, 3 offen (PR #85, gemergt)
- [ ] Knopf und Kasten im Browser ansehen und Abnahme mit dem ersten echten Bericht (Freitag 2026-11-20)

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Produkt | Spieltage trennen, wo die Nummer steigt; neuer Spieltag ab 0 Uhr seines ersten Tages | [[projects/tages-dashboard/docs/adr/0012-spieltage-nach-nummer-trennen\|ADR 0012]] | Entwickler |
| Technik | Tage der Champions League aus dem Spielplan von football-data.org, Ersatz: Standardabruf von ESPN (ein Tag) | Der Kalender von ESPN kennt dort nur Phasen, Zeiträume geben 400 (Nachtrag ADR 0011) | Entwickler |
| Produkt | Kurznamen der Champions-League-Teams von ESPN, eigene nur für deutsche Teams und Arsenal | reicht dem Entwickler | Entwickler |
| Design | Dashboard bleibt immer dunkel | weniger Arbeit, nur ein Farbsatz | Entwickler |
| Design | Hausfarben der Quellen als Akzent; orange Hausfarben (Anthropic, Claude Updates, Hacker News) nur in einer kleinen Marke | Orange gehört allein Mein Team, Live und „neu“ | Entwickler |
| Design | Aussehen G statt F: Karten, Muster von FotMob (Sport) und Apple News (News) | F war „zu leer, zu wenig Struktur, zu unprofessionell“ | Entwickler |
| Bauen | F erst mergen, dann neu gestalten | F war besser als der alte Stand und brachte Linien, Gruppe Sport, Hausfarben | Entwickler |
| Produkt | Torschützen getrennt nach Team, vorher geprüft, ob ESPN das Team liefert | ESPN nennt je Tor `team.id`, beim Eigentor den Gegner des Schützen | Entwickler |
| Produkt | Partien nach deutschem Tag, darin Mein Team zuerst | Mock G gliedert nach Tagen, Mein Team ganz oben hätte doppelte Tageszeilen gegeben | Entwickler |
| Technik | `zonen` ersetzt `linien` in der Einstellungsdatei, Linien ergeben sich aus den Zonengrenzen | eine Angabe statt zwei | Entwickler |
| Design | Farben und Namen der Zonen (z. B. Relegation gelb, Abstieg rot) und die Hausfarben stammen vom Mock-Agent, nicht nachgeschlagen | im Plan als „Aufgetaucht“ genannt, der Entwickler hat den Plan freigegeben | Entwickler |
| Betrieb | Offene Seiten nach dem Deploy einmal neu laden, statt alte Antworten abzufangen | `linien` heißt jetzt `zonen`, ein alter Browser-Stand stürzt sonst ab; einmalig | Entwickler |
| Prüfen | Review PR #81: Fund 6 (schnelleres Sortieren) nicht behoben | bei höchstens 18 Partien kaum messbar | Entwickler |
| Produkt | Spielberichte jetzt angehen, vor der Formel 1, als Phase 3, Schritt 3 | Parkplatz fällig, Technik aus ADR 0010 vorhanden | Entwickler |
| Produkt | Bericht: 4–6 Sätze, Deutsch, alle beendeten Partien des aktuellen Spieltags, ohne Bericht kein Hinweis | [[projects/tages-dashboard/docs/adr/0013-spielberichte-vom-mac\|ADR 0013]] | Entwickler |
| Technik | Bericht entsteht auf dem Mac, nicht über ein gehostetes Modell | ADR 0013 | Entwickler |
| Betrieb | Takt des Containers 15 statt 60 Minuten, auch für die KI-News | ADR 0013 | Entwickler |
| Design | Anzeige Variante A: Knopf „Bericht“ klappt den Text unter der Partie auf | bekanntes Muster der KI-News | Entwickler |
| Technik | Nach der durchgefallenen Evaluation Option A: `gemma4:e4b` und `keyEvents` statt `commentary`, Feld `spieler` gestrichen | ADR 0013, Nachtrag | Entwickler |
| Technik | `keyEvents` ohne Wechsel | Wechsel bringen nur Namen ohne Bedeutung für den Bericht | ungefragt |
| Technik | Zeile `Tore:` nennt je Tor das Team | hilft beim Eigentor | ungefragt |
| Betrieb | `gemma4:e4b` auch für die Zusammenfassungen, kein Wechsel zweier Modelle | nur ein Modell passt in 16 GB, ADR 0013 | Entwickler |
| Prüfen | Urteil der Evaluation „passt so“ als „ja“ für alle 10 eingetragen | Datei blieb leer, Antwort im Gespräch | Entwickler |
| Prüfen | Review PR #85: Funde 1, 2, 6, 7, 8, 9 beheben, Fund 3 (Fehlversuche) offen | Entwickler-Auswahl | Entwickler |
| Prüfen | Fund 5 des `plan-pruefer` (Test für die Reihenfolge in `zusammenfassen/lauf.ts`) nicht umgesetzt | Einstieg im Container, das Log zeigt es | ungefragt |
| Bauen | PR #85 mergen vor der Abnahme am Freitag | ohne Bericht sieht die Kachel aus wie bisher | Entwickler |

## Befehle: ESPN prüfen

```bash
/usr/bin/curl -s --compressed 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard?dates=20261108' -o tag.json
python3 -I - *.json   # Skript sucht Einträge mit ownGoal und gibt team.id aus
```

- `curl --compressed`: holt die Partien eines Tages und packt die gzip-Antwort aus. Ohne `--compressed` kann Python sie nicht lesen
  (Fehler aus der Notiz `docs/tools/ESPN.md`).
- `python3 -I`: liest die gespeicherten JSON-Dateien im isolierten Modus, damit keine fremde Datei im Ordner als Modul geladen wird.

## Befehle: Warten auf CI und Vorschau

```bash
gh pr checks 81                      # Stand der Prüfungen eines PRs
gh pr view 81 --json mergeable       # erst bei MERGEABLE mergen
gh pr merge 81 --merge --delete-branch
```

- `gh pr checks`: zeigt `check` (GitHub Actions) und `Vercel` mit `pass`, `pending` oder `fail`. Direkt nach dem Push meldet es
  „no checks reported“, dann einfach kurz warten.

## Befehle: Evaluation der Spielberichte

```bash
docker compose stop zusammenfassen && docker model unload --all
docker model configure --context-size 8192 ai/gemma4:e4b
npx tsx --tsconfig tsconfig.json evaluation/spielberichte/lauf.ts ai/gemma4:e4b
docker model unload --all && docker compose start zusammenfassen
```

- `docker compose stop` und `docker model unload --all`: Container und Modelle geben den Speicher frei, damit nur ein Modell geladen ist.
- `docker model configure --context-size 8192`: dasselbe Kontextfenster wie im Container.
- `lauf.ts`: schreibt je Partie Antwort, Sekunden und Prüfergebnis nach `evaluation/daten/spielberichte.md`, nach jeder Partie.

## Befehle: Tabelle in Supabase

```bash
supabase login        # nur in der Terminal-App, öffnet den Browser
supabase db query --linked --project-ref imebsydcnchziitgccxs -f supabase/spielberichte.sql
/usr/bin/curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/spielberichte?select=partie"
```

- `supabase db query … -f`: spielt die SQL-Datei über die Management API ein.
- `curl` ohne Anmeldung: prüft als Fremder, erwartet `[]` beim Lesen und `42501` beim Schreiben.

## Befehle: Container

```bash
docker compose up --build -d                       # Image mit neuem Code bauen und Container neu starten
docker compose logs --since 5m zusammenfassen      # Log der letzten 5 Minuten, z. B. „Spielberichte: neu 0, ohne 0“
```

## Neu gelernt

### Container Query prüft nur Vorfahren

`@container` macht ein Element zum Bezugsrahmen für `@[900px]:…` seiner Kinder. Ein Element kann sich aber nicht selbst abfragen: Stehen
`@container` und `@[640px]:grid-cols-2` auf demselben `div`, greift die Spaltenregel nie. Lösung: ein umschließendes Element wird der
Container.

### Design-Defaults

Generierte Oberflächen landen oft bei denselben Mustern: Etiketten in Großbuchstaben über jedem Abschnitt, Mittelpunkte in Meta-Zeilen,
gleiche abgerundete Karten überall. Der Skill `frontend-design` lässt erst einen Design-Plan schreiben und gegen diese Muster prüfen.
Gibt der Entwickler eine Richtung vor (hier Vorbilder), geht seine Vorgabe vor.

### Konkrete Vorbilder statt Raten

Zwei Runden mit erfundenen Richtungen trafen nicht. Erst mit zwei echten Apps als Vorbild (FotMob, Apple News) passte das Ergebnis. Bei
Unzufriedenheit nach Vorbildern fragen, nicht nach Stilwörtern.

### Zonen statt Linien

Eine Zone ist ein Bereich der Tabelle mit derselben Bedeutung (Plätze 1–4 Champions League). Wer die Zonen kennt, kennt auch die
Linien: Sie stehen überall, wo zwei aufeinanderfolgende Plätze in verschiedenen Zonen liegen.

### `aria-label` bei geteilter Überschrift

Das Datum besteht optisch aus zwei Teilen (Wochentag klein, Datum groß). Mit `aria-label` an der Überschrift liest ein Screenreader es
trotzdem als „Sonntag, 22. November“. Ein Punkt neben einem Text wie „Neu“ bekommt `aria-hidden`, sonst hört man „neu, Neu“.

### Typ-Wächter für verschachtelte Unterscheidung

TypeScript erkennt `einstellung.teams` nicht über das verschachtelte Feld `tabelle.art`. Eine Funktion mit Rückgabetyp
`einstellung is Extract<…>` (Typ-Wächter) sagt es TypeScript ausdrücklich.

### Evaluation zahlt sich aus

Das kleine Modell `qwen3:4b` verstand das Feld `spieler` als „alle Spieler der Partie“ und verdrehte Fakten. Ohne Testsatz wäre im
Betrieb einfach nie ein Bericht erschienen. Weniger Eingabe (`keyEvents`, 1.900 statt 8.700 Zeichen) und ein größeres Modell
(`gemma4:e4b`) brachten den Sprung von 0 auf 9 von 10.

### `\b` in JavaScript kennt nur ASCII

`\b\p{L}\.$` sollte einzelne Buchstaben wie „z.“ erkennen, traf aber auch „Freistoß.“, weil `ß` für `\b` kein Wortzeichen ist. Mit
`(?<!\p{L})` statt `\b` zählt jeder Buchstabe.

### `queryByText` findet auch versteckten Text

Ein Element mit `hidden` ist im DOM, die Testing Library findet seinen Text. Ob etwas sichtbar ist, prüft man am Attribut `hidden`.

### `&&` statt `;`

Mit `;` läuft der nächste Befehl auch nach einem Fehler. So entstand ein Commit trotz roter Prüfung; mit `git commit --amend`
korrigiert, bevor er hochgeladen war.

### `TypeError` heißt nicht immer „Modell aus“

`fetch` wirft bei jedem Netzfehler einen `TypeError`, auch bei ESPN. Der Durchlauf hielt das für ein fehlendes Modell und brach alles ab
(Fund 1 im Review). Fehler beim Liveticker werden jetzt in einen normalen `Error` verpackt.

## Fehler und Lösungen

### `Error: [vitest] No "Barlow" export is defined on the "next/font/google" mock`

- **Wo:** Test `layout.test.ts` nach dem Wechsel der Schrift
- **Ursache:** Die Attrappe im Test lieferte nur noch `Commissioner`, `layout.tsx` lud noch Barlow (erwartetes Rot im TDD)
- **Lösung:** `layout.tsx` auf Commissioner umgestellt
- **Prüfen:** `npx vitest run __tests__/layout.test.ts`

### `JSX expressions must have one parent element`

- **Wo:** Tabelle und Legende in `lib/kacheln/fussball/ansicht.tsx`
- **Ursache:** Zwei Elemente nebeneinander im Zweig eines `? :`
- **Lösung:** beide in ein Fragment `<>…</>` gelegt
- **Prüfen:** `npm run check`

### `Unable to find role="heading" and name "Sonntag, 8. November"`

- **Wo:** `page.test.tsx` nach dem Teilen des Datums in Wochentag und Datum
- **Ursache:** Der berechnete Name der Überschrift setzte die beiden Teile nicht mit „, “ zusammen
- **Lösung:** `aria-label={datum(zeit)}` an der Überschrift
- **Prüfen:** `npx vitest run __tests__/page.test.tsx`

### Warteschleife auf `gh pr checks` lief bis zum Zeitlimit

- **Wo:** Warten auf CI von PR #80
- **Ursache:** Das Muster `'^(check|Vercel)\s'` passte nicht auf die Ausgabe mit Tabulatoren, die Schleife endete nie
- **Lösung:** Schleife beendet, Stand von Hand gelesen; später mit echtem Tabulator im Muster und fester Höchstzahl an Runden
- **Prüfen:** `gh pr checks 81`

### `[warn] Code style issues found in 2 files. Run Prettier with --write to fix.`

- **Wo:** `bash checks.sh` vor dem ersten Commit von Aufgabe 1
- **Ursache:** neue Dateien nicht formatiert, der Commit lief trotzdem, weil die Befehle mit `;` verbunden waren
- **Lösung:** `npx prettier --write <dateien>`, `git commit --amend --no-edit`
- **Prüfen:** `bash checks.sh` → `checks.sh: alles grün`

### `TimeoutError: The operation was aborted due to timeout`

- **Wo:** Evaluation mit `qwen3:4b` und ganzem Liveticker
- **Ursache:** das Modell brauchte über 120 Sekunden (Zeitlimit in `frageModell`), das Skript brach beim ersten Fehler ab
- **Lösung:** Skript fängt Fehler je Partie ab und schreibt nach jeder Partie; kürzere Eingabe mit `keyEvents`
- **Prüfen:** Lauf mit `gemma4:e4b`, höchstens 61 Sekunden je Partie

### `(eval):1: command not found: timeout`

- **Wo:** zweiter Start der Evaluation
- **Ursache:** `timeout` gibt es unter macOS nicht (GNU-Werkzeug)
- **Lösung:** ohne `timeout` gestartet, das Skript hat eigene Zeitlimits
- **Prüfen:** Lauf startet und schreibt `evaluation/daten/spielberichte.md`

### `AccessTokenRequiredError: Access token not provided`

- **Wo:** `supabase db query` aus Claude Code
- **Ursache:** Die Supabase-CLI war abgemeldet, `supabase login` braucht ein echtes Terminal-Fenster
- **Lösung:** Entwickler hat `supabase login` in der Terminal-App ausgeführt
- **Prüfen:** `supabase db query --linked --project-ref imebsydcnchziitgccxs "select 1"`

### `error TS1107: Jump target cannot cross function boundary`

- **Wo:** `evaluation/spielberichte/lauf.ts` nach einem Umbau per Skript
- **Ursache:** Das Ersetzen per Python hat ein `continue` in eine neue Funktion verschoben
- **Lösung:** Datei vollständig neu geschrieben statt Stückwerk
- **Prüfen:** `npx tsc --noEmit`

## Aus dem Chat

-

## Offene Fragen

- Stimmen die Hausfarben und Zonenfarben mit den offiziellen Farben überein? Nicht nachgeschlagen.
- Sehen Commissioner und die Partie-Zeile mit vier Spalten in Safari auf dem iPhone gut aus? Abgenommen nur in der Vorschau, KI-News in
  3 Spalten noch nicht gesehen.
- Parkplatz-Kandidat: Fehlversuche je Partie begrenzen (Fund 3 aus PR #85). Ein Bericht, der immer durchfällt, kostet alle 15 Minuten
  etwa 1 Minute Rechenzeit, bis der Spieltag vorbei ist.
- Wie oft fallen Berichte im Betrieb durch, und stimmen die Fakten (zwei Fehler im Verlauf rutschten in der Evaluation durch)?

## Nächste Schritte

1. Dashboard nach dem Deploy auf Mac, iPhone und iPad einmal neu laden.
2. Live-Tests: Bundesliga am 2026-11-20, Premier League am Samstag, Champions League am 2026-11-24.
3. Fälliger Parkplatz „Lokale KI für die Fußball-Kacheln“ besprechen, dann Phase 3, Schritt 3 (Formel 1).
4. Mac-App neu bauen, damit sie den neuen Grundton zeigt.
5. Freitag 2026-11-20: nach Abpfiff Knopf „Bericht“ ansehen (Mac und iPhone), Text gegen das Spiel prüfen, Ergebnis im Plan der
   Spielberichte (Aufgabe 8) eintragen, dann Schritt 3 in der Projektvision als erledigt markieren.
6. Phase 3, Schritt 4: Formel 1 (erst Mock, dann Plan).
