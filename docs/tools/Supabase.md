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

Für den Login des einzigen Kontos, ab Phase 4 auch für die Schritte. Warum die Anmeldung nur auf dem
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

## Wie haben wir es eingerichtet?

**2026-11-01, Phase 1, Schritt 2** nach [[projects/tages-dashboard/docs/plaene/2026-11-01-login|Plan: Login mit
Supabase]], mit einem Assistent-Skript (Skill `assistent-bauen`):

1. Projekt `tages-dashboard`, Region Frankfurt, Tarif Free. Datenbank-Passwort im Schlüsselbund, die App braucht es nicht.
2. Knopf „Connect“ im Projekt: Project URL und Publishable Key nach `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Vorlage: `.env.example`.
3. Authentication → Sign In / Providers: „Allow new users to sign up“ aus und speichern. Der Anbieter „Email“ bleibt an.
4. Authentication → Users → „Add user“ mit „Auto Confirm User“.
5. Bei Vercel beide Variablen für Production und Preview. Sie gelten erst für das nächste Deployment.

Die CI braucht die Variablen nicht: Beim Bauen laufen weder Proxy noch Server Actions.

Im Code: `proxy.ts` (Schutz und Erneuerung), `lib/supabase/server.ts` (Client für Server Actions), `app/login/actions.ts`
(`anmelden`, `abmelden`). Tests ersetzen Supabase durch eine Attrappe.

## Typischer Ablauf

**Passwort vergessen:** Authentication → Users → Nutzer → neues Passwort setzen. Eine Mail ist nicht nötig.

**Prüfen, ob die Registrierung wirklich aus ist:** Der erste Befehl unten muss `"disable_signup":true` liefern.

## Befehle

```bash
# Einstellungen abfragen, Werte aus .env.local (öffentlich)
/usr/bin/curl -s -H "apikey: <publishable-key>" 'https://<ref>.supabase.co/auth/v1/settings'
# Installation mit festen Versionen
npm install --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.118.0
```

## Fehler

- **`disable_signup: false`, obwohl der Schalter aus sein sollte** (2026-11-01): Die Einstellung war nach dem Assistenten nicht
  gespeichert. **Ursache:** nicht ermittelt, der Schalter wurde vermutlich nicht
  gefunden oder nicht gespeichert. **Lösung:** von Hand über
  `https://supabase.com/dashboard/project/<ref>/auth/providers` ausschalten und speichern, dann mit dem Befehl oben prüfen.
