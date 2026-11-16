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
- ein **lokales Sprachmodell** einbinden und prüfen (Evaluation, Structured Output)

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
| Sportdaten | ESPN (inoffiziell, Bundesliga, Premier League, Champions League und NFL), football-data.org (Spieltag und Tabelle von PL und CL), Jolpica, OpenF1 |
| News | RSS- und Atom-Feeds (`fast-xml-parser`), selbst ausgelesene Seiten |
| Schritte | iPhone-Kurzbefehl → eigene Schnittstelle der App |
| Zusammenfassungen | lokales Sprachmodell auf dem Mac über Docker Model Runner, Skript in Docker Compose ([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac\|ADR 0010]]) |

## Architekturentscheidungen

1. **Web-App statt iOS-App:** ein Code für Mac, iPhone und iPad, kostenlos, ohne App Store und ohne
   Neuinstallieren alle 7 Tage. Schritte kommen per Kurzbefehl statt über HealthKit.
2. **Nur ein Nutzer:** alles hinter dem Login. Der Eingang für den Kurzbefehl hat einen eigenen geheimen Schlüssel.
3. **Kacheln:** jeder Bereich eigenständig, neue Bereiche ohne Umbau der anderen. Eine Kachel besteht aus
   Abschnitten.
4. **Daten holt der Server** und speichert sie kurz zwischen. Die Seite fragt jede Minute neu, solange sie offen ist.
   Verzögerte Ergebnisse im Gratis-Tarif (football-data.org) sind in Ordnung. Ausnahme: Die Zusammenfassungen der KI-News erzeugt
   der Mac und legt sie in Supabase ab ([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]).
5. **Erst gratis:** bezahlte Quellen nur mit eigenem ADR.
6. **Einstellungen im Code:** Kacheln, Reihenfolge, Mein Team, Absender und Feeds, Tagesziel stehen in einer Datei
   im Code. Ändern heißt: Datei ändern und neu veröffentlichen. Eine Einstellungsseite lässt sich später nachrüsten.

## Inhalt der Kacheln

- **KI-News:** eine Kachel, darin ein Abschnitt pro Absender (ein Absender kann mehrere Kanäle haben). Jeder
  Abschnitt zeigt die neuesten 3 Meldungen der letzten 7 Tage mit Titel und Alter, ein Tipp öffnet das Original.
  Ohne neue Meldung schrumpft der Abschnitt auf eine Zeile mit dem Alter der letzten Meldung
  (`Anthropic · zuletzt vor 23 Tagen`). Der Abschnitt mit der neuesten Meldung steht oben. Titel bleiben in der
  Originalsprache, ohne Übersetzung. Dazu kommt je Meldung eine KI-Zusammenfassung des verlinkten Artikels auf Deutsch
  ([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]). Fehlt sie, erscheint die Meldung wie bisher.
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
- [x] **Phase 2 – KI-News:** Feeds und selbst ausgelesene Seiten von Anthropic, Claude Updates, OpenAI, Google DeepMind,
  Karpathy, Matt Pocock und Fachseiten in einer Kachel mit einem Abschnitt pro Absender
- [ ] **Phase 3 – Sport:** je eine Kachel für Bundesliga (ESPN), Premier League und Champions League
  (ESPN und football-data.org), NFL (ESPN) und Formel 1 (Jolpica, OpenF1), jeweils mit Spieltag und Tabelle
- [x] **Einschub – KI-Feature:** Zusammenfassung je Meldung der KI-News mit einem lokalen Sprachmodell
  ([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]), in drei Stufen: erster Modellaufruf, Evaluation mit
  Testsatz, Structured Output. Phase 3, Schritt 2 ruht so lange.
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
2. **Links in der Mac-App** (erledigt 2026-11-05, PR #34, siehe [[projects/tages-dashboard/docs/plaene/2026-11-05-links-mac-app|Plan]] und
   [[projects/tages-dashboard/docs/adr/0006-links-im-standardbrowser|ADR 0006]]): Fremde Adressen gehen im Standardbrowser auf, die Hülle wird neu gebaut.
3. **KI-News-Kachel** (erledigt 2026-11-07, PR #37, Gerätetest bestanden, siehe [[projects/tages-dashboard/docs/plaene/2026-11-06-ki-news-kachel|Plan]]): ersetzt die Testkachel. Ein Abschnitt pro Absender, die neuesten 3 Meldungen der letzten 7 Tage,
   die neueste oben, ohne neue Meldung nur eine Zeile. Beim ersten Deploy die offene App einmal neu laden. Auf iPhone und iPad prüfen, wie die installierte
   App fremde Links öffnet (aus Schritt 2, erst hier gibt es echte Links). Aus dem `/code-review` von PR #30 erledigt:
   Rechenzeit auf Vercel gemessen (563 ms, Feeds aus dem Zwischenspeicher), keine Rohtexte wie `&ouml;` in Titeln. Hingenommen: `stand` nennt
   die Abrufzeit statt des Alters der Daten.
4. **Seiten auslesen** (erledigt 2026-11-07, PR #40, siehe [[projects/tages-dashboard/docs/plaene/2026-11-07-seiten-auslesen|Plan]]): die Kanäle ohne Feed. Das kommt zuletzt, weil es am anfälligsten ist und die Kachel dann schon läuft.

Absender und Kanäle (am 2026-11-04 von diesem Rechner aus abgerufen, die Seiten am 2026-11-07 neu geprüft):

| Absender | Feeds | Seiten zum Auslesen |
|---|---|---|
| Anthropic | YouTube `UCrDwWp7EBBv4NwvScIpBDOA`, `transformer-circuits.pub/feed.xml` | `anthropic.com/news`, `/research`, `/engineering`, `/research/team/frontier-red-team` (Ziel von `red.anthropic.com`), `claude.com/resources/articles` (Ziel von `claude.com/blog`) |
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
  Stand bleibt stehen. Sichtbar wird ein Ausfall nach bis zu rund 1 Stunde
  ([[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]]).
- **Zwischenspeicher und Zeitlimits:** 15 Minuten je Kanal, 5 Sekunden je Kanal, 8 Sekunden je Kachel. Das Limit je Kachel steht zentral
  in `lib/kacheln/laden.ts` und gilt auch für die Sport-Kacheln. Es beendet nur das Warten, nicht den Abruf: In Phase 3 prüfen, ob das Abrufe der Anbieter
  mit Gratis-Grenzen verbraucht, und dann ein Abbruchsignal an die Lader geben.
- **`fast-xml-parser` statt `rss-parser`:** Es wird gepflegt, `rss-parser` zuletzt im April 2023. Die Umwandlung von RSS und Atom
  schreiben wir selbst.

**Phase 3 – Sport**

1. **Bundesliga (ESPN, [[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]])** (erledigt 2026-11-09, PR #49, siehe
   [[projects/tages-dashboard/docs/plaene/2026-11-08-bundesliga|Plan]]): Spieltag und Tabelle, Mein Team hervorgehoben. Die erste Sport-Kachel legt das
   Muster für die anderen fest.
2. **Premier League und Champions League (ESPN und football-data.org, ADR 0011):** API-Schlüssel auf dem Server, Zwischenspeicher
   für die Grenze von 10 Abrufen pro Minute. PR 1 Premier League erledigt 2026-11-16 (PR #73, siehe
   [[projects/tages-dashboard/docs/plaene/2026-11-16-premier-league|Plan]]), gemeinsames Modul `lib/kacheln/fussball/`. Spieltage ohne Pause
   dazwischen trennt seit 2026-11-16 der Spielplan (Nachtrag unten). Offen: PR 2 Champions League, PR 3 neues Aussehen.
3. **Formel 1 (Jolpica, OpenF1):** Rennwochenende und WM-Wertung.
4. **NFL (ESPN):** zuerst prüfen, ob die Schnittstelle vom Server aus antwortet (Testabruf ergab 403). Falls
   nicht, eine andere Gratis-Quelle suchen oder die Kachel unter „Später“ schieben.

Entscheidungen aus der Befragung vom 2026-11-08:

- **Wechsel des Spieltags:** eigene Regel für alle Wettbewerbe statt der des Anbieters. Ein Spieltag bleibt bis Mitternacht des Tages
  nach seinem letzten Spiel stehen, danach kommt der nächste (in der Winterpause also schon mit den neuen Terminen).
  *Nachtrag 2026-11-16 ([[projects/tages-dashboard/docs/adr/0012-spieltage-nach-nummer-trennen|ADR 0012]]):* Spieltage ohne Tag Pause
  dazwischen (Premier League Sa–Mo, gleich Di wieder) trennt der Anstieg der Nummer im Spielplan. Beginnt der nächste Spieltag am Tag
  nach dem letzten Spiel, gilt er ab 0 Uhr dieses Tages. Ein Nachholspiel bleibt im Block. Ohne Spielplan trennt nur eine Lücke.
- **Tabelle als Ausschnitt:** Platz 1 und Mein Team mit je 2 Plätzen darüber und darunter. Spalten: Platz, Team, Spiele,
  Tordifferenz, Punkte.
- **Mein Team** kann mehrere Teams umfassen (Champions League: FC Bayern und Arsenal), die Formel 1 hat vorerst keins.
- **Zwischenspeicher:** 1 Minute, solange ein Spiel des Spieltags läuft (ab Anstoß rund 2½ Stunden), sonst 15 Minuten. Die Grenze von
  football-data.org wird in Schritt 2 eigens nachgerechnet.
- **Zeitlimit:** Jeder Abruf eines Anbieters bekommt ein eigenes `AbortSignal.timeout` wie bei den KI-News. Ein zentrales
  Abbruchsignal entfällt.
- **Erst konkret, dann verallgemeinern:** Die Bundesliga wird ohne gemeinsame Sport-Hülle gebaut. Gemeinsames wird erst mit der zweiten
  Sport-Kachel (Schritt 2) herausgezogen, dann mit dem Skill `module-entwerfen` (übersetzt aus `codebase-design`, seit 2026-11-15 im Ecosystem).
- **Bundesliga von ESPN statt OpenLigaDB,** weil die Spieldaten möglichst live sein sollen und OpenLigaDB Ergebnisse oft erst Stunden
  später hat ([[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]).
- **Torschützen:** eine graue Zeile unter jeder Partie mit Toren, Tore beider Teams nach Minute, z. B. `García 7' · Schick 85'`.
- **Logos:** rund 20 px vor dem Teamnamen, der Browser lädt sie direkt beim Anbieter. Fehlt ein Bild, bleibt der Platz leer.
- **NFL** bleibt Schritt 4, zuerst mit einem Testabruf vom Server bei Vercel aus.

Entscheidungen aus der Befragung zu Schritt 2 vom 2026-11-15:

- **Quelle für Premier League und Champions League:** Partien, Live-Stand und Torschützen von ESPN (`eng.1`, `uefa.champions`),
  Nummer des Spieltags und Tabelle von football-data.org (Gratis-Tarif `TIER_ONE` deckt beide ab, geprüft am 2026-11-15). Die
  Bundesliga bleibt bei ESPN mit OpenLigaDB ([[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]).
- **Reihenfolge:** Bundesliga, Premier League, Champions League, KI-News.
- **Champions League zeigt alle Partien** des Spieltags (18 an zwei Abenden), Torschützen wie in der Bundesliga.
- **Tabelle mit Linien** an den Grenzen, die über das Weiterkommen entscheiden, in allen Ligen: Champions League nach Platz 8 und 24,
  Bundesliga und Premier League an den Plätzen für Champions League, Europa League, Conference League und Abstieg. Eine Linie erscheint
  nur, wenn beide Nachbarplätze im Ausschnitt stehen. Gilt auch für die schon gebaute Bundesliga.
- **Tabelle verzögert:** Der Spielstand ist live (ESPN), die Tabelle von football-data.org zieht nach.
- **Teams zusammenführen:** je Wettbewerb eine Liste im Code mit id bei ESPN, id bei football-data.org und deutschem Kurznamen, wie
  `TEAMS_BUNDESLIGA` (früher `TEAMNAMEN`). Fehlt ein Eintrag, steht der Name von ESPN da, in der Tabelle von football-data.org deren
  Kurzname (Nachtrag in ADR 0011).
- **football-data.org fällt aus:** Partien und Live-Stand kommen weiter, der Spieltag erscheint ohne Nummer, statt der Tabelle die Zeile
  „Tabelle gerade nicht erreichbar“.
- **Sport als Gruppe** (Glossar): Die Fußball-Kacheln bleiben eigenständige Kacheln (Architekturprinzip 3), stehen aber sichtbar zusammen
  unter „Sport“.
- **Plätze der Linien** stehen je Wettbewerb in der Einstellungsdatei im Code und werden zu jeder Saison von Hand geprüft. Sie zeigen
  die Grundverteilung, für 2026/27 geprüft am 2026-11-16: Bundesliga nach 4, 5, 6, 15, 16, Premier League nach 4, 5, 6, 17, Champions
  League nach 8 und 24. Verschieben Pokalsieger oder ein Zusatzplatz der UEFA-Wertung die Plätze, wird das am Saisonende von Hand
  nachgetragen. Quellen: [Bundesliga 2026/27](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/2026%E2%80%9327_Bundesliga),
  [Premier League](https://www.fourfourtwo.com/competition/how-many-european-places-does-the-premier-league-get),
  [Champions League](https://www.foxsports.com/stories/soccer/champions-league-who-is-in-the-round-of-16-who-heads-to-playoffs-who-is-out).
- **Quelle** festgehalten in [[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data|ADR 0011]].
- **Neues Aussehen für das ganze Dashboard:** Die Darstellung wirkt dem Entwickler zu eintönig, vor allem die Absender der KI-News sind
  nicht eindeutig voneinander getrennt. Das Aussehen wird einmal für alles neu gestaltet, mit Gruppe Sport und Linien in den Tabellen,
  vorher ein Mock mit Varianten zur Freigabe.
- **Aufteilung in PRs:** 1. Premier League mit football-data.org (Schlüssel, Zwischenspeicher) und dem Herausziehen des Gemeinsamen der
  Sport-Kacheln, dabei der Skill `module-entwerfen`. 2. Champions League (anderer Kalender, 36 Teams). 3. Neues Aussehen.
- **Spieltag aus Kalendertagen:** Aufeinanderfolgende Tage mit Spielen bei ESPN bilden einen Spieltag, ein Tag ohne Spiel trennt.
- **Nummer und Datum über dem Spieltag,** z. B. `9. Spieltag · Fr 6. – So 8. November`. ESPN kennt keine Nummer, sie kommt aus dem
  Spielplan der Saison bei OpenLigaDB (`getmatchdata/bl1/<Saison>`, passende Tage). Fehlt sie, stehen nur die Tage da.
- **Deutsche Teamnamen** aus einer eigenen Liste in den Einstellungen, nach der id von ESPN (Kurznamen, siehe unten).
  Mein Team wird über die id erkannt.
- **Frisch abgerufen,** solange eine Partie läuft oder ihr Anstoß vorbei ist, sie aber noch nicht als beendet gilt (Status von ESPN),
  sonst 15 Minuten Speicher. Das verfeinert die Regel „ab Anstoß rund 2½ Stunden“. Geändert nach dem `/code-review` von PR #49 statt
  „Speicher von 1 Minute“: Next.js liefert einen abgelaufenen Eintrag erst noch aus und holt den neuen im Hintergrund, der Spielstand hinge
  sonst immer einen Takt hinterher. Bei einem Abruf der Seite pro Minute bleibt es bei rund einem Abruf pro Minute.
- **Abgesagte oder verlegte Partien** (Status `POSTPONED` oder `CANCELED` bei ESPN) zeigen `abgesagt` statt der Anstoßzeit, ohne Ergebnis.
- **Laufende Partie:** Spielminute mit orangem Live-Punkt statt Anstoßzeit, z. B. `● 56'  Freiburg – Union 0:0`.
- **Nachholspiel:** Liegen alle Partien eines Blocks in einem früheren Spieltag als dem zuletzt gespielten, steht dort
  `Nachholspiel · Mi 18. November`.
- **Kurznamen der Saison 2026/27** (nach dem Mock vom 2026-11-08, ersetzen die vollen Namen), in Spieltag und Tabelle: Bayern, Dortmund,
  Leipzig, Freiburg, Leverkusen, Bremen, Elversberg, Stuttgart, Frankfurt, HSV, Mainz, Paderborn, Augsburg, Hoffenheim, Köln, Union,
  Schalke, Gladbach. Fehlt ein Team (z. B. ein Aufsteiger), steht der Kurzname von ESPN da und im Server-Log
  `Team <id> fehlt in der Namensliste`.
- **Aussehen nach dem Mock:** eine Zeile pro Partie (Zeit oder Minute, Logo und Kurzname je Team, Ergebnis), darunter bei jeder Partie
  mit Toren eine graue Zeile mit den Torschützen. Mein Team mit orangem Balken links und leicht orangem Hintergrund, in Spieltag und
  Tabelle. Eine Lücke in der Tabelle zeigt eine Zeile `···`.
- **Speicher:** Spielplan von OpenLigaDB 24 Stunden, Tabelle von ESPN wie die Partien (1 bzw. 15 Minuten).

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
- Parkplatz: RAG „Frag meine News“ (erst passende Zusammenfassungen suchen, dann antworten lassen). Wieder aufgreifen, wenn Stufe 3 des
  KI-Features zwei Wochen im Alltag läuft.
- Parkplatz: Agent mit Werkzeugen für die KI-News. Wieder aufgreifen, wenn Stufe 3 des KI-Features zwei Wochen im Alltag läuft.
- Parkplatz: K.-o.-Phase der Champions League (Hin- und Rückspiel, keine Tabelle). Wieder aufgreifen, wenn die Ligaphase endet
  (27. Januar 2027).
- Parkplatz: Lokale KI für die Fußball-Kacheln, z. B. ein deutscher Spielbericht nach Abpfiff aus dem englischen Liveticker von ESPN
  (`summary?event=…` liefert `commentary` und `keyEvents`, aber keinen Bericht, gesehen am 2026-11-15 an Köln gegen Leverkusen). Wunsch
  des Entwicklers vom 2026-11-15. Wieder aufgreifen, wenn Phase 3, Schritt 2 (Premier League und Champions League) fertig ist, dann mit
  `/grill-with-docs` klären (Form, welche Spiele, Speicherort, Bezug zu ADR 0010).
