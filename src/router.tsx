import { useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import FullPageEditor from './components/editor/full-page-editor';
import { EditorSkeleton } from './components/editor/editor-skeleton';
import EditorLayout from './layout/editor-layout';
import { IndexPage } from './components/index/index-page';
import { useFileSystem } from './contexts/FileSystemContext';
import { findFirstFileId, findNodeById } from './lib/file-tree';

function LegacyFileRouteRedirect() {
  const { fileId } = useParams({ from: '/files/$fileId' });
  const navigate = useNavigate();
  const { spaces, activeSpaceId, isLoading } = useFileSystem();

  useEffect(() => {
    if (isLoading || !fileId) {
      return;
    }

    const ownerSpace = spaces.find((space) => findNodeById(space.fileTree, fileId));

    if (ownerSpace) {
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: ownerSpace.id, fileId },
        replace: true,
      });
      return;
    }

    const fallbackSpaceId = activeSpaceId || spaces[0]?.id;
    if (!fallbackSpaceId) {
      navigate({ to: '/', replace: true });
      return;
    }

    const fallbackSpace = spaces.find((space) => space.id === fallbackSpaceId);
    const fallbackFileId = findFirstFileId(fallbackSpace?.fileTree ?? []);
    if (fallbackFileId) {
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: fallbackSpaceId, fileId: fallbackFileId },
        replace: true,
      });
      return;
    }

    navigate({
      to: '/spaces/$spaceId',
      params: { spaceId: fallbackSpaceId },
      replace: true,
    });
  }, [activeSpaceId, fileId, isLoading, navigate, spaces]);

  return <EditorSkeleton />;
}

const rootRoute = createRootRoute({
  component: () => (
    <EditorLayout>
      <Outlet />
    </EditorLayout>
  ),
  notFoundComponent: IndexPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

const spaceIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'spaces/$spaceId',
  component: IndexPage,
});

const fileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'spaces/$spaceId/files/$fileId',
  component: FullPageEditor,
});

const legacyFileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'files/$fileId',
  component: LegacyFileRouteRedirect,
});

const routeTree = rootRoute.addChildren([indexRoute, spaceIndexRoute, fileRoute, legacyFileRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
