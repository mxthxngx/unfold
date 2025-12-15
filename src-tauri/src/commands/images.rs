use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, command};
use std::path::PathBuf;
use std::fs;
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
    fs::write(&file_path, &image_data)
        .map_err(|e| format!("Failed to write image file: {}", e))?;

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
pub async fn get_image(
    app: AppHandle,
    attachment_id: String,
) -> Result<String, String> {
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
pub async fn delete_image(
    app: AppHandle,
    attachment_id: String,
) -> Result<(), String> {
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
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))?;

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
        rusqlite::params![id, note_id, filename, file_path, size.to_string(), mime_type],
    )
    .map_err(|e| format!("Failed to insert image metadata: {}", e))?;

    Ok(())
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
