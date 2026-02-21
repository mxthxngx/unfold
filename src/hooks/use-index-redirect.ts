import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../contexts/FileSystemContext';
import { findFirstFileId, findNodeById } from '../lib/file-tree';
import { getLastOpenedFile } from '../utils/last-opened';

export function useIndexRedirect(routeSpaceId?: string): void {
  const { fileTree, activeSpaceId, isLoading } = useFileSystem();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !activeSpaceId) return;
    if (routeSpaceId && routeSpaceId !== activeSpaceId) return;

    const savedFileId = getLastOpenedFile(activeSpaceId);
    const savedFileExists = savedFileId ? findNodeById(fileTree, savedFileId) : false;
    const firstFileId = findFirstFileId(fileTree);
    const targetFileId = savedFileExists ? savedFileId : firstFileId;

    if (targetFileId) {
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: activeSpaceId, fileId: targetFileId },
      });
    }
  }, [navigate, activeSpaceId, fileTree, isLoading, routeSpaceId]);
}
