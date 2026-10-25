---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-24
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-24. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Angelegt von `/projekt-starten`, ab dem ersten
Session-Ende schreibt der Skill `naechste-session` diese Datei.

## Stand bei Sessionende

- **Branch:** `main` (Initial-Commit)
- **Offene PRs:** keine
- **Nicht committet:** nichts

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Womit es weitergeht

**Phase 0 – Fundament** beginnt. Die erste Aufgabe:

1. `/grill-with-docs Projektvision schärfen`: Ziel, Zielgruppe, Abgrenzung und Phasen in Fragerunden klären.
   Fachbegriffe landen dabei in `docs/Glossar.md`, Entscheidungen als ADR.
2. Danach mit `plan-schreiben` den Plan für den Rest von Phase 0 schreiben (erster Test, Prüfbefehle,
   evtl. CI).

Nebenbei: Musik-App, sport-fantasy und die globale `CLAUDE.md` wurden am 2026-10-25 mit `/agent-md-refactor`
aufgeräumt. Hier lohnt es sich erst, wenn die `CLAUDE.md` nach der Projektvision gewachsen ist.

## Passende Skills

- `grill-with-docs`: Projektvision und Phasen schärfen
- `plan-schreiben`: Plan für Phase 0
- `tdd`: der erste Test
