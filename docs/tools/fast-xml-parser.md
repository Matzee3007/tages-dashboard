---
titel: fast-xml-parser
status: aktiv
erstellt: 2026-11-04
tags: [tools, xml, rss, ki-news]
---

# fast-xml-parser

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-04-feeds-lesen|Plan: Feeds lesen]].

## Was ist das?

Ein Paket, das XML-Text in JavaScript-Objekte umwandelt (MIT-Lizenz). Node.js bringt dafür nichts mit.

## Wofür nutzen wir es?

Zum Lesen der RSS- und Atom-Feeds in `lib/kacheln/ki-news/feed.ts`. Das Paket versteht nur XML, die Umwandlung in Meldungen schreiben
wir selbst. `rss-parser` könnte beide Formate fertig, wurde aber zuletzt im April 2023 geändert.

## Wichtige Begriffe

- **RSS und Atom:** die zwei Formate für Feeds. RSS nennt die Einträge `item`, Atom `entry`.
- **Entity:** ein kodiertes Zeichen im XML, z. B. `&amp;` für `&` oder `&#8217;` für `’`.
- **CDATA:** ein Bereich im XML, dessen Inhalt nicht als XML gelesen wird, z. B. `<![CDATA[A & B]]>`.

## Wie haben wir es eingerichtet?

Mit fester Version, wie die anderen Pakete, die zur Laufzeit gebraucht werden. Die Optionen in `feed.ts`:

| Option | Grund |
|---|---|
| `ignoreAttributes: false` | Atom-Links stehen im Attribut `href` |
| `parseTagValue: false` | Der Titel `2026` bleibt Text und wird keine Zahl |
| `htmlEntities: true` | versteht auch Zeichen wie `&#8217;` |
| `isArray` für `item`, `entry`, `link` | Ein einzelner Eintrag käme sonst nicht als Liste an |

## Typischer Ablauf

`leseFeed(text)` gibt die Meldungen zurück und wirft, wenn der Text weder RSS noch Atom ist. Einträge ohne Titel, gültiges Datum oder
`http`-Link fallen still weg.

## Alle benutzten Befehle

```bash
npm install --save-exact fast-xml-parser@5.12.0   # Paket mit genau dieser Version installieren
```

## Fehler

- **Titel zeigt `AT&#038;T`:** The Verge kodiert doppelt (`&amp;#038;`), der Parser löst nur die erste Stufe auf. Lösung: `feed.ts` dekodiert den
  Titel danach noch einmal.
- **Falscher Titel mit `removeNSPrefix`:** Die Option lässt `media:title` und `title` zusammenfallen, gefunden im `/code-review` von PR #30. Lösung: Option
  weglassen und `dc:date` ausdrücklich lesen.
