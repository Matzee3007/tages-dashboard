---
titel: Lernjournal Phase 1 - Login mit Supabase
status: abgeschlossen
phase: 1
erstellt: 2026-11-01
tags: [lernjournal, phase-1, supabase, login, proxy, tdd, code-review, assistent-bauen]
---

# Lernjournal Phase 1: Login mit Supabase

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Befragung und Vercel|Lernjournal Phase 1 - Befragung und Vercel]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Fahrplan-Schritt 2 von **Phase 1 – Grundgerüst**.

## Erledigt

- [x] Gratis-Grenzen von Supabase frisch nachgelesen, Mailversand und Pause in der Projektvision berichtigt
- [x] Plan geschrieben: [[projects/tages-dashboard/docs/plaene/2026-11-01-login|Plan: Login mit Supabase]]
- [x] Aufgaben 1 bis 4 testgetrieben umgesetzt, erstmals mit `/goal`: Supabase-Client, `proxy.ts`, Anmeldeseite, Abmelden
- [x] Supabase-Projekt und Nutzer mit einem Assistenten eingerichtet, Variablen in `.env.local` und bei Vercel
- [x] `/code-review` und `plan-pruefer` für PR #12, Funde gemeinsam durchgegangen
- [x] Aus dem Review: Nutzer-Check mit `BESITZER_ID`, Matcher genau begrenzt, ADR 0002 berichtigt
- [x] PR #12 gemergt, PR #13 mit Abschluss von Plan und Fahrplan-Schritt 2 gemergt
- [x] An- und Abmelden lokal und auf der Live-Seite von Hand bestätigt
- [ ] iPhone und iPad: kommt mit Fahrplan-Schritt 3

## Befehle: Supabase

```bash
npm install --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.118.0
/usr/bin/curl -s -H "apikey: <publishable-key>" 'https://<ref>.supabase.co/auth/v1/settings'
```

- `npm install --save-exact …`: installiert die Pakete und trägt die genaue Version ohne `^` ein.
- `curl … /auth/v1/settings`: fragt die öffentlichen Einstellungen ab. Damit ließ sich prüfen, ob die Registrierung
  wirklich aus ist (`disable_signup`), statt der Oberfläche zu glauben.

## Befehle: Prüfen

```bash
npx vitest run __tests__/proxy.test.ts
npm run build
npx next start -p 3457
gh run list --commit <sha> --workflow CI --json status,conclusion
gh run watch <id> --exit-status
```

- `npx vitest run <datei>`: lässt nur einen Test laufen, für die Rot-Grün-Schleife.
- `npm run build`, `npx next start`: bauen die Produktionsfassung und starten sie lokal. Hier zeigte das, dass die Seite
  ohne Schlüssel mit Fehler 500 zu bleibt und der Matcher auch am echten Server wirkt.
- `gh run list --commit`, `gh run watch`: suchen den CI-Lauf eines bestimmten Commits und warten auf sein Ergebnis.

## Neu gelernt

### Proxy

`proxy.ts` läuft vor jeder Anfrage, in Next.js 16 heißt so, was früher `middleware.ts` war. Er kann weiterleiten, bevor
eine Seite entsteht. Der `matcher` legt fest, für welche Pfade er läuft: Wir lassen nur Statisches aus, damit jede neue Seite
von selbst geschützt ist. Ein Ausschluss im Muster wirkt nur auf den Pfadanfang, ohne Ende-Anker rutscht auch
`/favicon.icon` durch.

### Server Action

Eine Funktion, die ein Formular auf dem Server auslöst. Technisch ist sie ein POST an eine Seite. Der Proxy schützt also
Adressen, nicht Actions: Über das öffentliche `/login` wäre eine private Action erreichbar. Sie muss die Anmeldung deshalb
selbst prüfen ([[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]]).

### Authentifizierung und Autorisierung

Das erste klärt, ob jemand ein gültiges Konto hat, das zweite, ob dieses Konto hinein darf. Ein gültiges Token allein
reicht nicht: Steht die Registrierung offen, kann jeder eins bekommen. Deshalb vergleicht der Proxy die Nutzer-ID mit
`BESITZER_ID`.

### `HttpOnly`-Cookie und `getClaims()`

Ein `HttpOnly`-Cookie kann JavaScript im Browser nicht lesen. Das geht, weil nur der Server mit Supabase spricht.
`getClaims()` prüft die Signatur des Tokens, `getSession()` liest es ungeprüft und taugt auf dem Server nicht zum Schutz.

### Publishable Key

Der öffentliche Schlüssel von Supabase sagt nur, zu welchem Projekt eine Anfrage gehört. Er schützt nichts. Den Schutz
liefern die Einstellungen im Projekt und die Prüfung im Code.

### Tests beweisen die eigene Logik

Die Tests ersetzen Supabase durch eine Attrappe. Deshalb brauchte es zusätzlich den Handtest gegen das echte Projekt und
die Abfrage von Supabase selbst: So bestätigte sich der Fehlercode `invalid_credentials`, auf dem die Meldung beruht.

### Getrennte Prüfer finden Verschiedenes

Der `plan-pruefer` vergleicht mit dem Plan, das `/code-review` sucht Fehler. Den zu weiten Matcher fanden beide, den
fehlenden Nutzer-Check und das falsche Versprechen im ADR nur das Review.

## Fehler und Lösungen

### `disable_signup: False`

- **Wo:** nach dem Assistenten, bei der Abfrage von `/auth/v1/settings`
- **Ursache:** Der Schalter „Allow new users to sign up“ stand noch an. Warum, ist nicht ermittelt, die Stelle im Dashboard
  war schwer zu finden.
- **Lösung:** von Hand über den Direktlink ausschalten und speichern. Seitdem ist er nicht mehr der einzige Schutz
  (`BESITZER_ID`).
- **Prüfen:** Dieselbe Abfrage liefert `disable_signup: True`.

### Alte Ergebnisse von `gh pr checks`, `mergeable` meldet `UNKNOWN`

- **Wo:** direkt nach dem Push des letzten Commits von PR #12
- **Ursache:** GitHub hatte den neuen Commit noch nicht verarbeitet. `gh pr checks --watch` zeigte den Lauf des vorigen
  Commits als grün.
- **Lösung:** auf den CI-Lauf genau dieses Commits warten (`gh run list --commit <sha>`), erst dann mergen.
- **Prüfen:** `headSha` des Laufs ist der lokale Commit, `conclusion` ist `success`.

### Commit blieb aus, `Exit code 1`

- **Wo:** Aufgabe 1, Prüfung mit `RC=${PIPESTATUS[0]}` vor dem Commit
- **Ursache:** Die Shell ist zsh, dort heißt die Variable `pipestatus`. `RC` blieb leer, die Bedingung schlug fehl, obwohl
  die Prüfung grün war.
- **Lösung:** Ausgabe gelesen, von Hand committet.
- **Prüfen:** `git log --oneline -1` zeigt den Commit.

## Aus dem Chat

-

## Offene Fragen

- Pausiert Supabase das Projekt trotz täglicher Anmeldung? Die Doku sagt nicht, ob Logins als Aktivität zählen.
- Hält die Anmeldung in der installierten App auf iPhone und iPad?
- Stören die geleerten Felder nach falschem Passwort auf dem iPhone?
- Waren die 17 mittleren Meldungen von `npm audit` schon vor den Supabase-Paketen da? Mit `--omit=dev` sind es 0.

## Nächste Schritte

1. Fahrplan-Schritt 3: PWA
2. Ab 2026-11-08 im Supabase-Dashboard nachsehen, ob das Projekt pausiert hat
3. CI-Falle beheben und Dependabot einrichten
