import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { editorClasses } from "../styles/extensions";
const lowlight = createLowlight(common);

export const CodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: "javascript",
  HTMLAttributes: {
    class: editorClasses.codeBlock,
  },
});
