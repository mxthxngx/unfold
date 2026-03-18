import { RouterProvider } from '@tanstack/react-router';

import { GlobalSelectionHighlighter } from '@/components/common/global-selection-highlighter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useThemeBootstrap } from '@/store/hooks/use-theme-store';
import { router } from '@/router';
import { store } from '@/store';

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