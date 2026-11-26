---
titel: "ADR 0014: Reiter mit Übersicht „Heute“"
status: akzeptiert
erstellt: 2026-11-23
tags: [adr, architektur, aussehen, kacheln]
---

# ADR (Architectural Decision Record) 0014: Reiter mit Übersicht „Heute“

## Kontext

Alle Kacheln stehen voll ausgeklappt untereinander auf einer Seite. Der Entwickler fand das am 2026-11-23 „viel zu unaufgeräumt“:
zu viel gleichzeitig, keine Rangfolge (Live, Mein Team und Neues stechen nicht heraus), zu lang zum Scrollen. Mit Formel 1, NFL und
Schritten kämen weitere Kacheln dazu. Das Aussehen der Karten (Variante G, festgelegt im
[[projects/tages-dashboard/docs/plaene/2026-11-17-aussehen-g|Plan Aussehen G]]) bleibt.

## Entscheidung

Variante D aus dem Mock `assets/mocks/2026-11-23-struktur.html`:

- **Reiter** „Heute“, „Sport“, „KI-News“. Auf dem iPhone als Leiste unten, am Mac oben. Weitere Reiter (z. B. Schritte) kommen mit
  ihren Kacheln dazu. Beim Öffnen steht „Heute“ vorn.
- **„Heute“ ist eine Übersicht** über alle Kacheln: „Jetzt live“ (laufende Partien aller Wettbewerbe), „Mein Team“ (je Team die
  nächste oder letzte Partie und der Platz), „Neu in den KI-News“ (Meldungen, die das Etikett „Neu“ tragen). Ein Tipp führt zur
  vollen Kachel im passenden Reiter.
- **„Sport“ und „KI-News“ zeigen die vollen Kacheln** wie bisher.
- **Die Kurzfassung entsteht im Browser aus den Daten, die schon da sind** (`GET /api/kacheln`, ADR 0004). Jede Kachel-Art liefert
  dazu eine Funktion, die aus ihren Daten die Einträge für „Heute“ macht. Kein neuer Abruf, keine Änderung am Server.
- **Ein Reiter ist keine eigene Seite** im Sinne von Next.js, sondern ein Zustand derselben Seite. So bleiben Daten und Minutentakt
  beim Wechsel erhalten.

## Alternativen

- **A Reiter ohne Übersicht:** „Heute“ zeigt nur die heutigen Partien und Meldungen in voller Form. Der Reiter Sport bleibt auf dem
  iPhone fast 6 Bildschirme lang, Live und Neues stehen nicht gemeinsam oben.
- **B Übersicht mit Detailseite je Kachel:** kurz, aber für jede volle Kachel ein Tipp und ein Zurück, auch wenn man oft alle Partien
  sehen will.
- **C Gruppen auf einer Seite, einklappbar:** wenig Umbau, bleibt aber eine lange Seite ohne gemeinsame Rangfolge.
- **Reiter als eigene Routen** (`/sport`, `/ki-news`): eigene Adresse je Reiter, aber jeder Wechsel lädt neu und der Stand der
  offenen Seite (ADR 0004) ginge verloren.

## Konsequenzen

- Jede neue Kachel-Art braucht neben ihrer Ansicht eine Kurzfassung für „Heute“ (Prinzip 3 der Projektvision: Die Kachel bringt sie
  selbst mit, andere Kacheln ändern sich nicht).
- Ein Reiter hat keine eigene Adresse. Ein Lesezeichen auf „Sport“ ist nicht möglich.
- Die Grundform der Seite (`app/dashboard.tsx`) ändert sich. Formel 1 (Phase 3, Schritt 4) baut danach auf den Reitern auf.

## Nachtrag 2026-11-27: Sessions der Formel 1 in „Jetzt live“

„Jetzt live“ zeigt neben laufenden Partien auch laufende Sessions der Formel 1 („Rennen läuft · Großer Preis von Katar“), ohne
Zwischenstand. Der Knopf darunter heißt deshalb „Alles im Reiter …“ statt „Alle Partien im Reiter …“
([[projects/tages-dashboard/docs/plaene/2026-11-27-formel-1|Plan Formel 1]], Aufgabe 5).
