---
titel: Tools Übersicht
status: aktiv
erstellt: 2026-10-24
tags: [tools, übersicht, lernen]
---

# Tools Übersicht

Landkarte aller Werkzeuge im Projekt. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Abkürzungen stehen in [[Abkürzungen]].

Werkzeuge, die jedes Projekt nutzt (Terminal, Git, Claude Code, Docker …), haben ihre Notiz im Ecosystem
([[Werkzeuge Übersicht]]). Hier steht für sie nur, wie sie in diesem Projekt eingerichtet sind
(`<Werkzeug> - Einrichtung.md`). Werkzeuge nur dieses Projekts haben ihre ganze Notiz hier, im Aufbau:
Was ist das, wofür nutzen wir es, wichtige Begriffe, wie wir es eingerichtet haben, typischer Ablauf,
alle benutzten Befehle, Fehler.

## Im Einsatz

| Werkzeug | Seit | Wofür in einem Satz |
|---|---|---|
| [[Git]], [[GitHub und gh]] | 2026-10-24 | Versionen und Repo `tages-dashboard` |
| [[Claude Code]] | 2026-10-24 | KI-Entwickler im Terminal |
| [[projects/tages-dashboard/docs/tools/Next.js.md\|Next.js]] | 2026-10-24 | App, Seiten und Server-Code |
| [[projects/tages-dashboard/docs/tools/Vitest, ESLint und Prettier\|Vitest, ESLint und Prettier]] | 2026-10-24 | Tests, Linter, Formatierung |
| [[GitHub Actions]] ([[projects/tages-dashboard/docs/tools/GitHub Actions - Einrichtung\|Einrichtung]]) | 2026-10-25 | prüft jeden PR mit `npm run check` und Build |
| [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung\|Dependabot]] | 2026-11-03 | schlägt per PR neue Versionen von Paketen und Actions vor |
| [[projects/tages-dashboard/docs/tools/Vercel\|Vercel]] | 2026-10-26 | bringt die App ins Netz, Vorschau je PR |
| [[projects/tages-dashboard/docs/tools/Supabase\|Supabase]] | 2026-11-01 | Login für genau einen Nutzer, später Datenbank |
| [[projects/tages-dashboard/docs/tools/Tauri\|Tauri]] | 2026-11-03 | zeigt das Dashboard als eigene Mac-App mit Symbol in der Menüleiste |
| [[projects/tages-dashboard/docs/tools/fast-xml-parser\|fast-xml-parser]] | 2026-11-04 | wandelt RSS- und Atom-Feeds in Daten um |
