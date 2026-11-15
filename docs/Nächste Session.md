---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-15
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-15. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - KI-Zusammenfassungen|Lernjournal Phase 3 - KI-Zusammenfassungen]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #62, Journal und Übergabe)
- **Offene PRs:** #56 „Bump the npm-klein group across 1 directory with 6 updates“ (Dependabot, wartet auf den Login-Test, siehe unten)
- **Nicht committet:** nichts
- **Supabase:** gehostet, Projekt `tages-dashboard` am 2026-11-15 `ACTIVE_HEALTHY`. Die Supabase-CLI ist abgemeldet.
- **Container `zusammenfassen`:** läuft auf dem Mac in Docker Desktop und fasst stündlich die KI-News zusammen
  ([[projects/tages-dashboard/docs/tools/Docker Model Runner|Docker Model Runner]]).
- **Live:** https://tages-dashboard-iota.vercel.app, seit PR #61 mit Zusammenfassungen hinter dem Knopf „KI“.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. **Zusammenfassungen in Production prüfen** (Aufgabe 8, Schritt 3 im
   [[projects/tages-dashboard/docs/plaene/2026-11-15-zusammenfassungen|Plan]], dann den Plan auf `status: abgeschlossen`): auf dem
   iPhone einloggen, bei den KI-News auf „KI“ tippen, Text mit „KI-GENERIERT“ und „Zum Artikel ↗“. Läuft der Container?

   ```bash
   docker compose ps                      # Container zusammenfassen: Status "Up"
   docker compose logs --tail 20 zusammenfassen   # letzte Zeilen, erwartet "Durchlauf: neu N, ohne M"
   ```

3. **PR #56 fertig machen.** Nicht gemergt, weil der Login-Test in der Vorschau fehlt (das Update von `@supabase/supabase-js` auf
   2.119.0 verlangt ihn laut [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]]). `/code-review`
   ist durch, der Entwickler hat „mergen und danach Fix-PR“ gewählt. Hat Dependabot den PR inzwischen neu gebaut, gilt das Review nicht
   mehr: dann erneut `/code-review`. Login-Test: Adresse aus dem Kommentar von Vercel in einem privaten Fenster öffnen, bei Vercel
   anmelden, im Dashboard einloggen, Bundesliga und KI-News ohne Fehler, `⌘ R`, weiter eingeloggt.

   ```bash
   gh pr list --author 'app/dependabot'   # ist #56 noch der aktuelle Sammel-PR?
   gh pr checks 56                        # CI grün?
   gh pr merge 56 --merge                 # erst nach dem Login-Test
   ```

## Womit es weitergeht

**Einschub KI-Feature:** Stufe 1 (Modellaufruf) und Stufe 3 (festes Antwortformat) sind gebaut und gemergt (PR #61,
[[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]). Offen ist Stufe 2, die Evaluation. **Zuerst fragen**,
ob sie vor Phase 3, Schritt 2 kommt (Empfehlung: ja, solange das Wissen frisch ist).

1. **Evaluation planen** (`plan-schreiben`, vorher nichts mehr zu befragen, die Vorgaben stehen in ADR 0010):
   - Testsatz aus 15 echten Meldungen, auch schwierige: sehr lang (Karpathy), deutsch (The Decoder), Video ohne Artikel, eine Seite mit
     eingebauter Anweisung an das Modell.
   - Automatisch: Format, 2 bis 3 Sätze, Deutsch. Vom Entwickler je Zusammenfassung ja oder nein auf „stimmt und trifft die Kernaussage“.
   - Kandidaten: `ai/qwen3:4b-instruct-2507` (läuft heute) gegen `ai/gemma4:e4b`. Immer nur ein Modell laden
     (`docker model unload --all` dazwischen).
   - Ergebnis: Trefferquote und Zeit je Zusammenfassung pro Modell, danach das Modell in `compose.yaml` festlegen.
2. **Fix fürs Abmelden** (eigener kleiner PR, mit `tdd`): Seit supabase-js 2.119 bleibt bei einem Fehler des Servers beim Abmelden das
   Cookie erhalten. `abmelden` in `app/login/actions.ts` prüft das Ergebnis von `signOut()` nicht. Zuerst ein Test für den Fehlerfall
   (fehlt in `__tests__/login-actions.test.ts`). Lösung offen: `signOut({ scope: 'local' })` oder Fehler auswerten und eine Meldung zeigen,
   das Verhalten von `scope: 'local'` vorher im Paket nachlesen. Im selben PR: die Grenze „Abmelden bei einem Ausfall“ und die Version in
   `docs/tools/Supabase.md`, 9.0.6 in `docs/tools/node-html-parser.md` und als Nachtrag in ADR 0007, dazu ein Test für Links mit
   `&amp;` in `__tests__/ki-news-seiten.test.ts` (offen aus den Reviews von #54 und #56).
3. **Phase 3, Schritt 2 (Premier League und Champions League): `/grill-with-docs Phase 3 Schritt 2` fortsetzen.** Runde 1 ist gestellt,
   aber noch ohne Antwort. Die Fragen erneut stellen:
   - **F1 Quelle (Weichenfrage, ohne Empfehlung):** A ESPN mit Nummer des Spieltags von OpenLigaDB (`pl`, `ucl`) wie die Bundesliga,
     B football-data.org wie geplant (offiziell, aber verzögert, Schlüssel, 10 Abrufe pro Minute), C ESPN live und football-data.org
     für Spieltag und Tabelle (in ADR 0009 für die Bundesliga verworfen). Bei A oder C: neues ADR, Projektvision und ADR 0001 anpassen.
   - **F2** Reihenfolge: Bundesliga, Premier League, Champions League, KI-News (Empfehlung ja).
   - **F3** Spieltag der Champions League mit 18 Partien: alle zeigen wie in der Bundesliga (Empfehlung), nur Mein Team oder
     Torschützen nur bei Mein Team.
   - **F4** K.-o.-Phase parken, „Wieder aufgreifen, wenn die Ligaphase endet (27. Januar 2027)“ (Empfehlung ja).
   - **F5** keine Linien nach Platz 8 und 24 in der Tabelle (Empfehlung ja).
   - Runde 2 danach: Teamnamen (ESPN-Kurznamen oder eigene Liste), was die Sport-Kacheln gemeinsam haben (mit dem Skill
     `codebase-design` aus den Tools für später des Ecosystems), Aufteilung in PRs.
   - Dabei bekannt: `leseKalender` bricht bei der Champions League ab (anderer Kalender, Tage über `calendar/ondays`). Live-Minute und
     Status für `eng.1` und `uefa.champions` sind nicht gesehen, nur angenommen. Danach `plan-schreiben`.
4. Offene Funde aus dem `/code-review` von PR #61, bewusst nicht behoben: Fehlschläge werden nicht gemerkt, 20.000 Zeichen gegen 8192
   Token ([[projects/tages-dashboard/docs/tools/Docker Model Runner|Docker Model Runner]], Bekannte Grenzen), Lese-Client verwirft
   neue Tokens ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Bekannte Grenzen).

**Termin:** **Live-Test am Freitag, 2026-11-20, ab 20:30 Uhr** (erstes Spiel des 10. Spieltags): Minute mit orangem Punkt, Spielstand und
Torschützen sollten innerhalb von rund 2 Minuten nach einem Tor stimmen. Ergebnis im Plan der Bundesliga bei Aufgabe 5, Schritt 3
nachtragen.

Nur beobachten:

- **Container nach Neustart des Macs:** Läuft `zusammenfassen` von selbst wieder (Autostart von Docker Desktop,
  `restart: unless-stopped`)? Nicht ausprobiert.
- **OpenAI hinter Cloudflare:** Meldungen von OpenAI bleiben ohne Zusammenfassung (Prüfung am TLS-Fingerabdruck), bewusst nicht
  umgangen.
- **Verlegte Partien:** Ob ESPN sie wirklich mit `STATUS_POSTPONED` oder `STATUS_CANCELED` meldet, ist an keiner echten Antwort gesehen.
- **Fund 6 aus dem `/code-review` von PR #49,** bewusst offen: Die Abrufe der Bundesliga laufen nacheinander und könnten das Zeitlimit der
  Kachel von 8 Sekunden reißen. ESPN antwortete gemessen in rund 70 ms.
- **Punkt für frische Meldungen** bei den KI-News: Feeds jünger als 24 Std., Seiten heute und gestern. Fragen, ob das im Alltag passt.
- **Seiten-Kanäle:** Baut eine Website um, fällt der Kanal still aus und steht nur im Log von Vercel, siehe
  [[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]].

Restpunkte als Vorschläge:

1. **Cloudflare Security Audit:** am 2026-11-04 verschoben. Spätestens vor Phase 4, vorher den Skill installieren und alle seine Dateien
   lesen (Hinweise in den Tools für später des Ecosystems). Dabei das Limit je IP-Adresse ansehen
   ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Bekannte Grenzen).
2. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** In den Vercel-Logs ist nicht geprüft, ob bei ausgeblendeter App wirklich keine
   Abfragen ankommen.
3. **Offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben: Abmelden ohne Netz zeigt die Fehlerseite von Next.js.
   **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite. iOS friert einen laufenden Abruf ein,
   bis zu 60 Sekunden steht ein falscher Hinweis.
4. **Offene Funde aus dem `/code-review` von PR #34:** fremde `iframe`s öffnen den Browser, der Abgleich der eigenen Adresse prüft
   `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt Suche nach `main`.
5. **Aus [[Engineering for Vibe Coders - Auswertung]]:** Der Endpunkt für den iPhone-Kurzbefehl (Phase 4) braucht ein Token im Header,
   das sich tauschen lässt. Für die Schritte in Phase 4 neu prüfen, ob jede Kachel zeigt, wenn ihre Daten veraltet sind.
6. **Wie oft Vercel die Feeds neu holt,** ist nur an einer Abfrage gemessen. Für weitere Messungen braucht es ein neues Vercel-Token über
   einen Assistenten (Skill `assistent-bauen`). Weg: [[projects/tages-dashboard/docs/tools/Vercel|Vercel]], Abschnitt „Über die REST-API“.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y`
  ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen.

Punkte fürs Ecosystem: siehe dessen Übergabe.

## Passende Skills

- `plan-schreiben`: Plan für die Evaluation (Stufe 2)
- `tdd`: Fix fürs Abmelden, zuerst der Test für den Fehlerfall
- `grill-with-docs` (nur vom Entwickler aufrufbar: `/grill-with-docs Phase 3 Schritt 2`): Runde 1 beantworten, dann Runde 2
