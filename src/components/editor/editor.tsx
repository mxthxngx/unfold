import { EditorContent, useEditor } from "@tiptap/react";
import { HeadingExtension } from './extensions/heading';
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { TrailingNode } from "@tiptap/extensions";
import "./styles/drag-handle.css";
import { starterKit } from './extensions/starterkit';
import CustomKeymap from "./extensions/custom-keymap";
import { DocumentExtension } from "./extensions/document";

function Editor() {
    const editor = useEditor({
        extensions:[
          starterKit,
          HeadingExtension,
          DocumentExtension,
          CustomKeymap,
          TrailingNode.configure({
                 node: "paragraph",
                 notAfter: ["paragraph"],
          }),
        ],
        autofocus:true,
        coreExtensionOptions: {
          clipboardTextSerializer: {
            blockSeparator: "\n",
          },
        },
        editorProps: {
          attributes: {
            class: 'w-full overflow-y-auto outline-none bg-transparent border-none p-6 pt-7 py-0 text-foreground min-h-full',
          },
        },
    })
    
    if (!editor) {
        return null;
    }
    
    return (
        <div className="h-screen relative">
          <DragHandle editor={editor} className="drag-handle">
            <span className="sr-only" aria-hidden="true" />
          </DragHandle>
          <EditorContent editor={editor} />
        </div>
    );
}

export default Editor;
