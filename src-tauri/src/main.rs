use tauri::Manager;
use window_vibrancy::*;

mod commands; 
mod services; 
mod models;    

use commands::layout_commands::{get_layout_settings, save_layout_settings};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_layout_settings,
            save_layout_settings
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            window_vibrancy::apply_vibrancy(
                &window,
                NSVisualEffectMaterial::UnderWindowBackground,
                None,
                Some(16.0)
            ).expect("Unsupported platform!");

            #[cfg(target_os = "windows")]
            window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform!");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}