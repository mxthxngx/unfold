import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import Heading from "@tiptap/extension-heading";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";
import { mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
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
  const { setTitleEditor, focusPageEditor, pageEditorRef } = useEditorContext();
  const { getNode, renameNode } = useFileSystem();
  const file = getNode(fileId);
  const lastSavedRef = useRef<string>(file?.name || "");
  const currentFileIdRef = useRef<string>(fileId);

  const editor = useEditor({
    extensions: [
      TitleDocument,
      TitleHeading,
      Placeholder.configure({
        placeholder: "new page",
        showOnlyWhenEditable: false,
      }),
      Text,
    ],
    content: file?.name || "",
    autofocus: !file?.name ? 'start' : false,
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
            const pageEditor = pageEditorRef.current;
            if (pageEditor) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:69',message:'Enter key pressed in title editor',data:{docSize:pageEditor.state.doc.content.size,firstChildType:pageEditor.state.doc.firstChild?.type.name,firstChildText:pageEditor.state.doc.firstChild?.textContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              const firstNode = pageEditor.state.doc.firstChild;
              const needsLeadingParagraph =
                !firstNode ||
                firstNode.type.name !== "paragraph" ||
                firstNode.textContent.length > 0;

              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:77',message:'Enter key - needsLeadingParagraph check',data:{needsLeadingParagraph,firstNodeExists:!!firstNode,firstNodeType:firstNode?.type.name,firstNodeTextLength:firstNode?.textContent.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion

              if (needsLeadingParagraph) {
                // Insert paragraph and immediately set cursor inside it using a single transaction
                const { state } = pageEditor;
                const { tr } = state;
                const paragraph = state.schema.nodes.paragraph.create();
                tr.insert(0, paragraph);
                // Find the correct position inside the paragraph (after the paragraph start)
                const paragraphStart = 1;
                const $paragraphPos = tr.doc.resolve(paragraphStart);
                // Use TextSelection.near to find a valid text position inside the paragraph
                const selection = TextSelection.near($paragraphPos, 1);
                tr.setSelection(selection);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:87',message:'Enter key - before dispatch (needsLeadingParagraph=true)',data:{cursorPos:selection.$head.pos,docSize:tr.doc.content.size,firstChildType:tr.doc.firstChild?.type.name,$posParentType:selection.$head.parent.type.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                pageEditor.view.dispatch(tr);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:91',message:'Enter key - after dispatch (needsLeadingParagraph=true)',data:{cursorPos:pageEditor.state.selection.$head.pos,docSize:pageEditor.state.doc.content.size,firstChildType:pageEditor.state.doc.firstChild?.type.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                pageEditor.commands.focus();
              } else {
                // If paragraph already exists and is empty, place cursor inside it
                const { state } = pageEditor;
                const paragraphStart = 1;
                const $paragraphPos = state.doc.resolve(paragraphStart);
                // Use TextSelection.near to find a valid text position inside the paragraph
                const selection = TextSelection.near($paragraphPos, 1);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:95',message:'Enter key - before dispatch (needsLeadingParagraph=false)',data:{cursorPos:selection.$head.pos,docSize:state.doc.content.size,firstChildType:state.doc.firstChild?.type.name,$posParentType:selection.$head.parent.type.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                pageEditor.view.dispatch(
                  state.tr.setSelection(selection)
                );
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/452adbbd-389f-46b2-b4bc-a91946c80e3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'title-editor.tsx:100',message:'Enter key - after dispatch (paragraph branch)',data:{cursorPos:pageEditor.state.selection.$head.pos,docSize:pageEditor.state.doc.content.size},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                pageEditor.commands.focus();
              }
            }
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
