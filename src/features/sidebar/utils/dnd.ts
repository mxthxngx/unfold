/** Droppable id for the root notes section. */
export const DROPPABLE_NOTES_SECTION_ID = 'notes-section';

/** Droppable id for the pinned section. */
export const DROPPABLE_PINNED_SECTION_ID = 'pinned-section';

/**
 * Normalizes dnd-kit source/target ids to a non-empty string.
 */
export const toOperationId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

/**
 * Returns true when a drag target id belongs to the pinned section.
 */
export const isPinnedDropTargetId = (id: string): boolean => {
  return id.startsWith(DROPPABLE_PINNED_SECTION_ID);
};
