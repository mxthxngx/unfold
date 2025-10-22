import Text from '@tiptap/extension-text';
import Code from '@tiptap/extension-code';
import { EditorContent, useEditor } from "@tiptap/react";
import { HeadingExtension } from './extensions/heading';
import { BoldExtension } from './extensions/bold';
import { BlockquoteNodeExtension } from './extensions/blockquote';
import { CodeBlockExtension } from './extensions/code-block';
import { TrailingNode } from "@tiptap/extensions";
import { DocumentExtension } from './extensions/document';
import { ParagraphExtension } from './extensions/paragraph';

function Editor() {
    const editor = useEditor({
        extensions:[
          BoldExtension,
          BlockquoteNodeExtension,
          Code,
          CodeBlockExtension,
          DocumentExtension,
          HeadingExtension,
          ParagraphExtension,
          Text,
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
    })
    return (
        <div className="h-screen">
          <EditorContent editor={editor} className='w-full h-full overflow-y-auto outline-none forced-color-adjust-none bg-transparent border-none p-6 pt-7 py-0 text-foreground min-h-full' />
        </div>
    );
}

export default Editor;
