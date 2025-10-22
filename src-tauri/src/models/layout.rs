use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Layout {
    sidebar_position: Option<String>,
    margin_left: Option<u32>,
}
