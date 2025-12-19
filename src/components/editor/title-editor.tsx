import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useCallback } from "react";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import { useParams } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import "./styles/title-editor.css";
import Document from "@tiptap/extension-document";
import { editorClasses } from "./styles/extension-styles";
import { mergeAttributes } from "@tiptap/core";

// Document that only accepts a single heading
const TitleDocument = Document.extend({
  content: "heading",
});

// Custom heading with title styling
const TitleHeading = Heading.extend({
  renderHTML({ HTMLAttributes }) {
    return ["h1", mergeAttributes(HTMLAttributes, { class: editorClasses.documentTitle }), 0];
  },
}).configure({
  levels: [1],
});

interface TitleEditorProps {
  onEnterPress?: () => void;
  onArrowKeyPress?: () => void;
  onFocusRequest?: (focusTitleEditor: () => void) => void;
}

function TitleEditor({ onEnterPress, onArrowKeyPress, onFocusRequest }: TitleEditorProps) {
  const { fileId } = useParams({ from: "/files/$fileId" });
  const { getNode, renameNode, isLoading } = useFileSystem();
  const file = fileId ? getNode(fileId) : null;
  const lastSavedNameRef = useRef<string>("");
  const isContentLoadedRef = useRef<boolean>(false);
  const currentFileIdRef = useRef<string | undefined>(undefined);

  const saveName = useCallback(
    (id: string, name: string) => {
      if (!isContentLoadedRef.current) return;
      
      const trimmedName = name.trim();
      // If the name is empty, don't save "new page", just save empty string
      if (!trimmedName) {
        if (lastSavedNameRef.current !== "") {
          lastSavedNameRef.current = "";
          renameNode(id, "");
        }
        return;
      }
      
      if (trimmedName === lastSavedNameRef.current) return;
      
      lastSavedNameRef.current = trimmedName;
      renameNode(id, trimmedName);
    },
    [renameNode]
  );

  const editor = useEditor({
    extensions: [
      TitleDocument,
      TitleHeading,
      Placeholder.configure({
        placeholder: "New page",
        showOnlyWhenEditable: false,
      }),
      Text,
    ],
    content: file?.name || "",
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      if (fileId) {
        const textContent = editor.getText();
        saveName(fileId, textContent);
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none bg-transparent border-none px-6 text-foreground title-editor-content",
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Prevent focus shift when IME composition is active
          if (event.isComposing || event.keyCode === 229) return false;

          if (event.key === "Enter" && !event.shiftKey) {
            const { $head } = view.state.selection;
            // Check if we're at the end of the title
            const isAtEnd = !$head.nodeAfter || $head.nodeAfter.nodeSize === 0;
            if (isAtEnd) {
              event.preventDefault();
              event.stopPropagation();
              onEnterPress?.();
              return true;
            }
          }

          if (event.key === "ArrowDown") {
            const { $head } = view.state.selection;
            // Only move down if we're at the end or on last line
            const isAtEnd = !$head.nodeAfter || $head.nodeAfter.nodeSize === 0;
            if (isAtEnd) {
              event.preventDefault();
              event.stopPropagation();
              // For arrow keys, just focus without inserting paragraph
              onArrowKeyPress?.();
              return true;
            }
          }

          // ArrowRight at end of title should move to content
          if (event.key === "ArrowRight") {
            const { $head } = view.state.selection;
            if (!$head.nodeAfter) {
              event.preventDefault();
              event.stopPropagation();
              // For arrow keys, just focus without inserting paragraph
              onArrowKeyPress?.();
              return true;
            }
          }

          return false;
        },
      },
    },
  });

  // Reset content loaded flag when file changes
  useEffect(() => {
    if (fileId !== currentFileIdRef.current) {
      isContentLoadedRef.current = false;
      currentFileIdRef.current = fileId;
    }
  }, [fileId]);

  // Expose focus method to parent component
  useEffect(() => {
    if (editor && onFocusRequest) {
      const focusTitleEditor = () => {
        if (editor) {
          editor.commands.focus("end");
        }
      };
      onFocusRequest(focusTitleEditor);
    }
  }, [editor, onFocusRequest]);

  // Update content only when switching files (not on every file change)
  useEffect(() => {
    if (isLoading || !editor) return;

    // Only update content when we switch to a different file
    if (fileId !== currentFileIdRef.current || !isContentLoadedRef.current) {
      currentFileIdRef.current = fileId;
      
      // Get fresh file reference inside effect
      const currentFile = fileId ? getNode(fileId) : null;
      if (currentFile) {
        const currentName = currentFile.name || "";
        
        // Set content without triggering updates
        editor.commands.setContent(currentName);
        lastSavedNameRef.current = currentName;
        
        // Mark as loaded after setting content
        isContentLoadedRef.current = true;
        
        // Focus title editor if it's a new page (empty name)
        if (!currentName.trim()) {
          // Use setTimeout to ensure the editor is fully rendered
          setTimeout(() => {
            editor.commands.focus("start");
          }, 50);
        }
      } else {
        isContentLoadedRef.current = true;
      }
    }
  }, [fileId, editor, isLoading, getNode]);

  if (!editor) return null;

  return (
    <div className="w-full title-editor">
      <EditorContent editor={editor} />
    </div>
  );
}

export default TitleEditor;
