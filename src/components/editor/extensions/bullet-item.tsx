import { BulletList } from "@tiptap/extension-list";
import { editorClasses } from "../styles/extensions";
export const BulletListExtension = BulletList.configure({
  HTMLAttributes: {
    class: editorClasses.bulletList,
  },
});
