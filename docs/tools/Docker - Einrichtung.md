---
titel: Docker - Einrichtung
status: aktiv
erstellt: 2026-11-15
tags: [tools, docker, compose, sprachmodell, ki-news]
---

# Docker - Einrichtung

Wie Docker im Tages-Dashboard eingerichtet ist. Was Docker allgemein ist: [[docs/werkzeuge/Docker|Docker]] im Ecosystem.
Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Entscheidung:
[[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]].

## Wofür nutzen wir es?

Ein Container auf dem Mac fasst einmal pro Stunde die Meldungen der KI-News zusammen. Das Sprachmodell dafür läuft lokal über
**Docker Model Runner**. Das Ergebnis landet in Supabase, Vercel liest es nur.

## Begriffe

- **Docker Model Runner:** Teil von Docker Desktop, lädt Sprachmodelle wie Images (`docker model pull`) und beantwortet Anfragen im
  OpenAI-Format. Auf dem Mac läuft das Modell direkt auf dem Rechner mit der Grafikeinheit (Metal), nicht in einem Container.
- **Compose `models`:** bindet ein Modell an einen Dienst. Compose setzt dann die Adresse und den Namen als Umgebungsvariablen
  (`endpoint_var`, `model_var`).
- **Compose `secrets`:** hängt eine Datei vom Mac im Container unter `/run/secrets/<name>` ein. Sie steckt nicht im Image und nicht in
  den Umgebungsvariablen.
- **Kontextgröße:** wie viel Text (in Token) das Modell auf einmal sieht. Hier 8192.

## Wie haben wir es eingerichtet?

**2026-11-15, Einschub KI-Feature** nach
[[projects/tages-dashboard/docs/plaene/2026-11-15-zusammenfassungen|Plan: Zusammenfassungen erzeugen und zeigen]]:

1. Docker Desktop mit Docker Model Runner 1.2.6 und Docker Compose 5.5.1 waren schon installiert.
2. Modelle geladen: `ai/qwen3:4b-instruct-2507` (2,5 GB, im Betrieb) und `ai/gemma4:e4b` (6 GB, Kandidat für die Evaluation).
3. Dateien im Repo: `compose.yaml` (Dienst `zusammenfassen`, Modell, Secret), `zusammenfassen/Dockerfile` (`node:24-slim`, `npm ci`,
   Start mit `npx tsx zusammenfassen/lauf.ts`), `.dockerignore` (keine `.env*`, `.secrets`, `docs`, `.git` im Image).
4. Werte über einen Assistenten (Skill `assistent-bauen`): `ZUSAMMENFASSEN_EMAIL` in `.env.local`, das Passwort des Dashboard-Kontos in
   `.secrets/supabase-passwort` (Modus 600, in `.gitignore`). Der Assistent prüfte die Anmeldung vor dem Speichern.
5. Docker Desktop → Settings → General → „Start Docker Desktop when you sign in to your computer“ an.

## Typischer Ablauf

Nach einer Änderung am Code unter `lib/` oder `zusammenfassen/` das Image neu bauen und den Container neu starten:

```bash
docker compose up --build -d          # baut das Image neu und startet den Container im Hintergrund
docker compose logs -f zusammenfassen # zeigt "Durchlauf: neu N, ohne M" und Gründe für übersprungene Meldungen
```

Der Container startet nach dem Neustart des Macs von selbst, sobald Docker Desktop läuft (`restart: unless-stopped`).

## Befehle

```bash
docker model status                                   # läuft Docker Model Runner?
docker model list                                     # geladene Modelle
docker model ps                                       # welches Modell gerade im Speicher liegt
docker model pull ai/qwen3:4b-instruct-2507           # Modell laden
docker model configure --context-size 8192 <modell>   # Kontextgröße für Aufrufe vom Mac
docker model unload --all                             # alle Modelle aus dem Speicher nehmen
docker model logs                                     # Log von Docker Model Runner (llama.cpp)
docker model search                                   # Modelle im Bereich ai/ von Docker Hub
docker compose config --quiet                         # compose.yaml prüfen
docker compose down                                   # Container stoppen und entfernen
docker run --rm --entrypoint ls tages-dashboard-zusammenfassen -a /app   # was im Image liegt
```

Adressen: vom Mac `http://localhost:12434/engines/v1/`, aus dem Compose-Container `http://model-runner.docker.internal/v1/`.

## Bekannte Grenzen

- **Nur ein Modell gleichzeitig:** Auf 16 GB reicht der Speicher nicht für zwei geladene Modelle (siehe Fehler).
- **Mac aus, keine Zusammenfassung:** Läuft Docker Desktop nicht, bekommen neue Meldungen erst später eine.
- **Image 1,43 GB:** `npm ci` installiert alle Abhängigkeiten des Projekts, auch Next.js.
- **OpenAI-Artikel bleiben ohne Zusammenfassung:** openai.com antwortet dem Container mit 403 (siehe Fehler).
- **Fehlschläge werden nicht gemerkt** (`/code-review` von PR #61, bewusst offen): Meldungen ohne Artikel oder mit verworfener Antwort
  ruft der Durchlauf jede Stunde neu ab, solange die Kachel sie zeigt. Das kostet nur ein paar Abrufe pro Stunde.
- **20.000 Zeichen gegen 8192 Token** (`/code-review` von PR #61, bewusst offen): Ein Artikel mit viel Code oder vielen Adressen könnte
  das Kontextfenster sprengen. Dann liefert das Modell einen Fehler und die Meldung bleibt ohne Zusammenfassung. Im Versuch ergaben
  11.447 Zeichen rund 2.400 Token.

## Fehler

- **`Compute error.` (Status 500) bei jedem Aufruf** (2026-11-15). Im `docker model logs`: `Insufficient Memory
  (kIOGPUCommandBufferCallbackErrorOutOfMemory)`. **Ursache:** Zwei Modelle waren gleichzeitig geladen, die Grafikeinheit lief voll,
  danach blieb das Backend im Fehlerzustand. **Lösung:** `docker model unload --all`, immer nur ein Modell laden.
- **`Cannot connect to the Docker daemon`** (2026-11-15). **Ursache:** Docker Desktop lief nach dem Neustart nicht. **Lösung:**
  `open -a Docker` und den Autostart einschalten (Einrichtung, Schritt 5).
- **`Top-level await is currently not supported with the "cjs" output format`** (2026-11-15) beim Start von `lauf.ts` mit `tsx`.
  **Ursache:** Ohne `"type": "module"` in `package.json` übersetzt `tsx` als CommonJS. **Lösung:** die Schleife in eine Funktion packen.
- **7 von 12 Zusammenfassungen verworfen** (2026-11-15), alle länger als 600 Zeichen. **Ursache:** Die Anweisung „2 bis 3 Sätze“ nannte
  keine Zeichenzahl. **Lösung:** „zusammen höchstens 400 Zeichen“ in die Anweisung, danach 12 von 12 angenommen.
- **`Status 403` mit `cf-mitigated: challenge` bei openai.com** (2026-11-15), nur im Container, vom Mac mit Node 200. **Ursache:**
  Cloudflare vor openai.com stellt Programmen eine Prüfung „Bist du ein Mensch?“ und erkennt sie am Verbindungsaufbau (TLS-Fingerabdruck),
  nicht an der Netzadresse: Mac und Container gingen über dieselbe Adresse `104.18.33.45`, und auch `curl` vom Mac bekam 403. Node im
  Image (24.22.3, OpenSSL 3.5.9) wird geprüft, Node auf dem Mac (24.22.0, OpenSSL 4.0.3) kam durch. Dass es genau an OpenSSL liegt,
  ist nicht bewiesen. **Lösung:** keine. Die Sperre ist gewollt, sie zu umgehen hieße, den Schutz von OpenAI auszutricksen. Diese
  Meldungen erscheinen ohne Zusammenfassung (ADR 0010, „Fehlt eine Zusammenfassung“).
