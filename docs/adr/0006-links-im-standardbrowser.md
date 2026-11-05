---
titel: "ADR 0006: Fremde Links mit dem Befehl open"
status: akzeptiert
erstellt: 2026-11-05
tags: [adr, architektur, tauri, mac]
---

# ADR (Architecture Decision Record) 0006: Fremde Links mit dem Befehl `open`

## Kontext

Die Mac-App hat nur ein Fenster und keine Zurück-Taste. Ein fremder Link würde das Dashboard darin ersetzen, ein Link mit `target="_blank"` täte gar nichts.
Die KI-News-Kachel bringt in Schritt 3 viele solcher Links. Grundlage: [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Fahrplan Phase 2, und
[[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]].

## Entscheidung

- **Die Hülle entscheidet in Rust:** `link_ziel` in `src-tauri/src/links.rs` teilt jede Adresse ein. Der eigene Ursprung bleibt im Fenster, andere `http`- und `https`-Adressen gehen in den
  Browser, alles andere wird blockiert.
- **Den Browser startet der macOS-Befehl `open`** über `std::process::Command`, ohne Plugin und ohne neue Abhängigkeit.
- **Es entsteht nie ein zweites Fenster.** Auch eine eigene Seite mit `target="_blank"` geht in den Browser.

## Alternativen

- **`tauri-plugin-opener`:** das offizielle Plugin. Es wäre eine neue Abhängigkeit für einen einzigen Aufruf und lohnt sich erst, wenn die Hülle auf mehreren Betriebssystemen läuft.
- **Abfangen per JavaScript auf der Website:** Die Website müsste die Hülle kennen und bräuchte Rechte darin. Das widerspricht „die Website bekommt keine Rechte“.
- **Neue Fenster in der App zulassen:** Die fremde Seite liefe dann in der Hülle, und der Standardbrowser mit seinen Logins und Erweiterungen bliebe außen vor.

## Konsequenzen

- Die Regel läuft nur auf dem Mac, wie die Hülle selbst.
- `mailto:` und andere Schemata tun nichts. Das schützt vor Links aus fremden Feeds, ein solcher Link wirkt aber tot.
- Scheitert `open`, sieht man nichts: Der Fehler wird nicht ausgewertet.
- `on_navigation` greift laut Quellcode von `wry` auch für eingebettete Rahmen (`iframe`). Die App hat keine, ein fremder Rahmen würde aber den Browser öffnen.
- Ändert sich die Vercel-Adresse, muss `EIGENE_ADRESSE` mit. Ein Test vergleicht sie mit `tauri.conf.json`.
