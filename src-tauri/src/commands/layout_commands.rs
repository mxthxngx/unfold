use crate::models::layout::Layout;
use crate::services::layout_service::{load_user_layout, save_user_layout};

/// Gets the user layout settings from AppData, or returns default if not saved yet
#[tauri::command]
pub fn get_layout_settings(app: tauri::AppHandle) -> Result<Layout, String> {
    load_user_layout(&app)
}

/// Saves user layout configuration to AppData.
#[tauri::command]
pub fn save_layout_settings(app: tauri::AppHandle, layout: Layout) -> Result<(), String> {
    save_user_layout(&app, &layout)?;
    println!("Saved layout settings: {:?}", layout);
    Ok(())
}
