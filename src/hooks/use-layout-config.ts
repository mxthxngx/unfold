import { useState, useEffect } from 'react';
import { Layout } from '@/types/layout';
import { getLayoutSettings, updateLayoutSettings, DEFAULT_SETTINGS } from '@/services/settings-store';

interface UseLayoutConfigReturn {
  layout: Layout | null;
  isLoading: boolean;
  error: string | null;
  saveLayout: (updates: Partial<Layout>) => Promise<void>;
}

/**
 * Hook to load and manage layout configuration using the Tauri Store plugin.
 * Loads the layout settings on mount and provides methods to update them.
 */
export const useLayoutConfig = (): UseLayoutConfigReturn => {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load layout settings on mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const layoutSettings = await getLayoutSettings();
        setLayout(layoutSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load layout settings');
        // Fall back to default settings
        setLayout(DEFAULT_SETTINGS.layout);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  // Save layout settings
  const saveLayout = async (updates: Partial<Layout>) => {
    try {
      const updatedLayout = await updateLayoutSettings(updates);
      setLayout(updatedLayout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout settings');
      throw err;
    }
  };

  return {
    layout,
    isLoading,
    error,
    saveLayout,
  };
};
