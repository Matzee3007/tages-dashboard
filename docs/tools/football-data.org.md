---
titel: football-data.org
status: aktiv
erstellt: 2026-11-16
tags: [tools, api, sport, premier-league, champions-league]
---

# football-data.org

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Entscheidung:
[[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data|ADR 0011]].

## Was ist das?

Eine offizielle, dokumentierte Fußball-Schnittstelle (REST, Version 4) eines Einzelentwicklers (Freitag Web Tec UG). Der Gratis-Tarif bleibt
laut Preisseite dauerhaft gratis.

## Wofür nutzen wir es?

Nur für die **Nummer des Spieltags** (`currentMatchday`) und die **Tabelle** von Premier League (`PL`) und Champions League (`CL`). Partien,
Live-Stand und Torschützen kommen von [[projects/tages-dashboard/docs/tools/ESPN|ESPN]].

## Steckbrief

| Frage | Antwort | Quelle |
|---|---|---|
| Welche Daten geben wir dem Dienst? | Nur den Schlüssel im Header `X-Auth-Token` und die abgefragte Adresse. Bei der Registrierung Name und E-Mail. | Doku „API policies“, Registrierung |
| Tarif und Grenzen | Gratis-Tarif (`TIER_ONE`): 12 Wettbewerbe, „Basic data“ (Spielplan, Ergebnisse, Tabellen), **10 Abrufe pro Minute**. Spielstände verzögert. | Registrierungsseite, Doku „Request-Throttling“, ADR 0011 |
| Was passiert an der Grenze? | Jede Antwort trägt den Header `x-requests-available-minute` (nach dem ersten Abruf: `9`). Was beim Wert 0 kommt, nennt die Doku nicht, vermutlich Status 429, im Bau prüfen. | Test am 2026-11-16 |
| Kosten | 0 €. Bezahlte Tarife erst nach eigenem ADR (Architekturprinzip 5). | Preisseite |
| Welcher Schlüssel, wo? | `FOOTBALL_DATA_API_KEY`, **nur Server** (ohne `NEXT_PUBLIC_`), in `.env.local` und bei Vercel (Production, Preview, „Sensitive“). | ADR 0011 |
| Ausfall | Partien und Live-Stand kommen weiter von ESPN, der Spieltag erscheint ohne Nummer, statt der Tabelle „Tabelle gerade nicht erreichbar“. | Projektvision, ADR 0011 |

## Abrufe

Seit 2026-11-16 in `lib/kacheln/fussball/quellen.ts` (lesen: `football-data.ts`), Kachel Premier League (`PL`).

| Abruf | Adresse | Speicher |
|---|---|---|
| Spielplan der Saison | `https://api.football-data.org/v4/competitions/PL/matches` (380 Partien, 371 KB), Felder `utcDate`, `matchday` | 24 Std., ohne Etikett: ↻ lädt ihn nicht neu |
| Tabelle | `https://api.football-data.org/v4/competitions/PL/standings`, nur `type: "TOTAL"` | 15 Min., Etikett `premier-league`, nie frisch |

Beide mit `X-Auth-Token`, `User-Agent: Tages-Dashboard` und 5 Sekunden Zeitlimit. Fällt ein Abruf aus (auch 429 oder ohne Schlüssel),
steht der Fehler im Server-Log, die Kachel zeigt den Spieltag ohne Nummer bzw. „Tabelle gerade nicht erreichbar“. Rechnung zur Grenze von
10 Abrufen pro Minute: [[projects/tages-dashboard/docs/plaene/2026-11-16-premier-league|Plan der Premier League]], „Fremde Dienste“.

## Bekannte Grenzen

Aus dem `/code-review` von PR #73, bewusst offen:

- **Vorgezogenes Spiel:** Behält eine vorgezogene Partie ihren alten `matchday`, gelten die Spieltage dazwischen als „Nachholspiel“, weil
  `spieltagTitel` die höchste frühere Nummer vergleicht (gilt auch für OpenLigaDB). Selten.
- **Tagesgrenze:** `leseFdSpielplan` ordnet nach deutschem Kalendertag, die Tage von ESPN folgen einer US-Tagesgrenze. Trifft nur Anstöße
  nach etwa 1 Uhr deutscher Zeit. Bei der Champions League (PR 2) erneut prüfen.
- **↻ und die Grenze:** Jeder Druck auf ↻ holt die Tabelle neu, ab etwa 6 Drücken in einer Minute droht 429. Dann erscheint „Tabelle
  gerade nicht erreichbar“.
- **Spieltage ohne Pause** (Samstag bis Montag, dann Dienstag): behoben am 2026-11-16, `waehleSpieltag` trennt, wo der `matchday` steigt
  (ADR 0012). Fällt der Spielplan aus (auch bei 429, das nicht gespeichert wird), verschmelzen sie wieder zu einem Block, bis er zurück
  ist. Die Kachel kann dann zwischen beiden Ansichten springen.
- **Zwei Spieltage an einem Tag** (z. B. über Weihnachten die letzten Partien des 18. und die ersten des 19.): Der Spielplan merkt sich je
  Tag nur die höchste Nummer, der Tag zählt ganz zum 19. Spieltag, der 18. verschwindet um 0 Uhr. Erst beheben, wenn es auftritt.

## Wie haben wir es eingerichtet?

2026-11-16 mit einem Assistenten (Skill `assistent-bauen`, einmalig im Scratchpad, nicht im Repo):

1. Konto über `https://www.football-data.org/client/register` angelegt, Token kam per E-Mail.
2. Token als `FOOTBALL_DATA_API_KEY` in `.env.local`.
3. Test: `GET https://api.football-data.org/v4/competitions/PL` mit Header `X-Auth-Token` → Status 200.
4. Bei Vercel unter Settings → Environment Variables für Production und Preview, „Sensitive“ an.

Den Schlüssel neu holen: auf der Registrierungsseite „Forgot your token? Resend it“.

## Befehle

```bash
# Schlüssel von Hand testen (Wert aus .env.local), erwartet 200
/usr/bin/curl -s -o /dev/null -w '%{http_code}\n' -H "X-Auth-Token: $FOOTBALL_DATA_API_KEY" 'https://api.football-data.org/v4/competitions/PL'
```
