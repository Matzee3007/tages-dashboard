mod klick;

use klick::{KlickAktion, klick_aktion};
use tauri::{
    AppHandle, Manager, RunEvent, WindowEvent,
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

const FENSTER: &str = "main";

fn nach_vorn(app: &AppHandle) {
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
        KlickAktion::Ausblenden => {
            let _ = fenster.hide();
        }
        KlickAktion::NachVorn => nach_vorn(app),
    }
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
            menueleiste_einrichten(app.handle())?;
            Ok(())
        })
        // Roter Knopf und Cmd+W blenden nur aus, die App läuft in der Menüleiste weiter
        .on_window_event(|fenster, ereignis| {
            if let WindowEvent::CloseRequested { api, .. } = ereignis {
                api.prevent_close();
                let _ = fenster.hide();
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
