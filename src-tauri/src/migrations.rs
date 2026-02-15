use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        // Create spaces table
        Migration {
            version: 1,
            description: "create_spaces_table",
            sql: "CREATE TABLE IF NOT EXISTS spaces (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            );",
            kind: MigrationKind::Up,
        },
        // Create nodes table
        Migration {
            version: 2,
            description: "create_nodes_table",
            sql: "CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY NOT NULL,
                space_id TEXT NOT NULL,
                parent_id TEXT,
                name TEXT NOT NULL,
                content TEXT,
                is_open INTEGER NOT NULL DEFAULT 0,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_nodes_space_id ON nodes(space_id);
            CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);",
            kind: MigrationKind::Up,
        },
        // Create images table
        Migration {
            version: 3,
            description: "create_images_table",
            sql: "CREATE TABLE IF NOT EXISTS images (
                id TEXT PRIMARY KEY NOT NULL,
                note_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                size TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_images_note_id ON images(note_id);
            CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);",
            kind: MigrationKind::Up,
        },
        // Insert default space
        Migration {
            version: 4,
            description: "insert_default_space",
            sql: "INSERT OR IGNORE INTO spaces (id, name, sort_order) VALUES ('default-space-mine', 'mine', 0);",
            kind: MigrationKind::Up,
        },
        // Add node edit timestamps
        Migration {
            version: 5,
            description: "add_node_timestamps",
            sql: "ALTER TABLE nodes ADD COLUMN created_at TEXT;
            ALTER TABLE nodes ADD COLUMN updated_at TEXT;
            UPDATE nodes
            SET created_at = COALESCE(created_at, datetime('now')),
                updated_at = COALESCE(updated_at, datetime('now'));
            CREATE TRIGGER IF NOT EXISTS nodes_set_timestamps_on_insert
            AFTER INSERT ON nodes
            FOR EACH ROW
            WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
            BEGIN
                UPDATE nodes
                SET created_at = COALESCE(NEW.created_at, datetime('now')),
                    updated_at = COALESCE(NEW.updated_at, datetime('now'))
                WHERE id = NEW.id;
            END;
            CREATE TRIGGER IF NOT EXISTS nodes_touch_updated_at
            AFTER UPDATE OF name, content ON nodes
            FOR EACH ROW
            BEGIN
                UPDATE nodes
                SET updated_at = datetime('now')
                WHERE id = NEW.id;
            END;",
            kind: MigrationKind::Up,
        },
    ]
}
