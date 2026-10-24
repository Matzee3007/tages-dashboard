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

- **Sport live:** Bundesliga, FC Bayern, Arsenal, NFL mit den Seattle Seahawks, Formel 1
- **Schritte:** aus Apple Health, per iPhone-Kurzbefehl an die App geschickt
- **KI-News:** per RSS von Anthropic, OpenAI, Google DeepMind, Fachseiten sowie Andrej Karpathy und Matt Pocock
  über ihre eigenen Kanäle (Blog, Newsletter, YouTube)

Problem: Die Infos liegen in vielen Apps und Seiten verstreut. Das Dashboard bündelt sie.

**Ausdrücklich nicht:** keine anderen Nutzer, kein App Store, keine native iOS-App, zum Start keine bezahlten
Datenquellen (X-API erst später, siehe Offene Fragen).

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
| Login und Datenbank | Supabase (Auth, Postgres) |
| Hosting | Vercel (kostenloser Tarif) |
| Tests und Qualität | Vitest, Testing Library, ESLint, Prettier |
| Sportdaten | OpenLigaDB, football-data.org, ESPN (inoffiziell), Jolpica, OpenF1 |
| News | RSS-Feeds |
| Schritte | iPhone-Kurzbefehl → eigene Schnittstelle der App |

## Architekturentscheidungen

1. **Web-App statt iOS-App:** ein Code für Mac, iPhone und iPad, kostenlos, ohne App Store und ohne
   Neuinstallieren alle 7 Tage. Schritte kommen per Kurzbefehl statt über HealthKit.
2. **Nur ein Nutzer:** alles hinter dem Login. Der Eingang für den Kurzbefehl hat einen eigenen geheimen Schlüssel.
3. **Kacheln:** jeder Bereich eigenständig, neue Bereiche ohne Umbau der anderen.
4. **Daten holt der Server** und speichert sie kurz zwischen. Die Seite fragt jede Minute neu, solange sie offen ist.
5. **Erst gratis:** bezahlte Quellen nur mit eigenem ADR.

Stack-Wahl mit Alternativen: [[projects/tages-dashboard/docs/adr/0001-stack|ADR 0001]].

## Roadmap

Jede Phase endet mit etwas, das läuft und getestet ist. Eine fertige Phase wird in derselben Session
abgeschlossen (Regel „Phasenwechsel“ in der globalen `CLAUDE.md`).

- [ ] **Phase 0 – Fundament:** Repo und `CLAUDE.md` stehen, Stack eingerichtet, erster Test grün,
  Projektvision mit `/grill-with-docs` geschärft, Phasen 1 bis 3 geplant
- [ ] **Phase 1 – Grundgerüst:** Login, PWA (Symbol, Vollbild auf iPhone und iPad), Kachel-System mit einer
  Beispielkachel, online auf Vercel
- [ ] **Phase 2 – KI-News:** RSS-Feeds von Anthropic, OpenAI, Google DeepMind, Fachseiten, Karpathy und Matt Pocock
  zusammenführen, neueste zuerst
- [ ] **Phase 3 – Sport:** Bundesliga und FC Bayern (OpenLigaDB), Arsenal und Champions League (football-data.org),
  NFL und Seattle Seahawks (ESPN), Formel 1 (Jolpica, OpenF1)
- [ ] **Phase 4 – Schritte:** iPhone-Kurzbefehl schickt die Schritte aus Apple Health an die App, Kachel mit
  Tageswert und Verlauf
- [ ] **Später:** X-API (Kosten), weitere Kacheln

## Stolpersteine

- **Arsenal und Champions League nur verzögert:** football-data.org liefert im Gratis-Tarif verzögerte
  Ergebnisse (10 Abrufe pro Minute). Live kostet 12 € im Monat (Stand 2026-10-24).
- **NFL über eine inoffizielle Schnittstelle:** ESPN dokumentiert sie nicht, sie kann sich ohne Ankündigung ändern.
  Ein Testabruf am 2026-10-24 wurde mit 403 abgewiesen, das ist in Phase 3 zu klären.
- **Formel 1 live kostet:** OpenF1 gibt Live-Daten während der Sessions nur für 9,90 € im Monat, Ergebnisse
  danach sind gratis.
- **X-API kostet** ab etwa 200 $ im Monat, deshalb zum Start RSS.
- **Kurzbefehl-Automationen:** Ob sie auf dem iPhone zuverlässig ohne Nachfrage laufen, ist in Phase 4 zu prüfen.
- **Sicherheit:** Die App ist öffentlich erreichbar. Login und der geheime Schlüssel für den Kurzbefehl sind Pflicht.

## Offene Fragen

- Sind Karpathy und Matt Pocock auf Bluesky aktiv (kostenloses RSS)? Welche Feeds haben ihre Blogs und Kanäle?
- Welche Fachseiten genau (z. B. heise, The Verge, Hacker News)?
- Antwortet die ESPN-Schnittstelle von einem Server aus (Testabruf ergab 403)?
- Lohnen sich später Live-Daten für Arsenal (12 €/Monat) oder Formel 1 (9,90 €/Monat)?
