---
titel: "ADR 0010: Zusammenfassungen vom Mac mit lokalem Modell"
status: akzeptiert
erstellt: 2026-11-13
tags: [adr, architektur, ki-news, sprachmodell, docker, supabase]
---

# ADR (Architecture Decision Record) 0010: Zusammenfassungen vom Mac mit lokalem Modell

## Kontext

Das erste KI-Feature des Projekts: Jede Meldung der KI-News soll eine Zusammenfassung ihres verlinkten Artikels bekommen
(Befragung vom 2026-11-12 bis 2026-11-15). Der Entwickler will daran lernen, ein Sprachmodell einzubinden und zu prüfen, und sich in
lokale Modelle und Docker einarbeiten.

Messung am 2026-11-12: Die Feeds liefern fast nur Anreißer von 90 bis 500 Zeichen, die ausgelesenen Seiten nur Titel und Datum. Für eine
Zusammenfassung muss der Artikel abgerufen werden.

Randbedingungen:

- Das Dashboard läuft bei Vercel. Ein Server dort erreicht ein Modell auf dem Mac nicht, das iPhone unterwegs auch nicht.
- „Erst gratis“ (Projektvision): Ein gehostetes Modell kostet nach Verbrauch.
- Der Mac ist ein Apple M5 mit 16 GB Arbeitsspeicher. Docker Desktop mit Docker Model Runner (1.2.6, `llama.cpp` mit Metal) ist
  installiert und antwortet auf `http://localhost:12434`.

## Entscheidung

- **Das Modell läuft lokal auf dem Mac über Docker Model Runner.** Es kostet nichts pro Aufruf, „Erst gratis“ bleibt.
- **Der Mac erzeugt, das Dashboard liest nur.** Ein Skript im Repo liest die Meldungen, ruft je neuer Meldung den Artikel ab, lässt
  das Modell zusammenfassen, prüft die Antwort und legt sie in Supabase ab. Vercel ruft nie ein Modell auf.
- **Supabase speichert je Meldung nur Link, Zusammenfassung, Modellname und Zeitpunkt,** nicht den Artikel.
- **Das Skript läuft in einem Container über Docker Compose.** Compose bindet das Modell über das Element `models` an und übergibt
  Adresse und Modellname als Umgebungsvariablen.
- **Zeitplan:** stündlich, solange der Mac wach ist. Zusammengefasst werden nur Meldungen, die noch keine Zusammenfassung haben. Der
  Container läuft dauerhaft (`restart: unless-stopped`) und arbeitet in einer Schleife, Docker Desktop startet beim Anmelden am Mac.
- **Schreibrecht:** Das Skript meldet sich mit dem Publishable Key und dem Passwort des einzigen Nutzers an. Das Passwort liegt als
  Compose Secret in einer Datei auf dem Mac, nicht im Repo. Die Tabelle hat RLS: Lesen und Schreiben nur für Angemeldete. Der Secret Key
  bleibt ungenutzt.
- **Artikel auslesen:** allgemein mit `@mozilla/readability` und `jsdom`, nicht mit eigenem Code je Website. Ohne lesbaren Text keine
  Zusammenfassung.
- **Lange Artikel:** Das Modell bekommt nur den Anfang bis zur Grenze des Kontextfensters, die Tabelle merkt sich das im Feld „gekürzt“.
- **Welches Modell,** entscheidet die Evaluation: zwei bis drei Kandidaten, die auf 16 GB passen, am selben Testsatz aus 15 echten
  Meldungen, auch schwierigen (sehr lang, deutsch, Video ohne Artikel, Seite mit eingebauter Anweisung an das Modell). Automatisch geprüft
  werden Format, Länge (2 bis 3 Sätze) und Sprache. Ob eine Zusammenfassung stimmt und die Kernaussage trifft, urteilt der Entwickler.
  Ergebnis: Trefferquote und Zeit je Zusammenfassung pro Modell.
- **Sprache:** Deutsch. Wird das zu ungenau oder zu langsam, Englisch.
- **In der Kachel** ist die Zusammenfassung als KI-generiert gekennzeichnet. **Fehlt sie** (Mac aus, Artikel nicht lesbar, Antwort
  durchgefallen), erscheint die Meldung wie bisher, ohne Hinweis.

## Alternativen

- **Nur gehostete API (Anthropic) auf dem Server bei Vercel:** immer verfügbar, auch wenn der Mac aus ist, und das stärkere Modell. Kostet
  nach Verbrauch (geschätzt unter 5 $ im Monat) und bricht „Erst gratis“. Lokale Modelle lernt man dabei nicht.
- **API im Betrieb, lokales Modell nur im Vergleich:** deckt beide Lernziele ab, das Dashboard hängt nie am Mac. Abgelehnt, weil das lokale
  Modell im Alltag arbeiten und nichts kosten soll.
- **Tunnel von Vercel zum Mac:** Der Mac wäre aus dem Internet erreichbar, das widerspricht „Nur ein Nutzer“ und ist anfällig.
- **Skript direkt mit `npm run` statt im Container:** weniger Teile. Abgelehnt, weil Docker hier mitgelernt werden soll.
- **Secret Key statt Anmeldung:** einfacher, aber er umgeht alle Regeln der Datenbank, in Phase 4 auch die der Schritte.
- **Zeitplan über `launchd` von macOS:** braucht kein dauerhaft laufendes Skript, wäre aber ein zweites Werkzeug neben Docker.
- **Ein zweites Modell als Prüfer der Evaluation:** auf 16 GB zu langsam und selbst unzuverlässig.
- **Ein Überblick über alle Meldungen oder eine Einordnung je Meldung** statt einer Zusammenfassung: käme ohne Abruf der Artikel aus.
  Abgelehnt, weil die Tiefe je Meldung wichtiger ist.

## Konsequenzen

- **Ausnahmen von Festgelegtem:** „Daten holt der Server“ gilt hier nicht, den Artikel holt der Mac. „Meldungen werden nicht
  gespeichert“ ([[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]) gilt weiter für die Meldungen, die
  Zusammenfassungen liegen in der ersten Tabelle des Projekts.
- **Ist der Mac aus oder schläft er,** bekommen neue Meldungen erst später eine Zusammenfassung. Docker Desktop muss laufen.
- **Passwort auf dem Mac:** Wer an die Datei mit dem Secret kommt, kann sich ins Dashboard einloggen. Wird das Passwort geändert, muss
  die Datei mit.
- **Neue Abhängigkeit:** `@mozilla/readability`. Liefert sie bei einer Website schlechten Text, zeigt das der Testsatz.
- **Fremde Inhalte:** Artikel können Anweisungen an das Modell enthalten (indirekte Prompt Injection). Die Antwort wird gegen ein festes
  Format geprüft und nie als HTML angezeigt.
- **Abruf der Artikel:** Jede Website ist anders aufgebaut und kann ohne Vorwarnung brechen, wie die Seiten-Kanäle
  ([[projects/tages-dashboard/docs/adr/0007-seiten-mit-node-html-parser|ADR 0007]]). YouTube-Videos haben keinen Artikel.
- **Kleine Modelle:** Lange Artikel (bis 80.000 Zeichen gemessen) passen womöglich nicht in das Kontextfenster. Tempo und Qualität auf dem
  Mac sind noch nicht gemessen.
- **Docker Model Runner:** Vom Mac heißt die Adresse `http://localhost:12434/engines/v1/`, aus einem Compose-Container setzt Compose
  `http://model-runner.docker.internal/v1/` (OpenAI-Format, ohne Schlüssel). `response_format` mit `json_schema` funktioniert (Versuch
  vom 2026-11-15, siehe Plan). Auf 16 GB passt immer nur ein Modell gleichzeitig in den Speicher.
- **Später:** RAG („Frag meine News“) und ein Agent sind geparkt, siehe Offene Fragen der Projektvision.
