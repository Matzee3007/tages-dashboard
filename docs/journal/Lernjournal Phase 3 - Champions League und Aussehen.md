---
titel: Lernjournal Phase 3 - Champions League und Aussehen
status: aktiv
phase: 3
erstellt: 2026-11-17
tags: [lernjournal, phase-3, champions-league, espn, football-data, aussehen, mock-bauer, frontend-design, tailwind, tdd, plan-pruefer]
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

## Aus dem Chat

-

## Offene Fragen

- Stimmen die Hausfarben und Zonenfarben mit den offiziellen Farben überein? Nicht nachgeschlagen.
- Sehen Commissioner und die Partie-Zeile mit vier Spalten in Safari auf dem iPhone gut aus? Abgenommen nur in der Vorschau, KI-News in
  3 Spalten noch nicht gesehen.

## Nächste Schritte

1. Dashboard nach dem Deploy auf Mac, iPhone und iPad einmal neu laden.
2. Live-Tests: Bundesliga am 2026-11-20, Premier League am Samstag, Champions League am 2026-11-24.
3. Fälliger Parkplatz „Lokale KI für die Fußball-Kacheln“ besprechen, dann Phase 3, Schritt 3 (Formel 1).
4. Mac-App neu bauen, damit sie den neuen Grundton zeigt.
