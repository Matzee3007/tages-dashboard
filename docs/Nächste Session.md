---
titel: Nächste Session
status: aktiv
erstellt: 2026-11-12
tags: [session, übergabe]
---

# Nächste Session

Stand vom 2026-11-12. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]], letztes Journal:
[[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Dependabot und Quellen|Lernjournal Phase 3 - Dependabot und Quellen]].

## Stand bei Sessionende

- **Branch:** `main` (nach dem Merge von PR #58)
- **Offene PRs:** #56 „Bump the npm-klein group across 1 directory with 6 updates“ (Dependabot, nicht gemergt, Grund unten)
- **Nicht committet:** nichts
- **Live:** https://tages-dashboard-iota.vercel.app zeigt die Bundesliga-Kachel und die KI-News, seit PR #53 mit Next.js 16.4.5.

## Vor dem Start

1. Claude Code im Projektordner starten, damit die Projekt-`CLAUDE.md` geladen wird:

   ```bash
   cd ~/claude-ecosystem/projects/tages-dashboard
   claude
   ```

2. **PR #56 fertig machen.** Nicht gemergt, weil der Login-Test in der Vorschau fehlt (das Update von `@supabase/supabase-js` auf 2.119.0
   verlangt ihn laut [[projects/tages-dashboard/docs/tools/Dependabot - Einrichtung|Dependabot - Einrichtung]]). `/code-review` ist durch,
   der Entwickler hat „mergen und danach Fix-PR“ gewählt.
   - Die Vorschau-Adresse steht im Kommentar von Vercel im PR. Hat Dependabot den PR inzwischen neu gebaut, gilt das Review nicht mehr:
     dann erneut `/code-review`.
   - Login-Test: Adresse in einem privaten Fenster öffnen, bei Vercel anmelden, im Dashboard einloggen, Bundesliga und KI-News ohne Fehler,
     `⌘ R`, weiter eingeloggt.
   - Danach mergen und den Fix-PR bauen (siehe „Womit es weitergeht“, Punkt 1).

   ```bash
   gh pr list --author 'app/dependabot'   # ist #56 noch der aktuelle Sammel-PR?
   gh pr checks 56                        # CI grün?
   gh pr merge 56 --merge                 # erst nach dem Login-Test
   ```

3. Offene Warnungen von Dependabot ansehen, `gh pr list` zeigt sie nicht:

   ```bash
   gh api 'repos/Matzee3007/tages-dashboard/dependabot/alerts?state=open' --jq '.[] | "\(.number) \(.security_advisory.severity) \(.dependency.package.name)"'
   ```

## Womit es weitergeht

**Phase 3 – Sport läuft,** Schritt 2: Premier League und Champions League. Zuerst fragen, ob das KI-Feature (unten) vor oder neben
Schritt 2 kommt.

1. **Fix fürs Abmelden (eigener kleiner PR, mit `tdd`):** Seit supabase-js 2.119 bleibt bei einem Fehler des Servers beim Abmelden das
   Cookie erhalten. `abmelden` in `app/login/actions.ts` prüft das Ergebnis von `signOut()` nicht, man landet still wieder angemeldet auf
   dem Dashboard. Zuerst ein Test für den Fehlerfall (fehlt in `__tests__/login-actions.test.ts`). Lösung offen: `signOut({ scope: 'local' })`
   oder Fehler auswerten und eine Meldung zeigen. Das Verhalten von `scope: 'local'` vorher im Paket nachlesen. Im selben PR nachziehen:
   die Grenze „Abmelden bei einem Ausfall“ und die Version in `docs/tools/Supabase.md`, 9.0.6 in `docs/tools/node-html-parser.md` und als
   Nachtrag in ADR 0007 (9.0.5 war nur gewählt, weil neuere Fassungen jünger als zwei Wochen waren).
2. **`/grill-with-docs Phase 3 Schritt 2` fortsetzen.** Die Fakten sind geprüft (Journal, Abschnitt „ESPN für die Champions League“ und
   Befehle). Runde 1 ist gestellt, aber noch ohne Antwort. Die Fragen erneut stellen:
   - **F1 Quelle (Weichenfrage, ohne Empfehlung):** A ESPN mit Nummer des Spieltags von OpenLigaDB (`pl`, `ucl`) wie die Bundesliga, B
     football-data.org wie geplant (offiziell, aber verzögert, Schlüssel, 10 Abrufe pro Minute), C ESPN live und football-data.org für
     Spieltag und Tabelle (in ADR 0009 für die Bundesliga verworfen). Bei A oder C: neues ADR, Projektvision und ADR 0001 anpassen.
   - **F2** Reihenfolge: Bundesliga, Premier League, Champions League, KI-News (Empfehlung ja).
   - **F3** Spieltag der Champions League mit 18 Partien: alle zeigen wie in der Bundesliga (Empfehlung), nur Mein Team oder Torschützen
     nur bei Mein Team.
   - **F4** K.-o.-Phase parken, „Wieder aufgreifen, wenn die Ligaphase endet (27. Januar 2027)“ (Empfehlung ja).
   - **F5** keine Linien nach Platz 8 und 24 in der Tabelle (Empfehlung ja).
   - Runde 2 danach: Teamnamen (ESPN-Kurznamen wie `Man City`, `Spurs` oder eigene Liste, `TEAMNAMEN` für deutsche Teams?), was die
     Sport-Kacheln gemeinsam haben (mit dem Skill `codebase-design` aus den Tools für später des Ecosystems), Aufteilung in PRs.
   - Dabei bekannt: `leseKalender` bricht bei der Champions League ab (anderer Kalender, Tage über `calendar/ondays` der
     Kern-Schnittstelle). Live-Minute und Status für `eng.1` und `uefa.champions` sind nicht gesehen, nur angenommen.
3. Nach der Befragung `plan-schreiben`.
4. Offen aus dem Review von #54 und #56: Kein Test prüft Links mit `&amp;` in den ausgelesenen Seiten (node-html-parser 9.0.6 decodiert
   Attribute neu). Ein kleiner Test in `__tests__/ki-news-seiten.test.ts` wäre gut, gern im PR von Punkt 1.

**Neu vom 2026-11-12 (aus dem Ecosystem): erstes KI-Feature.** Der Entwickler möchte hier zum ersten Mal ein Sprachmodell per API
einbinden und daran Evaluation, Structured Output, RAG (Retrieval-Augmented Generation: erst passende Texte suchen, dann antworten lassen)
und einen Agenten lernen. Vorschlag: Zusammenfassung der KI-News. Anlass und Hintergrund:
[[KI-Erfahrung fürs Bewerbungsgespräch]] (Abschnitt 7) und [[KI-Wissen - Auswertung]] (Checkliste für das erste KI-Feature).
Beim Start zuerst fragen, ob das vor oder neben Schritt 2 kommt, dann `/grill-with-docs erstes KI-Feature`.

Zu entscheiden, bevor ein Plan entsteht, weil es Festgelegtem widerspricht:

- **Projektvision:** „Titel bleiben in der Originalsprache, ohne Übersetzung und Zusammenfassung.“ Eine Zusammenfassung ändert das, also
  Vision anpassen und als ADR festhalten.
- **„Erst gratis“** ([[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]): Der Modellaufruf kostet nach Verbrauch
  und läuft über ein eigenes API-Konto mit Guthaben, getrennt vom Claude-Abo. Braucht ein Ausgabenlimit und den Schlüssel als
  Umgebungsvariable bei Vercel (Skill `assistent-bauen`). Preise vorher auf der Anbieterseite prüfen.
- **Was wird zusammengefasst?** Die Kachel hält bisher nur Titel und Alter. Prüfen (Fakten, nicht fragen), ob die Feeds genug Text liefern
  oder ob die Artikel abgerufen werden müssten.
- **Meldungen werden nicht gespeichert,** nur zwischengespeichert. Stufe 4 bräuchte Tabellen in Supabase.

Die Leiter, jede Stufe ein eigener kleiner PR mit Prüfung:

1. Erster Modellaufruf nur auf dem Server, mit Zeitlimit und Kostenlimit → prüfen: Der Schlüssel taucht im Browser nirgends auf, ein Test
   mit nachgestelltem Modell ist grün.
2. Evaluation: Testsatz aus 10 bis 20 echten Meldungen, auch schwierigen → prüfen: Ein Befehl vergleicht zwei Prompts oder Modelle und gibt
   eine Trefferquote aus.
3. Structured Output: Antwort in festem Format, gegen ein Schema geprüft → prüfen: Eine kaputte Antwort wird verworfen statt angezeigt.
4. RAG „Frag meine News“ → prüfen: Der Testsatz zeigt, dass die Antworten mit Suche besser sind als ohne. Sonst bleibt es weg.
5. Agent mit Werkzeugen → prüfen: Er kann nachweislich nur die freigegebenen Funktionen aufrufen.

Dabei beachten: News-Texte sind fremde Inhalte und können indirekte Prompt Injection enthalten, die Antwort des Modells nie ungeprüft als
HTML anzeigen. KI-Text als „KI-generiert“ kennzeichnen. Vor dem Bauen den Skill `claude-api` laden.

**Termin:** **Live-Test am Freitag, 2026-11-20, ab 20:30 Uhr** (erstes Spiel des 10. Spieltags): Minute mit orangem Punkt, Spielstand und
Torschützen sollten innerhalb von rund 2 Minuten nach einem Tor stimmen. Ergebnis im Plan der Bundesliga bei Aufgabe 5, Schritt 3 nachtragen.

Nur beobachten:

- **Verlegte Partien:** Ob ESPN sie wirklich mit `STATUS_POSTPONED` oder `STATUS_CANCELED` meldet, ist an keiner echten Antwort gesehen.
- **Fund 6 aus dem `/code-review` von PR #49,** bewusst offen: Die Abrufe der Bundesliga laufen nacheinander und könnten das Zeitlimit der
  Kachel von 8 Sekunden reißen. ESPN antwortete gemessen in rund 70 ms.
- **Punkt für frische Meldungen** bei den KI-News: Feeds jünger als 24 Std., Seiten heute und gestern. Fragen, ob das im Alltag passt.
- **Seiten-Kanäle:** Baut eine Website um, fällt der Kanal still aus und steht nur im Log von Vercel, siehe
  [[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]].

Restpunkte als Vorschläge:

1. **Supabase-Pause prüfen** (seit 2026-11-08 fällig): Im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat. Die Doku sagt nicht,
   ob Logins als Aktivität zählen. Falls ja: über Datenbank-Aktivität per Zeitplan entscheiden, sonst nichts bauen.
2. **Cloudflare Security Audit:** am 2026-11-04 verschoben. Spätestens vor Phase 4, vorher den Skill installieren und alle seine Dateien lesen
   (Hinweise in den Tools für später des Ecosystems). Dabei das Limit je IP-Adresse ansehen
   ([[projects/tages-dashboard/docs/tools/Supabase|Supabase]], Bekannte Grenzen).
3. **Sichtbarkeit der Mac-App (Fund 7 aus PR #25):** In den Vercel-Logs ist nicht geprüft, ob bei ausgeblendeter App wirklich keine
   Abfragen ankommen.
4. **Offene Funde aus dem `/code-review` von PR #27,** bewusst nicht behoben:
   - Abmelden ohne Netz zeigt die Fehlerseite von Next.js, es gibt keine eigene Fehlergrenze.
   - **Vor Phase 4 ansehen:** Der Stand der Kacheln bleibt nach dem Abmelden im Speicher der Seite und könnte nach „Zurück“ ohne Netz wieder
     erscheinen. Private Daten kommen erst mit Phase 4.
   - iOS friert einen laufenden Abruf ein: Beim Zurückkommen entfällt der sofortige Abruf, bis zu 60 Sekunden steht ein falscher Hinweis.
5. **Offene Funde aus dem `/code-review` von PR #34** (Begründung im Journal „Links in der Mac-App“): fremde `iframe`s öffnen den Browser,
   der Abgleich der eigenen Adresse prüft `devUrl` nicht, Fehler von `open` werden nicht ausgewertet, `windows[0]` statt Suche nach `main`.
6. **Aus [[Engineering for Vibe Coders - Auswertung]] (2026-11-08):** Der Endpunkt für den iPhone-Kurzbefehl (Phase 4) braucht ein Token im
   Header, das sich tauschen lässt, nicht nur eine unbekannte Adresse. „Zeigt jede Kachel, wenn ihre Daten veraltet sind?“: Die Bundesliga
   lehnt seit PR #49 gespeicherte Antworten ab, die zu alt sind, die KI-News seit ADR 0005. Für die Schritte in Phase 4 neu prüfen.
7. **Wie oft Vercel die Feeds neu holt,** ist nur an einer Abfrage gemessen. Für weitere Messungen braucht es ein neues Vercel-Token, eingetragen
   über einen Assistenten (Skill `assistent-bauen`). Weg: [[projects/tages-dashboard/docs/tools/Vercel|Vercel]], Abschnitt „Über die REST-API“.

Gelegentlich:

- Dependabot ignoriert große Updates von `eslint` und `typescript`. Aufheben, sobald `eslint-plugin-react`, `-import` und `-jsx-a11y`
  ESLint 10 erlauben und `typescript-eslint` TypeScript 7 erlaubt.
- Klein: Der Schlüsselbund bietet das Passwort in der Mac-App nicht an (nicht untersucht).
- Klein: Ohne Internet zeigt die Mac-App beim Start ein leeres Fenster, nach „Neu laden“ ist alles da (ADR 0006).
- Klein: `cargo fmt --check` meldet eine ältere Abweichung in `src-tauri/build.rs`. Die Shell von Claude Code findet `cargo` nicht, dort
  `~/.cargo/bin/cargo` nehmen.

Punkte fürs Ecosystem: siehe dessen Übergabe, dort steht auch der Punkt „`/goal` testen“.

## Passende Skills

- `tdd`: Fix fürs Abmelden, zuerst der Test für den Fehlerfall
- `grill-with-docs` (nur vom Entwickler aufrufbar: `/grill-with-docs Phase 3 Schritt 2`): Runde 1 beantworten, dann Runde 2
- `plan-schreiben`: Plan für Schritt 2 nach der Befragung
