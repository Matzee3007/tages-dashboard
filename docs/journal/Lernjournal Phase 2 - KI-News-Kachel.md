---
titel: Lernjournal Phase 2 - KI-News-Kachel
status: aktiv
phase: 2
erstellt: 2026-11-06
tags: [lernjournal, phase-2, ki-news, vercel, mock-bauer, code-review, plan-pruefer, chrome]
---

# Lernjournal Phase 2: KI-News-Kachel

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 2 - Links in der Mac-App|Lernjournal Phase 2 - Links in der Mac-App]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] Mock der KI-News-Kachel mit dem Agent `mock-bauer`, drei Varianten. Freigegeben: Variante A (kompakte Liste) mit dem orangen Punkt aus
      Variante C, frisch heißt jünger als 24 Std.
- [x] [[projects/tages-dashboard/docs/plaene/2026-11-06-ki-news-kachel|Plan]] mit `plan-schreiben`, umgesetzt mit `tdd` (PR #37, gemergt):
      `alterText` und `istFrisch` in `lib/zeit.ts`, Lader `lib/kacheln/ki-news/kachel.ts`, Ansicht `lib/kacheln/ki-news/ansicht.tsx`.
      Die Testkachel ist samt `fehlerAusloesen` und `uhrzeitMitSekunden` gelöscht.
- [x] Entschieden: `stand` bleibt die Abrufzeit (Fund aus PR #30 hingenommen), kein `zusatz` in der Kachel, Zeitlimit je Kanal bleibt 5 s,
      Punkt bleibt bei 24 Std.
- [x] Gleiche Titel derselben Website erscheinen nur einmal (Claude Updates verlinkt mehrere Abschnitte einer Seite mit demselben Titel)
- [x] Vorschau auf Vercel repariert: Die Supabase-Variablen galten nur für Production, der Entwickler hat Preview ergänzt
- [x] Zwischenspeicher auf Vercel gemessen: alle 13 Feeds gespeichert, auch OpenAI (825 KB), `ladeKiNews` 563 ms. Kein Anbieter sperrt Vercel.
- [x] `plan-pruefer`: STATUS ERFÜLLT. `/code-review`: 8 Funde, 7 behoben, `zusatz` bewusst behalten (Plan, „Nach dem Review“)
- [x] Vercel-Token für die Messung angelegt, aus `.env.local` entfernt und auf Vercel gelöscht
- [ ] Gerätetest (Plan, Aufgabe 5): Links in der Mac-App und auf iPhone und iPad, offene Apps neu laden

## Befehle: Screenshot in echter Handybreite

```bash
# Chrome ohne Fenster mit Steuerprotokoll starten (eigenes Profil im Scratchpad)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --remote-debugging-port=9333 --user-data-dir=<scratchpad>/chrome-profil about:blank &

# Skript: neuen Tab öffnen, Emulation.setDeviceMetricsOverride auf 390 px, laden, 8 s warten, Breite messen, Page.captureScreenshot
node <scratchpad>/cdp-shot.mjs http://127.0.0.1:3123/ 390 echt-390-cdp.png
```

- `--remote-debugging-port`: öffnet das DevTools-Protokoll, über das ein Programm Chrome fernsteuert.
- Das Skript nutzt das eingebaute `WebSocket` von Node, ohne neue Abhängigkeit. Es meldete `{"breite":390,"fenster":390}`, also kein waagerechtes Scrollen.

## Befehle: Fehler der Vorschau nachstellen

```bash
# Build ohne Supabase-Variablen bauen und starten, wie eine Vorschau ohne Variablen
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npx next build
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npx next start -H 127.0.0.1 -p 3125
/usr/bin/curl -s -w '\n%{http_code}\n' http://127.0.0.1:3125/
```

- Variablen aus der Umgebung gehen vor `.env.local`. So lässt sich ein fehlender Wert lokal nachstellen.
- `next start` startet den fertigen Build wie auf Vercel, `next dev` dagegen den Entwicklungsserver.

## Befehle: Vercel-API

```bash
set -a; source .env.local; set +a   # Werte aus .env.local in die Umgebung laden, ohne sie anzuzeigen
/usr/bin/curl -s -o "$TMPDIR/dep.json" -H "Authorization: Bearer $VERCEL_TOKEN" \
  'https://api.vercel.com/v6/deployments?projectId=prj_QWERcypvPrphhPec8RQ40XIRpypr&limit=1'
/usr/bin/curl -s -N --max-time 300 -H "Authorization: Bearer $VERCEL_TOKEN" -o "$TMPDIR/logs.jsonl" \
  'https://api.vercel.com/v1/projects/prj_QWERcypvPrphhPec8RQ40XIRpypr/deployments/<dpl_…>/runtime-logs'
```

- Die erste Abfrage liefert Zustand, ID und Commit des neuesten Deployments, die zweite schreibt dessen Runtime-Logs mit.
- Weitere Befehle stehen in [[projects/tages-dashboard/docs/tools/Vercel|Vercel]].

## Neu gelernt

### Mock vor der Oberfläche

Der Mock zeigte drei echte Varianten und dazu Ungereimtheiten, die erst beim Anschauen auffallen: zweimal „gestern“, aber nur eine Zeile orange.
Daraus wurde die Regel „unter 24 Std. vor X Std.“, damit Punkt und Text zusammenpassen.

### Eine Attrappe ersetzt ein ganzes Modul

`vi.mock` tauscht ein Modul als Ganzes aus. Ruft eine Funktion eine Nachbarin aus derselben Datei auf, greift die Attrappe nicht. Deshalb liegt
`ladeKiNewsKachel` in einer eigenen Datei, damit Tests `ladeKiNews` ersetzen können.

### `NEXT_PUBLIC_…` steht nach dem Bauen fest im Code

Next.js schreibt diese Werte beim Bauen in den Code. Eine Variable, die nachträglich bei Vercel eingetragen wird, gilt erst nach einem neuen Build
(**Redeploy**). Das `!` in `process.env.X!` prüft nichts, ein fehlender Wert fällt erst zur Laufzeit auf.

### Runtime-Logs zeigen keine Dauer

Die Log-Schnittstelle von Vercel liefert Meldung, Pfad, Status und Zeit. Für die Messung kam vorübergehend eine markierte Zeile `[DEBUG-c7e1]` in
den Code: das Alter jeder Antwort aus dem Zwischenspeicher und die Dauer von `ladeKiNews`. Danach wurde sie mit `git revert` entfernt.
„Observability → External APIs“ gibt es im Gratis-Tarif nicht.

### Review-Vorschlag prüfen statt übernehmen

Der `/code-review` schlug vor, gleiche Links ohne `#…` zusammenzufassen. Bei Claude Updates zeigen aber alle Einträge auf dieselbe Seite, alle
wären zu einem geworden. Umgesetzt wurde stattdessen „gleicher Titel auf derselben Website“.

### Datum über `formatToParts`

Wie `Intl.DateTimeFormat` ein Datum als Text schreibt, hängt von den Sprachdaten des Browsers ab. `formatToParts` liefert Jahr, Monat und Tag
einzeln, daraus baut `Date.UTC` sicher einen Kalendertag.

## Fehler und Lösungen

### Screenshot in 390 px schneidet die Kachel rechts ab

- **Wo:** Aufgabe 4, Schritt 1, `Chrome --headless --window-size=390,1700 --screenshot=…`
- **Ursache:** Chrome ohne Fenster rendert breiter als 390 px und schneidet das Bild nur zu. Ein `iframe` mit 390 px zeigte nur „Lädt …“.
- **Lösung:** Breite über das DevTools-Protokoll mit `Emulation.setDeviceMetricsOverride` setzen (Befehle oben).
- **Prüfen:** Das Skript meldet `"breite":390`, das Bild zeigt Rand und Alter vollständig.

### `Internal Server Error` auf der Vorschau

- **Wo:** Vorschau von PR #37, jede Seite. Die Live-Seite und die Mac-App liefen.
- **Ursache:** `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` galten bei Vercel nur für Production. `proxy.ts` warf
  „Error: Your project's URL and Key are required to create a Supabase client!“. Bisher unbemerkt, weil noch nie eine Vorschau mit Login geöffnet wurde.
- **Lösung:** Settings → Environment Variables, Preview dazunehmen (Ändern ging nicht, der Entwickler hat Preview angehakt), dann **Redeploy**.
- **Prüfen:** Vorschau zeigt die Login-Seite, nach dem Login die Kachel.

### The Decoder und Hacker News „nicht erreichbar“ beim ersten Abruf

- **Wo:** lokal, erster Abruf von `/api/kacheln`, Log `TimeoutError: The operation was aborted due to timeout`
- **Ursache:** Beide Anbieter antworten mal in 1 s, mal in 6 bis 11 s. Das Zeitlimit je Kanal ist 5 s.
- **Lösung:** keine Änderung. Nach dem ersten Abruf kommen sie aus dem Zwischenspeicher, auf Vercel war kein Absender rot.
- **Prüfen:** zweiter Abruf von `/api/kacheln`, beide `erreichbar: true`.

### `JSONDecodeError: Invalid control character`

- **Wo:** Auswertung der Vercel-Antwort mit `echo "$d" | python3 …`
- **Ursache:** `echo` in zsh wandelt `\n` in der Antwort in echte Zeilenumbrüche um, das JSON ist danach ungültig.
- **Lösung:** Antwort mit `curl -o <datei>` in eine Datei schreiben und daraus lesen.
- **Prüfen:** Die Auswertung meldet `READY dpl_… 916373f`.

### Token im Chat

- **Wo:** Vercel-Token für die Logs
- **Ursache:** Der Entwickler hat es direkt in den Chat kopiert, statt es in den geplanten Assistenten einzugeben. Damit stand es im Chatverlauf.
- **Lösung:** Nach der Messung aus `.env.local` entfernt und auf Vercel gelöscht. Künftig ein Token nur über einen Assistenten (Skill `assistent-bauen`) eintragen.
- **Prüfen:** Das Token fehlt in der Liste auf https://vercel.com/account/tokens.

## Aus dem Chat

-

## Offene Fragen

- Wie öffnet die installierte App auf iPhone und iPad fremde Links, und bleibt man danach angemeldet?
- Wie oft holt Vercel die Feeds wirklich neu? Gemessen ist nur eine Abfrage.

## Nächste Schritte

1. Gerätetest aus dem Plan, Aufgabe 5, danach Schritt 3 im Fahrplan auf „erledigt“
2. Fahrplan-Schritt 4: Seiten auslesen
