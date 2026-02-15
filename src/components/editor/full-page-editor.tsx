import { useParams } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useFileValidation } from "@/hooks/use-file-validation";
import TitleEditor from "./title-editor";
import PageEditor from "./page-editor";
import { EditorSkeleton } from "./editor-skeleton";

function FullPageEditor() {
  const { fileId } = useParams({ from: "/files/$fileId" });
  const { getNode, isLoading } = useFileSystem();
  useFileValidation(fileId);

  if (isLoading) {
    return <EditorSkeleton />;
  }
  const file = fileId ? getNode(fileId) : null;
  if (fileId && !file) {
    return <EditorSkeleton />;
  }
  if (!fileId) {
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

