mod klick;
mod links;

use klick::{KlickAktion, klick_aktion};
use links::{LinkZiel, im_browser_oeffnen, link_ziel};
use tauri::{
    AppHandle, Manager, RunEvent, WebviewWindowBuilder, WindowEvent,
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::NewWindowResponse,
};

const FENSTER: &str = "main";

fn nach_vorn(app: &AppHandle) {
    let _ = app.show();
    if let Some(fenster) = app.get_webview_window(FENSTER) {
        let _ = fenster.unminimize();
        let _ = fenster.show();
        let _ = fenster.set_focus();
    }
}

fn linksklick(app: &AppHandle) {
    let Some(fenster) = app.get_webview_window(FENSTER) else {
        return;
    };
    let sichtbar = fenster.is_visible().unwrap_or(false);
    let fokussiert = fenster.is_focused().unwrap_or(false);
    match klick_aktion(sichtbar, fokussiert) {
        // Die ganze App ausblenden, nicht nur das Fenster: Dann bekommt das vorherige Programm den Fokus zurück,
        // und im Vollbild bleibt keine leere Fläche stehen
        KlickAktion::Ausblenden => {
            let _ = app.hide();
        }
        KlickAktion::NachVorn => nach_vorn(app),
    }
}

/// Baut das Fenster aus `tauri.conf.json` selbst, denn die Handler für Links lassen sich nur beim Bauen setzen.
fn fenster_bauen(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
        .on_navigation(|adresse| match link_ziel(adresse) {
            LinkZiel::ImFenster => true,
            LinkZiel::Browser => {
                im_browser_oeffnen(adresse);
                false
            }
            LinkZiel::Blockiert => false,
        })
        // Es soll nie ein zweites Fenster entstehen, auch nicht für eine eigene Seite
        .on_new_window(|adresse, _| {
            if link_ziel(&adresse) != LinkZiel::Blockiert {
                im_browser_oeffnen(&adresse);
            }
            NewWindowResponse::Deny
        })
        .build()?;
    Ok(())
}

fn menueleiste_einrichten(app: &AppHandle) -> tauri::Result<()> {
    let menue = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "oeffnen", "Heute öffnen", true, None::<&str>)?,
            &MenuItem::with_id(app, "neu_laden", "Neu laden", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "beenden", "Beenden", true, None::<&str>)?,
        ],
    )?;

    TrayIconBuilder::new()
        .icon(Image::from_bytes(include_bytes!("../icons/tray.png"))?)
        .icon_as_template(true)
        .menu(&menue)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|symbol, ereignis| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = ereignis
            {
                linksklick(symbol.app_handle());
            }
        })
        .on_menu_event(|app, ereignis| match ereignis.id.as_ref() {
            "oeffnen" => nach_vorn(app),
            "neu_laden" => {
                if let Some(fenster) = app.get_webview_window(FENSTER) {
                    let _ = fenster.reload();
                }
            }
            "beenden" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            fenster_bauen(app.handle())?;
            menueleiste_einrichten(app.handle())?;
            Ok(())
        })
        // Roter Knopf und Cmd+W blenden nur aus, die App läuft in der Menüleiste weiter
        .on_window_event(|fenster, ereignis| {
            if let WindowEvent::CloseRequested { api, .. } = ereignis {
                api.prevent_close();
                let _ = fenster.app_handle().hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("Tauri-App konnte nicht starten")
        .run(|app, ereignis| {
            // Klick aufs Dock-Symbol holt das ausgeblendete Fenster zurück
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = ereignis {
                nach_vorn(app);
            }
        });
}
