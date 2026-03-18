export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'unfold-theme-preference';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system';
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(theme: ThemePreference, systemTheme = getSystemTheme()): ResolvedTheme {
  return theme === 'system' ? systemTheme : theme;
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const isLight = theme === 'light';

  root.classList.toggle('light', isLight);
  root.classList.toggle('dark', !isLight);
  root.style.colorScheme = isLight ? 'light' : 'dark';

  const colorSchemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', isLight ? 'light dark' : 'dark light');
  }
}
