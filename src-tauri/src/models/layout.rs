use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layout {
    pub sidebar_position: Option<String>,
    pub margin_left: Option<u32>,
}
