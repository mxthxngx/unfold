import React, { createContext, useContext, ReactNode } from 'react';
import { Layout } from '@/types/layout';

interface LayoutContextType {
  layout: Layout;
  updateLayout: (updates: Partial<Layout>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{
  children: ReactNode;
  initialLayout: Layout;
  updateLayoutFn: (updates: Partial<Layout>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}> = ({
  children,
  initialLayout,
  updateLayoutFn,
  isLoading = false,
  error = null,
}) => {
  const [layout, setLayout] = React.useState<Layout>(initialLayout);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [contextError, setContextError] = React.useState<string | null>(error);

  const updateLayout = React.useCallback(
    async (updates: Partial<Layout>) => {
      try {
        setIsUpdating(true);
        setContextError(null);
        await updateLayoutFn(updates);
        setLayout((prev) => ({ ...prev, ...updates }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update layout';
        setContextError(errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateLayoutFn]
  );

  const value: LayoutContextType = {
    layout,
    updateLayout,
    isLoading: isLoading || isUpdating,
    error: contextError,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
