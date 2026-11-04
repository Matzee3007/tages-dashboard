---
titel: "ADR 0004: Kacheln über eine eigene Schnittstelle"
status: akzeptiert
erstellt: 2026-11-04
tags: [adr, architektur, kacheln]
---

# ADR (Architecture Decision Record) 0004: Kacheln über eine eigene Schnittstelle

## Kontext

Die Kacheln aktualisieren sich jede Minute, und bei einem Fehler soll eine Kachel ihren letzten Stand weiter zeigen. Auf dem
iPhone ist ein Netzausfall normal. Die Reihenfolge der Kacheln steht in `lib/einstellungen.ts`. Grundlage:
[[projects/tages-dashboard/docs/Projektvision|Projektvision]] und der freigegebene Mock vom 2026-11-04.

## Entscheidung

- **Der Browser fragt `GET /api/kacheln` ab und führt die Antwort mit dem bisherigen Stand zusammen.** Der Stand liegt nur im
  Speicher der offenen Seite. Der Proxy schützt die Adresse wie jede andere
  ([[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]).
- **Nur Status 401 heißt abgemeldet:** Der Proxy antwortet bei `/api/*` mit 401 oder bei einem kurzen Ausfall von Supabase mit 503,
  statt weiterzuleiten. Sonst flöge die offene Seite bei jedem Aussetzer zum Login, und der letzte Stand wäre weg.
- **Eine Abfrage für alle Kacheln:** Der Server lädt sie getrennt, ein Fehler trifft nur die eine Kachel. Das ist eine Abfrage pro
  Minute, egal wie viele Kacheln es gibt.
- **CSS-Grid statt CSS-Spalten:** Die Reihenfolge läuft zeilenweise, und keine Kachel wechselt die Spalte, wenn sich die Höhe einer
  anderen ändert.
- **Ausgeblendet keine Abfragen** (`visibilitychange`), wieder sichtbar nach über einer Minute sofort eine.

## Alternativen

- **`router.refresh()` mit Server Components:** am wenigsten Code. Laut Quellcode von Next.js 16.4.3
  (`fetch-server-response.js`) wechselt es aber bei Netzfehler oder Status 500 zum vollen Neuladen der Seite. Der letzte Stand wäre
  weg, und ohne Netz stünde die Fehlerseite des Browsers da.
- **Eine Schnittstelle je Kachel:** noch unabhängiger, aber mehrere Aufrufe pro Minute auf dem Gratis-Tarif von Vercel.
- **Server Action als Abruf:** Actions sind für Änderungen gedacht und laufen nacheinander. Zudem bräuchte jede die eigene
  Anmeldeprüfung aus ADR 0002.
- **CSS-Spalten wie im ersten Entwurf:** kompakter, aber die Höhe bestimmt die Spalte. Fällt eine hohe Kachel aus, springen andere.

## Konsequenzen

- Eine neue Kachel braucht eine Ladefunktion in `lib/kacheln/laden.ts`, einen Fall in `KachelInhalt` (`app/dashboard.tsx`) und ihre
  Daten in `KachelDaten`. Andere Kacheln bleiben unberührt.
- Die Ansichten laufen als Client Components. Geheimnisse gehören deshalb nur in die Ladefunktionen.
- Nach einem Neuladen der Seite ist der letzte Stand weg, weil es keine Offline-Daten gibt.
- Die Antwort ist so langsam wie die langsamste Kachel. Das Zeitlimit je Kachel beträgt 8 Sekunden.
- Im Raster bleiben unter kurzen Kacheln Lücken.
