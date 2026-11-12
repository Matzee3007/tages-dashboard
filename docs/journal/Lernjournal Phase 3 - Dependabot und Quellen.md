---
titel: Lernjournal Phase 3 - Dependabot und Quellen
status: aktiv
phase: 3
erstellt: 2026-11-12
tags: [lernjournal, phase-3, sport, dependabot, code-review, espn, openligadb, supabase, grill-with-docs]
---

# Lernjournal Phase 3: Dependabot und Quellen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Bundesliga-Kachel|Lernjournal Phase 3 - Bundesliga-Kachel]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] `/code-review` für die Dependabot-PRs #53 und #54, beide ohne Fehler im Code
- [x] Herkunft von `@tailwindcss/turbopack@4.3.4` geprüft (Fund aus dem Review von #54: „neuer Releaser“): Provenance zeigt den Workflow
  `release.yml` im Repo `tailwindlabs/tailwindcss`, Tag `v4.3.4`
- [x] Login in der Vorschau von #53 von Hand getestet, alles wie erwartet, danach #53 gemergt (`next` und `eslint-config-next` 16.4.5, mit
  Sicherheitsfixes)
- [x] Tool-Notiz [[projects/tages-dashboard/docs/tools/Next.js|Next.js]] auf 16.4.5 (PR #55)
- [x] #54 von Dependabot geschlossen und durch #56 ersetzt, `/code-review` für #56
- [x] Faktenprüfung für Schritt 2: ESPN liefert Premier League und Champions League, OpenLigaDB hat beide Spielpläne
- [x] `/grill-with-docs Phase 3 Schritt 2` begonnen, Runde 1 gestellt
- [ ] #56 mergen: Login-Test in der Vorschau fehlt noch (Update von Supabase)
- [ ] Fix fürs Abmelden als eigener PR (Fund aus dem Review von #56)
- [ ] Antworten auf Runde 1 der Befragung (F1 bis F5)

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Betrieb | Erst die Dependabot-PRs, dann Schritt 2 | Schritt 2 startet auf aktuellen Paketen, #53 schließt Sicherheitslücken | Entwickler |
| Prüfen | Beide Dependabot-PRs erst nach Login-Test in der Vorschau mergen, den fehlenden Test für `&amp;` in Links nur notieren | Ablauf in [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung\|Dependabot - Einrichtung]] | Entwickler |
| Betrieb | #56 nach dem Login-Test mergen, danach ein eigener PR mit Test, der das Abmelden bei einem Fehler von Supabase absichert, dazu die Versionen in der Doku nachziehen | seit supabase-js 2.119 bleibt man bei einer Störung nach „Abmelden“ still angemeldet | Entwickler |
| Bauen | Nach dem Konflikt in #54 Dependabot mit `@dependabot rebase` neu aufsetzen lassen statt von Hand lösen | Dependabot pflegt seine Branches selbst | ungefragt |

## Befehle: Dependabot-PRs

```bash
gh pr list --json number,title,headRefName,mergeable
gh pr merge 53 --merge
gh pr comment 54 --body '@dependabot rebase'
gh pr view 54 --json state --jq .state
npm view @tailwindcss/turbopack@4.3.4 dist.attestations _npmUser --json
```

- `gh pr list --json …,mergeable`: offene PRs mit der Angabe, ob sie sich ohne Konflikt mergen lassen.
- `gh pr merge 53 --merge`: übernimmt den PR mit einem Merge-Commit, wie bei den bisherigen PRs.
- `gh pr comment 54 --body '@dependabot rebase'`: bittet Dependabot, den Branch auf das neue `main` aufzusetzen.
- `gh pr view 54 --json state`: zeigt, ob der PR offen, gemergt oder geschlossen ist.
- `npm view … dist.attestations _npmUser`: zeigt, ob ein Paket einen Herkunftsnachweis hat und wer es veröffentlicht hat.

## Befehle: Quellen für Schritt 2

```bash
/usr/bin/curl -s 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard'
/usr/bin/curl -s 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings'
/usr/bin/curl -s 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/uefa.champions/calendar/ondays'
/usr/bin/curl -s 'https://api.openligadb.de/getavailableleagues'
/usr/bin/curl -s 'https://api.openligadb.de/getmatchdata/ucl/2026'
```

- `… eng.1/scoreboard`: Partien der Premier League bei ESPN, mit Torschützen wie bei der Bundesliga.
- `… uefa.champions/standings`: Tabelle der Ligaphase der Champions League (36 Teams).
- `… calendar/ondays`: alle Tage mit Spielen der Champions League. Die Anzeigetafel nennt dort nur Abschnitte wie „League Phase“.
- `… getavailableleagues`: alle Ligen bei OpenLigaDB. Für 2026 sind `pl` und `ucl` gepflegt, `pl1` und `ucl2026` sind leer.
- `… getmatchdata/ucl/2026`: Spielplan der Ligaphase mit den Nummern der Spieltage 1 bis 8.

## Neu gelernt

### Provenance bei npm

Ein Herkunftsnachweis zu einem Paket: Er nennt Repo, Workflow und Tag, aus denen das Paket gebaut wurde. So lässt sich prüfen, ob ein
„neuer Releaser“ echt ist. Bei Tailwind war es der Wechsel auf automatisches Veröffentlichen über GitHub Actions.

### Dependabot ersetzt PRs, statt sie neu aufzusetzen

Ändern zwei PRs dieselbe `package-lock.json`, hat der zweite nach dem ersten Merge einen Konflikt. Auf `@dependabot rebase` hat Dependabot
#54 geschlossen („Looks like these dependencies are updatable in another way“) und #56 geöffnet, mit einem Update mehr. Das Review des
alten PRs gilt dann nicht für den neuen.

### Ein Update kann Verhalten ändern, obwohl die CI grün ist

supabase-js 2.119 löscht das Cookie beim Abmelden nur noch, wenn der Server das Abmelden bestätigt. `abmelden` in `app/login/actions.ts`
prüft das Ergebnis von `signOut()` nicht. Die Tests ersetzen Supabase durch eine Attrappe und merken das nicht. Erst das Lesen des
Paket-Codes im `/code-review` hat es gezeigt.

### ESPN für die Champions League

Für die Premier League liefert ESPN einen Kalender mit einzelnen Tagen, wie für die Bundesliga. Für die Champions League nennt die
Anzeigetafel nur Abschnitte mit Start und Ende. `leseKalender` würde dort mit „falsche Form“ abbrechen. Die Tage stehen aber in der
Kern-Schnittstelle (`sports.core.api.espn.com`). Arsenal hat in beiden Wettbewerben die id `359`, der FC Bayern `132` wie in der Bundesliga.

## Fehler und Lösungen

### `CONFLICTING` bei PR #54 nach dem Merge von #53

- **Wo:** beim Mergen der beiden Dependabot-PRs nacheinander
- **Ursache:** Beide ändern `package-lock.json`.
- **Lösung:** Kommentar `@dependabot rebase`. Dependabot hat den PR geschlossen und durch #56 ersetzt.
- **Prüfen:** `gh pr list --author 'app/dependabot'`

## Aus dem Chat

-

## Offene Fragen

- Runde 1 der Befragung zu Schritt 2: F1 Quelle (Weichenfrage: A ESPN mit Nummer von OpenLigaDB, B football-data.org, C beides), F2
  Reihenfolge der Kacheln, F3 Länge des Spieltags der Champions League (18 Partien), F4 K.-o.-Phase parken, F5 Grenzen in der Tabelle der
  Champions League
- Live-Minute und Status für `eng.1` und `uefa.champions` sind nicht gesehen, nur von `ger.1` angenommen.

## Nächste Schritte

1. Login-Test in der Vorschau von #56, dann mergen.
2. Fix fürs Abmelden mit `tdd`, dazu Versionen in `docs/tools/Supabase.md`, `docs/tools/node-html-parser.md` und ADR 0007 nachziehen.
3. Runde 1 der Befragung beantworten und `/grill-with-docs Phase 3 Schritt 2` fortsetzen.
