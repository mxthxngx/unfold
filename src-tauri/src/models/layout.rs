use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SidebarPosition {
    Left,
    Right,
}

impl Default for SidebarPosition {
    fn default() -> Self {
        SidebarPosition::Left
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layout {
    #[serde(default)]
    pub sidebar_position: Option<SidebarPosition>,
}

impl Default for Layout {
    fn default() -> Self {
        Layout {
            sidebar_position: Some(SidebarPosition::default()),
        }
    }
}
