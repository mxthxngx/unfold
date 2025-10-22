use crate::models::layout::Layout;
use std::fs;
pub fn load_layout(path: &str) -> Layout {
    let content = fs::read_to_string(path).expect(&format!("Failed to read {}", path));
    serde_json::from_str(&content).expect(&format!("Failed to parse {}", path))
}
pub fn merge_layout(default: Layout, custom: Layout) -> Layout {
    Layout {
        sidebar_position: custom.sidebar_position.or(default.sidebar_position),
        margin_left: custom.margin_left.or(default.margin_left),
    }
}
pub fn ensure_custom_layout_exists() {
    let path = "src-tauri/resources/custom-layout.json";
    if !std::path::Path::new(path).exists() {
        fs::write(path, "{}").expect("Failed to create custom-layout.json");
    }
}
