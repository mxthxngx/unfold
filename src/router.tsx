import { createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import Editor from './components/editor/editor';
import EditorLayout from './layout/editor-layout';
import { useFileSystem } from './contexts/FileSystemContext';
import { findFirstFileId } from './lib/file-tree';
import { Button } from './components/ui/button';

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <EditorLayout>
      <Outlet />
    </EditorLayout>
  ),
});

function IndexRedirect() {
  const { fileTree, addNode } = useFileSystem();
  const navigate = useNavigate();

  const firstFileId = useMemo(() => findFirstFileId(fileTree), [fileTree]);
  useEffect(() => {
    if (firstFileId) {
      navigate({ to: '/files/$fileId', params: { fileId: firstFileId } });
    }
  }, [firstFileId, navigate]);

  const handleCreateFile = () => {
    const newId = addNode(null);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  const hasFiles = fileTree.length > 0;

  return (
    <div className="flex h-full w-full min-h-[calc(100vh-3rem)] items-center justify-start px-6 text-muted-foreground">
      {hasFiles ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
          <span className="inline-flex size-2 rounded-full bg-muted-foreground/60" />
          <span className="text-muted-foreground">select a file to start editing</span>
        </div>
      ) : (
          <div className="space-y-1 flex flex-col gap-4 text-left max-w-md w-full">
            <div className="text-xl font-semibold text-foreground">start shaping your space</div>
            <p className="text-sm leading-relaxed text-muted-foreground">
            add your first note, idea, or wandering thought. <br/>there&apos;s no wrong way to begin
            </p>
            <Button
            onClick={handleCreateFile}
            variant="outline"
            size="lg"
            className="justify-start gap-2 px-3 py-2 text-sm font-semibold text-sidebar-foreground bg-sidebar-item-hover-bg/60 border border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80 w-fit"
          >
            add a file
          </Button>
          </div>

               )}
    </div>
  );
}

// Index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
});

// File route
const fileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'files/$fileId',
  component: Editor,
});

const routeTree = rootRoute.addChildren([indexRoute, fileRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
