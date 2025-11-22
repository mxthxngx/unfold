use crate::models::settings::Settings;
use crate::services::settings_service::{load_user_settings, save_user_settings};

/// Gets the user settings from AppData, or returns default if not saved yet
#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    load_user_settings(&app)
}

/// Saves user settings configuration to AppData.
#[tauri::command]
pub fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    save_user_settings(&app, &settings)?;
    println!("Saved settings: {:?}", settings);
    Ok(())
}
