---
titel: Dependabot - Einrichtung
status: aktiv
erstellt: 2026-11-03
tags: [tools, github, dependabot, einrichtung]
---

# Dependabot: Einrichtung im Tages-Dashboard

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Dependabot ist ein Dienst von GitHub, der
von selbst PRs öffnet, wenn ein Paket eine neue Version hat (**Versions-Updates**) oder eine bekannte Sicherheitslücke
(**Sicherheits-Updates**). Jeder dieser PRs läuft durch die CI
([[projects/tages-dashboard/docs/tools/GitHub Actions - Einrichtung|GitHub Actions]]).

## Wie haben wir es eingerichtet?

1. **2026-11-03, Phase 1:** `.github/dependabot.yml` nach dem Muster von musik-app:
   - `npm`: einmal pro Woche. Pakete, die nur zusammen gehen, kommen immer in einem PR, auch bei großen Updates:
     Gruppe `next` (`next`, `eslint-config-next`) und Gruppe `react` (`react`, `react-dom` und ihre Typen). Sonst
     kommen kleine Updates (minor, patch) gesammelt (Gruppe `npm-klein`), große (major) einzeln, weil sie oft Umbauten
     brauchen. Ein Paket landet in der ersten Gruppe, die passt.
   - Große Updates von `@types/node` ignoriert Dependabot: Die Typen sollen zu Node 24 passen, auf dem die App läuft.
   - `github-actions`: einmal pro Woche, alle Actions in einem PR (Gruppe `actions`).

Die Versions-Updates regelt die Datei. Die Warnungen und Sicherheits-Updates sind eine Einstellung des Repos
(GitHub → Settings → Code security).

## Typischer Ablauf

1. Dependabot öffnet einen PR, z. B. „Bump the npm-klein group with 4 updates“.
2. Die CI prüft ihn. Vercel baut eine Vorschau.
3. Grün: mergen. Rot: das Paket hat etwas geändert, mit `fehler-diagnose` eingrenzen.
   - Rot nur bei `format:check` nach einem Prettier-Update: Prettier formatiert jetzt anders. Im Branch
     `npm run format` ausführen, committen, pushen. Nicht den ganzen PR schließen, sonst gehen die anderen Updates
     der Gruppe mit verloren.

## Die 17 Meldungen von `npm audit`

Stand 2026-11-03: 17 mittlere Meldungen, mit `npm audit --omit=dev` (nur was die App ausliefert) 0.

- **Ursache:** Es ist eine einzige Lücke im Paket `minimatch` (GHSA-g3hv-75wg-m249). `eslint` und `eslint-config-next` ziehen
  es mit, die übrigen 16 Meldungen sind die Pakete dazwischen.
- **Risiko:** Der Linter läuft nur beim Entwickeln und in der CI und verarbeitet nur eigene Dateien. In der App auf Vercel
  steckt das Paket nicht.
- **Lösung:** Nicht `npm audit fix --force`. Das schlägt eine sehr alte Fassung von `eslint` vor (4.0.0) und würde den Linter
  zerlegen. Warten, bis `eslint` und `eslint-config-next` eine feste Fassung mitbringen, der PR kommt dann von Dependabot.

## Befehle

```bash
gh pr list --author 'app/dependabot'   # offene PRs von Dependabot
gh pr checks <nr>                      # CI-Ergebnis vor dem Merge
npm audit --omit=dev                   # Sicherheitsmeldungen nur für das, was die App ausliefert
gh api repos/Matzee3007/tages-dashboard/automated-security-fixes   # sind Sicherheits-Updates an?
```
