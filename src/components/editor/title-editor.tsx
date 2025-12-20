import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";
import { mergeAttributes } from "@tiptap/core";
import { useEditorContext } from "@/contexts/EditorContext";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { editorClasses } from "./styles/extension-styles";
import "./styles/title-editor.css";

const TitleDocument = Document.extend({
  content: "heading",
});

const TitleHeading = Heading.extend({
  renderHTML({ HTMLAttributes }) {
    return ["h1", mergeAttributes(HTMLAttributes, { class: editorClasses.documentTitle }), 0];
  },
}).configure({
  levels: [1],
});

interface TitleEditorProps {
  fileId: string;
}

function TitleEditor({ fileId }: TitleEditorProps) {
  const { setTitleEditor, focusPageEditor } = useEditorContext();
  const { getNode, renameNode } = useFileSystem();
  const file = getNode(fileId);
  const lastSavedRef = useRef<string>(file?.name || "");
  const currentFileIdRef = useRef<string>(fileId);

  const editor = useEditor({
    extensions: [
      TitleDocument,
      TitleHeading,
      Placeholder.configure({
        placeholder: "new Page",
        showOnlyWhenEditable: false,
      }),
      Text,
    ],
    content: file?.name || "",
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText().trim();
      if (text !== lastSavedRef.current) {
        lastSavedRef.current = text;
        renameNode(fileId, text);
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none bg-transparent border-none px-6 text-foreground title-editor-content",
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.isComposing || event.keyCode === 229) return false;

          const { $head } = view.state.selection;
          const isAtEnd = !$head.nodeAfter;

          if (event.key === "Enter" && !event.shiftKey && isAtEnd) {
            event.preventDefault();
            focusPageEditor("start");
            return true;
          }

          if ((event.key === "ArrowDown" || event.key === "ArrowRight") && isAtEnd) {
            event.preventDefault();
            focusPageEditor("start");
            return true;
          }

          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (editor) {
      setTitleEditor(editor);
    }
    return () => setTitleEditor(null);
  }, [editor, setTitleEditor]);

  useEffect(() => {
    if (!editor || fileId === currentFileIdRef.current) return;
    
    currentFileIdRef.current = fileId;
    const currentFile = getNode(fileId);
    const name = currentFile?.name || "";
    
    editor.commands.setContent(name);
    lastSavedRef.current = name;

    if (!name.trim()) {
      editor.commands.focus("start");
    }
  }, [fileId, editor, getNode]);

  if (!editor) return null;

  return (
    <div className="w-full title-editor mb-5">
      <EditorContent editor={editor} />
    </div>
  );
}

export default TitleEditor;
