import "./App.css";
import { useLayoutConfig } from "./hooks/use-layout-config";
import { LayoutProvider } from "./contexts/LayoutContext";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import { EditorProvider } from "./contexts/EditorContext";
import { GlobalSelectionHighlighter } from "./components/common/global-selection-highlighter";

function AppContent() {
  return <AppRouter />;
}

function AppRouter() {
  return (
    <RouterProvider router={router} />
  );
}


function LayoutInitializer() {
  const { layout, isLoading, error, saveLayout } = useLayoutConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Configuration</div>
          <div className="text-sm text-muted-foreground">Setting up your layout...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2 text-destructive">Error Loading Layout</div>
          <div className="text-sm text-destructive/90">{error}</div>
        </div>
      </div>
    );
  }

  const initialLayout = layout || { sidebar_position: 'right' };

  return (
    <FileSystemProvider>
      <GlobalSelectionHighlighter />
      <EditorProvider>
        <LayoutProvider
          initialLayout={initialLayout}
          updateLayoutFn={saveLayout}
          isLoading={isLoading}
          error={error}
        >
          <AppContent />
        </LayoutProvider>
      </EditorProvider>
    </FileSystemProvider>
  );
}

function App() {
  return <LayoutInitializer />;
}

export default App;