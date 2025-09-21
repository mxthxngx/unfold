import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Text from '@tiptap/extension-text';
import { EditorContent, useEditor } from "@tiptap/react";

function Editor() {
    const editor = useEditor({
        extensions:[Heading,Document,Text],
        autofocus:true,
        content: 'Hello World'
    })
    return (
        <div className="w-full h-full">
          <EditorContent editor={editor} />
        </div>
    );
}

export default Editor;