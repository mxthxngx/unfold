use sqlx::SqlitePool;

pub async fn node_exists(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    node_id: &str,
    space_id: &str,
) -> Result<bool, String> {
    let exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM nodes WHERE id = ?1 AND space_id = ?2",
    )
    .bind(node_id)
    .bind(space_id)
    .fetch_one(&mut **tx)
    .await
    .map_err(|e| e.to_string())?;
    Ok(exists > 0)
}

pub async fn node_exists_pool(
    pool: &SqlitePool,
    node_id: &str,
    space_id: &str,
) -> Result<bool, String> {
    let exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM nodes WHERE id = ?1 AND space_id = ?2",
    )
    .bind(node_id)
    .bind(space_id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(exists > 0)
}

pub async fn get_ordered_node_ids(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    space_id: &str,
    parent_id: Option<&str>,
) -> Result<Vec<String>, String> {
    if let Some(pid) = parent_id {
        sqlx::query_scalar::<_, String>(
            "SELECT id FROM nodes WHERE space_id = ?1 AND parent_id = ?2 ORDER BY sort_order ASC, name ASC",
        )
        .bind(space_id)
        .bind(pid)
        .fetch_all(&mut **tx)
        .await
        .map_err(|e| e.to_string())
    } else {
        sqlx::query_scalar::<_, String>(
            "SELECT id FROM nodes WHERE space_id = ?1 AND parent_id IS NULL ORDER BY sort_order ASC, name ASC",
        )
        .bind(space_id)
        .fetch_all(&mut **tx)
        .await
        .map_err(|e| e.to_string())
    }
}


pub async fn delete_nodes_batch(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    space_id: &str,
    node_ids: &[String],
) -> Result<(), String> {
    if node_ids.is_empty() {
        return Ok(());
    }

    let placeholders = (0..node_ids.len()).map(|_| "?").collect::<Vec<_>>().join(", ");
    let query_str = format!(
        "DELETE FROM nodes WHERE id IN ({}) AND space_id = ?",
        placeholders
    );

    let mut query = sqlx::query(&query_str).bind(space_id);
    for id in node_ids {
        query = query.bind(id);
    }

    query
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
