---
titel: Tauri
status: aktiv
erstellt: 2026-11-02
tags: [tools, tauri, desktop, mac]
---

# Tauri

Gehört zu [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Entscheidung:
[[projects/tages-dashboard/docs/adr/0003-mac-app-mit-tauri|ADR 0003]], Plan:
[[projects/tages-dashboard/docs/plaene/2026-11-03-mac-app|Plan: Mac-App mit Tauri]].

Tauri packt eine Website in eine kleine Desktop-App und nutzt dafür den Browserkern des Betriebssystems, auf dem Mac also
WebKit. Hier zeigt es die Vercel-Adresse des Dashboards in einem eigenen Fenster. Der eigene App-Code ist in Rust, deshalb
braucht der Rechner Rust zum Bauen.

## Wie haben wir es eingerichtet?

1. **Rust (2026-11-03):** mit dem Skript von `rustup`, ohne Xcode, die Command Line Tools reichen. Das Skript hat `~/.zshenv` und
   `~/.profile` angelegt und `~/.bash_profile` geändert, jeweils um den Pfad zu `~/.cargo/bin`.
2. **CLI:** `@tauri-apps/cli` als Entwicklungs-Abhängigkeit, Skript `tauri` in `package.json`.
3. **Hülle in `src-tauri/`:**
   - `tauri.conf.json`: Name „Heute“, Kennung `com.matzee3007.heute`, Adresse, Fenster, nur `.app`, Signatur `-`
   - `src/main.rs`: Menüleiste, roter Knopf, Klick aufs Dock
   - `src/klick.rs`: was ein Linksklick tut, mit 3 Tests
   - `src/links.rs`: wohin eine Adresse gehört, mit 5 Tests (2026-11-05, [[projects/tages-dashboard/docs/adr/0006-links-im-standardbrowser|ADR 0006]])
   - `icons/`: App-Symbol und `tray.png`, Quellen in `assets/icons/`, umgewandelt mit `sips` und `tauri icon`

Die Website bekommt keine Rechte in der Hülle: Es gibt keine Capability (Rechte-Datei von Tauri) und keine eigenen Befehle.

Nicht eingerichtet: Rust in der CI (die Hülle ist nur für den Mac, `cargo test` läuft lokal) und Dependabot für Rust-Pakete (die
Hülle wird selten geändert).

## Bedienung der App

| Handlung | Wirkung |
|---|---|
| Linksklick aufs Leisten-Symbol | Fenster vorn: App ausblenden, sonst nach vorn holen |
| Rechtsklick (auf dem Trackpad mit zwei Fingern) | Menü: „Heute öffnen“, „Neu laden“, „Beenden“ |
| Roter Knopf, `Cmd+W` | App ausblenden, sie läuft in der Menüleiste weiter |
| Klick aufs Dock-Symbol | Fenster zurückholen |
| `Cmd+Q`, „Beenden“ | App ganz beenden |
| Klick auf einen fremden Link | Standardbrowser öffnet ihn, das Dashboard bleibt stehen |

## Gerätetest

Am 2026-11-03 mit der fertigen App aus `/Applications`:

| Prüfung | Ergebnis |
|---|---|
| Start ohne Bezahlkonto bei Apple | bestanden, keine Warnung |
| Anmelden, Startseite im selben Fenster | bestanden |
| Schlüsselbund bietet das Passwort an | **nein**, das Passwort wird von Hand eingegeben |
| Beenden und neu starten: weiterhin angemeldet | bestanden |
| Abmelden | bestanden |
| Start ohne Internet, danach „Neu laden“ | bestanden |
| Symbole in Dock und Menüleiste | bestanden |
| Ausblenden: Fokus geht ans vorherige Programm zurück, im Vollbild keine leere Fläche | bestanden |
| Minimiert und anderes Programm vorn, dann Linksklick: Fenster kommt mit Fokus | bestanden |
| Start dunkel statt weiß | bestanden |

Am 2026-11-04 nachgeprüft: Die Anmeldung hält auch am nächsten Tag.

Der Start ohne Warnung gilt für diesen Mac, auf dem die App gebaut wurde. Für die Weitergabe an andere ist sie nicht gedacht.

Am 2026-11-05 die Links geprüft, mit `npm run tauri -- dev` und von Hand eingefügten Testlinks:

| Prüfung | Ergebnis |
|---|---|
| Start: Dashboard im Fenster, kein Browser | bestanden |
| Abmelden, Anmelden, „Neu laden“: alles im selben Fenster | bestanden |
| Normaler fremder Link: Standardbrowser, Dashboard bleibt stehen | bestanden |
| Fremder Link mit `target="_blank"`: Standardbrowser, kein zweites Fenster | bestanden |
| Link auf `file:`: nichts passiert | bestanden |

Danach mit der fertigen App aus `/Applications`: Start sowie Abmelden, Anmelden und „Neu laden“ bestanden. Die Testlinks entfallen dort, die fertige App hat keine Konsole.

Am 2026-11-06 nach dem `/code-review` (`/usr/bin/open` mit festem Pfad) neu gebaut. Start ohne Internet: Das Fenster bleibt leer, früher kam eine Fehlerseite. Nach „Neu laden“ mit
Internet ist das Dashboard da, kein Browser geht auf.

## Befehle

```bash
npm run tauri -- dev                       # App zum Entwickeln starten, baut bei Änderungen in src-tauri neu
npm run tauri -- build                     # fertige App bauen, liegt in src-tauri/target/release/bundle/macos/
rm -rf /Applications/Heute.app             # alte App entfernen (vorher beenden), siehe Hinweis unten
cp -R src-tauri/target/release/bundle/macos/Heute.app /Applications/   # App installieren
cargo test --manifest-path src-tauri/Cargo.toml   # Tests der Hülle
codesign -dv /Applications/Heute.app       # Signatur ansehen, erwartet: Signature=adhoc
```

Änderungen an der Website brauchen keinen neuen Bau, die App lädt immer die Live-Adresse. Neu bauen nur, wenn sich `src-tauri/`
ändert.

Die alte App vor dem Kopieren entfernen: `cp` überschreibt sonst die Programmdatei an Ort und Stelle und lässt alte Dateien liegen.
Das kann auf Apple Silicon die Signatur brechen (aus dem `/code-review` von PR #25, nicht selbst nachgestellt).

## Fehler

**`curl: (77) error adding trust anchors from file: /opt/anaconda3/ssl/cacert.pem`** beim Skript von `rustup` (2026-11-03):

- Ursache: Das Skript ruft `curl` auf und erwischt das aus Anaconda, das seine Zertifikate nicht lesen kann.
- Lösung: Für den einen Aufruf das System-`curl` nach vorn holen: `PATH=/usr/bin:/bin:/usr/sbin:/sbin sh rustup-init.sh -y`.

**`asset not found: index.html` im Fenster bei `tauri dev`** (2026-11-03):

- Ursache: Der Dev-Modus liest nur `build.devUrl`, die fertige App nur `build.frontendDist`. Ohne `devUrl` sucht die Hülle eine
  eingebaute `index.html`, die es bei uns nicht gibt (`get_app_url` im Quellcode von Tauri).
- Lösung: `devUrl` und `frontendDist` beide auf die Vercel-Adresse setzen.

**Rechtsklick auf das Symbol zeigt kein Menü, das Fenster springt stattdessen um** (2026-11-03):

- Ursache: Kein Fehler der App. Option + Klick ist auf dem Mac kein Rechtsklick und kommt als Linksklick an.
- Lösung: Auf dem Trackpad mit zwei Fingern klicken.
- Bekannte Grenze: Auch `Ctrl` + Klick zählt als Linksklick, weil `tray-icon` die Taste nicht auswertet (aus dem Quellcode, nicht
  am Gerät geprüft). Eine einfache Lösung über dieses Ereignis gibt es nicht.
