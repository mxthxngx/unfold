import { EditorContent, useEditor } from "@tiptap/react";
import { HeadingExtension } from './extensions/heading';
import { TrailingNode } from "@tiptap/extensions";
import "./styles/drag-handle.css";
import "./styles/block-spacing.css";
import { starterKit } from './extensions/starterkit';
import CustomKeymap from "./extensions/custom-keymap";
import { DocumentExtension } from "./extensions/document";
import { DragHandle } from "./extensions/drag-handle";

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
        <div className="relative max-h-screen h-full flex flex-col">
          <DragHandle editor={editor}>
            <span className="sr-only" aria-hidden="true" />
          </DragHandle>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <EditorContent editor={editor} />
          </div>
        </div>
    );
}

export default Editor;
