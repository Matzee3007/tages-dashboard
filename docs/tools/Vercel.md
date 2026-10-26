---
titel: Vercel
status: aktiv
erstellt: 2026-10-26
tags: [tools, vercel, deployment]
---

# Vercel

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Gehört zu
[[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Was ist das?

Ein Dienst, der Websites ins Internet bringt. Vercel ist der Hersteller von Next.js und baut eine Next.js-App ohne
weitere Einstellungen. Über die **Git-Integration** schaut Vercel auf das GitHub-Repo und baut bei jedem Push neu.

## Wofür nutzen wir es?

Das Tages-Dashboard läuft unter **https://tages-dashboard-iota.vercel.app**, im kostenlosen Tarif Hobby. Jeder
Merge auf `main` geht live, jeder PR bekommt eine eigene Vorschau.

## Begriffe

- **Deployment:** eine gebaute Fassung der App, die Vercel ins Netz stellt. Jedes hat eine eigene Adresse.
- **Produktion (Production):** das Deployment vom Produktions-Branch `main`, erreichbar unter der festen Adresse.
- **Vorschau (Preview):** das Deployment eines anderen Branches, z. B. eines PRs. Der Vercel-Bot schreibt die
  Adresse als Kommentar in den PR.
- **Deployment Protection:** Schutz der Adressen. „Vercel Authentication“ leitet Besucher ohne Vercel-Anmeldung auf
  den Vercel-Login um. Der Umfang **Standard Protection** schützt alle Vorschauen und die Einzeladressen der
  Produktions-Deployments, aber nicht die feste Produktionsadresse.
- **Umgebungsvariablen:** Werte wie Schlüssel, die Vercel beim Bauen und Ausführen bereitstellt (ab Phase 1,
  Schritt 2: Supabase).

## Wie haben wir es eingerichtet?

1. **2026-10-26, Phase 1, Schritt 1** nach [[projects/tages-dashboard/docs/plaene/2026-10-26-vercel|Plan: Online
   auf Vercel]], mit einem Assistent-Skript (Skill `assistent-bauen`) im Vercel-Dashboard, ohne Vercel-CLI:
   - GitHub → Settings → Applications → Vercel → Configure: „Only select repositories“, nur `tages-dashboard`.
   - `https://vercel.com/new` → Import `tages-dashboard`, Framework Next.js erkannt, keine Umgebungsvariablen.
     Node 24 kommt aus `engines` in `package.json`.
   - Settings → Deployment Protection: Vercel Authentication an, Standard Protection.
   - Produktions-Branch `main`.

## Typischer Ablauf

1. Branch pushen, PR öffnen: Vercel baut eine Vorschau, im PR erscheinen der Check `Vercel` und ein Bot-Kommentar
   mit der Adresse.
2. Vorschau im Browser ansehen (mit Vercel-Anmeldung).
3. PR mergen: Vercel baut `main` und stellt es unter der Produktionsadresse live.

## Befehle

```bash
# Antwortet die Produktion? (erwartet 200)
/usr/bin/curl -s -o /dev/null -w '%{http_code}\n' 'https://tages-dashboard-iota.vercel.app'

# Vorschau-Adresse aus dem Kommentar des Vercel-Bots
gh pr view <nr> --json comments --jq '.comments[].body' | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | sort -u

# Ist eine Vorschau geschützt? (erwartet 302 auf vercel.com/sso-api, nicht 200)
/usr/bin/curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' '<vorschau-adresse>'

# Hat Vercel den aktuellen Commit auf main gebaut?
gh api "repos/Matzee3007/tages-dashboard/commits/$(git rev-parse HEAD)/status" \
  --jq '.statuses[] | {context, state, description}'

# Checks eines PRs, darunter Vercel
gh pr checks <nr>
```

## Fehler

- **`gh api …/deployments` ist leer (`null` bzw. Länge `0`):** Ursache: Vercel meldet sich in diesem Repo nur als
  Commit-Status (`Vercel`) und per Bot-Kommentar, nicht als GitHub-Deployment, auch nicht nach Pushes (geprüft an
  PR #9). Lösung: den Status am Commit abfragen (Befehl oben).
- **`…/check-runs` zeigt keinen Vercel-Eintrag:** Ursache: Vercel liefert einen Commit-Status, keinen Check-Run
  (nur die CI ist ein Check-Run). Lösung: `…/commits/<sha>/status`.
- **`gh pr view <nr> --comments --json …` → „specify only one of --comments or --json“:** Ursache: Die beiden
  Schalter schließen sich aus. Lösung: `--json comments` mit `--jq '.comments[].body'`.
