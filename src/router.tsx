import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import FullPageEditor from './components/editor/full-page-editor';
import EditorLayout from './layout/editor-layout';
import { IndexPage } from './components/index/index-page';

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

const fileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'files/$fileId',
  component: FullPageEditor,
});

const routeTree = rootRoute.addChildren([indexRoute, fileRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
