---
titel: "Plan: Bundesliga-Kachel"
status: aktiv
erstellt: 2026-11-08
tags: [plan, kacheln, sport, bundesliga, phase-3]
---

# Plan: Bundesliga-Kachel

**Ziel:** Eine Kachel „Bundesliga“ mit den Abschnitten Spieltag (Partien, live, mit Torschützen und Logos) und Tabelle (Ausschnitt um Mein
Team).

**Vorgehen:** Reine Lesefunktionen machen aus den Antworten von ESPN (Kalender, Tage, Tabelle) und OpenLigaDB (Spielplan) eigene Typen.
Reine Rechenfunktionen wählen den Spieltag, seine Überschrift und den Tabellen-Ausschnitt. `ladeBundesliga` holt alles mit `fetch` und
Zwischenspeicher, `BundesligaAnsicht` zeigt es. Die Kachel hängt sich wie die KI-News über `KACHELN`, `LADER` und `KachelInhalt` ein.

**Technik:** Next.js 16.4.3 (`fetch` mit `next.revalidate` und `next.tags`), React, Tailwind, Vitest, Testing Library. Keine neue Abhängigkeit.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 3, Schritt 1, und „Entscheidungen aus der
Befragung vom 2026-11-08“; [[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]; Mock vom 2026-11-08 (Variante A,
Kurznamen); [[projects/tages-dashboard/docs/Glossar|Glossar]] (Wettbewerb, Mein Team, Spieltag, Nachholspiel).

**Versuch:** Antworten ESPN und OpenLigaDB vom Server bei Vercel aus? Wegwerf-Branch `versuch/espn-vercel` mit einer Route
`app/api/versuch/route.ts`, die den Status von `site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard`,
`site.api.espn.com/apis/v2/sports/soccer/ger.1/standings` und `api.openligadb.de/getmatchdata/bl1/2026` als JSON zurückgibt. Push, die
Vorschau von Vercel öffnet der Entwickler im Browser (Vercel-Login, dann App-Login). Danach Branch löschen, ohne PR.
Ergebnis: **trägt** (2026-11-09). Wegen des Vercel-Logins vor der Vorschau lief der Versuch kurz auf der Live-Adresse (PR #47, entfernt mit
PR #48). Antwort vom Server: ESPN Kalender 200 in 70 ms, ESPN Tabelle 200 in 62 ms, OpenLigaDB Spielplan 200 in 621 ms (356 KB).

## Was die Quellen am 2026-11-08 liefern

Vom Mac abgerufen, ohne Schlüssel, alle Status 200.

| Abruf | Adresse | Wichtige Felder |
|---|---|---|
| Kalender | `site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard` | `leagues[0].calendar`: alle Tage mit Spielen, z. B. `"2026-11-06T08:00Z"` |
| Ein Tag | `…/ger.1/scoreboard?dates=20261108` | `events[]`: `date` (Anstoß, UTC), `status.type.state` (`pre`, `in`, `post`), `status.displayClock` (`"56'"`), `competitions[0].competitors[]` mit `homeAway`, `score` (Text), `team.id`, `team.shortDisplayName`, `team.logo`; `competitions[0].details[]` mit `scoringPlay`, `ownGoal`, `penaltyKick`, `clock.displayValue` (`"7'"`), `team.id`, `athletesInvolved[0].shortName` (`"A. García"`) |
| Tabelle | `site.api.espn.com/apis/v2/sports/soccer/ger.1/standings` | `children[0].standings.entries[]`: `team.id`, `team.shortDisplayName`, `team.logos[0].href`, `stats[]` mit `name` `rank`, `gamesPlayed`, `pointDifferential`, `points` (`value` als Zahl) |
| Spielplan | `api.openligadb.de/getmatchdata/bl1/2026` | 306 Partien mit `matchDateTime` (deutsche Zeit, ohne Zone) und `group.groupOrderID` (Nummer des Spieltags) |

Ein Datumsbereich (`dates=20261106-20261108`) ergibt bei ESPN Fehler 400, deshalb ein Abruf pro Tag.

## Feste Vorgaben

- Branch `feature/bundesliga`, ein PR für Plan, Code und Doku, vor dem Merge `/code-review`.
- Ordner `lib/kacheln/bundesliga/`. Glossar-Begriffe im Code: `spieltag`, `partie`, `meinTeam`, `nachholspiel`, `tabelle`.
- Kachel in `KACHELN` vor den KI-News: `{ id: "bundesliga", art: "bundesliga", titel: "Bundesliga", meinTeam: ["132"] }` (132 = Bayern bei ESPN).
- Kurznamen in `TEAMNAMEN: Record<string, string>` in `lib/einstellungen.ts`, nach id von ESPN (Stand 2026-11-08): 132 Bayern,
  124 Dortmund, 11420 Leipzig, 126 Freiburg, 131 Leverkusen, 137 Bremen, 10388 Elversberg, 134 Stuttgart, 125 Frankfurt, 127 HSV,
  2950 Mainz, 3307 Paderborn, 3841 Augsburg, 7911 Hoffenheim, 122 Köln, 598 Union, 133 Schalke, 268 Gladbach. Fehlt eine id: Kurzname
  von ESPN und `console.error("Team <id> fehlt in der Namensliste")`.
- Spieltag: aufeinanderfolgende Kalendertage bilden einen Block. Aktuell ist der früheste Block, dessen Ende (00:00 deutscher Zeit am
  zweiten Tag nach seinem letzten Tag) nach `jetzt` liegt. Gibt es keinen, der letzte Block.
- Überschrift: `<n>. Spieltag` mit der höchsten Nummer von OpenLigaDB an den Tagen des Blocks. Ist diese Nummer kleiner als die höchste
  Nummer vor dem ersten Tag des Blocks: `Nachholspiel`. Ohne Spielplan: keine Nummer, nur die Tage.
- Tage als Text: `Fr 6. – So 8. November`, ein Tag allein `Mi 18. November`, über das Monatsende `Fr 30. Oktober – So 1. November`.
- Partien: Mein Team zuerst, dann nach Anstoß, bei gleichem Anstoß nach Kurzname des Heimteams.
- Laufend heißt: `state === "in"`, oder `pre` mit Anstoß ≤ `jetzt` (angepfiffen, aber noch nicht gemeldet).
- Torschützen: Nachname = `shortName` ohne Initial bis zum ersten Leerzeichen nach einem Punkt (`"A. García"` → `"García"`), Minute aus
  `clock.displayValue` ohne Leerzeichen. Eigentor bekommt `" (ET)"`, Elfmeter `" (E)"`. Nach Spielzeit sortiert (Reihenfolge von ESPN).
- Tabelle: Platz 1 und Mein Team ± 2 Plätze. Fehlende Plätze dazwischen werden eine Lücke (`null`). Ohne Mein Team in der Tabelle: Plätze 1–5.
- Speicher (`next.revalidate`, Sekunden): Kalender 86400, Spielplan 86400, Tag und Tabelle 900. Zeigt ein Tag eine laufende Partie, wird
  dieser Tag und die Tabelle **ein zweites Mal mit 60** abgerufen (Next.js misst das Alter mit dem `revalidate` des Aufrufs,
  `incremental-cache/index.js:404`). Alle Abrufe mit `tags: [einstellung.id]` (ADR 0008), `User-Agent: Tages-Dashboard` und
  `AbortSignal.timeout(5000)`.
- Ausfälle: Kalender, ein Tag oder die Tabelle scheitern → die Kachel scheitert (Fehlerzustand, letzter Stand bleibt). Nur der Spielplan
  scheitert → Überschrift ohne Nummer, Fehler ins Server-Log.
- Logos: `<img>` mit `width`/`height` 20, `alt=""`, `loading="lazy"`, direkt von ESPN. `onError` blendet das Bild aus, der Platz bleibt.
- Aussehen nach Mock Variante A mit Kurznamen: eine Zeile pro Partie (links Anstoß `Sa 15:30` oder `● 56'` in Orange, dann Heim mit Logo,
  `–`, Gast mit Logo, rechts Ergebnis `1:2`, bei offener Partie leer), darunter graue Zeile `García 7' · Schick 85'` bei Partien mit Toren.
  Mein Team: orangener Balken links und leicht orangener Hintergrund, in Spieltag und Tabelle. Lücke als Zeile `···`.
- Vor jedem Commit `npm run check`. Commit-Nachrichten englisch, im Imperativ.

## Prüf-Schwerpunkte

1. Sonntagabend nach dem letzten Spiel und Montag → die Kachel zeigt noch den 9. Spieltag, ab Dienstag 00:00 den 10. → Aufgabe 2, Test
   „wählt den Block bis Mitternacht des Folgetags“.
2. Eine Partie ist angepfiffen, ESPN meldet noch `pre` → sie gilt als laufend, der Speicher wird kurz → Aufgabe 1, Test „pre nach Anstoß
   zählt als laufend“, und Aufgabe 3, Test „ruft einen Tag mit laufender Partie mit 60 nach“.
3. ESPN bricht bei einem Tag ab (Zeitlimit, 500) → die Kachel zeigt den Fehlerzustand, die KI-News laufen weiter → Aufgabe 3, Test „ein
   gescheiterter Tag lässt die Kachel scheitern“ (dass andere Kacheln weiterlaufen, prüft schon `kacheln-laden.test.ts`).
4. OpenLigaDB ist weg → Überschrift nur mit Tagen, Partien und Tabelle normal → Aufgabe 3, Test „ohne Spielplan keine Nummer“.
5. Ein Aufsteiger fehlt in `TEAMNAMEN` → Kurzname von ESPN und eine Zeile im Log, keine leere Zelle → Aufgabe 1, Test „fehlende id nimmt den
   Namen von ESPN und meldet sie“.

Unsichtbare Anforderungen: Die Kachel steht wie alle unter `/api/kacheln` hinter dem Login. Der Test „ohne Sitzung 401“ in
`__tests__/proxy.test.ts` deckt das schon für jede Route unter `/api/` ab, eine neue Sperre entsteht nicht.

## Dateien

- Neu: `lib/kacheln/bundesliga/typen.ts`: Typen `Partie`, `TeamStand`, `Tor`, `TabellenZeile`, `BundesligaDaten`.
- Neu: `lib/kacheln/bundesliga/espn.ts`: `leseKalender`, `leseTag`, `leseTabelle` (JSON von ESPN → eigene Typen, Namen aus `TEAMNAMEN`).
- Neu: `lib/kacheln/bundesliga/spielplan.ts`: `leseSpielplan` (JSON von OpenLigaDB → Nummer je Tag).
- Neu: `lib/kacheln/bundesliga/spieltag.ts`: `waehleSpieltag`, `spieltagTitel`, `sortierePartien`, `tabellenAusschnitt`.
- Neu: `lib/kacheln/bundesliga/laden.ts`: `ladeBundesliga` (Abrufe, Speicher, Zusammenbau).
- Neu: `lib/kacheln/bundesliga/kachel.ts`: `ladeBundesligaKachel` (wie `ki-news/kachel.ts`, damit Tests `ladeBundesliga` ersetzen können).
- Neu: `lib/kacheln/bundesliga/ansicht.tsx`: `BundesligaAnsicht`.
- Ändern: `lib/einstellungen.ts` (Typ `KachelEinstellung` als Union, `KACHELN`, `TEAMNAMEN`), `lib/kacheln/typen.ts` (`KachelDaten`),
  `lib/kacheln/laden.ts` (`LADER`), `app/dashboard.tsx` (`KachelInhalt`), `lib/zeit.ts` (`tageText`, `anstossText`).
- Tests: `__tests__/bundesliga-espn.test.ts`, `-spielplan.test.ts`, `-spieltag.test.ts`, `-laden.test.ts`, `-ansicht.test.tsx`,
  `__tests__/zeit.test.ts`, `__tests__/kacheln-laden.test.ts`, `__tests__/page.test.tsx`.
- Doku: `docs/tools/ESPN.md` und `docs/tools/OpenLigaDB.md` (neu, nach dem Muster der anderen Tool-Notizen), `docs/tools/Tools Übersicht.md`.

## Aufgaben

### Aufgabe 1: ESPN lesen

**Dateien:** Neu `lib/kacheln/bundesliga/typen.ts`, `lib/kacheln/bundesliga/espn.ts`; Ändern `lib/einstellungen.ts` (`TEAMNAMEN`); Test
`__tests__/bundesliga-espn.test.ts` mit Ausschnitten echter Antworten vom 2026-11-08 als Testdaten im Test.

**Schnittstellen:**
- Liefert:
  - `type TeamStand = { id: string; name: string; logo: string | null; tore: number | null }`
  - `type Tor = { text: string; teamId: string }` (`text` z. B. `"García 7'"`)
  - `type Partie = { id: string; anstoss: string; status: "vorher" | "laeuft" | "vorbei"; minute: string | null; heim: TeamStand; gast: TeamStand; tore: Tor[] }`
  - `type TabellenZeile = { platz: number; id: string; name: string; logo: string | null; spiele: number; differenz: number; punkte: number }`
  - `leseKalender(json: unknown): string[]` (Tage `YYYY-MM-DD`, aufsteigend)
  - `leseTag(json: unknown, jetzt: Date): Partie[]`
  - `leseTabelle(json: unknown): TabellenZeile[]`
  - Alle drei werfen `Error("Unerwartete Antwort von ESPN")`, wenn das Grundgerüst fehlt (`leagues`, `events`, `children`).

- [x] **Schritt 1: Fehlschlagende Tests schreiben**
  - „liest die Tage des Kalenders“: `"2026-11-06T08:00Z"` → `"2026-11-06"`.
  - „liest eine beendete Partie mit Toren“: Köln–Leverkusen → `status "vorbei"`, `heim.name "Köln"`, `heim.tore 1`, `gast.tore 2`,
    `tore[0].text "García 7'"`, `tore[0].teamId "131"`.
  - „Eigentor und Elfmeter bekommen einen Zusatz“: `"Müller 12' (ET)"`, `"Kane 30' (E)"`.
  - „liest eine laufende Partie“: `state "in"`, `displayClock "56'"` → `status "laeuft"`, `minute "56'"`.
  - „pre nach Anstoß zählt als laufend“: `state "pre"`, `date` vor `jetzt` → `status "laeuft"`, `minute null`.
  - „offene Partie hat keine Tore“: `state "pre"` in der Zukunft → `heim.tore null`.
  - „fehlende id nimmt den Namen von ESPN und meldet sie“: id `"999"`, `shortDisplayName "Neustadt"` → Name `"Neustadt"`, `console.error`
    mit `"Team 999 fehlt in der Namensliste"`.
  - „liest die Tabelle“: erste Zeile `{ platz: 1, id: "132", name: "Bayern", spiele: 9, differenz: 20, punkte: 21 }`, Logo aus `logos[0].href`.
  - „wirft bei falscher Form“: `leseTag({})` wirft.
- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
  `npx vitest run __tests__/bundesliga-espn.test.ts`, erwartet: FAIL, Modul fehlt.
- [x] **Schritt 3: Typen, `TEAMNAMEN` und die drei Lesefunktionen schreiben.**
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: `npm run check`, committen** „Read Bundesliga data from ESPN“

### Aufgabe 2: Spieltag wählen und benennen

**Dateien:** Neu `lib/kacheln/bundesliga/spielplan.ts`, `lib/kacheln/bundesliga/spieltag.ts`; Ändern `lib/zeit.ts`; Tests
`__tests__/bundesliga-spielplan.test.ts`, `__tests__/bundesliga-spieltag.test.ts`, `__tests__/zeit.test.ts`.

**Schnittstellen:**
- Nutzt: `Partie`, `TabellenZeile` aus Aufgabe 1.
- Liefert:
  - `leseSpielplan(json: unknown): Map<string, number>` (Tag `YYYY-MM-DD` → höchste Nummer an diesem Tag)
  - `waehleSpieltag(tage: string[], jetzt: Date): string[]`
  - `spieltagTitel(tage: string[], spielplan: Map<string, number> | null): string | null` (`"9. Spieltag"`, `"Nachholspiel"` oder `null`)
  - `sortierePartien(partien: Partie[], meinTeam: string[]): Partie[]`
  - `tabellenAusschnitt(tabelle: TabellenZeile[], meinTeam: string[]): (TabellenZeile | null)[]`
  - in `lib/zeit.ts`: `tageText(tage: string[]): string` und `anstossText(iso: string): string` (`"Sa 15:30"`, deutsche Zeit)

- [x] **Schritt 1: Fehlschlagende Tests schreiben**
  - „wählt den Block bis Mitternacht des Folgetags“: Tage 6., 7., 8., 20., 21., 22. November; `jetzt` = 9.11. 23:59 Berlin → 6.–8.;
    10.11. 00:00 Berlin → 20.–22.
  - „nach dem letzten Block bleibt der letzte“.
  - „Titel mit Nummer“: Tage 6.–8., Spielplan {6.→9, 7.→9, 8.→9} → `"9. Spieltag"`.
  - „Nachholspiel“: Tag 18.11. → 5, vorher 8.11. → 9 → `"Nachholspiel"`.
  - „ohne Spielplan keine Nummer“ → `null`.
  - „Mein Team zuerst, dann nach Anstoß“.
  - „Ausschnitt um Mein Team“: Mein Team Platz 6 von 18 → Plätze 1, `null`, 4, 5, 6, 7, 8; Mein Team Platz 1 → 1, 2, 3; Mein Team Platz 2
    → 1, 2, 3, 4 ohne Lücke; ohne Mein Team → 1–5.
  - `tageText`: `["2026-11-06","2026-11-07","2026-11-08"]` → `"Fr 6. – So 8. November"`; ein Tag → `"Mi 18. November"`; über das
    Monatsende → `"Fr 30. Oktober – So 1. November"`. `anstossText("2026-11-07T14:30:00Z")` → `"Sa 15:30"`.
  - `leseSpielplan`: zwei Partien am 2026-11-08 mit Nummer 9 und eine Nachholpartie mit 5 → `8.11. → 9`.
- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [x] **Schritt 3: Funktionen schreiben** (Werte wie in „Feste Vorgaben“).
- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [x] **Schritt 5: `npm run check`, committen** „Choose and name the current matchday“

### Aufgabe 3: Laden mit Speicher

**Dateien:** Neu `lib/kacheln/bundesliga/laden.ts`, `lib/kacheln/bundesliga/kachel.ts`; Ändern `lib/einstellungen.ts` (Union-Typ,
`KACHELN`), `lib/kacheln/typen.ts`, `lib/kacheln/laden.ts`; Tests `__tests__/bundesliga-laden.test.ts`, `__tests__/kacheln-laden.test.ts`.

**Schnittstellen:**
- Nutzt: alles aus Aufgabe 1 und 2.
- Liefert:
  - `type BundesligaDaten = { art: "bundesliga"; titel: string | null; tage: string[]; partien: Partie[]; tabelle: (TabellenZeile | null)[]; meinTeam: string[] }`
  - `KachelDaten = KiNewsDaten | BundesligaDaten` (bisheriger Typ wird `KiNewsDaten`)
  - `KachelEinstellung = { id: string; titel: string } & ({ art: "ki-news" } | { art: "bundesliga"; meinTeam: string[] })`
  - `ladeBundesliga(einstellung: BundesligaEinstellung, jetzt: Date): Promise<BundesligaDaten>`
  - `ladeBundesligaKachel(einstellung, jetzt): Promise<{ daten: KachelDaten }>`

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** (`fetch` als Attrappe, Antworten je Adresse)
  - „baut die Daten aus Kalender, Tagen, Tabelle und Spielplan“: ein Abruf je Tag des Blocks (`dates=20261106` usw.), `titel "9. Spieltag"`.
  - „setzt Speicher, Etikett und Zeitlimit“: Kalender `revalidate 86400`, Tag `900`, alle `tags: ["bundesliga"]`, `AbortSignal.timeout(5000)`.
  - „ruft einen Tag mit laufender Partie mit 60 nach“: Tag mit `state "in"` → zweiter Abruf derselben Adresse mit `revalidate 60`, ebenso
    die Tabelle. Ohne laufende Partie kein zweiter Abruf.
  - „ein gescheiterter Tag lässt die Kachel scheitern“: Status 500 für einen Tag → `ladeBundesliga` wirft.
  - „ohne Spielplan keine Nummer“: OpenLigaDB wirft → `titel null`, `console.error`, kein Wurf.
  - in `kacheln-laden.test.ts`: „die Bundesliga-Kachel ruft ladeBundesliga mit Einstellung und Zeit“.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Typen umstellen, `ladeBundesliga`, `ladeBundesligaKachel`, Eintrag in `LADER` und `KACHELN`.** Bestehende Stellen, die
  `daten.absender` lesen, auf `KiNewsDaten` einengen.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: `npm run check`, committen** „Load Bundesliga tile with cache“

### Aufgabe 4: Ansicht

**Dateien:** Neu `lib/kacheln/bundesliga/ansicht.tsx`; Ändern `app/dashboard.tsx`; Tests `__tests__/bundesliga-ansicht.test.tsx`,
`__tests__/page.test.tsx`.

**Schnittstellen:**
- Nutzt: `BundesligaDaten` (Aufgabe 3), `Abschnitt` aus `lib/kacheln/kachel.tsx`, `tageText`, `anstossText` (Aufgabe 2).
- Liefert: `BundesligaAnsicht({ daten }: { daten: BundesligaDaten })`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - „Überschrift mit Nummer und Tagen“: Abschnitt `"9. Spieltag · Fr 6. – So 8. November"`; ohne Nummer nur `"Fr 6. – So 8. November"`.
  - „eine Partie zeigt Anstoß, Teams und Ergebnis“: `"Sa 15:30"`, `"Mainz"`, `"Bayern"`, `"1:2"`.
  - „laufende Partie zeigt die Minute“: `"56'"` und ein Element mit `aria-label "live"`.
  - „Torschützen in einer Zeile“: `"García 7' · Schick 85' · El Mala 90+2'"`.
  - „Mein Team ist markiert“: Zeile der Partie und der Tabelle haben `data-mein-team`.
  - „Lücke in der Tabelle“: `null` → Zeile `"···"`.
  - „ein Logo ohne Bild verschwindet“: `fireEvent.error` auf das `<img>` → nicht mehr sichtbar.
  - in `page.test.tsx`: „zeigt die Bundesliga-Kachel“ mit einer Antwort aus beiden Kacheln.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Ansicht nach Mock Variante A mit Kurznamen bauen, `case "bundesliga"` in `KachelInhalt`.**
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Im Browser ansehen** (`npm run dev`, angemeldet), iPhone-Breite 390 px in den Entwicklerwerkzeugen: jede Partie eine
  Zeile, nichts läuft über den Rand.
- [ ] **Schritt 6: `npm run check`, committen** „Show Bundesliga tile“

### Aufgabe 5: Doku und Abnahme

**Dateien:** Neu `docs/tools/ESPN.md`, `docs/tools/OpenLigaDB.md`; Ändern `docs/tools/Tools Übersicht.md`, `docs/Projektvision.md`
(Schritt 1 als erledigt mit PR-Nummer), dieser Plan (Ergebnis des Versuchs, Haken).

- [ ] **Schritt 1: Tool-Notizen schreiben** (Adressen und Felder aus der Tabelle oben, Fehler 400 beim Datumsbereich, inoffiziell).
- [ ] **Schritt 2: `npm run check`, PR öffnen, `/code-review`, Funde mit dem Entwickler durchgehen**
- [ ] **Schritt 3: Nach dem Merge Abnahme durch den Entwickler** auf der Live-Adresse, iPhone und Mac: Spieltag, Tabelle, Logos, bei einem
  laufenden Spiel Minute und Torschützen innerhalb von rund 2 Minuten.
