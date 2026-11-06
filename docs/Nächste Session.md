---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-06
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-06. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - KI-News-Kachel|Lernjournal Phase 2 - KI-News-Kachel]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #38)
- **Offene PRs:** keine
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app zeigt die KI-News-Kachel (PR #37). Die Vorschauen von PRs haben jetzt auch die
  Supabase-Variablen, Login und Kachel laufen dort.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. Neue PRs und offene Warnungen von Dependabot ansehen. Er öffnet jede Woche PRs, Warnungen zeigt `gh pr list` nicht. Stand 2026-11-06: keine offene Warnung.

   ```bash
   gh pr list --author 'app/dependabot'
   gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
   ```

   Ablauf: [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]].

## Womit es weitergeht

**Phase 2 – KI-News läuft, Schritt 3 ist bis auf den Gerätetest fertig** (PR #37). Der Fahrplan steht in der
[[projects/tages-dashboard/docs/Projektvision|Projektvision]].

**Zuerst: Gerätetest von Schritt 3** ([[projects/tages-dashboard/docs/plaene/2026-11-06-ki-news-kachel|Plan]], Aufgabe 5, nur der Entwickler):

1. Jede offene App (Mac, iPhone, iPad) einmal neu laden. Eine lange offene App kennt `art: "ki-news"` nicht und zeigt sonst nur den Titel.
2. Mac-App aus `/Applications`: eine Meldung anklicken. Erwartet: Sie geht im Standardbrowser auf, das Dashboard bleibt im Fenster.
3. iPhone und iPad, installierte App: eine Meldung antippen. Notieren: Wo geht sie auf, wie kommt man zurück, ist man danach noch angemeldet?

Claude trägt die Ergebnisse in den Plan ein, setzt Schritt 3 im Fahrplan auf „erledigt“ und den Plan auf `status: abgeschlossen`.

**Danach Schritt 4, Seiten auslesen.** `claude.com/blog` ist anders gebaut als `anthropic.com`. Ist es nicht sauber auslesbar, den Entwickler fragen,
statt es still wegzulassen. Auch diese Links müssen durch `istWebLink` in `lib/kacheln/ki-news/feed.ts`, die Mac-App schützt vor `javascript:` nicht
nachweislich ([[projects/tages-dashboard/docs/adr/0006-links-im-standardbrowser|ADR 0006]]). Das ist der letzte Schritt von Phase 2: Danach wird die Phase
in derselben Session abgeschlossen.

Neu aus dieser Session, nur beobachten:

- **Punkt für frische Meldungen:** Fast jede Meldung der aktiven Absender ist jünger als 24 Std. Nach ein paar Tagen im Alltag fragen, ob die Grenze kürzer soll.
- **Wie oft Vercel die Feeds neu holt,** ist nur an einer Abfrage gemessen. Für weitere Messungen braucht es ein neues Vercel-Token, eingetragen über einen
  Assistenten (Skill `assistent-bauen`), nicht über den Chat. Weg: [[projects/tages-dashboard/docs/tools/Vercel|Vercel]], Abschnitt „Über die REST-API“.

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
4. **Weitere offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Mit den KI-News betrifft das öffentliche Meldungen, private Daten erst ab Phase 4.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt dann der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
5. **Offene Funde aus dem `/code-review` von PR #34,** bewusst nicht behoben (Begründung im Journal): fremde `iframe`s öffnen den Browser, der Abgleich der
   eigenen Adresse prüft `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt Suche nach dem Namen `main`.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`, von selbst erinnert niemand daran. ESLint 9 steht bei npm schon auf
  `maintenance`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y` ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein, nur wenn es stört: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster statt der Fehlerseite, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Und die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen (Journal, Abschnitt „Fehler“).

Punkte fürs Ecosystem: siehe dessen Übergabe, dort steht auch der Punkt „`/goal` testen“.

## Passende Skills

- `fertig-pruefen`: Ergebnisse des Gerätetests prüfen, bevor Schritt 3 als erledigt gilt
- `plan-schreiben`: Plan für Schritt 4
- `tdd`: Umsetzung von Schritt 4
