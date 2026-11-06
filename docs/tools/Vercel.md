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

### Über die REST-API (ab 2026-11-06)

Für Logs und den Stand von Deployments ohne Klicken. Nötig ist `VERCEL_TOKEN` in `.env.local`: auf
https://vercel.com/account/tokens angelegt, Scope nur das Projekt `tages-dashboard`, mit Ablaufdatum. Das Token nie in den
Chat oder ins Repo, sondern über einen Assistenten (Skill `assistent-bauen`) eintragen. Zurückziehen: dort **Delete**.

```bash
# Token in die Umgebung laden, ohne es anzuzeigen
set -a; source .env.local; set +a

# Neuestes Deployment: Zustand, ID, Commit. Antwort in eine Datei, echo in zsh zerstört \n im JSON.
# $TMPDIR statt Repo-Ordner, damit Logs nicht versehentlich mitcommittet werden.
/usr/bin/curl -s -o "$TMPDIR/dep.json" -H "Authorization: Bearer $VERCEL_TOKEN" \
  'https://api.vercel.com/v6/deployments?projectId=prj_QWERcypvPrphhPec8RQ40XIRpypr&limit=1'

# Runtime-Logs eines Deployments mitschreiben (Strom, bricht nach 5 Minuten ab)
/usr/bin/curl -s -N --max-time 300 -H "Authorization: Bearer $VERCEL_TOKEN" -o "$TMPDIR/logs.jsonl" \
  'https://api.vercel.com/v1/projects/prj_QWERcypvPrphhPec8RQ40XIRpypr/deployments/<dpl_…>/runtime-logs'
```

Die Logs liefern Meldung, Pfad, Status und Zeit, **keine Dauer** einer Anfrage. Für Messungen eine markierte Log-Zeile
(`[DEBUG-…]`) vorübergehend einbauen und danach entfernen.

## Messungen

- **Zwischenspeicher der Feeds (2026-11-06, PR #37):** Auf der Vorschau kamen alle 13 Feeds aus dem Speicher von
  `fetch` mit `next.revalidate`, die Antworten waren 66 bis 682 s alt, auch der OpenAI-Feed mit 825 KB. Eine Abfrage
  gemessen, `ladeKiNews` brauchte samt Lesen des XML 563 ms. Kein Anbieter sperrt die Server von Vercel.
- **Observability → External APIs** gibt es im Gratis-Tarif nicht.

## Fehler

- **`gh api …/deployments` ist leer (`null` bzw. Länge `0`):** Ursache: Vercel meldet sich in diesem Repo nur als
  Commit-Status (`Vercel`) und per Bot-Kommentar, nicht als GitHub-Deployment, auch nicht nach Pushes (geprüft an
  PR #9). Lösung: den Status am Commit abfragen (Befehl oben).
- **`…/check-runs` zeigt keinen Vercel-Eintrag:** Ursache: Vercel liefert einen Commit-Status, keinen Check-Run
  (nur die CI ist ein Check-Run). Lösung: `…/commits/<sha>/status`.
- **`gh pr view <nr> --comments --json …` → „specify only one of --comments or --json“:** Ursache: Die beiden
  Schalter schließen sich aus. Lösung: `--json comments` mit `--jq '.comments[].body'`.
- **Vorschau zeigt nur „Internal Server Error“, die Live-Seite läuft (2026-11-06, PR #37):** Ursache: Die Variablen
  `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` galten nur für Production. Ohne sie wirft
  `proxy.ts` bei jeder Anfrage „Your project's URL and Key are required to create a Supabase client!“. Aufgefallen erst jetzt,
  weil bis dahin keine Vorschau mit Login geöffnet wurde. Nachgestellt mit leeren Variablen:
  `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npx next build && … npx next start`. Lösung: Unter Settings →
  Environment Variables **Preview** dazunehmen, dann das Deployment mit **Redeploy** neu bauen. `NEXT_PUBLIC_…` steht schon nach
  dem Bauen fest im Code, ein neuer Build ist nötig.
