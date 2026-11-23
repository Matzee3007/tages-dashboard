---
titel: "Plan: Reiter und Übersicht „Heute“"
status: abgeschlossen
erstellt: 2026-11-23
tags: [plan, aussehen, kacheln, phase-3]
---

# Plan: Reiter und Übersicht „Heute“

**Ziel:** Das Dashboard bekommt Reiter „Heute“, „Sport“, „KI-News“. „Heute“ zeigt das Wichtigste aller Kacheln (Jetzt live, Mein Team,
Neu in den KI-News), die anderen Reiter zeigen die vollen Kacheln wie bisher.

**Vorgehen:** Erst das Gerüst mit Reitern um die bestehenden Kacheln (riskantester Teil: Grundform der Seite, iPhone-Leiste in der PWA),
dann je Kachel-Art eine reine Funktion für die Kurzfassung, dann die Ansicht „Heute“ und der Sprung in den Reiter. Server und
`GET /api/kacheln` bleiben unverändert.

**Technik:** Next.js 16, React, Tailwind CSS 4, Vitest, Testing Library.

**Anforderung:** [[projects/tages-dashboard/docs/adr/0014-reiter-mit-uebersicht|ADR 0014]], Mock `assets/mocks/2026-11-23-struktur.html`,
Variante D (Funktionen `dHeute`, `dInhalt`, `dOben`, Klassen `.tabbar`, `.reiter-oben`), gewählt am 2026-11-23. Kritik des Entwicklers:
zu viel gleichzeitig, keine Rangfolge, zu lang zum Scrollen.

## Feste Vorgaben

- Aussehen G bleibt: Token aus `app/globals.css`, Karten wie `lib/kacheln/kachel.tsx`, Orange (`akzent`) allein für Mein Team, Live und „Neu“.
- Reiter einer Kachel: `gruppe ?? titel` aus `KACHELN` (Bundesliga, PL, CL → „Sport“, KI-News → „KI-News“). Keine neue Einstellung.
- Reihenfolge der Reiter: „Heute“ zuerst, dann die übrigen in der Reihenfolge ihrer ersten Kachel in `KACHELN`.
- Beim Öffnen und nach dem Neuladen steht „Heute“ vorn. Der Reiter ist Zustand im Browser, keine eigene Route (ADR 0014).
- Unter 600 px Breite: Leiste unten, fest, mit `padding-bottom: env(safe-area-inset-bottom)`. Ab 600 px: Reiter oben im Kopf.
- Abzeichen: am Reiter Sport ein orangefarbener Punkt, solange eine Partie läuft; am Reiter KI-News die Zahl der neuen Meldungen.
- „Neu“ heißt dasselbe wie das Etikett in der Kachel: `istFrisch(meldung.zeit, jetzt, meldung.nurDatum)` aus `lib/zeit.ts`.
- Bedienung: Reiter sind `<button>` in `<nav aria-label="Bereiche">` mit `aria-current="page"` am aktiven, Mindesthöhe 44 px.

## Prüf-Schwerpunkte

- Keine Partie läuft (Montag): „Heute“ zeigt keine leere Karte „Jetzt live“, sondern lässt sie weg; Mein Team zeigt die nächsten Partien.
- Eine Kachel meldet Fehler (`daten: null`): „Heute“ zeigt die übrigen Kacheln, ohne abzustürzen → Test in Aufgabe 4.
- Minutentakt beim Reiterwechsel: Wechsel von „Sport“ zu „Heute“ und zurück löst keinen neuen Abruf aus und behält die Daten → Test in Aufgabe 1.
- Keine neuen KI-Meldungen: Karte „Neu in den KI-News“ sagt „Heute nichts Neues“ und verlinkt in den Reiter → Test in Aufgabe 4.
- iPhone-PWA: Die Leiste unten verdeckt weder den letzten Inhalt noch liegt sie unter dem Home-Balken → Abnahme in Aufgabe 6.
- Unsichtbare Anforderungen: keine neue. Daten und Schnittstelle bleiben hinter dem Login (unverändert, `proxy.test.ts`).

## Fremde Dienste

keine (nur Daten, die `GET /api/kacheln` schon liefert)

## Dateien

| Datei | Zuständig für |
|---|---|
| `lib/kacheln/reiter.ts` (neu) | Reiter aus den Kacheln ableiten |
| `lib/kacheln/reiter-leiste.tsx` (neu) | Leiste unten und Reiter oben, mit Abzeichen |
| `lib/kacheln/fussball/kurz.ts` (neu) | Kurzfassung einer Fußball-Kachel |
| `lib/kacheln/ki-news/kurz.ts` (neu) | Kurzfassung der KI-News |
| `lib/kacheln/uebersicht.ts` (neu) | Kurzfassungen aller Kacheln zu „Heute“ zusammenführen |
| `lib/kacheln/heute.tsx` (neu) | Ansicht „Heute“ |
| `app/dashboard.tsx` | Reiterzustand, zeigt „Heute“ oder die Kacheln des Reiters |
| `docs/Glossar.md` | Begriffe Reiter, Übersicht |

## Aufgaben

### Aufgabe 1: Reiter um die bestehenden Kacheln

**Dateien:** Neu `lib/kacheln/reiter.ts`, `lib/kacheln/reiter-leiste.tsx`. Ändern `app/dashboard.tsx`, `docs/Glossar.md`. Test
`__tests__/kacheln-reiter.test.ts`, `__tests__/page.test.tsx`.

**Schnittstellen:**

- Liefert: `HEUTE = "Heute"`, `reiterVon(kachel: KachelKopf): string`, `reiterListe(kacheln: KachelKopf[]): string[]` in `reiter.ts`.
- Liefert: `ReiterLeiste({ reiter, aktiv, waehle, abzeichen }: { reiter: string[]; aktiv: string; waehle: (name: string) => void;
  abzeichen: Record<string, "live" | number> })`.
- „Heute“ zeigt in dieser Aufgabe noch einen Platzhalter `<p>Übersicht folgt.</p>`, er fällt in Aufgabe 4 weg.

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

```ts
test("reiterListe: Heute zuerst, dann Gruppe oder Titel in Reihenfolge der Kacheln", () => {
  expect(reiterListe([{ ...BL, gruppe: "Sport" }, { ...PL, gruppe: "Sport" }, KI_NEWS])).toEqual(["Heute", "Sport", "KI-News"]);
});
```

In `page.test.tsx`: `test("Reiter wechseln zeigt die Kacheln des Reiters und ruft nicht neu ab")`: nach dem Laden ist „Heute“
`aria-current="page"`; Klick auf „Sport“ zeigt die Überschrift der Bundesliga-Kachel, nicht „Introducing Claude“; Klick auf
„KI-News“ zeigt „Introducing Claude“; `holeDashboard` wurde genau einmal aufgerufen.

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`npm test -- __tests__/kacheln-reiter.test.ts __tests__/page.test.tsx`
Erwartet: FAIL (Modul `@/lib/kacheln/reiter` fehlt, Knopf „Sport“ nicht gefunden)

- [x] **Schritt 3: `reiter.ts`, `ReiterLeiste`, Zustand `aktiv` in `Dashboard`**

Im Reiter „Sport“ stehen die Kacheln wie bisher mit `gruppiere`, ohne die Überschrift der Gruppe (der Reiter nennt sie schon). Glossar:
**Reiter** (Bereich der Seite, den man oben oder unten wählt; _Nicht verwenden_: Tab, Seite) und **Übersicht** („Heute“, das Wichtigste
aller Kacheln; _Nicht verwenden_: Startseite, Dashboard).

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`npm test` → Erwartet: PASS, auch die bestehenden Tests in `page.test.tsx` (gegebenenfalls erst in den passenden Reiter klicken).

- [x] **Schritt 5: Prüfen, ansehen und committen**

`bash checks.sh`, dann `npm run dev` und in Mac- und iPhone-Breite (390 px) im Browser ansehen. Commit „Add tabs around tiles“.

Nachtrag 2026-11-23: Lokal nicht angesehen, weil die Seite einen Login braucht. Das Ansehen wandert in die Vorschau von Vercel
(Aufgabe 6, Schritt 2).

### Aufgabe 2: Kurzfassung einer Fußball-Kachel

**Dateien:** Neu `lib/kacheln/fussball/kurz.ts`. Test `__tests__/fussball-kurz.test.ts`.

**Schnittstellen:**

- Liefert:

```ts
export type Platz = { platz: number; punkte: number; zone: Zone | null };
export type TeamKurz = { id: string; name: string; logo: string | null; partie: Partie | null; platz: Platz | null };
export type FussballKurz = { live: Partie[]; meinTeam: TeamKurz[] };
export function fussballKurz(daten: FussballDaten): FussballKurz;
```

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

- `live`: alle Partien mit `status: "laeuft"`, in der Reihenfolge der Daten.
- `meinTeam`: je id aus `daten.meinTeam` ein Eintrag. `partie` ist die laufende Partie des Teams, sonst die nächste mit `"vorher"` (frühester
  `anstoss`), sonst die letzte mit `"vorbei"`, sonst `null`. `"abgesagt"` zählt nie.
- `platz` aus der Tabellenzeile mit derselben `id`, `zone` die aus `daten.zonen` mit `von <= platz <= bis`; `null`, wenn die Tabelle `null`
  ist oder das Team darin fehlt.
- `name` und `logo` aus der Partie, sonst aus der Tabelle, sonst `name: id`.

Beispiel: `expect(fussballKurz(spieltag).meinTeam[0]).toMatchObject({ id: "132", partie: { id: "p-live" }, platz: { platz: 1, zone: { name: "Champions League" } } })`.

- [x] **Schritt 2: fehlschlagen sehen** `npm test -- __tests__/fussball-kurz.test.ts`
- [x] **Schritt 3: `fussballKurz` umsetzen**
- [x] **Schritt 4: bestehen sehen** `npm test -- __tests__/fussball-kurz.test.ts`
- [x] **Schritt 5:** `bash checks.sh`, Commit „Add short form of football tiles“

### Aufgabe 3: Kurzfassung der KI-News

**Dateien:** Neu `lib/kacheln/ki-news/kurz.ts`. Test `__tests__/ki-news-kurz.test.ts`.

**Schnittstellen:**

- Liefert: `export type NeueMeldung = { absender: string; aussehen: Aussehen; meldung: Meldung };`
  `export function kiNewsKurz(daten: KiNewsDaten, jetzt: Date): NeueMeldung[];`

- [x] **Schritt 1: Fehlschlagende Tests schreiben:** nur Meldungen mit `istFrisch(zeit, jetzt, nurDatum)`, über alle Absender, neueste
      zuerst (nach `Date.parse(zeit)`), unerreichbare Absender mit ihren alten Meldungen zählen mit, wenn sie frisch sind.
- [x] **Schritt 2: fehlschlagen sehen** `npm test -- __tests__/ki-news-kurz.test.ts`
- [x] **Schritt 3: `kiNewsKurz` umsetzen**
- [x] **Schritt 4: bestehen sehen**
- [x] **Schritt 5:** `bash checks.sh`, Commit „Add short form of AI news“

### Aufgabe 4: Übersicht „Heute“

**Dateien:** Neu `lib/kacheln/uebersicht.ts`, `lib/kacheln/heute.tsx`. Ändern `app/dashboard.tsx` (Platzhalter aus Aufgabe 1 ersetzen,
Abzeichen füllen). Test `__tests__/kacheln-uebersicht.test.ts`, `__tests__/page.test.tsx`.

**Schnittstellen:**

- Nutzt: `fussballKurz` (Aufgabe 2), `kiNewsKurz` (Aufgabe 3), `reiterVon` (Aufgabe 1).
- Liefert:

```ts
export type Herkunft = { kachelId: string; reiter: string; aussehen: Aussehen; titel: string };
export type LiveEintrag = Herkunft & { partie: Partie };
export type MeinTeamEintrag = { id: string; name: string; logo: string | null; wettbewerbe: (Herkunft & TeamKurz)[] };
export type Uebersicht = { live: LiveEintrag[]; meinTeam: MeinTeamEintrag[]; neu: (NeueMeldung & { reiter: string })[]; newsReiter: string | null };
export function uebersicht(kacheln: KachelAnzeige[], jetzt: Date): Uebersicht;
export function abzeichen(stand: Uebersicht): Record<string, "live" | number>;
export function Heute({ uebersicht, waehle }: { uebersicht: Uebersicht; waehle: (reiter: string, kachelId?: string) => void });
```

- [x] **Schritt 1: Fehlschlagende Tests schreiben**

- `uebersicht`: Kacheln mit `daten: null` werden übersprungen. `meinTeam` fasst dasselbe Team (gleiche ESPN-id, z. B. „132“ in BL und CL)
  über Wettbewerbe zusammen, Reihenfolge der ersten Nennung. Abzeichen: `live.length > 0` → Sport `"live"`, `neu.length` → KI-News.
- `Heute` (in `page.test.tsx`): Karte „Jetzt live“ nur, wenn `live` nicht leer; Karte „Mein Team“ mit Name, Partie (Ergebnis oder
  Anstoß) und Chip „Platz 1 · 30 Pkt“ je Wettbewerb mit Marke (BL, CL); Karte „Neu in den KI-News“ mit der neuesten Meldung groß und
  höchstens 6 weiteren, ohne neue Meldung der Satz „Heute nichts Neues“.

- [x] **Schritt 2: fehlschlagen sehen** `npm test -- __tests__/kacheln-uebersicht.test.ts __tests__/page.test.tsx`
- [x] **Schritt 3: `uebersicht`, `Heute` umsetzen,** Aufbau und Maße nach `dHeute` im Mock (Mac: zwei Spalten, links Live und Mein Team,
      rechts KI-News; iPhone: untereinander). Partien mit der bestehenden Darstellung aus `lib/kacheln/fussball/ansicht.tsx`, ohne Bericht.
- [x] **Schritt 4: bestehen sehen** `npm test`
- [x] **Schritt 5:** `bash checks.sh`, ansehen in beiden Breiten, Commit „Add today overview“ (Ansehen wie bei Aufgabe 1 in die Vorschau
      verschoben)

Nachtrag 2026-11-23: Beim Bauen kamen `newsReiter` (wohin „Alle Meldungen“ führt, auch ohne neue Meldung) und `abzeichen` dazu.

### Aufgabe 5: Sprung aus „Heute“ in den Reiter

**Dateien:** Ändern `lib/kacheln/heute.tsx`, `app/dashboard.tsx`. Test `__tests__/page.test.tsx`.

- [x] **Schritt 1: Fehlschlagender Test:** Klick auf „Alle Partien im Reiter Sport“ macht „Sport“ aktiv; Klick auf die Zeile des
      Wettbewerbs über einer Partie in „Jetzt live“ macht „Sport“ aktiv und ruft `scrollIntoView` an der Kachel mit `id={kachel.id}` auf (in
      jsdom gemockt); Klick auf „Alle Meldungen im Reiter KI-News“ macht „KI-News“ aktiv. Links zu Artikeln öffnen weiter die Quelle, nicht
      den Reiter.

  Nachtrag 2026-11-23: Getippt wird die Zeile des Wettbewerbs (Marke und Name, mit „›“) statt der Partie selbst. Eine ganze Partie als
  Knopf wäre kein gültiges HTML, und Torschützen darin ließen sich schlechter lesen. Die Zeile steht auch über den Partien in „Mein Team“.
- [x] **Schritt 2: fehlschlagen sehen**
- [x] **Schritt 3:** `waehle(reiter, kachelId?)` in `Dashboard`: Reiter setzen, Seite nach oben, mit `kachelId` nach dem Rendern zur Kachel
      scrollen (`useEffect` auf den gewählten `kachelId`). Die Kachel bekommt `id={kachel.id}` in `lib/kacheln/kachel.tsx`.
- [x] **Schritt 4: bestehen sehen** `npm test`
- [x] **Schritt 5:** `bash checks.sh`, Commit „Jump from today overview to tabs“

### Aufgabe 6: Plan prüfen, PR und Abnahme

- [x] **Schritt 1:** `plan-pruefer` gegen diesen Plan, dann PR, `/code-review medium`, Funde mit dem Entwickler, Merge (PR #95).
      `plan-pruefer` zuerst NICHT ERFÜLLT (drei fehlende Tests, nachgeholt). Review: 10 Funde, die 2 wichtigen und 5 kleinen behoben,
      3 erst mit künftigen Kacheln spürbare in die Übergabe. Der Build brach beim Vorab-Rendern an `new Date()` ab, seitdem baut `checks.sh`
      die Produktionsfassung mit.
- [x] **Schritt 2: Abnahme durch den Entwickler** in Production auf Mac und iPhone (PWA neu öffnen): Reiter wechseln, Leiste unten liegt
      über dem Home-Balken und verdeckt nichts, „Heute“ zeigt Mein Team und Neues, an einem Spieltag auch „Jetzt live“. Ergebnis hier
      eintragen.

  Ergebnis 2026-11-23: Vorschau von Vercel auf Mac und iPhone abgenommen („passt“). „Jetzt live“ an einem Spieltag und die PWA in
  Production stehen mit dem Live-Test der Champions League am 2026-11-24 in der Übergabe.
- [x] **Schritt 3:** Projektvision: Nachtrag „Reiter und Übersicht“ unter Phase 3 mit PR, dieser Plan `status: abgeschlossen`.
