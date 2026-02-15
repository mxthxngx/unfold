import React from 'react';

import {
  useThemeBootstrap,
  useThemeStore,
} from '@/store/hooks/use-theme-store';
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ResolvedTheme,
} from '@/store/theme';

export { THEME_STORAGE_KEY };
export type { ThemePreference, ResolvedTheme };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useThemeBootstrap();
  return <>{children}</>;
}

export function useTheme() {
  return useThemeStore();
}
