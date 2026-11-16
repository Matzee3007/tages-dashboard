---
titel: "Plan: Aussehen G (Spielfeld + Zeitung)"
status: aktiv
erstellt: 2026-11-17
tags: [plan, aussehen, sport, ki-news]
---

# Plan: Aussehen G (Spielfeld + Zeitung)

**Ziel:** Das Dashboard bekommt das Aussehen von Variante G: Karten statt kastenloser Bereiche. Sport nach dem Muster von Fußball-Apps:
Partien nach Tag, symmetrisch um ein Ergebnisfeld, Torschützen unter ihrem Team, Zonenbalken mit Legende in der Tabelle. KI-News nach
dem Muster von Nachrichten-Apps: Karte je Absender, die neueste Schlagzeile groß.

**Vorgehen:** Erst die Daten, die G braucht (Seite jedes Tors, Zonen statt Linien), dann Grundlage und Karten, dann die beiden Ansichten.
Der Rest bleibt, wie PR #80 ihn gebaut hat: Hausfarben, Gruppe Sport, Daten je Absender.

**Technik:** Next.js 16, React, Tailwind CSS 4 (Container Queries), Vitest, Testing Library.

**Anforderung:** Mock Runde 3, Variante G, im Gespräch freigegeben am 2026-11-17: `assets/mocks/2026-11-17-aussehen-g.html` (Schalter
„G Spielfeld + Zeitung“, Klassen `.vg`). Vorbilder des Entwicklers: FotMob und Apple News. Seine Kritik an F (PR #80): „zu leer, zu
wenig Struktur, zu unprofessionell“. Ebenfalls entschieden: Torschützen getrennt nach Team, wenn ESPN das Team liefert (geprüft, siehe Versuch).

**Versuch:** Liefert ESPN zu jedem Tor das Team? **Trägt.** `competitions[0].details[].team.id` nennt das Team, dem das Tor
gutgeschrieben wird, bei einem Eigentor also den Gegner des Schützen (geprüft am 2026-11-17 an 5 Eigentoren, z. B. Bischof → Freiburg 126).

## Feste Vorgaben

- Weiter: immer dunkel, Schrift Commissioner, Hausfarben aus der Einstellungsdatei, Orange `#FF8A3D` allein für Mein Team, Live und „neu“.
- Neue Token in `app/globals.css` aus dem Mock: `grund #0F1318`, `karte #1A1F27`, `flaeche #222831`, `rand #2A313B`, `grenze #4A5260`,
  `text #E8EBF0`, `gedaempft #939CAA`, `rauch #6C7583`, `lesetext #C9D0DA`. `akzent`, `info #86ABF5`, `fehler #F59A90` bleiben.
- Zonen je Wettbewerb (Name, Farbe):
  - Bundesliga: 1–4 Champions League `#4C8DF6`, 5 Europa League `#22B8CF`, 6 Conference League `#4CC38A`, 16 Relegation `#E2B93B`,
    17–18 Abstieg `#E5484D`.
  - Premier League: 1–4 Champions League, 5 Europa League, 6 Conference League, 18–20 Abstieg (Farben wie oben).
  - Champions League: 1–8 Achtelfinale `#4CC38A`, 9–24 Play-offs `#22B8CF`.
  - Eine Grenzlinie (1 px, `grenze`) steht zwischen zwei Plätzen, die in verschiedenen Zonen liegen (auch „keine Zone“ zählt), nur wenn
    beide Plätze im Ausschnitt direkt aufeinander folgen. Das ergibt dieselben Plätze wie bisher `linien`.
- Kürzel der Kachel-Marke: BL, PL, CL, KI.
- Maße aus dem Mock (`.vg`):
  - Karte: Fläche `karte`, Radius 16 px. Kopf: Marke 34 × 34 px (Radius 10 px, Kürzel 12,5 px / 800), Titel 16,5 px / 740, darunter
    Spieltag 12,5 px in `gedaempft`.
  - Kopf der Seite: Wochentag 15 px / 600 in `gedaempft`, darüber nichts. Datum 34 px / 780 (iPhone 30 px). Rechts „Aktualisiert“ und
    Abmelden als Pille (`karte`).
  - Gruppentitel und großer Kacheltitel 28 px / 780 (iPhone 26 px). Raster ab 900 px drei Spalten, Abstand 16 px.
  - Tageszeile: Fläche `flaeche`, 12,5 px / 650. Partie: Raster 36 px | Heim (rechtsbündig) | 58 px Feld | Gast, mindestens 52 px hoch,
    Linie oben. Feld 30 px hoch, Radius 8 px: Ergebnis 15,5 px / 760 auf `flaeche`, Anstoß 13,5 px. Live: Feld orange getönt mit
    orangem Rand, Minute links orange. Torschützen 11,5 px in `rauch`, je Tor eine Zeile unter seinem Team.
  - Tabelle: Platzziffer mit Balken 3 × 18 px in der Zonenfarbe, Zeilen 32 px, Legende der sichtbaren Zonen darunter (11,5 px).
  - KI-News: Karte je Absender (Innenabstand 16/18 px), Name 15 px / 780 in `--farbe` mit Quadrat 10 px in `--marke`. Erste Meldung
    20 px / 720, weitere 15 px / 600 mit Linie oben. Der Absender mit der neuesten Meldung ist „groß“: zwei Spalten breit, Schlagzeile
    28 px / 760 (iPhone 24 px), weitere Meldungen ab 900 px rechts daneben. Raster ab 640 px zwei, ab 900 px drei Spalten.
  - Unter der Schlagzeile „Neu“ (orange, mit Punkt) und das Alter in `gedaempft`. Zusammenfassung im Kasten `flaeche`, Radius 12 px,
    Marke „KI-generiert“ in `info`.
  - Absender ohne Meldung: gestrichelte Zeile über die volle Breite, Name in `gedaempft`, Status rechts daneben.
- Tippflächen mindestens 44 px. Vor jedem Commit `npm run check`.

## Prüf-Schwerpunkte

1. Ein Eigentor steht unter dem Team, dem ESPN es gutschreibt, mit „(ET)“. Test in Aufgabe 1.
2. Mein Team an einer Zonengrenze: orange Markierung, Zonenbalken und Linie erscheinen zusammen. Test in Aufgabe 2.
3. Partien über Mitternacht deutscher Zeit (Anstoß 23:30 UTC) landen unter dem deutschen Tag. Test in Aufgabe 4.
4. Eine abgesagte Partie zeigt „abgesagt“ im Feld, ohne Ergebnis. Test in Aufgabe 4.
5. Auf dem iPhone (390 px) kein waagrechtes Scrollen, lange Namen werden mit „…“ gekürzt. Abnahme in Aufgabe 6.

## Fremde Dienste

keine neuen. ESPN wird wie bisher abgerufen, gelesen wird ein Feld mehr (`details[].team.id`).

### Aufgabe 1: Torschützen nach Team

**Dateien:** Ändern `lib/kacheln/fussball/typen.ts`, `lib/kacheln/fussball/espn.ts`. Test `__tests__/fussball-espn.test.ts`.

**Schnittstellen:** Liefert `Tor = { text: string; seite: "heim" | "gast" }`. Fehlt das Team oder passt es zu keinem Teilnehmer, gilt `"heim"`.

- [x] **Schritt 1: Fehlschlagender Test:** „ein Tor gehört zum Team aus details“: Gast-Tor (team.id des Gasts) → `seite: "gast"`,
  Eigentor eines Gast-Spielers mit team.id des Heimteams → `seite: "heim"`, Text endet auf „(ET)“.
- [x] **Schritt 2: rot laufen lassen** `npx vitest run __tests__/fussball-espn.test.ts`
- [x] **Schritt 3: Umsetzen** in `leseTag`: `team.id` des Details mit `id` von Heim und Gast vergleichen.
- [x] **Schritt 4: grün**
- [x] **Schritt 5: `npm run check`, Commit** „Assign goals to home or away team“

### Aufgabe 2: Zonen statt Linien

**Dateien:** Ändern `lib/einstellungen.ts`, `lib/kacheln/fussball/typen.ts`, `lib/kacheln/fussball/laden.ts`,
`lib/kacheln/fussball/ansicht.tsx`. Test `__tests__/fussball-ansicht.test.tsx`, `__tests__/fussball-laden.test.ts`.

**Schnittstellen:** `export type Zone = { von: number; bis: number; name: string; farbe: string }` in `lib/einstellungen.ts`.
`FussballEinstellung.zonen: Zone[]` und `FussballDaten.zonen: Zone[]` ersetzen `linien`. Zeile trägt `data-zone={name}` und bei einer
Grenze `data-linie`.

- [x] **Schritt 1: Tests umschreiben und ergänzen:**
  - Die drei Linien-Tests bleiben, mit `zonen` statt `linien` (z. B. Zone 1–4 → Linie nach 4).
  - „Platz 5 trägt die Zone Europa League“ (`data-zone`).
  - „die Legende nennt nur die Zonen im Ausschnitt“: Ausschnitt 1, ···, 4, 5, 6 mit BL-Zonen → Legende „Champions League“, „Europa
    League“, „Conference League“, nicht „Abstieg“.
  - `fussball-laden`: `ladeFussball` gibt `zonen` der Einstellung zurück.
- [x] **Schritt 2: rot**
- [x] **Schritt 3: Umsetzen.** Linie, wenn das nächste Element des Ausschnitts eine Zeile ist, deren Platz höher ist und deren Zone
  (Name oder keine) anders ist. Zonen in `KACHELN` nach den festen Vorgaben, `linien` entfällt.
- [x] **Schritt 4: grün**
- [x] **Schritt 5: `npm run check`, Commit** „Replace table lines with zones and legend“

### Aufgabe 3: Grundlage und Karten

**Dateien:** Ändern `app/globals.css`, `app/layout.tsx`, `app/manifest.ts`, `src-tauri/tauri.conf.json`, `app/dashboard.tsx`,
`lib/einstellungen.ts` (`Aussehen.kuerzel?`), `lib/kacheln/kachel.tsx`. Test `__tests__/layout.test.ts`, `__tests__/manifest.test.ts`,
`__tests__/kachel.test.tsx`, `__tests__/page.test.tsx`.

**Schnittstellen:** `Aussehen = { farbe: string; marke?: string; kuerzel?: string }`. Mit `kuerzel` zeigt die Kachel die Marke mit
Kürzel. Funde 6 und 8 aus dem Review von PR #80 hier mit erledigen: ein Typ `KachelKopf` für die vier Kopffelder und eine Komponente
`GrosserTitel` für Gruppentitel und großen Kacheltitel.

- [x] **Schritt 1: Tests anpassen und ergänzen:** Grund `#0f1318` in CSS, `themeColor` und Manifest `#0F1318`. „die Marke zeigt das
  Kürzel“: Kachel mit `kuerzel: "BL"` zeigt „BL“. `page`: Wochentag und Datum stehen getrennt („Sonntag“, „8. November“).
- [x] **Schritt 2: rot**
- [x] **Schritt 3: Umsetzen** nach den festen Vorgaben. Kachel als Karte, Fehlerhinweis im Kasten `flaeche` innerhalb der Karte.
- [x] **Schritt 4: grün**
- [x] **Schritt 5: `npm run check`, Commit** „Put tiles on cards with marks“

### Aufgabe 4: Partien nach Tag, symmetrisch

**Dateien:** Ändern `lib/zeit.ts` (`tagText(iso: string): string`, z. B. „Samstag, 21. November“), `lib/kacheln/fussball/ansicht.tsx`.
Test `__tests__/zeit.test.ts`, `__tests__/fussball-ansicht.test.tsx`.

- [ ] **Schritt 1: Fehlschlagende Tests:**
  - `zeit`: `tagText("2026-11-21T23:30:00Z")` → „Sonntag, 22. November“.
  - „Partien stehen unter ihrem Tag“: zwei Tage → zwei Tageszeilen, jede Partie unter ihrer.
  - „ein Tor steht unter seinem Team“: Heim-Tor im Bereich des Heimteams, Gast-Tor im Bereich des Gasts (`data-seite`).
  - „beendete Partie zeigt Ende und Ergebnis, offene die Anstoßzeit im Feld“, „abgesagte Partie zeigt abgesagt im Feld“.
  - Bestehende Tests („Torschützen in einer Zeile“, „eine Partie zeigt Anstoß …“) an das neue Aussehen anpassen, ihre Aussage bleibt.
- [ ] **Schritt 2: rot**
- [ ] **Schritt 3: Umsetzen** nach den festen Vorgaben. Reihenfolge der Partien wie bisher (`sortierePartien`), die Tageszeile
  erscheint, wenn der Tag wechselt.
- [ ] **Schritt 4: grün**
- [ ] **Schritt 5: `npm run check`, Commit** „Show matches by day around a score box“

### Aufgabe 5: KI-News als Karten

**Dateien:** Ändern `lib/kacheln/ki-news/ansicht.tsx`. Test `__tests__/ki-news-ansicht.test.tsx`.

- [ ] **Schritt 1: Fehlschlagende Tests:**
  - „der erste Absender ist die große Karte“: `data-gross` am ersten Absender mit Meldungen, nicht am zweiten.
  - „die erste Meldung eines Absenders ist die Schlagzeile“: Überschrift der Ebene 4 mit ihrem Titel, weitere Meldungen ohne.
  - „frische Meldungen zeigen Neu“ (Text „Neu“ statt nur Punkt).
- [ ] **Schritt 2: rot**
- [ ] **Schritt 3: Umsetzen** nach den festen Vorgaben. Absender ohne Meldung als gestrichelte Zeile am Ende.
- [ ] **Schritt 4: grün**
- [ ] **Schritt 5: `npm run check`, Commit** „Show news senders as cards with a lead story“

### Aufgabe 6: Doku und Abnahme

**Dateien:** `docs/Projektvision.md` (Nachtrag G ersetzt den Nachtrag F, „eine Zeile pro Partie“ und „Plätze der Linien“ angepasst),
`docs/tools/ESPN.md` (Feld `details[].team.id`), `docs/plaene/2026-11-16-neues-aussehen.md` (Hinweis: abgelöst durch diesen Plan).

- [ ] **Schritt 1: Doku nachtragen, Commit** „Document look G“
- [ ] **Schritt 2: Abnahme durch den Entwickler** in der Vorschau auf Mac und iPhone: Karten, Partien nach Tag, Torschützen unter dem
  Team, Zonen mit Legende, große erste Schlagzeile, kein waagrechtes Scrollen.

## Aufgetaucht

- Feste Vorgaben: Die Farben und Namen der Zonen hat der Mock-Agent gewählt, nicht nachgeschlagen. Bundesliga Platz 16 heißt „Relegation“.
- Feste Vorgaben: Die Grenzlinie ist jetzt neutral (`grenze`), nicht mehr in der Hausfarbe wie in F. Die Farbe tragen die Zonenbalken.
- Aufgabe 2: `zonen` ersetzt `linien` in der Einstellungsdatei, die Linien ergeben sich aus den Zonen.
- Aufgabe 3: Funde 6 und 8 aus dem Review von PR #80 werden hier miterledigt.
- Aufgabe 4: Die Partie braucht bis zu drei Zeilen, wenn ein Team mehrere Tore schießt. Die Regel „eine Zeile pro Partie“ gilt damit
  nur noch für die Zeile mit Teams und Ergebnis.
- Aufgabe 5: Die erste Meldung je Absender wird zur Überschrift (Ebene 4), damit Screenreader sie als Schlagzeile finden.
