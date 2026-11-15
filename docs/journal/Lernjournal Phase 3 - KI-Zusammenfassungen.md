---
titel: Lernjournal Phase 3 - KI-Zusammenfassungen
status: aktiv
phase: 3
erstellt: 2026-11-15
tags: [lernjournal, phase-3, ki-feature, sprachmodell, docker, docker-model-runner, supabase, rls, grill-with-docs, tdd]
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

## Aus dem Chat

-

## Offene Fragen

- Läuft der Container nach einem Neustart des Macs wirklich von selbst wieder (Autostart von Docker Desktop, `restart: unless-stopped`)?
- Bleibt die Cloudflare-Sperre bei OpenAI auch für Node auf dem Mac aus, oder ändert Cloudflare die Regeln?

## Nächste Schritte

1. Prüfung in Production: einloggen, bei den KI-News auf „KI“ tippen, Text mit „KI-generiert“ lesen.
2. Plan für Stufe 2, die Evaluation: Testsatz aus 15 echten Meldungen, Qwen gegen Gemma, Trefferquote und Zeit.
3. Danach zurück zu Phase 3, Schritt 2 (Premier League und Champions League).
