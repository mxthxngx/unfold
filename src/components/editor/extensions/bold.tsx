import Bold from "@tiptap/extension-bold";
import { editorClasses } from "../styles/extensions";
export const BoldExtension = Bold.configure({
  HTMLAttributes: {
    class: editorClasses.bold,
  },
});
