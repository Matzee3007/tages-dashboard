---
titel: Lernjournal Phase 0 - Vision und CI
status: abgeschlossen
phase: 0
erstellt: 2026-10-25
tags: [lernjournal, phase-0, grill-with-docs, glossar, github-actions, ci, plan-schreiben, obsidian]
---

# Lernjournal Phase 0: Vision und CI

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 0 - Projektstart|Lernjournal Phase 0 - Projektstart]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Mit dieser Session ist **Phase 0 –
Fundament abgeschlossen**.

## Erledigt

- [x] Projektvision mit `/grill-with-docs` in vier Fragerunden (F1–F18) geschärft, PR #2: eine Kachel pro
      Wettbewerb mit Mein Team hervorgehoben, ganze Ligen, aktueller Spieltag statt „heute“, KI-News als eine
      Kachel mit einem Abschnitt pro Absender, Einstellungen im Code, alles gratis. Kein ADR, weil nichts davon
      schwer umkehrbar ist.
- [x] `docs/Glossar.md` angelegt: Kachel, Abschnitt, Wettbewerb, Mein Team, Spieltag, Absender, Meldung, Tagesziel.
- [x] Vault mit dem Agent `vault-pruefer` geprüft, Widersprüche in Vision, Glossar und Projekt-`CLAUDE.md`
      behoben (PR #2).
- [x] CI mit GitHub Actions nach [[projects/tages-dashboard/docs/plaene/2026-10-25-ci|Plan: CI mit GitHub Actions]],
      PR #4: erst rot mit Probedatei, dann grün, Lauf etwa 40 Sekunden. `plan-pruefer`: ERFÜLLT. Nach dem
      `/code-review` ergänzt: Zeitlimit, `concurrency`, nur Leserechte.
- [x] Fahrplan für die Phasen 1 bis 3 in der Projektvision, PR #5.

## Befehle: CI und PRs

```bash
npm run build                          # Produktionsfassung bauen, lief hier zum ersten Mal
gh pr checks 4 --watch --interval 10   # Checks eines PRs anzeigen und warten, bis sie fertig sind
gh run view <id> --log-failed          # nur die Log-Zeilen der fehlgeschlagenen Schritte
gh pr view <nr> --json mergeable       # vor dem Merge: erst bei MERGEABLE mergen
gh pr merge <nr> --merge --delete-branch   # PR übernehmen und den Branch auf GitHub löschen
```

- `npm run build`: Die CI baut die App. Deshalb musste der Build erst lokal laufen.
- `gh pr checks --watch`: zeigt, ob die CI am PR grün oder rot ist. GitHub Free hat bei privaten Repos keinen
  Branch-Schutz, deshalb vor jedem Merge selbst prüfen.
- `gh pr view --json mergeable`: Direkt nach einem Push meldet GitHub oft noch `UNKNOWN`, dann kurz warten.

## Neu gelernt

### Skills, die nur ich aufrufen kann

Steht in einer `SKILL.md` `disable-model-invocation: true`, kann Claude den Skill nicht selbst starten und sieht
ihn nicht in seiner Liste. So ist es bei `grill-with-docs`, `vault-pruefen`, `teach` und anderen. Ich starte sie
mit `/<name>`. Statt `/vault-pruefen` kann Claude den Agent `vault-pruefer` direkt nutzen.

### Befragung in Runden

`grill-with-docs` stellt alle Fragen, die gerade beantwortbar sind, als eine Runde mit Empfehlung. Antworten
können neue Fragen aufwerfen, z. B. „ganze Ligen“ (F3) führte zu „eine Kachel pro Wettbewerb“ (F7).
Begriffe kommen sofort ins Glossar, nicht erst am Ende.

### CI beweisen: erst rot, dann grün

Ein grünes Häkchen beweist nichts, solange die CI nie rot war. Deshalb zuerst eine absichtlich falsch formatierte
Datei, CI rot, Datei löschen, CI grün.

### CI absichern

- `timeout-minutes`: Ein hängender Lauf bricht nach 10 Minuten ab statt nach 6 Stunden.
- `concurrency` mit `cancel-in-progress`: Ein neuer Push bricht den alten Lauf ab und spart Freiminuten.
- `permissions: contents: read`: Der Token der CI darf nur lesen.

### Grobplan statt Pläne auf Vorrat

Für die Phasen 1–3 gibt es nur einen Fahrplan mit Schritten. Den genauen Plan schreibt `plan-schreiben` erst am
Start eines Schritts, weil frühere Phasen noch Neues zeigen.

## Fehler und Lösungen

### `[warn] app/ci-probe.ts` / `Code style issues found in the above file`

- **Wo:** erster CI-Lauf von PR #4, Schritt „Prüfungen“ (absichtlich)
- **Ursache:** Probedatei nicht nach Prettier formatiert
- **Lösung:** Datei gelöscht (im Alltag: `npm run format`)
- **Prüfen:** `gh pr checks 4` → `check pass`

### Widersprüche nach der Befragung

- **Wo:** Vault-Prüfung nach PR #2
- **Ursache:** Die Projekt-`CLAUDE.md` sagte noch „jeder Bereich eine Kachel mit eigener Datenquelle“, die Vision
  „keine bezahlten Datenquellen“ ohne „ohne ADR“, Glossar und Vision nutzten „Kanal“ unterschiedlich.
- **Lösung:** Texte angeglichen, Prinzip 6 in der `CLAUDE.md` ergänzt.
- **Prüfen:** `python3 ~/.claude/skills/vault-pruefen/scripts/pruefen.py --wurzel .` → `muss 0, sollte 0`

## Aus dem Chat

-

## Offene Fragen

- Welche Anmeldemethode für den Login (Magic Link oder Passwort)? Klärt die Befragung am Start von Phase 1.
- Antwortet ESPN vom Server aus? Klärt Phase 3, Schritt 4.

## Nächste Schritte

1. Phase 1 – Grundgerüst beginnt mit `/grill-with-docs` und Fahrplan-Schritt 1: online auf Vercel.
