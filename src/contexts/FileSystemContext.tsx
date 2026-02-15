import React from 'react';

import {
  useFileSystemStore,
  useInitializeWorkspaceSelection,
  type FileSystemState,
} from '@/store/hooks/use-filesystem-store';

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  useInitializeWorkspaceSelection();
  return <>{children}</>;
}

export function useFileSystem(): FileSystemState {
  return useFileSystemStore();
}
