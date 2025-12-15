mod commands;
mod migrations;

fn main() {
    let migrations = migrations::get_migrations();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:unfold.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::upload_image,
            commands::get_image,
            commands::delete_image,
            commands::check_database_schema,
            commands::check_nodes_schema,
            commands::repair_nodes_schema,
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
