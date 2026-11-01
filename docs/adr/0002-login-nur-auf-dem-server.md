---
titel: "ADR 0002: Login nur auf dem Server"
status: akzeptiert
erstellt: 2026-11-01
tags: [adr, architektur, login, supabase]
---

# ADR (Architecture Decision Record) 0002: Login nur auf dem Server

## Kontext

Die App ist öffentlich erreichbar und zeigt später private Daten, genau eine Person nutzt sie. Sie läuft auch als
installierte Web-App auf dem iPhone, die eigene Cookies hat, getrennt von Safari. Die Anmeldung soll halten bis
„Abmelden“. Grundlage: [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Befragung vom 2026-10-25.

## Entscheidung

- **Anmeldung mit E-Mail und Passwort** aus dem iCloud-Schlüsselbund. Registrierung aus, der einzige Nutzer entsteht im
  Supabase-Dashboard.
- **Kein Supabase-Code im Browser.** `proxy.ts` prüft und erneuert die Sitzung vor jeder Anfrage, An- und Abmelden laufen
  als Server Actions.
- **Cookies `HttpOnly`,** weil JavaScript im Browser sie nie lesen muss.
- **Der Proxy schützt alles außer `/login` und Statischem,** sodass neue Seiten und Schnittstellen von selbst geschützt sind.
- **Fehlende Variablen führen zu Fehler 500,** nie zu einer offenen Seite.

## Alternativen

- **Magic Link:** Der Link aus der Mail meldet Safari an, nicht die installierte App. Zudem schafft der Gratis-Mailversand
  nur 2 Mails pro Stunde.
- **E-Mail-Code (OTP, One-Time Password):** ginge in der App, braucht aber jedes Mal eine Mail.
- **Browser-Client von Supabase** (`createBrowserClient`): Standardweg der Anleitung, nötig für Echtzeit-Funktionen im
  Browser. Die plant das Projekt nicht. Cookies wären dann für JavaScript lesbar, und Safari begrenzt Cookies aus
  JavaScript auf 7 Tage.

## Konsequenzen

- Schadcode auf der Seite kommt nicht an die Sitzung, und die Sitzung hängt nicht an der 7-Tage-Grenze.
- Der Proxy prüft nur, ob jemand angemeldet ist, nicht wer. Der Schalter „Allow new users to sign up“ ist deshalb
  sicherheitsrelevant: Mit eingeschalteter Registrierung käme jeder durch den Login.
- Echtzeit-Funktionen von Supabase im Browser bräuchten später ein neues ADR.
- Der Eingang für den Kurzbefehl (Phase 4) muss ausdrücklich vom Proxy ausgenommen werden und hat seinen eigenen Schlüssel.
