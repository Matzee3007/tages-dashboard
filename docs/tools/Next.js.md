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

## Was ist hier anders als in musik-app?

Eingerichtet am 2026-10-24 mit `create-next-app@latest` nach dem Rezept in `STACKS.md`.

- **Versionen:** Next.js 16.4.3, React 19.3.0, Node 24.22, npm 11.19.
- **Tailwind CSS 4 läuft über `@tailwindcss/turbopack`:** Es gibt keine `postcss.config.mjs` mehr.
- **`AGENTS.md`** wird von `next dev` geschrieben und neu angelegt. `CLAUDE.md` bindet sie mit `@AGENTS.md` ein.

## Befehle

Siehe `CLAUDE.md`, Abschnitt „Befehle“. Vor jedem Commit `npm run check`.
