---
titel: "Plan: Champions League"
status: aktiv
erstellt: 2026-11-16
tags: [plan, kacheln, sport, champions-league, football-data, phase-3]
---

# Plan: Champions League

**Ziel:** Eine Kachel „Champions League“ für die Ligaphase: alle Partien des Spieltags live mit Torschützen, Nummer des Spieltags, Tabelle
der 36 Teams als Ausschnitt um Mein Team FC Bayern und Arsenal.

**Vorgehen:** Die Kachel nutzt das Modul `lib/kacheln/fussball/` wie Bundesliga und Premier League. Neu ist eine dritte Nahtstelle
**Kalender** (welche Tage Spiele haben): Die Ligen nehmen weiter den Kalender von ESPN, die Champions League die Tage aus dem Spielplan von
football-data.org. Fällt der aus, nimmt sie die Tage der Partien aus dem Standardabruf von ESPN (aktueller oder nächster Spieltag) und zeigt
sie ohne Nummer.

**Technik:** Next.js 16 (`fetch` mit `next.revalidate` und `next.tags`), Vitest. Keine neue Abhängigkeit.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Phase 3, Schritt 2, „Entscheidungen aus der Befragung zu
Schritt 2 vom 2026-11-15“ (alle Partien, Mein Team FC Bayern und Arsenal); [[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data|ADR 0011]];
Übergabe vom 2026-11-16 (Fund 9 aus PR #73, Tagesgrenze von ESPN erneut prüfen); Entscheidung im Gespräch vom 2026-11-16 (Tage aus dem
Spielplan, ESPN als Ersatz).

**Versuch (2026-11-16): trägt, mit Abweichung.** ESPN `uefa.champions/scoreboard` liefert im `calendar` nur Phasen („League Phase“
2026-08-27 bis 2027-02-15) statt Tagen, Zeiträume (`?dates=20261101-20261130`) beantwortet ESPN mit 400. Einzelne Tage (`?dates=20261124`)
liefern 9 Partien im bekannten Format, ohne Datum den nächsten Spieltag (heute: 24.11.). football-data.org `CL/matches`: 144 Partien,
alle `LEAGUE_STAGE`, Spieltage 1–8 mit `matchday` (Spieltag 8: 18 Partien am 2027-01-27), 143 KB. `CL/standings`: ein Eintrag `TOTAL`
mit 36 Zeilen, Bayern `5`, Arsenal `57`. ids bei ESPN wie in den Ligen (Arsenal `359`, Dortmund `124`, Leipzig `11420`).

**Tagesgrenze (Fund 3 aus PR #73) geprüft:** Anstöße der Champions League sind 18:45 und 21:00 deutscher Zeit (17:45Z, 20:00Z im
Versuch). Deutscher Tag, Tag von ESPN und UTC-Tag stimmen dabei überein, kein Handlungsbedarf.

**Nicht in diesem PR:** Linien nach Platz 8 und 24 und Gruppe „Sport“ (PR 3), K.-o.-Phase (Parkplatz bis 2027-01-27).

## Feste Vorgaben

- Kachel `{ id: "champions-league", titel: "Champions League", espn: "uefa.champions", kalender: { art: "spielplan" }, spielplan und
  tabelle: { art: "football-data", wettbewerb: "CL" }, meinTeam: ["132", "359"] }`.
- Reihenfolge in `KACHELN`: Bundesliga, Premier League, Champions League, KI-News.
- Bundesliga und Premier League bekommen `kalender: { art: "espn" }` und verhalten sich wie bisher.
- Speicher wie in der Premier League: Spielplan 24 Std. ohne Etikett, Tabelle 15 Min. mit Etikett, nie frisch. Ersatzabruf von ESPN
  15 Min. mit Etikett (wie die Tage).
- `meinTeam` und `TabellenZeile.id` bleiben ids von ESPN. Zeitlimit 5000 ms, `User-Agent: Tages-Dashboard`.
- Vor jedem Commit `npm run check`.

## Prüf-Schwerpunkte

1. Zwischen zwei Spieltagen (z. B. Mo 16.11.) zeigt die Kachel den nächsten Spieltag: Tage 24. und 25.11., Titel „5. Spieltag“
   (Test in Aufgabe 1).
2. football-data.org fällt aus oder antwortet 429 → Partien des aktuellen oder nächsten Tages von ESPN, Titel ohne Nummer, „Tabelle gerade
   nicht erreichbar“ (Test in Aufgabe 2).
3. Spieltag 8 mit 18 Partien an einem Tag → ein Block mit einem Tag, alle 18 Partien (Test in Aufgabe 1).
4. Bundesliga und Premier League unverändert: bestehende Tests bleiben grün, neuer Test, dass sie den Kalender weiter von ESPN holen
   (Aufgabe 1).
5. Nach dem 27.1.2027 (nur noch K.-o.-Partien ohne `matchday`) bleibt Spieltag 8 stehen statt eines Fehlers. Das deckt der vorhandene Test
   „nach dem letzten Block bleibt der letzte“ ab, die K.-o.-Phase selbst ist Parkplatz.

Unsichtbar: Der Schlüssel erscheint nie in der Antwort an den Browser. Der vorhandene Test in `fussball-quellen.test.ts` deckt den Weg ab,
Aufgabe 3 nimmt die Champions League in den Test von `ladeDashboard` auf.

## Fremde Dienste

| Dienst | Timeout | Bei Ausfall | Grenze des Tarifs | Wiederholung | Bedingungen |
|---|---|---|---|---|---|
| ESPN (`uefa.champions`) | 5 s | Kachel zeigt Fehler, letzter Stand bleibt (wie die Ligen) | keine bekannt, inoffiziell (ADR 0009) | nur lesen, sicher | inoffiziell, wie ADR 0009 |
| football-data.org (`CL`) | 5 s | Tage und Partien von ESPN ohne Nummer, Tabelle `null` | 10 Abrufe/Min., dann 429 | nur lesen, sicher | gelesen 2026-11-16: erlaubt |

**Grenze nachgerechnet:** Ohne ↻ höchstens 2 Abrufe der Tabelle (PL, CL) in 15 Minuten und 2 des Spielplans am Tag. Jeder Druck auf ↻
leert nur das Etikett seiner Kachel, also ein Abruf der Tabelle je Druck. Wie im Plan der Premier League droht 429 erst bei rund 6 Drücken
in einer Minute. Der Ersatzabruf bei ESPN zählt nicht gegen football-data.org.

## Dateien

| Datei | Aufgabe |
|---|---|
| `lib/einstellungen.ts` | `kalender`, Liga `uefa.champions`, Wettbewerb `CL`, Typ `FdTeam` (Fund 9), `TEAMS_CHAMPIONS_LEAGUE`, neue Kachel |
| `lib/kacheln/fussball/laden.ts` | Kalender je nach Einstellung, Ersatz bei Ausfall |
| `lib/kacheln/fussball/quellen.ts` | `ladeSpielplan` braucht für football-data.org keinen Kalender |
| `lib/kacheln/fussball/espn.ts` | `leseTageDerPartien` für den Ersatz |
| `lib/kacheln/fussball/football-data.ts` | `leseFdTabelle` mit `FdTeam[]` |
| `__tests__/fussball-*.test.ts`, `__tests__/einstellungen.test.ts` | Tests |
| `docs/adr/0011-…`, `docs/tools/ESPN.md`, `docs/tools/football-data.org.md`, `docs/Projektvision.md` | Nachtrag, Abrufe, Stand |

### Aufgabe 1: Tage aus dem Spielplan

Riskantestes zuerst: der neue Weg zu den Tagen.

**Dateien:**
- Ändern: `lib/einstellungen.ts`, `lib/kacheln/fussball/laden.ts`, `lib/kacheln/fussball/quellen.ts`
- Test: `__tests__/fussball-quellen.test.ts` (Einstellung der Champions League, `fetch` gestubbt wie dort)

**Schnittstellen:**
- Liefert:
  - `FussballEinstellung.kalender: { art: "espn" } | { art: "spielplan" }`, `espn: "ger.1" | "eng.1" | "uefa.champions"`,
    `wettbewerb: "PL" | "CL"` in `spielplan` und `tabelle`.
  - `ladeSpielplan(einstellung, kalender: string[], jetzt)`: Bei football-data.org ruft sie ab, auch wenn `kalender` leer ist (die Adresse
    hat keine Saison). Bei OpenLigaDB bleibt `kalender.length === 0 → null`.
  - `ladeFussball`: bei `kalender.art === "spielplan"` kein Abruf des ESPN-Kalenders, Tage sind die Schlüssel des Spielplans, aufsteigend.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**
  - `jetzt` = 2026-11-16 12:00Z, Spielplan `CL/matches` mit Spieltag 4 (03./04.11.), 5 (24./25.11.), 8 (27.01.2027, zwei Partien am Tag)
    → `tage` `["2026-11-24", "2026-11-25"]`, `titel` „5. Spieltag“, Partien beider Tage von `…/uefa.champions/scoreboard?dates=20261124`
    und `?dates=20261125`. Kein Abruf von `…/uefa.champions/scoreboard` ohne `?dates`.
  - `jetzt` = 2027-01-27 20:00Z → `tage` `["2027-01-27"]`, `titel` „8. Spieltag“, beide Partien.
  - Premier League (`kalender: { art: "espn" }`) ruft weiter `…/eng.1/scoreboard` ohne `?dates` ab.
- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  `npx vitest run __tests__/fussball-quellen.test.ts` → FAIL (die Tests stubben den ESPN-Kalender der Champions League nicht: „Unerwartete Adresse …/uefa.champions/scoreboard“)
- [x] **Schritt 3: Typen in `lib/einstellungen.ts`, Kalender in `laden.ts`, `ladeSpielplan` in `quellen.ts`**
  Bundesliga und Premier League in `KACHELN` bekommen `kalender: { art: "espn" }`.
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen** (`npm test`)
- [x] **Schritt 5: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Take matchdays from the schedule for the Champions League"
  ```

### Aufgabe 2: Ersatz von ESPN, wenn der Spielplan fehlt

**Dateien:**
- Ändern: `lib/kacheln/fussball/espn.ts`, `lib/kacheln/fussball/laden.ts`, `docs/adr/0011-pl-und-cl-von-espn-und-football-data.md`
- Test: `__tests__/fussball-espn.test.ts`, `__tests__/fussball-quellen.test.ts`

**Schnittstellen:**
- Nutzt: Aufgabe 1.
- Liefert: `leseTageDerPartien(json: unknown): string[]` in `espn.ts`: Tage der Partien (`events[].date`) nach deutscher Zeit
  (`heute`), ohne Doppelte, aufsteigend. Ohne `events`-Array wirft sie „Unerwartete Antwort von ESPN“.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**
  - `leseTageDerPartien({ events: [{ date: "2026-11-25T20:00Z" }, { date: "2026-11-24T17:45Z" }, { date: "2026-11-24T20:00Z" }] })`
    → `["2026-11-24", "2026-11-25"]`; `{}` → wirft.
  - `ladeFussball` (Champions League), `CL/matches` antwortet 429 → Abruf `…/uefa.champions/scoreboard` ohne `?dates` mit
    `next: { revalidate: 900, tags: ["champions-league"] }`, `tage` `["2026-11-24"]`, `titel: null`, `tabelle: null` (Tabelle auch 429),
    Partien des 24.11.
- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [x] **Schritt 3: `leseTageDerPartien` in `espn.ts`, Ersatz in `laden.ts`**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: Nachtrag in ADR 0011** („Nachtrag 2026-11-16“): ESPN liefert für die Champions League keine Tage, sie kommen aus dem
  Spielplan von football-data.org, bei Ausfall der Standardabruf von ESPN. Alternativen aus dem Gespräch: nur Spielplan (Fehler bei
  Ausfall), ESPN Tag für Tag (viele leere Abrufe).
- [x] **Schritt 6: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Fall back to ESPN days without the schedule"
  ```

### Aufgabe 3: Teams und Kachel Champions League, Typ erzwingt ids von football-data.org (Fund 9)

**Dateien:**
- Ändern: `lib/einstellungen.ts`, `lib/kacheln/fussball/football-data.ts`, `__tests__/kacheln-laden.test.ts`,
  `__tests__/api-kacheln.test.ts` (falls dort die Liste der Kacheln geprüft wird)
- Neu: `__tests__/einstellungen.test.ts`

**Schnittstellen:**
- Nutzt: Aufgabe 1 und 2.
- Liefert:
  - `FdTeam = Team & { footballData: number }`. `FussballEinstellung` mit `tabelle: { art: "football-data"; … }` verlangt `teams: FdTeam[]`,
    mit `tabelle: { art: "espn" }` reicht `Team[]`. `leseFdTabelle(json, teams: FdTeam[])`.
  - `TEAMS_PREMIER_LEAGUE: FdTeam[]`, `TEAMS_CHAMPIONS_LEAGUE: FdTeam[]` mit 36 Teams der Ligaphase 2026/27.
  - Kachel wie unter „Feste Vorgaben“ zwischen Premier League und KI-News.

- [ ] **Schritt 1: Teamliste erheben** (Skript im Scratchpad, nicht im Repo): ESPN `?dates=` für die 16 Tage der Ligaphase aus `CL/matches`,
  ids und `shortDisplayName` aller Teams; football-data.org `CL/standings` für ids und `shortName`. Paare über den Namen bilden, von Hand
  nachsehen, was nicht eindeutig passt. Name: der Kurzname aus `TEAMS_BUNDESLIGA` bzw. `TEAMS_PREMIER_LEAGUE`, sonst der von ESPN.
  Prüfen: 36 Paare, Bayern `132`/`5`, Arsenal `359`/`57`.
- [ ] **Schritt 2: Fehlschlagende Tests schreiben**
  - `__tests__/einstellungen.test.ts`: Eine `FussballEinstellung` mit Tabelle von football-data.org und einem Team ohne `footballData`
    trägt `// @ts-expect-error` (wird rot in `npm run typecheck`, solange der Typ es erlaubt). Dazu: `TEAMS_CHAMPIONS_LEAGUE` hat 36 Teams
    mit verschiedenen ids, darunter `132` und `359`.
  - `KACHELN.map((k) => k.id)` ist `["bundesliga", "premier-league", "champions-league", "ki-news"]`.
  - `ladeDashboard` mit der Champions League: JSON enthält den Wert von `FOOTBALL_DATA_API_KEY` nicht.
- [ ] **Schritt 3: Tests laufen lassen, sie müssen fehlschlagen** (`npm run typecheck` und `npm test`)
- [ ] **Schritt 4: Typen, Liste und Kachel in `lib/einstellungen.ts`, `leseFdTabelle` auf `FdTeam[]`**
- [ ] **Schritt 5: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 6: Doku:** Abrufe der Champions League in `docs/tools/football-data.org.md` und `docs/tools/ESPN.md` (Kalender nur mit
  Phasen, Zeiträume 400, Ersatzabruf), Stand in `docs/Projektvision.md` (Schritt 2: PR 2 erledigt).
- [ ] **Schritt 7: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Add Champions League tile"
  ```

### Aufgabe 4: Abnahme in der Vorschau von Vercel (Entwickler)

- [ ] **Schritt 1:** PR öffnen, `/code-review <PR-Nummer>`, Funde mit dem Entwickler durchgehen, `plan-pruefer`.
- [ ] **Schritt 2:** In der Vorschau einloggen: Champions League steht zwischen Premier League und KI-News, Titel „5. Spieltag“ mit
  Di 24. – Mi 25. November, 18 Partien mit Anstoßzeit, Bayern und Arsenal oben, Tabelle mit Platz 1 und je 2 Plätzen um Bayern und Arsenal.
- [ ] **Schritt 3 (24.11., abends, nach dem Merge):** live: Minute mit orangem Punkt, Spielstand und Torschützen innerhalb von rund
  2 Minuten nach einem Tor.
