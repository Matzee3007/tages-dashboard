---
titel: Lernjournal Phase 1 - Dependabot und Mac-App
status: abgeschlossen
phase: 1
erstellt: 2026-11-04
tags: [lernjournal, phase-1, ci, dependabot, tauri, rust, mock-bauer, code-review, kacheln, plan-pruefer]
---

# Lernjournal Phase 1: Dependabot und Mac-App

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - PWA und Mock-Agent|Lernjournal Phase 1 - PWA und Mock-Agent]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Fahrplan-Schritt 4 von **Phase 1 – Grundgerüst**. Die Session lief
am 2026-11-03 und 2026-11-04.

## Erledigt

- [x] PWA nachgeprüft, Ergebnis eingetragen (PR #24)
- [x] CI-Falle behoben: Ein Merge-Commit auf `main` kann nicht mehr ungeprüft bleiben (PR #19)
- [x] Dependabot eingerichtet (PR #20, #23), Warnungen und Sicherheits-Updates im Repo eingeschaltet
- [x] 17 Meldungen von `npm audit` geklärt, Warnung #1 als `tolerable_risk` geschlossen
- [x] React auf 19.3.1 (PR #21), ESLint 10 abgelehnt (PR #22 geschlossen)
- [x] Mock für das Symbol in der Menüleiste, Freigabe: Symbol a (vier Kacheln, einfarbig), Verhalten B
- [x] Plan `docs/plaene/2026-11-03-mac-app.md` geschrieben und umgesetzt
- [x] Rust 1.99.1 installiert, Mac-App „Heute“ gebaut und nach `/Applications` installiert (PR #25)
- [x] Gerätetest am Mac bestanden, auch die Anmeldung am nächsten Tag, Ergebnisse in [[projects/tages-dashboard/docs/tools/Tauri|Tauri]]
- [ ] Der Schlüsselbund bietet das Passwort in der Mac-App nicht an, es wird von Hand eingegeben
- [x] Fahrplan-Schritt 5 am 2026-11-04: Mock freigegeben (Variante B, CSS-Grid, letzten Stand merken), Plan
      `docs/plaene/2026-11-04-kachel-geruest.md` umgesetzt, PR #27 gemergt, [[projects/tages-dashboard/docs/adr/0004-kacheln-ueber-schnittstelle|ADR 0004]]
- [x] Gerätetest nach dem Merge laut Entwickler bestanden („ja klappt“)
- [x] **Phase 1 – Grundgerüst abgeschlossen**
- [ ] Vercel-Logs nicht geprüft: Ob bei ausgeblendeter Mac-App wirklich keine Abfragen ankommen, ist offen
- [ ] Cloudflare Security Audit nicht gelaufen, vom Entwickler in die Übergabe verschoben

## Befehle: CI und Dependabot

```bash
gh run list --branch main --limit 2
npm audit --omit=dev
gh api -X PUT repos/Matzee3007/tages-dashboard/vulnerability-alerts
gh api -X PUT repos/Matzee3007/tages-dashboard/automated-security-fixes
gh api -X PATCH repos/Matzee3007/tages-dashboard/dependabot/alerts/1 -f state=dismissed -f dismissed_reason=tolerable_risk
gh pr close 22 --comment '…'
```

- `gh run list --branch main`: zeigt die Läufe auf `main`, belegte nach zwei schnellen Merges, dass beide durchliefen.
- `npm audit --omit=dev`: Sicherheitsmeldungen nur für das, was die App ausliefert (hier 0 statt 17).
- Die beiden `PUT`-Aufrufe schalten Warnungen und Sicherheits-Updates ein. Das steht nicht in `dependabot.yml`, es ist eine
  Einstellung des Repos.
- `PATCH …/alerts/1`: schließt eine Warnung mit Begründung, lässt sich wieder öffnen.
- `gh pr close`: schließt einen PR ohne Merge, mit Begründung als Kommentar.

## Befehle: Rust und Tauri

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init --ci --app-name Heute --window-title Heute --frontend-dist <url> --dev-url <url>
npm run tauri -- dev
npm run tauri -- icon src-tauri/icons/quelle.png
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri -- build
codesign -dv /Applications/Heute.app
```

- `npx tauri init`: legt das Gerüst `src-tauri/` an, davon blieb nur, was die Hülle braucht.
- `npm run tauri -- dev`: startet die App zum Entwickeln und baut bei Änderungen in `src-tauri/` neu.
- `npm run tauri -- icon`: erzeugt aus einem PNG alle Symbolgrößen, auch für Windows und Mobilgeräte. Behalten haben wir nur die
  für den Mac.
- `cargo test`: Tests der Rust-Hülle. `--manifest-path` nennt die `Cargo.toml`, weil sie nicht im Wurzelordner liegt.
- `npm run tauri -- build`: baut die fertige `.app`, signiert sie ad-hoc.
- `codesign -dv`: zeigt die Signatur, erwartet `Signature=adhoc`.

## Befehle: Kachel-Gerüst

```bash
npm run build
/usr/bin/curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' 'https://tages-dashboard-iota.vercel.app/api/kacheln'
gh pr checks 27 --watch --interval 20
gh pr view 27 --json mergeable --jq .mergeable
gh pr merge 27 --merge
```

- `npm run build`: baut die App für den Betrieb. Die Ausgabe zeigt mit `ƒ`, dass `/api/kacheln` bei jeder Anfrage neu läuft.
- `/usr/bin/curl … -w`: zeigt nur Statuscode und Weiterleitungsziel, hier als Beleg, dass die Schnittstelle ohne Anmeldung zu ist (401).
- `gh pr checks --watch`: wartet, bis die Prüfungen des PR durch sind.
- `gh pr view … mergeable`: sagt, ob GitHub den PR mergen kann.
- `gh pr merge --merge`: übernimmt den PR in `main`, Vercel veröffentlicht danach von selbst.

## Neu gelernt

### `concurrency`-Gruppen in GitHub Actions

Läufe derselben Gruppe laufen nie gleichzeitig: Es läuft höchstens einer und einer wartet, ein neuer wartender verdrängt den alten.
Mit einer Gruppe je Branch konnte so ein Merge-Commit auf `main` ungeprüft bleiben. Jetzt hat auf `main` jeder Commit eine eigene
Gruppe.

### Indirekte Abhängigkeit und Peer-Abhängigkeit

Eine indirekte Abhängigkeit zieht ein anderes Paket mit, wie hier `minimatch` über ESLint. Anheben lässt sie sich nur, wenn das
Paket darüber es erlaubt. Eine Peer-Abhängigkeit ist die Angabe, mit welchen Fassungen eines anderen Pakets eines zusammenarbeiten
will. PR #22 auf ESLint 10 war grün, obwohl die Plugins nur ESLint bis 9 erlauben: Eine grüne CI beweist das nicht.

### `cooldown` und Grenzen von Sicherheits-Updates

Mit `cooldown` schlägt Dependabot neue Versionen erst nach einer Wartezeit vor, weil manipulierte Fassungen oft in den ersten Tagen
auffallen. Gruppen und `cooldown` gelten nur für Versions-Updates, Sicherheits-Updates kommen sofort und einzeln.

### Tauri als Hülle

Tauri zeigt eine Website mit dem Browserkern des Macs in einem eigenen Fenster. Rust wird nur für die Hülle gebraucht, Änderungen an
der Website erreichen die App ohne neuen Bau. Fremde Seiten dürfen laut Doku die App-Funktionen nicht aufrufen, solange eine Capability
(Rechte-Datei) das nicht erlaubt. Wir haben keine angelegt.

### `devUrl` und `frontendDist`

Der Dev-Modus liest nur `devUrl`, die fertige App nur `frontendDist`. Beide brauchen also die Vercel-Adresse.

### Template-Bild und Ad-hoc-Signatur

Ein Template-Bild ist ein einfarbiges Symbol, das macOS passend zur Leiste färbt. Eine Ad-hoc-Signatur kommt ohne Apple-Konto aus. Die
App startete auf diesem Mac ohne Warnung.

### Fenster ausblenden und App ausblenden

`fenster.hide()` nimmt nur das Fenster weg, die App bleibt aktiv, mit ihrem Menü oben in der Leiste. `app.hide()` gibt den Fokus an das
vorherige Programm zurück. Das fiel erst im `/code-review` auf, nicht im ersten Gerätetest.

### Rechtsklick auf dem Mac

Option + Klick ist kein Rechtsklick und kommt als Linksklick an. Auf dem Trackpad ist der Rechtsklick ein Klick mit zwei Fingern. Eine
markierte Ausgabe (`[DEBUG-a4f2]`) je Klick zeigte, was wirklich ankommt, statt zu raten.

### Warum nicht `router.refresh()`

Es wäre der kürzeste Weg, die Seite jede Minute zu erneuern. Im Quellcode von Next.js 16.4.3 steht aber, dass es bei Netzfehler oder Status 500 zum
vollen Neuladen wechselt. Der gemerkte letzte Stand wäre weg. Deshalb fragt der Browser eine eigene Schnittstelle ab, siehe ADR 0004.

### Route Handler und `connection()`

Ein Route Handler ist eine Adresse, die Daten statt einer Seite liefert. Mit `cacheComponents` würde ein `GET` ohne Laufzeitdaten schon beim Bauen
vorgerendert, eine Uhrzeit bliebe stehen. `await connection()` am Anfang verschiebt die Arbeit auf die Anfrage.

### 401 und 503 statt Weiterleitung

Leitet der Proxy eine Schnittstelle zum Login weiter, kann der Browser „abgemeldet“ nicht von einem Aussetzer bei Supabase unterscheiden. Jetzt heißt
401 abgemeldet und 503 vorübergehend gestört. Vorübergehende Fehler erkennt `isAuthRetryableFetchError` aus `@supabase/supabase-js`.

### CSS-Spalten und CSS-Grid

Bei CSS-Spalten bestimmt die Höhe, in welcher Spalte eine Kachel landet, und Kacheln können bei einer Aktualisierung die Spalte wechseln. CSS-Grid hält die
Reihenfolge fest, dafür bleiben unter kurzen Kacheln Lücken. `minmax(min(320px,100%),1fr)` verhindert auf schmalen iPhones waagerechtes Scrollen.

### `visibilitychange`

Das Ereignis meldet, ob eine Seite sichtbar ist. Der Takt fragt nur bei sichtbarer Seite ab. Nur der Wechsel prüft, ob 60 Sekunden vergangen sind, sonst entfiele
durch kleine Zeitabweichungen jede zweite Abfrage.

### Mehrere Prüfungen finden Verschiedenes

Der `plan-pruefer` fand zu großzügige Häkchen, vor allem die Browser-Prüfung ohne Login. Das `/code-review` fand danach unter anderem den Sprung zum Login bei einem
Supabase-Aussetzer. Beide Funde hatten die 87 grünen Tests nicht gezeigt.

## Fehler und Lösungen

### `curl: (77) error adding trust anchors from file: /opt/anaconda3/ssl/cacert.pem`

- **Wo:** beim Installationsskript von `rustup`.
- **Ursache:** Das Skript rief das `curl` aus Anaconda auf, das seine Zertifikate nicht lesen kann.
- **Lösung:** `PATH=/usr/bin:/bin:/usr/sbin:/sbin sh rustup-init.sh -y`, nur für diesen Aufruf.
- **Prüfen:** `~/.cargo/bin/rustc --version`

### `asset not found: index.html`

- **Wo:** im Fenster bei `npm run tauri -- dev`.
- **Ursache:** Der Plan hatte `devUrl` entfernt. Ohne `devUrl` sucht der Dev-Modus eine eingebaute `index.html` (`get_app_url` im
  Quellcode von Tauri).
- **Lösung:** `devUrl` wieder auf die Vercel-Adresse gesetzt, Plan korrigiert.
- **Prüfen:** Das Fenster zeigt die Login-Seite.

### `security_update_not_possible`

- **Wo:** im Lauf „npm_and_yarn in /. for minimatch“ von Dependabot, er endete rot.
- **Ursache:** `eslint` und seine Plugins legen `minimatch` unter 11 fest.
- **Lösung:** Keine möglich. Risiko geprüft (nur Entwicklungswerkzeuge), Warnung als `tolerable_risk` geschlossen.
- **Prüfen:** `npm audit --omit=dev` meldet 0.

### `(eval):1: = not found`

- **Wo:** in einem eigenen Prüfbefehl mit `echo == text`.
- **Ursache:** zsh deutet ein ungequotetes `=name` als Befehlssuche.
- **Lösung:** Text in Anführungszeichen, `echo '---- text'`.
- **Prüfen:** Der Befehl läuft durch.

### `found unexpected ':' while scanning a plain scalar`

- **Wo:** beim Einlesen von `.github/dependabot.yml` mit dem Ruby von macOS.
- **Ursache:** Das alte Ruby stolpert über den Doppelpunkt in `[version-update:semver-major]`.
- **Lösung:** Wert in Anführungszeichen.
- **Prüfen:** Die Datei lässt sich einlesen, Dependabot lief danach an.

### `Do not use window.location.assign() to navigate to internal Next.js pages`

- **Wo:** ESLint-Warnung `@next/next/no-location-assign-relative-destination` in `app/dashboard.tsx`.
- **Ursache:** Der Wechsel zum Login lief zuerst über `window.location.assign`.
- **Lösung:** `useRouter()` aus `next/navigation`, später `router.replace("/login")`.
- **Prüfen:** `npm run lint` ohne Warnung.

### Abgelaufene Sitzung ließ „Zurück“ in einer Schleife enden

- **Wo:** Fund 3 im `/code-review` von PR #27, nur gelesen, nicht nachgestellt.
- **Ursache:** `router.push` legt einen Eintrag im Verlauf an, die alte Seite ruft erneut ab und schickt wieder zum Login.
- **Lösung:** `router.replace`.
- **Prüfen:** Test „wechselt zum Login, wenn die Sitzung abgelaufen ist“.

## Aus dem Chat

-

## Offene Fragen

- Hält der Ausschluss in `npm-klein` React dauerhaft aus dem Sammel-PR heraus? Das zeigt erst ein Lauf mit Sammel-PR.
- Warum bietet der Schlüsselbund das Passwort in der Mac-App nicht an? Nicht untersucht.
- Meldet die Mac-App die Sichtbarkeit, sodass ausgeblendet wirklich keine Abfragen laufen? Vercel-Logs nicht geprüft.

## Nächste Schritte

1. Fahrplan-Schritt 5: Kachel-Gerüst, zuerst ein Mock. (erledigt, PR #27)
2. Phase 2 – KI-News, vorher fragen, ob etwas anderes ansteht. Restpunkte stehen in [[projects/tages-dashboard/docs/Nächste Session|Nächste Session]].
