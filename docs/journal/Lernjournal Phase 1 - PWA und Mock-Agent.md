---
titel: Lernjournal Phase 1 - PWA und Mock-Agent
status: aktiv
phase: 1
erstellt: 2026-11-02
tags: [lernjournal, phase-1, pwa, manifest, tauri, proxy, mock-bauer, tdd, code-review]
---

# Lernjournal Phase 1: PWA und Mock-Agent

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Login mit Supabase|Lernjournal Phase 1 - Login mit Supabase]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Fahrplan-Schritt 3 von **Phase 1 – Grundgerüst**.

## Erledigt

- [x] Entschieden: Mac-App mit Tauri zusätzlich zur PWA, als neuer Fahrplan-Schritt 4 (PR #15,
  [[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]])
- [x] Plan für die PWA geschrieben: [[projects/tages-dashboard/docs/plaene/2026-11-02-pwa|Plan]]
- [x] App-Symbol und Tab-Symbol über Mocks ausgewählt, jeweils Variante B
- [x] Neuer Agent `mock-bauer` und neue Regel in der globalen `CLAUDE.md`: neue Oberflächen zuerst als Mock zeigen
  (Ecosystem PR #131, `/code-review` mit 10 Funden)
- [x] PWA gebaut und live: Manifest, Symbole, Apple-Angaben, Ausnahmen im Proxy (PR #16, 54 Tests, `plan-pruefer` ERFÜLLT,
  `/code-review` mit 9 Funden, 5 behoben)
- [x] Gerätetest auf iPhone, iPad und Mac bestanden, Plan geschlossen (PR #17)
- [ ] Prüfen, ob die Anmeldung am nächsten Tag noch hält

## Befehle: Symbole

```bash
sips -s format png -z 512 512 symbol.svg --out icon-512.png
sips -g pixelWidth -g pixelHeight public/icons/*.png
```

- `sips -s format png -z …`: wandelt mit dem Bordmittel von macOS ein SVG in ein PNG der genannten Größe um.
- `sips -g pixelWidth -g pixelHeight`: zeigt die Größe von Bilddateien, zur Prüfung des Ergebnisses.

## Befehle: Mock und Screenshot

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --force-device-scale-factor=2 \
  --virtual-time-budget=2000 --window-size=1280,1000 --screenshot=mock.png "file:///pfad/mock.html"
open mock.html
```

- Chrome ohne Fenster macht einen Screenshot einer Seite: doppelte Pixeldichte wie auf Retina-Geräten,
  `--virtual-time-budget` gibt JavaScript Zeit zum Zeichnen.
- `open`: öffnet die Datei im Standardprogramm, damit der Entwickler den Mock sieht.

## Befehle: PWA prüfen

```bash
npm run build && npx next start -p 3123
/usr/bin/curl -s -o /dev/null -w '%{http_code} %{content_type}\n' 'http://localhost:3123/manifest.webmanifest'
/usr/bin/curl -s 'http://localhost:3123/login' | grep -oE '<(link|meta)[^>]*(manifest|apple|theme-color|mobile-web-app|rel="icon")[^>]*>'
```

- `npm run build && npx next start`: startet den Produktions-Build, nur so zeigt sich, was wirklich ausgeliefert wird.
- `curl` ohne Cookies: zeigt, was ein Browser bekommt, der nicht angemeldet ist. Erwartet ist 200 für Manifest und Symbole,
  307 zum Login für alles andere.
- `curl … | grep`: zeigt die Angaben im `<head>`, die Next.js aus `metadata` erzeugt hat.

## Neu gelernt

### PWA und Desktop-App

Eine Desktop-App ersetzt die PWA nicht, weil sie nur auf dem Mac läuft. Tauri und Electron zeigen beide eine Website in einem
eigenen Fenster: Tauri nutzt den Browserkern des Macs (WebKit) und wird klein, Electron bringt Chromium mit und wird groß.
Das Bezahlkonto bei Apple braucht nur, wer eine App an andere weitergibt.

### Manifest

Eine kleine Datei, die dem Browser Name, Symbol und Startadresse der App nennt. Next.js erzeugt sie aus `app/manifest.ts` und
liefert sie unter `/manifest.webmanifest` aus. Safari liest Name und Symbol zusätzlich aus `metadata.appleWebApp` und
`metadata.icons`.

### Enge Ausnahmen vom Login

Der Browser holt Manifest und Symbole ohne Cookies ab, darum brauchen sie eine Ausnahme im Proxy. Die erste Fassung `icons/`
hätte aber auch künftige Seiten unter `/icons/` geöffnet. Jetzt gilt `icons/[^/]+\.png$`, und die SVG-Quellen liegen in
`assets/icons/`, weil sie niemand abrufen muss.

### Kleine Symbole brauchen eine eigene Fassung

Bei 16 Pixeln fallen die Kacheln des App-Symbols zwischen die Pixel und verschwimmen. Das Tab-Symbol liegt deshalb auf ganzen
Pixeln. App-Symbole müssen deckend sein und ohne runde Ecken, die rundet das Gerät selbst.

### Gerätetest erst nach dem Merge

Die Vorschauen von PRs liegen hinter dem Vercel-Login, nur die Live-Adresse ist direkt erreichbar. Deshalb kommt der Gerätetest
nach dem Merge, und Korrekturen wären ein eigener PR.

### Regeln in der globalen `CLAUDE.md` müssen genau sein

Diese Datei laden auch Subagents. Eine Regel wie „warte auf Freigabe“ trifft also auch Agents, die niemanden fragen können.
Darum gilt die Mock-Regel nur im Gespräch mit dem Entwickler und nur für neue Oberflächen.

### Mock vor dem Bauen

Eine Beschreibung im Terminal reicht nicht, um über Aussehen zu entscheiden. Ein Mock zeigt Varianten im echten Zusammenhang,
hier das Symbol auf dem Home-Bildschirm und im Dock. Der Agent `mock-bauer` macht das und prüft sich per Screenshot.

### `/code-review`, wenn der PR in einem anderen Repo liegt

Das Ecosystem ist ein eigenes Repo, sein PR #131 wurde aus dem Projektordner heraus geprüft. Der Reviewer fand im Projekt keinen
PR mit dieser Nummer und nahm von sich aus den des Ecosystems. Das stand als Annahme in seinem Bericht.

## Fehler und Lösungen

### `Agent type 'mock-bauer' not found`

- **Wo:** beim ersten Probelauf des neuen Agents in derselben Sitzung
- **Ursache:** Ein neuer Agent steht manchmal erst später in der Sitzung bereit.
- **Lösung:** Probelauf über `general-purpose` mit dem Auftrag, die Agent-Datei zu lesen und zu befolgen. Etwas später war der
  Agent verfügbar. Er lud aber die Anleitung vom Zeitpunkt des Ladens, nicht die danach geänderte Datei.
- **Prüfen:** Lauf in einer neuen Sitzung (steht noch aus)

### Merge, während die Prüfungen noch liefen

- **Wo:** Ecosystem PR #131. `gh pr view` meldete `MERGEABLE`, `gh pr checks` zugleich `pending`.
- **Ursache:** `MERGEABLE` sagt nur, dass es keinen Konflikt gibt, nicht dass die Prüfungen fertig sind. Claude hat nur darauf
  geachtet.
- **Lösung:** Danach die Läufe geprüft: alle grün, auch auf `main`. Bei den PRs #16 und #17 erst gemergt, als alle Prüfungen für
  genau die Spitze des Branches fertig waren.
- **Prüfen:** `gh pr checks <nr>` und `headRefOid` aus `gh pr view <nr> --json headRefOid` mit `git rev-parse HEAD` vergleichen

### `invalid slug — expected the artifact's server-assigned UUID`

- **Wo:** beim Lesen des Entwurfs mit `read_artifact`, um die Farben zu holen
- **Ursache:** Die Kennung aus dem Link ist nicht die UUID. Dieses Artifact ist zudem aus einer Vorlage gebaut und über
  `read_artifact` nicht lesbar.
- **Lösung:** `list_files` mit dem ganzen Link, dann `read_file` für `project/Main.dc.html`. Farben: `#FF8A3D`, `#0E1013`.
- **Prüfen:** `list_files` liefert die Dateiliste

### `[warn] __tests__/manifest.test.ts`

- **Wo:** `npm run check`, Schritt `format:check`
- **Ursache:** Die neue Testdatei war nicht nach Prettier formatiert.
- **Lösung:** `npx prettier --write __tests__/manifest.test.ts`
- **Prüfen:** `npm run check`

## Aus dem Chat

-

## Offene Fragen

- Bleibt die Anmeldung in der installierten App auch am nächsten Tag erhalten?
- Hält die Anmeldung auch in der Mac-App mit Tauri, und startet sie ohne Bezahlkonto bei Apple?
- Soll die Mac-App mehr können als ein Fenster mit der Website (z. B. Symbol in der Menüleiste)?
- Pausiert Supabase ab 2026-11-08, oder zählen Logins als Aktivität?

## Nächste Schritte

1. Anmeldung in der installierten App nachprüfen.
2. Fahrplan-Schritt 4: Plan für die Mac-App mit Tauri.
3. Fahrplan-Schritt 5: Kachel-Gerüst, zuerst ein Mock mit `mock-bauer`.
