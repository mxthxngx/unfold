import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectThemePreference } from '@/store/selectors';
import { setThemePreference } from '@/store/slices/ui-slice';
import {
  ThemePreference,
  ResolvedTheme,
  applyResolvedTheme,
  getSystemTheme,
  resolveTheme,
} from '@/store/theme';

interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

function useResolvedTheme(theme: ThemePreference): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return resolveTheme(theme, systemTheme);
}

export function useThemeStore(): ThemeState {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectThemePreference);
  const resolvedTheme = useResolvedTheme(theme);

  const setTheme = useCallback(
    (nextTheme: ThemePreference) => {
      dispatch(setThemePreference(nextTheme));
    },
    [dispatch],
  );

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}

export function useThemeBootstrap(): void {
  const { resolvedTheme } = useThemeStore();
  const hasInitializedRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (hasInitializedRef.current) {
      const root = document.documentElement;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        root.classList.add('theme-animating');

        if (transitionTimerRef.current !== null) {
          window.clearTimeout(transitionTimerRef.current);
        }

        transitionTimerRef.current = window.setTimeout(() => {
          root.classList.remove('theme-animating');
          transitionTimerRef.current = null;
        }, 280);
      }
    }

    applyResolvedTheme(resolvedTheme);
    hasInitializedRef.current = true;
  }, [resolvedTheme]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);
}
