import React, { useEffect, useCallback, useMemo } from 'react';
import Sidebar from "@/features/sidebar/components/sidebar";
import { Toolbar } from "@/features/toolbar/components/toolbar";
import { dispatchAppEvent, APP_EVENTS } from '@/lib/app-events';
import { useLayoutStore } from '@/store/hooks/use-layout-store';
import { useParams } from '@tanstack/react-router';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { SearchBar } from '@/features/search/components/search-bar';
import { useEditorRegistry } from '@/store/hooks/use-editor-registry';
import { WorkspaceSkeleton } from '@/components/skeletons/workspace-skeleton';
import {
  useSyncActiveFileSelection,
  useSyncActiveSpaceSelection,
} from '@/store/hooks/use-filesystem-store';
import { useAppSelector } from '@/store/hooks';
import { selectActiveSpaceId } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customization-resolver';
import type { CustomizationPropertyKey } from '@/types/customization';

const APP_SCOPE_ID = 'app-default';

/* ─────────────────────────────────────────────────────────────────────────
   USER_PRIMITIVE_MAP — the single source of truth for customization injection.
   ─────────────────────────────────────────────────────────────────────────
   Each entry: [CustomizationPropertyKey, '--unfold-* CSS variable']

   One user preference → one Layer 1 primitive → all Layer 2 derivatives
   cascade automatically via var() references in semantic-dark / semantic-light.

   To add a new user-configurable property:
     1. Add the key to CustomizationPropertyKey       (types/customization.ts)
     2. Add a default in customization-defaults.ts      (config/)
     3. Add one line here.
   That's it — every component consuming the downstream semantic tokens responds.
   ───────────────────────────────────────────────────────────────────────── */
const USER_PRIMITIVE_MAP: Array<[CustomizationPropertyKey, string]> = [
  /* Typography families */
  ['body.fontFamily',    '--unfold-font-sans'],
  ['editor.fontFamily',  '--unfold-font-sans'],
  ['title.fontFamily',   '--unfold-font-display'],
  ['code.fontFamily',    '--unfold-font-mono'],
  ['h1.fontFamily',      '--unfold-font-display'],
  ['h2.fontFamily',      '--unfold-font-display'],
  ['h3.fontFamily',      '--unfold-font-display'],

  /* Editor type scale */
  ['editor.fontSize',    '--unfold-size-editor'],
  ['title.fontSize',     '--unfold-size-title'],
  ['code.fontSize',      '--unfold-size-code'],
  ['h1.fontSize',        '--unfold-size-h1'],
  ['h2.fontSize',        '--unfold-size-h2'],
  ['h3.fontSize',        '--unfold-size-h3'],

  /* Future color properties — just add a line here when the UI panel exists:
   * ['accent.color',    '--unfold-accent'],
   * ['bg.base',         '--unfold-bg'],
   * ['ui.radius',       '--unfold-radius'],
   */
];

function LoadingScreen() {
  return <WorkspaceSkeleton />;
}

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
  const { fileId, spaceId } = useParams({ strict: false });
  const { layout } = useLayoutStore();
  const { pageEditorRef } = useEditorRegistry();
  const { state: sidebarState, isMobile } = useSidebar();
  const customizationState = useAppSelector((state) => state.customization);
  const activeSpaceId = useAppSelector(selectActiveSpaceId);
  useSyncActiveSpaceSelection(spaceId ?? null);
  useSyncActiveFileSelection(fileId ?? null);

  useGlobalSidebarShortcuts();

  const sidebarPosition = layout.sidebar_position || 'left';

  const resolvedCustomization = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    const spaceSettings = customizationState.bySpaceId[activeSpaceId];
    return resolveCustomizationProperties(appSettings?.properties, spaceSettings?.properties);
  }, [activeSpaceId, customizationState.byThemeId, customizationState.bySpaceId]);

  const customizationStyles = useMemo(() => {
    const styles: Record<string, string> = {};

    for (const [key, cssVar] of USER_PRIMITIVE_MAP) {
      const value = resolvedCustomization[key]?.value;
      if (value === undefined) continue;
      styles[cssVar] = typeof value === 'number' ? `${value}px` : String(value);
    }

    return styles;
  }, [resolvedCustomization]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

    if (isFindShortcut) {
      e.preventDefault();
      const cursorPos = pageEditorRef.current?.state.selection.from ?? null;
      dispatchAppEvent(APP_EVENTS.OPEN_FIND_DIALOG, { cursorPos });
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  const handleEditorAreaMouseDown = useCallback(() => {
    dispatchAppEvent(APP_EVENTS.EDITOR_ACTIVATE_FILE);
  }, []);

  return (
    <div
      className="flex flex-col relative bg-background h-screen w-screen"
      data-tauri-drag-region
      style={customizationStyles as React.CSSProperties}
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
  const { isLoading: isLayoutLoading } = useLayoutStore();

  if (isLayoutLoading) {
    return <LoadingScreen />;
  }

  return <EditorLayoutContent>{children}</EditorLayoutContent>;
}

export default EditorLayout;
