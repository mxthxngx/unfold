import { useState, useEffect } from 'react';
import { Layout } from '@/types/layout';
import invoke from '@/utils/invoke';

interface UseLayoutConfigReturn {
  layout: Layout | null;
  isLoading: boolean;
  error: string | null;
  saveLayout: (updates: Partial<Layout>) => Promise<void>;
}

/**
 * Hook to load and manage layout configuration from the Tauri backend.
 * Loads the merged layout settings (default + custom) on mount.
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
        const layoutSettings = await invoke('get_layout_settings', {});
        setLayout(layoutSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load layout settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  // Save layout settings
  const saveLayout = async (updates: Partial<Layout>) => {
    try {
      const updatedLayout = { ...layout, ...updates } as Layout;
      await invoke('save_layout_settings', { layout: updatedLayout });
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
