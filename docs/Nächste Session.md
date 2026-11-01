---
titel: Nächste Session
status: aktiv
erstellt: 2026-10-26
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-01. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Befragung und Vercel|Lernjournal Phase 1 - Befragung und Vercel]].

## Stand bei Sessionende

- **Branch:** `main`
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app (mit Login, zeigt nur die Startseite)

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

## Womit es weitergeht

**Phase 1 – Grundgerüst** läuft. Die Fahrplan-Schritte 1 (online auf Vercel) und 2 (Login mit Supabase) sind erledigt, die Entscheidungen für alle
vier Schritte stehen im Fahrplan der [[projects/tages-dashboard/docs/Projektvision|Projektvision]] (Befragung vom
2026-10-25, PR #8).

1. **Fahrplan-Schritt 3: PWA**, Plan mit `plan-schreiben`. Dabei prüfen, ob die Anmeldung in der installierten App auf
   iPhone und iPad hält und ob die geleerten Felder nach falschem Passwort stören
   ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Abschnitt „Bekannte Grenzen“). `proxy.ts` muss Manifest und
   Symbole durchlassen.
2. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob
   Logins als Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
3. **Am Ende von Phase 1:** Cloudflare Security Audit Skill einmal laufen lassen (vorgemerkt in den Tools für später
   des Ecosystems), weil die App dann mit Login im Netz steht.
4. **Aus musik-app (2026-10-26), klein, je ein PR mit `/code-review`:**
   - **CI-Falle beheben:** `.github/workflows/ci.yml` hat `group: ci-${{ github.ref }}` mit
     `cancel-in-progress: true`. Werden zwei PRs kurz nacheinander gemergt, bricht der Lauf auf `main` ab und ein
     Merge-Commit bleibt ungeprüft (auch mit `cancel-in-progress: false`: ein wartender Lauf wird verdrängt). Lösung
     aus musik-app PR #61: `group: ci-${{ github.event.pull_request.number || github.sha }}` und
     `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`.
   - **Dependabot einrichten** nach dem Muster von musik-app (`.github/dependabot.yml` mit Gruppen für Next und React,
     `docs/tools/Dependabot - Einrichtung.md`), Sicherheits-Updates im Repo einschalten.

Punkte fürs Ecosystem aus dieser Session stehen in dessen Übergabe.

## Passende Skills

- `plan-schreiben`: Plan für Fahrplan-Schritt 3
- `tdd`: Manifest und Ausnahmen im Proxy testgetrieben bauen
