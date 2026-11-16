---
titel: "Plan: Neues Aussehen"
status: aktiv
erstellt: 2026-11-16
tags: [plan, aussehen, sport, ki-news]
---

# Plan: Neues Aussehen

**Ziel:** Das Dashboard bekommt das Aussehen von Variante F „Instrument“: keine Kästen, Ordnung über Schriftgewicht, Größe und Abstand,
Hausfarben der Quellen als Akzent, Gruppe Sport, Linien in den Tabellen und Absender in einer eigenen farbigen Spalte.

**Vorgehen:** Erst die Grundlage (Farb-Token, Schrift Commissioner), dann Farbe und Gruppe je Kachel aus der Einstellungsdatei, dann die
Ansichten. Die Farbe reist mit der Antwort des Servers und steht als CSS-Variable `--farbe` (Akzent) und `--marke` (Quadrat) am Element.

**Technik:** Next.js 16 (`next/font/google`), React, Tailwind CSS 4 (Container Queries), Vitest, Testing Library.

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]] Phase 3, Schritt 2, PR 3 „Neues Aussehen“, „Tabelle mit
Linien“, „Sport als Gruppe“, „Plätze der Linien“. Mock Runde 2, Variante F, freigegeben im Gespräch am 2026-11-16:
`assets/mocks/2026-11-16-aussehen-f.html` (Schalter auf „F Instrument“). Im Gespräch entschieden: immer dunkel, Hausfarben von Anthropic,
Claude und Hacker News nur im Quadrat (Variante B2 und D, E wurden verworfen).

## Feste Vorgaben

- Nur dunkel. Neue Token in `app/globals.css`: `grund #171B22`, `rand #272D37`, `text #E4E7EC`, `gedaempft #8C95A3`, neu `rauch #69727F`,
  `info #86ABF5`, `fehler #F59A90`. `akzent #FF8A3D` bleibt, Orange gehört allein Mein Team, Live und „neu“.
- Schrift: nur Commissioner (variabel, Gewichte 280–720), ersetzt Barlow und Barlow Condensed. Ziffern gleich breit (`tabular-nums`).
- Farben je Quelle (Akzent für Name und Grenzlinie / Quadrat, falls anders):

| Quelle | Akzent | Quadrat |
|---|---|---|
| Bundesliga | `#E3343F` | – |
| Premier League | `#B061D1` | – |
| Champions League | `#5B8DEF` | – |
| KI-News | `#8E99A8` | – |
| Anthropic | `#E8E6DC` | `#D97757` |
| Claude Updates | `#9AAE7E` | `#C15F3C` |
| OpenAI | `#ECECEC` | – |
| Google DeepMind | `#4285F4` | – |
| Andrej Karpathy | `#8F9AAD` | – |
| Matt Pocock | `#A3A08F` | – |
| The Decoder | `#7FA8AE` | – |
| The Verge | `#9479FF` | – |
| Hacker News | `#B5B5AA` | `#FF6600` |

- Plätze der Linien (Projektvision): Bundesliga nach 4, 5, 6, 15, 16, Premier League nach 4, 5, 6, 17, Champions League nach 8, 24.
- Maße aus dem Mock (Klassen `.vf`):
  - Gruppen- und Einzeltitel („Sport“, „KI-News“) 34 px, Gewicht 280, auf dem iPhone 30 px.
  - Kacheltitel 16 px, Gewicht 720, davor Quadrat 9 × 9 px.
  - Partie: Raster aus 50 px (Zeit), Teams und 34 px (Ergebnis).
  - Grenzlinie 1,5 px in `--farbe`.
  - Absender: Raster aus 210 px (Name, 19 px, Gewicht 720, in `--farbe`) und Meldungen (höchstens 760 px), Haarlinie oben.
    Ab einer Breite unter 600 px steht der Name über den Meldungen.
  - Sport ab 900 px in drei Spalten mit 48 px Abstand.
- Tippflächen bleiben mindestens 44 px hoch (`min-h-11`). Teamlogos bleiben die echten von ESPN, die Kürzel-Kreise sind nur Mock.
- Vor jedem Commit `npm run check`.

## Prüf-Schwerpunkte

1. Eine Lücke `···` liegt genau an einer Grenze (Platz 4 sichtbar, Platz 5 nicht): keine Linie. Test in Aufgabe 1.
2. Mein Team steht direkt an einer Grenze: orange Markierung und Linie erscheinen beide. Test in Aufgabe 1.
3. Eine Kachel mit Fehler ohne bisherigen Stand behält Farbe und ihren Platz in der Gruppe Sport. Test in Aufgabe 3 und 4.
4. Auf dem iPhone (390 px) steht alles in einer Spalte, ohne waagrechtes Scrollen. Abnahme in Aufgabe 6.
5. Eine Kachel ohne Gruppe (KI-News) steht nicht unter „Sport“ und trägt den großen Titel. Test in Aufgabe 4.

## Fremde Dienste

| Dienst | Timeout | Bei Ausfall | Grenze des Tarifs | Wiederholung | Bedingungen |
|---|---|---|---|---|---|
| Google Fonts über `next/font` | – (beim Build) | Build lädt die Schrift beim Bauen und liefert sie selbst aus, zur Laufzeit kein Abruf | keine | Build neu starten | Open Font License, erlaubt |

### Aufgabe 1: Linien in der Tabelle

**Dateien:**
- Ändern: `lib/einstellungen.ts` (Feld `linien` in `FussballEinstellung`, Werte in `KACHELN`)
- Ändern: `lib/kacheln/fussball/typen.ts`, `lib/kacheln/fussball/laden.ts`, `lib/kacheln/fussball/ansicht.tsx`
- Test: `__tests__/fussball-ansicht.test.tsx`, `__tests__/fussball-laden.test.ts`

**Schnittstellen:**
- Liefert: `FussballEinstellung.linien: number[]` und `FussballDaten.linien: number[]` (Plätze, nach denen eine Linie kommt).
  Die Zeile trägt `data-linie` und unten eine Linie in `var(--farbe)`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - `fussball-ansicht`: „nach Platz 4 kommt eine Linie, wenn Platz 5 folgt“ mit Tabelle `[1, null, 3, 4, 5]`, `linien: [4]` →
    Zeile 4 hat `data-linie`, die anderen nicht.
  - „keine Linie über eine Lücke“ mit `[1, null, 4, null, 7]`, `linien: [4]` → keine Zeile hat `data-linie`.
  - „Mein Team an der Grenze hat Markierung und Linie“: Platz 4 ist Mein Team → `data-mein-team` und `data-linie`.
  - `fussball-laden`: `ladeFussball` gibt `linien` der Einstellung zurück.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen** `npx vitest run __tests__/fussball-ansicht.test.tsx __tests__/fussball-laden.test.ts`
- [ ] **Schritt 3: Umsetzen.** Linie, wenn `linien` den Platz der Zeile enthält und das nächste Element des Ausschnitts die Zeile mit Platz + 1 ist.
  Werte in `KACHELN` nach den festen Vorgaben.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen** `npm run check`, `git commit -m "Draw qualification lines in tables"`

### Aufgabe 2: Farben und Schrift als Grundlage

**Dateien:**
- Ändern: `app/globals.css`, `app/layout.tsx`, `app/manifest.ts`, `src-tauri/tauri.conf.json` (Hintergrund der Mac-App)
- Ändern: `app/dashboard.tsx` (Kopf: Datum 17 px, Gewicht 650, daneben „Stand 17:42“ in `gedaempft`, Abmelden als ruhiger Knopf),
  `app/login/page.tsx` (`font-titel` entfällt)
- Test: `__tests__/layout.test.ts`, `__tests__/manifest.test.ts`

**Schnittstellen:**
- Liefert: Token `grund`, `rand`, `text`, `gedaempft`, `rauch`, `akzent`, `info`, `fehler` und `--font-sans` mit Commissioner. `--font-titel` entfällt.

- [ ] **Schritt 1: Fehlschlagende Tests anpassen:** `globals.css` enthält `--color-grund: #171b22` und `--color-rauch: #69727f`,
  `viewport.themeColor` und Manifest nennen `#171B22`. Die Attrappe von `next/font/google` liefert `Commissioner`.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen** `npx vitest run __tests__/layout.test.ts __tests__/manifest.test.ts`
- [ ] **Schritt 3: Umsetzen.** Commissioner mit `next/font/google`, Gewicht variabel. Kopf nach Mock F.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen** `npm run check`, `git commit -m "Switch to slate palette and Commissioner"`

### Aufgabe 3: Farbe je Kachel, Kachel ohne Kasten

**Dateien:**
- Ändern: `lib/einstellungen.ts` (Typ `Aussehen`, Felder `aussehen` und `gruppe?` an jeder Kacheleinstellung)
- Ändern: `lib/kacheln/typen.ts`, `lib/kacheln/laden.ts`, `lib/kacheln/stand.ts`, `lib/kacheln/kachel.tsx`
- Test: `__tests__/kacheln-laden.test.ts`, `__tests__/kacheln-stand.test.ts`, `__tests__/kachel.test.tsx`

**Schnittstellen:**
- Liefert: `export type Aussehen = { farbe: string; marke?: string }`. `KachelAntwort` und `KachelAnzeige` tragen `aussehen: Aussehen`
  und `gruppe?: string`, auch im Zustand Fehler. `Kachel` setzt `--farbe` und `--marke` (`marke ?? farbe`) auf ihr `<section>`.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - `kacheln-laden`: Aussehen und Gruppe kommen bei `ok` und bei `fehler` aus der Einstellung mit.
  - `kacheln-stand`: Eine Kachel mit Fehler ohne bisherigen Stand behält `aussehen` und `gruppe` aus der Antwort.
  - `kachel`: Die Kachel setzt `--farbe: #E3343F` und `--marke: #E3343F`. Mit `marke` gesetzt ist `--marke` die Marke.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Umsetzen.** Kein Rahmen, keine Fläche. Kopf: Quadrat in `--marke`, Titel, ↻. Gruppe `"Sport"` an den drei Fußball-Kacheln.
  Der Fehlerhinweis behält seine Texte, steht aber als Text mit Knopf ohne gestrichelten Kasten.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen** `npm run check`, `git commit -m "Give tiles house colours without boxes"`

### Aufgabe 4: Gruppe Sport

**Dateien:**
- Neu: `lib/kacheln/gruppen.ts`
- Ändern: `app/dashboard.tsx`, `lib/kacheln/kachel.tsx` (großer Titel für Kacheln ohne Gruppe)
- Test: `__tests__/kacheln-gruppen.test.ts`, `__tests__/page.test.tsx`

**Schnittstellen:**
- Nutzt: `KachelAnzeige.gruppe` aus Aufgabe 3.
- Liefert: `gruppiere(kacheln: KachelAnzeige[]): { gruppe: string | null; kacheln: KachelAnzeige[] }[]`. Aufeinanderfolgende Kacheln
  derselben Gruppe bilden einen Block, die Reihenfolge bleibt. `Kachel` bekommt `gross?: boolean` für den Titel in 34 px.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - `kacheln-gruppen`: `[BL(Sport), PL(Sport), CL(Sport), KI]` → `[{Sport: BL, PL, CL}, {null: KI}]`.
  - `page`: In der Region „Sport“ stehen Bundesliga und Premier League, KI-News steht außerhalb, ihr Titel ist eine Überschrift der Ebene 2.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Umsetzen.** Gruppe als `<section aria-label>` mit `<h2>` „Sport“, darin die Kacheln ab 900 px in drei Spalten.
  Kacheln ohne Gruppe nehmen die ganze Breite und tragen ihren Titel als `<h2>`.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen** `npm run check`, `git commit -m "Group football tiles under Sport"`

### Aufgabe 5: Absender in eigener Spalte

**Dateien:**
- Ändern: `lib/einstellungen.ts` (Feld `aussehen` in `AbsenderEinstellung`, Werte in `ABSENDER`)
- Ändern: `lib/kacheln/ki-news/laden.ts` (`AbsenderStand.aussehen`), `lib/kacheln/ki-news/ansicht.tsx`
- Test: `__tests__/ki-news-laden.test.ts`, `__tests__/ki-news-ansicht.test.tsx`

**Schnittstellen:**
- Nutzt: `Aussehen` aus Aufgabe 3.
- Liefert: `AbsenderStand.aussehen: Aussehen`. Jeder Absender ist ein `<section aria-label={name}>` mit `--farbe` und `--marke`, Name als
  Überschrift in der linken Spalte.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**
  - `ki-news-laden`: Der Stand eines Absenders trägt das Aussehen seiner Einstellung, auch wenn er nicht erreichbar ist.
  - `ki-news-ansicht`: Der Abschnitt „Anthropic“ setzt `--farbe: #E8E6DC` und `--marke: #D97757`.
- [ ] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**
- [ ] **Schritt 3: Umsetzen.** Raster nach den festen Vorgaben, Container Query bei 600 px. Ruhige Absender stehen wie bisher am Ende,
  im selben Raster, Name in `gedaempft`.
- [ ] **Schritt 4: Tests laufen lassen, sie müssen bestehen**
- [ ] **Schritt 5: Prüfen und committen** `npm run check`, `git commit -m "Show news senders in a coloured column"`

### Aufgabe 6: Feinschliff, Doku und Abnahme

**Dateien:**
- Ändern: `lib/kacheln/fussball/ansicht.tsx` (Raster der Partie, Mein Team mit orangem Namen, Spieltag unter dem Kacheltitel)
- Ändern: `lib/kacheln/ki-news/ansicht.tsx` (Knopf der Zusammenfassung als Text „Zusammenfassung“ unter dem Titel, Kasten als Linie links)
- Ändern: `docs/Projektvision.md` (Schritt 2 erledigt, Nachtrag Aussehen F, Hausfarben, Orange), `docs/Glossar.md` falls ein Begriff fehlt

- [ ] **Schritt 1: Maße umsetzen.** Bestehende Tests bleiben grün, Namen von Knöpfen nur ändern, wenn der Test mitzieht. `npm run check`.
- [ ] **Schritt 2: Doku nachtragen und committen** `git commit -m "Tighten rows, document new look"`
- [ ] **Schritt 3: Abnahme durch den Entwickler** in der Vorschau von Vercel auf Mac und iPhone: Gruppe Sport, Linien, Absender getrennt,
  auf dem iPhone kein waagrechtes Scrollen.

## Aufgetaucht

- Feste Vorgaben: Die Hausfarben stammen aus dem Wissen des Mock-Agents und sind nicht nachgeschlagen (The Decoder unsicher, ersetzt durch Graugrün).
- Aufgabe 2: Auch Manifest und Mac-App (`tauri.conf.json`) bekommen den neuen Grund `#171B22`, damit beim Start kein anderer Farbton
  aufblitzt. Die Mac-App zeigt das erst nach einem neuen Build. Die Symbole der App bleiben unverändert.
- Aufgabe 2: Die Login-Seite bekommt nur die neue Schrift und Farben, keinen eigenen Mock.
- Aufgabe 6: Der Knopf „KI“ für die Zusammenfassung (Mock vom 2026-11-15) wird zum Text „Zusammenfassung“ wie in F. Die Markierung
  „KI-generiert“ bleibt.
- Aufgabe 3: Der Fehlerhinweis behält seine heutigen Texte, nicht die Texte aus dem Mock.
- Kopf: Der Mock liegt als `assets/mocks/2026-11-16-aussehen-f.html` im Repo, ein neuer Unterordner.
