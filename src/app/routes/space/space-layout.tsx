import * as React from 'react';

import { Titlebar } from '@/components/layouts/titlebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { COMMAND_IDS, useRegisterCommand } from '@/config/commands';
import { DEFAULT_SPACE_ID } from '@/config/spaces';
import { useConfig } from '@/config/use-config';
import { getUndoManager } from '@/core/undo/undo-manager';
import { SpaceSidebar } from '@/features/sidebar/components/space-sidebar';
import { useSidebarUndoActions } from '@/features/sidebar/hooks/use-sidebar-undo-actions';

export function SpaceLayout({ children }: { children: React.ReactNode }) {
  // state
  const { config } = useConfig();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { createNodeWithUndo } = useSidebarUndoActions();

  const sidebarPosition = config.sidebar.position;

  // handlers
  const handleToggleSidebarCommand = () => {
    setIsSidebarOpen((isOpen) => !isOpen);
  };

  const handleCreateRootFileCommand = () => {
    void createNodeWithUndo({
      spaceId: DEFAULT_SPACE_ID,
      parentId: null,
      name: 'new page',
    });
  };

  const handleUndoCommand = () => {
    void getUndoManager().undo();
  };

  const handleRedoCommand = () => {
    void getUndoManager().redo();
  };

  useRegisterCommand(COMMAND_IDS.sidebarToggle, handleToggleSidebarCommand);
  useRegisterCommand(COMMAND_IDS.fileNew, handleCreateRootFileCommand);
  useRegisterCommand(COMMAND_IDS.undo, handleUndoCommand);
  useRegisterCommand(COMMAND_IDS.redo, handleRedoCommand);

  // render
  const mainInset = (
    <SidebarInset
      className="min-h-0 min-w-0 overflow-y-auto"
      style={{
        flex: '0 0 var(--space-main-basis)',
        marginInlineStart: 'var(--space-main-offset-start)',
        marginInlineEnd: 'var(--space-main-offset-end)',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
    </SidebarInset>
  );

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      className="flex h-svh w-full flex-col"
      style={
        {
          '--sidebar-width': `${config.sidebar.width}px`,
          '--space-sidebar-offset': '1.25rem',
          '--space-main-basis': isSidebarOpen
            ? 'calc(100% - var(--sidebar-width) - var(--space-sidebar-offset))'
            : '100%',
          '--space-main-offset-start':
            isSidebarOpen && sidebarPosition === 'left'
              ? 'var(--space-sidebar-offset)'
              : '0px',
          '--space-main-offset-end':
            isSidebarOpen && sidebarPosition === 'right'
              ? 'var(--space-sidebar-offset)'
              : '0px',
        } as React.CSSProperties
      }
    >
      <Titlebar sidebarPosition={sidebarPosition} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {sidebarPosition === 'left' ? (
          <>
            <SpaceSidebar side={sidebarPosition} />
            {mainInset}
          </>
        ) : (
          <>
            {mainInset}
            <SpaceSidebar side={sidebarPosition} />
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
