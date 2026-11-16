---
titel: Lernjournal Phase 3 - Premier League
status: aktiv
phase: 3
erstellt: 2026-11-16
tags: [lernjournal, phase-3, premier-league, football-data, espn, module-entwerfen, plan-schreiben, tdd, assistent-bauen, supabase, dependabot, tailwind]
---

# Lernjournal Phase 3: Premier League

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - KI-Zusammenfassungen|Lernjournal Phase 3 - KI-Zusammenfassungen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] Zusammenfassungen in Production auf dem iPhone geprüft, Plan der Zusammenfassungen abgeschlossen (PR #69)
- [x] PR #56 (Dependabot, 6 Updates) gemergt: neues `/code-review`, weil Dependabot den PR am 2026-11-15 neu gebaut hatte, dazu Login-Test
  in der Vorschau
- [x] „ungefragt“-Zeile zum Testsatz der Evaluation nachträglich bestätigt (PR #70)
- [x] Plätze der Linien für 2026/27 geprüft und mit Quellen in der Projektvision festgehalten (PR #71)
- [x] Konto und Schlüssel für football-data.org über einen Assistenten eingerichtet, Tool-Notiz mit Steckbrief (PR #72)
- [x] Entwurf der Module mit `module-entwerfen`, Plan mit `plan-schreiben`
  ([[projects/tages-dashboard/docs/plaene/2026-11-16-premier-league|Plan der Premier League]])
- [x] Kachel Premier League mit TDD, gemeinsames Modul `lib/kacheln/fussball/` (PR #73): `/code-review` mit 9 Funden, `plan-pruefer`
  ERFÜLLT, Abnahme in Vorschau und Production bestanden, Plan abgeschlossen (PR #74)
- [x] Fix fürs Abmelden, Tailwind-Regel ohne `as`, Test für `&amp;` in Links, Nachtrag in ADR 0007 (PR #75, `/code-review` mit 8 Funden)
- [ ] Spieltage, die Montag und Dienstag verschmelzen (Fund 2 aus PR #73): eigener PR
- [ ] Live-Test am Freitag, 2026-11-20

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Produkt | Linien zeigen die feste Grundverteilung (Bundesliga nach 4, 5, 6, 15, 16, Premier League nach 4, 5, 6, 17, Champions League nach 8 und 24), Verschiebungen durch Pokalsieger oder UEFA-Zusatzplatz am Saisonende von Hand | Plätze 5 und 6 hängen von Pokalsiegern ab, die erst am Saisonende feststehen | Entwickler |
| Technik | Ein Modul `lib/kacheln/fussball/` für alle Fußball-Kacheln mit zwei Nahtstellen (Spielplan, Tabelle) und je zwei Adaptern | Entwurf mit `module-entwerfen`, zwei echte Adapter je Nahtstelle | Entwickler |
| Technik | Modul heißt `fussball`, nicht `liga` | Glossar schließt „Liga“ als Sammelbegriff aus, die Champions League ist keine Liga | Entwickler |
| Produkt | Mein Team in der Premier League ist Arsenal (ESPN-id 359) | wie in der Champions League | Entwickler |
| Produkt | Deutsche Kurznamen der Premier League wie „Man City“, „Man United“, „Nottingham“; fehlt ein Team in der Liste, steht in der Tabelle der Kurzname von football-data.org | Nachtrag in [[projects/tages-dashboard/docs/adr/0011-pl-und-cl-von-espn-und-football-data\|ADR 0011]] | Entwickler |
| Prüfen | Kein Versuch vorab, ob football-data.org vom Server bei Vercel antwortet, erst die Abnahme in der Vorschau zeigt es | lokal belegt, Risiko klein | Entwickler |
| Technik | Spielplan ohne Etikett, Ausnahme von ADR 0008 | Nachtrag in [[projects/tages-dashboard/docs/adr/0008-knopf-aktualisieren-mit-revalidatetag\|ADR 0008]] | Entwickler |
| Technik | Ohne `FOOTBALL_DATA_API_KEY` kein Abruf, Kachel zeigt Titel ohne Nummer und keine Tabelle | Plan, Aufgetaucht | Entwickler |
| Bauen | Aufgabe 4 vor Aufgabe 3, damit `tabelle: null` nicht ungetestetes Verhalten in der Ansicht braucht | Abweichung im Plan vermerkt | Entwickler (nachträglich bestätigt) |
| Technik | Nahtstellen bekommen die ganze Einstellung (`ladeSpielplan(einstellung, tage, jetzt)`, `ladeTabelle(einstellung, frisch, jetzt)`) | ESPN-Tabelle braucht den Liga-Code, Bundesliga holt die Tabelle weiter gespeichert und bei laufender Partie frisch | Entwickler (nachträglich bestätigt) |
| Prüfen | Review PR #73: Fund 4, 7, 8 behoben, 1, 3, 5 als bekannte Grenzen, 2 als eigener PR, 6 und 9 offen (9 bei der Champions League) | Abwägung in der Session | Entwickler |
| Betrieb | Scheitert `signOut()` beim Server, meldet `abmelden` lokal ab (`scope: "local"`) | sonst bleibt man seit supabase-js 2.119 still angemeldet | Entwickler |
| Prüfen | Review PR #75: Fund 3 (doppeltes Warten bei hängendem Supabase) als Grenze, Fund 8 (drei Teile in einem PR) so gelassen | Übergabe hatte den gemeinsamen PR vorgesehen | Entwickler |

## Befehle: football-data.org

```bash
/usr/bin/curl -s -o /dev/null -w '%{http_code}\n' -H "X-Auth-Token: $FOOTBALL_DATA_API_KEY" 'https://api.football-data.org/v4/competitions/PL'
/usr/bin/curl -s -D - -o /dev/null -H "X-Auth-Token: $FOOTBALL_DATA_API_KEY" 'https://api.football-data.org/v4/competitions/PL/standings'
```

- Erster Befehl: testet den Schlüssel, erwartet `200`.
- Zweiter Befehl: zeigt die Header. `x-requests-available-minute` sagt, wie viele Abrufe in der laufenden Minute noch frei sind.

## Befehle: Umzug und Prüfung

```bash
git mv lib/kacheln/bundesliga/espn.ts lib/kacheln/liga/espn.ts
npx tsx --tsconfig tsconfig.json <skript>.mts
npx next build
until [ "$(gh pr view 73 --json mergeable --jq .mergeable)" != "UNKNOWN" ] && ! gh pr checks 73 | grep -q pending; do sleep 5; done
```

- `git mv`: verschiebt eine Datei so, dass Git die Umbenennung erkennt (im Diff `rename`).
- `npx tsx … .mts`: führt ein TypeScript-Skript aus, hier ein Rauchtest der Kachel gegen die echten Dienste. Endung `.mts`, damit
  `await` auf oberster Ebene erlaubt ist.
- `npx next build`: echter Build, um die Tailwind-Regel ohne `as` zu prüfen (Klassen stehen danach in `.next/static/chunks/*.css`).
- `until …`: wartet, bis die CI fertig und der PR mergebar ist, statt mit `sleep` zu raten.

## Neu gelernt

### Nahtstelle mit zwei Adaptern

An einer Nahtstelle lässt sich die Quelle austauschen, ohne dass der Aufrufer etwas merkt. `ladeFussball` fragt nur „Spielplan“ und
„Tabelle“, die Einstellung entscheidet, ob OpenLigaDB, ESPN oder football-data.org antwortet. Erst zwei echte Adapter zeigen, dass sich die
Nahtstelle lohnt.

### Probe statt blindem Grün

Ist ein Test sofort grün, weil der Code schon steht, zeigt eine Probe, ob er überhaupt rot werden kann: kurz einen Fehler in den Code
bauen, Test laufen lassen, Code zurücksetzen. So wurde jeder Test für Header, Fehlerfälle und den Schutz des Schlüssels geprüft.

### Charakterisierungstest

Ein Test, der beschreibt, wie sich vorhandener Code gerade verhält (hier: `&amp;` in Links nach node-html-parser 9.0.7). Er ist sofort grün
und soll spätere Änderungen sichtbar machen, nicht einen Fehler zeigen.

### Refresh-Token und lokales Abmelden

Das Access-Token verfällt nach etwa einer Stunde, mit dem Refresh-Token holt sich die App ein neues. Bei Supabase läuft das Refresh-Token
ohne eingestelltes Zeitlimit nicht ab. `scope: "local"` löscht nur die Sitzung auf dem Gerät, ein globales Abmelden beendet alle Sitzungen.

### Grundverteilung der Europapokal-Plätze

Vor der Saison steht nur fest, welcher Platz normalerweise wohin führt. Pokalsieger, die schon über die Liga qualifiziert sind, und
Zusatzplätze der UEFA-Wertung verschieben das erst am Saisonende.

### Force-Push bei Dependabot

Baut Dependabot einen PR neu, ersetzt es die alten Commits. Ein Review davor gilt dann für einen Stand, den es nicht mehr gibt.

## Fehler und Lösungen

### `sed: <liste aller Dateien>: No such file or directory`

- **Wo:** beim Umbenennen `liga` → `fussball` mit `sed -i '' … $files`
- **Ursache:** zsh teilt eine ungequotete Variable nicht an Zeilenumbrüchen auf, `sed` bekam die ganze Liste als einen Dateinamen.
- **Lösung:** die Liste über eine Pipe an `xargs` geben: `grep -rlE '…' app lib __tests__ | xargs sed -i '' …`
- **Prüfen:** `grep -rnE 'ladeLiga|"liga"' app lib __tests__` findet nichts mehr.

### `Top-level await is currently not supported with the "cjs" output format`

- **Wo:** Rauchtest der Premier League mit `npx tsx pl.ts`
- **Ursache:** tsx behandelte die Datei als CommonJS, dort ist `await` auf oberster Ebene nicht erlaubt.
- **Lösung:** Endung `.mts` (ES-Modul).
- **Prüfen:** Das Skript gibt „titel: 11. Spieltag“ und die Partien aus.

## Aus dem Chat

-

## Offene Fragen

- Stimmen die ESPN-ids der Aufsteiger Hull (306), Ipswich (373) und Coventry (388)? Abgeglichen nur an den beiden Tabellen, noch nicht an
  einer Partie dieser Teams gesehen.
- Was antwortet football-data.org bei erreichter Grenze? Vermutlich 429, nicht beobachtet.

## Nächste Schritte

1. Eigener PR: Spieltage trennen, wo die Nummer im Spielplan wechselt (Fund 2 aus PR #73), mit Nachtrag zur Regel „Wechsel des Spieltags“.
2. Live-Test am Freitag, 2026-11-20, ab 20:30 Uhr (Bundesliga), Samstag auch die Premier League.
3. PR 2 Champions League (Fund 9 aus PR #73 dort mitnehmen, Tagesgrenze ESPN erneut prüfen), danach PR 3 neues Aussehen.
