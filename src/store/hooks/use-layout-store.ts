import { useCallback } from 'react';

import { useGetLayoutQuery, useUpdateLayoutMutation } from '@/store/api/app-api';
import { DEFAULT_SETTINGS } from '@/services/settings-store';
import { Layout } from '@/types/layout';

interface UseLayoutStoreResult {
  layout: Layout;
  updateLayout: (updates: Partial<Layout>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLayoutStore(): UseLayoutStoreResult {
  const {
    data: layout = DEFAULT_SETTINGS.layout,
    isLoading,
    isFetching,
    error,
  } = useGetLayoutQuery();

  const [updateLayoutMutation] = useUpdateLayoutMutation();

  const updateLayout = useCallback(
    async (updates: Partial<Layout>) => {
      await updateLayoutMutation(updates).unwrap();
    },
    [updateLayoutMutation],
  );

  const message =
    error && 'message' in error && typeof error.message === 'string'
      ? error.message
      : null;

  return {
    layout,
    updateLayout,
    isLoading: isLoading || isFetching,
    error: message,
  };
}
