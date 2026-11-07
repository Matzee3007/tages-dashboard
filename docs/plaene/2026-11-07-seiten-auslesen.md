---
titel: "Plan: Seiten auslesen"
status: aktiv
erstellt: 2026-11-07
tags: [plan, kacheln, ki-news, phase-2]
---

# Plan: Seiten auslesen

**Ziel:** Die KI-News lesen auch die Kanäle ohne Feed: die Seiten von Anthropic und `claude.com` sowie die Versionshinweise im
Hilfe-Center von Claude.

**Vorgehen:** Ein neuer Leser `leseSeite` macht aus dem HTML einer Seite dieselben `Meldung`en wie `leseFeed` aus einem Feed. Es gibt
drei Bauarten von Seiten, je eine kleine Funktion. `ladeKanal` bekommt den Leser als Parameter, sonst bleiben Abruf, Zwischenspeicher,
Zeitlimit und Zusammenfassen der Kanäle wie in Schritt 1. Findet ein Leser nichts, wirft er: Der Kanal fällt aus, die anderen laufen weiter.

**Technik:** `node-html-parser` 9.0.5 (neu, vom Entwickler am 2026-11-07 freigegeben), Vitest.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 2, Schritt 4, Tabelle „Absender und Kanäle“
und Entscheidungen vom 2026-11-04 („Findet das Programm auf einer Seite nichts mehr, zählt das als Ausfall des Kanals“).
[[projects/tages-dashboard/docs/Nächste Session|Nächste Session]]: Links müssen durch `istWebLink`.

## Was die Seiten am 2026-11-07 liefern

Von diesem Rechner abgerufen, alle mit Status 200 in unter 0,6 s, 330 bis 550 KB. `robots.txt` erlaubt das Auslesen auf allen drei Websites.

| Kanal | Adresse in den Einstellungen | Bauart | Aufbau |
|---|---|---|---|
| Anthropic News | `https://www.anthropic.com/news` | `anthropic` | 24 Elemente mit `data-listing-row`, je ein `<h3>`, ein `<a>` um oder in der `<h3>`, ein `<time>` wie `Oct 28, 2026` |
| Anthropic Research | `https://www.anthropic.com/research` | `anthropic` | wie News |
| Anthropic Engineering | `https://www.anthropic.com/engineering` | `anthropic` | wie News, Links zeigen auf `/research/…` |
| Frontier Red Team | `https://www.anthropic.com/research/team/frontier-red-team` | `anthropic` | wie News. `red.anthropic.com` leitet hierher weiter (301), hat eigene Beiträge, die unter Research fehlen |
| Claude-Blog | `https://claude.com/resources/articles` | `claude-artikel` | `claude.com/blog` leitet hierher weiter (308). 12 Karten: ein `<a href>` enthält ein `<span>` mit `Nov 5, 2026` und ein `<h3>` |
| Versionshinweise | `https://support.claude.com/en/articles/12138966-release-notes` | `versionshinweise` | in `<article>`: `<h3 id="h_…">November 6, 2026</h3>`, danach je Eintrag ein `<p>`, das nur aus `<b>Titel</b>` besteht |

Gleiche Beiträge auf mehreren Anthropic-Seiten (z. B. Research und Engineering) haben denselben Link. `ladeAbsender` zeigt sie schon
nur einmal (Test „gleicher Link erscheint nur einmal …“).

## Feste Vorgaben

- Branch `feature/ki-news-seiten`, ein PR für Plan, Code und Doku, vor dem Merge `/code-review`. Mit dem Merge ist Phase 2 fertig und wird in
  derselben Session abgeschlossen (globale `CLAUDE.md`, Phasenwechsel).
- `node-html-parser` genau in Version `9.0.5` (`npm install --save-exact`): 9.0.6 und 9.0.7 sind jünger als zwei Wochen.
- Datum ohne Uhrzeit wird **00:00 UTC** dieses Tages. So liegt keine Meldung von heute in der Zukunft (`ladeAbsender` verwirft solche).
  Monatsnamen englisch, kurz (`Nov`) oder lang (`November`). Ein unlesbares Datum lässt den Eintrag weg.
- Links: relativ zur Adresse aus den Einstellungen absolut machen (`new URL(href, url)`), dann durch `istWebLink` aus
  `lib/kacheln/ki-news/feed.ts`. Ein Eintrag ohne gültigen Link fällt weg (ADR 0006: Die Mac-App schützt vor `javascript:` nicht nachweislich).
- Titel: Text ohne Tags, Zeichen wie `&#x27;` dekodiert, Leerraum zu einem Leerzeichen zusammengezogen, leere Titel fallen weg.
- Versionshinweise: **eine Meldung pro Tag** (Entscheidung des Entwicklers 2026-11-07), Titel = alle Eintragstitel des Tages mit `" · "`
  verbunden, Link = Seitenadresse + `#` + `id` der `<h3>`. Ein Tag ohne Eintrag fällt weg.
- Ein Leser, der keine einzige Meldung findet, wirft `Error("Keine Meldung auf der Seite gefunden")`.
- Abruf wie bei Feeds: `User-Agent: Tages-Dashboard`, 15 Minuten Zwischenspeicher, 5 s Zeitlimit. Die Seiten liegen unter der Grenze von 2 MB
  für den Zwischenspeicher von Next.js.
- Begriffe aus dem Glossar: Absender, Kanal, Meldung. Vor jedem Commit `npm run check`. Commit-Nachrichten englisch, im Imperativ.

## Prüf-Schwerpunkte

1. Anthropic baut eine Seite um, der Leser findet nichts → nur dieser Kanal fällt aus, Anthropic zeigt die anderen Kanäle → Aufgabe 1, Test
   „wirft, wenn die Seite keine Meldung enthält“, und Aufgabe 3, Test „ein Seiten-Kanal fällt aus, die Feeds laufen weiter“.
2. Relativer Link `/research/x` auf der Red-Team-Seite → `https://www.anthropic.com/research/x` → Aufgabe 1, Test „macht relative Links absolut …“.
3. Link mit `javascript:` → Eintrag fehlt, die anderen bleiben → Aufgabe 1, Test „lässt Einträge ohne Web-Link oder ohne Datum weg“.
4. Titel mit `&#x27;` („Anthropic&#x27;s“) → „Anthropic's“ → Aufgabe 1, Test „dekodiert Zeichen im Titel …“.
5. Beitrag von heute ohne Uhrzeit → erscheint (nicht „aus der Zukunft“) → Aufgabe 1, Test „liest das Datum als 00:00 UTC …“.

## Dateien

| Datei | Aufgabe |
|---|---|
| `lib/kacheln/ki-news/seiten.ts` | neu: `SeitenArt`, `leseSeite` und die drei Leser |
| `lib/kacheln/ki-news/feed.ts` | `istWebLink` wird exportiert, sonst unverändert |
| `lib/einstellungen.ts` | `AbsenderEinstellung` bekommt `seiten?: SeitenEinstellung[]`, Anthropic und Claude Updates ihre Seiten |
| `lib/kacheln/ki-news/laden.ts` | `ladeKanal` mit Leser als Parameter, `ladeAbsender` lädt Feeds und Seiten |
| `__tests__/ki-news-seiten.test.ts` | neu |
| `__tests__/ki-news-laden.test.ts` | neue Tests für Seiten als Kanal |
| `docs/tools/node-html-parser.md`, `Tools Übersicht.md` | neue Tool-Notiz |

## Aufgaben

### Aufgabe 1: Anthropic-Seiten lesen

**Dateien:**
- Neu: `lib/kacheln/ki-news/seiten.ts`
- Ändern: `lib/kacheln/ki-news/feed.ts` (nur `export` vor `istWebLink`), `package.json`, `package-lock.json`
- Test: `__tests__/ki-news-seiten.test.ts`

**Schnittstellen:**
- Nutzt: `Meldung` und `istWebLink(text: string): boolean` aus `feed.ts`
- Liefert: `type SeitenArt = "anthropic" | "claude-artikel" | "versionshinweise"`,
  `leseSeite(art: SeitenArt, html: string, url: string): Meldung[]`

- [x] **Schritt 1: Abhängigkeit installieren**

`npm install --save-exact node-html-parser@9.0.5`. Erwartet: `"node-html-parser": "9.0.5"` in `dependencies`.

- [x] **Schritt 2: Fehlschlagende Tests schreiben**

HTML-Schnipsel im Test nach dem echten Aufbau (Tabelle oben), gekürzt: News-Zeile mit `<a href><span><h3>…</h3></span></a>` und `<time>`
dahinter, Research-Zeile mit `<time>` davor und `<h3><a href>…</a></h3>`, dazu ein Kategorie-Link (`<a href="/news/safeguards">`) neben dem Titel.

```ts
const URL_NEWS = "https://www.anthropic.com/news";

test("liest Titel, Link und Datum jeder Zeile einer Anthropic-Seite", () => {
  expect(leseSeite("anthropic", NEWS_UND_RESEARCH, URL_NEWS)).toEqual([
    { titel: "Preparing for the 2026 US midterms", link: "https://www.anthropic.com/news/2026-us-midterms", zeit: "2026-10-14T00:00:00.000Z" },
    { titel: "Teaching AI to build scientific models", link: "https://www.anthropic.com/research/teaching-ai", zeit: "2026-11-06T00:00:00.000Z" },
  ]);
});
test("nimmt den Link an der Überschrift, nicht den Kategorie-Link", …);          // Kategorie /news/safeguards taucht nicht auf
test("macht relative Links absolut, auch auf einer Unterseite", …);              // URL .../research/team/frontier-red-team, href "/research/x" → https://www.anthropic.com/research/x
test("liest das Datum als 00:00 UTC, kurze und lange Monatsnamen", …);           // "Nov 6, 2026" und "November 6, 2026" → "2026-11-06T00:00:00.000Z"
test("dekodiert Zeichen im Titel und zieht Leerraum zusammen", …);               // "Anthropic&#x27;s\n  plan" → "Anthropic's plan"
test("lässt Einträge ohne Web-Link oder ohne Datum weg", …);                      // href "javascript:alert(1)", <time>bald</time>, leere <h3>; ein gültiger Eintrag bleibt
test("wirft, wenn die Seite keine Meldung enthält", () => {
  expect(() => leseSeite("anthropic", "<html><body><p>Neu gestaltet</p></body></html>", URL_NEWS)).toThrow("Keine Meldung auf der Seite gefunden");
});
```

- [x] **Schritt 3: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-seiten.test.ts`. Erwartet: FAIL, weil `@/lib/kacheln/ki-news/seiten` fehlt.

- [x] **Schritt 4: `leseSeite` mit Bauart `anthropic` in `seiten.ts`**

`parse` aus `node-html-parser`. Zeilen über `querySelectorAll("[data-listing-row]")`, Titel aus `<h3>`, Link vom `<a>`, das die `<h3>` umschließt
(`closest("a")`) oder in ihr liegt, Datum aus `<time>`. Gemeinsame Hilfen im selben Modul: `datumAusText(text: string): string | null`,
`absoluterLink(href: string | undefined, url: string): string | null`. Die anderen Bauarten werfen vorerst `Error("Unbekannte Bauart")`.

- [x] **Schritt 5: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ki-news-seiten.test.ts`. Erwartet: PASS.

- [x] **Schritt 6: Prüfen und committen**

```bash
npm run check
git add package.json package-lock.json lib/kacheln/ki-news/seiten.ts lib/kacheln/ki-news/feed.ts __tests__/ki-news-seiten.test.ts docs/plaene/2026-11-07-seiten-auslesen.md
git commit -m "Read Anthropic pages for AI news"
```

### Aufgabe 2: Claude-Blog und Versionshinweise lesen

**Dateien:**
- Ändern: `lib/kacheln/ki-news/seiten.ts`
- Test: `__tests__/ki-news-seiten.test.ts`

**Schnittstellen:**
- Nutzt: `leseSeite`, `datumAusText`, `absoluterLink` aus Aufgabe 1
- Liefert: `leseSeite` versteht `"claude-artikel"` und `"versionshinweise"`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
const URL_HINWEISE = "https://support.claude.com/en/articles/12138966-release-notes";

test("liest Karten von claude.com mit Datum und Titel im Link", …);
// <a href="/resources/articles/message-threads"><span>Article</span><span>Nov 2, 2026</span><h3>Make long-running agents faster …</h3></a>
// → { titel: "Make long-running agents faster …", link: "https://claude.com/resources/articles/message-threads", zeit: "2026-11-02T00:00:00.000Z" }

test("fasst die Versionshinweise eines Tages zu einer Meldung zusammen", () => {
  expect(leseSeite("versionshinweise", HINWEISE, URL_HINWEISE)[0]).toEqual({
    titel: "New security and admin controls for Enterprise plans · Personal Finance in Claude",
    link: `${URL_HINWEISE}#h_1c75a86390`,
    zeit: "2026-11-05T00:00:00.000Z",
  });
});
test("zählt nur Absätze, die ganz fett sind, als Titel", …);   // <p>… see <b><a>Track spend …</a></b>.</p> ist kein Titel
test("überspringt Monatsüberschriften und Tage ohne Eintrag", …); // <h2>November 2026</h2>, <h3> ohne folgende fette Absätze
test("wirft bei claude-artikel und versionshinweise ohne Meldung", …);
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-seiten.test.ts`. Erwartet: FAIL mit „Unbekannte Bauart“.

- [x] **Schritt 3: Leser `claude-artikel` und `versionshinweise` in `seiten.ts`**

`claude-artikel`: jedes `<a href>` mit `<h3>` darin, Datum aus dem ersten Text darin, den `datumAusText` versteht. `versionshinweise`: die Kinder
von `<article>` der Reihe nach durchgehen. Eine `<h3>` mit lesbarem Datum beginnt einen Tag, ein `<p>`, dessen Text gleich dem Text seines
einzigen `<b>` ist, ist ein Titel dieses Tages.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npx vitest run __tests__/ki-news-seiten.test.ts`. Erwartet: PASS.

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/kacheln/ki-news/seiten.ts __tests__/ki-news-seiten.test.ts
git commit -m "Read Claude blog and release notes"
```

### Aufgabe 3: Seiten als Kanäle laden

**Dateien:**
- Ändern: `lib/einstellungen.ts`, `lib/kacheln/ki-news/laden.ts`
- Test: `__tests__/ki-news-laden.test.ts`

**Schnittstellen:**
- Nutzt: `SeitenArt`, `leseSeite` aus Aufgabe 1 und 2
- Liefert: `type SeitenEinstellung = { url: string; art: SeitenArt }`,
  `AbsenderEinstellung = { name: string; feeds: string[]; seiten?: SeitenEinstellung[] }`,
  `ladeKanal(url: string, jetzt: Date, lese: (text: string) => Meldung[] = leseFeed): Promise<Meldung[]>`

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

`fetchMock` antwortet je nach Adresse mit Feed oder HTML (Muster wie in den bestehenden Tests mit mehreren Kanälen).

```ts
test("ladeKanal nimmt den übergebenen Leser", …);                       // lese = vi.fn(() => []) wird mit dem Text der Antwort aufgerufen
test("ein Absender fasst Feeds und Seiten zusammen", …);               // feeds: [FEED-URL], seiten: [{ url, art: "anthropic" }] → Meldungen aus beiden, neueste zuerst
test("ein Seiten-Kanal fällt aus, die Feeds laufen weiter", …);        // Seite liefert "<html></html>" → erreichbar: true, console.error nennt die Seiten-URL
// "ein Absender ohne seiten lädt wie bisher nur Feeds": nicht eigens geschrieben, alle bestehenden Tests von ladeAbsender sind genau dieser Fall
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npx vitest run __tests__/ki-news-laden.test.ts`. Erwartet: FAIL, die neuen Tests rot, die alten grün.

- [x] **Schritt 3: `ladeKanal` und `ladeAbsender` in `laden.ts`, Typen und Seiten in `einstellungen.ts`**

`ladeAbsender` macht aus `feeds` und `seiten` eine Liste von Kanälen mit Adresse und Leser. Die Fehlermeldung im Log nennt die Adresse
aus dieser Liste. Einstellungen: Anthropic bekommt die vier Anthropic-Seiten und `https://claude.com/resources/articles`, Claude Updates
die Versionshinweise (Adressen und Bauarten aus der Tabelle oben).

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test`. Erwartet: alle Tests PASS.

- [x] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add lib/einstellungen.ts lib/kacheln/ki-news/laden.ts __tests__/ki-news-laden.test.ts
git commit -m "Load AI news pages as channels"
```

### Aufgabe 4: Mit den echten Seiten prüfen und dokumentieren

**Dateien:**
- Neu: `docs/tools/node-html-parser.md`
- Ändern: `docs/tools/Tools Übersicht.md`, `docs/Projektvision.md`, dieser Plan (Abschnitt „Ergebnisse“)

- [ ] **Schritt 1: Echte Seiten lokal**

Wie im [[projects/tages-dashboard/docs/plaene/2026-11-06-ki-news-kachel|Plan KI-News-Kachel]], Aufgabe 4: `proxy.ts` vorübergehend heraus,
`npm run dev`, `/api/kacheln` abrufen, danach `proxy.ts` zurück (`git status` sauber bis auf Gewolltes). Erwartet: Anthropic `erreichbar: true`
mit Meldungen von `anthropic.com` und `claude.com` der letzten 7 Tage, Claude Updates mit einer Meldung pro Tag aus dem Hilfe-Center, kein
`Kanal … ließ sich nicht laden` im Log des Servers. Zahlen in „Ergebnisse“ festhalten.

- [ ] **Schritt 2: `npm run build`**

Erwartet: fehlerfrei.

- [ ] **Schritt 3: Doku**

Tool-Notiz `node-html-parser.md` (Zweck, Version, warum nicht `fast-xml-parser` oder `cheerio`, Selektoren, die wir nutzen), Eintrag in
`Tools Übersicht.md`. In der Projektvision: Schritt 4 „Code fertig, PR #…“, die Tabelle „Absender und Kanäle“ mit den neuen Adressen
(`claude.com/resources/articles`, Red-Team-Seite statt `red.anthropic.com`).

- [ ] **Schritt 4: Prüfen, committen, PR**

`npm run check`, Agent `plan-pruefer`, committen: `Document page channels`. PR öffnen, auf der Vorschau anmelden und die Kachel ansehen
(Entwickler), vor dem Merge `/code-review`.

### Aufgabe 5: Nach dem Merge (Entwickler)

- [ ] **Schritt 1:** Die App auf einem Gerät neu laden. Erwartet: Anthropic zeigt Meldungen von der News-Seite oder dem Claude-Blog, ein
      Antippen öffnet den Beitrag.
- [ ] **Schritt 2:** Plan auf `status: abgeschlossen`, Schritt 4 im Fahrplan auf „erledigt“, Phase 2 abschließen (Journal, Übergabe).

## Ergebnisse
