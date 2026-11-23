#!/usr/bin/env bash
# Alle Prüfungen des Projekts in einem Befehl: bash checks.sh
# Läuft vor jedem Commit und vor /code-review. Exit-Code 0 heißt: alles grün.
# Regeln: nichts abfragen, keine Dateien umschreiben (kein --fix, kein Snapshot-Update), bei jedem Fehler abbrechen.
set -euo pipefail
cd "$(dirname "$0")"

# ESLint
npm run lint

# Prettier: nur prüfen, nicht umschreiben
npm run format:check

# TypeScript
npm run typecheck

# Tests (Vitest)
npm test

# Produktionsfassung bauen wie die CI: nur der Build zeigt Fehler beim Vorab-Rendern (z. B. `new Date()` beim Rendern)
npm run build

# Tests der Mac-App (Rust)
cargo test --manifest-path src-tauri/Cargo.toml

echo 'checks.sh: alles grün'
