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
   - `npm`: einmal pro Woche. Pakete, die nur zusammen gehen, kommen bei Versions-Updates in einem PR, auch bei großen
     Updates: Gruppe `next` (`next`, `eslint-config-next`) und Gruppe `react` (`react`, `react-dom` und ihre Typen). Sonst
     kommen kleine Updates (minor, patch) gesammelt (Gruppe `npm-klein`), große (major) einzeln, weil sie oft Umbauten
     brauchen.
   - `npm-klein` schließt die Familien ausdrücklich aus: In musik-app landete React trotz eigener Gruppe im Sammel-PR
     (dort #57 und #62). Im ersten Lauf hier kam React als eigener PR (#21). Bewiesen ist das noch nicht, denn einen
     Sammel-PR gab es dabei nicht.
   - Große Updates von `@types/node` ignoriert Dependabot: Die Typen sollen zu Node 24 passen, auf dem die App läuft.
   - Große Updates von `typescript` ebenso: `typescript-eslint` verlangt eine Fassung unter 6.1, ein PR auf TypeScript 7
     könnte nicht grün werden (musik-app #59). Prüfen, sobald `typescript-eslint` mehr erlaubt.
   - Große Updates von `eslint` ebenso: `eslint-plugin-react`, `-import` und `-jsx-a11y` erlauben nur ESLint bis 9. Der PR
     auf ESLint 10 (#22) war trotzdem grün, wir haben ihn geschlossen. Prüfen, sobald die Plugins mehr erlauben: Von selbst
     meldet sich niemand, weil die Regel genau diese PRs abschaltet. Verlangt `eslint-config-next` einmal ESLint 10, kann
     die Regel auch den PR der Gruppe `next` blockieren.
   - `cooldown`: Neue Versionen kommen erst nach 7 Tagen, weil manipulierte Fassungen oft in den ersten Tagen auffallen.
   - `github-actions`: einmal pro Woche, alle Actions in einem PR (Gruppe `actions`).

Die Versions-Updates regelt die Datei. Die Warnungen und Sicherheits-Updates sind eine Einstellung des Repos
(GitHub → Settings → Code security), eingeschaltet am 2026-11-03 nach dem Merge der Datei, siehe Befehle.

Für Sicherheits-Updates gelten Gruppen und `cooldown` nicht: Sie kommen sofort und ohne Gruppe. Bei einer Lücke in `next`
steigt `eslint-config-next` also erst mit dem nächsten Wochenlauf nach. Die `ignore`-Regeln gelten dort vermutlich schon: Liegt
der Fix für eine Lücke nur in einer ignorierten großen Version, bleibt der PR wohl aus. Die Doku von GitHub ist hier nicht eindeutig.

## Typischer Ablauf

1. Dependabot öffnet einen PR, z. B. „Bump the npm-klein group with 4 updates“.
2. Die CI prüft ihn. Vercel baut eine Vorschau.
3. Grün: `/code-review`, denn auch dieser PR ändert Abhängigkeiten. Danach mergen. Die Tests laufen nicht in einem echten
   Browser, bei Updates von `next` oder Supabase deshalb zusätzlich den Login in der Vorschau ansehen.
4. Rot: das Paket hat etwas geändert, mit `fehler-diagnose` eingrenzen.
   - Rot nur bei `format:check` nach einem Prettier-Update: Prettier formatiert jetzt anders. Mit `gh pr checkout <nr>` den
     Branch holen, `npm run format` ausführen, committen, pushen. Nicht den ganzen PR schließen, sonst gehen die anderen
     Updates der Gruppe mit verloren.
   - Eigene Commits auf einem Dependabot-Branch gehen verloren, wenn Dependabot den PR neu erstellt. Einen angefassten PR
     deshalb zügig mergen.

## Die 17 Meldungen von `npm audit`

Stand 2026-11-03: 17 mittlere Meldungen, mit `npm audit --omit=dev` (nur was die App ausliefert) 0.

- **Ursache:** Es ist eine einzige Lücke im Paket `minimatch` unter 11.0.1 (GHSA-g3hv-75wg-m249). `eslint` und
  `eslint-config-next` ziehen es mit, die übrigen 16 Meldungen sind die Pakete dazwischen.
- **Risiko:** Der Linter läuft nur beim Entwickeln und in der CI und verarbeitet nur eigene Dateien. In der App auf Vercel
  steckt das Paket nicht.
- **Entscheidung:** Risiko bewusst akzeptiert. Eine Lösung ist nicht in Sicht: Auch die neuesten Fassungen von `eslint` und
  seinen Plugins nutzen ein älteres `minimatch`, und `minimatch` steht nicht in unserer `package.json`.
- **Nicht `npm audit fix --force`:** Das schlägt eine sehr alte Fassung von `eslint` vor (4.0.0) und würde den Linter
  zerlegen.
- **Warnung auf GitHub:** Warnung #1 kam nach dem Einschalten, am 2026-11-03 als `tolerable_risk` geschlossen. Erneut nachsehen,
  sobald `eslint` und alle Plugins `minimatch` ab 11.0.1 nutzen. ESLint 10 allein reicht nicht, es nutzt `^10.2.6`.

## Fehler

**`security_update_not_possible`, Lauf „npm_and_yarn in /. for minimatch“ endet rot** (2026-11-03):

- Ursache: `eslint` und seine Plugins legen `minimatch` unter 11 fest, Dependabot kann die Fassung ohne Fix also nicht anheben.
- Lösung: Keine möglich, solange die Pakete darüber das nicht erlauben. Risiko geprüft und Warnung geschlossen (siehe oben).

## Befehle

```bash
gh pr list --author 'app/dependabot'   # offene PRs von Dependabot
gh pr checkout <nr>                    # Branch eines PRs lokal holen
gh pr checks <nr>                      # CI-Ergebnis vor dem Merge
npm audit --omit=dev                   # Sicherheitsmeldungen nur für das, was die App ausliefert

gh api -X PUT repos/Matzee3007/tages-dashboard/vulnerability-alerts       # Warnungen einschalten
gh api -X PUT repos/Matzee3007/tages-dashboard/automated-security-fixes   # Sicherheits-Updates einschalten
gh api repos/Matzee3007/tages-dashboard/vulnerability-alerts              # Warnungen an? Antwort 204 = an, 404 = aus
gh api repos/Matzee3007/tages-dashboard/automated-security-fixes          # Sicherheits-Updates an?
```
