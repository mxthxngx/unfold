import { useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { findFirstFileId } from "@/lib/file-tree";
import TitleEditor from "./title-editor";
import PageEditor from "./page-editor";

function FullPageEditor() {
  const { fileId } = useParams({ from: "/files/$fileId" });
  const navigate = useNavigate();
  const { getNode, fileTree, activeSpaceId, isLoading } = useFileSystem();
  const file = fileId ? getNode(fileId) : null;

  useEffect(() => {
    if (fileId && activeSpaceId) {
      localStorage.setItem(`lastOpenedFile_${activeSpaceId}`, fileId);
    }
  }, [fileId, activeSpaceId]);

  useEffect(() => {
    if (isLoading || !fileId) return;
    
    if (!file) {
      const firstAvailableId = findFirstFileId(fileTree);
      if (firstAvailableId) {
        navigate({ to: "/files/$fileId", params: { fileId: firstAvailableId } });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [fileId, file, fileTree, navigate, isLoading]);

  if (isLoading || !fileId || !file) {
    return null;
  }

  return (
    <div className="relative w-full">
      <TitleEditor fileId={fileId} />
      <PageEditor fileId={fileId} />
    </div>
  );
}

export default FullPageEditor;


