---
titel: Lernjournal Phase 2 - Seiten auslesen
status: abgeschlossen
phase: 2
erstellt: 2026-11-07
tags: [lernjournal, phase-2, ki-news, node-html-parser, scraping, code-review, plan-pruefer, tdd]
---

# Lernjournal Phase 2: Seiten auslesen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - KI-News-Kachel|Lernjournal Phase 2 - KI-News-Kachel]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] Gerätetest von Schritt 3 (Entwickler): Mac öffnet Meldungen im Standardbrowser, iPhone und iPad in einem Safari-Fenster in der App, „Fertig“
      führt zurück, man bleibt angemeldet. Eingetragen im Plan der KI-News-Kachel (PR #39).
- [x] Die sechs Kanäle ohne Feed untersucht: alle mit Status 200, `robots.txt` erlaubt das Auslesen. `red.anthropic.com` leitet auf
      `anthropic.com/research/team/frontier-red-team` weiter (301), `claude.com/blog` auf `claude.com/resources/articles` (308).
- [x] Plan [[projects/tages-dashboard/docs/plaene/2026-11-07-seiten-auslesen|Plan: Seiten auslesen]] geschrieben, vom Entwickler freigegeben.
- [x] Schritt 4 umgesetzt (PR #40): `leseSeite` mit drei Lesern (`anthropic`, `claude-artikel`, `versionshinweise`), `ladeKanal` mit Leser als
      Parameter, Seiten in den Einstellungen. `node-html-parser` 9.0.5 neu, [[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]].
- [x] `plan-pruefer`: STATUS ERFÜLLT. Vorschau auf Vercel vom Entwickler geprüft.
- [x] Zwei `/code-review`s, alle Funde mit dem Entwickler durchgegangen. Wichtigste Änderung: Meldungen von Seiten tragen `nurDatum: true`
      („heute“, „gestern“ statt erfundener Stunden, frisch heute und gestern, sortiert wie vom Ende ihres Tages).
- [x] **Phase 2 – KI-News abgeschlossen.** Plan auf `abgeschlossen`, Fahrplan und Roadmap abgehakt.
- [ ] Aufgabe 5, Schritt 1 (Entwickler): die App nach dem Deploy auf einem Gerät neu laden und eine Anthropic-Meldung antippen.

## Befehle: Seiten untersuchen

```bash
/usr/bin/curl -sL -A 'Tages-Dashboard' -o seite.html -w '%{http_code} %{size_download} %{time_total}s\n' 'https://www.anthropic.com/news'
/usr/bin/curl -sIL -A 'Tages-Dashboard' 'https://red.anthropic.com/' | grep -iE '^(HTTP|location)'
/usr/bin/curl -s 'https://www.anthropic.com/robots.txt'
```

- `curl -sL -A … -o … -w …`: lädt eine Seite mit unserem User-Agent und folgt Weiterleitungen (`-L`). `-w` gibt Status, Größe und Dauer aus.
- `curl -sIL … | grep`: holt nur die Kopfzeilen (`-I`) und zeigt Status und `location`, also wohin eine Adresse weiterleitet.
- `robots.txt`: sagt, was Programme auf einer Website auslesen dürfen. Vor dem Auslesen prüfen.

## Befehle: Abhängigkeit wählen

```bash
npm view node-html-parser time --json | tail -6
/usr/bin/curl -s 'https://api.npmjs.org/downloads/point/last-week/node-html-parser,cheerio'
npm install --save-exact node-html-parser@9.0.5
```

- `npm view <paket> time`: Veröffentlichungsdaten aller Versionen. Damit eine Version wählen, die mindestens zwei Wochen alt ist.
- Downloads-API von npm: wie verbreitet ein Paket ist, hier zum Vergleich von `node-html-parser` und `cheerio`.
- `npm install --save-exact`: installiert genau diese Version, ohne `^` in `package.json`.

## Befehle: Prüfen und PR

```bash
npx vitest run __tests__/ki-news-seiten.test.ts
npm run check
gh pr checks 40 --watch --interval 10
gh pr view 40 --json mergeable --jq .mergeable
```

- `npx vitest run <datei>`: nur eine Testdatei laufen lassen, für die Rot-Grün-Schleife.
- `npm run check`: Linter, Formatierung, Typen und alle Tests, vor jedem Commit.
- `gh pr checks --watch`: wartet, bis die CI eines PRs fertig ist, und zeigt das Ergebnis.
- `gh pr view --json mergeable`: erst bei `MERGEABLE` mergen.

## Neu gelernt

### Web-Scraping

Ein Programm lädt eine Seite, die für Menschen gedacht ist, und sucht darin Bausteine wie `<h3>` (Titel) und `<time>` (Datum). Das bricht, sobald
die Website umgebaut wird. Deshalb wirft der Leser, wenn er nichts findet: Dann fällt nur dieser eine Kanal aus, die anderen laufen weiter.

### CSS-Selektoren auf dem Server

`node-html-parser` macht aus HTML einen Baum, in dem man wie im Browser sucht: `querySelectorAll("[data-listing-row]")` findet jede Zeile,
`closest("a[href]")` den nächsten Link um ein Element herum. `.text` liefert den Text schon dekodiert (`&#x27;` wird `'`).

### Datum ohne Uhrzeit

Die Seiten nennen nur den Tag. Wer daraus 00:00 UTC macht, erfindet Stunden („vor 14 Std.“) und sortiert falsch. Besser: das Merkmal `nurDatum`
mitgeben, das Alter in Kalendertagen zeigen und beim Sortieren das Ende des Tages nehmen, höchstens jetzt.

### Gegenprobe (Mutation)

Besteht ein neuer Test sofort, kurz den Fehler absichtlich in den Code einbauen. Wird der Test rot, prüft er wirklich etwas. So fiel auf, dass der
Test zum Kategorie-Link allein nichts abfing: Erst mit der Research-Zeile, in der der Kategorie-Link vor dem Titel steht, wurde er wirksam.

### Neue Version erst nach zwei Wochen

`node-html-parser` 9.0.6 und 9.0.7 waren jünger als zwei Wochen, deshalb 9.0.5. Frische Versionen sind das häufigste Einfallstor für
manipulierte Pakete.

### Ein Review-Umbau kann neue Fehler bringen

Der Umbau nach dem ersten `/code-review` machte aus „gestern“ am 25-Stunden-Tag der Zeitumstellung ungewollt „heute“. Das zweite Review fand es.

## Fehler und Lösungen

### `[warn] Code style issues found in the above file. Run Prettier with --write to fix.`

- **Wo:** Commit von Aufgabe 2, Befehlskette `npm run check …; git commit …`
- **Ursache:** Mit `;` läuft der nächste Befehl auch nach einem Fehler. Der Commit entstand trotz Formatierungswarnung.
- **Lösung:** Datei mit `npx prettier --write` formatieren und den noch nicht gepushten Commit mit `git commit --amend --no-edit` ersetzen.
  Danach Befehle mit `&&` verbinden, das führt den nächsten nur nach Erfolg aus.
- **Prüfen:** `npm run check` ohne `warn`.

### `Kanal https://… ließ sich nicht laden: Error: Gespeicherte Antwort von Fri, 06 Nov 2026 16:03:34 GMT`

- **Wo:** lokaler Test mit den echten Seiten, erster Abruf von `/api/kacheln`
- **Ursache:** Der lokale Zwischenspeicher von Next.js hielt Feed-Antworten vom Vortag. Die Grenze von 1 Stunde (ADR 0005) verwarf sie wie gewollt.
- **Lösung:** keine nötig, beim zweiten Abruf waren alle Absender erreichbar.
- **Prüfen:** `/api/kacheln` ein zweites Mal abrufen.

### `Blocked: sleep 60 followed by: gh pr checks 40 …`

- **Wo:** Warten auf die CI von PR #40 in Claude Code
- **Ursache:** Claude Code blockt `sleep` im Vordergrund.
- **Lösung:** `gh pr checks 40 --watch --interval 10` wartet selbst, bis die CI fertig ist.
- **Prüfen:** Der Befehl endet mit `pass` für `check` und Vercel.

## Aus dem Chat

-

## Offene Fragen

- Ist die Grenze für den Punkt (24 Std., bei Seiten heute und gestern) im Alltag richtig? Nach ein paar Tagen ansehen.

## Nächste Schritte

1. Die App auf einem Gerät neu laden und eine Anthropic-Meldung antippen (Aufgabe 5, Schritt 1).
2. Nächste Session: Phase 3 – Sport. Vorher fragen, ob etwas anderes ansteht, dann `docs/Tools für später.md` prüfen und mit
   `/grill-with-docs` die offenen Fragen klären.
