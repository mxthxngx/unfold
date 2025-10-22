import { Blockquote } from "@tiptap/extension-blockquote";
import { editorClasses } from "../styles/extensions";
export const BlockquoteNodeExtension = Blockquote.configure({
  HTMLAttributes: {
    class: editorClasses.blockquote,
  },
});
