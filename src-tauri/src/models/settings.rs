use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keybindings {
    #[serde(rename = "toggleSidebar")]
    pub toggle_sidebar: String,
    #[serde(rename = "selectAll")]
    pub select_all: String,
}

impl Default for Keybindings {
    fn default() -> Self {
        Keybindings {
            toggle_sidebar: "Mod-b".to_string(),
            select_all: "Mod-a".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default)]
    pub keybindings: Keybindings,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            keybindings: Keybindings::default(),
        }
    }
}
