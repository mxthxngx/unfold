use crate::models::layout::Layout;
use crate::services::layout_service::{load_layout, merge_layout, ensure_custom_layout_exists};
use std::fs;
use tauri::command;

#[tauri::command]
pub fn get_final_layout() -> Layout {
    ensure_custom_layout_exists();

    let default_layout = load_layout("src-tauri/config/default-layout.json");
    let custom_layout = load_layout("src-tauri/config/custom-layout.json");

    merge_layout(default_layout, custom_layout)
}

#[tauri::command]
pub fn save_custom_layout(layout: Layout) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&layout).map_err(|e| e.to_string())?;
    fs::write("src-tauri/config/custom-layout.json", json)
        .map_err(|e| e.to_string())?;
    Ok(())
}