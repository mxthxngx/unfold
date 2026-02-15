import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useIndexRedirect } from '../../hooks/use-index-redirect';
import { EmptyState } from './empty-state';

export function IndexPage() {
  const { fileTree, addNode, isLoading } = useFileSystem();
  const navigate = useNavigate();

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
    <div
      className={
        hasFiles
          ? 'flex w-full min-h-[calc(100svh-5.75rem)] items-start justify-start px-6 text-muted-foreground'
          : 'flex w-full min-h-[calc(100svh-5.75rem)] items-end justify-start px-6 pb-16 text-muted-foreground'
      }
    >
      {hasFiles ? null : (
        <div className="md:-translate-x-28 md:-translate-y-24">
          <EmptyState onCreateFile={handleCreateFile} />
        </div>
      )}
    </div>
  );
}
