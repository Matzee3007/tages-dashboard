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
- **Mac-App:** Tauri, zeigt die Website in einem eigenen Fenster (ADR 0003)
- **Login und Datenbank:** Supabase (Auth und Postgres)
- **Hosting:** Vercel (kostenloser Tarif)
- **Tests und Qualität:** Vitest, Testing Library, ESLint, Prettier
- **Datenquellen:** ESPN (Bundesliga und NFL, inoffiziell, ADR 0009), football-data.org (Premier League, Champions
  League), Jolpica und OpenF1 (Formel 1), RSS-Feeds (KI-News), iPhone-Kurzbefehl (Schritte aus Apple Health)
- **Zusammenfassungen der KI-News:** lokales Sprachmodell über Docker Model Runner, Skript im Container per Docker Compose
  auf dem Mac (ADR 0010)

## Architekturprinzipien

1. **Kontext liegt in Dateien** (`CLAUDE.md`, `docs/`), nicht im Chatverlauf.
2. **Nur für mich:** genau ein Nutzer, jede Seite und jede Schnittstelle hinter dem Login. Ausnahmen: der Eingang
   für den Kurzbefehl, der mit einem eigenen geheimen Schlüssel geschützt ist, sowie Manifest und Symbole der PWA
   (ADR 0002).
3. **Kacheln:** Jede Kachel (je Wettbewerb, Schritte, KI-News …) ist eigenständig, mit eigener Art von Datenquelle,
   und besteht aus Abschnitten. Eine neue Kachel kommt dazu, ohne die anderen zu ändern. Begriffe: `docs/Glossar.md`.
4. **Daten holt der Server**, nicht der Browser: API-Schlüssel bleiben auf dem Server, Antworten werden kurz
   zwischengespeichert, damit die Gratis-Grenzen der Anbieter reichen. Ausnahme: Die Zusammenfassungen erzeugt der Mac
   und legt sie in Supabase ab, Vercel liest sie nur (ADR 0010).
5. **Erst gratis:** keine bezahlte Datenquelle ohne eigenes ADR (z. B. X-API, Live-Daten für Formel 1).
6. **Einstellungen im Code:** Kacheln, Reihenfolge, Mein Team, Absender und Feeds, Tagesziel stehen in einer Datei
   im Code, nicht in der Datenbank. Eine Einstellungsseite gibt es erst später.

## Repo-Struktur

```
tages-dashboard/
├── app/          Next.js-Seiten und Layout
├── assets/       Quellen, die nicht ausgeliefert werden (z. B. SVG der Symbole)
├── lib/          Code ohne Seite (z. B. Supabase-Client)
├── proxy.ts      Login-Prüfung vor jeder Anfrage
├── src-tauri/    Hülle der Mac-App (Rust), lädt die Vercel-Adresse
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
npm run tauri -- dev   # Mac-App zum Entwickeln starten
npm run tauri -- build # fertige Mac-App bauen
cargo test --manifest-path src-tauri/Cargo.toml   # Tests der Mac-App
```

Vor jedem Commit: `npm run check` (Linter, Formatierung, Typen, Tests).

## Dokumentation

Allgemeine Konventionen (ADRs, Lernjournale, Tool-Notizen, Skills, Tools für später) stehen in
der globalen `CLAUDE.md`. Roadmap und Phasen stehen in `docs/Projektvision.md`.
