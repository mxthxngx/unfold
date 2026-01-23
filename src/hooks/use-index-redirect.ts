import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../contexts/FileSystemContext';
import { findFirstFileId, findNodeById } from '../lib/file-tree';
import { getLastOpenedFile } from '../utils/last-opened';

/**
 * Custom hook that handles automatic redirection from the index route
 * to the appropriate file based on last opened file or first available file
 */
export function useIndexRedirect(): void {
  const { fileTree, activeSpaceId, isLoading } = useFileSystem();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    const savedFileId = getLastOpenedFile(activeSpaceId);
    const savedFileExists = savedFileId ? findNodeById(fileTree, savedFileId) : false;
    const firstFileId = findFirstFileId(fileTree);
    const targetFileId = savedFileExists ? savedFileId : firstFileId;

    if (targetFileId) {
      navigate({ to: '/files/$fileId', params: { fileId: targetFileId } });
    }
  }, [navigate, activeSpaceId, fileTree, isLoading]);
}
