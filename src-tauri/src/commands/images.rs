use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager, command};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadImageRequest {
    note_id: String,
    file_name: String,
    base64_data: String,
    mime_type: String,
    size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadImageResponse {
    id: String,
    path: String,
    size: u64,
}

#[command]
pub async fn upload_image(
    app: AppHandle,
    request: UploadImageRequest,
) -> Result<UploadImageResponse, String> {
    // Decode base64 data
    use base64::Engine;
    let image_data = base64::engine::general_purpose::STANDARD
        .decode(&request.base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Get app local data directory
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Create images directory if it doesn't exist
    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    // Generate unique filename using UUID
    let file_extension = get_extension_from_mime(&request.mime_type);
    let unique_filename = format!("{}.{}", Uuid::new_v4(), file_extension);
    let file_path = images_dir.join(&unique_filename);

    // Write image data to file
    fs::write(&file_path, &image_data).map_err(|e| format!("Failed to write image file: {}", e))?;

    let attachment_id = Uuid::new_v4().to_string();
    let file_path_str = file_path
        .to_str()
        .ok_or("Failed to convert path to string")?
        .to_string();

    // Store metadata in database
    store_image_metadata(
        &app,
        &attachment_id,
        &request.note_id,
        &unique_filename,
        &file_path_str,
        request.size,
        &request.mime_type,
    )
    .await?;

    Ok(UploadImageResponse {
        id: attachment_id,
        path: file_path_str,
        size: request.size,
    })
}

#[command]
pub async fn get_image(app: AppHandle, attachment_id: String) -> Result<String, String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT file_path FROM images WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let path: String = stmt
        .query_row([&attachment_id], |row| row.get(0))
        .map_err(|e| format!("Failed to get image: {}", e))?;

    Ok(path)
}

#[command]
pub async fn delete_image(app: AppHandle, attachment_id: String) -> Result<(), String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Get file path before deleting from DB
    let mut stmt = conn
        .prepare("SELECT file_path FROM images WHERE id = ?1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let path: String = stmt
        .query_row([&attachment_id], |row| row.get(0))
        .map_err(|e| format!("Failed to get image: {}", e))?;

    // Delete from database
    conn.execute("DELETE FROM images WHERE id = ?1", [&attachment_id])
        .map_err(|e| format!("Failed to delete from database: {}", e))?;

    // Delete physical file
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;

    Ok(())
}

async fn store_image_metadata(
    app: &AppHandle,
    id: &str,
    note_id: &str,
    filename: &str,
    file_path: &str,
    size: u64,
    mime_type: &str,
) -> Result<(), String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    conn.execute(
        "INSERT INTO images (id, note_id, filename, file_path, size, mime_type, created_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))",
        rusqlite::params![
            id,
            note_id,
            filename,
            file_path,
            size.to_string(),
            mime_type
        ],
    )
    .map_err(|e| format!("Failed to insert image metadata: {}", e))?;

    Ok(())
}

#[command]
pub async fn check_database_schema(app: AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Check if images table exists and get its schema
    let table_info: Result<Vec<String>, _> =
        conn.prepare("PRAGMA table_info(images)")
            .and_then(|mut stmt| {
                let rows = stmt.query_map([], |row| {
                    let name: String = row.get(1)?;
                    Ok(name)
                })?;
                rows.collect()
            });

    match table_info {
        Ok(columns) => {
            let has_file_path = columns.iter().any(|col| col == "file_path");
            if has_file_path {
                Ok(format!(
                    "✓ Database schema is correct. DB at: {}",
                    db_path.display()
                ))
            } else {
                Ok(format!(
                    "✗ Images table exists but missing 'file_path' column.\nColumns: {:?}\nDB at: {}\n\nTo fix: Delete this database file and restart the app.",
                    columns,
                    db_path.display()
                ))
            }
        }
        Err(_) => Ok(format!(
            "✗ Images table does not exist.\nDB at: {}\n\nTo fix: Delete this database file and restart the app.",
            db_path.display()
        )),
    }
}

fn get_extension_from_mime(mime_type: &str) -> &str {
    match mime_type {
        "image/jpeg" => "jpg",
        "image/jpg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        "image/svg+xml" => "svg",
        "image/bmp" => "bmp",
        "image/tiff" => "tiff",
        _ => "jpg",
    }
}

#[command]
pub async fn check_nodes_schema(app: AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    let mut stmt = conn
        .prepare("PRAGMA table_info(nodes)")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let cols = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name)
        })
        .map_err(|e| format!("Failed to query schema: {}", e))?;

    let mut col_names: Vec<String> = Vec::new();
    for c in cols {
        col_names.push(c.map_err(|e| format!("Row error: {}", e))?);
    }

    let has_type = col_names.iter().any(|c| c == "type");
    Ok(format!(
        "nodes columns: {:?}\ncontains 'type': {}\nDB: {}",
        col_names,
        has_type,
        db_path.display()
    ))
}

#[command]
pub async fn repair_nodes_schema(app: AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("unfold.db");

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Check if 'type' column exists
    let mut stmt = conn
        .prepare("PRAGMA table_info(nodes)")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    let cols = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name)
        })
        .map_err(|e| format!("Failed to query schema: {}", e))?;
    let mut has_type = false;
    for c in cols {
        if c.map_err(|e| format!("Row error: {}", e))? == "type" {
            has_type = true;
            break;
        }
    }

    if !has_type {
        return Ok("nodes schema OK (no 'type' column)".into());
    }

    // Rebuild table without 'type' column
    let sql = r#"
        BEGIN TRANSACTION;
            CREATE TABLE IF NOT EXISTS nodes_new (
                id TEXT PRIMARY KEY NOT NULL,
                space_id TEXT NOT NULL,
                parent_id TEXT,
                name TEXT NOT NULL,
                content TEXT,
                is_open INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
            );
            INSERT INTO nodes_new (id, space_id, parent_id, name, content, is_open, sort_order)
                SELECT id, space_id, parent_id, name, content, is_open, sort_order FROM nodes;
            DROP TABLE nodes;
            ALTER TABLE nodes_new RENAME TO nodes;
            CREATE INDEX IF NOT EXISTS idx_nodes_space_id ON nodes(space_id);
            CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
        COMMIT;
    "#;

    conn.execute_batch(sql)
        .map_err(|e| format!("Failed to repair schema: {}", e))?;

    Ok("Repaired nodes schema (removed 'type' column)".into())
}
