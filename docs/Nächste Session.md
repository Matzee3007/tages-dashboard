---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-04
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-04. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Dependabot und Mac-App|Lernjournal Phase 1 - Dependabot und Mac-App]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #26)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app (mit Login, zeigt nur die Startseite). Als PWA „Heute“ auf iPhone und iPad, als
  Mac-App `Heute.app` in `/Applications`.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Neue PRs von Dependabot ansehen, er öffnet jede Woche welche:

   ```bash
   gh pr list --author 'app/dependabot'
   ```

   Ablauf: [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

3. `.env.local` liegt nur auf diesem Rechner, nicht im Repo. Auf einem anderen Rechner die Werte aus dem Supabase-Dashboard holen,
   Vorlage ist `.env.example`.

## Womit es weitergeht

**Phase 1 – Grundgerüst** läuft. Die Fahrplan-Schritte 1 bis 4 sind erledigt, die Entscheidungen für den letzten Schritt stehen im
Fahrplan der [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

1. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob Logins als
   Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Fahrplan-Schritt 5: Kachel-Gerüst.** Zuerst ein Mock mit `mock-bauer`, dann der Plan mit `plan-schreiben`.
   - Die erste private Server Action bringt die gemeinsame Anmeldeprüfung mit
     ([[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]).
   - `BESITZER_ID` aus `lib/besitzer.ts` kann in die Einstellungsdatei umziehen.
   - Die Seite bekommt `#0E1013` als Grund, dann passt sie zur dunklen Leiste der App und zum Fenster der Mac-App.
   - **Aus dem `/code-review` von PR #25, Fund 7:** Ausgeblendet läuft die Website in der Mac-App weiter. Die Aktualisierung jede
     Minute kann so Gratis-Grenzen verbrauchen oder gedrosselt werden und veraltete Daten zeigen. Im Plan klären, z. B. über
     `visibilitychange`.
3. **Am Ende von Phase 1:** Cloudflare Security Audit Skill einmal laufen lassen (vorgemerkt in den Tools für später des Ecosystems),
   weil die App dann mit Login im Netz steht. Dabei das Limit je IP-Adresse ansehen (Bekannte Grenzen).
4. **Ab Phase 2, aus dem `/code-review` von PR #25, Fund 4:** Die Mac-App hat keine Regel für externe Links. Ein Link aus den KI-News
   würde das Dashboard im einzigen Fenster ersetzen, ohne Weg zurück. Fremde Adressen an den Standardbrowser geben, dafür die Vorgabe
   „keine Plugins“ überdenken. Die Hülle muss dann neu gebaut werden.
5. **Gelegentlich nachsehen:** Dependabot ignoriert große Updates von `eslint` und `typescript`, von selbst erinnert niemand daran.
   ESLint 9 steht bei npm schon auf `maintenance`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 erlauben
   und `typescript-eslint` TypeScript 7 erlaubt.
6. **Klein, nur wenn es stört:** Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).

Punkte für andere Orte stehen in deren Übergaben: quiz-poker, musik-app und Ecosystem.

## Passende Skills

- Agent `mock-bauer`: Mock für das Kachel-Gerüst, bevor es gebaut wird
- `plan-schreiben`: Plan für Fahrplan-Schritt 5
