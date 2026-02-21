import React, { useEffect, useCallback } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { useParams } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { SearchBar } from '@/components/search/search-bar';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditorContext } from '@/contexts/EditorContext';
import { WorkspaceSkeleton } from '@/components/skeletons/workspace-skeleton';
import {
  useSyncActiveFileSelection,
  useSyncActiveSpaceSelection,
} from '@/store/hooks/use-filesystem-store';

function LoadingScreen() {
  return <WorkspaceSkeleton />;
}

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
  const { fileId, spaceId } = useParams({ strict: false });
  const { layout } = useLayout();
  const { pageEditorRef } = useEditorContext();
  const { state: sidebarState, isMobile } = useSidebar();
  useSyncActiveSpaceSelection(spaceId ?? null);
  useSyncActiveFileSelection(fileId ?? null);

  useGlobalSidebarShortcuts();

  const sidebarPosition = layout.sidebar_position || 'left';

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

    if (isFindShortcut) {
      e.preventDefault();
      const cursorPos = pageEditorRef.current?.state.selection.from ?? null;
      document.dispatchEvent(new CustomEvent('openFindDialogFromEditor', {
        detail: { cursorPos },
      }));
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  const handleEditorAreaMouseDown = useCallback(() => {
    document.dispatchEvent(new CustomEvent('editor:activate-file'));
  }, []);

  return (
    <div
      className="flex flex-col relative bg-background h-screen w-screen"
      data-tauri-drag-region
    >
      {/* Top Toolbar */}
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar side={sidebarPosition} />

        <SidebarInset className="flex-1 relative bg-background">
          <div
            className={[
              'editor-scroll-stable flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent',
            ].join(' ')}
          >
            <div
              className={[
                'w-full max-w-5xl min-h-full px-6 pt-5 pb-8 mx-auto',
                'transform-gpu will-change-transform motion-reduce:transform-none',
                'transition-transform duration-500ms ease-[cubic-bezier(0.42,0,0.58,1)] motion-reduce:transition-none',
                !isMobile && sidebarState === 'expanded' && sidebarPosition === 'left'
                  ? 'editor-content-shift-left'
                  : '',
                !isMobile && sidebarState === 'expanded' && sidebarPosition === 'right'
                  ? 'editor-content-shift-right'
                  : '',
              ].join(' ')}
              onMouseDown={handleEditorAreaMouseDown}
            >
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>

      <SearchBar />
    </div>
  );
}

function EditorLayout({children}: {children?: React.ReactNode}) {
  const { isLoading: isLayoutLoading } = useLayout();
  const { isLoading } = useFileSystem();

  if (isLoading || isLayoutLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <EditorLayoutContent>
        {children}
      </EditorLayoutContent>
    </SidebarProvider>
  );
}

export default EditorLayout;
