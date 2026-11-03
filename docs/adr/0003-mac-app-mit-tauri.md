---
titel: "ADR 0003: Mac-App mit Tauri zusätzlich zur PWA"
status: akzeptiert
erstellt: 2026-11-02
tags: [adr, architektur, tauri, pwa, desktop]
---

# ADR (Architecture Decision Record) 0003: Mac-App mit Tauri zusätzlich zur PWA

## Kontext

Das Dashboard soll sich auf dem Mac wie eine richtige Desktop-App anfühlen. Zugleich schaue ich vor allem auf dem iPhone
drauf, die Oberfläche muss also auch dort laufen. Es darf nichts kosten. Grundlage:
[[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]], Gespräch vom 2026-11-02.

## Entscheidung

- **Die PWA bleibt** und wird zuerst fertig: Sie ist die App für iPhone und iPad.
- **Danach kommt eine Mac-App mit Tauri** als eigener Fahrplan-Schritt. Sie zeigt die Website in einem eigenen Fenster mit
  dem Browserkern des Macs (WebKit).
- **Die Mac-App lädt die Vercel-Adresse.** Oberfläche, Server-Code und Login gibt es weiter nur einmal.
- **Nur für den eigenen Mac:** selbst bauen und installieren, ohne Apple Developer Program und ohne Weitergabe.

## Alternativen

- **Nur PWA, Desktop-App vormerken:** am wenigsten Aufwand und auf dem Mac über „Zum Dock hinzufügen“ schon nutzbar, aber
  weniger zu lernen und ohne die Möglichkeiten einer Desktop-App (z. B. Symbol in der Menüleiste).
- **Electron:** kein Rust nötig, aber die App bringt einen eigenen Browser mit und wird deutlich größer. Die Seite liefe
  in Chromium statt im WebKit von iPhone und iPad.
- **Nur Desktop-App ohne PWA:** Auf iPhone und iPad bliebe nur die Website im Browser, ohne Symbol und Vollbild.
- **Native Mac-App in Swift:** Die Oberfläche gäbe es doppelt, weil die PWA für iPhone und iPad trotzdem nötig bleibt.

## Konsequenzen

- Der Rechner braucht zusätzlich Rust, aber erst ab diesem Schritt.
- Die App startet nicht ohne Internet, wie die PWA auch: Offline-Daten sind nicht geplant.
- Ohne Bezahlkonto bei Apple lässt sich die App nicht ohne Warnung an andere weitergeben. Das ist nicht nötig, sie ist nur
  für mich.
- Die Anmeldung in der Mac-App hält über einen Neustart der App (geprüft 2026-11-03, siehe
  [[projects/tages-dashboard/docs/tools/Tauri|Tauri]]). Der Schlüsselbund bietet das Passwort dort aber nicht an.
- Änderungen an der Website erreichen die Mac-App ohne neuen Bau, weil sie die Vercel-Adresse lädt. Neu bauen muss ich nur,
  wenn sich die Hülle selbst ändert.
