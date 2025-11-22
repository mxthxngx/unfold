use crate::models::settings::Settings;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// Get the user config directory (AppData)
pub fn get_user_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = app.path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {}", e))?;
    
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;
    
    Ok(config_dir)
}

/// Load user settings from AppData, or return default if not found
pub fn load_user_settings(app: &tauri::AppHandle) -> Result<Settings, String> {
    let config_dir = get_user_config_dir(app)?;
    let user_settings_path = config_dir.join("settings.json");
    
    // If user settings don't exist, return Settings::default()
    if !user_settings_path.exists() {
        return Ok(Settings::default());
    }
    
    let content = fs::read_to_string(&user_settings_path)
        .map_err(|e| format!("Failed to read user settings: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse user settings: {}", e))
}

/// Save user settings to AppData
pub fn save_user_settings(app: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    let config_dir = get_user_config_dir(app)?;
    let user_settings_path = config_dir.join("settings.json");
    
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(&user_settings_path, json)
        .map_err(|e| format!("Failed to save user settings: {}", e))?;
    
    Ok(())
}
