---
titel: "ADR 0007: Seiten mit node-html-parser auslesen"
status: akzeptiert
erstellt: 2026-11-07
tags: [adr, architektur, ki-news, scraping]
---

# ADR (Architecture Decision Record) 0007: Seiten mit node-html-parser auslesen

## Kontext

Anthropic, `claude.com` und das Hilfe-Center von Claude bieten für ihre News, Blogs und Versionshinweise keinen Feed an. Laut
[[projects/tages-dashboard/docs/Projektvision|Projektvision]] (Phase 2, Schritt 4) liest der Server diese Seiten selbst aus. `robots.txt` erlaubt
das auf allen drei Websites (geprüft 2026-11-07). Das vorhandene `fast-xml-parser` versteht nur sauberes XML, kein echtes HTML. Grundlage:
[[projects/tages-dashboard/docs/plaene/2026-11-07-seiten-auslesen|Plan: Seiten auslesen]].

## Entscheidung

- **`node-html-parser` in fester Version `9.0.5`**, vom Entwickler am 2026-11-07 gewählt. Neuere Versionen waren jünger als zwei Wochen.
- **Ein Leser pro Bauart** (`anthropic`, `claude-artikel`, `versionshinweise`) in `lib/kacheln/ki-news/seiten.ts`, gesucht wird mit CSS-Selektoren.
  Die Seiten laufen durch dasselbe `ladeKanal` wie die Feeds (Zwischenspeicher wie in [[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]).
- **Findet ein Leser nichts, wirft er.** Der Kanal gilt dann als ausgefallen, die anderen Kanäle des Absenders laufen weiter.
- **Meldungen von Seiten tragen `nurDatum: true`,** weil die Seiten keine Uhrzeit nennen. Ihr Alter steht in Kalendertagen („heute“, „gestern“),
  frisch sind sie heute und gestern, beim Sortieren zählen sie wie vom Ende ihres Tages (Entscheidungen nach dem `/code-review` von PR #40).

## Alternativen

- **`cheerio`:** der verbreitetste HTML-Parser, gleiche Selektoren, aber 11 Unterpakete statt 2. Für drei kleine Leser mehr als nötig.
- **Reguläre Ausdrücke ohne Paket:** keine Abhängigkeit, aber schwerer zu lesen und eher verwirrt, wenn sich das HTML leicht ändert.
- **Fremd-Feeds wie `Olshansk/rss-feeds`:** schon am 2026-11-04 verworfen, weil ein fremdes Projekt die Seiten ausliest und ausfallen kann.
- **Uhrzeit von jeder Artikelseite holen:** gäbe genaue Zeiten, kostet aber einen Abruf pro Beitrag statt einen pro Seite.

## Konsequenzen

- Baut eine Website um, fällt der Kanal still aus: Die Kachel zeigt den Absender weiter, solange ein anderer Kanal läuft. Sichtbar wird der Ausfall
  nur im Log von Vercel (`Kanal … ließ sich nicht laden`). Dann den Leser an das neue HTML anpassen.
- Pro Abruf zerlegt der Server alle 6 Seiten neu. Am 2026-11-07 auf dem Mac gemessen: 25 bis 42 ms, deshalb kein eigener Speicher für die Ergebnisse.
- Eine neue Abhängigkeit, die Dependabot mit aktualisiert.
