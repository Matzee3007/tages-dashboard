---
titel: Arbeitsumgebung
status: aktiv
erstellt: 2026-10-24
tags: [arbeitsumgebung, einrichtung]
---

# Arbeitsumgebung

Was dieses Projekt auf dem Rechner braucht, um zu laufen. Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].
Die Einrichtung des Rechners für alle Projekte (Terminal, Statuszeile, `install.sh`) steht in [[Rechner]].

## Voraussetzungen

- Node.js 24 (LTS) mit npm, über Homebrew (`node@24`)
- Später: Konten bei Supabase und Vercel

## Umgebungsvariablen

Geheimnisse stehen in `.env` (nicht im Repo, Claude darf sie nicht lesen). Welche Variablen es gibt, steht
ohne Werte in `.env.example`, sobald die erste gebraucht wird.

## Starten und stoppen

```bash
npm ci        # Abhängigkeiten installieren
npm run dev   # App lokal starten, dann http://localhost:3000 öffnen
```
