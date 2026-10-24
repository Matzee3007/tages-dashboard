# CLAUDE.md – Tages-Dashboard

@AGENTS.md

Diese Datei lädt Claude Code bei jedem Start in diesem Projekt automatisch. Sie enthält den
dauerhaften Projektkontext. Die ausführliche Vision steht in `docs/Projektvision.md`.
Projektunabhängige Regeln (Arbeitsweise, Git, Phasenwechsel, Doku-Konventionen, Antwortstil)
stehen in der globalen `~/.claude/CLAUDE.md` (Repo `claude-ecosystem`, `config/CLAUDE.md`).

## Projektziel

Ein persönliches Live-Dashboard als Web-App (PWA), das nur ich auf Mac, iPhone und iPad nutze. Es zeigt in erweiterbaren Kacheln Sport live, meine Schritte aus Apple Health und KI-News.

Gleichwertiges Ziel ist das **Lernen**: PWA, Login mit Supabase Auth, mehrere fremde APIs und RSS-Feeds zusammenführen, Daten per iPhone-Kurzbefehl schicken, ein erweiterbares Kachel-System.

## Stack

- **Sprache und App:** TypeScript mit Next.js (App Router), Tailwind CSS
- **PWA:** Web-App-Manifest von Next.js, „Zum Home-Bildschirm“ auf iPhone und iPad
- **Login und Datenbank:** Supabase (Auth und Postgres)
- **Hosting:** Vercel (kostenloser Tarif)
- **Tests und Qualität:** Vitest, Testing Library, ESLint, Prettier
- **Datenquellen:** OpenLigaDB (Bundesliga), football-data.org (Premier League, Champions League), ESPN (NFL,
  inoffiziell), Jolpica und OpenF1 (Formel 1), RSS-Feeds (KI-News), iPhone-Kurzbefehl (Schritte aus Apple Health)

## Architekturprinzipien

1. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.
2. **Nur für mich:** genau ein Nutzer, jede Seite und jede Schnittstelle hinter dem Login. Ausnahme: der Eingang
   für den Kurzbefehl, der mit einem eigenen geheimen Schlüssel geschützt ist.
3. **Kacheln:** Jeder Bereich (Sport, Schritte, News …) ist eine eigene Kachel mit eigener Datenquelle. Eine neue
   Kachel kommt dazu, ohne die anderen zu ändern.
4. **Daten holt der Server**, nicht der Browser: API-Schlüssel bleiben auf dem Server, Antworten werden kurz
   zwischengespeichert, damit die Gratis-Grenzen der Anbieter reichen.
5. **Erst gratis:** keine bezahlte Datenquelle ohne eigenes ADR (z. B. X-API, Live-Daten für Formel 1).

## Repo-Struktur

```
tages-dashboard/
├── app/          Next.js-Seiten und Layout
├── __tests__/    Tests (Vitest)
├── docs/         Doku, zugleich Obsidian-Vault
├── CLAUDE.md     Projektkontext für Claude Code
└── AGENTS.md     Hinweise von Next.js für Agents
```

## Befehle

```bash
npm ci                 # Abhängigkeiten genau nach package-lock.json installieren
npm run dev            # App lokal starten (http://localhost:3000)
npm run lint           # ESLint
npm run format         # Prettier: alles formatieren
npm run typecheck      # TypeScript prüfen
npm test               # Tests (Vitest)
npm run check          # alles zusammen, vor jedem Commit
```

Vor jedem Commit: `npm run check` (Linter, Formatierung, Typen, Tests).

## Dokumentation

Allgemeine Konventionen (ADRs, Lernjournale, Tool-Notizen, Skills, Tools für später) stehen in
der globalen `CLAUDE.md`. Roadmap und Phasen stehen in `docs/Projektvision.md`.
