---
titel: Lernjournal Phase 0 - Projektstart
status: aktiv
phase: 0
erstellt: 2026-10-24
tags: [lernjournal, phase-0, projekt-starten, nextjs, typescript, vitest, pwa, datenquellen]
---

# Lernjournal Phase 0: Projektstart

Erstes Journal des Tages-Dashboards. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].
Angelegt in einer Session im Ecosystem mit `/projekt-starten tages-dashboard`.

## Erledigt

- Idee geklärt: persönliches Live-Dashboard für Sport, Schritte und KI-News, nur für mich, auf Mac, iPhone und iPad.
- **Web-App statt iOS-App** entschieden: Eine eigene iOS-App wäre kostenlos zu entwickeln, läuft mit kostenloser
  Apple-ID aber nur 7 Tage. App Store und TestFlight kosten 99 € im Jahr. Eine PWA läuft auf allen drei Geräten
  kostenlos. Die Schritte kommen per iPhone-Kurzbefehl statt über HealthKit.
- Datenquellen nachgeschlagen (Stand 2026-10-24), Ergebnis in [[projects/tages-dashboard/docs/Projektvision|Projektvision]] unter „Stolpersteine“.
- Gerüst aus `vorlagen/projekt/` kopiert und ausgefüllt, Stack-Wahl in [[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]].
- Next.js nach dem Rezept in `STACKS.md` eingerichtet, erster Test erst rot, dann grün, `npm run check` mit Exit-Code 0.

## Befehle: Stack einrichten

```bash
npx --yes create-next-app@latest tages-dashboard --yes --use-npm --disable-git   # im Scratchpad, Projektordner ist nicht leer
npm ci                                       # genau die Versionen aus package-lock.json
npm install -D @types/node@^24               # create-next-app trägt ^20 ein
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
npm install -D --save-exact prettier@3.9.10  # feste Version
npm install -D eslint-config-prettier        # ESLint widerspricht Prettier nicht
npm install-scripts deny unrs-resolver       # npm 11 hält das Installationsskript zurück, ESLint läuft ohne
npm run check                                # Linter, Formatierung, Typen, Tests
```

## Neu gelernt

### Datenquellen und ihre Grenzen

- **OpenLigaDB:** Bundesliga gratis und ohne Schlüssel, ein Testabruf lieferte Spieltag 7 als JSON mit
  `matchIsFinished` und `lastUpdateDateTime`.
- **football-data.org:** Premier League und Champions League gratis, aber nur verzögert und mit 10 Abrufen pro
  Minute. Live kostet 12 € im Monat.
- **OpenF1:** Ergebnisse gratis und ohne Schlüssel, Live-Daten während der Sessions 9,90 € im Monat.
- **ESPN (NFL):** inoffiziell und nicht dokumentiert, der Testabruf kam mit 403 zurück.
- **X-API:** ab etwa 200 $ im Monat, deshalb zum Start RSS.

### Vite braucht kein Plugin mehr für Pfad-Kürzel

Vite löst die Pfad-Kürzel aus `tsconfig.json` (z. B. `@/app/page`) selbst auf, das Plugin `vite-tsconfig-paths`
aus dem Rezept entfällt. musik-app (Next.js 16.4.2) nutzt es noch.

## Fehler und Lösungen

### `The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option.`

- **Ursache:** Das Rezept aus musik-app nutzt das Plugin, Vite kann das inzwischen selbst.
- **Lösung:** `npm uninstall vite-tsconfig-paths`, in `vitest.config.mts` `resolve: { tsconfigPaths: true }`.
  Rezept in `STACKS.md` angepasst.

### `EXIT:` ohne Zahl nach `echo "EXIT: ${PIPESTATUS[0]}"`

- **Ursache:** `PIPESTATUS` gibt es in bash. In zsh heißt das Feld `pipestatus` (klein) und beginnt bei 1.
- **Lösung:** Ausgabe in eine Datei umleiten und danach `$?` lesen.

## Offene Fragen

- Sind Karpathy und Matt Pocock auf Bluesky aktiv? Welche Feeds haben ihre Kanäle?
- Welche Fachseiten genau?
- Antwortet ESPN von einem Server aus?
- Lohnen sich später bezahlte Live-Daten für Arsenal oder Formel 1?

## Nächste Schritte

Neue Session im Projektordner, dann `/grill-with-docs Projektvision schärfen` (siehe
[[projects/tages-dashboard/docs/Nächste Session|Nächste Session]]).
