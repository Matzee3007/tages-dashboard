---
titel: Projektvision
status: aktiv
erstellt: 2026-10-24
tags: [projektvision, roadmap, tages-dashboard]
---

# Projektvision: Tages-Dashboard

## Ziel

Ein persönliches Live-Dashboard als Web-App (PWA), das **nur ich** nutze, auf Mac, iPhone und iPad. Es zeigt
auf einen Blick, was heute wichtig ist, in Kacheln, die sich später erweitern lassen:

- **Sport live:** Bundesliga (FC Bayern), Premier League (Arsenal), Champions League, NFL (Seattle Seahawks),
  Formel 1
- **Schritte:** aus Apple Health, per iPhone-Kurzbefehl an die App geschickt
- **KI-News:** von Anthropic, Claude Updates, OpenAI, Google DeepMind, Andrej Karpathy, Matt Pocock und Fachseiten, über
  RSS-Feeds und selbst ausgelesene Seiten

Problem: Die Infos liegen in vielen Apps und Seiten verstreut. Das Dashboard bündelt sie.

**Ausdrücklich nicht:** keine anderen Nutzer, kein App Store, keine native iOS-App, keine bezahlten
Datenquellen ohne eigenes ADR (X-API erst später, siehe Offene Fragen). Zum Start auch keine Push-Benachrichtigungen, keine
Mitmach-Funktionen (z. B. „als gelesen markieren“), keine Offline-Daten und keine Einstellungsseite.

**Wann ich draufschaue:** kurz zwischendurch auf dem iPhone („Was ist los?“) und nebenher auf Mac oder iPad,
z. B. während eines Spiels. Gebaut wird zuerst fürs iPhone, auf größeren Bildschirmen stehen die Kacheln
nebeneinander.

Fachbegriffe (Kachel, Abschnitt, Wettbewerb, Spieltag …): [[projects/tages-dashboard/docs/Glossar|Glossar]].

Weitere Notizen: [[projects/tages-dashboard/docs/Arbeitsumgebung|Arbeitsumgebung]] (was der Rechner braucht), [[projects/tages-dashboard/docs/Nächste Session|Nächste Session]] (womit es weitergeht),
[[projects/tages-dashboard/docs/Tools für später|Tools für später]] (vorgemerkte Werkzeuge).

## Lernziel

- eine **PWA** bauen, die sich auf iPhone und iPad wie eine App verhält
- **Login** mit Supabase Auth für genau einen Nutzer
- mehrere **fremde APIs** zusammenführen, mit Zwischenspeicher und Gratis-Grenzen umgehen
- **RSS-Feeds** auslesen und zusammenführen
- Daten vom **iPhone per Kurzbefehl** an die eigene App schicken
- ein **Kachel-System**, in das neue Bereiche einfach hineinpassen

Arbeitsweise (aus der globalen `CLAUDE.md`):
- Erst erklären lassen, dann ausführen. Bei jedem Befehl „Warum?“ fragen.
- Kleine Schritte, ein Pull Request pro Feature.
- Neue Aufgabe: `grill-with-docs` → `plan-schreiben` → `tdd` → `fertig-pruefen`.
- Am Ende jeder Session `journal` und `naechste-session`.

## Stack

Begründung und Alternativen: [[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]].

| Aufgabe | Werkzeug |
|---|---|
| Sprache und App | TypeScript, Next.js (App Router), Tailwind CSS |
| PWA | Web-App-Manifest von Next.js |
| Mac-App | Tauri, zeigt die Website in einem eigenen Fenster ([[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri\|ADR 0003]]) |
| Login und Datenbank | Supabase (Auth, Postgres) |
| Hosting | Vercel (kostenloser Tarif) |
| Tests und Qualität | Vitest, Testing Library, ESLint, Prettier |
| Sportdaten | OpenLigaDB, football-data.org, ESPN (inoffiziell), Jolpica, OpenF1 |
| News | RSS- und Atom-Feeds (`fast-xml-parser`), selbst ausgelesene Seiten |
| Schritte | iPhone-Kurzbefehl → eigene Schnittstelle der App |

## Architekturentscheidungen

1. **Web-App statt iOS-App:** ein Code für Mac, iPhone und iPad, kostenlos, ohne App Store und ohne
   Neuinstallieren alle 7 Tage. Schritte kommen per Kurzbefehl statt über HealthKit.
2. **Nur ein Nutzer:** alles hinter dem Login. Der Eingang für den Kurzbefehl hat einen eigenen geheimen Schlüssel.
3. **Kacheln:** jeder Bereich eigenständig, neue Bereiche ohne Umbau der anderen. Eine Kachel besteht aus
   Abschnitten.
4. **Daten holt der Server** und speichert sie kurz zwischen. Die Seite fragt jede Minute neu, solange sie offen ist.
   Verzögerte Ergebnisse im Gratis-Tarif (football-data.org) sind in Ordnung.
5. **Erst gratis:** bezahlte Quellen nur mit eigenem ADR.
6. **Einstellungen im Code:** Kacheln, Reihenfolge, Mein Team, Absender und Feeds, Tagesziel stehen in einer Datei
   im Code. Ändern heißt: Datei ändern und neu veröffentlichen. Eine Einstellungsseite lässt sich später nachrüsten.

## Inhalt der Kacheln

- **KI-News:** eine Kachel, darin ein Abschnitt pro Absender (ein Absender kann mehrere Kanäle haben). Jeder
  Abschnitt zeigt die neuesten 3 Meldungen der letzten 7 Tage mit Titel und Alter, ein Tipp öffnet das Original.
  Ohne neue Meldung schrumpft der Abschnitt auf eine Zeile mit dem Alter der letzten Meldung
  (`Anthropic · zuletzt vor 23 Tagen`). Der Abschnitt mit der neuesten Meldung steht oben. Titel bleiben in der
  Originalsprache, ohne Übersetzung und Zusammenfassung.
- **Sport:** eine Kachel pro Wettbewerb mit den Abschnitten Spieltag und Tabelle (Formel 1: Rennwochenende und
  WM-Wertung). Gezeigt wird der aktuelle Spieltag, nicht nur heute. Mein Team ist hervorgehoben und steht oben.
  Uhrzeiten in deutscher Zeit.
- **Schritte:** Schritte von heute, Tagesziel mit Fortschrittsbalken, Verlauf der letzten 7 Tage als Balken.

So könnte das fertige Dashboard aussehen: [Entwurf](https://claude.ai/artifact/VeWhiFgrVYtqnrivy3hFKt) vom
2026-10-25 (Mac/iPad und iPhone, Beispieldaten).

## Roadmap

Jede Phase endet mit etwas, das läuft und getestet ist. Eine fertige Phase wird in derselben Session
abgeschlossen (Regel „Phasenwechsel“ in der globalen `CLAUDE.md`).

- [x] **Phase 0 – Fundament:** Repo und `CLAUDE.md` stehen, Stack eingerichtet, erster Test grün,
  Projektvision mit `/grill-with-docs` geschärft, Phasen 1 bis 3 geplant
- [x] **Phase 1 – Grundgerüst:** Login, PWA (Symbol, Vollbild auf iPhone und iPad), Mac-App mit Tauri, Kachel-System mit
  einer Beispielkachel, online auf Vercel
- [ ] **Phase 2 – KI-News:** Feeds und selbst ausgelesene Seiten von Anthropic, Claude Updates, OpenAI, Google DeepMind,
  Karpathy, Matt Pocock und Fachseiten in einer Kachel mit einem Abschnitt pro Absender
- [ ] **Phase 3 – Sport:** je eine Kachel für Bundesliga (OpenLigaDB), Premier League und Champions League
  (football-data.org), NFL (ESPN) und Formel 1 (Jolpica, OpenF1), jeweils mit Spieltag und Tabelle
- [ ] **Phase 4 – Schritte:** iPhone-Kurzbefehl schickt die Schritte aus Apple Health an die App, Kachel mit
  Tageswert, Tagesziel und Verlauf
- [ ] **Später:** X-API (Kosten), weitere Wettbewerbe (z. B. DFB-Pokal, FA Cup), Push-Benachrichtigungen,
  „als gelesen markieren“, Offline-Daten, Einstellungsseite, weitere Kacheln

### Fahrplan Phasen 1 bis 3

Grobplan, Stand 2026-10-25. Jeder Schritt wird ein PR. Am Start einer Phase klärt `/grill-with-docs` die offenen
Fragen, am Start jedes Schritts schreibt `plan-schreiben` den genauen Plan in `docs/plaene/`. Spätere Phasen
dürfen den Fahrplan ändern, wenn frühere Neues zeigen.

**Phase 1 – Grundgerüst**

1. **Online auf Vercel** (erledigt 2026-10-26, PR #9, https://tages-dashboard-iota.vercel.app): Repo über die Git-Integration von Vercel verbinden (keine Vercel-CLI), jede Änderung an
   `main` geht live, jeder PR bekommt eine Vorschau, geschützt mit der Deployment Protection von Vercel. Adresse
   `*.vercel.app`, keine eigene Domain. Zuerst, weil die Seite noch nichts Privates zeigt.
2. **Login mit Supabase** (erledigt 2026-11-01, PR #12, siehe
   [[projects/tages-dashboard/docs/plaene/2026-11-01-login|Plan]] und
   [[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]): ein Supabase-Projekt online (Tarif
   Free, keine lokale Supabase vor Phase 4), auch der lokale Entwicklungsserver meldet sich dort an. Anmeldung mit
   **Passwort** (iCloud-Schlüsselbund), Registrierung aus, der einzige Nutzer wird im Supabase-Dashboard angelegt. Jede
   Seite hinter dem Login. Angemeldet bleiben bis „Abmelden“. Projekt-URL und Publishable Key von Supabase in
   `.env.local` (dazu eine `.env.example` im Repo) und bei Vercel. Der Secret Key wird nicht gebraucht. Die CI braucht
   die Werte nicht: Der Build läuft auch ohne sie (geprüft 2026-11-01, anders als im `/code-review` von PR #4 erwartet).
   Tests ersetzen Supabase durch eine Attrappe.
3. **PWA** (erledigt 2026-11-02, PR #16, siehe
   [[projects/tages-dashboard/docs/plaene/2026-11-02-pwa|Plan]]): Manifest, Symbol, Vollbild und „Zum Home-Bildschirm“ auf iPhone und iPad, „Zum Dock hinzufügen“ auf
   dem Mac. Auf allen drei Geräten prüfen, ob Vollbild und Login in der installierten App erhalten bleiben. Kurzer
   Name unter dem Symbol: „Heute“. Symbol: Kachel-Raster in Orange auf dunklem Grund, erst als SVG zur Freigabe,
   dann als PNG (180, 192, 512 px).
4. **Mac-App mit Tauri** (erledigt 2026-11-03, PR #25, siehe
   [[projects/tages-dashboard/docs/plaene/2026-11-03-mac-app|Plan]] und
   [[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]]): eine kleine
   Mac-App, die die Vercel-Adresse in einem eigenen Fenster zeigt, selbst gebaut und nur auf dem eigenen Mac installiert, dazu
   ein Symbol in der Menüleiste. Die App startet ohne Bezahlkonto bei Apple, die Anmeldung hält über einen Neustart und bis zum nächsten Tag.
5. **Kachel-Gerüst** (erledigt 2026-11-04, PR #27, siehe [[projects/tages-dashboard/docs/plaene/2026-11-04-kachel-geruest|Plan]] und
   [[projects/tages-dashboard/docs/adr/0004-kacheln-ueber-schnittstelle|ADR 0004]]): Einstellungsdatei, Kachel aus Abschnitten, eine Spalte auf dem iPhone und mehrere auf Mac
   und iPad, Aktualisierung jede Minute, eigener Fehlerzustand je Kachel. Aussehen aus dem
   [Entwurf](https://claude.ai/artifact/VeWhiFgrVYtqnrivy3hFKt) (dunkel, Barlow und Barlow Condensed, Orange für
   Mein Team und Live), Farben und Schriften zentral als Design-Token in Tailwind. Als Beispiel eine Testkachel
   ohne fremde Quelle: Sie zeigt die Server-Uhrzeit, kann per Schalter in der Einstellungsdatei einen Fehler werfen
   und verschwindet in Phase 2.

Entscheidungen aus der Befragung vom 2026-10-25:

- **Passwort statt Magic Link:** Eine PWA auf dem iPhone hat eigene Cookies, getrennt von Safari. Ein Link aus der
  Mail meldet deshalb Safari an, nicht die App. Der Gratis-Mailversand von Supabase schafft zudem nur 2 Mails
  pro Stunde. Ein E-Mail-Code (OTP) ginge auch, braucht aber jedes Mal eine Mail.
- **Supabase im Gratis-Tarif pausiert** nach 7 Tagen mit zu wenig Datenbank-Aktivität. Ob Logins dazu zählen, sagt die
  Doku nicht (nachgelesen 2026-11-01). Wird beobachtet, siehe [[projects/tages-dashboard/docs/tools/Supabase|Supabase]].

**Phase 2 – KI-News**

Stand 2026-11-04, nach der Befragung mit `/grill-with-docs`.

1. **Feeds lesen** (erledigt 2026-11-04, PR #30, siehe [[projects/tages-dashboard/docs/plaene/2026-11-04-feeds-lesen|Plan]]): Der Server liest RSS- und Atom-Feeds, fasst die Kanäle eines Absenders zusammen und speichert kurz
   zwischen. Fällt ein Kanal aus, laufen die anderen weiter. Alle Absender mit Feed kommen in die Einstellungsdatei.
2. **Links in der Mac-App:** Fremde Adressen gehen im Standardbrowser auf, die Hülle wird neu gebaut. Auf iPhone und
   iPad prüfen, wie die installierte App solche Links öffnet.
3. **KI-News-Kachel:** ersetzt die Testkachel. Ein Abschnitt pro Absender, die neuesten 3 Meldungen der letzten 7 Tage,
   die neueste oben, ohne neue Meldung nur eine Zeile. Beim ersten Deploy die offene App einmal neu laden.
4. **Seiten auslesen:** die Kanäle ohne Feed. Das kommt zuletzt, weil es am anfälligsten ist und die Kachel dann schon läuft.

Absender und Kanäle (am 2026-11-04 von diesem Rechner aus abgerufen, außer `claude.com/blog` nur grob geprüft):

| Absender | Feeds | Seiten zum Auslesen |
|---|---|---|
| Anthropic | YouTube `UCrDwWp7EBBv4NwvScIpBDOA`, `transformer-circuits.pub/feed.xml` | `anthropic.com/news`, `/research`, `/engineering`, `claude.com/blog`, `red.anthropic.com` |
| Claude Updates | `platform.claude.com/docs/en/release-notes/feed.xml` | `support.claude.com/en/articles/12138966-release-notes` |
| OpenAI | `openai.com/news/rss.xml` | |
| Google DeepMind | `deepmind.google/blog/rss.xml` | |
| Andrej Karpathy | `karpathy.bearblog.dev/feed/`, `karpathy.github.io/feed.xml`, YouTube `UCXUPKJO5MZQN11PqgIvyuvQ` | |
| Matt Pocock | YouTube `UCswG6FSbgZjbWtdf_hMLaow`, `aihero.dev/rss.xml` | |
| The Decoder | `the-decoder.de/feed/` | |
| The Verge | `theverge.com/rss/ai-artificial-intelligence/index.xml` | |
| Hacker News | `hnrss.org/newest?q=AI&points=100` | |

YouTube-Feeds haben die Form `youtube.com/feeds/videos.xml?channel_id=<ID>`.

Entscheidungen aus der Befragung vom 2026-11-04:

- **Anthropic liest seine Seiten selbst aus,** weil es keinen eigenen Feed anbietet. Der Fremd-Feed `Olshansk/rss-feeds` wurde
  verworfen. `robots.txt` erlaubt das Auslesen. Findet das Programm auf einer Seite nichts mehr, zählt das als Ausfall des Kanals.
- **Claude Updates ist ein eigener Absender:** Die Versionshinweise kommen fast täglich und würden sonst die Meldungen von Anthropic
  aus den 3 Zeilen verdrängen.
- **Nicht aufgenommen:** X (bezahlt), LinkedIn (Zugang ungeklärt), Alignment-Blog (nennt nur den Monat, die 7-Tage-Regel griffe nicht),
  Claude-Code-Versionen, Statusseite, GitHub-Aktivität, Bluesky und Total TypeScript (seit 2025 oder länger still), heise (auch
  Themen außerhalb von KI), Ars Technica (überschneidet sich mit The Verge). Simon Willison ist der erste Nachrücker.
- **Doppelte Meldungen:** Gleicher Link innerhalb eines Absenders erscheint einmal. Zwischen Absendern bleiben Dopplungen stehen.
- **Ausfälle:** Ein Kanal von mehreren fällt aus: Der Abschnitt zeigt still den Rest, der Fehler steht im Server-Log. Alle Kanäle eines
  Absenders fallen aus: eine Zeile `Anthropic · gerade nicht erreichbar`. Alle Absender fallen aus: Fehlerzustand der Kachel, der letzte
  Stand bleibt stehen.
- **Zwischenspeicher und Zeitlimits:** 15 Minuten je Kanal, 5 Sekunden je Kanal, 8 Sekunden je Kachel. Das Limit je Kachel steht zentral
  in `lib/kacheln/laden.ts` und gilt auch für die Sport-Kacheln.
- **`fast-xml-parser` statt `rss-parser`:** Es wird gepflegt, `rss-parser` zuletzt im April 2023. Die Umwandlung von RSS und Atom
  schreiben wir selbst.

**Phase 3 – Sport**

1. **Bundesliga (OpenLigaDB):** Spieltag und Tabelle, Mein Team hervorgehoben. Die erste Sport-Kachel legt das
   Muster für die anderen fest.
2. **Premier League und Champions League (football-data.org):** API-Schlüssel auf dem Server, Zwischenspeicher
   für die Grenze von 10 Abrufen pro Minute.
3. **Formel 1 (Jolpica, OpenF1):** Rennwochenende und WM-Wertung.
4. **NFL (ESPN):** zuerst prüfen, ob die Schnittstelle vom Server aus antwortet (Testabruf ergab 403). Falls
   nicht, eine andere Gratis-Quelle suchen oder die Kachel unter „Später“ schieben.

## Stolpersteine

- **Arsenal und Champions League nur verzögert:** football-data.org liefert im Gratis-Tarif verzögerte
  Ergebnisse (10 Abrufe pro Minute). Live kostet 12 € im Monat (Stand 2026-10-24).
- **NFL über eine inoffizielle Schnittstelle:** ESPN dokumentiert sie nicht, sie kann sich ohne Ankündigung ändern.
  Ein Testabruf am 2026-10-24 wurde mit 403 abgewiesen, das ist in Phase 3 zu klären.
- **Formel 1 live kostet:** OpenF1 gibt Live-Daten während der Sessions nur für 9,90 € im Monat, Ergebnisse
  danach sind gratis.
- **X-API kostet:** 0,005 $ je gelesenem Post, derselbe Post zählt pro Tag nur einmal (X-Doku, Stand 2026-11-04). Für vier Konten wären
  das geschätzt 3 $ im Monat. Am 2026-11-04 abgelehnt, weil das Dashboard nichts kosten soll. Auslesen ohne API verbieten die Regeln von X
  laut Berichten.
- **Ausgelesene Seiten:** Sie können ohne Vorwarnung brechen, sobald der Anbieter ihren Aufbau ändert.
- **Abruf vom Server:** Die Feeds wurden bisher nur vom Mac aus abgerufen. Ob Anbieter wie YouTube Server-Adressen von Vercel gleich
  behandeln, zeigt erst der erste Deploy.
- **Kurzbefehl-Automationen:** Ob sie auf dem iPhone zuverlässig ohne Nachfrage laufen, ist in Phase 4 zu prüfen.
- **Sicherheit:** Die App ist öffentlich erreichbar. Login und der geheime Schlüssel für den Kurzbefehl sind Pflicht.

## Offene Fragen

- Antwortet die ESPN-Schnittstelle von einem Server aus (Testabruf ergab 403)?
- Lohnen sich später Live-Daten für Arsenal (12 €/Monat) oder Formel 1 (9,90 €/Monat)?
