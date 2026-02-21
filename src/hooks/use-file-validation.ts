import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../contexts/FileSystemContext';
import { findFirstFileId, findNodeById } from '../lib/file-tree';
import { getLastOpenedFile, setLastOpenedFile } from '../utils/last-opened';

export function useFileValidation(spaceId: string | undefined, fileId: string | undefined): void {
  const navigate = useNavigate();
  const { getNode, fileTree, activeSpaceId, isLoading, spaces } = useFileSystem();

  useEffect(() => {
    if (isLoading || !fileId) {
      return;
    }

    const resolvedSpaceId = spaceId || activeSpaceId;
    if (!resolvedSpaceId) {
      navigate({ to: '/' });
      return;
    }

    const requestedSpaceExists = spaces.some((space) => space.id === resolvedSpaceId);
    if (!requestedSpaceExists) {
      const fallbackSpaceId = activeSpaceId || spaces[0]?.id;
      if (!fallbackSpaceId) {
        navigate({ to: '/' });
        return;
      }

      const fallbackSpace = spaces.find((space) => space.id === fallbackSpaceId);
      const firstFileId = findFirstFileId(fallbackSpace?.fileTree ?? []);
      if (firstFileId) {
        navigate({
          to: '/spaces/$spaceId/files/$fileId',
          params: { spaceId: fallbackSpaceId, fileId: firstFileId },
        });
        return;
      }

      navigate({ to: '/spaces/$spaceId', params: { spaceId: fallbackSpaceId } });
      return;
    }

    if (spaceId && spaceId !== activeSpaceId) {
      return;
    }

    const file = getNode(fileId);

    if (file) {
      setLastOpenedFile(resolvedSpaceId, fileId);
      return;
    }

    const fileExistsInTree = findNodeById(fileTree, fileId);
    
    if (!fileExistsInTree) {
      const lastOpenedFileId = getLastOpenedFile(resolvedSpaceId);
      
      if (lastOpenedFileId && findNodeById(fileTree, lastOpenedFileId) && lastOpenedFileId !== fileId) {
        navigate({
          to: '/spaces/$spaceId/files/$fileId',
          params: { spaceId: resolvedSpaceId, fileId: lastOpenedFileId },
        });
        return;
      }

      const firstAvailableId = findFirstFileId(fileTree);
      if (firstAvailableId && firstAvailableId !== fileId) {
        navigate({
          to: '/spaces/$spaceId/files/$fileId',
          params: { spaceId: resolvedSpaceId, fileId: firstAvailableId },
        });
        setLastOpenedFile(resolvedSpaceId, firstAvailableId);
      } else {
        navigate({ to: '/spaces/$spaceId', params: { spaceId: resolvedSpaceId } });
      }
    }
  }, [fileId, isLoading, activeSpaceId, fileTree, getNode, navigate, spaceId, spaces]);
}
