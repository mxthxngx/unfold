import "./App.css";
import { useLayoutConfig } from "./hooks/use-layout-config";
import { LayoutProvider } from "./contexts/LayoutContext";
import Editor from "./components/editor/editor";
import EditorLayout from "./layout/editor-layout";

function AppContent() {
  return (
    <EditorLayout>
      <Editor />
    </EditorLayout>
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
          <div className="text-lg font-semibold mb-2 text-red-400">Error Loading Layout</div>
          <div className="text-sm text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  const initialLayout = layout || { sidebar_position: 'right' };

  return (
    <LayoutProvider
      initialLayout={initialLayout}
      updateLayoutFn={saveLayout}
      isLoading={isLoading}
      error={error}
    >
      <AppContent />
    </LayoutProvider>
  );
}

function App() {
  return <LayoutInitializer />;
}

export default App;