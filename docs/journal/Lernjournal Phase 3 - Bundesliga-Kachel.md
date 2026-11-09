---
titel: Lernjournal Phase 3 - Bundesliga-Kachel
status: aktiv
phase: 3
erstellt: 2026-11-09
tags: [lernjournal, phase-3, sport, bundesliga, espn, openligadb, revalidatetag, grill-with-docs, mock, tdd, code-review, plan-pruefer]
---

# Lernjournal Phase 3: Bundesliga-Kachel

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - Seiten auslesen|Lernjournal Phase 2 - Seiten auslesen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Die Session lief vom 2026-11-08 bis 2026-11-09.

## Erledigt

- [x] Knopf ↻ in der KI-News-Kachel holt Feeds und Seiten frisch von den Quellen (PR #44,
  [[projects/tages-dashboard/docs/adr/0008-knopf-aktualisieren-mit-revalidatetag|ADR 0008]]), 6 von 8 Funden aus dem `/code-review` behoben
- [x] Phase 3 gestartet: `docs/Tools für später.md` geprüft (nichts für Phase 3), `/grill-with-docs Phase 3` in 4 Runden (PR #45)
- [x] Mock der Bundesliga-Kachel mit dem Agent `mock-bauer`, Variante A mit Kurznamen gewählt
- [x] Plan [[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan: Bundesliga-Kachel]] mit `plan-schreiben`
- [x] Versuch: ESPN und OpenLigaDB antworten vom Server bei Vercel aus (PR #47 hin, PR #48 wieder weg)
- [x] Bundesliga-Kachel mit `tdd` gebaut, Plan-Check mit `plan-pruefer`, 9 von 10 Funden aus dem `/code-review` behoben (PR #49)
- [x] Abnahme auf iPhone und Mac, Plan abgeschlossen (PR #50)
- [x] Tool-Notizen [[projects/tages-dashboard/docs/tools/ESPN|ESPN]] und [[projects/tages-dashboard/docs/tools/OpenLigaDB|OpenLigaDB]]
- [ ] Live-Test während eines Spiels (erstes Spiel am 2026-11-20 um 20:30 Uhr)

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Technik | ↻ holt frisch von den Quellen über `revalidateTag(id, { expire: 0 })`, Knopf im Kopf jeder Kachel | [[projects/tages-dashboard/docs/adr/0008-knopf-aktualisieren-mit-revalidatetag\|ADR 0008]] | Entwickler |
| Technik | Bundesliga von ESPN statt OpenLigaDB, OpenLigaDB nur für die Nummer des Spieltags | [[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn\|ADR 0009]] | Entwickler |
| Produkt | Spieltag = aufeinanderfolgende Tage mit Spielen, bleibt bis Mitternacht des Folgetags, Überschrift `9. Spieltag · Fr 6. – So 8. November`, sonst `Nachholspiel` | ESPN kennt keine Nummer, eigene Regel für alle Wettbewerbe | Entwickler |
| Produkt | Mein Team kann mehrere Teams umfassen (Champions League: Bayern und Arsenal), Formel 1 vorerst ohne | Glossar | Entwickler |
| Design | Torschützen bei jeder Partie mit Toren, Logos direkt von ESPN, deutsche Kurznamen (Bayern, HSV, Gladbach …) | Mock: volle Namen brechen auf dem iPhone um | Entwickler |
| Design | Tabelle als Ausschnitt: Platz 1 und Mein Team ± 2 Plätze | kurz auf dem iPhone | Entwickler |
| Technik | Laufende Partie wird frisch (`cache: "no-store"`) abgerufen, sonst 15 Min. Speicher; gespeicherte Antworten höchstens doppelt so alt wie ihre Speicherzeit | `/code-review`: der Trick mit `revalidate: 60` lieferte immer einen Takt zu spät | Entwickler |
| Bauen | Erst konkret, gemeinsame Sport-Hülle erst mit der zweiten Sport-Kachel | eine Kachel zeigt noch nicht, was gemeinsam ist | Entwickler |
| Bauen | Typen der KI-News eingeengt (`KiNewsDaten`), Lader per `switch` statt Tabelle `LADER` | TypeScript ordnet nur so jede Einstellung ihrem Lader zu, Vermerk in ADR 0004 | Entwickler |
| Prüfen | Versuch kurz auf der Live-Adresse statt in der Vorschau | Vorschau liegt hinter dem Vercel-Login | Entwickler |
| Bauen | Eigentor ` (ET)`, Elfmeter ` (E)`, `pre` nach Anstoß gilt als laufend, Bundesliga-Kachel vor den KI-News | im Plan unter „Aufgetaucht“ genannt | Entwickler |
| Technik | Saison bei OpenLigaDB: ab Juli das laufende Jahr, sonst das Vorjahr (`2026` für 2026/27) | Spielplan-Adresse braucht das Jahr | ungefragt |
| Prüfen | Fund 6 bleibt offen: Abrufe laufen nacheinander und könnten 8 s der Kachel reißen | ESPN gemessen rund 70 ms | Entwickler |

## Befehle: Schnittstellen erkunden

```bash
/usr/bin/curl -s --compressed 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard?dates=20261108'
/usr/bin/curl -s --compressed 'https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings'
/usr/bin/curl -s 'https://api.openligadb.de/getmatchdata/bl1/2026'
```

- `curl … scoreboard?dates=…`: Partien eines Tages bei ESPN, mit Status, Spielstand, Torschützen und Logos.
- `curl … standings`: Tabelle der Bundesliga bei ESPN.
- `curl … getmatchdata/bl1/2026`: ganzer Spielplan der Saison bei OpenLigaDB, daraus kommt die Nummer des Spieltags.
- `--compressed`: entpackt die mit gzip gepackte Antwort von ESPN.

## Befehle: PRs und Prüfungen

```bash
gh pr checks 49 --watch --interval 15
gh pr view 49 --json mergeable --jq .mergeable
gh api "repos/Matzee3007/tages-dashboard/commits/$sha/status" --jq '.statuses[] | select(.context=="Vercel") | .state'
```

- `gh pr checks … --watch`: wartet, bis alle Prüfungen eines PRs fertig sind.
- `gh pr view … mergeable`: zeigt, ob sich der PR mergen lässt (`MERGEABLE`).
- `gh api …/status`: fragt, ob Vercel einen Commit fertig gebaut hat, bevor live getestet wird.

## Neu gelernt

### Tag (Etikett) im Speicher von `fetch`

Mit `next: { tags: ["bundesliga"] }` bekommt jede gespeicherte Antwort einen Namen. `revalidateTag("bundesliga", { expire: 0 })` erklärt
alles mit diesem Namen sofort für abgelaufen, schon die Abrufe derselben Anfrage gehen dann an die Quelle. Mit `"max"` käme zuerst noch der
alte Stand.

### Stale-while-revalidate (alt liefern, im Hintergrund erneuern)

Ist ein gespeicherter Eintrag abgelaufen, liefert Next.js ihn trotzdem noch einmal aus und holt den neuen Stand erst im Hintergrund. Für
Live-Spielstände hinkt man so immer einen Takt hinterher. Deshalb gehen laufende Partien mit `cache: "no-store"` direkt an ESPN.

### Inoffizielle Schnittstelle

ESPN dokumentiert seine Schnittstelle nicht, sie kann sich jederzeit ändern. Die Kachel prüft deshalb die Form der Antwort und scheitert
sichtbar („Unerwartete Antwort von ESPN“), statt still leer zu bleiben.

### Versuch vor dem Bauen

Ein unsicherer Weg (hier: antwortet ESPN dem Server bei Vercel?) wird zuerst mit Wegwerf-Code ausprobiert, bevor die ganze Kachel entsteht.
Das Ergebnis steht im Kopf des Plans.

### Union-Typen und `switch`

Gibt es zwei Arten von Kacheln, ist `KachelEinstellung` ein Union-Typ (`KiNewsEinstellung | BundesligaEinstellung`). In einem `switch`
über `einstellung.art` weiß TypeScript in jedem `case`, welche Art gemeint ist. Über eine Tabelle mit Ladern geht das nicht.

## Fehler und Lösungen

### `{"code":400,"message":"Failed to get events endpoint."}`

- **Wo:** ESPN-Anzeigetafel mit `dates=20261106-20261108`
- **Ursache:** Bei Fußball nimmt ESPN nur einen einzelnen Tag, keinen Bereich.
- **Lösung:** ein Abruf pro Tag des Spieltags.
- **Prüfen:** `/usr/bin/curl -s --compressed '…/ger.1/scoreboard?dates=20261108'` liefert `events`.

### `'utf-8' codec can't decode byte 0x8b in position 1: invalid start byte`

- **Wo:** Antwort von ESPN mit Python lesen
- **Ursache:** ESPN schickt die Antwort mit gzip gepackt.
- **Lösung:** `curl` mit `--compressed`.
- **Prüfen:** Derselbe Befehl mit `--compressed` liefert lesbares JSON.

### `Protected by Vercel Authentication`

- **Wo:** Vorschau-Adresse des Versuchs-Branches
- **Ursache:** Die Vorschauen liegen hinter dem Vercel-Login (Deployment Protection).
- **Lösung:** Versuch kurz auf der Live-Adresse, danach sofort wieder entfernt (PR #47, #48).
- **Prüfen:** `/usr/bin/curl -s -o /dev/null -w '%{http_code}' 'https://tages-dashboard-iota.vercel.app/api/versuch'` ergibt ohne Login 401.

### `[warn] Code style issues found in the above file`

- **Wo:** `npm run check` nach einem Commit von `bundesliga-spielplan.test.ts`
- **Ursache:** Prüfung und Commit waren mit `;` statt `&&` verbunden, der Commit lief trotz roter Prüfung.
- **Lösung:** `npx prettier --write`, Commit ergänzt (`--amend`, noch nicht gepusht), danach immer `&&`.
- **Prüfen:** `npm run check` endet ohne `[warn]`.

## Aus dem Chat

-

## Offene Fragen

- Meldet ESPN verlegte Partien wirklich mit `STATUS_POSTPONED` oder `STATUS_CANCELED`? Bisher an keiner echten Antwort gesehen.
- Liefert ESPN auch Premier League und Champions League live (`eng.1`, `uefa.champions`)? Dann könnte football-data.org entfallen.

## Nächste Schritte

1. Live-Test am 2026-11-20 ab 20:30 Uhr: Minute, Spielstand und Torschützen innerhalb von rund 2 Minuten.
2. Phase 3, Schritt 2: Premier League und Champions League, zuerst `/grill-with-docs`.
