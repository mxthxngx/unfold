import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { findFirstFileId } from "@/lib/file-tree";
import { getLastOpenedFile, setLastOpenedFile } from "@/utils/last-opened";
import TitleEditor from "./title-editor";
import PageEditor from "./page-editor";
import { EditorSkeleton } from "./editor-skeleton";

function FullPageEditor() {
  const { fileId } = useParams({ from: "/files/$fileId" });
  const navigate = useNavigate();
  const { getNode, fileTree, activeSpaceId, isLoading } = useFileSystem();
  const file = fileId ? getNode(fileId) : null;
  const [isSwitching, setIsSwitching] = useState(false);
  const previousFileIdRef = useRef<string | undefined>(fileId);

  useEffect(() => {
    if (previousFileIdRef.current !== undefined && previousFileIdRef.current !== fileId) {
      if (!file) {
        setIsSwitching(true);
        const timer = setTimeout(() => {
          setIsSwitching(false);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    previousFileIdRef.current = fileId;
  }, [fileId, file]);

  useEffect(()=>{
    if(isLoading) return;
    
    if(file && fileId)
    {
      setLastOpenedFile(activeSpaceId, fileId);
      return () => {};
    }

    if(!file && fileId)
    {
      const nodeExists = (nodes: typeof fileTree, id: string): boolean => {
        for (const node of nodes) {
          if (node.id === id) return true;
          if (node.nodes && nodeExists(node.nodes, id)) return true;
        }
        return false;
      };

      const timeoutId = setTimeout(() => {
        const currentFile = getNode(fileId);
        if (!currentFile && !nodeExists(fileTree, fileId)) {
          const lastOpenedFileId = getLastOpenedFile(activeSpaceId);
          
          if(lastOpenedFileId && lastOpenedFileId !== fileId)
          {
            navigate({ to: "/files/$fileId", params: { fileId: lastOpenedFileId } });
          }
          else 
          {
            const firstAvailableId = findFirstFileId(fileTree);
            if (firstAvailableId && firstAvailableId !== fileId) {
              navigate({ to: "/files/$fileId", params: { fileId: firstAvailableId } });
              setLastOpenedFile(activeSpaceId, firstAvailableId);
            } else {
              navigate({ to: "/" });
            }
          }
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  },[fileId, isLoading, activeSpaceId, fileTree, navigate, file, getNode])

  if (isSwitching && fileId && !file) {
    return <EditorSkeleton />;
  }

  return (
    <div className="relative w-full">
      <TitleEditor fileId={fileId} />
      <PageEditor fileId={fileId} />
    </div>
  );
}

export default FullPageEditor;


