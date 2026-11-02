---
titel: Tauri
status: geplant
erstellt: 2026-11-02
tags: [tools, tauri, desktop, mac]
---

# Tauri

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Entscheidung:
[[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]].

Tauri packt eine Website in eine kleine Desktop-App und nutzt dafür den Browserkern des Betriebssystems, auf dem Mac also
WebKit. Hier zeigt es die Vercel-Adresse des Dashboards in einem eigenen Fenster. Eigener App-Code wäre in Rust, deshalb
braucht der Rechner Rust als Werkzeug.

Diese Notiz wird ausführlich, sobald Fahrplan-Schritt 4 beginnt.
