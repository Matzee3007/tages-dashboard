---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-25
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-25. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 0 - Vision und CI|Lernjournal Phase 0 - Vision und CI]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #6)
- **Offene PRs:** keine
- **Nicht committet:** nichts

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Womit es weitergeht

**Phase 0 – Fundament ist abgeschlossen.** Die nächste Session beginnt mit **Phase 1 – Grundgerüst** (Fahrplan in
der [[projects/tages-dashboard/docs/Projektvision|Projektvision]] unter „Roadmap“).

1. **Zuerst fragen**, ob vorher etwas anderes ansteht: neue Ideen, Skills oder Tools, Restpunkte. Vorschlag:
   - `/agent-md-refactor` für die Projekt-`CLAUDE.md` lohnt sich erst, wenn sie gewachsen ist (Musik-App,
     sport-fantasy und die globale `CLAUDE.md` wurden am 2026-10-25 damit aufgeräumt).
2. `docs/Tools für später.md` auf Werkzeuge für Phase 1 prüfen (Stand 2026-10-25: leer).
3. `/grill-with-docs Phase 1 Grundgerüst`: offene Fragen klären, vor allem die Anmeldemethode (Magic Link oder
   Passwort) und die Reihenfolge Vercel vor Login.
4. Fahrplan-Schritt 1 mit `plan-schreiben`: **online auf Vercel**. Ab Schritt 2 (Login) braucht der Build Schlüssel
   in Vercel und in der CI.

Punkte fürs Ecosystem und für musik-app aus dieser Session stehen in deren Übergaben.

## Passende Skills

- `grill-with-docs`: Phase 1 schärfen (nur du kannst ihn mit `/grill-with-docs` starten)
- `plan-schreiben`: Plan für Fahrplan-Schritt 1
- `assistent-bauen`: führt dich durch die Einrichtung von Vercel und Supabase, die nur du machen kannst
