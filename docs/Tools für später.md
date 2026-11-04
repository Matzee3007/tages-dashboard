---
titel: Tools für später
status: aktiv
erstellt: 2026-10-24
tags: [tools, später]
---

# Tools für später

Werkzeuge, die für dieses Projekt interessant sind, aber jetzt noch nicht passen. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].
Beim Start jeder Phase prüfen (Regel der globalen `CLAUDE.md`). Werkzeuge für alle Projekte stehen in den
[[docs/Tools für später|Tools für später des Ecosystems]].

Aufbau je Eintrag:

```markdown
## <Werkzeug>

- **Link:** <URL>, <Lizenz>
- **Was:** <ein bis zwei Sätze>
- **Warum noch nicht:** <Grund>
- **Wann prüfen:** <Phase oder Anlass>
```

## Docker (für die lokale Supabase)

- **Link:** https://supabase.com/docs/guides/local-development, Supabase-CLI unter MIT, Docker Desktop privat kostenlos (Lizenzen nicht
  nachgeprüft). Allgemeine Notiz: [[docs/werkzeuge/Docker|Docker]]. Auf dem Rechner ist Docker schon installiert.
- **Was:** Die Supabase-CLI startet über Docker eine lokale Kopie von Supabase. Damit lassen sich Migrationen und Zugriffsregeln testen,
  ohne die echte Datenbank anzufassen. Ein eigenes Dockerfile braucht es dafür nicht.
- **Warum noch nicht:** Das Projekt hat noch keine eigenen Tabellen. Vercel betreibt die App ohne Container, die Mac-App wird direkt auf
  macOS gebaut, und `npm ci` hält die Umgebung gleich (entschieden am 2026-11-04).
- **Wann prüfen:** am Start von Phase 4, sobald die Schritte eigene Tabellen brauchen. Der Fahrplan sieht eine lokale Supabase ohnehin
  nicht vor Phase 4 vor.
