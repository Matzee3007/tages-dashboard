# Tages-Dashboard

Persönliches Live-Dashboard für einen einzigen Nutzer, mich: KI-News, Sport live und meine Schritte auf einen Blick, als
Web-App (PWA) auf iPhone und iPad und als eigene Mac-App.

Die App läuft auf Vercel, ist aber ganz hinter einem Login. Dieses Repo zeigt deshalb den Code und die Entscheidungen,
keine öffentliche Demo.

## Idee

Jeder Bereich ist eine eigenständige Kachel mit eigener Datenquelle: Feeds und Seiten für KI-News, Sportdaten für
Bundesliga, Premier League, Champions League, NFL und Formel 1, die Schritte aus Apple Health per iPhone-Kurzbefehl. Eine
neue Kachel kommt dazu, ohne die anderen zu ändern. Solange die Seite offen ist, fragt sie jede Minute nach neuen Daten.

## Technik

| Bereich | Umsetzung |
|---|---|
| App | Next.js (App Router) mit TypeScript und Tailwind CSS |
| Login und Datenbank | Supabase Auth und Postgres |
| Apps | PWA für iPhone und iPad, Mac-App mit Tauri, die die Website in einem eigenen Fenster zeigt |
| Feeds | RSS und Atom mit `fast-xml-parser`, die Umwandlung ist selbst geschrieben |
| Hosting | Vercel |
| Tests und Qualität | Vitest, Testing Library, ESLint, Prettier, CI mit GitHub Actions |

## Entscheidungen

- **Login nur auf dem Server:** Im Browser läuft kein Supabase-Code. Ein Proxy prüft vor jeder Anfrage die Sitzung und
  lässt nur das eine Konto durch, die Cookies sind `HttpOnly`. Neue Seiten und Schnittstellen sind damit von selbst
  geschützt.
- **Daten holt der Server:** API-Schlüssel bleiben auf dem Server, Antworten werden kurz zwischengespeichert, damit die
  Gratis-Grenzen der Anbieter reichen.
- **Eine Abfrage für alle Kacheln:** Der Server lädt jede Kachel getrennt, ein Fehler trifft nur die eine Kachel. Nur
  Status 401 zählt als abgemeldet, damit ein kurzer Ausfall die offene Seite nicht zum Login wirft.
- **Veraltete Feeds erkennen:** Eine zwischengespeicherte Antwort zählt höchstens eine Stunde, sonst gilt der Kanal als
  Ausfall. Ohne diese Grenze sähe ein toter Feed wie ein stiller Absender aus.

Begründungen und verworfene Alternativen stehen als ADRs (Architecture Decision Records) in [`docs/adr/`](docs/adr/).

## Lokal starten

```bash
npm ci          # Abhängigkeiten installieren
npm run dev     # App starten, braucht Supabase-Zugangsdaten in .env.local
npm run check   # Linter, Formatprüfung, Typprüfung und Tests
```

## Stand

Fertig ist das Grundgerüst: Login, PWA, Mac-App und das Kachel-System. Gerade entsteht die erste echte Kachel mit
KI-News, danach folgen Sport und Schritte. Die Roadmap steht in [`docs/Projektvision.md`](docs/Projektvision.md).

## Wie es entsteht

Das Projekt ist ein Lernprojekt. Ich entwickle es mit Claude Code als KI-Werkzeug: Plan, Entscheidungen und Prüfung liegen
bei mir, Tests und CI prüfen jede Änderung. Pläne, Lernjournale und Notizen liegen in [`docs/`](docs/).
