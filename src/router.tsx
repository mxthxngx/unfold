import { createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import Editor from './components/editor/editor';
import EditorLayout from './layout/editor-layout';
import { useFileSystem } from './contexts/FileSystemContext';
import { useEffect } from 'react';

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <EditorLayout>
      <Outlet />
    </EditorLayout>
  ),
});

function IndexRedirect() {
  const { fileTree } = useFileSystem();
  const navigate = useNavigate();

  useEffect(() => {
    const findFirstNode = (nodes: any[]): string | null => {
      if (nodes.length === 0) return null;
      return nodes[0].id;
    };

    const firstId = findFirstNode(fileTree);
    if (firstId) {
      navigate({ to: '/files/$fileId', params: { fileId: firstId } });
    }
  }, [fileTree, navigate]);

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a file to start editing
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
