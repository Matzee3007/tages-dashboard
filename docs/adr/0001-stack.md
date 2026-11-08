---
titel: "ADR 0001: Stack"
status: akzeptiert
erstellt: 2026-10-24
tags: [adr, architektur, stack]
---

# ADR (Architecture Decision Record) 0001: Stack

## Kontext

Das Projekt braucht eine Oberfläche für Mac, iPhone und iPad, einen Login für genau einen Nutzer, eine
kleine Datenbank (Schritte, später Einstellungen), Server-Code, der fremde APIs und RSS-Feeds abfragt und
zwischenspeichert, und einen Eingang, an den ein iPhone-Kurzbefehl Daten schickt.

Randbedingungen: nur für mich, möglichst kostenlos, kein App Store. Vorhandenes Wissen: Next.js mit TypeScript
aus musik-app (Rezept in `STACKS.md`), Supabase aus sport-fantasy. Lernziel: PWA, Auth, mehrere APIs, RSS,
Kurzbefehle.

## Entscheidung

- **App:** TypeScript mit Next.js (App Router). Erprobtes Rezept aus musik-app, Server-Code und Oberfläche in
  einem Projekt.
- **PWA:** Web-App-Manifest von Next.js. Läuft auf allen drei Geräten, ohne App Store.
- **Login und Datenbank:** Supabase. Auth und Postgres aus einer Hand, bekannt aus sport-fantasy, kostenloser Tarif.
- **Hosting:** Vercel, kostenloser Tarif. Passt am besten zu Next.js.
- **Live:** Die Seite fragt jede Minute neu, solange sie offen ist. Der Server speichert Antworten kurz zwischen.
- **Datenquellen:** OpenLigaDB, football-data.org, ESPN (inoffiziell), Jolpica und OpenF1, RSS-Feeds,
  iPhone-Kurzbefehl. Die Bundesliga kommt seit 2026-11-08 von ESPN statt OpenLigaDB
  ([[projects/tages-dashboard/docs/adr/0009-bundesliga-von-espn|ADR 0009]]).

## Alternativen

- **Native iOS-App (Swift, HealthKit):** direkter Zugriff auf Apple Health, aber nur auf Apple-Geräten, 99 € im Jahr
  oder Neuinstallieren alle 7 Tage. Für ein Dashboard nur für mich zu aufwendig.
- **SvelteKit:** schlanker, aber neu. Next.js hat ein erprobtes Rezept im Ecosystem.
- **Einzelnes Passwort mit Schlüssel-Wert-Speicher statt Supabase:** einfacher, aber weniger sicher und weniger
  zu lernen. Die Schritte brauchen ohnehin eine Datenbank.
- **Netlify statt Vercel:** ähnlich, aber Vercel ist der Hersteller von Next.js und schon für sport-fantasy geplant.
- **X-API für die News:** ab etwa 200 $ im Monat. Erst später, mit eigenem ADR.
- **Echtzeit-Push (WebSockets) statt Abfrage jede Minute:** aufwendiger, und die Gratis-Quellen bieten ohnehin
  keinen Push.

## Konsequenzen

- Schritte kommen nicht in Echtzeit, sondern so oft, wie der Kurzbefehl läuft.
- Gratis-Quellen setzen Grenzen: Arsenal und Champions League verzögert, Formel 1 ohne Live-Rundenzeiten, NFL über
  eine inoffizielle Schnittstelle.
- Die App ist im Internet erreichbar, deshalb sind Login und Schutz des Kurzbefehl-Eingangs Pflicht.
- Supabase und Vercel brauchen je ein Konto. Schlüssel kommen in `.env` und als Umgebungsvariablen bei Vercel.
- Ein Stack-Paket für Next.js gibt es in `plugins/` noch nicht.
