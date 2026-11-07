---
titel: node-html-parser
status: aktiv
erstellt: 2026-11-07
tags: [tools, html, scraping, ki-news]
---

# node-html-parser

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-07-seiten-auslesen|Plan: Seiten auslesen]].

## Was ist das?

Ein Paket, das HTML-Text in einen Baum aus Elementen umwandelt, in dem man wie im Browser mit CSS-Selektoren sucht (MIT-Lizenz).
Node.js hat dafür nichts eingebaut, `fast-xml-parser` versteht nur sauberes XML, kein echtes HTML.

## Wofür nutzen wir es?

Zum Auslesen der Kanäle ohne Feed in `lib/kacheln/ki-news/seiten.ts`: die Seiten von Anthropic, die Artikel auf `claude.com` und die
Versionshinweise im Hilfe-Center. Vom Entwickler am 2026-11-07 gewählt. `cheerio` ginge auch, bringt aber 11 Unterpakete mit statt 2, und
reguläre Ausdrücke direkt auf dem Text wären schwerer zu lesen.

## Wichtige Begriffe

- **Web-Scraping (Auslesen):** Ein Programm lädt eine Seite, die für Menschen gedacht ist, und sucht darin Titel, Links und Daten. Bricht,
  sobald die Website umgebaut wird. Deshalb wirft `leseSeite`, wenn es nichts findet: Der Kanal gilt dann als ausgefallen.
- **CSS-Selektor:** Suchmuster für Elemente, z. B. `[data-listing-row]` (jedes Element mit diesem Attribut) oder `article h3`
  (jede `<h3>` in einem `<article>`).
- **`.text`:** der Text eines Elements samt Kindern, mit dekodierten Zeichen (`&#x27;` wird `'`). `.rawText` ließe sie kodiert.

## Wie haben wir es eingerichtet?

Mit fester Version `9.0.5`: 9.0.6 und 9.0.7 waren am 2026-11-07 jünger als zwei Wochen. Wir nutzen nur `parse`, `querySelector`,
`querySelectorAll`, `closest`, `getAttribute` und `.text`.

| Bauart | Wo der Leser sucht |
|---|---|
| `anthropic` | jedes `[data-listing-row]`: Titel aus `<h3>`, Link vom `<a>` um oder in der `<h3>`, Datum aus `<time>` |
| `claude-artikel` | jedes `<a href>` mit einer `<h3>` darin, Datum aus dem ersten Element mit Text wie `Nov 5, 2026` |
| `versionshinweise` | `article h3, article p` der Reihe nach: `<h3>` mit Datum beginnt einen Tag, ganz fette Absätze sind Einträge |

## Alle benutzten Befehle

```bash
npm install --save-exact node-html-parser@9.0.5   # Paket mit genau dieser Version installieren
npm view node-html-parser time --json             # Veröffentlichungsdaten aller Versionen, um eine ältere zu wählen
```

## Fehler

Noch keine.
