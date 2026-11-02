---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-01
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-02. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Login mit Supabase|Lernjournal Phase 1 - Login mit Supabase]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge des Abschluss-PRs zur PWA)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app (mit Login, zeigt nur die Startseite, als PWA „Heute“ installierbar)

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. `.env.local` liegt nur auf diesem Rechner, nicht im Repo. Auf einem anderen Rechner die Werte aus dem
   Supabase-Dashboard holen, Vorlage ist `.env.example`.

## Womit es weitergeht

**Phase 1 – Grundgerüst** läuft. Die Fahrplan-Schritte 1 (online auf Vercel), 2 (Login mit Supabase) und 3 (PWA) sind erledigt, die
Entscheidungen für die restlichen Schritte stehen im Fahrplan der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]].

1. **PWA nachprüfen:** Die installierte App auf iPhone, iPad und Mac öffnen. Bist du am Tag nach dem 2026-11-02 noch
   angemeldet? Falls nicht, mit `fehler-diagnose` klären. Das Ergebnis in `docs/tools/Next.js.md` eintragen.
2. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob
   Logins als Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
3. **Aus musik-app (2026-10-26), klein, je ein PR mit `/code-review`:**
   - **CI-Falle beheben:** `.github/workflows/ci.yml` hat `group: ci-${{ github.ref }}` mit
     `cancel-in-progress: true`. Werden zwei PRs kurz nacheinander gemergt, bricht der Lauf auf `main` ab und ein
     Merge-Commit bleibt ungeprüft (auch mit `cancel-in-progress: false`: ein wartender Lauf wird verdrängt). Lösung
     aus musik-app PR #61: `group: ci-${{ github.event.pull_request.number || github.sha }}` und
     `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`.
   - **Dependabot einrichten** nach dem Muster von musik-app (`.github/dependabot.yml` mit Gruppen für Next und React,
     `docs/tools/Dependabot - Einrichtung.md`), Sicherheits-Updates im Repo einschalten. Dabei klären, woher die 17 mittleren
     Meldungen von `npm audit` kommen (mit `--omit=dev` sind es 0).
4. **Fahrplan-Schritt 4: Mac-App mit Tauri**
   ([[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]]), Plan mit `plan-schreiben`.
5. **Fahrplan-Schritt 5: Kachel-Gerüst.** Die erste private Server Action bringt die gemeinsame Anmeldeprüfung mit
   ([[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]). `BESITZER_ID` aus `lib/besitzer.ts` kann in
   die Einstellungsdatei umziehen.
6. **Am Ende von Phase 1:** Cloudflare Security Audit Skill einmal laufen lassen (vorgemerkt in den Tools für später
   des Ecosystems), weil die App dann mit Login im Netz steht. Dabei das Limit je IP-Adresse ansehen (Bekannte Grenzen).

## Passende Skills

- `plan-schreiben`: Plan für Fahrplan-Schritt 4
- Agent `mock-bauer`: Mock für das Kachel-Gerüst, bevor es gebaut wird
