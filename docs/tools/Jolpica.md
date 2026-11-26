---
titel: Jolpica
status: aktiv
erstellt: 2026-11-27
tags: [tools, api, sport, formel-1]
---

# Jolpica

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-27-formel-1|Formel 1]].

## Was ist das?

Der Nachfolger der früheren Ergast-API für die Formel 1: Kalender mit allen Sessions, Ergebnisse von Qualifying und Rennen, WM-Wertung der
Fahrer und Teams. Gratis, ohne Schlüssel, im selben JSON-Format wie Ergast (`MRData`). Live-Daten während einer Session gibt es nicht.

## Wofür nutzen wir es?

Für die Kachel Formel 1 (`lib/kacheln/formel-1/`). OpenF1 (Live-Daten, 9,90 € im Monat) nutzen wir bewusst nicht: Während einer Session
steht nur „läuft“, berechnet aus Startzeit und Dauer.

## Abrufe

| Abruf | Adresse | Speicher |
|---|---|---|
| Kalender der Saison | `https://api.jolpi.ca/ergast/f1/current.json`, Sessions in `FirstPractice`, `SecondPractice`, `ThirdPractice`, `SprintQualifying`, `Sprint`, `Qualifying`, Rennen in `date`/`time` | 24 Std. |
| Qualifying | `…/f1/2026/22/qualifying.json` (leere Liste `Races: []`, bis es gefahren ist) | 15 Min. |
| Rennergebnis | `…/f1/2026/22/results.json` (ebenso leer bis nach dem Rennen) | 15 Min. |
| Fahrer- und Team-Wertung | `…/f1/current/driverStandings.json`, `…/current/constructorStandings.json` | 15 Min. |
| Nächste Saison | `…/f1/2027.json`, nur in der Winterpause | 24 Std. |

Alle mit `User-Agent: Tages-Dashboard`, 2 Sekunden Zeitlimit und Etikett `formel-1` für den Knopf ↻.

Zum Ausprobieren im Terminal:

```bash
/usr/bin/curl -s --compressed 'https://api.jolpi.ca/ergast/f1/current.json' | head -c 500
```

## Grenzen

- Laut eigener Doku von Jolpica 4 Abrufe pro Sekunde und 500 pro Stunde ohne Konto (Annahme, nicht nachgelesen). Bei 15 Minuten Speicher
  braucht die Kachel rund 20 Abrufe pro Stunde.
- Die Antwort sagt `cache-control: max-age=600`, Kopfzeilen zu Grenzen schickt Jolpica nicht (2026-11-25).

## Fehler

- **Leere Liste `{"MRData": {"RaceTable": {"Races": []}}}`** bei Qualifying oder Rennergebnis: **Ursache:** Die Session ist noch nicht
  gefahren oder Jolpica hat das Ergebnis noch nicht eingetragen. **Lösung:** Die Leser geben dann keine Zeilen zurück. Nach dem Rennen bleibt
  bis dahin die Startaufstellung stehen.
- **`Unerwartete Antwort von Jolpica`** im Server-Log: **Ursache:** Ein Feld fehlt, das die Kachel braucht (z. B. `MRData.RaceTable.Races`
  im Kalender). **Lösung:** Antwort im Terminal mit dem Befehl oben ansehen und den Leser in `lib/kacheln/formel-1/jolpica.ts` anpassen.
- **`Status 500 von …`** oder Zeitüberschreitung nach 2 Sekunden: **Ursache:** Jolpica ist gerade nicht erreichbar. **Lösung:** keine nötig.
  Fehlt der Kalender, zeigt die Kachel den letzten Stand mit Hinweis, fehlen Ergebnis oder Wertung, fehlt nur dieser Teil.

## Stand

- 2026-11-25: Vom Mac aus alle Abrufe Status 200 in 80–150 ms. Saison 2026 mit 23 Rennen, 6 davon mit Sprint. Kalender 2027 noch leer.
- 2026-11-26: Vom Server bei Vercel aus Status 200 (Versuch über eine Wegwerf-Route).
