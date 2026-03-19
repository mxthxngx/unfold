import { useMemo } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';

import { paths } from '@/config/paths';

const SpaceHome = () => {
  return <div>Home</div>;
};

const SpaceOverviewRoute = () => {
  return <div>Select a node from the space.</div>;
};

const SpaceNodeRoute = () => {
  return <div>Node view</div>;
};

const NotFoundRoute = () => {
  return <div>Page not found.</div>;
};

const AppRoutesLayout = () => {
  return <AppRoot />;
};

export const createAppRouter = () =>
  createBrowserRouter([
    {
      element: <Outlet />,
      children: [
        {
          path: paths.space.path,
          element: <SpaceHome />,
        },
        {
          element: <AppRoutesLayout />,
          ErrorBoundary: AppRootErrorBoundary,
          children: [
            {
              path: paths.space.root.path,
              element: <SpaceOverviewRoute />,
            },
            {
              path: paths.space.node.path,
              element: <SpaceNodeRoute />,
            },
          ],
        },
        {
          path: '*',
          element: <NotFoundRoute />,
        },
      ],
    },
  ]);

export const AppRouter = () => {
  const router = useMemo(() => createAppRouter(), []);

  return <RouterProvider router={router} />;
};
