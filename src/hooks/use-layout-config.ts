import { useCallback } from 'react';

import { Layout } from '@/types/layout';
import { useLayoutStore } from '@/store/hooks/use-layout-store';

interface UseLayoutConfigReturn {
  layout: Layout | null;
  isLoading: boolean;
  error: string | null;
  saveLayout: (updates: Partial<Layout>) => Promise<void>;
}

export const useLayoutConfig = (): UseLayoutConfigReturn => {
  const { layout, isLoading, error, updateLayout } = useLayoutStore();

  const saveLayout = useCallback(
    async (updates: Partial<Layout>) => {
      await updateLayout(updates);
    },
    [updateLayout],
  );

  return {
    layout,
    isLoading,
    error,
    saveLayout,
  };
};
