---
titel: GitHub Actions - Einrichtung
status: aktiv
erstellt: 2026-10-25
tags: [tools, github, ci, einrichtung]
---

# GitHub Actions: Einrichtung im Tages-Dashboard

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. GitHub Actions sind automatische
Abläufe auf GitHub, beschrieben in YAML-Dateien unter `.github/workflows/`. Prüft so ein Ablauf jeden Push, nennt man
das **CI** (Continuous Integration). Begriffe, Befehle und Fehler stehen in der Werkzeug-Notiz des Ecosystems:
[[GitHub Actions]]. Hier steht nur, wie es in diesem Projekt eingerichtet ist.

## Was prüft die CI?

Workflow `.github/workflows/ci.yml`, Job `check`, bei jedem Pull Request und jedem Push auf `main`:

1. `actions/checkout@v7` holt das Repo, `actions/setup-node@v7` installiert Node 24 aus `engines` in `package.json`
   (wie lokal und später Vercel), mit npm-Cache.
2. `npm ci`: Abhängigkeiten genau nach `package-lock.json`.
3. `npm run check`: lint, format:check, typecheck, test.
4. `npm run build`: Produktionsfassung bauen.

Die CI benutzt nur die npm-Skripte aus `package.json`, lokal und in der CI läuft also dasselbe. Ein Lauf dauert
etwa 40 Sekunden. Dass `npm run build` die Typen ein zweites Mal prüft, ist Absicht: So bleibt `npm run check`
in CI und lokal gleich.

Schutz nach dem `/code-review` von PR #4:

- `timeout-minutes: 10`: Ein hängender Lauf bricht nach 10 Minuten ab, nicht erst nach 6 Stunden.
- `concurrency` mit `cancel-in-progress`: Ein neuer Push bricht den alten Lauf desselben Branches ab.
- `permissions: contents: read`: Der Token der CI darf nur lesen.

## Wie haben wir es eingerichtet?

1. **2026-10-25, Phase 0:** `ci.yml` mit PR #4 nach dem Muster von musik-app, Plan
   [[projects/tages-dashboard/docs/plaene/2026-10-25-ci|Plan: CI mit GitHub Actions]]. Zuerst mit einer absichtlich
   falsch formatierten Probedatei `app/ci-probe.ts`: Die CI wurde rot. Nach dem Löschen wurde sie grün. Damit ist
   belegt, dass sie Fehler findet. `npm ci` lief auf Linux mit der `package-lock.json` vom Mac ohne Probleme.

## Regeln

- **Vor jedem Merge `gh pr checks <nr>`: Die CI muss grün sein.** Das Repo ist privat und läuft mit GitHub Free.
  Dort gibt es keinen Branch-Schutz, GitHub verhindert einen Merge bei roter CI also nicht.
- Private Repos haben bei GitHub Free ein Kontingent an Freiminuten pro Monat (Stand: 2000 Minuten). Bei rund
  40 Sekunden pro Lauf reicht das weit.

## Befehle

```bash
gh pr checks <nr> --watch      # Checks eines PRs anzeigen und warten, bis sie fertig sind
gh run list                    # letzte Läufe aller Workflows
gh run view <id> --log-failed  # nur die Log-Zeilen der fehlgeschlagenen Schritte
```

## Fehler

**`[warn] app/ci-probe.ts` / `Code style issues found in the above file`, Exit-Code 1 im Schritt „Prüfungen“**
(2026-10-25, absichtlich):

- Ursache: Die Datei war nicht nach Prettier formatiert, `prettier . --check` in `npm run format:check` schlägt fehl.
- Lösung: lokal `npm run format`, dann committen.
