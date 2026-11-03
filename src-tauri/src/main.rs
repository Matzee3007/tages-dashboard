fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri-App konnte nicht starten");
}
