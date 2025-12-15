// Database row types (match SQLite schema)

export interface SpaceRow {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NodeRow {
  id: string;
  space_id: string;
  parent_id: string | null;
  name: string;
  content: string; // TipTap JSON stored as string
  is_open: number; // SQLite stores booleans as 0/1
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Search result type
export interface SearchResult {
  id: string;
  space_id: string;
  name: string;
  content: string;
  snippet: string; // FTS5 snippet for highlighting
}

// Input types for creating/updating
export interface CreateSpaceInput {
  id: string;
  name: string;
  sort_order?: number;
}

export interface UpdateSpaceInput {
  name?: string;
  sort_order?: number;
}

export interface CreateNodeInput {
  id: string;
  space_id: string;
  parent_id?: string | null;
  name?: string;
  content?: string;
  is_open?: boolean;
  sort_order?: number;
}

export interface UpdateNodeInput {
  name?: string;
  content?: string;
  is_open?: boolean;
  sort_order?: number;
  parent_id?: string | null;
}

// Image metadata stored in SQLite
export interface ImageRow {
  id: string;
  note_id: string;
  filename: string;
  original_name: string;
  path: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface CreateImageInput {
  id: string;
  note_id: string;
  filename: string;
  original_name: string;
  path: string;
  size: number;
  mime_type: string;
}
