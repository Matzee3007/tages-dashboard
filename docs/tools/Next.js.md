---
titel: Next.js
status: aktiv
erstellt: 2026-10-24
tags: [tools, nextjs, react, typescript, node, npm]
---

# Next.js (mit Node.js, npm und TypeScript)

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Begründung:
[[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]]. Grundlagen (Node, npm, TypeScript, React, App Router)
stehen in der Notiz von musik-app: [[projects/musik-app/docs/tools/Next.js.md|Next.js (musik-app)]].

## Wofür nutzen wir es?

Die ganze App: Kacheln im Browser, Server-Teil holt Sportdaten, RSS-Feeds und nimmt die Schritte vom
iPhone-Kurzbefehl an.

## Stand in diesem Projekt

Eingerichtet am 2026-10-24 mit `create-next-app@latest` nach dem Rezept in `STACKS.md`.

- **Versionen:** Next.js 16.4.3, React 19.3.0, Node 24.22, npm 11.19.
- **Tailwind CSS 4 läuft über `@tailwindcss/turbopack`**, ohne `postcss.config.mjs` (wie in musik-app).
- **`AGENTS.md`** wird von `next dev` geschrieben und neu angelegt. `CLAUDE.md` bindet sie mit `@AGENTS.md` ein.

## PWA

Seit 2026-11-02 (PR #16) lässt sich die App als „Heute“ installieren, ohne Service Worker.

- **Manifest:** `app/manifest.ts`, Next.js liefert es unter `/manifest.webmanifest` aus.
- **Symbole:** PNG-Dateien in `public/icons/`, ihre SVG-Quellen in `assets/icons/`, umgewandelt mit `sips` von macOS.
- **Apple-Angaben:** `metadata.appleWebApp` und `metadata.icons` in `app/layout.tsx`. Next.js schreibt aus `capable: true`
  nur `mobile-web-app-capable`, das eigene Fenster klappt damit auf allen drei Geräten.
- **Proxy:** Manifest und PNG-Dateien direkt in `/icons/` sind ohne Anmeldung erreichbar, weil der Browser sie ohne Cookies
  abruft ([[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]).
- **Gerätetest erst nach dem Merge:** Die Vorschauen liegen hinter dem Vercel-Login, getestet wird die Live-Adresse.

Gerätetest vom 2026-11-02, Installieren über Safari:

| Gerät | Ergebnis |
|---|---|
| iPhone | bestanden |
| iPad | bestanden |
| Mac („Zum Dock hinzufügen“) | bestanden |

Offen: ob die Anmeldung auch am nächsten Tag noch hält.

## Befehle

Siehe `CLAUDE.md`, Abschnitt „Befehle“. Vor jedem Commit `npm run check`.
