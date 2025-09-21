#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use tauri::Manager;
use window_vibrancy::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            window_vibrancy::apply_vibrancy(&window, NSVisualEffectMaterial::UnderWindowBackground, None, Some(16.0))
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[allow(unused_code)]
            #[cfg(target_os = "windows")]
            window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_acrylic' is only supported on Windows");

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
