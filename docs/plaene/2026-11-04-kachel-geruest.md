---
titel: "Plan: Kachel-Gerüst"
status: aktiv
erstellt: 2026-11-04
tags: [plan, kacheln, phase-1]
---

# Plan: Kachel-Gerüst

**Ziel:** Die Startseite zeigt die Kacheln aus einer Einstellungsdatei im Raster, aktualisiert sie jede Minute, solange sie
sichtbar ist, und zeigt bei einem Fehler je Kachel den letzten Stand weiter an. Einzige echte Kachel ist die Testkachel.

**Vorgehen:** Eine geschützte Schnittstelle `GET /api/kacheln` lädt alle Kacheln auf dem Server und liefert sie als JSON. Der
Browser fragt sie jede Minute ab und führt die Antwort mit dem bisherigen Stand zusammen. Nicht `router.refresh()`: Das
wechselt laut Quellcode von Next.js 16.4.3 bei Netzfehler oder Status 500 zum vollen Neuladen der Seite, der letzte Stand wäre weg.

**Technik:** Next.js 16 (Route Handler, `connection()`, `next/font`), Tailwind 4 (`@theme`), Vitest, Testing Library.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 1, Schritt 5, und
[[projects/tages-dashboard/docs/Nächste Session|Nächste Session]]. Mock vom 2026-11-04 freigegeben: Variante B (CSS-Grid),
letzten Stand merken.

## Feste Vorgaben

- Branch `feature/kachel-geruest`, ein PR für Plan, Code und Doku, vor dem Merge `/code-review`.
- Keine neue Abhängigkeit. Keine Server Action, keine Datenbank, keine Offline-Speicherung: Der letzte Stand liegt nur im
  Speicher der offenen Seite.
- Farben als Design-Token in `@theme`: `grund` #0E1013, `flaeche` #171A1F, `rand` #262A31, `rand-stark` #434956, `knopf`
  #22262D, `text` #ECEEF1, `gedaempft` #9AA3AE, `akzent` #FF8A3D, `info` #6CB2FF, `fehler` #F87171 (für den Fehlertext des Logins). Schriften: Barlow (400, 500, 600) und
  Barlow Condensed (600, 700).
- Maße wie im Mock: Inhalt max. 1320 px, Kachel `rounded-2xl`, Innenabstand 16 px, Abstand 14 px, Knöpfe mind. 44 px hoch.
- Raster: `grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4 items-start`. `min(…,100%)` verhindert auf
  schmalen iPhones waagerechtes Scrollen.
- Uhrzeiten und Datum immer in `Europe/Berlin`.
- Begriffe aus dem Glossar: Kachel, Abschnitt. Vor jedem Commit `npm run check`. Commit-Nachrichten englisch, im Imperativ.

## Prüf-Schwerpunkte

1. Netz fällt bei offener Seite aus → Seite bleibt stehen, Daten bleiben, Hinweis mit Uhrzeit → Aufgabe 4 und 5, Aufgabe 8.
2. Eine Kachel wirft einen Fehler → nur sie zeigt den Hinweis, die andere wird frisch → Aufgabe 2 und 4.
3. Sitzung läuft bei offener Seite ab → Wechsel zum Login statt Fehlerhinweis → Aufgabe 5.
4. Quelle erholt sich → Hinweis verschwindet, neue Daten → Aufgabe 4.
5. Fenster ausgeblendet → keine Abfragen; wieder sichtbar nach über einer Minute → sofort eine → Aufgabe 6, Aufgabe 9.

## Dateien

- Neu: `lib/einstellungen.ts`: Kacheln und ihre Reihenfolge
- Neu: `lib/zeit.ts`: Uhrzeit und Datum in deutscher Zeit
- Neu: `lib/kacheln/typen.ts`: gemeinsame Typen
- Neu: `lib/kacheln/laden.ts`: lädt alle Kacheln auf dem Server, je Kachel getrennt
- Neu: `lib/kacheln/test/laden.ts`, `lib/kacheln/test/ansicht.tsx`: Testkachel, verschwindet in Phase 2
- Neu: `app/api/kacheln/route.ts`: Schnittstelle für den Browser
- Neu: `lib/kacheln/stand.ts`: führt Antwort und bisherigen Stand zusammen
- Neu: `lib/kacheln/abruf.ts`: Abruf im Browser
- Neu: `lib/kacheln/use-aktualisierung.ts`: Takt und Sichtbarkeit
- Neu: `lib/kacheln/kachel.tsx`: `Kachel`, `Abschnitt`, `FehlerHinweis`
- Neu: `app/dashboard.tsx`: Kopf und Raster (Client Component)
- Ändern: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/login/login-formular.tsx`, `app/login/page.tsx`
- Test: je Baustein in `__tests__/`, geändert `layout.test.ts`, `page.test.tsx`
- Doku: neu `docs/adr/0004-kacheln-ueber-schnittstelle.md`, `docs/tools/Next.js.md`, `docs/Projektvision.md`, dieser Plan

## Bewusst nicht in diesem Schritt

- **Gemeinsame Anmeldeprüfung für Server Actions:** Es entsteht keine private Action. Die Schnittstelle schützt der Proxy, der
  Test `/api/x` in `__tests__/proxy.test.ts` deckt das schon ab.
- **`BESITZER_ID` zieht nicht um:** Der Wert ist keine Einstellung aus Architekturprinzip 6, und ein Umzug bringt nichts.
- **Zeitlimit je Kachel:** Die Testkachel kann nicht hängen. Kommt in Phase 2 mit den ersten echten Quellen.
- **Zwischenspeicher der Quellen, Mein Team, Live-Pille:** kommen mit den Kacheln, die sie brauchen.

## Aufgaben

### Aufgabe 1: Aussehen zentral festlegen

**Dateien:** Ändern `app/globals.css`, `app/layout.tsx`, `app/login/login-formular.tsx`, `app/login/page.tsx`; Test
`__tests__/layout.test.ts`

**Schnittstellen:** Liefert die Tailwind-Klassen `bg-grund`, `text-gedaempft`, `font-titel` (Barlow Condensed) usw.

- [x] **Schritt 1: Test** „globals.css legt die Design-Token fest“ liest die Datei und prüft
      `--color-grund: #0e1013` und `--color-akzent: #ff8a3d`. Im Mock von `next/font/google` Barlow und Barlow_Condensed statt Geist.
- [x] **Schritt 2:** `npx vitest run __tests__/layout.test.ts`. Erwartet: FAIL beim neuen Test.
- [x] **Schritt 3: Umsetzen.** Token nach „Feste Vorgaben“, nur dunkel, `prefers-color-scheme` und Geist entfernen. Das Login
      von `zinc`- und `dark:`-Klassen auf Token umstellen, sonst ist es auf hell eingestellten Geräten schlecht lesbar.
- [x] **Schritt 4:** Test erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Add design tokens and Barlow fonts`.

### Aufgabe 2: Einstellungen und Laden auf dem Server

**Dateien:** Neu `lib/einstellungen.ts`, `lib/zeit.ts`, `lib/kacheln/typen.ts`, `lib/kacheln/laden.ts`,
`lib/kacheln/test/laden.ts`; Test `__tests__/zeit.test.ts`, `__tests__/kacheln-laden.test.ts`

**Schnittstellen, Liefert:**

```ts
// lib/einstellungen.ts
type KachelEinstellung = { id: string; art: "test"; titel: string; fehlerAusloesen: boolean };
const KACHELN: KachelEinstellung[]; // [{ id: "test", art: "test", titel: "Testkachel", fehlerAusloesen: false }]

// lib/zeit.ts
uhrzeit(iso: string): string;             // "14:32"
uhrzeitMitSekunden(iso: string): string;  // "14:32:07"
datum(iso: string): string;               // "Sonntag, 8. November"

// lib/kacheln/typen.ts
type KachelDaten = { art: "test"; uhrzeit: string }; // später eine Union
type KachelAntwort = { id: string; titel: string } & (
  | { status: "ok"; zusatz?: string; daten: KachelDaten; stand: string }
  | { status: "fehler" });
type DashboardAntwort = { zeit: string; kacheln: KachelAntwort[] };
type KachelAnzeige = { id: string; titel: string; zusatz?: string;
  daten: KachelDaten | null; stand: string | null; fehler: boolean };

// lib/kacheln/test/laden.ts
ladeTestkachel(einstellung: KachelEinstellung, jetzt: Date):
  Promise<{ zusatz?: string; daten: KachelDaten }>; // Zusatz "Server"

// lib/kacheln/laden.ts
ladeDashboard(einstellungen?: KachelEinstellung[], jetzt?: Date): Promise<DashboardAntwort>;
```

- [x] **Schritt 1: Tests.**
  - `uhrzeitMitSekunden("2026-11-08T13:32:07Z")` ist `"14:32:07"`, im Sommer `uhrzeit("2026-07-01T12:00:00Z")` ist `"14:00"`
  - kurz nach Mitternacht: `uhrzeit("2026-11-07T23:05:00Z")` ist `"00:05"` (nicht `"24:05"`) und `datum(…)` ist `"Sonntag, 8. November"`
  - `ladeDashboard` mit zwei Kacheln, die erste mit `fehlerAusloesen: true`: erste hat `status: "fehler"`, zweite `status: "ok"`
    mit `uhrzeit`, Reihenfolge wie in den Einstellungen
  - das Ergebnis enthält den Fehlertext nicht (`JSON.stringify` enthält weder „Testfehler“ noch `stack`)
- [x] **Schritt 2:** `npx vitest run __tests__/zeit.test.ts __tests__/kacheln-laden.test.ts`. Erwartet: FAIL, Module fehlen.
- [x] **Schritt 3: Umsetzen.** `ladeDashboard` nimmt `Promise.all`, jede Kachel fängt ihren Fehler selbst ab (gleiche Wirkung wie
      das zuerst geplante `Promise.allSettled`, aber mit Zugriff auf die Einstellung), die Zuordnung von `art` zur Ladefunktion steht als
      Objekt in `laden.ts`. Fehler landen mit `console.error` im Server-Log. `ladeTestkachel` wirft „Testfehler“ bei
      `fehlerAusloesen`. `Intl.DateTimeFormat` mit `hourCycle: "h23"`.
- [x] **Schritt 4:** Tests erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Load tiles on the server with isolated errors`.

### Aufgabe 3: Schnittstelle `GET /api/kacheln`

**Dateien:** Neu `app/api/kacheln/route.ts`; Test `__tests__/api-kacheln.test.ts` (`// @vitest-environment node`)

**Schnittstellen:** Nutzt `ladeDashboard()`. Liefert JSON vom Typ `DashboardAntwort`.

- [x] **Schritt 1: Tests** (`connection` aus `next/server` als Attrappe): Status 200 mit `kacheln` als Liste, Header
      `Cache-Control: no-store`, und mit einer fehlerhaften Kachel (Attrappe von `@/lib/einstellungen`) trotzdem Status 200.
- [x] **Schritt 2:** `npx vitest run __tests__/api-kacheln.test.ts`. Erwartet: FAIL.
- [x] **Schritt 3: `export async function GET(): Promise<Response>`.** Beginnt mit `await connection()`: Mit `cacheComponents`
      entstünde die Antwort sonst schon beim Bauen, und die Uhrzeit bliebe stehen.
- [x] **Schritt 4:** Test erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Add tiles endpoint`.

### Aufgabe 4: Letzten Stand merken

**Dateien:** Neu `lib/kacheln/stand.ts`; Test `__tests__/kacheln-stand.test.ts`

**Schnittstellen:** Liefert `neuerStand(bisher: KachelAnzeige[], antwort: DashboardAntwort | null): KachelAnzeige[]`.
`null` heißt: Abruf gescheitert.

- [x] **Schritt 1: Tests.**
  - `status: "ok"` ersetzt die Daten und setzt `fehler: false`
  - `status: "fehler"` behält `daten`, `zusatz` und `stand` und setzt `fehler: true`, andere Kacheln bleiben unberührt
  - `status: "fehler"` ohne bisherigen Stand: `daten: null`, `stand: null`, `fehler: true`
  - `null` setzt alle auf `fehler: true` und behält die Daten
  - `ok` nach `fehler`: Hinweis weg, neue Daten
  - eine Kachel, die nicht mehr in der Antwort steht, verschwindet; die Reihenfolge folgt der Antwort
- [x] **Schritt 2:** `npx vitest run __tests__/kacheln-stand.test.ts`. Erwartet: FAIL.
- [x] **Schritt 3:** Reine Funktion ohne React umsetzen.
- [x] **Schritt 4:** Test erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Keep last good state per tile`.

### Aufgabe 5: Abruf im Browser

**Dateien:** Neu `lib/kacheln/abruf.ts`; Test `__tests__/kacheln-abruf.test.ts`

**Schnittstellen:** Liefert `holeDashboard(): Promise<DashboardAntwort | "abgemeldet" | null>`.

- [x] **Schritt 1: Tests** mit Attrappe von `fetch`: Status 200 liefert die Daten; `redirected: true` liefert `"abgemeldet"`
      (der Proxy leitet ohne Sitzung zum Login, `fetch` folgt und bekäme HTML); Status 500, kein JSON und ein abgelehntes `fetch`
      liefern `null`, ohne zu werfen.
- [x] **Schritt 2:** `npx vitest run __tests__/kacheln-abruf.test.ts`. Erwartet: FAIL.
- [x] **Schritt 3:** `fetch("/api/kacheln", { cache: "no-store", signal: AbortSignal.timeout(20_000) })`.
- [x] **Schritt 4:** Test erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Fetch tiles from the browser`.

### Aufgabe 6: Takt und Sichtbarkeit

**Dateien:** Neu `lib/kacheln/use-aktualisierung.ts`; Test `__tests__/use-aktualisierung.test.tsx`

**Schnittstellen:** Liefert `useAktualisierung(abrufen: () => void): void`, Takt 60 000 ms.

- [x] **Schritt 1: Tests** mit `renderHook`, künstlicher Uhr und `vi.spyOn(document, "visibilityState", "get")`:
  - ruft beim Start einmal und nach 60 s erneut ab
  - verborgen: keine Abfrage
  - wieder sichtbar nach 5 Minuten: sofort eine Abfrage
  - wieder sichtbar nach 10 s: keine zusätzliche Abfrage
  - nach dem Entfernen der Komponente: keine Abfrage mehr
- [x] **Schritt 2:** `npx vitest run __tests__/use-aktualisierung.test.tsx`. Erwartet: FAIL.
- [x] **Schritt 3: Umsetzen.** Der Takt fragt immer ab, wenn die Seite sichtbar ist, ohne Prüfung der vergangenen Zeit: Sonst
      entfiele durch kleine Zeitabweichungen jede zweite Abfrage. Nur `visibilitychange` prüft, ob 60 s vergangen sind.
- [x] **Schritt 4:** Test erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Refresh tiles every minute while visible`.

### Aufgabe 7: Kachel, Testkachel und Startseite

**Dateien:** Neu `lib/kacheln/kachel.tsx`, `lib/kacheln/test/ansicht.tsx`, `app/dashboard.tsx`; Ändern `app/page.tsx`; Test
`__tests__/kachel.test.tsx`, `__tests__/page.test.tsx`

**Schnittstellen:**

```ts
Kachel(props: { kachel: KachelAnzeige; erneutVersuchen: () => void; children?: ReactNode }); // Titel, Zusatz, Hinweis, Inhalt
Abschnitt(props: { titel: string; children: ReactNode });
FehlerHinweis(props: { stand: string | null; erneutVersuchen: () => void });
TestAnsicht(props: { daten: KachelDaten });   // Abschnitte „Server-Uhrzeit“ und „Einstellungen“
Dashboard();                                   // ohne Props, Client Component
```

- [x] **Schritt 1: Tests.**
  - `Kachel` ohne Fehler zeigt Titel und Inhalt, aber keinen Hinweis
  - mit Fehler und Stand zeigt sie Inhalt und „Daten gerade nicht erreichbar. Letzter Stand von 14:31, neuer Versuch in 1 Minute.“
  - mit Fehler ohne Stand: „Daten gerade nicht erreichbar. Neuer Versuch in 1 Minute.“
  - „Jetzt erneut versuchen“ ruft `erneutVersuchen`
  - Startseite (`holeDashboard` als Attrappe): zeigt `heading` Stufe 1 mit dem Datum, „Aktualisiert 14:32“, „Testkachel“, „Abmelden“
  - Antwort `"abgemeldet"`: `router.push("/login")`
  - erster Abruf scheitert: `FehlerHinweis` ohne Stand statt leerer Seite
  - nach erneutem Versuch verschwindet der Hinweis
  - scheitern alle Kacheln, nennt der Kopf keine neue Aktualisierung
- [x] **Schritt 2:** `npx vitest run __tests__/kachel.test.tsx __tests__/page.test.tsx`. Erwartet: FAIL.
- [x] **Schritt 3: Umsetzen.** `Dashboard` hält den Stand mit `neuerStand`, ruft über `useAktualisierung` ab und überspringt einen
      Abruf, solange der vorige läuft. „Aktualisiert“ und Datum stammen aus `zeit` der letzten erfolgreichen Antwort. Vor dem ersten
      Abruf steht „Lädt …“. Die Wahl der Ansicht ist ein `switch` über `daten.art`. `app/page.tsx` rendert nur `<Dashboard />`.
- [x] **Schritt 4:** Tests erneut. Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Show tiles in a grid on the home page`.

### Aufgabe 8: Im Browser prüfen und dokumentieren

**Dateien:** Neu `docs/adr/0004-kacheln-ueber-schnittstelle.md`; Ändern `docs/tools/Next.js.md`, `docs/Projektvision.md`, dieser Plan

- [x] **Schritt 1: Mit `npm run dev` prüfen.** Abweichung: lief ohne Login, weil das Passwort Claude nicht vorliegt, mit vorübergehend
      entferntem `proxy.ts` auf `127.0.0.1` und Chrome. Die Prüfung mit echter Sitzung und Proxy folgt in Aufgabe 9, Schritt 1.
  - Breite 390 und 1280 px sehen aus wie der Mock (Screenshots angesehen, kein Vergleich Bild an Bild)
  - Uhrzeit springt nach einer Minute
  - `fehlerAusloesen` auf `true` und zurück: Hinweis erscheint mit letztem Stand und verschwindet
  - Netz in den Entwicklerwerkzeugen aus: Seite bleibt stehen, Daten bleiben
- [x] **Schritt 2: `npm run build`.** Erwartet: fehlerfrei, `/api/kacheln` als dynamisch markiert.
- [x] **Schritt 3: Doku.** ADR 0004 (Schnittstelle gegen `router.refresh()`, Grid gegen CSS-Spalten), die Falle mit
      `cacheComponents` in `Next.js.md`, Schritt 5 im Fahrplan als „Code fertig, Gerätetest steht aus“ vermerken. „Erledigt“ folgt
      nach Aufgabe 9.
- [ ] **Schritt 4:** `npm run check` und Agent `plan-pruefer`, committen: `Document tile scaffold` und PR öffnen. Vor dem Merge
      `/code-review`. Der Commit entstand vor der Prüfung, ihre Funde kamen in einem Folge-Commit dazu.

### Aufgabe 9: Prüfung auf den Geräten (nach dem Merge)

Vorschauen liegen hinter dem Vercel-Login, deshalb erst auf der echten Adresse.

- [ ] **Schritt 1:** iPhone und iPad, angemeldet: Die Testkachel lädt mit echter Sitzung und Proxy, die Spaltenzahl stimmt (WebKit, im Mock nur
      Chrome geprüft). App in den Hintergrund und nach über einer Minute zurück: Uhrzeit sofort neu. Im Browser abmelden, während
      ein zweites Fenster offen bleibt: Dieses wechselt spätestens nach einer Minute zum Login (Prüf-Schwerpunkt 3 im echten Ablauf).
- [ ] **Schritt 2:** Mac-App ausblenden, nach über einer Minute einblenden: Uhrzeit sofort neu. In den Vercel-Logs prüfen, dass
      ausgeblendet keine Abfragen ankommen. Falls doch: Die Hülle meldet die Sichtbarkeit nicht, Fund 7 aus PR #25 bleibt dann offen
      und kommt in die Übergabe.
- [ ] **Schritt 3:** Danach Phase 1 abschließen (Regel „Phasenwechsel“), vorher einmal den Cloudflare Security Audit Skill.
