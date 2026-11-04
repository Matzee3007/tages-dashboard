---
titel: "Plan: Feeds lesen"
status: abgeschlossen
erstellt: 2026-11-04
tags: [plan, ki-news, phase-2]
---

# Plan: Feeds lesen

**Ziel:** Der Server liest die RSS- und Atom-Feeds aller Absender, fasst die Kanäle je Absender zusammen und liefert je Absender die
neuesten Meldungen. Dazu kommt ein Zeitlimit je Kachel. Sichtbar wird das erst in Schritt 3 (KI-News-Kachel).

**Vorgehen:** Eine reine Funktion wandelt Feed-Text in Meldungen um. Darüber liegen der Abruf eines Kanals (Zwischenspeicher, Zeitlimit)
und das Zusammenfassen je Absender. Zwischengespeichert wird über `fetch` mit `next.revalidate`, nicht über `use cache`: Laut Doku von
Next.js 16.4.3 liegt `use cache` im Speicher und geht auf Serverless-Hosting wie Vercel meist nach der Anfrage verloren.

**Technik:** Next.js 16 (`fetch` mit `next.revalidate`), `fast-xml-parser` 5.12.0 (neu, MIT), Vitest.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 2, Schritt 1, und die dortigen
Entscheidungen vom 2026-11-04.

## Feste Vorgaben

- Branch `feature/feeds-lesen`, ein PR für Plan, Code und Doku, vor dem Merge `/code-review`.
- Vor jedem Commit `npm run check`. Commit-Nachrichten englisch, im Imperativ.
- Begriffe aus dem Glossar: Absender, Kanal, Meldung.
- Zwischenspeicher 15 Minuten je Kanal (`revalidate: 900`), Zeitlimit 5000 ms je Kanal, 8000 ms je Kachel.
- Je Absender höchstens 3 Meldungen, nur aus den letzten 7 Tagen.
- Nur Links mit `http:` oder `https:`, weil ein Tipp sie später öffnet.
- `User-Agent: Tages-Dashboard`, keine persönlichen Angaben.
- Fehlertexte bleiben im Server-Log (ADR 0004).
- Nicht in diesem Schritt: Kachel, Ansicht, Eintrag in `KACHELN`, Seiten auslesen, Testkachel entfernen.

## Prüf-Schwerpunkte

1. Ein Anbieter antwortet mit Status 200, aber HTML statt Feed → zählt als Ausfall des Kanals, nicht als „keine Meldungen“ → Aufgabe 1 und 2.
2. Titel doppelt kodiert wie bei The Verge (`AT&amp;#038;T`) → Anzeige `AT&T` → Aufgabe 1.
3. Ein Feed hängt → nach 5 Sekunden Ausfall dieses Kanals, die anderen laufen weiter → Aufgabe 2 und 3.
4. Eine Meldung mit Datum in der Zukunft → zählt nicht, sonst stünde der Absender dauerhaft oben → Aufgabe 3.
5. Eine ganze Kachel hängt → nach 8 Sekunden Fehlerzustand nur dieser Kachel → Aufgabe 4.

## Dateien

- Neu: `lib/kacheln/ki-news/feed.ts`: Feed-Text → Meldungen
- Neu: `lib/kacheln/ki-news/laden.ts`: Kanal abrufen, Absender zusammenfassen
- Ändern: `lib/einstellungen.ts`: Absender und ihre Feeds
- Ändern: `lib/kacheln/laden.ts`: Zeitlimit je Kachel
- Test: neu `__tests__/ki-news-feed.test.ts`, `__tests__/ki-news-laden.test.ts`, `__tests__/kacheln-zeitlimit.test.ts`
- Doku: neu `docs/tools/fast-xml-parser.md`, geändert `docs/tools/Tools Übersicht.md`, `docs/adr/0004-kacheln-ueber-schnittstelle.md`,
  `docs/Projektvision.md`, dieser Plan

## Aufgaben

### Aufgabe 1: Feed-Text in Meldungen umwandeln

**Dateien:**
- Neu: `lib/kacheln/ki-news/feed.ts`
- Ändern: `package.json`, `package-lock.json`
- Test: `__tests__/ki-news-feed.test.ts`

**Schnittstellen:**
- Liefert: `type Meldung = { titel: string; link: string; zeit: string }` (`zeit` als ISO-Text) und `leseFeed(text: string): Meldung[]`.
  Wirft einen Fehler, wenn der Text weder RSS noch Atom ist.

- [x] **Schritt 1: Abhängigkeit installieren**

`npm install --save-exact fast-xml-parser@5.12.0`
Erwartet: `package.json` nennt `"fast-xml-parser": "5.12.0"` ohne `^`.

- [x] **Schritt 2: Fehlschlagende Tests schreiben**

Testnamen und Prüfungen, jeweils mit kleinem Feed-Text im Test:

```ts
test("liest RSS", () => {
  expect(leseFeed(RSS)).toEqual([
    { titel: "Eins", link: "https://example.org/1", zeit: "2026-11-03T17:01:49.000Z" },
  ]);
}); // <pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate>

test("liest Atom mit mehreren Links und nimmt den alternate-Link", () => { /* rel="self" und rel="alternate" */ });
test("nimmt bei Atom published und sonst updated", () => { /* je ein Eintrag */ });
test("versteht einen Feed mit nur einem Eintrag", () => { /* item und entry */ });
test("liest Titel in CDATA und Titel, die nur aus Ziffern bestehen", () => { /* <title>2026</title> wird "2026" */ });
test("dekodiert auch doppelt kodierte Zeichen", () => {
  // <title>AT&amp;#038;T &amp;amp; mehr</title>
  expect(leseFeed(DOPPELT)[0].titel).toBe("AT&T & mehr");
});
test("lässt Einträge ohne Titel, ohne gültiges Datum oder ohne http-Link weg", () => {
  // darunter <link>javascript:alert(1)</link>
  expect(leseFeed(UNVOLLSTAENDIG)).toEqual([]);
});
test("ein leerer Feed ist kein Fehler", () => { expect(leseFeed(LEER_RSS)).toEqual([]); });
test("wirft bei HTML und bei kaputtem Text", () => {
  expect(() => leseFeed("<!doctype html><html><body>Hallo</body></html>")).toThrow();
  expect(() => leseFeed("kein xml")).toThrow();
});
```

- [x] **Schritt 3: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-feed.test.ts`
Erwartet: FAIL, weil `@/lib/kacheln/ki-news/feed` fehlt.

- [x] **Schritt 4: `leseFeed(text: string): Meldung[]` in `lib/kacheln/ki-news/feed.ts`**

`XMLParser` mit `ignoreAttributes: false`, `removeNSPrefix: true`, `parseTagValue: false`, `htmlEntities: true` und `isArray` für `item`,
`entry` und `link`. Ein Titel kann als Objekt mit `#text` ankommen. Nach dem Parsen im Titel noch einmal `&#…;`, `&#x…;`, `&amp;`, `&lt;`,
`&gt;`, `&quot;` und `&apos;` ersetzen. RSS-Datum: `pubDate`, sonst `date`.

- [x] **Schritt 5: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ki-news-feed.test.ts`
Erwartet: PASS

- [x] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add package.json package-lock.json lib/kacheln/ki-news/feed.ts __tests__/ki-news-feed.test.ts docs/plaene/2026-11-04-feeds-lesen.md
git commit -m "Add RSS and Atom feed parser"
```

### Aufgabe 2: Einen Kanal abrufen

**Dateien:**
- Neu: `lib/kacheln/ki-news/laden.ts`
- Test: `__tests__/ki-news-laden.test.ts`

**Schnittstellen:**
- Nutzt: `leseFeed` aus Aufgabe 1
- Liefert: `ladeKanal(url: string): Promise<Meldung[]>`. Wirft bei Netzfehler, Zeitlimit, Status außerhalb 200–299 und bei einem Text, der
  kein Feed ist.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

`fetch` mit `vi.stubGlobal` ersetzen, Kopfzeile `// @vitest-environment node`.

```ts
test("ruft mit Zwischenspeicher, Zeitlimit und eigenem Namen ab", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  await ladeKanal("https://example.org/feed");
  const [url, optionen] = fetchMock.mock.calls[0];
  expect(url).toBe("https://example.org/feed");
  expect(optionen.next).toEqual({ revalidate: 900 });
  expect(optionen.headers["User-Agent"]).toBe("Tages-Dashboard");
  expect(zeitlimit).toHaveBeenCalledWith(5000);
  expect(optionen.signal).toBeInstanceOf(AbortSignal);
});
test("wirft bei Status 404", async () => { /* rejects.toThrow() */ });
test("wirft bei Status 200 mit HTML", async () => { /* rejects.toThrow() */ });
test("wirft, wenn fetch fehlschlägt", async () => { /* rejects.toThrow() */ });
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-laden.test.ts`
Erwartet: FAIL, weil `@/lib/kacheln/ki-news/laden` fehlt.

- [x] **Schritt 3: `ladeKanal(url: string): Promise<Meldung[]>` in `lib/kacheln/ki-news/laden.ts`**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ki-news-laden.test.ts`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/kacheln/ki-news/laden.ts __tests__/ki-news-laden.test.ts
git commit -m "Fetch a news channel with cache and timeout"
```

### Aufgabe 3: Kanäle je Absender zusammenfassen

**Dateien:**
- Ändern: `lib/kacheln/ki-news/laden.ts`, `lib/einstellungen.ts`
- Test: `__tests__/ki-news-laden.test.ts`

**Schnittstellen:**
- Nutzt: `ladeKanal` aus Aufgabe 2
- Liefert in `lib/einstellungen.ts`: `type AbsenderEinstellung = { name: string; feeds: string[] }` und
  `ABSENDER: AbsenderEinstellung[]` mit den Feeds aller Absender aus der Tabelle der Projektvision.
- Liefert in `laden.ts`:
  - `type AbsenderStand = { name: string; meldungen: Meldung[]; letzteMeldung: string | null; erreichbar: boolean }`
  - `ladeAbsender(absender: AbsenderEinstellung, jetzt: Date): Promise<AbsenderStand>`
  - `ladeKiNews(absender: AbsenderEinstellung[], jetzt: Date): Promise<AbsenderStand[]>`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

`JETZT = new Date("2026-11-08T12:00:00Z")`. `fetch` liefert je URL einen kleinen Feed oder schlägt fehl.

```ts
test("fasst Kanäle zusammen und zeigt die neuesten 3 zuerst", async () => { /* 2 Feeds mit zusammen 4 Meldungen */ });
test("zeigt nur Meldungen der letzten 7 Tage", async () => {
  // genau 7 Tage alt zählt, 7 Tage und 1 Sekunde nicht
});
test("gleicher Link erscheint nur einmal", async () => { /* in 2 Feeds, die neuere Fassung bleibt */ });
test("ohne neue Meldung bleibt das Alter der letzten", async () => {
  // meldungen: [], letzteMeldung: "2026-10-16T12:00:00.000Z", erreichbar: true
});
test("eine Meldung aus der Zukunft zählt nicht", async () => { /* weder meldungen noch letzteMeldung */ });
test("fällt ein Kanal aus, zeigt der Absender still den Rest", async () => {
  // erreichbar: true, Meldungen des zweiten Feeds, console.error mit der URL des ersten
});
test("ein hängender Kanal fällt nach dem Zeitlimit aus, die anderen laufen weiter", async () => {});
test("fallen alle Kanäle aus, ist der Absender nicht erreichbar", async () => {
  // meldungen: [], letzteMeldung: null, erreichbar: false
});
test("ladeKiNews sortiert nach der neuesten Meldung, nicht Erreichbare und Leere zuletzt", async () => {});
test("ladeKiNews wirft, wenn kein Absender erreichbar ist", async () => {});
test("ladeKiNews läuft weiter, wenn nur ein Absender ausfällt", async () => {});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-laden.test.ts`
Erwartet: FAIL, weil `ladeAbsender` und `ladeKiNews` fehlen.

- [x] **Schritt 3: `ABSENDER` und die beiden Funktionen schreiben**

`Promise.allSettled` für die Kanäle. Anthropic bekommt hier nur seine beiden Feeds, die Seiten folgen in Schritt 4 des Fahrplans. YouTube-Feeds
ausgeschrieben als `https://www.youtube.com/feeds/videos.xml?channel_id=<ID>`.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ki-news-laden.test.ts`
Erwartet: PASS

- [x] **Schritt 5: Probe gegen die echten Feeds**

Temporär `__tests__/live.tmp.test.ts` anlegen, das `ladeKiNews(ABSENDER, new Date())` aufruft und das Ergebnis ausgibt, einmal laufen lassen, Datei
wieder löschen.
Erwartet: jeder Absender mit `erreichbar: true`, Titel ohne `&#`, Hacker News mit 3 Meldungen. Abweichungen im Bericht nennen.

- [x] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add lib/kacheln/ki-news/laden.ts lib/einstellungen.ts __tests__/ki-news-laden.test.ts
git commit -m "Merge news channels per sender"
```

### Aufgabe 4: Zeitlimit je Kachel

**Dateien:**
- Ändern: `lib/kacheln/laden.ts:7-25`
- Test: `__tests__/kacheln-zeitlimit.test.ts`

**Schnittstellen:**
- Ändert nur das Verhalten von `ladeKachel`, die Signatur von `ladeDashboard` bleibt.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

`@/lib/kacheln/test/laden` mit `vi.mock` ersetzen, `vi.useFakeTimers()`.

```ts
test("eine hängende Kachel wird nach 8 Sekunden zum Fehler, die andere bleibt", async () => {
  // Lader hängt bei id "a", antwortet bei id "b"
  const antwort = ladeDashboard([kachel("a"), kachel("b")], JETZT);
  await vi.advanceTimersByTimeAsync(8000);
  const { kacheln } = await antwort;
  expect(kacheln[0]).toEqual({ id: "a", titel: "Kachel a", status: "fehler" });
  expect(kacheln[1].status).toBe("ok");
});
test("vor 8 Sekunden gibt es keinen Fehler", async () => {
  // Lader antwortet nach 7999 ms, Status ok
});
test("eine schnelle Kachel lässt keinen Timer zurück", async () => {
  // nach der Antwort vi.getTimerCount() === 0
});
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/kacheln-zeitlimit.test.ts`
Erwartet: FAIL, die hängende Kachel läuft in das Zeitlimit des Tests.

- [x] **Schritt 3: In `ladeKachel` den Lader mit `Promise.race` gegen ein Zeitlimit von 8000 ms laufen lassen, den Timer danach löschen**

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/kacheln-zeitlimit.test.ts __tests__/kacheln-laden.test.ts __tests__/api-kacheln.test.ts`
Erwartet: PASS

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/kacheln/laden.ts __tests__/kacheln-zeitlimit.test.ts
git commit -m "Add a time limit per tile"
```

### Aufgabe 5: Doku

**Dateien:**
- Neu: `docs/tools/fast-xml-parser.md`
- Ändern: `docs/tools/Tools Übersicht.md`, `docs/adr/0004-kacheln-ueber-schnittstelle.md`, `docs/Projektvision.md`, dieser Plan

- [x] **Schritt 1: Doku schreiben**

- Tool-Notiz: wozu, die gewählten Parser-Optionen mit Grund, die Falle mit doppelt kodierten Titeln. Eintrag in der Übersicht.
- ADR 0004, Konsequenzen: Der Satz „Mit den ersten echten Quellen in Phase 2 kommt ein Zeitlimit je Kachel dazu“ wird zu „Das Zeitlimit je Kachel beträgt 8 Sekunden“.
- Projektvision: Schritt 1 im Fahrplan als erledigt mit PR-Nummer und Link auf diesen Plan.
- Dieser Plan: `status: abgeschlossen`.

- [x] **Schritt 2: Prüfen und committen**

```bash
npm run check
git add docs/tools/fast-xml-parser.md "docs/tools/Tools Übersicht.md" docs/adr/0004-kacheln-ueber-schnittstelle.md docs/Projektvision.md docs/plaene/2026-11-04-feeds-lesen.md
git commit -m "Document feed reading"
```

## In Schritt 3 prüfen

Hier noch nicht prüfbar, weil es erst mit der Kachel auf Vercel läuft:

- Greift der Zwischenspeicher mit `next.revalidate` auf Vercel wirklich, auch in der Schnittstelle mit `connection()`?
- Antworten alle Anbieter auch den Server-Adressen von Vercel?
- Passt der OpenAI-Feed (825 KB) in den Zwischenspeicher? Eine Größengrenze habe ich nicht nachgelesen.

## Nach dem Review

Aus dem `/code-review` von PR #30, mit dem Entwickler am 2026-11-04 durchgegangen:

- **Behoben:** Ausfall bleibt im Zwischenspeicher unsichtbar (höchstens 1 Stunde alt, [[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]),
  erstes gültiges Datumsfeld, Feed ohne lesbaren Eintrag zählt als Ausfall, `media:title`.
- **Hingenommen:** Eine HTML-Seite mit Status 200 wird mitgespeichert, das heilt sich selbst.
- **Verschoben:** `stand`, Rechenzeit und `&ouml;` in Titeln nach Schritt 3, Abbruchsignal für Lader nach Phase 3 (Projektvision).
