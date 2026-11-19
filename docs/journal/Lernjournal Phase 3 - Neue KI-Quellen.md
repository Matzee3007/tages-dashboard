---
titel: Lernjournal Phase 3 - Neue KI-Quellen
status: aktiv
phase: 3
erstellt: 2026-11-19
tags: [lernjournal, phase-3, ki-news, rss, fast-xml-parser, code-review, vercel]
---

# Lernjournal Phase 3: Neue KI-Quellen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 3 - Champions League und Aussehen|Lernjournal Phase 3 - Champions League und Aussehen]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] The Verge aus den KI-News entfernt, weil seine Artikel hinter einer Bezahlschranke liegen.
- [x] Sechs neue Absender in `lib/einstellungen.ts`: t3n, Ars Technica, Simon Willison, Hugging Face, Import AI, Latent Space,
  jeder mit eigener Farbe.
- [x] Jeden neuen Feed abgerufen und mit `leseFeed` des Projekts ausgewertet: alle lesbar, jeder mit Meldungen der letzten
  7 Tage (Import AI 1, die anderen 8 bis 20).
- [x] Projektvision: Tabelle der Absender und Entscheidung vom 2026-11-19 ergänzt.
- [x] `/code-review low 90`: kein Fehler im Code, ein Widerspruch in der Projektvision (alter Satz zu Ars Technica),
  behoben im zweiten Commit.
- [x] PR #90 gemergt, auf Vercel live, vom Entwickler im Dashboard geprüft („hat geklappt“).

## Entscheidungen

| Art | Entscheidung | Warum | Wer |
|---|---|---|---|
| Produkt | The Verge fällt weg | Artikel kostenpflichtig, also nicht lesbar | Entwickler |
| Produkt | Neu: Ars Technica, Simon Willison, Hugging Face, Import AI, t3n, Latent Space | Auswahl aus den erreichbaren, freien Kandidaten | Entwickler |
| Produkt | t3n und Latent Space trotz teilweise kostenpflichtiger Beiträge | Entwickler hat sie mit diesem Hinweis gewählt | Entwickler |
| Produkt | Bei Simon Willison nur der KI-Feed `tags/ai.atom` statt des Gesamt-Feeds | Gesamt-Feed hat auch Themen ohne KI (z. B. „PostgreSQL 19 Released“) | Entwickler |
| Design | Farben der neuen Absender: t3n `#6FB38F`, Ars Technica `#E07B4F`, Simon Willison `#B79A6B`, Hugging Face `#F2C14E`, Import AI `#A68FC9`, Latent Space `#C98BA6` | gedeckte Töne wie die bestehenden, keine Farbe doppelt | Entwickler |
| Design | Neue Absender stehen an der Stelle von The Verge, vor Hacker News | Reihenfolge der übrigen bleibt unverändert | Entwickler |
| Prüfen | Review-Stufe `low` für PR #90 | nur Konfigurationsdaten geändert | Entwickler |

## Befehle: Feeds prüfen

```bash
/usr/bin/curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -L --max-time 10 -A 'Mozilla/5.0' '<feed-url>'
/usr/bin/curl -s -L --compressed --max-time 15 -A 'Mozilla/5.0' -o f1.xml '<feed-url>'
npx --no-install tsx <scratchpad>/skripte/pruefe.ts <scratchpad>/feeds/f*.xml
```

- `curl … -w '%{http_code} …'`: zeigt nur Statuscode und Inhaltstyp, um schnell zu sehen, ob ein Feed erreichbar ist.
- `curl … -o f1.xml`: lädt den Feed in eine Datei im Scratchpad, damit ein Skript ihn auswerten kann.
- `npx --no-install tsx pruefe.ts`: führt ein kleines TypeScript-Skript aus, das `leseFeed` aus dem Projekt aufruft und zählt,
  wie viele Meldungen der letzten 7 Tage es gibt. So ist geprüft, dass die Kachel den Feed wirklich versteht.

## Befehle: PR abschließen

```bash
gh pr checks 90 --watch --interval 15
gh pr merge 90 --merge --delete-branch
```

- `gh pr checks --watch`: wartet, bis alle Prüfungen des PRs (GitHub Actions, Vercel) fertig sind.
- `gh pr merge --delete-branch`: übernimmt den PR in `main` und löscht den Branch auf GitHub.

## Neu gelernt

### Feeds vor dem Eintragen mit dem eigenen Leser prüfen

Ein Statuscode 200 heißt nur, dass etwas zurückkommt. Erst `leseFeed` zeigt, ob das Projekt die Meldungen versteht und ob sie
neu genug für die 7-Tage-Regel sind. Bei Import AI erscheint nur eine Ausgabe pro Woche, dort steht oft nur 1 Meldung.

### Nicht jeder Anbieter lässt Abrufe zu

TechCrunch antwortet auf Abrufe mit 403 (verboten). heise und golem haben unter den getesteten Adressen keinen Feed nur zum
Thema KI (404).

## Fehler und Lösungen

### `Test Files  2 failed | 38 passed (40)`

- **Wo:** erster Lauf von `bash checks.sh` auf dem Branch `feature/mehr-ki-quellen`, einer der Fehlschläge betraf einen Test zu
  `leseArtikel`.
- **Ursache:** nicht untersucht. Zwei weitere Läufe mit derselben Änderung und ein Lauf ohne sie waren grün (364 Tests), es
  sieht nach wackeligen Tests unter Last aus.
- **Lösung:** keine, `checks.sh` erneut laufen lassen.
- **Prüfen:** `bash checks.sh` mehrmals laufen lassen und auf Fehlschläge achten.

## Aus dem Chat

-

## Offene Fragen

- Bleibt die KI-News-Kachel auf Vercel mit 14 Absendern unter ihren 8 Sekunden? Der Feed von Hugging Face ist rund 270 KB groß.
- Wie viel länger dauert der Durchlauf der Zusammenfassungen auf dem Mac mit den neuen Quellen?
- Welche Tests sind wackelig, und warum?

## Nächste Schritte

1. Abnahme der Spielberichte am Freitag 2026-11-20 nach der ersten Bundesliga-Partie.
2. Wackelige Tests mit `/fehler-diagnose` eingrenzen.
3. Dependabot-PRs #87 bis #89 prüfen.
