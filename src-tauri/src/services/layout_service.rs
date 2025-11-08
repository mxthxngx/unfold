use crate::models::layout::Layout;
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

/// Load user layout settings from AppData, or return default if not found
pub fn load_user_layout(app: &tauri::AppHandle) -> Result<Layout, String> {
    let config_dir = get_user_config_dir(app)?;
    let user_settings_path = config_dir.join("layout-settings.json");
    
    // If user settings don't exist, return Layout::default()
    if !user_settings_path.exists() {
        return Ok(Layout::default());
    }
    
    let content = fs::read_to_string(&user_settings_path)
        .map_err(|e| format!("Failed to read user layout settings: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse user layout settings: {}", e))
}

/// Save user layout settings to AppData
pub fn save_user_layout(app: &tauri::AppHandle, layout: &Layout) -> Result<(), String> {
    let config_dir = get_user_config_dir(app)?;
    let user_settings_path = config_dir.join("layout-settings.json");
    
    let json = serde_json::to_string_pretty(layout)
        .map_err(|e| format!("Failed to serialize layout: {}", e))?;
    
    fs::write(&user_settings_path, json)
        .map_err(|e| format!("Failed to save user layout settings: {}", e))?;
    
    Ok(())
}
