import React, { ReactNode } from 'react';

import { Layout } from '@/types/layout';
import { useLayoutStore } from '@/store/hooks/use-layout-store';

export interface LayoutContextType {
  layout: Layout;
  updateLayout: (updates: Partial<Layout>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const LayoutProvider: React.FC<{
  children: ReactNode;
  initialLayout?: Layout;
  updateLayoutFn?: (updates: Partial<Layout>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}> = ({ children }) => {
  return <>{children}</>;
};

export const useLayout = (): LayoutContextType => {
  return useLayoutStore();
};
