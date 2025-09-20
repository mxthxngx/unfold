import { EditorContent, useEditor } from "@tiptap/react";
import Heading from '@tiptap/extension-heading'
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'

function Editor() {
    const editor = useEditor({
        extensions:[Heading,Document,Text],
        content: "<h1>Hello World</h1>"
    })
    return (
        <div className="w-full h-full bg-[var(--background)]">
          <EditorContent editor={editor} />
        </div>
    );
}

export default Editor;