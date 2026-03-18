import { RouterProvider } from '@tanstack/react-router';

import { GlobalSelectionHighlighter } from '@/features/editor/components/global-selection-highlighter';
import { SidebarProvider } from '@/ui/sidebar/sidebar';
import { useThemeBootstrap } from '@/core/theme/use-theme-store';
import { router } from '@/router';
import { store } from '@/core/store';

function App() {
  useThemeBootstrap();

  return (
    <>
      <GlobalSelectionHighlighter />
      <SidebarProvider defaultOpen={true}>
        <RouterProvider router={router} context={{ store }} />
      </SidebarProvider>
    </>
  );
}

export default App;