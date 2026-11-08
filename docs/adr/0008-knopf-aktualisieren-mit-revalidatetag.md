---
titel: "ADR 0008: Knopf Aktualisieren mit revalidateTag"
status: akzeptiert
erstellt: 2026-11-08
tags: [adr, architektur, ki-news, zwischenspeicher]
---

# ADR (Architecture Decision Record) 0008: Knopf Aktualisieren mit revalidateTag

## Kontext

Die KI-News sollen auf Knopfdruck frisch von den Quellen kommen. Der Minutentakt fragt nur den Server. Der liefert die Feeds und Seiten aber bis zu
15 Minuten aus dem Speicher von `fetch` ([[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]). Ein Knopf, der nur neu
abfragt, zeigt deshalb oft denselben Stand.

## Entscheidung

- **Jeder Abruf einer Kachel trägt ihre id als Etikett** (`next: { tags: [etikett] }`). Die id kommt aus `KACHELN` und wird bis zum Abruf
  durchgereicht, damit Knopf und Speicher nicht auseinanderlaufen.
- **Der Knopf ↻ im Kopf der Kachel schickt `POST /api/kacheln?frisch=<id>`.** Die Schnittstelle prüft die id gegen `KACHELN`, ruft
  `revalidateTag(id, { expire: 0 })` und liefert dann dieselbe Antwort wie `GET`. Laut Quelltext von Next.js 16.4.3
  (`incremental-cache/index.js`) zählt ein Etikett, das in derselben Anfrage abgelaufen ist, sofort als Fehltreffer. Die Abrufe dieser Antwort gehen
  also an die Quellen und füllen den Speicher neu.
- **POST statt GET,** weil die Anfrage etwas verändert (den Speicher) und ein Browser oder Proxy ein GET selbst wiederholen dürfte.
- **`{ expire: 0 }` statt `"max"`:** Mit `"max"` käme beim Klick noch der alte Stand, der neue erst beim nächsten Takt.

## Alternativen

- **Nur neu abfragen:** kein Server-Code, aber meist ohne neue Meldungen.
- **`cache: "no-store"` für diese eine Anfrage:** Der Speicher bliebe alt. Der nächste Minutentakt zeigte wieder den alten Stand, die Meldungen
  sprängen zurück.
- **`updateTag`:** gibt es nur in Server Actions. Eine Server Action kann laut Doku die Seite neu rendern, das umgeht die Schnittstelle aus
  [[projects/tages-dashboard/docs/adr/0004-kacheln-ueber-schnittstelle|ADR 0004]].

## Konsequenzen

- Antwortet eine Quelle beim Klick nicht, ist ihr alter Stand weg: Der Kanal fällt aus, bis er wieder antwortet. Ohne Klick hätte der Speicher ihn
  bis zu 1 Stunde gehalten.
- Jeder Klick ruft alle Feeds und Seiten der KI-News ab (rund 2,4 MB). Für einen Nutzer mit gelegentlichem Klick ist das unkritisch.
- Eine neue Kachel bekommt den Knopf von selbst. Frisch wird sie aber erst, wenn ihre Abrufe ihre id als Etikett tragen.
- ↻ dreht sich nur nach einem Klick auf ihn selbst. Gesperrt ist er bei jedem Abruf, auch beim Minutentakt.
- Bewusst offen (Funde 6 und 7 aus dem `/code-review` von PR #44): Eine unbekannte id meldet 400, das zeigt alle Kacheln als Fehler. Und POST lädt
  alle Kacheln, die anderen kommen dabei aus ihrem Speicher.
