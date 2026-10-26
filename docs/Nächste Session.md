---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-26
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-10-26. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Befragung und Vercel|Lernjournal Phase 1 - Befragung und Vercel]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #10)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app (noch ohne Login, zeigt nur die Startseite)

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Womit es weitergeht

**Phase 1 – Grundgerüst** läuft. Fahrplan-Schritt 1 (online auf Vercel) ist erledigt, die Entscheidungen für alle
vier Schritte stehen im Fahrplan der [[projects/tages-dashboard/docs/Projektvision|Projektvision]] (Befragung vom
2026-10-25, PR #8).

1. **Fahrplan-Schritt 2: Login mit Supabase**, Plan mit `plan-schreiben`. Vorher die Gratis-Grenzen von Supabase
   frisch nachlesen (Pause nach 7 Tagen ohne Nutzung, Mailversand), sie wurden in der Befragung nur aus dem Gedächtnis
   genannt. Next.js 16 nennt die Login-Prüfung vor jeder Seite `proxy.ts` (früher `middleware.ts`), Anleitung in
   `node_modules/next/dist/docs/01-app/02-guides/authentication.md`. Konto bei Supabase gibt es schon.
2. Danach im Assistenten (`assistent-bauen`): Supabase-Projekt anlegen, Registrierung aus, Nutzer anlegen,
   Projekt-URL und Publishable Key in `.env.local`, bei Vercel und als GitHub Repository Variables.
3. **Am Ende von Phase 1:** Cloudflare Security Audit Skill einmal laufen lassen (vorgemerkt in den Tools für später
   des Ecosystems), weil die App dann mit Login im Netz steht.

Punkte fürs Ecosystem aus dieser Session stehen in dessen Übergabe.

## Passende Skills

- `plan-schreiben`: Plan für Fahrplan-Schritt 2
- `assistent-bauen`: führt dich durch die Einrichtung von Supabase und das Eintragen der Schlüssel
- `tdd`: Login-Prüfung und Seitenschutz testgetrieben bauen
