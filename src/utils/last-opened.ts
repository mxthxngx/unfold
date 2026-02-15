const STORAGE_KEY = 'lastopened';

export type LastOpenedMap = Record<string, string>;

export function getLastOpenedMap(): LastOpenedMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? (parsed as LastOpenedMap) : {};
  } catch {
    return {};
  }
}

export function getLastOpenedFile(spaceId: string): string | null {
  const map = getLastOpenedMap();
  return map[spaceId] ?? null;
}

export function setLastOpenedFile(spaceId: string, fileId: string): void {
  const map = getLastOpenedMap();
  map[spaceId] = fileId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function removeLastOpenedFile(spaceId: string): void {
  const map = getLastOpenedMap();
  delete map[spaceId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function clearLastOpenedFiles(): void {
  localStorage.removeItem(STORAGE_KEY);
}
