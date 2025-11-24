use tauri::Manager;
use window_vibrancy::*;

mod commands; 
mod services; 
mod models;    

use commands::layout_commands::{get_layout_settings, save_layout_settings};
use commands::settings_commands::{get_settings, save_settings};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_layout_settings,
            save_layout_settings,
            get_settings,
            save_settings
        ])
        .setup(|app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}