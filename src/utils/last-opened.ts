/**
 * Utility functions for managing last opened files per space
 * Storage format: { [spaceId]: fileId }
 */

const STORAGE_KEY = 'lastopened';

export interface LastOpenedMap {
  [spaceId: string]: string;
}

/**
 * Get the last opened file map from localStorage
 */
export function getLastOpenedMap(): LastOpenedMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Get the last opened file ID for a specific space
 */
export function getLastOpenedFile(spaceId: string): string | null {
  const map = getLastOpenedMap();
  return map[spaceId] || null;
}

/**
 * Set the last opened file for a specific space
 */
export function setLastOpenedFile(spaceId: string, fileId: string): void {
  const map = getLastOpenedMap();
  map[spaceId] = fileId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * Remove the last opened file for a specific space
 */
export function removeLastOpenedFile(spaceId: string): void {
  const map = getLastOpenedMap();
  delete map[spaceId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * Clear all last opened files
 */
export function clearLastOpenedFiles(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Debug function to log the current state
 */
export function debugLastOpened(): void {
  console.log('Last opened map:', getLastOpenedMap());
}
