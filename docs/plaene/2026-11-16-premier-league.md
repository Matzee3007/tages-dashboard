---
titel: "Plan: Premier League"
status: aktiv
erstellt: 2026-11-16
tags: [plan, kacheln, sport, premier-league, football-data, phase-3]
---

# Plan: Premier League

**Ziel:** Eine Kachel „Premier League“ wie die Bundesliga (Spieltag live mit Torschützen und Logos, Tabelle um Mein Team Arsenal). Dazu
ziehen beide Ligen ihr Gemeinsames in ein Modul `lib/kacheln/liga/`.

**Vorgehen:** Aus `lib/kacheln/bundesliga/` wird `lib/kacheln/liga/` mit der Kachel-Art `liga`. `ladeLiga` holt Partien immer von ESPN
(Liga-Code aus der Einstellung). Zwei Nahtstellen mit je zwei Adaptern: **Spielplan** (Tag → Nummer des Spieltags) von OpenLigaDB oder
football-data.org, **Tabelle** von ESPN oder football-data.org. Welche Adapter eine Liga nutzt, steht in ihrer Einstellung. Teams werden
über eine Liste je Liga (id bei ESPN, id bei football-data.org, deutscher Kurzname) zusammengeführt.

**Technik:** Next.js 16 (`fetch` mit `next.revalidate` und `next.tags`), React, Tailwind, Vitest, Testing Library. Keine neue Abhängigkeit.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Phase 3, Schritt 2, „Entscheidungen aus der Befragung zu
Schritt 2 vom 2026-11-15“; [[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data|ADR 0011]]; Entwurf der Module
vom 2026-11-16 (im Gespräch freigegeben, Mein Team Arsenal); [[projects/tages-dashboard/docs/tools/football-data.org|football-data.org]].

**Versuch:** keiner. Der Weg ist lokal belegt (2026-11-16: `/v4/competitions/PL/standings` und `/v4/competitions/PL/matches` mit
Schlüssel Status 200, 380 Partien mit `matchday`, Antwort 371 KB mit `Date`-Header). Ob football-data.org auch vom Server bei Vercel
antwortet, zeigt die Abnahme in der Vorschau (Aufgabe 6), siehe „Aufgetaucht“.

**Nicht in diesem PR:** Linien in den Tabellen und Gruppe „Sport“ (PR 3), Champions League (PR 2).

## Feste Vorgaben

- Der Schlüssel heißt `FOOTBALL_DATA_API_KEY`, nur auf dem Server, Header `X-Auth-Token`. Kein `NEXT_PUBLIC_`.
- `meinTeam` und `TabellenZeile.id` sind immer ids von ESPN (Glossar: Mein Team). Arsenal ist `359`.
- Zeitlimit je Abruf 5000 ms, `User-Agent: Tages-Dashboard` wie bisher.
- Speicher: ESPN-Kalender 24 Std. mit Etikett, Tage und ESPN-Tabelle 15 Min. mit Etikett, frisch bei laufender Partie (wie bisher).
  Spielplan (OpenLigaDB und football-data.org) 24 Std. **ohne** Etikett. Tabelle von football-data.org 15 Min. mit Etikett, **nie frisch**
  (Grenze von 10 Abrufen pro Minute, Tabelle darf nachziehen).
- Die id der Bundesliga-Kachel bleibt `bundesliga` (Etikett für ↻ und gespeicherte Antworten bleiben gültig).
- Reihenfolge in `KACHELN`: Bundesliga, Premier League, KI-News.
- Vor jedem Commit `npm run check`.

## Prüf-Schwerpunkte

1. football-data.org antwortet nicht oder mit 429 → Premier League zeigt Partien, Überschrift ohne Nummer, statt der Tabelle „Tabelle
   gerade nicht erreichbar“ (Test in Aufgabe 3 und 4).
2. Ein Team fehlt in der Liste (Aufsteiger nächste Saison) → Partie zeigt den Namen von ESPN, Tabellenzeile den `shortName` von
   football-data.org, Fehler im Server-Log (Test in Aufgabe 1 und 2).
3. Anstoß kurz vor Mitternacht deutscher Zeit (`utcDate` 23:30Z) → zählt zum Folgetag, wie die Tage von ESPN (Test in Aufgabe 1).
4. Bundesliga verhält sich nach dem Umzug genau wie vorher (Titel, Nachholspiel, frische Tabelle bei laufender Partie): die bestehenden
   Tests ziehen mit um und bleiben grün (Aufgabe 2 und 3).
5. Eine seit vor dem Deploy offene Seite bekommt die neue Art `liga` → zeigt „Neue Kachel, bitte die Seite neu laden.“ (vorhandener
   `default`-Zweig, Test in Aufgabe 4).

Unsichtbar: Der Schlüssel erscheint nie in der Antwort an den Browser (Test in Aufgabe 3: JSON von `ladeDashboard` enthält den Wert der
Variable nicht).

## Fremde Dienste

| Dienst | Timeout | Bei Ausfall | Grenze des Tarifs | Wiederholung | Bedingungen |
|---|---|---|---|---|---|
| ESPN (`eng.1`) | 5 s | Kachel zeigt Fehler, letzte Daten bleiben (wie Bundesliga) | keine bekannt, inoffiziell (ADR 0009) | nur lesen, sicher | inoffiziell, wie ADR 0009 |
| football-data.org | 5 s | Partien laufen weiter, Titel ohne Nummer, Tabelle `null` | 10 Abrufe/Min., dann vermutlich 429 | nur lesen, sicher | gelesen 2026-11-16: erlaubt (freie Nutzung mit Konto) |

**Grenze nachgerechnet:** Je Liga höchstens ein Abruf der Tabelle in 15 Minuten und einer des Spielplans am Tag, der Speicher von Vercel
gilt für alle Instanzen. Der Takt im Browser (60 s) trifft den Speicher. Nur ↻ geht an ihm vorbei: je Druck ein Abruf der Tabelle.
Mit Premier League und Champions League (PR 2) also höchstens 2 Abrufe der Tabelle und 2 des Spielplans in einer Minute ohne ↻, dazu
einer je Druck auf ↻ (er leert nur das Etikett seiner Kachel, der Spielplan hat keins). Die Grenze von 10 pro Minute wird erst bei rund
6 Drücken auf ↻ in einer Minute erreicht, dann greift Prüf-Schwerpunkt 1. Die Antwort `/matches` (371 KB) ist so groß wie der Spielplan von
OpenLigaDB (356 KB), der seit 2026-11-09 gespeichert läuft.

## Dateien

| Datei | Aufgabe |
|---|---|
| `lib/kacheln/bundesliga/*` → `lib/kacheln/liga/*` | Umzug mit `git mv`: `typen.ts`, `espn.ts`, `spielplan.ts`, `spieltag.ts`, `laden.ts`, `kachel.ts`, `ansicht.tsx` |
| `lib/kacheln/liga/abruf.ts` (neu) | `holeJson` aus `laden.ts`, dazu optionale Header |
| `lib/kacheln/liga/football-data.ts` (neu) | Lesefunktionen für Spielplan und Tabelle von football-data.org |
| `lib/kacheln/liga/quellen.ts` (neu) | die beiden Nahtstellen: `ladeSpielplan`, `ladeTabelle` |
| `lib/einstellungen.ts` | `LigaEinstellung`, `Team`, `TEAMS_BUNDESLIGA` (aus `TEAMNAMEN`), `TEAMS_PREMIER_LEAGUE`, neue Kachel |
| `lib/kacheln/typen.ts`, `lib/kacheln/laden.ts`, `app/dashboard.tsx` | Art `bundesliga` → `liga` |
| `__tests__/bundesliga-*.test.ts(x)` → `__tests__/liga-*.test.ts(x)` | ziehen mit um, neue Tests dazu |
| `.github/workflows/*` | nur falls dort Umgebungsvariablen stehen (keine nötig: Tests stubben `fetch`) |

### Aufgabe 1: Lesefunktionen für football-data.org

**Dateien:**
- Neu: `lib/kacheln/liga/football-data.ts`
- Test: `__tests__/liga-football-data.test.ts`

**Schnittstellen:**
- Nutzt: `heute(jetzt: Date): string` aus `lib/zeit.ts`; `TabellenZeile` aus `lib/kacheln/bundesliga/typen.ts` (zieht in Aufgabe 2 um);
  `Team = { espn: string; footballData?: number; name: string }` (neu in `lib/einstellungen.ts`, in dieser Aufgabe angelegt).
- Liefert: `leseFdSpielplan(json: unknown): Map<string, number>` und
  `leseFdTabelle(json: unknown, teams: Team[]): TabellenZeile[]`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**
  - `leseFdSpielplan`: `{ matches: [{ utcDate: "2026-11-21T15:00:00Z", matchday: 12 }, { utcDate: "2026-11-21T23:30:00Z", matchday: 12 },
    { utcDate: "2026-11-24T20:00:00Z", matchday: 13 }] }` → `Map { "2026-11-21" → 12, "2026-11-22" → 12, "2026-11-24" → 13 }`
    (23:30Z ist 00:30 deutscher Zeit). Höchste Nummer je Tag wie `leseSpielplan`. Antwort ohne `matches`-Array → wirft
    „Unerwartete Antwort von football-data.org“.
  - `leseFdTabelle`: Eintrag `{ position: 1, team: { id: 57, shortName: "Arsenal", crest: "https://crests.football-data.org/57.png" },
    playedGames: 10, goalDifference: 10, points: 27 }` mit `teams = [{ espn: "359", footballData: 57, name: "Arsenal" }]` →
    `{ platz: 1, id: "359", name: "Arsenal", logo: "https://crests.football-data.org/57.png", spiele: 10, differenz: 10, punkte: 27 }`.
    Nur `standings` mit `type: "TOTAL"` zählt. Team 999 fehlt in der Liste → `id: "fd-999"`, `name` = `shortName`, `console.error`
    mit „Team 999 fehlt in der Liste“. Sortiert nach `platz`.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

  `npx vitest run __tests__/liga-football-data.test.ts` → FAIL, Modul fehlt.

- [x] **Schritt 3: `leseFdSpielplan` und `leseFdTabelle` in `lib/kacheln/liga/football-data.ts`, `Team` in `lib/einstellungen.ts`**

  Tag aus `utcDate` mit `heute(new Date(utcDate))`.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

- [x] **Schritt 5: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Add football-data.org readers for schedule and table"
  ```

### Aufgabe 2: Umzug nach `lib/kacheln/liga/`, Art `liga`

Reiner Umbau ohne neues Verhalten. Riskant, weil die laufende Bundesliga betroffen ist, deshalb vor der Premier League.

**Dateien:**
- Umzug: `lib/kacheln/bundesliga/*` → `lib/kacheln/liga/*`, `__tests__/bundesliga-*` → `__tests__/liga-*` (mit `git mv`)
- Neu: `lib/kacheln/liga/abruf.ts`
- Ändern: `lib/einstellungen.ts`, `lib/kacheln/typen.ts`, `lib/kacheln/laden.ts`, `app/dashboard.tsx`, `__tests__/kacheln-laden.test.ts`,
  `__tests__/api-kacheln.test.ts`, `__tests__/page.test.tsx`

**Schnittstellen:**
- Liefert:
  - `LigaEinstellung = { id: string; art: "liga"; titel: string; espn: "ger.1" | "eng.1"; spielplan: { art: "openligadb"; liga: "bl1" }
    | { art: "football-data"; wettbewerb: "PL" }; tabelle: { art: "espn" } | { art: "football-data"; wettbewerb: "PL" }; teams: Team[];
    meinTeam: string[] }` (ersetzt `BundesligaEinstellung`).
  - `TEAMS_BUNDESLIGA: Team[]` aus `TEAMNAMEN` (gleiche ids und Namen, `footballData` leer). `TEAMNAMEN` entfällt.
  - `LigaDaten = { art: "liga"; titel: string | null; tage: string[]; partien: Partie[]; tabelle: (TabellenZeile | null)[] | null;
    meinTeam: string[] }` (ersetzt `BundesligaDaten`; `null` nutzt erst Aufgabe 3).
  - `ladeLiga(einstellung: LigaEinstellung, jetzt: Date): Promise<LigaDaten>`, `ladeLigaKachel(...)`, `LigaAnsicht`.
  - `holeJson(url: string, speicher: Speicher, jetzt: Date, header?: Record<string, string>): Promise<unknown>` in `abruf.ts`.
  - `leseTag(json, jetzt, teams: Team[])` und `leseTabelle(json, teams: Team[])` in `espn.ts`: Name aus `teams`, sonst ESPN.
  - ESPN-Adressen aus `einstellung.espn` statt fest `ger.1`.

- [ ] **Schritt 1: Tests umziehen und auf die neuen Namen bringen** (`ladeLiga`, Art `liga`, Einstellung mit `espn: "ger.1"`,
  `spielplan: { art: "openligadb", liga: "bl1" }`, `tabelle: { art: "espn" }`, `teams: TEAMS_BUNDESLIGA`). Neuer Test in
  `liga-laden.test.ts`: Einstellung mit `espn: "eng.1"` ruft `…/soccer/eng.1/scoreboard` ab.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen** (Module unter `lib/kacheln/liga/` fehlen)
- [ ] **Schritt 3: Code umziehen und umbenennen** wie unter „Liefert“. Erwartete Werte der alten Tests bleiben unverändert.
- [ ] **Schritt 4: `npm test`, alle müssen bestehen** (bisher 266 Tests, dazu der neue)
- [ ] **Schritt 5: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Move Bundesliga tile to shared league module"
  ```

### Aufgabe 3: Nahtstellen Spielplan und Tabelle, Kachel Premier League

**Dateien:**
- Neu: `lib/kacheln/liga/quellen.ts`, Test `__tests__/liga-quellen.test.ts`
- Ändern: `lib/kacheln/liga/laden.ts`, `lib/einstellungen.ts`, `__tests__/liga-laden.test.ts`, `__tests__/kacheln-laden.test.ts`

**Schnittstellen:**
- Nutzt: Aufgabe 1 und 2.
- Liefert:
  - `ladeSpielplan(quelle: LigaEinstellung["spielplan"], tage: string[], jetzt: Date): Promise<Map<string, number> | null>`: OpenLigaDB
    wie bisher (`getmatchdata/bl1/<saison>`), football-data.org `https://api.football-data.org/v4/competitions/<wettbewerb>/matches`.
    Bei Fehler `null` und `console.error`.
  - `ladeTabelle(quelle: LigaEinstellung["tabelle"], teams: Team[], laeuft: boolean, etikett: string, jetzt: Date):
    Promise<TabellenZeile[] | null>`: ESPN wie bisher (frisch bei `laeuft`, Fehler wirft weiter, die Kachel zeigt dann Fehler);
    football-data.org `…/competitions/<wettbewerb>/standings`, nie frisch, bei Fehler `null` und `console.error`.
  - `TEAMS_PREMIER_LEAGUE: Team[]` mit den 20 Teams der Saison 2026/27 (Liste unten).
  - Kachel `{ id: "premier-league", art: "liga", titel: "Premier League", espn: "eng.1", spielplan: { art: "football-data",
    wettbewerb: "PL" }, tabelle: { art: "football-data", wettbewerb: "PL" }, teams: TEAMS_PREMIER_LEAGUE, meinTeam: ["359"] }`
    zwischen Bundesliga und KI-News.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** (`fetch` gestubbt wie in `liga-laden.test.ts`)
  - football-data.org-Abrufe tragen `X-Auth-Token` mit dem Wert aus `process.env.FOOTBALL_DATA_API_KEY` (im Test mit `vi.stubEnv`
    gesetzt), Spielplan `next: { revalidate: 86400 }` ohne Etikett, Tabelle `next: { revalidate: 900, tags: ["premier-league"] }`.
  - Laufende Partie: ESPN-Tabelle wird frisch nachgeholt (wie bisher), football-data-Tabelle nicht (genau ein Abruf).
  - football-data.org antwortet 429 → `ladeLiga` liefert Partien, `titel: null`, `tabelle: null`.
  - Ohne `FOOTBALL_DATA_API_KEY` → kein Abruf bei football-data.org, `titel: null`, `tabelle: null`, `console.error`
    „FOOTBALL_DATA_API_KEY fehlt“.
  - `ladeDashboard` mit beiden Fußball-Kacheln: die JSON-Antwort enthält den Wert des Schlüssels nicht.
  - `KACHELN.map((k) => k.id)` ist `["bundesliga", "premier-league", "ki-news"]`.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: `quellen.ts` schreiben, `ladeLiga` darauf umstellen, Teams und Kachel in `lib/einstellungen.ts`**

  `TEAMS_PREMIER_LEAGUE` (ESPN, football-data.org, Name), abgeglichen an beiden Tabellen vom 2026-11-16: 359/57 Arsenal, 331/397
  Brighton, 382/65 Man City, 364/64 Liverpool, 363/61 Chelsea, 368/62 Everton, 349/1044 Bournemouth, 337/402 Brentford, 357/341 Leeds,
  362/58 Aston Villa, 367/73 Tottenham, 361/67 Newcastle, 306/322 Hull, 373/349 Ipswich, 370/63 Fulham, 393/351 Nottingham, 388/1076
  Coventry, 360/66 Man United, 366/71 Sunderland, 384/354 Crystal Palace.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Add Premier League tile with football-data.org schedule and table"
  ```

### Aufgabe 4: Ansicht ohne Tabelle

**Dateien:**
- Ändern: `lib/kacheln/liga/ansicht.tsx`, Test `__tests__/liga-ansicht.test.tsx`, `__tests__/page.test.tsx`

**Schnittstellen:**
- Nutzt: `LigaDaten` mit `tabelle: null` aus Aufgabe 2.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - `tabelle: null` → Abschnitt „Tabelle“ zeigt den Text „Tabelle gerade nicht erreichbar“, keine `<table>`.
  - Daten mit `art: "fussball-unbekannt"` in `page.test.tsx` → „Neue Kachel, bitte die Seite neu laden.“ (bestehenden Test nutzen,
    falls es ihn gibt).
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: in `LigaAnsicht` bei `tabelle === null` statt der Tabelle `<p className="text-gedaempft">Tabelle gerade nicht
  erreichbar</p>`**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Show hint when league table is unavailable"
  ```

### Aufgabe 5: Doku

**Dateien:** `CLAUDE.md` (Zeile „Datenquellen“, mit Skill `agent-texte-schreiben`), `docs/tools/ESPN.md` (Liga `eng.1`),
`docs/tools/football-data.org.md` (Abrufe, Speicher, Stand), `docs/Glossar.md` falls „Liga“ als Kachel-Art fehlt.

- [ ] **Schritt 1:** Zeile „Datenquellen“ der `CLAUDE.md` auf ADR 0011 bringen: ESPN für Partien von Bundesliga, Premier League und
  Champions League (sowie NFL), OpenLigaDB für den Spielplan der Bundesliga, football-data.org für Spieltag und Tabelle von Premier League
  und Champions League.
- [ ] **Schritt 2:** Tool-Notizen ergänzen (Abruf-Tabelle wie in `OpenLigaDB.md`).
- [ ] **Schritt 3: Prüfen und committen**

  ```bash
  npm run check
  git commit -m "Document league sources after Premier League"
  ```

### Aufgabe 6: Abnahme online

- [ ] **Schritt 1:** PR öffnen, `/code-review`, Funde mit dem Entwickler durchgehen.
- [ ] **Schritt 2: Abnahme in der Vorschau von Vercel** (Entwickler): einloggen, Premier League steht zwischen Bundesliga und KI-News,
  Überschrift „12. Spieltag · …“ (Nummer aus football-data.org, also vom Server bei Vercel aus erreichbar), Tabelle mit Arsenal und je
  2 Plätzen darum, deutsche Kurznamen, Logos. Bundesliga sieht aus wie vorher.
- [ ] **Schritt 3:** Nach dem Merge dieselbe Prüfung in Production.
