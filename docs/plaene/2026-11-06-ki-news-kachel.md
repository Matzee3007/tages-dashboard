---
titel: "Plan: KI-News-Kachel"
status: aktiv
erstellt: 2026-11-06
tags: [plan, kacheln, ki-news, phase-2]
---

# Plan: KI-News-Kachel

**Ziel:** Die Testkachel weicht der KI-News-Kachel. Sie zeigt je Absender die neuesten Meldungen der letzten 7 Tage als Links
zum Original, frische Meldungen mit orangem Punkt.

**Vorgehen:** Der Server lädt die Absender mit dem vorhandenen `ladeKiNews` (Schritt 1) und gibt sie als Daten der Kachel
`art: "ki-news"` aus. Der Browser rechnet das Alter jeder Meldung selbst aus, damit „vor 3 Std.“ bei jeder Aktualisierung stimmt.
Die Testkachel wird samt Code entfernt. Ihre Rolle in den Tests übernimmt eine Attrappe von `ladeKiNews`.

**Technik:** Next.js 16, Tailwind 4, `Intl.DateTimeFormat`, Vitest, Testing Library. Keine neue Abhängigkeit.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 2, Schritt 3, und
[[projects/tages-dashboard/docs/Nächste Session|Nächste Session]]. Mock vom 2026-11-06 freigegeben: Variante A (kompakte Liste)
mit dem orangen Punkt aus Variante C. Als frisch gilt eine Meldung, die jünger als 24 Stunden ist.

## Feste Vorgaben

- Branch `feature/ki-news-kachel`, ein PR für Plan, Code und Doku, vor dem Merge `/code-review`.
- Kachel: `id: "ki-news"`, `titel: "KI-News"`, kein `zusatz`. Der Zusatz „9 Absender“ aus dem Mock war erfunden und trägt keine Information.
- Inhalt wie im Projekt: ein `Abschnitt` je Absender mit neuer Meldung (höchstens 3, die neueste oben, liefert schon `ladeAbsender`).
  Danach jeder Absender ohne neue Meldung in einer eigenen Zeile. Die Reihenfolge kommt unverändert aus `ladeKiNews`.
- Meldung: ein Link über die ganze Zeile, mindestens 44 px hoch (`min-h-11`), `target="_blank" rel="noopener noreferrer"`. Links der Punkt
  (8 px, `bg-akzent` nur bei frischen Meldungen, sonst durchsichtig, damit die Titel bündig bleiben), daneben der Titel (15 px,
  `font-medium`, darf umbrechen, `min-w-0`), rechts das Alter (13 px, `text-gedaempft`, `whitespace-nowrap`, `shrink-0`). Zwischen den
  Zeilen eines Absenders eine Linie `border-rand`.
- Alter: unter 1 Std. „vor X Min.“ (mindestens 1), unter 24 Std. „vor X Std.“ (abgerundet), sonst nach Kalendertagen in
  `Europe/Berlin`: 1 Tag „gestern“, sonst „vor X Tagen“. Frisch heißt jünger als 24 Std., Text und Punkt passen also immer zusammen.
- Zeile ohne neue Meldung: links der Name (12 px, `font-semibold`, uppercase, gedämpft), rechts „zuletzt <Alter>“, ohne bekannte Meldung
  „noch keine Meldung“, bei `erreichbar: false` „nicht erreichbar“ in `text-fehler`. Über dem Block eine Linie `border-rand`.
- `stand` bleibt die Zeit des Abrufs (Fund aus PR #30, **hingenommen**): Er erscheint nur im Fehlerhinweis, und die Meldungen sind
  höchstens 15 Minuten älter (Zwischenspeicher, ADR 0005). Das Alter der Meldungen selbst steht in jeder Zeile.
- Begriffe aus dem Glossar: Kachel, Abschnitt, Absender, Meldung. Vor jedem Commit `npm run check`. Commit-Nachrichten englisch, im Imperativ.

## Prüf-Schwerpunkte

1. Ein Absender ist nicht erreichbar, die anderen schon → nur seine Zeile ist rot, der Rest normal → Aufgabe 3, Test „ein nicht erreichbarer Absender …“.
2. Keiner hat in 7 Tagen etwas veröffentlicht → nur die Zeilen ohne neue Meldung, kein leerer Abschnitt → Aufgabe 3, Test „ohne neue Meldung …“.
3. Meldung kurz nach Mitternacht deutscher Zeit, in UTC noch am Vortag → das Alter zählt deutsche Kalendertage → Aufgabe 1, Test „zählt Kalendertage …“.
4. Langer Titel auf dem iPhone → er bricht um, das Alter bleibt rechts in einer Zeile → Aufgabe 4, Screenshot in 390 px.
5. Meldung genau 24 Std. alt → nicht mehr frisch und „gestern“, nicht „vor 24 Std.“ → Aufgabe 1, Test „genau 24 Stunden …“.

## Dateien

| Datei | Aufgabe |
|---|---|
| `lib/zeit.ts` | neu `alterText`, `istFrisch`; `uhrzeitMitSekunden` entfällt (nur die Testkachel nutzte es) |
| `lib/kacheln/typen.ts` | `KachelDaten` wird `{ art: "ki-news"; absender: AbsenderStand[] }` |
| `lib/einstellungen.ts` | `KachelEinstellung` ohne `fehlerAusloesen`, `art: "ki-news"`; `KACHELN` mit der KI-News-Kachel |
| `lib/kacheln/ki-news/kachel.ts` | neu `ladeKiNewsKachel` als Lader für `lib/kacheln/laden.ts`. Abweichung: eigene Datei statt `ki-news/laden.ts`, weil eine Attrappe ein ganzes Modul ersetzt und `ladeKiNews` sonst im Test nicht austauschbar wäre |
| `lib/kacheln/laden.ts` | `LADER` mit `"ki-news"` statt `test` |
| `lib/kacheln/ki-news/ansicht.tsx` | neu `KiNewsAnsicht` |
| `app/dashboard.tsx` | `KachelInhalt` zeigt `KiNewsAnsicht` |
| `lib/kacheln/test/` | entfällt |

## Aufgaben

### Aufgabe 1: Alter und Frische einer Meldung

**Dateien:**
- Ändern: `lib/zeit.ts`
- Test: `__tests__/zeit.test.ts`

**Schnittstellen:**
- Liefert: `alterText(iso: string, jetzt: Date = new Date()): string`, `istFrisch(iso: string, jetzt: Date = new Date()): boolean`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const JETZT = new Date("2026-11-08T13:32:00Z"); // 14:32 in Berlin

test("nennt Minuten und Stunden unter einem Tag", () => {
  expect(alterText("2026-11-08T13:31:50Z", JETZT)).toBe("vor 1 Min.");
  expect(alterText("2026-11-08T13:00:00Z", JETZT)).toBe("vor 32 Min.");
  expect(alterText("2026-11-08T10:02:00Z", JETZT)).toBe("vor 3 Std.");
  expect(alterText("2026-11-07T14:00:00Z", JETZT)).toBe("vor 23 Std.");
});

test("nennt ab 24 Stunden Kalendertage", () => {
  expect(alterText("2026-11-07T12:00:00Z", JETZT)).toBe("gestern");
  expect(alterText("2026-11-04T08:00:00Z", JETZT)).toBe("vor 4 Tagen");
});

test("zählt Kalendertage in deutscher Zeit", () => {
  // 00:30 in Berlin am 7.11., in UTC noch der 6.11.
  expect(alterText("2026-11-06T23:30:00Z", new Date("2026-11-08T00:45:00Z"))).toBe("gestern");
});

test("genau 24 Stunden sind nicht mehr frisch", () => {
  expect(istFrisch("2026-11-07T13:33:00Z", JETZT)).toBe(true);
  expect(istFrisch("2026-11-07T13:32:00Z", JETZT)).toBe(false);
  expect(alterText("2026-11-07T13:32:00Z", JETZT)).toBe("gestern");
});
```

- [x] **Schritt 2: `npx vitest run __tests__/zeit.test.ts`.** Erwartet: FAIL, `alterText` und `istFrisch` gibt es nicht.
- [x] **Schritt 3: `alterText` und `istFrisch` in `lib/zeit.ts`.** Kalendertage über einen eigenen `Intl.DateTimeFormat` mit
      `timeZone: "Europe/Berlin"` und Format `JJJJ-MM-TT` (z. B. `en-CA`), beide Tage als UTC-Mitternacht parsen, Abstand in Tagen runden.
- [x] **Schritt 4: `npx vitest run __tests__/zeit.test.ts`.** Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Add age text for news items`.

### Aufgabe 2: KI-News-Kachel statt Testkachel auf dem Server

**Dateien:**
- Neu: `lib/kacheln/ki-news/kachel.ts`
- Ändern: `lib/kacheln/typen.ts`, `lib/einstellungen.ts`, `lib/kacheln/laden.ts`, `app/dashboard.tsx`
  (nur der Zweig `test` fällt weg, damit die Typen passen), `lib/zeit.ts` (`uhrzeitMitSekunden` entfernen)
- Löschen: `lib/kacheln/test/laden.ts`, `lib/kacheln/test/ansicht.tsx`
- Test: `__tests__/kacheln-laden.test.ts`, `__tests__/kacheln-zeitlimit.test.ts`, `__tests__/api-kacheln.test.ts`; Daten der Testkachel in
  `__tests__/kacheln-stand.test.ts`, `__tests__/kachel.test.tsx`, `__tests__/page.test.tsx` durch eine KI-News-Kachel ersetzen;
  Test von `uhrzeitMitSekunden` in `__tests__/zeit.test.ts` entfernen

**Schnittstellen:**
- Nutzt: `ladeKiNews(absender: AbsenderEinstellung[], jetzt: Date): Promise<AbsenderStand[]>` und `ABSENDER` (Schritt 1)
- Liefert: `KachelDaten = { art: "ki-news"; absender: AbsenderStand[] }`,
  `KachelEinstellung = { id: string; art: "ki-news"; titel: string }`,
  `ladeKiNewsKachel(einstellung: KachelEinstellung, jetzt: Date): Promise<{ daten: KachelDaten }>`

- [x] **Schritt 1: Tests umschreiben.** In `kacheln-laden.test.ts` und `kacheln-zeitlimit.test.ts` ersetzt
      `vi.mock("@/lib/kacheln/ki-news/laden", …)` mit einer Attrappe von `ladeKiNews` den Schalter `fehlerAusloesen`: erster Aufruf
      `mockRejectedValueOnce(new Error("Testfehler"))`, zweiter liefert Absender. `kacheln-zeitlimit.test.ts` ersetzt `ladeKiNewsKachel`. Neu dazu:

```ts
test("die KI-News-Kachel liefert die Absender aus den Einstellungen", async () => {
  vi.mocked(ladeKiNews).mockResolvedValue([ANTHROPIC]);
  const antwort = await ladeDashboard([{ id: "ki-news", art: "ki-news", titel: "KI-News" }], JETZT);
  expect(ladeKiNews).toHaveBeenCalledWith(ABSENDER, JETZT);
  expect(antwort.kacheln).toEqual([
    { id: "ki-news", titel: "KI-News", status: "ok",
      daten: { art: "ki-news", absender: [ANTHROPIC] }, stand: "2026-11-08T13:32:07.000Z" },
  ]);
});

test("die Einstellungen zeigen genau die KI-News-Kachel", () => {
  expect(KACHELN).toEqual([{ id: "ki-news", art: "ki-news", titel: "KI-News" }]);
});
```

- [x] **Schritt 2: `npm test`.** Erwartet: FAIL, unter anderem fehlt `art: "ki-news"` in den Typen und der Lader.
- [x] **Schritt 3: Umstellen** wie unter „Liefert“, `LADER = { "ki-news": ladeKiNewsKachel }`, Testkachel löschen.
- [x] **Schritt 4: `npm run check`.** Erwartet: alles grün, `grep -rn 'fehlerAusloesen\|TestAnsicht\|uhrzeitMitSekunden' lib app __tests__` findet nichts.
- [x] **Schritt 5:** committen: `Replace test tile with AI news tile`.

### Aufgabe 3: Ansicht der Kachel

**Dateien:**
- Neu: `lib/kacheln/ki-news/ansicht.tsx`
- Ändern: `app/dashboard.tsx` (`case "ki-news": return <KiNewsAnsicht daten={daten} />`)
- Test: `__tests__/ki-news-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `Abschnitt` aus `lib/kacheln/kachel.tsx`, `alterText` und `istFrisch` aus Aufgabe 1, `KachelDaten` aus Aufgabe 2
- Liefert: `KiNewsAnsicht({ daten }: { daten: KachelDaten })` (`KachelDaten` hat nur die eine Art, `Extract` erübrigt sich)

Daten der Tests mit `vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T13:32:00Z") })`: Anthropic mit zwei Meldungen
(vor 3 Std., vor 4 Tagen), The Decoder mit einer Meldung mit Umlaut im Titel, OpenAI ohne neue Meldung (`letzteMeldung` vor 9 Tagen),
Matt Pocock ohne je eine Meldung, Hacker News `erreichbar: false`.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```tsx
test("zeigt je Absender mit Meldung einen Abschnitt mit Links zum Original", () => {
  render(<KiNewsAnsicht daten={DATEN} />);
  expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent))
    .toEqual(["Anthropic", "The Decoder"]);
  const link = screen.getByRole("link", { name: /Introducing Claude/ });
  expect(link.getAttribute("href")).toBe("https://www.anthropic.com/news/claude");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  expect(within(link).getByText("vor 3 Std.")).toBeDefined();
  expect(screen.getByText("Europäische KI-Verordnung: Was sich ab Januar ändert")).toBeDefined();
});

test("nur frische Meldungen tragen den Punkt", () => {
  render(<KiNewsAnsicht daten={DATEN} />);
  expect(within(screen.getByRole("link", { name: /Introducing Claude/ })).queryByRole("img", { name: "neu" })).not.toBeNull();
  expect(within(screen.getByRole("link", { name: /Responsible Scaling/ })).queryByRole("img", { name: "neu" })).toBeNull();
});

test("ein Absender ohne neue Meldung bekommt eine Zeile", () => {
  render(<KiNewsAnsicht daten={DATEN} />);
  expect(screen.getByText("zuletzt vor 9 Tagen")).toBeDefined();
  expect(screen.getByText("noch keine Meldung")).toBeDefined();
});

test("ein nicht erreichbarer Absender steht rot da, die anderen nicht", () => {
  render(<KiNewsAnsicht daten={DATEN} />);
  expect(screen.getByText("nicht erreichbar").className).toContain("text-fehler");
  expect(screen.getByText("zuletzt vor 9 Tagen").className).not.toContain("text-fehler");
});

test("ohne neue Meldung gibt es keinen leeren Abschnitt", () => {
  render(<KiNewsAnsicht daten={{ art: "ki-news", absender: [OPENAI_RUHIG, HACKER_NEWS_WEG] }} />);
  expect(screen.queryAllByRole("heading", { level: 3 })).toEqual([]);
  expect(screen.queryAllByRole("link")).toEqual([]);
  expect(screen.getByText("OpenAI")).toBeDefined();
});
```

  Dazu in `__tests__/page.test.tsx` den bisherigen Test „zeigt Datum, Zeit der Aktualisierung, Kachel und Abmelden“ auf die KI-News-Kachel
  umstellen: Er findet die Überschrift „KI-News“ und einen Link einer Meldung.

- [x] **Schritt 2: `npx vitest run __tests__/ki-news-ansicht.test.tsx __tests__/page.test.tsx`.** Erwartet: FAIL, `KiNewsAnsicht` gibt es nicht.
- [x] **Schritt 3: `KiNewsAnsicht`** nach den Maßen unter „Feste Vorgaben“. Der Punkt ist ein `span` mit `role="img" aria-label="neu"`, nur
      bei frischen Meldungen; sonst ein durchsichtiger `span` mit `aria-hidden`.
- [x] **Schritt 4: `npx vitest run`.** Erwartet: PASS.
- [x] **Schritt 5:** `npm run check`, committen: `Show AI news tile`.

### Aufgabe 4: Im Browser prüfen und dokumentieren

**Dateien:** Ändern `docs/Projektvision.md`, `docs/tools/Vercel.md`, dieser Plan

- [x] **Schritt 1: Mit `npm run dev` prüfen** (Claude, angemeldet oder wie in Phase 1 ohne Login auf `127.0.0.1`):
  - Breite 390 und 1280 px sehen aus wie Variante A des Mocks mit Punkt, Screenshots angesehen. Ein langer Titel bricht um, das Alter bleibt rechts.
  - Titel mit Umlauten und Sonderzeichen, z. B. bei The Decoder, stehen sauber da, ohne Rohtext wie `&ouml;` oder `&#8217;` (Fund aus PR #30).
  - Eine Feed-Adresse in `ABSENDER` vorübergehend verfälschen: Nur dieser Absender zeigt „nicht erreichbar“, falls er keinen zweiten Kanal hat.
    Danach zurücksetzen.
- [x] **Schritt 2: `npm run build`.** Erwartet: fehlerfrei.
- [x] **Schritt 3: PR öffnen, auf der Vorschau von Vercel prüfen** (Entwickler meldet sich an, Claude liest mit):
  - Die Kachel zeigt echte Meldungen, kein Absender ist dauerhaft „nicht erreichbar“. Sonst in den Logs von Vercel nach
    „ließ sich nicht laden“ suchen: Dann sperrt ein Anbieter die Server von Vercel.
  - **Zwischenspeicher:** In Vercel unter Observability → External APIs zählt `openai.com` höchstens etwa 4 Abrufe je Stunde, nicht 60.
    Ungeprüft, ob es diese Ansicht im Gratis-Tarif gibt. Falls nicht, vor Schritt 3 den Weg nachlesen und hier eintragen.
    In den Logs steht keine Warnung, dass ein Eintrag für den Zwischenspeicher zu groß ist (OpenAI-Feed 825 KB).
  - **Rechenzeit:** In den Logs die Dauer von `GET /api/kacheln` ablesen und notieren.
- [x] **Schritt 4: Doku.** Ergebnisse von Schritt 3 in `docs/tools/Vercel.md` und hier unter „Ergebnisse“, Schritt 3 im Fahrplan als
      „Code fertig, Gerätetest steht aus“. `npm run check`, Agent `plan-pruefer`, committen: `Document AI news tile`. Vor dem Merge `/code-review`.

### Aufgabe 5: Nach dem Merge auf den Geräten (Entwickler)

- [ ] **Schritt 1:** Jede offene App (Mac, iPhone, iPad) einmal neu laden. Eine lange offene App kennt `art: "ki-news"` nicht und zeigt sonst nur den Titel.
- [ ] **Schritt 2: Mac-App aus `/Applications`:** Eine Meldung anklicken. Erwartet: Sie öffnet sich im Standardbrowser, das Dashboard bleibt im Fenster.
- [ ] **Schritt 3: iPhone und iPad, installierte App:** Eine Meldung antippen. Notieren, wo sie aufgeht (Safari, Ansicht in der App)
      und wie man zurückkommt. Zurück im Dashboard: Ist man noch angemeldet?
- [ ] **Schritt 4:** Ergebnisse in diesen Plan, Schritt 3 im Fahrplan auf „erledigt“, Plan auf `status: abgeschlossen`.

## Ergebnisse

**Aufgabe 4, Schritt 1 und 2 (2026-11-06, lokal ohne Login, `proxy.ts` vorübergehend herausgenommen):**

- Echte Feeds: 7 von 9 Absendern mit Meldungen, Anthropic ohne neue Meldung („zuletzt vor 8 Tagen“). Kein Rohtext wie `&ouml;` in der
  Antwort, Umlaute bei The Decoder stimmen.
- 1280 px und 390 px sehen aus wie Variante A mit Punkt. In 390 px ist die Seite genau 390 px breit, lange Titel brechen um, das Alter bleibt rechts.
- **Falle beim Screenshot:** Chrome ohne Fenster (`--headless --window-size=390,…`) rendert breiter als 390 px und schneidet das Bild nur
  ab. Das sah aus wie eine zu breite Kachel. Richtig misst das DevTools-Protokoll mit `Emulation.setDeviceMetricsOverride` (Skript mit dem
  `WebSocket` von Node, ohne Abhängigkeit). Ein `iframe` mit 390 px zeigte nur „Lädt …“.
- Verfälschte Adresse bei The Decoder: nur dieser Absender „nicht erreichbar“, ganz unten, die anderen normal.
- `npm run build` fehlerfrei, `/api/kacheln` dynamisch.

**Auffällig, mit dem Entwickler zu klären:**

- The Decoder und Hacker News antworten mal in 1 s, mal in 6 bis 11 s oder gar nicht. Beim ersten Abruf ohne Zwischenspeicher reißen sie
  das Zeitlimit von 5 s und stehen als „nicht erreichbar“ da, bis ein späterer Abruf gelingt.
- Claude Updates liefert mehrere Einträge mit demselben Titel („Claude Platform release notes — November 5, 2026“), die Links zeigen auf
  verschiedene Anker derselben Seite.
- Fast jede Meldung der aktiven Absender ist jünger als 24 Std. und trägt den Punkt.

**Entscheidungen des Entwicklers (2026-11-06):** Zeitlimit erst nach der Vorschau auf Vercel entscheiden. Gleiche Titel je Absender
zusammenfassen (nach dem Review: nur auf derselben Website), die neueste Meldung bleibt (`ladeAbsender`, Test „gleicher Titel erscheint nur einmal …“). Der Punkt bleibt bei 24 Std.,
erst im Alltag ansehen.

**Aufgabe 4, Schritt 3 (Vorschau von PR #37):**

- Erst „Internal Server Error“ auf jeder Seite der Vorschau. Ursache: Die Supabase-Variablen galten bei Vercel nur für
  Production, ohne sie wirft `proxy.ts`. Mit leeren Variablen lokal nachgestellt, vom Entwickler um Preview ergänzt und neu
  gebaut. Hat mit der Kachel nichts zu tun, war bisher unbemerkt (Fehler in [[projects/tages-dashboard/docs/tools/Vercel|Vercel]]).
- Danach Login und Kachel in Ordnung, kein Absender „nicht erreichbar“.
- „External APIs“ gibt es im Gratis-Tarif nicht. Stattdessen mit Vercel-Token und Runtime-Logs-API gemessen, über eine
  vorübergehende Log-Zeile (Commit `916373f`, entfernt in `70a4b7a`): alle 13 Feeds aus dem Zwischenspeicher, 66 bis 682 s alt,
  auch OpenAI (825 KB). `ladeKiNews` 563 ms. Nur eine Abfrage erfasst, die Logs-API bricht nach 5 Minuten ab.
- **Zeitlimit von 5 s bleibt:** Auf Vercel war kein Absender rot, und nach dem ersten Abruf kommen die Feeds aus dem Speicher.

## Nach dem Review

Aus dem `/code-review` von PR #37, mit dem Entwickler am 2026-11-06 durchgegangen:

- **Behoben:**
  - Gleiche Titel nur auf derselben Website zusammenfassen: Ein Video und ein Blogbeitrag gleichen Namens bleiben beide. Den Vorschlag „Links
    ohne `#` vergleichen“ verworfen, weil dann alle Einträge von Claude Updates zu einem würden (alle auf derselben Seite).
  - `kalendertag` über `formatToParts` und `Date.UTC` statt über den Text von `en-CA`, der von den Sprachdaten des Browsers abhängt.
  - Ein Zeitpunkt je Meldungszeile für Punkt und Alter.
  - Unbekannte Kachel-Art zeigt „Neue Kachel, bitte die Seite neu laden.“ statt einer leeren Kachel.
  - Log-Befehle in `Vercel.md` schreiben nach `$TMPDIR`. Erledigte Punkte in der Projektvision nachgetragen.
  - Test „die Einstellungen zeigen genau die KI-News-Kachel“ gelöscht: Er wäre bei jeder neuen Kachel gescheitert, und TypeScript meldet
    schon, wenn einer Art der Lader fehlt.
- **Bewusst behalten:** `zusatz` setzt gerade keine Kachel, gehört aber zum Kachel-Gerüst (z. B. „10. Spieltag“ in Phase 3).

