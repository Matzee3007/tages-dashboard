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

- **Branch:** `main` (nach dem Merge von PR #28)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app mit Login und Kachel-Gerüst, zeigt die Testkachel. Als PWA „Heute“ auf iPhone und
  iPad, als Mac-App `Heute.app` in `/Applications`.

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

**Phase 1 – Grundgerüst ist abgeschlossen.** Die nächste Session beginnt mit **Phase 2 – KI-News**. Claude fragt vorher, ob zuerst etwas
anderes ansteht (neue Ideen, Skills, Tools, Restpunkte), und prüft die Tools für später für die neue Phase. Danach zuerst
`/grill-with-docs` für die offenen Fragen der Phase, dann Fahrplan-Schritt 1 (Feeds heraussuchen).

Restpunkte als Vorschläge:

1. **Ab 2026-11-08: Pause prüfen.** Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht, ob Logins als
   Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Cloudflare Security Audit:** am 2026-11-04 vom Entwickler verschoben, weil hinter dem Login bisher nur die Server-Uhrzeit liegt.
   Spätestens vor Phase 4 einmal laufen lassen, vorher den Skill installieren und alle seine Dateien lesen (Hinweise in den Tools für
   später des Ecosystems). Dabei das Limit je IP-Adresse ansehen (Bekannte Grenzen in
   [[projects/tages-dashboard/docs/tools/Supabase|Supabase]]).
3. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** Die Abfragen ruhen im Code, sobald die Seite verborgen ist, und beim Einblenden kommt
   sofort eine neue. In den Vercel-Logs ist aber nicht geprüft, ob bei ausgeblendeter App wirklich keine Abfragen ankommen. Falls doch: Die
   Hülle meldet die Sichtbarkeit nicht.
4. **Offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Heute betrifft das nur die Uhrzeit.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt dann der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
   - Eine leere Kachelliste zeigt den Fehlerhinweis. Tritt nur auf, wenn `KACHELN` leer ist, also beim Umbau in Phase 2 darauf achten.
5. **Warnung von Dependabot, `glib` in `src-tauri/Cargo.lock`:** mittlere Schwere, behoben ab 0.20.0, bisher nicht bearbeitet. Prüfen, ob die
   Mac-App das Paket überhaupt nutzt. Es gehört vermutlich zum Linux-Teil von Tauri, das ist aber nicht belegt.

Für Phase 2 einplanen:

- **Zeitlimit je Kachel:** Die Antwort von `/api/kacheln` ist so langsam wie die langsamste Kachel
  ([[projects/tages-dashboard/docs/adr/0004-kacheln-ueber-schnittstelle|ADR 0004]]).
- **Neue Art von Kachel und alte, offene App:** Eine lange offene App kennt eine neue `art` nicht, die Kachel zeigt dann nur ihren Titel. Beim
  ersten Deploy der KI-News die App einmal neu laden.
- **Externe Links in der Mac-App (Fund 4 aus PR #25):** Die Mac-App hat keine Regel dafür. Ein Link aus den KI-News würde das Dashboard im einzigen
  Fenster ersetzen, ohne Weg zurück. Fremde Adressen an den Standardbrowser geben, dafür die Vorgabe „keine Plugins“ überdenken. Die Hülle muss
  dann neu gebaut werden.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`, von selbst erinnert niemand daran. ESLint 9 steht bei npm schon auf
  `maintenance`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein, nur wenn es stört: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).

Punkte für andere Orte stehen in deren Übergaben: Der Folge-PR zu PR #118 (`/goal`) steht in der Übergabe des Ecosystems. Er sollte vor dem
nächsten Plan kommen, der Entwickler hat ihn am 2026-11-04 hinter das Kachel-Gerüst gelegt. Er ist also jetzt fällig, vor dem ersten Plan von Phase 2.

## Passende Skills

- `grill-with-docs`: offene Fragen von Phase 2 klären
- `plan-schreiben`: Plan für den ersten Fahrplan-Schritt
- `tdd`: Feeds lesen und KI-News-Kachel bauen
