import { EditorContent, useEditor } from "@tiptap/react";
import { HeadingExtension } from './extensions/heading';
import { TrailingNode } from "@tiptap/extensions";
import "./styles/drag-handle.css";
import "./styles/block-spacing.css";
import { starterKit } from './extensions/starterkit';
import CustomKeymap from "./extensions/custom-keymap";
import { DocumentExtension } from "./extensions/document";
import { DragHandle } from "./extensions/drag-handle";
import { DragHandleButton } from "./components/drag-handle-button";
import { useParams } from "@tanstack/react-router";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useSettings } from "@/hooks/use-settings";
import { DocumentTitle } from "./extensions/document-title";
import { PasteHandler } from "./extensions/paste-handler";
import { useEffect } from "react";

function Editor() {
    const { fileId } = useParams({ from: '/files/$fileId' });
    const { getNode, updateNodeContent } = useFileSystem();
    const file = fileId ? getNode(fileId) : null;
    const { settings } = useSettings();

    const editor = useEditor({
        extensions:[
          starterKit,
          DocumentTitle,
          HeadingExtension,
          DocumentExtension,
          PasteHandler,
          CustomKeymap.configure({
            selectAllKey: settings.keybindings.selectAll,
          }),
          TrailingNode.configure({
                 node: "paragraph",
                 notAfter: ["paragraph"],
          }),
        ],
        autofocus: false,
        content: file?.content || '',
        onUpdate: ({ editor }) => {
          if (fileId) {
            updateNodeContent(fileId, editor.getHTML());
          }
        },
        coreExtensionOptions: {
          clipboardTextSerializer: {
            blockSeparator: "\n",
          },
        },
        editorProps: {
          attributes: {
            class: 'w-full outline-none border-none p-6 pt-12 pb-24 text-foreground min-h-full',
          },
        },
    });

    // Update editor content when file changes
    useEffect(() => {
      if (editor && file) {
        const currentContent = editor.getHTML();
        const newContent = file.content || '';
        if (currentContent !== newContent) {
          editor.commands.setContent(newContent);
        }

        const isEmpty = !file.content || file.content === '<p></p>' || file.content.trim() === '';
        
        if (isEmpty) {
          editor.commands.focus('start');
        } else {
          editor.commands.blur();
        }
      }
    }, [editor, file?.id]); 
    
    if (!editor) {
        return null;
    }

    return (
        <div className="">
          <DragHandle 
            editor={editor} 
            shouldShow={(_node, pos) => {
              // Don't show for first position
              if (pos <= 0) return false;
              
              const { doc } = editor.state;
              const docText = doc.textContent.trim();
              
              // Don't show if document is empty or only whitespace
              if (!docText || docText.length === 0) return false;
              
              // Don't show if document has only one empty paragraph (default state)
              if (doc.childCount === 1 && doc.firstChild?.textContent === '') return false;
              
              return true;
            }}
          >
            <DragHandleButton />
          </DragHandle>

          <div className="">
            <EditorContent editor={editor} />
          </div>
        </div>
    );
}

export default Editor;
