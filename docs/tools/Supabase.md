---
titel: Supabase
status: aktiv
erstellt: 2026-11-01
tags: [tools, supabase, login]
---

# Supabase

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Gehört zu
[[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Was ist das?

Ein Dienst, der eine Postgres-Datenbank und eine fertige Anmeldung (Auth) bereitstellt. Man verwaltet beides im
Supabase-Dashboard im Browser.

## Wofür nutzen wir es?

Für den Login des einzigen Kontos und die Tabelle `zusammenfassungen` der KI-News
([[projects/tages-dashboard/docs/adr/0010-zusammenfassungen-vom-mac|ADR 0010]]), ab Phase 4 auch für die Schritte. Warum die Anmeldung nur auf dem
Server läuft: [[projects/tages-dashboard/docs/adr/0002-login-nur-auf-dem-server|ADR 0002]].

## Begriffe

- **Publishable Key:** öffentlicher Schlüssel (`sb_publishable_…`), er sagt nur, zu welchem Projekt eine Anfrage gehört.
  Der **Secret Key** (`sb_secret_…`) umgeht alle Regeln, die App braucht ihn nicht.
- **Access Token:** kurzlebiger Ausweis der Sitzung im Cookie, signiert von Supabase.
- **Refresh Token:** holt einen neuen Access Token. Er läuft nicht ab, gilt aber nur einmal. Erneuern deshalb nur an
  einer Stelle (`proxy.ts`), sonst drohen zufällige Abmeldungen.
- **`getClaims()`:** prüft die Signatur des Access Tokens und erneuert ihn bei Bedarf. Damit schützen wir Seiten.
- **`getSession()`:** liest die Sitzung ungeprüft aus dem Cookie, das ist fälschbar. Auf dem Server nie zum Schutz benutzen.

## Grenzen im Tarif Free

Nachgelesen am 2026-11-01 ([Pricing](https://supabase.com/pricing),
[Rate Limits](https://supabase.com/docs/guides/auth/rate-limits),
[Sessions](https://supabase.com/docs/guides/auth/sessions),
[Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)):

- 2 aktive Projekte, 50.000 Nutzer im Monat, 500 MB Datenbank, 5 GB Datenverkehr
- 2 Mails pro Stunde im ganzen Projekt, trifft uns nicht (kein Mailversand)
- 150 Anfragen an `/auth/v1/token` in 5 Minuten je IP-Adresse, darüber Fehler 429
- Sitzungen laufen nicht von selbst ab, zeitliche Grenzen gibt es erst im Tarif Pro
- **Pause** nach 1 Woche mit zu wenig Datenbank-Aktivität. Die Doku sagt nicht, ob Logins zählen. Im Zustand „pausiert“
  sollte die App „Anmeldung gerade nicht möglich.“ zeigen (nicht ausprobiert), dann im Dashboard „Resume project“.
  Am 2026-11-15 zeigte `supabase projects list` das Projekt als `ACTIVE_HEALTHY`, es war also nicht pausiert.

## Wie haben wir es eingerichtet?

**2026-11-01, Phase 1, Schritt 2** nach [[projects/tages-dashboard/docs/plaene/2026-11-01-login|Plan: Login mit
Supabase]], mit einem Assistent-Skript (Skill `assistent-bauen`):

1. Projekt `tages-dashboard`, Region Frankfurt, Tarif Free. Datenbank-Passwort im Schlüsselbund, die App braucht es nicht.
2. Knopf „Connect“ im Projekt: Project URL und Publishable Key nach `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Vorlage: `.env.example`.
3. Authentication → Sign In / Providers: „Allow new users to sign up“ aus und speichern. Der Anbieter „Email“ bleibt an.
4. Authentication → Users → „Add user“ mit „Auto Confirm User“.
5. Bei Vercel beide Variablen für Production und Preview. Sie gelten erst für das nächste Deployment.
6. Die User UID des Kontos (Authentication → Users) als `BESITZER_ID` in `lib/besitzer.ts`. Wird das Konto neu angelegt,
   muss sie mit, sonst sperrt der Proxy auch den Besitzer aus.

**2026-11-15, Einschub KI-Feature, Aufgabe 3** nach
[[projects/tages-dashboard/docs/plaene/2026-11-15-zusammenfassungen|Plan: Zusammenfassungen erzeugen und zeigen]]:

7. Tabelle `zusammenfassungen` mit RLS aus `supabase/zusammenfassungen.sql`, eingespielt über die Supabase-CLI (Befehle unten).
   Drei Policies (lesen, anlegen, ändern), alle nur für `auth.uid()` gleich `BESITZER_ID`. Löschen ist nicht erlaubt.
   Gegenprobe ohne Anmeldung: `select` liefert `[]`, `insert` scheitert mit `42501`.

Die CI braucht die Variablen nicht: Beim Bauen laufen weder Proxy noch Server Actions.

Im Code: `proxy.ts` (Schutz und Erneuerung), `lib/supabase/server.ts` (Client für Server Actions), `app/login/actions.ts`
(`anmelden`, `abmelden`). Tests ersetzen Supabase durch eine Attrappe.

## Bekannte Grenzen

Aus dem `/code-review` von PR #12, bewusst nicht behoben:

- **Abmelden bei einem Ausfall:** `abmelden` wertet das Ergebnis von `signOut()` nicht aus. Je nach Fehler bleibt die
  Sitzung auf dem Server gültig, oder man landet ohne Meldung wieder auf der Startseite. Dann später noch einmal drücken.
- **Ausfall sieht aus wie abgemeldet (nur noch bei Seiten):** Beim Aufruf einer Seite leitet `proxy.ts` auch bei einem Fehler von
  `getClaims()` zu `/login`. Die Seite bleibt zu, die Ursache zeigt erst der Anmeldeversuch. Schnittstellen unter `/api/` antworten
  seit PR #27 bei einem kurzen Ausfall mit 503, eine offene Seite bleibt also stehen.
- **Falsches Passwort leert die Felder:** React setzt das Formular nach der Action zurück. Beim Gerätetest am 2026-11-02
  auf iPhone, iPad und Mac ohne Beanstandung.
- **Limit je IP-Adresse:** Die Anmeldung läuft über den Server, Supabase zählt also dessen Adresse. Viele fremde Versuche
  könnten die eigene Anmeldung zeitweise blockieren (Fehler 429). Beim Security Audit am Ende von Phase 1 ansehen.
- **`secure` hängt an `NODE_ENV`:** Ein Produktions-Build über `http://` (`npm start`, auch im Heimnetz vom iPhone) setzt
  Cookies, die der Browser ablehnt. Das Passwort scheint zu stimmen, man landet aber wieder auf `/login`. Lokal mit
  `npm run dev` testen.
- **Lese-Client verwirft neue Tokens** (`/code-review` von PR #61, bewusst offen): `erstelleLeseClient` schreibt keine Cookies. Läuft
  der Access Token genau zwischen `proxy.ts` und der Abfrage in `/api/kacheln` ab, gehen die erneuerten Tokens verloren. Sehr
  unwahrscheinlich, weil `proxy.ts` Millisekunden vorher erneuert. Folge wäre eine Abmeldung.
- **Doppelter Aufruf:** `proxy.ts` und `lib/supabase/server.ts` rufen beide `createServerClient` auf, und `NEXT_PUBLIC_` wäre
  ohne Browser-Code unnötig. Kostet nur Pflege.

## Typischer Ablauf

**Passwort vergessen:** Authentication → Users → Nutzer → neues Passwort setzen. Eine Mail ist nicht nötig.

**Prüfen, ob die Registrierung wirklich aus ist:** Der erste Befehl unten muss `"disable_signup":true` liefern.

## Befehle

```bash
# Einstellungen abfragen, Werte aus .env.local (öffentlich)
/usr/bin/curl -s -H "apikey: <publishable-key>" 'https://<ref>.supabase.co/auth/v1/settings'
# Installation mit festen Versionen
npm install --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.118.0

# Supabase-CLI (Homebrew, 2.121.0): einmal anmelden, nur in einem eigenen Terminal-Fenster (siehe Fehler)
supabase login
supabase projects list                       # Projekte mit Ref und Status, z. B. ACTIVE_HEALTHY
# SQL über die Management API ausführen, ohne `supabase link`
supabase db query --linked --project-ref imebsydcnchziitgccxs -f supabase/zusammenfassungen.sql
supabase db query --linked --project-ref imebsydcnchziitgccxs "select count(*) from public.zusammenfassungen"
supabase logout --yes                        # löscht das Token wieder vom Mac (ohne --yes bricht es in Claude Code ab)

# Als Fremder prüfen (nur Publishable Key, ohne Anmeldung): muss [] bzw. Fehler 42501 liefern
/usr/bin/curl -s -H "apikey: <publishable-key>" 'https://<ref>.supabase.co/rest/v1/zusammenfassungen?select=link'
```

Das Token von `supabase login` gilt für alle Projekte des Kontos, nicht nur für dieses.

## Fehler

- **`disable_signup: false`, obwohl der Schalter aus sein sollte** (2026-11-01): Die Einstellung war nach dem Assistenten nicht
  gespeichert. **Ursache:** nicht ermittelt, der Schalter wurde vermutlich nicht
  gefunden oder nicht gespeichert. **Lösung:** von Hand über
  `https://supabase.com/dashboard/project/<ref>/auth/providers` ausschalten und speichern, dann mit dem Befehl oben prüfen.
- **`LoginMissingTokenError: Cannot use automatic login flow inside non-TTY environments`** (2026-11-15): `supabase login` mit `!`
  in Claude Code. **Ursache:** Dort läuft der Befehl ohne echtes Terminal-Fenster (TTY), die CLI startet die Anmeldung im Browser dann
  nicht. **Lösung:** `supabase login` einmal in der App Terminal ausführen. Das Token liegt danach im Schlüsselbund, Claude Code findet es.
- **`DbQueryMutuallyExclusiveFlagsError: --project-ref only applies when targeting the linked project`** (2026-11-15): `supabase db
  query --project-ref …` allein. **Ursache:** Der Schalter gilt nur zusammen mit `--linked`. **Lösung:** `--linked --project-ref <ref>`,
  ein `supabase link` ist dafür nicht nötig.
- **`Invalid API key` mit Status 401** (2026-11-15) bei der Prüfung als Fremder. **Ursache:** Der Schlüssel steht in `.env.local` in
  einfachen Anführungszeichen, sie gingen mit in den Header. **Lösung:** Anführungszeichen entfernen, bevor man den Wert benutzt.
