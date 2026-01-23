import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useIndexRedirect } from '../../hooks/use-index-redirect';
import { EmptyState } from './empty-state';

/**
 * Index page component that handles redirection and displays appropriate UI
 * - Automatically redirects to the last opened file or first available file
 * - Shows empty state if no files exist
 * - Shows loading indicator while files are loading
 */
export function IndexPage() {
  const { fileTree, addNode, isLoading } = useFileSystem();
  const navigate = useNavigate();

  // Handle automatic redirection
  useIndexRedirect();

  const handleCreateFile = async () => {
    const newId = await addNode(null);
    navigate({ to: '/files/$fileId', params: { fileId: newId } });
  };

  if (isLoading) {
    return null;
  }

  const hasFiles = fileTree.length > 0;

  return (
    <div className="flex h-full w-full min-h-[calc(100vh-3rem)] items-center justify-start px-6 text-muted-foreground">
      {hasFiles ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
          <span className="inline-flex size-2 rounded-full bg-muted-foreground/60" />
          <span className="text-muted-foreground">select a file to start editing</span>
        </div>
      ) : (
        <EmptyState onCreateFile={handleCreateFile} />
      )}
    </div>
  );
}
