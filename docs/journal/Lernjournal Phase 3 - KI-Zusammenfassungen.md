---
titel: Lernjournal Phase 3 - KI-Zusammenfassungen
status: abgeschlossen
phase: 3
erstellt: 2026-11-15
tags: [lernjournal, phase-3, ki-feature, sprachmodell, docker, docker-model-runner, supabase, rls, grill-with-docs, tdd, evaluation, football-data, module-entwerfen]
---

# Lernjournal Phase 3: KI-Zusammenfassungen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Dependabot und Quellen|Lernjournal Phase 3 - Dependabot und Quellen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

Session vom 2026-11-12 bis 2026-11-15: das erste KI-Feature, als Einschub zwischen Phase 3 und Phase 4. Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-15-zusammenfassungen|Plan: Zusammenfassungen erzeugen und zeigen]].

## Erledigt

- [x] Feeds gemessen: Fast alle liefern nur Anreißer von 90 bis 500 Zeichen, YouTube Videobeschreibungen, nur Karpathys Blogs
      Volltext. Für eine Zusammenfassung muss der Artikel abgerufen werden.
- [x] `/grill-with-docs erstes KI-Feature` in 5 Runden (F1 bis F17), Ergebnis in
      [[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]], Glossar (Artikel, Zusammenfassung), Projektvision
      (Lernziel, Stack, Einschub „KI-Feature“, Parkplatz für RAG und Agent) und Projekt-`CLAUDE.md`. PR #60, gemergt.
- [x] Plan mit `plan-schreiben`, freigegeben, Versuch vorweg: trägt (Docker Model Runner kann `json_schema`, auch aus dem Container).
- [x] Aufgaben 1 bis 7 mit `tdd`: Artikel auslesen (Readability), Modell fragen und Antwort prüfen, Tabelle mit RLS, Durchlauf,
      Container mit Modell und Secret, Kachel liest die Zusammenfassungen, Anzeige nach Mock-Variante B.
- [x] Tabelle `zusammenfassungen` über die Supabase-CLI eingespielt und als Fremder geprüft (`select` → `[]`, `insert` → `42501`).
- [x] Ende zu Ende auf dem Mac: zweiter Durchlauf `neu 13, ohne 6`, 17 Zusammenfassungen in der Tabelle.
- [x] Diagnose der 403 von OpenAI (Cloudflare-Prüfung am TLS-Fingerabdruck), bewusst nicht umgangen.
- [x] `plan-pruefer`: STATUS ERFÜLLT. `/code-review` von PR #61: 10 Funde, 7 behoben (je mit Test), 3 dokumentiert. 257 Tests grün.
- [x] Aufgabe 8: Abnahme in der Vorschau auf dem iPhone bestanden, PR #61 gemergt.
- [ ] Aufgabe 8, Schritt 3: dieselbe Prüfung in Production.
- [x] Übergabe des Ecosystems auf den neuen Stand gebracht (PR #216 im Repo `claude-ecosystem`): KI-Feature bis auf die
      Evaluation gebaut, eingebunden ist ein lokales Modell, keine API.

Abend-Session vom 2026-11-15:

- [x] Plan [[projects/tages-dashboard/docs/plaene/2026-11-15-evaluation|Plan: Evaluation der Zusammenfassungen]] mit
      `plan-schreiben`, freigegeben, Aufgaben 1 bis 6 mit `tdd` umgesetzt (Ordner `evaluation/`).
- [x] Evaluation durchgeführt: Testsatz aus 15 Meldungen, Qwen und Gemma je 15/15 Treffer, Median 16,5 s gegen 46,3 s. Qwen bleibt in
      `compose.yaml`, Container läuft wieder (`Durchlauf: neu 2, ohne 4`). Nachtrag in ADR 0010. Einschub KI-Feature abgehakt.
- [x] `plan-pruefer`: STATUS ERFÜLLT. `/code-review` von PR #64: 10 Funde, 7 behoben (mit 2 neuen Tests), 2 bewusst offen, einer
      überzeichnet. PR #64 gemergt.
- [x] Wunsch „Bundesliga mit lokaler KI“: ESPN-`summary` liefert Liveticker (`commentary`) und `keyEvents`, keinen Bericht. Als Parkplatz
      in der Projektvision, PR #65 gemergt.
- [x] `/grill-with-docs Phase 3 Schritt 2` in 4 Runden (F1 bis F18): ADR 0011, Entscheidungen in der Projektvision, Glossar „Gruppe“ und
      „Ligaphase“, Parkplatz K.-o.-Phase. PR #66 gemergt.
- [x] Skill `codebase-design` vom Agent `quellen-leser` geprüft, übersetzt als `module-entwerfen` ins Ecosystem (PR #217 im Repo
      `claude-ecosystem`), `/code-review` mit 9 Funden, 7 im PR behoben, gemergt.
- [ ] Plan für Phase 3, Schritt 2, PR 1 (Premier League).

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Produkt | KI-Feature vor Phase 3, Schritt 2 (Premier League, Champions League), als Einschub | Lernziel Sprachmodell, Bewerbungsnotizen | Entwickler |
| Produkt | Zusammenfassung je Meldung aus dem ganzen Artikel (F1, Option B) | [[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac\|ADR 0010]] | Entwickler |
| Technik | Lokales Modell über Docker Model Runner, der Mac erzeugt, Supabase speichert, Vercel liest nur (F2) | ADR 0010 | Entwickler |
| Technik | Skript im Container über Docker Compose statt `npm run` (F9) | Docker mitlernen, ADR 0010 | Entwickler |
| Technik | Schreibrecht: Anmeldung als Besitzer mit Passwort als Compose Secret, RLS nur für `BESITZER_ID`, kein Secret Key (F10) | ADR 0010 | Entwickler |
| Produkt | Anzeige nach Mock-Variante B: Knopf „KI“ klappt auf, „Zum Artikel ↗“ darunter, Alter in diesen Zeilen kein Link mehr | Kachel bleibt kurz, kein versehentliches Öffnen | Entwickler |
| Technik | Bis zur Evaluation läuft `ai/qwen3:4b-instruct-2507` (12 bis 31 s je Artikel), Gemma 4 E4B bleibt Kandidat (58 bis 81 s) | Plan: das schnellere brauchbare Modell | Entwickler (Plan) |
| Bauen | Stufe 1 und 3 in einem Plan, Evaluation (Stufe 2) als eigener Plan danach | ADR 0010 erlaubt keine ungeprüfte Antwort in der Kachel | Entwickler (Plan) |
| Bauen | Tabelle über die Supabase-CLI statt über das Dashboard eingespielt | Wunsch des Entwicklers, Claude hat keinen Browser | Entwickler |
| Technik | „zusammen höchstens 400 Zeichen“ in der Anweisung an das Modell, harte Grenze bleibt 600 | Diagnose: 7 von 12 Antworten zu lang, danach 12 von 12 angenommen | Entwickler |
| Betrieb | OpenAI-Artikel bleiben ohne Zusammenfassung, die Cloudflare-Sperre wird nicht umgangen | Die Sperre ist gewollt | Entwickler |
| Prüfen | Review-Funde 1, 2, 3, 4, 7, 8, 10 behoben, 5, 6, 9 als bekannte Grenzen dokumentiert | Abwägung in der Session | Entwickler |
| Bauen | `@types/jsdom` 30.0.0 als devDependency ohne Rückfrage | `npm run check` scheiterte ohne Typen für `jsdom` | Entwickler |
| Bauen | Tool-Notiz heißt `docs/tools/Docker Model Runner.md`, nicht `Docker - Einrichtung.md` nach der globalen Regel | Wunsch des Entwicklers | Entwickler |
| Prüfen | Evaluation mit festem Testsatz, blind beurteilt, Treffer heißt Urteil „ja“, beim Video „keine Zusammenfassung“ | [[projects/tages-dashboard/docs/plaene/2026-11-15-evaluation\|Plan der Evaluation]], Liste „Aufgetaucht“ bestätigt | Entwickler |
| Prüfen | Testsatz ohne OpenAI (Cloudflare-Sperre), Karpathy aus dem Archiv, Seite mit Anweisung selbst geschrieben | Keine aktuelle Karpathy-Meldung, OpenAI liefert keinen Text | Entwickler (nachträglich bestätigt am 2026-11-16) |
| Technik | Qwen 3 4B bleibt das Modell | Gleich gut wie Gemma (15/15), fast dreimal so schnell. Nachtrag in ADR 0010 | Entwickler |
| Prüfen | Review-Funde von PR #64: 1+7, 2, 3, 4, 6, 8, 10 behoben, 5 und 9 bewusst offen | Abwägung in der Session | Entwickler |
| Produkt | Lokale KI auch für die Fußball-Kacheln (z. B. Spielbericht aus dem Liveticker), nach Phase 3, Schritt 2 | Wunsch des Entwicklers, Parkplatz in der Projektvision | Entwickler |
| Technik | Premier League und Champions League: ESPN live, Spieltag und Tabelle von football-data.org | [[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data\|ADR 0011]] | Entwickler |
| Design | Fußball-Kacheln bleiben eigenständig, stehen aber in einer Gruppe „Sport“ | Glossar „Gruppe“, leicht umkehrbar, kein ADR | Entwickler |
| Design | Linien in allen Tabellen (Europapokal, Abstieg), Plätze in der Einstellungsdatei | Befragung F5, F10, F13 | Entwickler |
| Design | Neues Aussehen für das ganze Dashboard als eigener PR nach Premier League und Champions League, mit Mock | Zu eintönig, Absender der KI-News nicht klar getrennt | Entwickler |
| Bauen | Skill `codebase-design` global eingebaut statt nur als Wissen genutzt | Wahl des Entwicklers | Entwickler |
| Bauen | Name `module-entwerfen`, ohne `DESIGN-IT-TWICE.md`, „Nahtstelle“ wie in `tdd` | Namensregel des Ecosystems, keine Subagent-Runde, Review-Fund 1. Am 2026-11-16 bestätigt: Name bleibt | Entwickler |

## Befehle: Docker Model Runner und Compose

```bash
docker model search
docker model pull ai/qwen3:4b-instruct-2507
docker model configure --context-size 8192 ai/qwen3:4b-instruct-2507
docker model unload --all
docker model logs
docker compose config --quiet
docker compose up --build -d
docker compose logs -f zusammenfassen
docker run --rm --entrypoint ls tages-dashboard-zusammenfassen -a /app
docker history --no-trunc tages-dashboard-zusammenfassen
```

- `docker model search`: listet Modelle im Bereich `ai/` von Docker Hub, daraus kamen die Kandidaten.
- `docker model pull`: lädt ein Modell auf den Mac wie ein Image.
- `docker model configure --context-size 8192`: legt fest, wie viel Text das Modell bei Aufrufen vom Mac sieht.
- `docker model unload --all`: nimmt alle Modelle aus dem Speicher, nötig nach dem Fehler „Compute error“.
- `docker model logs`: Log von `llama.cpp`, dort stand die eigentliche Ursache (`Insufficient Memory`).
- `docker compose config --quiet`: prüft `compose.yaml`, bevor etwas gebaut wird.
- `docker compose up --build -d`: baut das Image neu und startet den Container im Hintergrund.
- `docker compose logs -f zusammenfassen`: zeigt `Durchlauf: neu N, ohne M` und die Gründe für übersprungene Meldungen.
- `docker run … ls /app` und `docker history`: prüfen, dass kein Geheimnis im Image steckt.

## Befehle: Supabase-CLI

```bash
supabase login
supabase projects list
supabase db query --linked --project-ref <ref> -f supabase/zusammenfassungen.sql
supabase db query --linked --project-ref <ref> "select count(*) from public.zusammenfassungen"
supabase logout --yes
```

- `supabase login`: einmal in einem eigenen Terminal-Fenster, das Token landet im Schlüsselbund.
- `supabase projects list`: zeigt Ref und Status, hier auch, dass das Projekt nicht pausiert ist (`ACTIVE_HEALTHY`).
- `supabase db query --linked --project-ref …`: führt SQL über die Management API aus, wie der SQL Editor im Dashboard.
- `supabase logout --yes`: löscht das Token wieder, das für alle Projekte des Kontos gilt.

## Befehle: Evaluation

```bash
npx tsx evaluation/texte.ts
npx tsx evaluation/lauf.ts ai/qwen3:4b-instruct-2507
npx tsx evaluation/urteil.ts
npx tsx evaluation/auswertung.ts
docker compose stop zusammenfassen
docker compose ps
```

- `npx tsx evaluation/texte.ts`: holt die Artikeltexte des Testsatzes einmal nach `evaluation/daten/` (nicht im Repo).
- `npx tsx evaluation/lauf.ts <modell>`: ein Modell fasst den Testsatz zusammen, gemessen wird nur der Modellaufruf.
- `npx tsx evaluation/urteil.ts`: fragt die Urteile blind ab, nur in der Terminal-App.
- `npx tsx evaluation/auswertung.ts`: Tabelle mit Treffern, automatischen Prüfungen und Zeiten je Modell.
- `docker compose stop zusammenfassen`: gibt das Modell des Containers frei, damit nur ein Modell im Speicher liegt.
- `docker compose ps`: zeigt, ob der Container läuft.

## Befehle: Quellen prüfen

```bash
curl -s --compressed 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/summary?event=401884738'
curl -s --compressed 'https://api.football-data.org/v4/competitions'
curl -s --compressed 'https://api.openligadb.de/getmatchdata/pl/2026'
gh pr checks 64 --watch --interval 15
```

- ESPN `summary`: Daten zu einem Spiel, hier geprüft, ob es Text gibt (Liveticker ja, Bericht nein).
- football-data.org `competitions`: geht ohne Schlüssel, zeigt den Tarif (`TIER_ONE` = gratis) und den aktuellen Spieltag.
- OpenLigaDB `getmatchdata/pl/2026`: Spielplan der Premier League, 380 Spiele.
- `gh pr checks --watch`: wartet, bis CI und Vercel durch sind.

## Neu gelernt

### Lokales Sprachmodell mit Docker Model Runner

Docker Desktop lädt Sprachmodelle wie Images und beantwortet Anfragen im OpenAI-Format, ohne Schlüssel. Auf dem Mac läuft das Modell
direkt auf der Grafikeinheit, nicht im Container. Compose bindet es über `models:` an einen Dienst und setzt Adresse und Modellname als
Umgebungsvariablen.

### Structured Output

Mit `response_format` und einem JSON-Schema antwortet das Modell in einem festen Format. Trotzdem prüft der eigene Code die Antwort
(`pruefeAntwort`): Länge, Leere und fehlende Felder werden verworfen, bevor etwas gespeichert wird.

### Kleine Modelle brauchen Zahlen

„2 bis 3 Sätze“ legte Qwen großzügig aus, „zusammen höchstens 400 Zeichen“ hielt es ein. Eine konkrete Zahl wirkt bei kleinen Modellen
stärker als eine Beschreibung.

### Indirekte Prompt Injection

Ein Artikel ist fremder Text und kann Anweisungen an das Modell enthalten. Schutz in Schichten: Grenzen `<artikel>` in der Anfrage
(Marken im Artikel selbst werden entfernt), Prüfung der Antwort, Anzeige nur als Text, nie als HTML, Kennzeichnung „KI-generiert“.

### Compose Secret

Eine Datei vom Mac wird im Container unter `/run/secrets/<name>` eingehängt. Sie steckt weder im Image noch in den Umgebungsvariablen.

### TLS-Fingerabdruck

Beim Aufbau einer HTTPS-Verbindung verrät jedes Programm durch die Liste seiner Verfahren, was es ist. Cloudflare erkennt so Skripte,
bevor eine Seite geladen ist, auch wenn sie von derselben Adresse kommen wie ein Browser.

### Gegenprobe für Tests

War ein Test sofort grün, weil der Code schon vorher mehr konnte, beweist er erst etwas, wenn er rot wird, sobald man den Code kurz
verfälscht. So geprüft beim Kürzen der Artikel, beim Überspringen im Durchlauf und bei der Anzeige als reiner Text.

### Evaluation

Ein fester Testsatz macht Modelle vergleichbar, weil sich nur das Modell unterscheidet. Automatisch prüft man, was sich zählen lässt
(Format, Sätze, Sprache), ob der Inhalt stimmt, urteilt ein Mensch, und zwar blind, damit die Erwartung an ein Modell das Urteil nicht
färbt.

### Deckeneffekt

Erreichen alle Kandidaten die volle Punktzahl, zeigt der Test nur „gut genug“, nicht „besser“. Dann entscheidet ein anderes Merkmal (hier
die Zeit), oder der Testsatz braucht schwerere Fälle.

### Tiefe Module und Nahtstellen

Ein tiefes Modul hat viel Verhalten hinter einer kleinen Schnittstelle. Eine Nahtstelle lohnt erst mit zwei echten Adaptern, z. B. zwei
Quellen für dieselbe Tabelle. Mit dem Löschtest prüft man, ob ein Modul wirklich etwas trägt.

### Fremde Skills prüfen lassen

Ein fremder Skill wird in einen eigenen Ordner geladen und vom Agent `quellen-leser` gelesen, der nur lesen kann. So kann eine versteckte
Anweisung im Text nichts auslösen, bevor jemand weiß, was drinsteht.

## Fehler und Lösungen

### `Compute error.` (Status 500)

- **Wo:** Versuch, beide Modelle nacheinander ohne Entladen
- **Ursache:** Zwei Modelle gleichzeitig im Speicher, `Insufficient Memory (kIOGPUCommandBufferCallbackErrorOutOfMemory)`, danach blieb
  das Backend im Fehlerzustand.
- **Lösung:** `docker model unload --all`, immer nur ein Modell laden.
- **Prüfen:** `docker model ps` zeigt höchstens ein Modell.

### `Cannot connect to the Docker daemon at unix:///Users/matthias/.docker/run/docker.sock`

- **Wo:** Versuch nach Neustart der Sitzung
- **Ursache:** Docker Desktop lief nicht.
- **Lösung:** `open -a Docker`, Autostart in Docker Desktop eingeschaltet.
- **Prüfen:** `docker model status` meldet „Docker Model Runner is running“.

### `LoginMissingTokenError: Cannot use automatic login flow inside non-TTY environments`

- **Wo:** `! supabase login` in Claude Code
- **Ursache:** Mit `!` läuft der Befehl ohne echtes Terminal-Fenster.
- **Lösung:** `supabase login` in der App Terminal.
- **Prüfen:** `supabase projects list` zeigt die Projekte.

### `DbQueryMutuallyExclusiveFlagsError: --project-ref only applies when targeting the linked project`

- **Wo:** `supabase db query --project-ref …`
- **Ursache:** Der Schalter gilt nur zusammen mit `--linked`.
- **Lösung:** `--linked --project-ref <ref>`, ohne `supabase link`.
- **Prüfen:** Die Abfrage liefert JSON mit `rows`.

### `Invalid API key` (Status 401)

- **Wo:** Prüfung der Tabelle als Fremder per `curl`
- **Ursache:** Der Schlüssel steht in `.env.local` in einfachen Anführungszeichen, sie gingen mit in den Header.
- **Lösung:** Anführungszeichen entfernen.
- **Prüfen:** `select` liefert `[]` mit Status 200.

### `[warn] supabase/.temp/linked-project.json`

- **Wo:** `npm run check` nach `supabase db query --linked`
- **Ursache:** Die CLI legt einen Hilfsordner an, Prettier prüfte ihn mit.
- **Lösung:** `/supabase/.temp/` in `.gitignore`.
- **Prüfen:** `npm run check` endet mit Exit 0.

### `Top-level await is currently not supported with the "cjs" output format`

- **Wo:** Start von `zusammenfassen/lauf.ts` mit `tsx`
- **Ursache:** Ohne `"type": "module"` übersetzt `tsx` als CommonJS.
- **Lösung:** Die Schleife in eine Funktion packen.
- **Prüfen:** Ohne Variablen bricht das Skript mit „Umgebungsvariable MODELL_URL fehlt“ ab.

### `Durchlauf: neu 4, ohne 19`

- **Wo:** erster Durchlauf im Container
- **Ursache:** 7 Antworten länger als 600 Zeichen und verworfen, dazu Meldungen ohne Artikel. Die Gründe standen nicht im Log.
- **Lösung:** „zusammen höchstens 400 Zeichen“ in der Anweisung, Grund jeder übersprungenen Meldung ins Log.
- **Prüfen:** zweiter Durchlauf `neu 13, ohne 6`, alle 6 „kein Artikel“.

### `Status 403` mit `cf-mitigated: challenge` bei openai.com

- **Wo:** Artikelabruf im Container
- **Ursache:** Cloudflare prüft Programme am TLS-Fingerabdruck. Auch `curl` vom Mac bekam 403, Node auf dem Mac (OpenSSL 4.0.3) 200,
  Node im Image (OpenSSL 3.5.9) 403. Dass es genau an OpenSSL liegt, ist nicht bewiesen.
- **Lösung:** keine, die Sperre ist gewollt. Meldungen von OpenAI bleiben ohne Zusammenfassung.
- **Prüfen:** Das Log zeigt `Ohne Zusammenfassung: https://openai.com/… (kein Artikel)`.

### Vier Tests rot nach dem Dazulesen in der Kachel

- **Wo:** Aufgabe 6, `api-kacheln` und `kacheln-laden`
- **Ursache:** `cookies()` wirft außerhalb einer Anfrage, der Fehler riss die ganze Kachel mit.
- **Lösung:** Lesefehler abfangen, die Kachel zeigt die Meldungen dann ohne Zusammenfassung.
- **Prüfen:** Test „ohne Tabelle lädt die Kachel trotzdem“.

### Skript fragt nichts, wenn es mit `!` läuft

- **Wo:** `! npx tsx evaluation/urteil.ts` in Claude Code
- **Ursache:** Mit `!` bekommt der Befehl keine Tastatur, das Skript blieb bei der ersten Frage stehen.
- **Lösung:** in der App Terminal starten.
- **Prüfen:** `grep -cE '"urteil": "(ja|nein)"' evaluation/daten/ergebnis-*.json` zählt die Urteile.

### `urteil.ts` zählte 28 statt 14 offene Urteile

- **Wo:** Aufgabe 4, Test mit einer Sicherungskopie
- **Ursache:** Die Kopie `….json.bak` beginnt auch mit `ergebnis-` und wurde mitgelesen.
- **Lösung:** nur Dateien, die auf `.json` enden.
- **Prüfen:** zweiter Lauf zeigt `[1/12]` usw. passend zur einen Datei.

### `{"code":400,"message":"Failed to get events endpoint."}`

- **Wo:** ESPN `scoreboard?dates=20261107-20261109`
- **Ursache:** ESPN liefert keinen Datumsbereich (steht schon in ADR 0009).
- **Lösung:** einen einzelnen Tag abfragen (`dates=20261108`).
- **Prüfen:** Die Antwort enthält `events`.

### `UnicodeDecodeError: 'utf-8' codec can't decode byte 0x8b`

- **Wo:** Auswerten einer ESPN-Antwort mit Python
- **Ursache:** ESPN schickt die Antwort gepackt (gzip), `curl` entpackt ohne Schalter nicht.
- **Lösung:** `curl --compressed`.
- **Prüfen:** `json.load` liest die Datei.

## Aus dem Chat

-

## Offene Fragen

- Läuft der Container nach einem Neustart des Macs wirklich von selbst wieder (Autostart von Docker Desktop, `restart: unless-stopped`)?
- Bleibt die Cloudflare-Sperre bei OpenAI auch für Node auf dem Mac aus, oder ändert Cloudflare die Regeln?

## Nächste Schritte

1. Prüfung in Production: einloggen, bei den KI-News auf „KI“ tippen, Text mit „KI-generiert“ lesen.
2. Plan für Stufe 2, die Evaluation: Testsatz aus 15 echten Meldungen, Qwen gegen Gemma, Trefferquote und Zeit.
3. Danach zurück zu Phase 3, Schritt 2 (Premier League und Champions League).

Stand nach der Abend-Session:

4. Plan für Phase 3, Schritt 2, PR 1 (Premier League mit football-data.org) mit `module-entwerfen` und `plan-schreiben`. Vorher die Plätze
   der Linien prüfen (F13) und einen Schlüssel für football-data.org über `assistent-bauen` einrichten.
5. PR 2 Champions League, PR 3 neues Aussehen mit Mock.
