---
titel: "ADR 0005: Feeds im Speicher von fetch"
status: akzeptiert
erstellt: 2026-11-04
tags: [adr, architektur, ki-news, zwischenspeicher]
---

# ADR (Architecture Decision Record) 0005: Feeds im Speicher von fetch

## Kontext

Die Seite fragt jede Minute nach, die Feeds sollen aber nur alle 15 Minuten abgerufen werden. Das Projekt läuft mit `cacheComponents: true`.
Für diesen Fall sagt die Doku von Next.js 16.4.3: „Move `cache` and `next` options to `use cache`“. Grundlage:
[[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 2.

## Entscheidung

- **`fetch` mit `next: { revalidate: 900 }`, entgegen dieser Empfehlung.** Laut Doku liegt `use cache` im Arbeitsspeicher, auf Serverless-Hosting wie
  Vercel gehen die Einträge meist nach der Anfrage verloren. Der Speicher von `fetch` soll Anfragen und Deploys überdauern.
- **Eine gespeicherte Antwort darf höchstens 1 Stunde alt sein,** gemessen an ihrer aufgehobenen `Date`-Zeile. Sonst zählt der Kanal als Ausfall.
  Nach 15 Minuten liefert Next.js nämlich sofort den alten Stand und ruft im Hintergrund neu ab, ohne unser Zeitlimit (`patch-fetch.js`). Ein Fehler
  dabei steht nur im Log. Ohne diese Prüfung sähe ein toter Feed wie ein stiller Absender aus.
- **Die `Age`-Zeile bleibt unberücksichtigt:** Am 2026-11-04 meldete der Bear-Blog `Age: 16413` bei aktuellem `Date`, bei YouTube lag `Date` dagegen rund
  14 Minuten zurück. `Date` allein reicht bei einer Grenze von 1 Stunde.
- **`fast-xml-parser` statt `rss-parser`:** gepflegt, `rss-parser` wurde zuletzt im April 2023 geändert. Die Umwandlung von RSS und Atom schreiben wir selbst.

## Alternativen

- **`use cache`:** von der Doku empfohlen, aber mit dem Risiko, dass die Feeds auf Vercel bis zu jede Minute abgerufen werden.
- **`use cache: remote`:** braucht einen eigenen Speicherdienst, widerspricht „erst gratis“.
- **`unstable_cache`:** überdauert Deploys und könnte die gelesenen Meldungen speichern statt des rohen XML. Laut Doku in Next.js 16 durch `use cache` ersetzt.
- **Ausfälle hinnehmen:** kein Code, aber die Zeile `gerade nicht erreichbar` erschiene fast nie.

## Konsequenzen

- Ein Ausfall wird erst nach bis zu rund 1 Stunde sichtbar, kurze Aussetzer gar nicht.
- Eine HTML-Seite mit Status 200 wird mitgespeichert, weil Next.js nur auf den Status schaut. Der Kanal gilt dann bis zum nächsten Auffrischen als
  ausgefallen und heilt sich selbst.
- Gespeichert wird das rohe XML, also wird es bei jedem Abruf neu gelesen (zusammen rund 2,4 MB). In Schritt 3 auf Vercel messen.
- Eine Antwort ohne lesbare `Date`-Zeile gilt als frisch.
- Lokal mit `next build` und `next start` am 2026-11-04 geprüft: Der Speicher hält über Anfragen hinweg, die `Date`-Zeile bleibt erhalten. Auf Vercel ist das noch
  nicht geprüft.
