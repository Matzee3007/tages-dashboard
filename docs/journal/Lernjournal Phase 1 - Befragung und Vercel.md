---
titel: Lernjournal Phase 1 - Befragung und Vercel
status: aktiv
phase: 1
erstellt: 2026-10-26
tags: [lernjournal, phase-1, grill-with-docs, plan-schreiben, assistent-bauen, vercel, artifact]
---

# Lernjournal Phase 1: Befragung und Vercel

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 0 - Vision und CI|Lernjournal Phase 0 - Vision und CI]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Start von **Phase 1 – Grundgerüst**, die
Session lief vom 2026-10-25 abends bis 2026-10-26.

## Erledigt

- [x] Entwurf, wie das fertige Dashboard aussehen könnte, als Claude Artifact
      ([Entwurf](https://claude.ai/artifact/VeWhiFgrVYtqnrivy3hFKt)): Ansichten Mac/iPad und iPhone, dunkel,
      Barlow und Barlow Condensed, Orange für Mein Team und Live. Alle Kacheln aus der Vision, die NFL-Kachel zeigt
      den Fehlerzustand. Beispieldaten und Platzhalter, nicht im Browser geprüft.
- [x] Tools für später auf Phase 1 geprüft: im Projekt leer, im Ecosystem passt der Cloudflare Security Audit Skill
      (vor dem Login im Netz, also Ende von Phase 1).
- [x] `/grill-with-docs Phase 1 Grundgerüst` in zwei Runden (F1–F12), alle Empfehlungen angenommen, PR #8:
      Passwort statt Magic Link, Vercel über die Git-Integration, Supabase nur online, `*.vercel.app`, Aussehen aus
      dem Entwurf, Testkachel mit Server-Uhrzeit, Schlüssel als Repository Variables, angemeldet bis „Abmelden“,
      Kurzname „Heute“, PWA auch auf dem Mac. Kein ADR, kein neuer Glossar-Begriff.
- [x] Fahrplan-Schritt 1 **online auf Vercel** nach
      [[projects/tages-dashboard/docs/plaene/2026-10-26-vercel|Plan: Online auf Vercel]], PR #9: Assistent-Skript
      geführt, Produktion https://tages-dashboard-iota.vercel.app antwortet mit 200, Vorschau von PR #9 ohne
      Anmeldung mit 302 auf den Vercel-Login, Merge-Commit `33858c0` von Vercel gebaut („Deployment has completed“).
- [x] Tool-Notiz `docs/tools/Vercel.md`, README mit Live-Adresse und repariertem Codeblock.
- [x] Plan abgeschlossen, Prüfbefehl auf den Commit-Status umgestellt (in diesem PR, weil nach dem Merge nichts direkt
      auf `main` darf).

## Befehle: Vercel prüfen

```bash
/usr/bin/curl -s -o /dev/null -w '%{http_code}\n' 'https://tages-dashboard-iota.vercel.app'
/usr/bin/curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' '<vorschau-adresse>'
gh pr view 9 --json comments --jq '.comments[].body' | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | sort -u
gh api "repos/Matzee3007/tages-dashboard/commits/$(git rev-parse HEAD)/status" --jq '.statuses[] | {context, state, description}'
gh pr checks 9 --watch --interval 10
```

- `curl -w '%{http_code}'`: zeigt nur den HTTP-Statuscode. 200 heißt „Seite da“, 302 heißt „Weiterleitung“.
  `%{redirect_url}` zeigt, wohin weitergeleitet wird, so sieht man den Vercel-Login.
- `gh pr view --json comments`: liest die Kommentare eines PRs, darunter den des Vercel-Bots mit der Vorschau-Adresse.
- `gh api …/commits/<sha>/status`: zeigt die Commit-Status, hier den von Vercel.
- `gh pr checks --watch`: wartet, bis alle Prüfungen eines PRs fertig sind (CI und Vercel).

## Befehle: Assistent

```bash
bash -n vercel-assistent.sh
bash /private/tmp/…/scratchpad/vercel-assistent.sh
```

- `bash -n`: prüft nur die Syntax eines Skripts, ohne es auszuführen.
- Der Assistent läuft im eigenen Terminal, weil er auf Eingaben wartet. Er lag im Scratchpad und kam nicht ins Repo.

## Neu gelernt

### PWA-Cookies auf dem iPhone

Eine Web-App, die per „Zum Home-Bildschirm“ abgelegt ist, hat eigene Cookies, getrennt von Safari. Ein Anmeldelink
aus einer Mail öffnet sich in Safari und meldet deshalb Safari an, nicht die App. Darum Passwort statt Magic Link.

### Deployment, Produktion, Vorschau

Ein Deployment ist eine gebaute Fassung der App mit eigener Adresse. Produktion ist das Deployment von `main` unter
der festen Adresse, eine Vorschau das eines PR-Branches. Deployment Protection mit „Standard Protection“ schützt alle
Vorschauen, die feste Produktionsadresse bleibt öffentlich.

### GitHub-App mit ausgewählten Repos

Fremde Dienste wie Vercel bekommen über eine GitHub-App Zugriff auf Repos. Mit „Only select repositories“ nur auf
die, die sie wirklich brauchen.

### Check-Run und Commit-Status

Zwei Arten, wie Dienste ihr Ergebnis an einen Commit hängen: GitHub Actions liefert einen Check-Run, Vercel einen
Commit-Status. `gh pr checks` zeigt beide, über die API muss man an zwei Stellen nachsehen.

### Mockup vor dem Code

Ein Entwurf klärt das Aussehen, bevor Code entsteht. Hier legt er Farben, Schriften und Kachelaufbau für das
Kachel-Gerüst (Schritt 4) fest.

## Fehler und Lösungen

### `specify only one of --comments or --json`

- **Wo:** Vorschau-Adresse aus dem PR lesen (`gh pr view 9 --comments --json …`)
- **Ursache:** Die beiden Schalter schließen sich aus.
- **Lösung:** `gh pr view 9 --json comments --jq '.comments[].body'`
- **Prüfen:** Der Befehl gibt die Vorschau-Adresse aus.

### `gh api …/deployments` liefert `null` bzw. `0`

- **Wo:** Plan Aufgabe 1, Schritt 2, und nach PR #9
- **Ursache:** Vercel legt in diesem Repo keine GitHub-Deployments an, es meldet sich nur als Commit-Status und
  per Bot-Kommentar.
- **Lösung:** Den Commit-Status abfragen (`…/commits/<sha>/status`).
- **Prüfen:** Ausgabe enthält `"context":"Vercel","state":"success"`.

### Leere Ausgabe bei `…/check-runs` für Vercel

- **Wo:** Plan Aufgabe 3, Schritt 2, nach dem Merge
- **Ursache:** Die Korrektur oben fragte Check-Runs ab, Vercel liefert aber einen Commit-Status.
- **Lösung:** `…/status` statt `…/check-runs`, in Plan und `docs/tools/Vercel.md` korrigiert.
- **Prüfen:** wie oben.

## Aus dem Chat

-

## Offene Fragen

- Bleibt die Vorschau im Browser mit Vercel-Anmeldung wirklich sichtbar? Nur per `curl` als geschützt belegt.

## Nächste Schritte

1. Plan für Fahrplan-Schritt 2 (Login mit Supabase) mit `plan-schreiben`, vorher die Gratis-Grenzen von Supabase
   (Pause nach 7 Tagen, Mailversand) frisch nachlesen.
2. Assistent für Supabase: Projekt anlegen, Registrierung aus, Nutzer anlegen, Schlüssel in `.env.local`, Vercel und
   GitHub Variables.
