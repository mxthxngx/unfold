import { useNavigate } from '@tanstack/react-router';
import { useFileSystemStore as useFileSystem } from '@/core/store/hooks/use-filesystem-store';
import { useAppDispatch } from '@/core/store/hooks';
import { setPendingFileId } from '@/core/store/slices/ui-slice';
import { EmptyState } from './empty-state';

export function IndexPage() {
  const { fileTree, addNode } = useFileSystem();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleCreateFile = async () => {
    const createdNode = await addNode(null);
    if (!createdNode) {
      return;
    }

    dispatch(setPendingFileId(createdNode.id));
    navigate({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: createdNode.spaceId, fileId: createdNode.id },
    });
  };

  const hasFiles = fileTree.length > 0;

  return (
    <div className="flex w-full min-h-[calc(100svh-5.75rem)] items-end justify-start pl-6 pb-16 text-muted-foreground">
      {hasFiles ? null : (
        <EmptyState onCreateFile={handleCreateFile} />
      )}
    </div>
  );
}
