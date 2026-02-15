import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '../contexts/FileSystemContext';
import { findFirstFileId, findNodeById } from '../lib/file-tree';
import { getLastOpenedFile, setLastOpenedFile } from '../utils/last-opened';

export function useFileValidation(fileId: string | undefined): void {
  const navigate = useNavigate();
  const { getNode, fileTree, activeSpaceId, isLoading } = useFileSystem();

  useEffect(() => {
    if (isLoading || !fileId) return;

    const file = getNode(fileId);

    if (file) {
      setLastOpenedFile(activeSpaceId, fileId);
      return;
    }

    const fileExistsInTree = findNodeById(fileTree, fileId);
    
    if (!fileExistsInTree) {
      const lastOpenedFileId = getLastOpenedFile(activeSpaceId);
      
      if (lastOpenedFileId && findNodeById(fileTree, lastOpenedFileId) && lastOpenedFileId !== fileId) {
        navigate({ to: '/files/$fileId', params: { fileId: lastOpenedFileId } });
        return;
      }

      const firstAvailableId = findFirstFileId(fileTree);
      if (firstAvailableId && firstAvailableId !== fileId) {
        navigate({ to: '/files/$fileId', params: { fileId: firstAvailableId } });
        setLastOpenedFile(activeSpaceId, firstAvailableId);
      } else {
        navigate({ to: '/' });
      }
    }
  }, [fileId, isLoading, activeSpaceId, fileTree, navigate, getNode]);
}
