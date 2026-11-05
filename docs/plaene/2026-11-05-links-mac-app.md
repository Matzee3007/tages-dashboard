---
titel: "Plan: Links in der Mac-App"
status: aktiv
erstellt: 2026-11-05
tags: [plan, tauri, mac, phase-2]
---

# Plan: Links in der Mac-App

**Ziel:** In der Mac-App „Heute“ gehen fremde Adressen im Standardbrowser auf, das Dashboard bleibt im Fenster stehen.

**Vorgehen:** Eine reine Funktion entscheidet für jede Adresse: im Fenster, im Browser oder gar nicht. Die Hülle ruft sie bei jedem Seitenwechsel und bei
jedem neuen Fenster auf. Den Browser startet der macOS-Befehl `open`, ein Tauri-Plugin ist nicht nötig.

**Technik:** Tauri 2.12.5 (`on_navigation`, `on_new_window`, `WebviewWindowBuilder::from_config`), Rust-Standardbibliothek (`std::process::Command`).

**Anforderung:** [[projects/tages-dashboard/docs/Projektvision|Projektvision]], Phase 2, Schritt 2.

## Feste Vorgaben

- Kein Tauri-Plugin und keine neue Abhängigkeit. Die Vorgabe „Keine Plugins“ aus dem [[projects/tages-dashboard/docs/plaene/2026-11-03-mac-app|Plan zur Mac-App]] bleibt.
- Die Website bekommt keine Rechte: keine Capability (Rechte-Datei von Tauri), keine eigenen Befehle. Die Entscheidung fällt nur in Rust.
- Eigene Adresse: `https://tages-dashboard-iota.vercel.app`. Verglichen wird der ganze Ursprung (Schema, Host, Port), nie ein Textanfang.
- An `open` gehen nur `http` und `https`. Andere Schemata (`file:`, `javascript:`, `mailto:` …) tun nichts, denn in Phase 3 kommen Links aus fremden Feeds.
- Website und Login bleiben unverändert.
- Rust-Befehle mit `~/.cargo/bin/cargo`, `cargo` allein ist in der Shell von Claude Code nicht gefunden worden.

## Geklärte Fragen

- **Warum `on_new_window`?** Ohne diesen Handler gibt `wry` (die Webview-Schicht von Tauri) für `target="_blank"` nichts zurück, solche Links tun also nichts
  (`wry_web_view_ui_delegate.rs`). `on_navigation` allein reicht nicht.
- **Warum `"create": false`?** Die beiden Handler lassen sich nur beim Bauen des Fensters setzen. Das Fenster aus `tauri.conf.json` entsteht sonst automatisch und ohne sie.
- **Warnung #2 (`glib`):** `cargo tree -i glib` findet das Paket für `aarch64-apple-darwin` nicht, für `x86_64-unknown-linux-gnu` schon (über `gtk`, `webkit2gtk`). Es steckt also nur
  im Linux-Teil von Tauri und nicht in der Mac-App.
- **iPhone und iPad:** Die Prüfung aus dem Fahrplan rückt nach Schritt 3. Die installierte App läuft auf der echten Adresse, und dort gibt es vor der KI-News-Kachel keinen fremden Link zum Antippen.

## Prüf-Schwerpunkte

1. App startet frisch → das Dashboard lädt im Fenster, kein Browser geht auf. Gerätetest in Aufgabe 2.
2. Anmelden, Abmelden, „Neu laden“ → alles bleibt im Fenster. Gerätetest in Aufgabe 2.
3. Klick auf `target="_blank"` → Browser geht auf, kein leeres zweites Fenster. Gerätetest in Aufgabe 2.
4. Feed-Link mit `file:` oder `javascript:` → nichts passiert. Test `andere_schemata_sind_blockiert`.
5. Fremde Adresse, die mit der eigenen beginnt → Browser, nicht das Fenster. Test `aehnliche_adressen_sind_fremd`.

## Dateien

| Datei | Aufgabe |
|---|---|
| `src-tauri/src/links.rs` (neu) | Regel, wohin eine Adresse gehört, und Start des Browsers |
| `src-tauri/src/main.rs` | baut das Fenster mit den beiden Handlern |
| `src-tauri/tauri.conf.json` | `"create": false` |
| `docs/adr/0006-links-im-standardbrowser.md` (neu) | Entscheidung gegen das Plugin |
| `docs/tools/Tauri.md`, `docs/tools/Dependabot - Einrichtung.md`, `docs/Projektvision.md`, `docs/Nächste Session.md` | Doku, `glib`, Fahrplan |

## Aufgaben

### Aufgabe 1: Regel für Adressen

**Dateien:**

- Neu: `src-tauri/src/links.rs`
- Ändern: `src-tauri/src/main.rs` (nur `mod links;`)

**Schnittstellen:**

- Liefert: `pub enum LinkZiel { ImFenster, Browser, Blockiert }`, `pub fn link_ziel(adresse: &tauri::Url) -> LinkZiel`, `pub fn im_browser_oeffnen(adresse: &tauri::Url)`

- [x] **Schritt 1: Fehlschlagende Tests schreiben** (in `links.rs`, Modul `tests`, Hilfsfunktion `ziel(&str) -> LinkZiel` parst die Adresse)

```rust
#[test]
fn eigene_seiten_bleiben_im_fenster() {
    assert_eq!(ziel("https://tages-dashboard-iota.vercel.app/"), LinkZiel::ImFenster);
    assert_eq!(ziel("https://tages-dashboard-iota.vercel.app/login?x=1#a"), LinkZiel::ImFenster);
    assert_eq!(ziel("https://TAGES-DASHBOARD-IOTA.vercel.app/"), LinkZiel::ImFenster);
}

#[test]
fn fremde_adressen_gehen_in_den_browser() {
    assert_eq!(ziel("https://openai.com/news"), LinkZiel::Browser);
    assert_eq!(ziel("http://example.com/"), LinkZiel::Browser);
}

#[test]
fn aehnliche_adressen_sind_fremd() {
    assert_eq!(ziel("https://tages-dashboard-iota.vercel.app.example.com/"), LinkZiel::Browser);
    assert_eq!(ziel("https://example.com/tages-dashboard-iota.vercel.app"), LinkZiel::Browser);
    assert_eq!(ziel("https://tages-dashboard-iota.vercel.app:8443/"), LinkZiel::Browser);
    assert_eq!(ziel("http://tages-dashboard-iota.vercel.app/"), LinkZiel::Browser);
}

#[test]
fn andere_schemata_sind_blockiert() {
    for adresse in ["file:///etc/hosts", "javascript:alert(1)", "mailto:a@example.com", "about:blank"] {
        assert_eq!(ziel(adresse), LinkZiel::Blockiert);
    }
}

#[test]
fn eigene_adresse_passt_zur_konfiguration() {
    assert!(include_str!("../tauri.conf.json").contains(&format!("\"frontendDist\": \"{EIGENE_ADRESSE}\"")));
}
```

- [x] **Schritt 2: Tests laufen lassen, sie müssen fehlschlagen**

`~/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml links`
Erwartet: Fehler beim Übersetzen, `link_ziel` gibt es nicht.

- [x] **Schritt 3: `link_ziel` und `im_browser_oeffnen` schreiben**

- `const EIGENE_ADRESSE: &str = "https://tages-dashboard-iota.vercel.app";`
- `link_ziel`: gleicher `origin()` wie `EIGENE_ADRESSE` → `ImFenster`, sonst `http`/`https` → `Browser`, sonst `Blockiert`.
- `im_browser_oeffnen`: in einem eigenen Thread `Command::new("open").arg(adresse.as_str()).status()`. Der Thread wartet das Ende von `open` ab, damit kein Zombie-Prozess bleibt, und das Fenster hängt nicht.

- [x] **Schritt 4: Tests laufen lassen, sie müssen bestehen**

`~/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml`
Erwartet: 8 Tests bestanden (3 aus `klick.rs`, 5 neue).

- [x] **Schritt 5: Prüfen und committen**

```bash
~/.cargo/bin/cargo fmt --manifest-path src-tauri/Cargo.toml --check
git add src-tauri/src/links.rs src-tauri/src/main.rs docs/plaene/2026-11-05-links-mac-app.md
git commit -m "Add link rule for the Mac app"
```

### Aufgabe 2: Regel im Fenster anschließen

**Dateien:**

- Ändern: `src-tauri/tauri.conf.json` (`"create": false` im Fenster `main`)
- Ändern: `src-tauri/src/main.rs` (`setup`)

**Schnittstellen:**

- Nutzt: `link_ziel`, `im_browser_oeffnen`, `LinkZiel` aus Aufgabe 1

- [ ] **Schritt 1: Fenster in `setup` bauen,** vor `menueleiste_einrichten`, mit `WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?`:
  - `on_navigation`: `ImFenster` → `true`. `Browser` → `im_browser_oeffnen`, dann `false`. `Blockiert` → `false`.
  - `on_new_window`: `Browser` und `ImFenster` → `im_browser_oeffnen`, `Blockiert` → nichts. Immer `NewWindowResponse::Deny`. Es soll nie ein zweites Fenster entstehen.

- [ ] **Schritt 2: Übersetzen und Tests**

`~/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml`
Erwartet: 8 Tests bestanden, keine Warnung „never used“ aus `links.rs`.

- [ ] **Schritt 3: Gerätetest, nur der Entwickler kann ihn abnehmen**

`npm run tauri -- dev`, danach in der App Rechtsklick → „Element untersuchen“ → Konsole. Fremde Links gibt es vor Schritt 3 noch nicht, deshalb legt ein Befehl sie an:

```js
document.body.insertAdjacentHTML(
  "afterbegin",
  `<a href="https://example.com" style="display:block;font-size:40px">gleiches Fenster</a>
   <a href="https://example.org" target="_blank" style="display:block;font-size:40px">neues Fenster</a>
   <a href="file:///etc/hosts" style="display:block;font-size:40px">Datei</a>`,
);
```

| Nr. | Handlung | Erwartet |
|---|---|---|
| 1 | App starten | Dashboard im Fenster, kein Browser geht auf |
| 2 | Abmelden, Anmelden, im Menü „Neu laden“ | alles im selben Fenster |
| 3 | Klick auf „gleiches Fenster“ | Standardbrowser zeigt example.com, Dashboard bleibt stehen |
| 4 | Klick auf „neues Fenster“ | Standardbrowser zeigt example.org, kein zweites Fenster der App |
| 5 | Klick auf „Datei“ | nichts passiert |

- [ ] **Schritt 4: Committen**

```bash
git add src-tauri/tauri.conf.json src-tauri/src/main.rs
git commit -m "Open foreign links in the default browser"
```

### Aufgabe 3: Hülle neu bauen, Doku und `glib`

**Dateien:** siehe Tabelle oben, ohne die Dateien aus Aufgabe 1 und 2.

- [ ] **Schritt 1: `npm run tauri -- build`, dann Prüfung 1 und 2 aus dem Gerätetest mit der gebauten App wiederholen.** Das Einfügen der Testlinks entfällt, denn die fertige App hat keine Entwicklerwerkzeuge. Die Regel läuft in beiden Fassungen gleich.

- [ ] **Schritt 2: ADR 0006 schreiben.** Entscheidung: `open` aus der Standardbibliothek. Alternativen: `tauri-plugin-opener` (neue Abhängigkeit für einen einzigen Aufruf, lohnt sich erst bei mehreren Betriebssystemen), Abfangen per JavaScript auf der Website (Website müsste die Hülle kennen, Rechte nötig). Konsequenz: Die Hülle läuft nur auf dem Mac, wie schon in ADR 0003.

- [ ] **Schritt 3: Warnung #2 schließen.**

```bash
gh api -X PATCH repos/Matzee3007/tages-dashboard/dependabot/alerts/2 -f state=dismissed -f dismissed_reason=not_used -f dismissed_comment='glib gehört nur zum Linux-Teil von Tauri, die Hülle wird nur für den Mac gebaut. Siehe docs/tools/Dependabot - Einrichtung.md'
```

Erwartet: Die Abfrage der offenen Warnungen ist leer.

- [ ] **Schritt 4: Doku.**
  - `docs/tools/Tauri.md`: Bedienung (Links), `links.rs`, Ergebnisse des Gerätetests, „Keine Rechte“ bleibt wahr.
  - `docs/tools/Dependabot - Einrichtung.md`: Warnung #2 mit Beleg aus `cargo tree`.
  - `docs/Projektvision.md`: Schritt 2 erledigt mit PR-Nummer, die Prüfung auf iPhone und iPad nach Schritt 3.
  - `docs/Nächste Session.md`: Restpunkt 5 (`glib`) streichen, die iPhone-Prüfung zu Schritt 3 schreiben.
  - Dieser Plan: `status: abgeschlossen`.

- [ ] **Schritt 5: Prüfen und committen**

```bash
npm run check
git add docs
git commit -m "Document link handling and glib alert"
```

Danach Agent `plan-pruefer`, `/code-review` (der PR ändert Code) und PR.
