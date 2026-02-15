import React from 'react';

import { useEditorRegistry } from '@/store/hooks/use-editor-registry';

export function EditorProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useEditorContext() {
  return useEditorRegistry();
}
